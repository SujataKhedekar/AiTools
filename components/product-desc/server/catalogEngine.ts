import crypto from 'node:crypto';
import { ThinkingLevel } from '@google/genai';
import { z } from 'zod';
import { generateWithRetry } from './geminiClient';
import {
  buildListingGenerationPrompt,
  buildTaxonomyPromptSummary,
  CATEGORY_DETECTION_SCHEMA,
  FULL_LISTING_SCHEMA,
} from './prompts';
import { getCategoryById, PRODUCT_CATEGORIES } from '../shared/catalogTaxonomy';
import type { CategoryDetectionResult, GeneratedCatalogListing, ImageAnalysisResult, ProductInput } from '../shared/types';

export const ProductInputSchema = z.object({
  productName: z.string().max(300).default(''),
  categoryId: z.string().max(80).default('auto'),
  subcategory: z.string().max(120).default(''),
  brandName: z.string().max(120).default(''),
  sku: z.string().max(80).default(''),
  materialOrFabric: z.string().max(400).default(''),
  color: z.string().max(120).default(''),
  sizeOrDimensions: z.string().max(400).default(''),
  targetAudience: z.string().max(240).default(''),
  features: z.string().max(2000).default(''),
  benefits: z.string().max(2000).default(''),
  price: z.string().max(60).default(''),
  countryAndMarket: z.string().max(160).default(''),
  targetKeywords: z.string().max(600).default(''),
  competitorUrl: z.string().max(500).default(''),
  rawNotes: z.string().max(4000).default(''),
  careLabelProvided: z.string().max(1000).default(''),
  nutritionalOrIngredientInfo: z.string().max(2500).default(''),
  writingStyle: z.string().max(80).default('Modern ecommerce'),
  marketplace: z.string().max(60).default('shopify'),
  generateVariations: z.boolean().default(true),
});

export const ImageItemSchema = z.object({
  mimeType: z.string().regex(/^image\/(jpeg|jpg|png|webp|gif)$/i),
  base64Data: z.string().min(10).max(8_000_000),
});

function extractBase64Parts(dataUrl: string): { mimeType: string; data: string } | null {
  const match = dataUrl.match(/^data:(image\/(?:jpeg|jpg|png|webp|gif));base64,([A-Za-z0-9+/=]+)$/i);
  if (!match) return null;
  return { mimeType: match[1], data: match[2] };
}

export function normalizeCategoryId(rawId: string) {
  const found = PRODUCT_CATEGORIES.find((c) => c.id === rawId);
  return found ? found.id : 'fashion_apparel';
}

function parseJsonSafe<T>(rawText: string | undefined, fallback: T): T {
  if (!rawText) return fallback;
  try {
    return JSON.parse(rawText.trim()) as T;
  } catch {
    const cleaned = rawText
      .trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```$/i, '');
    return JSON.parse(cleaned) as T;
  }
}

export async function detectCategoryInternal(input: Partial<ProductInput>): Promise<CategoryDetectionResult> {
  const summary = [
    input.productName && `Product Name: ${input.productName}`,
    input.brandName && `Brand: ${input.brandName}`,
    input.subcategory && `Subcategory hint: ${input.subcategory}`,
    input.materialOrFabric && `Material: ${input.materialOrFabric}`,
    input.features && `Features: ${input.features}`,
    input.rawNotes && `Notes: ${input.rawNotes}`,
    input.nutritionalOrIngredientInfo && `Ingredients/Specs: ${input.nutritionalOrIngredientInfo}`,
  ]
    .filter(Boolean)
    .join('\n');

  const response = await generateWithRetry({
    contents: `Classify this ecommerce product into the exact taxonomy below.\n\nTAXONOMY:\n${buildTaxonomyPromptSummary()}\n\nPRODUCT DATA:\n${summary || 'No text details provided.'}`,
    config: {
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      responseMimeType: 'application/json',
      responseSchema: CATEGORY_DETECTION_SCHEMA,
      systemInstruction:
        'Return only valid JSON matching the schema. Always pick an exact categoryId from the taxonomy.',
    },
  });

  const parsed = parseJsonSafe<CategoryDetectionResult>(response.text, {
    categoryId: 'fashion_apparel',
    categoryLabel: 'Fashion and Apparel',
    subcategory: "Women's clothing",
    confidenceNote: 'Defaulted due to sparse input.',
    reasoning: 'Insufficient product attributes supplied.',
  });

  const validId = normalizeCategoryId(parsed.categoryId);
  const cat = getCategoryById(validId);
  return {
    categoryId: validId,
    categoryLabel: cat.label,
    subcategory: parsed.subcategory || cat.subcategories[0],
    confidenceNote: parsed.confidenceNote || 'Detected from product details.',
    reasoning: parsed.reasoning || '',
  };
}

export async function generateFullListingInternal(
  input: ProductInput,
  imageAnalysis?: ImageAnalysisResult | null,
  imageDataUrls: string[] = []
): Promise<GeneratedCatalogListing> {
  let resolvedCategoryId = input.categoryId;
  let resolvedSubcategory = input.subcategory;

  if (resolvedCategoryId === 'auto') {
    if (imageAnalysis?.suggestedCategoryId) {
      resolvedCategoryId = normalizeCategoryId(imageAnalysis.suggestedCategoryId);
      if (!resolvedSubcategory) {
        resolvedSubcategory = imageAnalysis.suggestedSubcategory;
      }
    } else {
      const detected = await detectCategoryInternal(input);
      resolvedCategoryId = detected.categoryId;
      if (!resolvedSubcategory) {
        resolvedSubcategory = detected.subcategory;
      }
    }
  } else {
    resolvedCategoryId = normalizeCategoryId(resolvedCategoryId);
  }

  const category = getCategoryById(resolvedCategoryId);
  const prompt = buildListingGenerationPrompt(
    { ...input, subcategory: resolvedSubcategory || category.subcategories[0] },
    category.id,
    imageAnalysis
  );

  const imageParts = imageDataUrls
    .slice(0, 3)
    .map(extractBase64Parts)
    .filter((p): p is { mimeType: string; data: string } => p !== null)
    .map((p) => ({
      inlineData: {
        mimeType: p.mimeType,
        data: p.data,
      },
    }));

  const contents =
    imageParts.length > 0 ? { parts: [...imageParts, { text: prompt }] } : prompt;

  const response = await generateWithRetry({
    contents,
    config: {
      thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
      responseMimeType: 'application/json',
      responseSchema: FULL_LISTING_SCHEMA,
      systemInstruction:
        'You are Aivora, a strict, non-fabricating ecommerce catalog architect. Return valid JSON matching the exact schema. Never invent unverified fabric compositions, measurements, clinical claims, nutritional numbers, allergens, or certifications.',
    },
  });

  const raw = parseJsonSafe<{
    categoryId: string;
    categoryLabel: string;
    subcategory: string;
    shortDescription: string;
    longDescription: string;
    bulletHighlights: string[];
    productHighlights: string[];
    productBenefits: string[];
    usageInstructions: string[];
    careAndMaintenanceSummary: string;
    categoryAttributes: GeneratedCatalogListing['categoryAttributes'];
    washCare: GeneratedCatalogListing['washCare'];
    sizeGuide: {
      unitNote: string;
      dataNotice: string;
      columns: string[];
      rowsJson: string[];
    };
    seo: GeneratedCatalogListing['seo'];
    marketplaceListing: GeneratedCatalogListing['marketplaceListing'];
    variations: GeneratedCatalogListing['variations'];
    missingInformation: string[];
    verificationNotes: string[];
  }>(response.text, null as never);

  const parsedRows: Array<Record<string, string>> = (raw.sizeGuide?.rowsJson ?? []).map((rowStr) => {
    try {
      const obj = JSON.parse(rowStr);
      if (obj && typeof obj === 'object') return obj as Record<string, string>;
    } catch {
      // Fallback row if string wasn't valid JSON
    }
    return {};
  });

  return {
    id: crypto.randomUUID(),
    generatedAt: new Date().toISOString(),
    sku: input.sku || 'UNASSIGNED-SKU',
    brandName: input.brandName || 'Unbranded / Not Specified',
    productName: input.productName || 'Untitled Product',
    price: input.price || '',
    categoryId: category.id,
    categoryLabel: category.label,
    subcategory: raw.subcategory || resolvedSubcategory || category.subcategories[0],
    writingStyle: input.writingStyle,
    shortDescription: raw.shortDescription,
    longDescription: raw.longDescription,
    bulletHighlights: raw.bulletHighlights ?? [],
    productHighlights: raw.productHighlights ?? [],
    productBenefits: raw.productBenefits ?? [],
    usageInstructions: raw.usageInstructions ?? [],
    careAndMaintenanceSummary: raw.careAndMaintenanceSummary ?? '',
    categoryAttributes: raw.categoryAttributes ?? [],
    washCare: raw.washCare,
    sizeGuide: {
      unitNote: raw.sizeGuide?.unitNote || 'Verify measurement units with supplier.',
      dataNotice:
        raw.sizeGuide?.dataNotice ||
        'Only seller-supplied measurements are populated; unverified cells remain blank.',
      columns: raw.sizeGuide?.columns?.length ? raw.sizeGuide.columns : [...category.sizeGuideColumns],
      rows:
        parsedRows.length > 0
          ? parsedRows
          : category.defaultSizeRows.map((rowLabel) => {
              const row: Record<string, string> = {};
              category.sizeGuideColumns.forEach((col, idx) => {
                row[col] = idx === 0 ? rowLabel : '— (not supplied)';
              });
              return row;
            }),
    },
    seo: raw.seo,
    marketplaceListing: raw.marketplaceListing,
    variations: raw.variations ?? [],
    missingInformation: raw.missingInformation ?? [],
    verificationNotes: raw.verificationNotes ?? [],
  };
}

