import { Type, type Schema } from '@google/genai';
import {
  getCategoryById,
  MARKETPLACES,
  PRODUCT_CATEGORIES,
  WRITING_STYLES,
} from '../shared/catalogTaxonomy';
import type { ImageAnalysisResult, ProductInput } from '../shared/types';

export const CATEGORY_DETECTION_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    categoryId: {
      type: Type.STRING,
      description: 'One of the exact category IDs from the provided taxonomy.',
    },
    categoryLabel: { type: Type.STRING },
    subcategory: { type: Type.STRING },
    confidenceNote: { type: Type.STRING },
    reasoning: { type: Type.STRING },
  },
  required: ['categoryId', 'categoryLabel', 'subcategory', 'confidenceNote', 'reasoning'],
};

export const IMAGE_ANALYSIS_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    detectedProductType: { type: Type.STRING },
    suggestedCategoryId: { type: Type.STRING },
    suggestedSubcategory: { type: Type.STRING },
    visibleColors: { type: Type.ARRAY, items: { type: Type.STRING } },
    shapeAndSilhouette: { type: Type.STRING },
    designAndPattern: { type: Type.STRING },
    visibleMaterialAppearance: { type: Type.STRING },
    styleImpression: { type: Type.STRING },
    distinguishingFeatures: { type: Type.ARRAY, items: { type: Type.STRING } },
    verificationBoundaryNote: { type: Type.STRING },
    unverifiedAttributesNotice: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: [
    'detectedProductType',
    'suggestedCategoryId',
    'suggestedSubcategory',
    'visibleColors',
    'shapeAndSilhouette',
    'designAndPattern',
    'visibleMaterialAppearance',
    'styleImpression',
    'distinguishingFeatures',
    'verificationBoundaryNote',
    'unverifiedAttributesNotice',
  ],
};

export const URL_NORMALIZATION_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    extractedTitle: { type: Type.STRING },
    extractedBrand: { type: Type.STRING },
    extractedPrice: { type: Type.STRING },
    extractedDescription: { type: Type.STRING },
    extractedSpecs: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          key: { type: Type.STRING },
          value: { type: Type.STRING },
        },
        required: ['key', 'value'],
      },
    },
    suggestedCategoryId: { type: Type.STRING },
    suggestedSubcategory: { type: Type.STRING },
    missingDetails: { type: Type.ARRAY, items: { type: Type.STRING } },
    extractionNote: { type: Type.STRING },
  },
  required: [
    'extractedTitle',
    'extractedBrand',
    'extractedPrice',
    'extractedDescription',
    'extractedSpecs',
    'suggestedCategoryId',
    'suggestedSubcategory',
    'missingDetails',
    'extractionNote',
  ],
};

export const FULL_LISTING_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    categoryId: { type: Type.STRING },
    categoryLabel: { type: Type.STRING },
    subcategory: { type: Type.STRING },
    shortDescription: { type: Type.STRING },
    longDescription: { type: Type.STRING },
    bulletHighlights: { type: Type.ARRAY, items: { type: Type.STRING } },
    productHighlights: { type: Type.ARRAY, items: { type: Type.STRING } },
    productBenefits: { type: Type.ARRAY, items: { type: Type.STRING } },
    usageInstructions: { type: Type.ARRAY, items: { type: Type.STRING } },
    careAndMaintenanceSummary: { type: Type.STRING },
    categoryAttributes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          key: { type: Type.STRING },
          value: { type: Type.STRING },
          verified: { type: Type.BOOLEAN },
          source: { type: Type.STRING },
        },
        required: ['key', 'value', 'verified', 'source'],
      },
    },
    washCare: {
      type: Type.OBJECT,
      properties: {
        applicable: { type: Type.BOOLEAN },
        verificationStatus: { type: Type.STRING },
        disclaimer: { type: Type.STRING },
        washMethod: { type: Type.STRING },
        waterTemperature: { type: Type.STRING },
        washWithSimilarColors: { type: Type.STRING },
        detergentGuidance: { type: Type.STRING },
        bleachGuidance: { type: Type.STRING },
        tumbleDry: { type: Type.STRING },
        lineDry: { type: Type.STRING },
        ironingTemperature: { type: Type.STRING },
        dryClean: { type: Type.STRING },
        storageRecommendations: { type: Type.STRING },
        categoryMaintenanceInstructions: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: [
        'applicable',
        'verificationStatus',
        'disclaimer',
        'washMethod',
        'waterTemperature',
        'washWithSimilarColors',
        'detergentGuidance',
        'bleachGuidance',
        'tumbleDry',
        'lineDry',
        'ironingTemperature',
        'dryClean',
        'storageRecommendations',
        'categoryMaintenanceInstructions',
      ],
    },
    sizeGuide: {
      type: Type.OBJECT,
      properties: {
        unitNote: { type: Type.STRING },
        dataNotice: { type: Type.STRING },
        columns: { type: Type.ARRAY, items: { type: Type.STRING } },
        rowsJson: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Array of JSON-serialized row objects matching columns keys.',
        },
      },
      required: ['unitNote', 'dataNotice', 'columns', 'rowsJson'],
    },
    seo: {
      type: Type.OBJECT,
      properties: {
        seoTitle: { type: Type.STRING },
        metaTitle: { type: Type.STRING },
        metaDescription: { type: Type.STRING },
        urlSlug: { type: Type.STRING },
        primaryKeyword: { type: Type.STRING },
        secondaryKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
        semanticKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
        imageAltTexts: { type: Type.ARRAY, items: { type: Type.STRING } },
        seoDescription: { type: Type.STRING },
        faqs: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              answer: { type: Type.STRING },
            },
            required: ['question', 'answer'],
          },
        },
      },
      required: [
        'seoTitle',
        'metaTitle',
        'metaDescription',
        'urlSlug',
        'primaryKeyword',
        'secondaryKeywords',
        'semanticKeywords',
        'imageAltTexts',
        'seoDescription',
        'faqs',
      ],
    },
    marketplaceListing: {
      type: Type.OBJECT,
      properties: {
        marketplaceId: { type: Type.STRING },
        marketplaceLabel: { type: Type.STRING },
        policyNotice: { type: Type.STRING },
        title: { type: Type.STRING },
        shortDescription: { type: Type.STRING },
        longDescription: { type: Type.STRING },
        bulletPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
        searchKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
        categoryPath: { type: Type.STRING },
        formattedAttributes: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              value: { type: Type.STRING },
            },
            required: ['name', 'value'],
          },
        },
        careSummary: { type: Type.STRING },
      },
      required: [
        'marketplaceId',
        'marketplaceLabel',
        'policyNotice',
        'title',
        'shortDescription',
        'longDescription',
        'bulletPoints',
        'searchKeywords',
        'categoryPath',
        'formattedAttributes',
        'careSummary',
      ],
    },
    variations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          style: { type: Type.STRING },
          shortDescription: { type: Type.STRING },
          longDescription: { type: Type.STRING },
        },
        required: ['style', 'shortDescription', 'longDescription'],
      },
    },
    missingInformation: { type: Type.ARRAY, items: { type: Type.STRING } },
    verificationNotes: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: [
    'categoryId',
    'categoryLabel',
    'subcategory',
    'shortDescription',
    'longDescription',
    'bulletHighlights',
    'productHighlights',
    'productBenefits',
    'usageInstructions',
    'careAndMaintenanceSummary',
    'categoryAttributes',
    'washCare',
    'sizeGuide',
    'seo',
    'marketplaceListing',
    'variations',
    'missingInformation',
    'verificationNotes',
  ],
};

export function buildTaxonomyPromptSummary(): string {
  return PRODUCT_CATEGORIES.map(
    (c) => `- ${c.id} (${c.label}): subcategories [${c.subcategories.join(', ')}]`
  ).join('\n');
}

export function buildImageAnalysisPrompt(notes?: string): string {
  return `You are Aivora's multimodal ecommerce product merchandiser.
Analyze the provided product image(s) carefully.

TAXONOMY:
${buildTaxonomyPromptSummary()}

CRITICAL ACCURACY & NON-FABRICATION RULES:
1. Describe ONLY what is visually observable (product type, visible color tones, silhouette/shape, pattern/print, visible surface texture appearance, hardware/closures visible, design style).
2. NEVER claim to know exact fabric composition percentages (e.g. do NOT claim "100% organic cotton" unless a readable label in the photo explicitly prints it), ingredients, internal technical specs, battery mAh, allergens, certifications, brand, or model unless unmistakably printed and legible in the image.
3. Explicitly list attributes that CANNOT be verified from the image alone inside "unverifiedAttributesNotice" (e.g. exact fabric blend, dimensions, care label instructions, ingredients, technical ratings).
4. Set "verificationBoundaryNote" to a clear reminder distinguishing visual observation from manufacturer-verified specifications.
${notes ? `\nUSER NOTES PROVIDED ALONGSIDE IMAGES:\n${notes}` : ''}`;
}

export function buildListingGenerationPrompt(
  input: ProductInput,
  resolvedCategoryId: string,
  imageAnalysis?: ImageAnalysisResult | null
): string {
  const category = getCategoryById(resolvedCategoryId);
  const marketplaceObj = MARKETPLACES.find((m) => m.id === input.marketplace) ?? MARKETPLACES[0];
  const alternateStyles = WRITING_STYLES.filter((s) => s !== input.writingStyle).slice(0, 2);

  return `You are Aivora, a world-class ecommerce copywriter, SEO specialist, and product catalog manager.

Generate a complete, accurate, structured ecommerce catalog listing for the product below.

RESOLVED CATEGORY:
- categoryId: "${category.id}"
- categoryLabel: "${category.label}"
- subcategory: "${input.subcategory || category.subcategories[0]}"
- Required category-specific attribute keys to evaluate: ${category.requiredAttributeFields.join(', ')}
- Size/Spec table columns: ${category.sizeGuideColumns.join(', ')}
- Default size/spec row labels if applicable: ${category.defaultSizeRows.join(', ')}

TARGET WRITING STYLE: "${input.writingStyle}"
TARGET MARKETPLACE: "${marketplaceObj.label}" (${marketplaceObj.id}) — ${marketplaceObj.note}
${input.generateVariations ? `ALSO GENERATE 2 DESCRIPTION VARIATIONS IN STYLES: ${alternateStyles.join(' and ')}` : 'Leave "variations" as an empty array [].'}

SUPPLIED PRODUCT DATA:
- Product Name: ${input.productName || '(not provided)'}
- Brand Name: ${input.brandName || '(not provided)'}
- SKU: ${input.sku || '(not provided)'}
- Material / Fabric: ${input.materialOrFabric || '(not provided)'}
- Color: ${input.color || '(not provided)'}
- Size / Dimensions: ${input.sizeOrDimensions || '(not provided)'}
- Price: ${input.price || '(not provided)'}
- Country & Target Market: ${input.countryAndMarket || '(not provided)'}
- Target Audience: ${input.targetAudience || '(not provided)'}
- Features: ${input.features || '(not provided)'}
- Benefits: ${input.benefits || '(not provided)'}
- Target Keywords: ${input.targetKeywords || '(not provided)'}
- Care Label / Manufacturer Care Provided: ${input.careLabelProvided || '(not provided)'}
- Ingredients / Nutritional / Technical Info Provided: ${input.nutritionalOrIngredientInfo || '(not provided)'}
- Raw Notes / Description: ${input.rawNotes || '(not provided)'}
- Competitor / Reference URL: ${input.competitorUrl || '(not provided)'}
${
  imageAnalysis
    ? `\nVISUAL IMAGE OBSERVATIONS (do NOT treat visual guesses as verified specs):\n${JSON.stringify(imageAnalysis, null, 2)}`
    : ''
}

NON-NEGOTIABLE ACCURACY RULES:
1. NEVER invent specifications, fabric composition percentages, ingredients, nutritional facts, allergens, certifications, clinical/medical claims, warranty terms, weight capacity, or measurements that were not supplied by the user or verified.
2. For every field in "categoryAttributes":
   - Include all required attribute keys for "${category.label}" (${category.requiredAttributeFields.join(', ')}).
   - If supplied by the user, set verified=true, source="user_supplied".
   - If inferred only from image appearance (e.g. visible color or silhouette), set verified=false, source="visual_observation" and note "(visual observation — verify)".
   - If missing/unverified, set value="Not provided — please verify", verified=false, source="missing", AND add that field name to "missingInformation".
3. BEAUTY & SKINCARE RULE: Never invent clinical claims or medical benefits (e.g., do not claim "clinically proven to cure acne" or "dermatologist tested" unless provided).
4. FOOD & BEVERAGES RULE: Never invent nutritional information, calories, allergens, expiry dates, or organic/halal/kosher certifications.
5. WASH CARE & PRODUCT CARE ENGINE:
   - If user provided "Care Label / Manufacturer Care Provided", set verificationStatus="verified_care_label", follow it faithfully, and set disclaimer="Based on manufacturer-supplied care label details."
   - If NO care label was provided, set verificationStatus="general_material_guidance" and set disclaimer="General material guidance only — verify against the actual garment care label or manufacturer instructions before publishing."
   - Provide thoughtful, material-appropriate guidance across all washCare fields when applicable (apparel/baby_kids), or mark wash-specific fields as "N/A" and populate "categoryMaintenanceInstructions" for footwear, jewellery, leather bags, electronics, furniture, beauty, or food storage.
6. SIZE GUIDE & SPECIFICATIONS:
   - Use columns: ${JSON.stringify(category.sizeGuideColumns)}.
   - Return each row in "rowsJson" as a valid JSON string representing an object with exact column keys.
   - ONLY populate exact measurements if supplied in Size / Dimensions or Raw Notes. Never fabricate bust/waist/hip/foot/dimension numbers! For any unsupplied measurement cells, put "— (not supplied)" and state clearly in "dataNotice" which measurements still need seller input.
7. SEO OPTIMIZATION:
   - Preserve exact product name and brand. Optimize naturally without keyword stuffing.
   - Include metaTitle (~55-60 chars), metaDescription (~145-160 chars), clean urlSlug, primaryKeyword, secondaryKeywords, semanticKeywords, imageAltTexts, seoDescription, and 3-4 helpful FAQs grounded in actual product data (marking unverified FAQ details as subject to seller confirmation).
8. MARKETPLACE CONTENT:
   - Format specifically for ${marketplaceObj.label}.
   - Set "policyNotice" to clearly note that the listing follows ${marketplaceObj.label}'s standard structure and does NOT certify compliance with current marketplace policies unless verified by the seller.
9. BULLET HIGHLIGHTS: Provide 5 to 8 clear, readable bullet points grounded in supplied features/observations.`;
}
