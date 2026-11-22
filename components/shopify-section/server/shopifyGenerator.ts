import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import type { GeneratedSectionResult } from '../types/shopify';

export interface GeneratorImageInput {
  name: string;
  mimeType: 'image/png' | 'image/jpeg' | 'image/webp';
  dataBase64: string;
  role?: string;
}

export interface GenerateSectionParams {
  images: GeneratorImageInput[];
  sectionType: string;
  instructions: string;
  cssPrefix?: string;
}

export interface RefineSectionParams {
  currentLiquidCode: string;
  currentSectionName: string;
  currentSectionSlug: string;
  refinementInstruction: string;
  images?: GeneratorImageInput[];
}

function getGenAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    const err = new Error(
      'GEMINI_API_KEY is not configured. Please add your Gemini API key in the server environment.'
    ) as Error & { statusCode?: number };
    err.statusCode = 500;
    throw err;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const SHOPIFY_SYSTEM_INSTRUCTION = `You are Aivora, a Principal Shopify Theme Architect and Online Store 2.0 Liquid Engineer.
Your mission is to inspect website/Figma screenshots and convert them into production-ready, merchant-editable Shopify Online Store 2.0 (.liquid) section files.

CRITICAL TECHNICAL RULES:
1. PURE SHOPIFY LIQUID ONLY:
   - Never output React, JSX, className=, Next.js, Tailwind build-time utilities, or ordinary static HTML disguised as Liquid.
   - Use authentic Shopify Liquid syntax: {%- liquid ... -%}, {%- assign ... -%}, {%- if ... -%}, {%- for block in section.blocks -%}, {%- case block.type -%}, {%- capture ... -%}.
   - Use Shopify Liquid filters: | escape, | default: '...', | image_url: width: 1500, | image_tag: loading: 'lazy', widths: '375, 550, 750, 1100, 1500', sizes: '...', | money, | strip_html, | t.
   - Use real Shopify global & section objects: section.id, section.settings.*, section.blocks, block.settings.*, block.type, block.shopify_attributes, product.*, collection.*, routes.cart_add_url, routes.root_url, shop.name.
   - Never hardcode product titles, prices, or URLs when a collection/product picker is present—always render from the chosen collection/product object WITH clean placeholder fallbacks (e.g. {% if section.settings.collection != blank %} ... {% else %} clean placeholder onboarding state {% endif %}) so it works both with live catalog data and freshly added in Theme Editor.

2. CSS SCOPING & RESPONSIVE ENGINEERING:
   - Wrap section CSS inside {%- style -%} ... {%- endstyle -%} using #shopify-section-{{ section.id }} or .aivora-section-{{ section.id }} scoping so multiple instances never collide.
   - Use CSS custom properties mapped directly to section.settings (e.g. --section-bg: {{ section.settings.background_color }}; --pt-desktop: {{ section.settings.padding_top }}px;).
   - Mobile-first responsive CSS with @media screen and (min-width: 750px) and @media screen and (min-width: 990px).
   - Support desktop/mobile columns, section height, fluid clamp() typography, accessible focus-visible rings, and aspect-ratio image containers (object-fit: cover).

3. JAVASCRIPT (ONLY WHEN INTERACTIVE):
   - For FAQ accordions, sliders/carousels, tabs, variant swatches, or Quick Add AJAX cart forms, include clean, scoped vanilla JS inside <script> (using document.querySelectorAll('#shopify-section-{{ section.id }} ...') or a custom element) with zero external JS library dependencies.
   - Never use inline onclick attributes or global window pollution.

4. COMPLETE VALID {% schema %} BLOCK:
   - Include a strictly valid JSON {% schema %} ... {% endschema %} block at the bottom.
   - Include "name", "tag": "section", "class", "disabled_on": { "groups": ["header", "footer"] }, "settings", "blocks" (when repeatable items exist like cards, slides, FAQ items, testimonials, logos, feature icons), and "presets" (with pre-populated default blocks!).
   - Use valid Shopify OS 2.0 setting types ONLY: text, textarea, inline_richtext, richtext, image_picker, product, collection, url, checkbox, select, range, color, color_background, video, font_picker, header, paragraph.
   - Every "range" setting MUST have numeric "min", "max", "step", and "default" (and "max" - "min" must be evenly divisible by "step", with max <= 100 steps).
   - Every "select" setting MUST have a non-empty "options" array of { "value": "...", "label": "..." } and a matching "default".
   - Every block root element MUST include {{ block.shopify_attributes }}.
   - Ensure JSON inside {% schema %} has NO trailing commas and NO comments.

5. DESIGN ANALYSIS ENGINE:
   - Strictly separate OBSERVED visual properties (what is literally visible in the screenshot: layout, hex colors, fonts, spacing, alignment, element relationships) from INFERRED design decisions (mobile collapse behavior, Shopify object mapping, schema/block breakdown, accessibility choices).

Return ONLY valid JSON matching the requested schema.`;

const DESIGN_AND_LIQUID_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    sectionSlug: {
      type: Type.STRING,
      description: 'Kebab-case Shopify section file slug without .liquid extension, e.g. aivora-hero-editorial',
    },
    sectionName: {
      type: Type.STRING,
      description: 'Human-readable section title shown in Shopify Theme Editor',
    },
    detectedSectionType: {
      type: Type.STRING,
      description: 'Detected section category, e.g. Hero Banner, Featured Collection, Testimonials, FAQ Accordion',
    },
    designAnalysis: {
      type: Type.OBJECT,
      properties: {
        layoutSummary: { type: Type.STRING },
        observed: {
          type: Type.OBJECT,
          properties: {
            layoutStructure: { type: Type.STRING },
            containerWidth: { type: Type.STRING },
            backgroundColors: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            textColors: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            typography: { type: Type.STRING },
            spacingAndGrid: { type: Type.STRING },
            mediaAndButtons: { type: Type.STRING },
            elements: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  role: { type: Type.STRING },
                  relationship: { type: Type.STRING },
                },
                required: ['name', 'role', 'relationship'],
              },
            },
          },
          required: [
            'layoutStructure',
            'containerWidth',
            'backgroundColors',
            'textColors',
            'typography',
            'spacingAndGrid',
            'mediaAndButtons',
            'elements',
          ],
        },
        inferred: {
          type: Type.OBJECT,
          properties: {
            responsiveBehavior: { type: Type.STRING },
            shopifyMapping: { type: Type.STRING },
            schemaStrategy: { type: Type.STRING },
            accessibilityDecisions: { type: Type.STRING },
          },
          required: [
            'responsiveBehavior',
            'shopifyMapping',
            'schemaStrategy',
            'accessibilityDecisions',
          ],
        },
      },
      required: ['layoutSummary', 'observed', 'inferred'],
    },
    liquidCode: {
      type: Type.STRING,
      description: 'Complete self-contained Shopify Online Store 2.0 .liquid file including {%- style -%}, HTML/Liquid markup, optional <script>, and {% schema %}...{% endschema %}.',
    },
    merchantNotes: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '2-4 concise implementation notes for the Shopify merchant or theme developer.',
    },
  },
  required: [
    'sectionSlug',
    'sectionName',
    'detectedSectionType',
    'designAnalysis',
    'liquidCode',
    'merchantNotes',
  ],
};

async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;
      const status =
        typeof err === 'object' && err !== null && 'status' in err
          ? Number((err as { status?: unknown }).status)
          : undefined;
      const retryable = status === 429 || status === 503 || status === 502;
      if (!retryable || attempt === maxAttempts) {
        throw err;
      }
      const delayMs = 600 * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw lastError;
}

export async function generateShopifySection(
  params: GenerateSectionParams
): Promise<GeneratedSectionResult> {
  const ai = getGenAIClient();

  const imageParts = params.images.map((img, index) => ({
    inlineData: {
      mimeType: img.mimeType,
      data: img.dataBase64,
    },
  }));

  const imageContextLines = params.images
    .map(
      (img, idx) =>
        `- Reference Image ${idx + 1}: "${img.name}" (Role: ${img.role || (idx === 0 ? 'Primary Desktop' : 'Additional View')})`
    )
    .join('\n');

  const promptText = `Analyze the attached design reference screenshot(s) and build a complete Shopify Online Store 2.0 .liquid section file.

CONTEXT:
${imageContextLines}
- Requested Section Type: ${params.sectionType || 'Auto-Detect from Design'}
- CSS Class Prefix: ${params.cssPrefix?.trim() || 'aivora'}
- Additional User Instructions: ${params.instructions?.trim() || 'None provided — faithfully reproduce the visual hierarchy, colors, typography, spacing, and interactive behavior as a customizable Shopify OS 2.0 section.'}

REQUIREMENTS CHECKLIST:
- Inspect every visual detail (colors, typography scale, padding, grid columns, border-radius, shadows, alignment, button variants).
- Reproduce the exact visual aesthetic while converting static text/media/products into editable Theme Editor settings and repeatable blocks.
- If the design shows products or collections, use Shopify collection/product pickers + dynamic product.title, product.price | money, product.featured_media / product.featured_image, product.url, product.vendor, product.available, and fallback onboarding cards when no collection is assigned yet.
- If the design shows repeatable cards (testimonials, FAQs, logos, feature icons, gallery items, pricing tiers, multicolumn cards), implement them as repeatable section.blocks with {{ block.shopify_attributes }} and pre-populate them in presets.
- Ensure the {% schema %} JSON is 100% valid JSON and every setting follows Shopify's schema constraints.`;

  const response = await withRetry(() =>
    ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [...imageParts, { text: promptText }],
      },
      config: {
        systemInstruction: SHOPIFY_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: DESIGN_AND_LIQUID_RESPONSE_SCHEMA,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.HIGH,
        },
      },
    })
  );

  const rawText = (response.text ?? '').trim();
  if (!rawText) {
    throw new Error('Model returned an empty response.');
  }

  const parsed = JSON.parse(rawText) as GeneratedSectionResult;
  return {
    ...parsed,
    sectionSlug: sanitizeSlug(parsed.sectionSlug || parsed.sectionName),
  };
}

export async function refineShopifySection(
  params: RefineSectionParams
): Promise<{ liquidCode: string; merchantNotes: string[] }> {
  const ai = getGenAIClient();

  const imageParts = (params.images || []).slice(0, 3).map((img) => ({
    inlineData: {
      mimeType: img.mimeType,
      data: img.dataBase64,
    },
  }));

  const promptText = `Modify the following existing Shopify Online Store 2.0 .liquid section according to the user's refinement request.
Keep all existing valid Shopify Liquid conventions, CSS scoping (#shopify-section-{{ section.id }}), and valid {% schema %} JSON.

SECTION NAME: ${params.currentSectionName}
SECTION SLUG: ${params.currentSectionSlug}

REFINEMENT REQUEST:
${params.refinementInstruction}

EXISTING LIQUID SECTION CODE:
\`\`\`liquid
${params.currentLiquidCode}
\`\`\`

Return JSON containing the complete updated "liquidCode" (full file, never partial diff) and updated "merchantNotes".`;

  const response = await withRetry(() =>
    ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [...imageParts, { text: promptText }],
      },
      config: {
        systemInstruction: SHOPIFY_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            liquidCode: { type: Type.STRING },
            merchantNotes: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['liquidCode', 'merchantNotes'],
        },
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.MEDIUM,
        },
      },
    })
  );

  const rawText = (response.text ?? '').trim();
  if (!rawText) {
    throw new Error('Model returned an empty refinement response.');
  }

  return JSON.parse(rawText) as { liquidCode: string; merchantNotes: string[] };
}

function sanitizeSlug(input: string): string {
  const cleaned = (input || 'aivora-custom-section')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return cleaned || 'aivora-custom-section';
}
