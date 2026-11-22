import type { CategoryId, MarketplaceId, WritingStyle } from './catalogTaxonomy';

export type InputMode = 'manual' | 'image' | 'url';

export interface UploadedProductImage {
  id: string;
  name: string;
  mimeType: string;
  dataUrl: string;
  source: 'upload' | 'preset';
}

export interface ProductInput {
  productName: string;
  categoryId: CategoryId | 'auto';
  subcategory: string;
  brandName: string;
  sku: string;
  materialOrFabric: string;
  color: string;
  sizeOrDimensions: string;
  targetAudience: string;
  features: string;
  benefits: string;
  price: string;
  countryAndMarket: string;
  targetKeywords: string;
  competitorUrl: string;
  rawNotes: string;
  careLabelProvided: string;
  nutritionalOrIngredientInfo: string;
  writingStyle: WritingStyle;
  marketplace: MarketplaceId;
  generateVariations: boolean;
}

export interface ImageAnalysisResult {
  detectedProductType: string;
  suggestedCategoryId: CategoryId;
  suggestedSubcategory: string;
  visibleColors: string[];
  shapeAndSilhouette: string;
  designAndPattern: string;
  visibleMaterialAppearance: string;
  styleImpression: string;
  distinguishingFeatures: string[];
  verificationBoundaryNote: string;
  unverifiedAttributesNotice: string[];
}

export interface UrlAnalysisResult {
  sourceUrl: string;
  extractedTitle: string;
  extractedBrand: string;
  extractedPrice: string;
  extractedDescription: string;
  extractedSpecs: Array<{ key: string; value: string }>;
  suggestedCategoryId: CategoryId;
  suggestedSubcategory: string;
  missingDetails: string[];
  extractionNote: string;
}

export interface CategoryDetectionResult {
  categoryId: CategoryId;
  categoryLabel: string;
  subcategory: string;
  confidenceNote: string;
  reasoning: string;
}

export interface AttributeEntry {
  key: string;
  value: string;
  verified: boolean;
  source: 'user_supplied' | 'visual_observation' | 'missing';
}

export interface WashCareDetails {
  applicable: boolean;
  verificationStatus: 'verified_care_label' | 'general_material_guidance' | 'not_applicable';
  disclaimer: string;
  washMethod: string;
  waterTemperature: string;
  washWithSimilarColors: string;
  detergentGuidance: string;
  bleachGuidance: string;
  tumbleDry: string;
  lineDry: string;
  ironingTemperature: string;
  dryClean: string;
  storageRecommendations: string;
  categoryMaintenanceInstructions: string[];
}

export interface SizeGuideTable {
  unitNote: string;
  dataNotice: string;
  columns: string[];
  rows: Array<Record<string, string>>;
}

export interface SeoMetadata {
  seoTitle: string;
  metaTitle: string;
  metaDescription: string;
  urlSlug: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  semanticKeywords: string[];
  imageAltTexts: string[];
  seoDescription: string;
  faqs: Array<{ question: string; answer: string }>;
}

export interface MarketplaceListing {
  marketplaceId: MarketplaceId;
  marketplaceLabel: string;
  policyNotice: string;
  title: string;
  shortDescription: string;
  longDescription: string;
  bulletPoints: string[];
  searchKeywords: string[];
  categoryPath: string;
  formattedAttributes: Array<{ name: string; value: string }>;
  careSummary: string;
}

export interface DescriptionVariation {
  style: string;
  shortDescription: string;
  longDescription: string;
}

export interface GeneratedCatalogListing {
  id: string;
  generatedAt: string;
  sku: string;
  brandName: string;
  productName: string;
  price: string;
  categoryId: CategoryId;
  categoryLabel: string;
  subcategory: string;
  writingStyle: WritingStyle;
  shortDescription: string;
  longDescription: string;
  bulletHighlights: string[];
  productHighlights: string[];
  productBenefits: string[];
  usageInstructions: string[];
  careAndMaintenanceSummary: string;
  categoryAttributes: AttributeEntry[];
  washCare: WashCareDetails;
  sizeGuide: SizeGuideTable;
  seo: SeoMetadata;
  marketplaceListing: MarketplaceListing;
  variations: DescriptionVariation[];
  missingInformation: string[];
  verificationNotes: string[];
}

export interface TokenUsageSummary {
  promptTokens: number;
  outputTokens: number;
  totalTokens: number;
  requestsCount: number;
}

export interface PendingSuggestion {
  section: string;
  label: string;
  proposedValue: unknown;
}

export interface BulkProductRow {
  rowIndex: number;
  sku: string;
  productName: string;
  rawInput: Partial<ProductInput>;
  status: 'pending' | 'processing' | 'completed' | 'error';
  errorMessage?: string;
  listing?: GeneratedCatalogListing;
  missingInformation: string[];
}

export interface CatalogDraft {
  draftId: string;
  updatedAt: string;
  input: ProductInput;
  images: UploadedProductImage[];
  listing: GeneratedCatalogListing;
}
