import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { z } from 'zod';
import { generateFullListingInternal, detectCategoryInternal, normalizeCategoryId, ProductInputSchema, ImageItemSchema } from '@/components/product-desc/server/catalogEngine';
import { getTokenUsageSummary, generateWithRetry } from '@/components/product-desc/server/geminiClient';
import { buildTaxonomyPromptSummary, IMAGE_ANALYSIS_SCHEMA, URL_NORMALIZATION_SCHEMA } from '@/components/product-desc/server/prompts';
import { validateSafePublicUrl } from '@/components/product-desc/server/security';
import type { BulkProductRow, ImageAnalysisResult, ProductInput, UrlAnalysisResult } from '@/components/product-desc/shared/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const requestTimes = new Map<string, number[]>();
const MAX_BODY = 15 * 1024 * 1024;

function rateLimit(request: NextRequest): NextResponse | null {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
  const now = Date.now();
  const current = (requestTimes.get(ip) ?? []).filter((time) => now - time < 60_000);
  if (current.length >= 45) return NextResponse.json({ error: 'Catalog request limit reached. Wait a minute and try again.' }, { status: 429 });
  current.push(now);
  requestTimes.set(ip, current);
  return null;
}

async function readBody(request: NextRequest): Promise<unknown> {
  if (Number(request.headers.get('content-length') || 0) > MAX_BODY) throw new Error('Request body is too large. Reduce image uploads and try again.');
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_BODY) throw new Error('Request body is too large. Reduce image uploads and try again.');
  try { return JSON.parse(text); } catch { throw new Error('Request body must be valid JSON.'); }
}

function parseObject(value: unknown, message = 'Invalid request data.') {
  const result = z.record(z.string(), z.unknown()).safeParse(value);
  if (!result.success) throw new Error(message);
  return result.data;
}

function parseAiError(error: unknown): NextResponse {
  const raw = error instanceof Error ? error.message : 'The request could not be completed.';
  if (raw.includes('GEMINI_API_KEY')) return NextResponse.json({ error: 'AI generation is not configured yet. Add GEMINI_API_KEY to the server environment.' }, { status: 503 });
  if (/API_KEY_INVALID|PERMISSION_DENIED/i.test(raw)) return NextResponse.json({ error: 'Gemini API key is invalid or unauthorized. Check the server configuration.' }, { status: 403 });
  if (/RESOURCE_EXHAUSTED|\b429\b|quota/i.test(raw)) return NextResponse.json({ error: 'Gemini API rate or quota limit reached. Please wait and retry.' }, { status: 429 });
  if (/NOT_FOUND|\b404\b/.test(raw)) return NextResponse.json({ error: 'The configured Gemini model was not found.' }, { status: 502 });
  if (/private|loopback|internal|restricted network|http:\/\/ and https|valid product URL|invalid URL/i.test(raw)) return NextResponse.json({ error: raw }, { status: 400 });
  if (/too (large|big)|invalid|must include|please supply|please enter|must contain/i.test(raw)) return NextResponse.json({ error: raw }, { status: 400 });
  return NextResponse.json({ error: raw }, { status: 502 });
}

async function analyzeProductUrl(rawUrl: string): Promise<UrlAnalysisResult> {
  const safeUrl = await validateSafePublicUrl(rawUrl);
  const response = await fetch(safeUrl.toString(), {
    method: 'GET', redirect: 'manual', signal: AbortSignal.timeout(8000),
    headers: { 'User-Agent': 'AivoraCatalogBot/1.0 (+public-product-metadata)', Accept: 'text/html,application/xhtml+xml' },
  });
  if (response.status >= 300 && response.status < 400) throw new Error('The product URL redirected. Paste the final product page URL directly.');
  if (!response.ok) throw new Error(`Target site responded with HTTP ${response.status}. Some storefronts block automated fetches; enter the product notes manually instead.`);
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) throw new Error('Target URL did not return an HTML product page.');
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Could not read the product page response.');
  const decoder = new TextDecoder();
  let html = '';
  try {
    while (html.length < 500_000) {
      const { done, value } = await reader.read();
      if (done) break;
      html += decoder.decode(value, { stream: true });
    }
    html += decoder.decode();
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
  html = html.slice(0, 500_000);
  const $ = cheerio.load(html);
  $('script:not([type="application/ld+json"]), style, noscript, svg').remove();
  const jsonLd: string[] = [];
  $('script[type="application/ld+json"]').each((_i, el) => { const value = $(el).text().trim(); if (value) jsonLd.push(value.slice(0, 4000)); });
  const title = $('title').text().trim();
  const ogTitle = $('meta[property="og:title"]').attr('content') || '';
  const description = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '';
  const bodyText = $('main, article, [role="main"], body').first().text().replace(/\s+/g, ' ').trim().slice(0, 6000);
  const result = await generateWithRetry({
    contents: `Extract ONLY factual, publicly present product details from this HTML snippet. Do NOT invent missing specifications.\n\nPRODUCT CATEGORIES:\n${buildTaxonomyPromptSummary()}\n\nURL: ${safeUrl.toString()}\nTITLE: ${title}\nOG_TITLE: ${ogTitle}\nMETA_DESCRIPTION: ${description}\nJSON_LD:\n${jsonLd.join('\n').slice(0, 5000)}\nBODY_TEXT:\n${bodyText}`,
    config: { responseMimeType: 'application/json', responseSchema: URL_NORMALIZATION_SCHEMA, systemInstruction: 'Extract only explicitly stated product facts from supplied page data. Put absent details in missingDetails instead of guessing.' },
  });
  const normalized = JSON.parse(result.text || '{}') as Omit<UrlAnalysisResult, 'sourceUrl'>;
  return { sourceUrl: safeUrl.toString(), ...normalized, suggestedCategoryId: normalizeCategoryId(normalized.suggestedCategoryId) };
}

export async function GET(_request: NextRequest, { params }: { params: { action: string } }) {
  if (params.action === 'health') return NextResponse.json({ status: 'ok', service: 'aivora-product-description', geminiConfigured: Boolean(process.env.GEMINI_API_KEY?.trim() && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY') });
  if (params.action === 'usage') return NextResponse.json(getTokenUsageSummary());
  return NextResponse.json({ error: 'Unknown product description action.' }, { status: 404 });
}

export async function POST(request: NextRequest, { params }: { params: { action: string } }) {
  const limited = rateLimit(request);
  if (limited) return limited;
  try {
    const body = await readBody(request);
    let response: Record<string, unknown>;
    switch (params.action) {
      case 'detect-category': {
        const input = ProductInputSchema.partial().parse(body);
        response = { result: await detectCategoryInternal(input as Partial<ProductInput>), usage: getTokenUsageSummary() };
        break;
      }
      case 'analyze-image': {
        const parsed = z.object({ images: z.array(ImageItemSchema).min(1).max(5), notes: z.string().max(2000).optional() }).safeParse(body);
        if (!parsed.success) throw new Error('Please supply 1 to 5 valid product images (JPEG, PNG, WebP, or GIF).');
        const parts = parsed.data.images.map((image) => ({ inlineData: { mimeType: image.mimeType, data: image.base64Data } }));
        const result = await generateWithRetry({
          contents: { parts: [...parts, { text: `Analyze only visible product details. Flag specifications that cannot be determined from images. Additional seller notes: ${parsed.data.notes || 'none'}` }] },
          config: { responseMimeType: 'application/json', responseSchema: IMAGE_ANALYSIS_SCHEMA, systemInstruction: 'You are a careful multimodal catalog analyst. Report only observable visual traits and clearly flag unverified attributes.' },
        });
        const analysis = JSON.parse(result.text || '{}') as ImageAnalysisResult;
        analysis.suggestedCategoryId = normalizeCategoryId(analysis.suggestedCategoryId);
        response = { analysis, usage: getTokenUsageSummary() };
        break;
      }
      case 'analyze-url': {
        const parsed = z.object({ url: z.string().trim().min(8).max(500) }).safeParse(body);
        if (!parsed.success) throw new Error('Please enter a valid product URL.');
        response = { result: await analyzeProductUrl(parsed.data.url), usage: getTokenUsageSummary() };
        break;
      }
      case 'generate-listing': {
        const input = parseObject(body);
        const parsed = z.object({ input: ProductInputSchema, imageAnalysis: z.unknown().nullable().optional(), imageDataUrls: z.array(z.string().max(10_000_000)).max(3).optional() }).safeParse(input);
        if (!parsed.success) throw new Error('Invalid listing request data.');
        const productInput = parsed.data.input as ProductInput;
        if (!productInput.productName.trim() && !productInput.rawNotes.trim() && !parsed.data.imageAnalysis) throw new Error('Enter a product name, product notes, or analyze a product image first.');
        const listing = await generateFullListingInternal(productInput, parsed.data.imageAnalysis as ImageAnalysisResult | null | undefined, parsed.data.imageDataUrls ?? []);
        response = { listing, usage: getTokenUsageSummary() };
        break;
      }
      case 'regenerate-section': {
        const input = parseObject(body);
        const parsed = z.object({ section: z.enum(['shortDescription', 'longDescription', 'bulletHighlights', 'washCare', 'seo', 'marketplaceListing']), input: ProductInputSchema, currentListing: z.unknown(), instruction: z.string().max(600).optional() }).safeParse(input);
        if (!parsed.success) throw new Error('Invalid section regeneration request.');
        const listing = parsed.data.currentListing as Record<string, unknown>;
        const section = parsed.data.section;
        const result = await generateWithRetry({
          contents: `Regenerate only the "${section}" section of this ecommerce listing, faithfully using only the verified product facts. Do not invent specifications, fabric percentages, ingredients, or claims. ${parsed.data.instruction ? `Additional instruction: ${parsed.data.instruction}` : ''}\n\nPRODUCT INPUT:\n${JSON.stringify(parsed.data.input)}\n\nCURRENT LISTING CONTEXT:\nProduct: ${listing.productName} (${listing.categoryLabel} / ${listing.subcategory})\nExisting attributes: ${JSON.stringify(listing.categoryAttributes ?? [])}\n\nReturn JSON with only the top-level key "${section}".`,
          config: { responseMimeType: 'application/json', systemInstruction: 'Return valid JSON containing only the requested section, with no markdown.' },
        });
        response = { section, proposedValue: (JSON.parse(result.text || '{}') as Record<string, unknown>)[section], usage: getTokenUsageSummary() };
        break;
      }
      case 'bulk-generate': {
        const parsed = z.object({ rows: z.array(z.object({ rowIndex: z.number().int().min(0), sku: z.string().max(80), productName: z.string().max(300), rawInput: ProductInputSchema.partial() })).min(1).max(10), defaultWritingStyle: z.string().max(80).default('Modern ecommerce'), defaultMarketplace: z.string().max(60).default('shopify') }).safeParse(body);
        if (!parsed.success) throw new Error('Bulk batch must contain 1 to 10 valid product rows.');
        const results = await Promise.all(parsed.data.rows.map(async (row): Promise<BulkProductRow> => {
          const raw = row.rawInput;
          const merged: ProductInput = {
            productName: row.productName || raw.productName || '', categoryId: (raw.categoryId || 'auto') as ProductInput['categoryId'], subcategory: raw.subcategory || '', brandName: raw.brandName || '', sku: row.sku || raw.sku || `SKU-${row.rowIndex + 1}`,
            materialOrFabric: raw.materialOrFabric || '', color: raw.color || '', sizeOrDimensions: raw.sizeOrDimensions || '', targetAudience: raw.targetAudience || '', features: raw.features || '', benefits: raw.benefits || '', price: raw.price || '', countryAndMarket: raw.countryAndMarket || '', targetKeywords: raw.targetKeywords || '', competitorUrl: raw.competitorUrl || '', rawNotes: raw.rawNotes || '', careLabelProvided: raw.careLabelProvided || '', nutritionalOrIngredientInfo: raw.nutritionalOrIngredientInfo || '', writingStyle: (raw.writingStyle || parsed.data.defaultWritingStyle) as ProductInput['writingStyle'], marketplace: (raw.marketplace || parsed.data.defaultMarketplace) as ProductInput['marketplace'], generateVariations: false,
          };
          try { const listing = await generateFullListingInternal(merged); return { rowIndex: row.rowIndex, sku: merged.sku, productName: merged.productName, rawInput: merged, status: 'completed', listing, missingInformation: listing.missingInformation }; }
          catch (error) { return { rowIndex: row.rowIndex, sku: merged.sku, productName: merged.productName, rawInput: merged, status: 'error', errorMessage: error instanceof Error ? error.message : 'Generation failed for this row.', missingInformation: [] }; }
        }));
        response = { results: results.sort((a, b) => a.rowIndex - b.rowIndex), usage: getTokenUsageSummary() };
        break;
      }
      default:
        return NextResponse.json({ error: 'Unknown product description action.' }, { status: 404 });
    }
    return NextResponse.json(response);
  } catch (error) {
    return parseAiError(error);
  }
}
