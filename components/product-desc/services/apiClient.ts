import type {
  BulkProductRow,
  CategoryDetectionResult,
  GeneratedCatalogListing,
  ImageAnalysisResult,
  ProductInput,
  TokenUsageSummary,
  UrlAnalysisResult,
} from '../shared/types';

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
  }
  return data as T;
}

export async function fetchHealthAndUsage(): Promise<{
  health: { status: string; geminiConfigured: boolean };
  usage: TokenUsageSummary;
}> {
  const [healthRes, usageRes] = await Promise.all([
    fetch('/api/product-description/health'),
    fetch('/api/product-description/usage'),
  ]);
  const health = await healthRes.json();
  const usage = await usageRes.json();
  return { health, usage };
}

export async function detectCategory(
  input: Partial<ProductInput>
): Promise<{ result: CategoryDetectionResult; usage: TokenUsageSummary }> {
  return postJson('/api/product-description/detect-category', input);
}

export async function analyzeProductImages(
  images: Array<{ mimeType: string; base64Data: string }>,
  notes?: string
): Promise<{ analysis: ImageAnalysisResult; usage: TokenUsageSummary }> {
  return postJson('/api/product-description/analyze-image', { images, notes });
}

export async function analyzeProductUrl(
  url: string
): Promise<{ result: UrlAnalysisResult; usage: TokenUsageSummary }> {
  return postJson('/api/product-description/analyze-url', { url });
}

export async function generateCatalogListing(params: {
  input: ProductInput;
  imageAnalysis?: ImageAnalysisResult | null;
  imageDataUrls?: string[];
}): Promise<{ listing: GeneratedCatalogListing; usage: TokenUsageSummary }> {
  return postJson('/api/product-description/generate-listing', params);
}

export async function regenerateListingSection(params: {
  section:
    | 'shortDescription'
    | 'longDescription'
    | 'bulletHighlights'
    | 'washCare'
    | 'seo'
    | 'marketplaceListing';
  input: ProductInput;
  currentListing: GeneratedCatalogListing;
  instruction?: string;
}): Promise<{
  section: string;
  proposedValue: unknown;
  usage: TokenUsageSummary;
}> {
  return postJson('/api/product-description/regenerate-section', params);
}

export async function generateBulkBatch(params: {
  rows: Array<{
    rowIndex: number;
    sku: string;
    productName: string;
    rawInput: Partial<ProductInput>;
  }>;
  defaultWritingStyle: string;
  defaultMarketplace: string;
}): Promise<{ results: BulkProductRow[]; usage: TokenUsageSummary }> {
  return postJson('/api/product-description/bulk-generate', params);
}
