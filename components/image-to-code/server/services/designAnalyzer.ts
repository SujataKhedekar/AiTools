import { ThinkingLevel, Type } from '@google/genai';
import type {
  AnalyzeDesignResponse,
  BrandAssetInput,
  FrameworkId,
  GenerationOptions,
  ScreenshotInput,
} from '../../shared/types';
import {
  DEFAULT_MULTIMODAL_MODEL,
  extractTokenUsage,
  getGeminiClient,
  safeJsonParse,
  withGeminiRetry,
} from '../gemini/client';

const ANALYSIS_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    analysis: {
      type: Type.OBJECT,
      properties: {
        summary: { type: Type.STRING },
        pageType: { type: Type.STRING },
        observed: {
          type: Type.OBJECT,
          properties: {
            layout: {
              type: Type.OBJECT,
              properties: {
                structure: { type: Type.STRING },
                headerNav: { type: Type.STRING },
                heroSection: { type: Type.STRING },
                contentSections: { type: Type.ARRAY, items: { type: Type.STRING } },
                columnsAndGrids: { type: Type.STRING },
                sidebars: { type: Type.STRING },
                footer: { type: Type.STRING },
                containersAndSpacing: { type: Type.STRING },
                alignment: { type: Type.STRING },
              },
              required: [
                'structure',
                'headerNav',
                'heroSection',
                'contentSections',
                'columnsAndGrids',
                'sidebars',
                'footer',
                'containersAndSpacing',
                'alignment',
              ],
            },
            visualDesign: {
              type: Type.OBJECT,
              properties: {
                backgroundColors: { type: Type.ARRAY, items: { type: Type.STRING } },
                textColors: { type: Type.ARRAY, items: { type: Type.STRING } },
                brandColors: { type: Type.ARRAY, items: { type: Type.STRING } },
                fontStyles: { type: Type.ARRAY, items: { type: Type.STRING } },
                borderRadius: { type: Type.ARRAY, items: { type: Type.STRING } },
                shadows: { type: Type.ARRAY, items: { type: Type.STRING } },
                borders: { type: Type.ARRAY, items: { type: Type.STRING } },
                gradients: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: [
                'backgroundColors',
                'textColors',
                'brandColors',
                'fontStyles',
                'borderRadius',
                'shadows',
                'borders',
                'gradients',
              ],
            },
            components: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  type: { type: Type.STRING },
                  count: { type: Type.INTEGER },
                  interactiveBehavior: { type: Type.STRING },
                  observedDetails: { type: Type.STRING },
                },
                required: ['name', 'type', 'count', 'interactiveBehavior', 'observedDetails'],
              },
            },
            typography: {
              type: Type.OBJECT,
              properties: {
                headingHierarchy: { type: Type.ARRAY, items: { type: Type.STRING } },
                bodyTypography: { type: Type.STRING },
                lineHeight: { type: Type.STRING },
                letterSpacing: { type: Type.STRING },
                textAlignment: { type: Type.STRING },
              },
              required: [
                'headingHierarchy',
                'bodyTypography',
                'lineHeight',
                'letterSpacing',
                'textAlignment',
              ],
            },
          },
          required: ['layout', 'visualDesign', 'components', 'typography'],
        },
        inferred: {
          type: Type.OBJECT,
          properties: {
            responsiveBehavior: {
              type: Type.OBJECT,
              properties: {
                desktopLayout: { type: Type.STRING },
                tabletLayout: { type: Type.STRING },
                mobileLayout: { type: Type.STRING },
                breakpointChanges: { type: Type.ARRAY, items: { type: Type.STRING } },
                stackingBehavior: { type: Type.STRING },
                responsiveNavigation: { type: Type.STRING },
              },
              required: [
                'desktopLayout',
                'tabletLayout',
                'mobileLayout',
                'breakpointChanges',
                'stackingBehavior',
                'responsiveNavigation',
              ],
            },
            assetSubstitutions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  originalElement: { type: Type.STRING },
                  substitutionNote: { type: Type.STRING },
                },
                required: ['originalElement', 'substitutionNote'],
              },
            },
          },
          required: ['responsiveBehavior', 'assetSubstitutions'],
        },
      },
      required: ['summary', 'pageType', 'observed', 'inferred'],
    },
    designSystem: {
      type: Type.OBJECT,
      properties: {
        colors: {
          type: Type.OBJECT,
          properties: {
            primary: { type: Type.STRING },
            secondary: { type: Type.STRING },
            accent: { type: Type.STRING },
            background: { type: Type.STRING },
            surface: { type: Type.STRING },
            textPrimary: { type: Type.STRING },
            textSecondary: { type: Type.STRING },
            border: { type: Type.STRING },
            palette: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  hex: { type: Type.STRING },
                  usage: { type: Type.STRING },
                },
                required: ['name', 'hex', 'usage'],
              },
            },
          },
          required: [
            'primary',
            'secondary',
            'accent',
            'background',
            'surface',
            'textPrimary',
            'textSecondary',
            'border',
            'palette',
          ],
        },
        typography: {
          type: Type.OBJECT,
          properties: {
            displayFont: { type: Type.STRING },
            bodyFont: { type: Type.STRING },
            monoFont: { type: Type.STRING },
            scale: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  role: { type: Type.STRING },
                  size: { type: Type.STRING },
                  weight: { type: Type.STRING },
                  lineHeight: { type: Type.STRING },
                  letterSpacing: { type: Type.STRING },
                },
                required: ['role', 'size', 'weight', 'lineHeight', 'letterSpacing'],
              },
            },
          },
          required: ['displayFont', 'bodyFont', 'monoFont', 'scale'],
        },
        spacing: {
          type: Type.OBJECT,
          properties: {
            baseUnit: { type: Type.STRING },
            scale: { type: Type.ARRAY, items: { type: Type.STRING } },
            containerMaxWidth: { type: Type.STRING },
            sectionPadding: { type: Type.STRING },
          },
          required: ['baseUnit', 'scale', 'containerMaxWidth', 'sectionPadding'],
        },
        radii: {
          type: Type.OBJECT,
          properties: {
            sm: { type: Type.STRING },
            md: { type: Type.STRING },
            lg: { type: Type.STRING },
            xl: { type: Type.STRING },
            full: { type: Type.STRING },
          },
          required: ['sm', 'md', 'lg', 'xl', 'full'],
        },
        shadows: {
          type: Type.OBJECT,
          properties: {
            sm: { type: Type.STRING },
            md: { type: Type.STRING },
            lg: { type: Type.STRING },
          },
          required: ['sm', 'md', 'lg'],
        },
        buttonStyles: {
          type: Type.OBJECT,
          properties: {
            primary: { type: Type.STRING },
            secondary: { type: Type.STRING },
          },
          required: ['primary', 'secondary'],
        },
        cardStyles: {
          type: Type.OBJECT,
          properties: {
            background: { type: Type.STRING },
            border: { type: Type.STRING },
            radius: { type: Type.STRING },
            shadow: { type: Type.STRING },
            padding: { type: Type.STRING },
          },
          required: ['background', 'border', 'radius', 'shadow', 'padding'],
        },
        cssVariables: { type: Type.STRING },
        tailwindConfig: { type: Type.STRING },
      },
      required: [
        'colors',
        'typography',
        'spacing',
        'radii',
        'shadows',
        'buttonStyles',
        'cardStyles',
        'cssVariables',
        'tailwindConfig',
      ],
    },
    componentPlan: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          filePath: { type: Type.STRING },
          responsibility: { type: Type.STRING },
          reusedAcrossScreenshots: { type: Type.BOOLEAN },
          propsSummary: { type: Type.STRING },
          interactiveFeatures: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: [
          'name',
          'filePath',
          'responsibility',
          'reusedAcrossScreenshots',
          'propsSummary',
          'interactiveFeatures',
        ],
      },
    },
  },
  required: ['analysis', 'designSystem', 'componentPlan'],
};

function getExtForFramework(framework: FrameworkId, language: 'typescript' | 'javascript'): string {
  if (framework === 'vue') return 'vue';
  if (framework === 'html_css_js' || framework === 'bootstrap') return 'html';
  return language === 'typescript' ? 'tsx' : 'jsx';
}

export async function analyzeScreenshotsDesign(params: {
  screenshots: ScreenshotInput[];
  assets: BrandAssetInput[];
  options: GenerationOptions;
}): Promise<AnalyzeDesignResponse> {
  const { screenshots, assets, options } = params;
  const ai = getGeminiClient();
  const ext = getExtForFramework(options.framework, options.language);

  const parts: Array<{ inlineData: { mimeType: string; data: string } } | { text: string }> = [];

  screenshots.forEach((shot, idx) => {
    parts.push({
      text: `Screenshot ${idx + 1} (${shot.roleLabel || shot.name}, filename: ${shot.name}):`,
    });
    parts.push({
      inlineData: {
        mimeType: shot.mimeType,
        data: shot.base64,
      },
    });
  });

  const assetContext =
    assets.length > 0
      ? `The user also provided ${assets.length} supplementary brand asset(s): ${assets
          .map((a) => `label="${a.label}" (${a.name})`)
          .join(', ')}. Match them to matching image slots in the UI where appropriate.`
      : 'No supplementary brand assets were uploaded; identify any photographic/illustration slots that will need clearly labeled SVG/CSS visual placeholders rather than fabricated external URLs.';

  const relationContext =
    screenshots.length > 1
      ? `Multiple screenshots (${screenshots.length}) were provided representing "${options.multiScreenshotRelation.replace(
          '_',
          ' '
        )}". Identify shared design tokens and reusable components across all screenshots so nothing is duplicated.`
      : 'A single reference screenshot was provided.';

  const prompt = `Analyze the attached UI screenshot(s) with precision for frontend engineering reconstruction.

Target stack: ${options.framework} (${options.language}, ${options.styling}, ${options.architecture}).
${relationContext}
${assetContext}

Strict accuracy rules:
1. Clearly separate OBSERVED visual properties (what is literally visible in the pixels: exact hex colors, layout structure, section sequence, columns, typography sizes/weights, radii, shadows, borders, components) from INFERRED responsive behavior (how desktop/tablet/mobile breakpoints should adapt and stack, since mobile or tablet views may not be shown).
2. Do NOT invent sections that are not present in the screenshots.
3. Extract a complete Design System with concrete hex codes, typography scale, spacing scale, button & card styles, a valid :root CSS variables block, and a Tailwind CSS theme configuration block.
4. Plan a clean, modular component breakdown (${options.framework === 'html_css_js' || options.framework === 'bootstrap' ? 'modular sections/partials and JS modules' : `components in src/components/* using .${ext} extensions`}). Avoid monolithic single-file components.
5. Note exact interactive UI behaviors needed (dropdowns, tabs, mobile drawer, search filter, forms, modals, sort controls, etc.).`;

  parts.push({ text: prompt });

  const response = await withGeminiRetry(() =>
    ai.models.generateContent({
      model: DEFAULT_MULTIMODAL_MODEL,
      contents: { parts },
      config: {
        systemInstruction:
          'You are a principal UI/UX reverse-engineering specialist and frontend systems architect. Always output strictly valid JSON matching the provided schema. Be concrete, exact with hex values and dimensions, and honest about what is observed vs inferred.',
        responseMimeType: 'application/json',
        responseSchema: ANALYSIS_RESPONSE_SCHEMA,
        thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
      },
    })
  );

  const parsed = safeJsonParse<Omit<AnalyzeDesignResponse, 'tokenUsage'>>(
    response.text,
    'design analysis'
  );

  return {
    ...parsed,
    tokenUsage: extractTokenUsage(response, DEFAULT_MULTIMODAL_MODEL),
  };
}
