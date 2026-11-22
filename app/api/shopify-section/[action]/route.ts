import { NextRequest, NextResponse } from 'next/server';
import { generateShopifySection, refineShopifySection } from '@/components/shopify-section/server/shopifyGenerator';
import type { GeneratorImageInput } from '@/components/shopify-section/server/shopifyGenerator';
import { validateLiquidSection } from '@/components/shopify-section/lib/liquidValidator';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const MAX_IMAGES = 6;
const MAX_IMAGE_BASE64_LENGTH = 8 * 1024 * 1024;
const MAX_BODY_BYTES = 25 * 1024 * 1024;
const REQUESTS_PER_MINUTE = 30;
const requestBuckets = new Map<string, number[]>();

function limited(request: NextRequest): NextResponse | null {
  const key = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
  const now = Date.now();
  const current = (requestBuckets.get(key) ?? []).filter((time) => now - time < 60_000);
  if (current.length >= REQUESTS_PER_MINUTE) {
    return NextResponse.json({ error: 'Shopify section request limit reached. Please wait a minute and try again.' }, { status: 429 });
  }
  current.push(now);
  requestBuckets.set(key, current);
  if (requestBuckets.size > 1000) {
    for (const [ip, times] of requestBuckets) if (!times.some((time) => now - time < 60_000)) requestBuckets.delete(ip);
  }
  return null;
}

async function readBody(request: NextRequest): Promise<Record<string, unknown>> {
  if (Number(request.headers.get('content-length') || 0) > MAX_BODY_BYTES) throw Object.assign(new Error('Request is too large. Remove or resize reference images.'), { statusCode: 413 });
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) throw Object.assign(new Error('Request is too large. Remove or resize reference images.'), { statusCode: 413 });
  let value: unknown;
  try { value = JSON.parse(raw); } catch { throw Object.assign(new Error('Request body must be valid JSON.'), { statusCode: 400 }); }
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Object.assign(new Error('Invalid request body.'), { statusCode: 400 });
  return value as Record<string, unknown>;
}

function validateImages(rawImages: unknown): GeneratorImageInput[] {
  if (!Array.isArray(rawImages) || rawImages.length === 0) throw Object.assign(new Error('Please upload at least one reference image.'), { statusCode: 400 });
  if (rawImages.length > MAX_IMAGES) throw Object.assign(new Error(`Maximum ${MAX_IMAGES} reference images allowed per request.`), { statusCode: 400 });
  return rawImages.map((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) throw Object.assign(new Error(`Invalid reference image at position ${index + 1}.`), { statusCode: 400 });
    const candidate = item as Record<string, unknown>;
    const mimeType = String(candidate.mimeType || '');
    const dataBase64 = String(candidate.dataBase64 || '');
    if (!ALLOWED_MIME_TYPES.has(mimeType)) throw Object.assign(new Error(`Unsupported image format. Use PNG, JPG, or WebP.`), { statusCode: 400 });
    if (!dataBase64 || dataBase64.length > MAX_IMAGE_BASE64_LENGTH || !/^[A-Za-z0-9+/=]+$/.test(dataBase64)) throw Object.assign(new Error(`Reference image ${index + 1} is empty or exceeds the 6 MB size limit.`), { statusCode: 400 });
    return {
      name: typeof candidate.name === 'string' ? candidate.name.slice(0, 120) : `reference-${index + 1}`,
      mimeType: mimeType as GeneratorImageInput['mimeType'],
      dataBase64,
      role: typeof candidate.role === 'string' ? candidate.role.slice(0, 60) : undefined,
    };
  });
}

function fail(error: unknown): NextResponse {
  const raw = error instanceof Error ? error.message : 'The Shopify section request failed.';
  const code = error && typeof error === 'object' && 'statusCode' in error ? Number((error as { statusCode?: unknown }).statusCode) : 0;
  if (raw.includes('GEMINI_API_KEY')) return NextResponse.json({ error: 'AI generation is not configured yet. Add GEMINI_API_KEY to the server environment.' }, { status: 503 });
  if (/API_KEY_INVALID|PERMISSION_DENIED/i.test(raw)) return NextResponse.json({ error: 'Gemini API key is invalid or unauthorized. Check the server configuration.' }, { status: 403 });
  if (/RESOURCE_EXHAUSTED|\b429\b/i.test(raw)) return NextResponse.json({ error: 'Gemini API quota or rate limit reached. Please wait and retry.' }, { status: 429 });
  if (code >= 400 && code <= 599) return NextResponse.json({ error: raw }, { status: code });
  if (/empty response|no valid|parse|JSON/i.test(raw)) return NextResponse.json({ error: 'The AI response was incomplete. Please try again.' }, { status: 502 });
  return NextResponse.json({ error: raw }, { status: 502 });
}

export async function GET(_request: NextRequest, { params }: { params: { action: string } }) {
  if (params.action !== 'health') return NextResponse.json({ error: 'Unknown Shopify section action.' }, { status: 404 });
  return NextResponse.json({ status: 'ok', service: 'aivora-shopify-section-builder', geminiConfigured: Boolean(process.env.GEMINI_API_KEY?.trim() && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY') });
}

export async function POST(request: NextRequest, { params }: { params: { action: string } }) {
  const limitedResponse = limited(request);
  if (limitedResponse) return limitedResponse;
  try {
    const body = await readBody(request);
    switch (params.action) {
      case 'generate-section': {
        const images = validateImages(body.images);
        const result = await generateShopifySection({
          images,
          sectionType: typeof body.sectionType === 'string' ? body.sectionType.slice(0, 100) : 'Auto-Detect from Design',
          instructions: typeof body.instructions === 'string' ? body.instructions.slice(0, 4000) : '',
          cssPrefix: (typeof body.cssPrefix === 'string' ? body.cssPrefix : 'aivora').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 30),
        });
        return NextResponse.json({ result, validation: validateLiquidSection(result.liquidCode) });
      }
      case 'refine-section': {
        const currentLiquidCode = typeof body.currentLiquidCode === 'string' ? body.currentLiquidCode.slice(0, 500_000) : '';
        const refinementInstruction = typeof body.refinementInstruction === 'string' ? body.refinementInstruction.trim().slice(0, 3000) : '';
        if (!currentLiquidCode) throw Object.assign(new Error('Missing existing Liquid section code.'), { statusCode: 400 });
        if (!refinementInstruction) throw Object.assign(new Error('Please describe the refinement you want to make.'), { statusCode: 400 });
        const images = Array.isArray(body.images) && body.images.length > 0 ? validateImages(body.images) : undefined;
        const refined = await refineShopifySection({
          currentLiquidCode,
          currentSectionName: typeof body.currentSectionName === 'string' ? body.currentSectionName.slice(0, 120) : 'Custom Section',
          currentSectionSlug: typeof body.currentSectionSlug === 'string' ? body.currentSectionSlug.slice(0, 120) : 'aivora-custom-section',
          refinementInstruction,
          images,
        });
        return NextResponse.json({ ...refined, validation: validateLiquidSection(refined.liquidCode) });
      }
      case 'validate-liquid': {
        const liquidCode = typeof body.liquidCode === 'string' ? body.liquidCode.slice(0, 500_000) : '';
        return NextResponse.json({ validation: validateLiquidSection(liquidCode) });
      }
      default:
        return NextResponse.json({ error: 'Unknown Shopify section action.' }, { status: 404 });
    }
  } catch (error) {
    return fail(error);
  }
}
