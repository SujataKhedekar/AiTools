export interface UploadedReferenceImage {
  id: string;
  name: string;
  mimeType: 'image/png' | 'image/jpeg' | 'image/webp';
  dataBase64: string;
  previewUrl: string;
  role: 'Primary Desktop' | 'Mobile Reference' | 'Interaction State' | 'Detail Reference';
  sizeBytes: number;
}

export const SECTION_TYPES = [
  'Auto-Detect from Design',
  'Hero Banner',
  'Image with Text',
  'Featured Collection',
  'Featured Product',
  'Product Grid',
  'Collection Grid',
  'Testimonials',
  'FAQ Accordion',
  'Logo Slider',
  'Image Gallery',
  'Promotional Banner',
  'Multicolumn Section',
  'Icon with Text',
  'Rich Text Section',
  'Video Banner',
  'Pricing Section',
  'Custom Ecommerce Layout',
] as const;

export type SectionTypeOption = (typeof SECTION_TYPES)[number];

export interface DesignElementRelation {
  name: string;
  role: string;
  relationship: string;
}

export interface DesignAnalysis {
  layoutSummary: string;
  observed: {
    layoutStructure: string;
    containerWidth: string;
    backgroundColors: string[];
    textColors: string[];
    typography: string;
    spacingAndGrid: string;
    mediaAndButtons: string;
    elements: DesignElementRelation[];
  };
  inferred: {
    responsiveBehavior: string;
    shopifyMapping: string;
    schemaStrategy: string;
    accessibilityDecisions: string;
  };
}

export interface ShopifySettingOption {
  value: string;
  label: string;
}

export interface ShopifySettingSchema {
  type: string;
  id?: string;
  label?: string;
  content?: string;
  default?: string | number | boolean;
  info?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  options?: ShopifySettingOption[];
}

export interface ShopifyBlockSchema {
  type: string;
  name: string;
  limit?: number;
  settings: ShopifySettingSchema[];
}

export interface ShopifyPresetBlock {
  type: string;
  settings?: Record<string, string | number | boolean>;
}

export interface ShopifyPresetSchema {
  name: string;
  blocks?: ShopifyPresetBlock[];
  settings?: Record<string, string | number | boolean>;
}

export interface ShopifySectionSchema {
  name: string;
  tag?: string;
  class?: string;
  limit?: number;
  disabled_on?: {
    groups?: string[];
    templates?: string[];
  };
  settings: ShopifySettingSchema[];
  blocks?: ShopifyBlockSchema[];
  presets?: ShopifyPresetSchema[];
  [key: string]: unknown;
}

export interface ValidationCheckItem {
  id: string;
  label: string;
  passed: boolean;
  severity: 'error' | 'warning' | 'info';
  detail: string;
}

export interface LiquidValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  checks: ValidationCheckItem[];
  parsedSchema: ShopifySectionSchema | null;
}

export interface GeneratedSectionResult {
  sectionSlug: string;
  sectionName: string;
  detectedSectionType: string;
  designAnalysis: DesignAnalysis;
  liquidCode: string;
  merchantNotes: string[];
}

export interface SavedSectionEntry {
  id: string;
  createdAt: string;
  result: GeneratedSectionResult;
  validation: LiquidValidationResult;
  thumbnailUrl?: string;
}
