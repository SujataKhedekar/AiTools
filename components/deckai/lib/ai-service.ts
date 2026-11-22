import crypto from 'node:crypto';
import { GoogleGenAI, Type } from '@google/genai';
import type {
  ChartElement,
  DeckTheme,
  GenerateDeckParams,
  IconElement,
  ImageElement,
  ShapeElement,
  Slide,
  SlideElement,
  SlideLayout,
  TextElement,
} from '../types/deck';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || 'missing-gemini-key',
  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
});

export const DECK_THEMES: DeckTheme[] = [
  {
    id: 'cobalt-studio',
    name: 'Cobalt Studio',
    description: 'Crisp alabaster canvas with electric cobalt & deep slate typography',
    backgroundColor: '#FFFFFF',
    surfaceColor: '#F4F6FB',
    textColor: '#0F172A',
    mutedTextColor: '#475569',
    accentColor: '#3B5BDB',
    secondaryAccent: '#6366F1',
    fontDisplay: 'Plus Jakarta Sans',
    fontBody: 'DM Sans',
  },
  {
    id: 'obsidian-pitch',
    name: 'Obsidian Executive',
    description: 'Deep slate obsidian canvas with luminous indigo & sky highlights',
    backgroundColor: '#0B1120',
    surfaceColor: '#162033',
    textColor: '#F8FAFC',
    mutedTextColor: '#94A3B8',
    accentColor: '#6366F1',
    secondaryAccent: '#38BDF8',
    fontDisplay: 'Plus Jakarta Sans',
    fontBody: 'DM Sans',
  },
  {
    id: 'minimal-paper',
    name: 'Minimalist Editorial',
    description: 'Warm archival off-white with charcoal type and muted bronze accents',
    backgroundColor: '#FAF9F6',
    surfaceColor: '#F1EFEA',
    textColor: '#18181B',
    mutedTextColor: '#52525B',
    accentColor: '#2563EB',
    secondaryAccent: '#0EA5E9',
    fontDisplay: 'Plus Jakarta Sans',
    fontBody: 'DM Sans',
  },
  {
    id: 'emerald-finance',
    name: 'Capital & Finance',
    description: 'Clean white boardroom grid with deep forest slate & emerald data accents',
    backgroundColor: '#FFFFFF',
    surfaceColor: '#F0FDF4',
    textColor: '#064E3B',
    mutedTextColor: '#374151',
    accentColor: '#059669',
    secondaryAccent: '#0284C7',
    fontDisplay: 'Plus Jakarta Sans',
    fontBody: 'DM Sans',
  },
  {
    id: 'violet-modern',
    name: 'Modern SaaS Gradient',
    description: 'Soft lavender-mist backdrop with crisp violet and cobalt accents',
    backgroundColor: '#F8F7FF',
    surfaceColor: '#EEF2FF',
    textColor: '#1E1B4B',
    mutedTextColor: '#4338CA',
    accentColor: '#4F46E5',
    secondaryAccent: '#7C3AED',
    fontDisplay: 'Plus Jakarta Sans',
    fontBody: 'DM Sans',
  },
];

const CURATED_IMAGES: Record<string, string> = {
  architecture: '/deckai/assets/hero_deck_showcase_1795339616751.jpg',
  product: '/deckai/assets/template_startup_pitch_1795339616799.jpg',
  boardroom: '/deckai/assets/template_corporate_strategy_1795339617216.jpg',
  creative: '/deckai/assets/template_creative_portfolio_1795339616318.jpg',
  team: '/deckai/assets/slide_team_workspace_1795339616938.jpg',
};

function resolveTheme(colorPalette: string, designStyle: string): DeckTheme {
  const lower = `${colorPalette} ${designStyle}`.toLowerCase();
  if (lower.includes('dark') || lower.includes('obsidian') || lower.includes('slate')) {
    return DECK_THEMES[1];
  }
  if (lower.includes('minimal') || lower.includes('warm') || lower.includes('paper')) {
    return DECK_THEMES[2];
  }
  if (lower.includes('green') || lower.includes('emerald') || lower.includes('finance')) {
    return DECK_THEMES[3];
  }
  if (lower.includes('purple') || lower.includes('violet') || lower.includes('gradient')) {
    return DECK_THEMES[4];
  }
  return DECK_THEMES[0];
}

interface RawAISlideSpec {
  title: string;
  subtitle: string;
  layout: SlideLayout;
  kicker?: string;
  bullets?: string[];
  cards?: Array<{ heading: string; body: string; metric?: string; icon?: string }>;
  chart?: {
    chartType: 'bar' | 'line' | 'area' | 'pie';
    title: string;
    data: Array<{ label: string; value: number; secondaryValue?: number }>;
  };
  imageCategory?: 'architecture' | 'product' | 'boardroom' | 'creative' | 'team';
  ctaText?: string;
  notes?: string;
}

interface RawAIDeckSpec {
  title: string;
  subtitle: string;
  slides: RawAISlideSpec[];
}

function uid(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}

function buildElementsFromSpec(
  spec: RawAISlideSpec,
  index: number,
  total: number,
  theme: DeckTheme
): Slide {
  const elements: SlideElement[] = [];
  const layout = spec.layout || (index === 0 ? 'title' : index === total - 1 ? 'closing' : 'content-split');
  const imageSrc = CURATED_IMAGES[spec.imageCategory || (index === 0 ? 'architecture' : index % 2 === 0 ? 'product' : 'team')];

  const makeText = (
    x: number,
    y: number,
    w: number,
    h: number,
    content: string,
    opts: Partial<TextElement> = {}
  ): TextElement => ({
    id: uid('txt'),
    type: 'text',
    x,
    y,
    w,
    h,
    content,
    fontSize: opts.fontSize ?? 18,
    fontFamily: opts.fontFamily ?? theme.fontBody,
    fontWeight: opts.fontWeight ?? 'normal',
    fontStyle: opts.fontStyle ?? 'normal',
    textDecoration: 'none',
    textAlign: opts.textAlign ?? 'left',
    color: opts.color ?? theme.textColor,
    backgroundColor: opts.backgroundColor,
    borderRadius: opts.borderRadius,
    padding: opts.padding,
    lineHeight: opts.lineHeight ?? 1.4,
  });

  const makeShape = (
    x: number,
    y: number,
    w: number,
    h: number,
    opts: Partial<ShapeElement> = {}
  ): ShapeElement => ({
    id: uid('shp'),
    type: 'shape',
    shapeKind: opts.shapeKind ?? 'roundRect',
    x,
    y,
    w,
    h,
    fillColor: opts.fillColor ?? theme.surfaceColor,
    strokeColor: opts.strokeColor,
    strokeWidth: opts.strokeWidth ?? 1,
    borderRadius: opts.borderRadius ?? 12,
    opacity: opts.opacity ?? 1,
    text: opts.text,
    textColor: opts.textColor,
    fontSize: opts.fontSize,
  });

  const makeChart = (
    x: number,
    y: number,
    w: number,
    h: number,
    chartSpec: NonNullable<RawAISlideSpec['chart']>
  ): ChartElement => ({
    id: uid('cht'),
    type: 'chart',
    chartType: chartSpec.chartType || 'bar',
    title: chartSpec.title || spec.title,
    x,
    y,
    w,
    h,
    data:
      chartSpec.data && chartSpec.data.length > 0
        ? chartSpec.data
        : [
            { label: 'Q1', value: 24 },
            { label: 'Q2', value: 42 },
            { label: 'Q3', value: 68 },
            { label: 'Q4', value: 95 },
          ],
    primaryColor: theme.accentColor,
    secondaryColor: theme.secondaryAccent,
    textColor: theme.textColor,
    showGrid: true,
  });

  const makeImage = (
    x: number,
    y: number,
    w: number,
    h: number,
    src: string,
    alt: string
  ): ImageElement => ({
    id: uid('img'),
    type: 'image',
    x,
    y,
    w,
    h,
    src,
    alt,
    objectFit: 'cover',
    borderRadius: 12,
  });

  const makeIcon = (
    x: number,
    y: number,
    iconName: string,
    color = theme.accentColor
  ): IconElement => ({
    id: uid('icn'),
    type: 'icon',
    x,
    y,
    w: 4.5,
    h: 8,
    iconName,
    color,
    backgroundColor: theme.surfaceColor,
    borderRadius: 10,
  });

  if (layout === 'title' || index === 0) {
    elements.push(
      makeShape(0, 0, 56, 100, {
        shapeKind: 'rect',
        fillColor: theme.backgroundColor,
        borderRadius: 0,
      }),
      makeImage(58, 8, 36, 84, imageSrc, spec.title),
      makeText(6, 14, 48, 6, (spec.kicker || 'EXECUTIVE PRESENTATION').toUpperCase(), {
        fontSize: 13,
        fontWeight: 'bold',
        color: theme.accentColor,
      }),
      makeText(6, 24, 48, 30, spec.title, {
        fontSize: 44,
        fontFamily: theme.fontDisplay,
        fontWeight: 'extrabold',
        lineHeight: 1.12,
      }),
      makeText(6, 57, 46, 18, spec.subtitle, {
        fontSize: 19,
        color: theme.mutedTextColor,
        lineHeight: 1.45,
      }),
      makeShape(6, 80, 18, 0.8, {
        shapeKind: 'line',
        fillColor: theme.accentColor,
        borderRadius: 4,
      }),
      makeText(6, 84, 44, 6, spec.ctaText || `Prepared for ${new Date().getFullYear()}`, {
        fontSize: 14,
        fontWeight: 'medium',
        color: theme.mutedTextColor,
      })
    );
  } else if (layout === 'closing') {
    elements.push(
      makeShape(6, 12, 88, 76, {
        shapeKind: 'roundRect',
        fillColor: theme.surfaceColor,
        borderRadius: 20,
      }),
      makeText(12, 22, 76, 6, (spec.kicker || 'NEXT STEPS').toUpperCase(), {
        fontSize: 13,
        fontWeight: 'bold',
        textAlign: 'center',
        color: theme.accentColor,
      }),
      makeText(12, 31, 76, 22, spec.title, {
        fontSize: 40,
        fontFamily: theme.fontDisplay,
        fontWeight: 'extrabold',
        textAlign: 'center',
        lineHeight: 1.15,
      }),
      makeText(18, 54, 64, 14, spec.subtitle, {
        fontSize: 19,
        textAlign: 'center',
        color: theme.mutedTextColor,
      }),
      makeShape(36, 71, 28, 10, {
        shapeKind: 'roundRect',
        fillColor: theme.accentColor,
        borderRadius: 10,
        text: spec.ctaText || 'Schedule Follow-Up',
        textColor: '#FFFFFF',
        fontSize: 16,
      })
    );
  } else if (spec.chart && (layout === 'market' || layout === 'financials' || layout === 'competitive')) {
    elements.push(
      makeText(6, 7, 88, 5, (spec.kicker || `SLIDE ${index + 1}`).toUpperCase(), {
        fontSize: 12,
        fontWeight: 'bold',
        color: theme.accentColor,
      }),
      makeText(6, 13, 88, 10, spec.title, {
        fontSize: 30,
        fontFamily: theme.fontDisplay,
        fontWeight: 'bold',
      }),
      makeText(6, 23, 88, 7, spec.subtitle, {
        fontSize: 16,
        color: theme.mutedTextColor,
      }),
      makeChart(6, 33, 52, 57, spec.chart)
    );

    const cards = (spec.cards && spec.cards.length > 0 ? spec.cards : (spec.bullets || []).map((b, i) => ({
      heading: `Key Insight ${i + 1}`,
      body: b,
      metric: undefined,
    }))).slice(0, 3);

    cards.forEach((card, ci) => {
      const top = 33 + ci * 19.5;
      elements.push(
        makeShape(61, top, 33, 17, {
          shapeKind: 'roundRect',
          fillColor: theme.surfaceColor,
          borderRadius: 12,
        }),
        makeText(63.5, top + 2.2, 28, 5, card.metric ? `${card.metric} · ${card.heading}` : card.heading, {
          fontSize: 15,
          fontWeight: 'bold',
          color: theme.accentColor,
        }),
        makeText(63.5, top + 7.5, 28, 8, card.body, {
          fontSize: 13.5,
          color: theme.textColor,
          lineHeight: 1.35,
        })
      );
    });
  } else if (spec.cards && spec.cards.length >= 2 && (layout === 'problem-solution' || layout === 'business-model' || layout === 'timeline' || layout === 'team')) {
    elements.push(
      makeText(6, 7, 88, 5, (spec.kicker || `0${index}`).toUpperCase(), {
        fontSize: 12,
        fontWeight: 'bold',
        color: theme.accentColor,
      }),
      makeText(6, 13, 88, 10, spec.title, {
        fontSize: 30,
        fontFamily: theme.fontDisplay,
        fontWeight: 'bold',
      }),
      makeText(6, 23, 88, 7, spec.subtitle, {
        fontSize: 16,
        color: theme.mutedTextColor,
      })
    );

    const cards = spec.cards.slice(0, 3);
    const cols = cards.length;
    const totalW = 88;
    const gap = 3;
    const cardW = (totalW - gap * (cols - 1)) / cols;

    cards.forEach((card, ci) => {
      const left = 6 + ci * (cardW + gap);
      elements.push(
        makeShape(left, 34, cardW, 56, {
          shapeKind: 'roundRect',
          fillColor: theme.surfaceColor,
          borderRadius: 14,
        }),
        makeIcon(left + 2.5, 37.5, card.icon || ['Zap', 'Target', 'TrendingUp', 'Shield', 'Layers'][ci % 5]),
        makeText(left + 2.5, 48, cardW - 5, 8, card.metric || `0${ci + 1}`, {
          fontSize: 22,
          fontFamily: theme.fontDisplay,
          fontWeight: 'extrabold',
          color: theme.accentColor,
        }),
        makeText(left + 2.5, 57, cardW - 5, 8, card.heading, {
          fontSize: 17,
          fontWeight: 'bold',
        }),
        makeText(left + 2.5, 66, cardW - 5, 20, card.body, {
          fontSize: 14,
          color: theme.mutedTextColor,
          lineHeight: 1.45,
        })
      );
    });
  } else {
    // Content-split with editorial photography and structured bullets
    const bulletText = (spec.bullets && spec.bullets.length > 0
      ? spec.bullets
      : [spec.subtitle]
    )
      .slice(0, 5)
      .map((b) => `•  ${b}`)
      .join('\n\n');

    elements.push(
      makeText(6, 8, 46, 5, (spec.kicker || `SECTION ${index}`).toUpperCase(), {
        fontSize: 12,
        fontWeight: 'bold',
        color: theme.accentColor,
      }),
      makeText(6, 14, 46, 14, spec.title, {
        fontSize: 30,
        fontFamily: theme.fontDisplay,
        fontWeight: 'bold',
        lineHeight: 1.18,
      }),
      makeText(6, 30, 46, 10, spec.subtitle, {
        fontSize: 16,
        color: theme.mutedTextColor,
      }),
      makeText(6, 43, 46, 46, bulletText, {
        fontSize: 16,
        lineHeight: 1.5,
      }),
      makeImage(56, 10, 38, 80, imageSrc, spec.title)
    );
  }

  return {
    id: uid('sld'),
    title: spec.title,
    layout,
    backgroundColor: theme.backgroundColor,
    accentColor: theme.accentColor,
    notes: spec.notes || '',
    elements,
  };
}

export async function generatePresentationWithAI(params: GenerateDeckParams): Promise<{
  title: string;
  subtitle: string;
  themeId: string;
  slides: Slide[];
}> {
  const theme = resolveTheme(params.colorPalette, params.designStyle);
  const targetCount = Math.max(3, Math.min(15, params.slideCount || 8));

  const systemInstruction = `You are a world-class presentation designer and strategy consultant (like Gamma + Pitch).
Create a visually balanced, executive-grade ${targetCount}-slide "${params.presentationType}" deck in ${params.language || 'English'}.
Tone: ${params.tone || 'Professional'}. Design style: ${params.designStyle || 'Modern'}. Audience: ${params.audience || 'Decision Makers'}.
Rules:
1. Slide 1 MUST have layout "title" with an impactful headline and concise subtitle.
2. The final slide MUST have layout "closing" with a clear call-to-action ("ctaText").
3. Include rich visual variety across middle slides: use "problem-solution", "market" (with chart), "product", "business-model", "competitive" (with chart), "timeline", "financials" (with chart), and "team".
4. At least 2 slides MUST include structured numeric "chart" data (realistic domain-appropriate numbers, never all zeros).
5. Keep text crisp and scannable (max 3–4 concise bullets per slide, or 2–3 cards with short metric + heading + 1-sentence body).
6. For "icon" in cards, choose only from: "Zap", "Target", "TrendingUp", "Shield", "Layers", "Users", "Globe", "Award", "BarChart3", "Rocket", "CheckCircle2", "Cpu".
7. For "imageCategory", choose only from: "architecture", "product", "boardroom", "creative", "team".`;

  const userPrompt = `Topic / Prompt: ${params.prompt}
${params.title ? `Preferred Title: ${params.title}` : ''}
${params.instructions ? `Additional Instructions: ${params.instructions}` : ''}
Generate exactly ${targetCount} slides.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: userPrompt,
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          subtitle: { type: Type.STRING },
          slides: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                subtitle: { type: Type.STRING },
                layout: { type: Type.STRING },
                kicker: { type: Type.STRING },
                bullets: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                cards: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      heading: { type: Type.STRING },
                      body: { type: Type.STRING },
                      metric: { type: Type.STRING },
                      icon: { type: Type.STRING },
                    },
                    required: ['heading', 'body'],
                  },
                },
                chart: {
                  type: Type.OBJECT,
                  properties: {
                    chartType: { type: Type.STRING },
                    title: { type: Type.STRING },
                    data: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          label: { type: Type.STRING },
                          value: { type: Type.NUMBER },
                          secondaryValue: { type: Type.NUMBER },
                        },
                        required: ['label', 'value'],
                      },
                    },
                  },
                  required: ['chartType', 'title', 'data'],
                },
                imageCategory: { type: Type.STRING },
                ctaText: { type: Type.STRING },
                notes: { type: Type.STRING },
              },
              required: ['title', 'subtitle', 'layout'],
            },
          },
        },
        required: ['title', 'subtitle', 'slides'],
      },
    },
  });

  const rawText = (response.text || '').trim();
  const parsed = JSON.parse(rawText) as RawAIDeckSpec;

  const slides = (parsed.slides || []).map((spec, idx, arr) =>
    buildElementsFromSpec(spec, idx, arr.length, theme)
  );

  return {
    title: params.title?.trim() || parsed.title || 'Untitled Presentation',
    subtitle: parsed.subtitle || '',
    themeId: theme.id,
    slides,
  };
}

export async function editSlideWithAI(
  slide: Slide,
  instruction: string,
  presentationContext: { title: string; presentationType: string; themeId: string }
): Promise<Slide> {
  const theme =
    DECK_THEMES.find((t) => t.id === presentationContext.themeId) || DECK_THEMES[0];

  const systemInstruction = `You are an expert presentation editor.
Modify the provided slide according to the user's instruction while keeping it concise, executive-ready, and visually balanced for a 16:9 widescreen slide.
Presentation Title: "${presentationContext.title}" (${presentationContext.presentationType}).
If the user asks to add a chart or metrics, include a valid "chart" object with numeric data.
If the user asks for minimalist design, reduce text density and keep sharp headlines.
Return a structured slide spec JSON.`;

  const currentContentSummary = {
    title: slide.title,
    layout: slide.layout,
    texts: slide.elements
      .filter((e): e is TextElement => e.type === 'text')
      .map((e) => e.content),
    hasChart: slide.elements.some((e) => e.type === 'chart'),
    hasImage: slide.elements.some((e) => e.type === 'image'),
  };

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Current slide content: ${JSON.stringify(currentContentSummary)}
User instruction: "${instruction}"`,
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          subtitle: { type: Type.STRING },
          layout: { type: Type.STRING },
          kicker: { type: Type.STRING },
          bullets: { type: Type.ARRAY, items: { type: Type.STRING } },
          cards: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                heading: { type: Type.STRING },
                body: { type: Type.STRING },
                metric: { type: Type.STRING },
                icon: { type: Type.STRING },
              },
              required: ['heading', 'body'],
            },
          },
          chart: {
            type: Type.OBJECT,
            properties: {
              chartType: { type: Type.STRING },
              title: { type: Type.STRING },
              data: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING },
                    value: { type: Type.NUMBER },
                  },
                  required: ['label', 'value'],
                },
              },
            },
            required: ['chartType', 'title', 'data'],
          },
          imageCategory: { type: Type.STRING },
          ctaText: { type: Type.STRING },
          notes: { type: Type.STRING },
        },
        required: ['title', 'subtitle', 'layout'],
      },
    },
  });

  const spec = JSON.parse((response.text || '').trim()) as RawAISlideSpec;
  const rebuilt = buildElementsFromSpec(spec, 1, 5, theme);
  return {
    ...rebuilt,
    id: slide.id,
    backgroundColor: slide.backgroundColor || rebuilt.backgroundColor,
  };
}

export async function generateAlternativeLayoutsWithAI(
  slide: Slide,
  presentationContext: { title: string; presentationType: string; themeId: string }
): Promise<Slide[]> {
  const theme =
    DECK_THEMES.find((t) => t.id === presentationContext.themeId) || DECK_THEMES[0];

  const currentTexts = slide.elements
    .filter((e): e is TextElement => e.type === 'text')
    .map((e) => e.content)
    .join(' | ');

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Generate 3 distinct, visually compelling alternative layout specifications for this slide in "${presentationContext.title}":
Current slide title: "${slide.title}"
Current content: "${currentTexts}"
Variation 1 should use a 3-column card grid ("business-model" or "problem-solution").
Variation 2 should use a data chart + insight cards ("market" or "financials").
Variation 3 should use a clean split visual + bullet storytelling ("content-split").`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          variations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                subtitle: { type: Type.STRING },
                layout: { type: Type.STRING },
                kicker: { type: Type.STRING },
                bullets: { type: Type.ARRAY, items: { type: Type.STRING } },
                cards: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      heading: { type: Type.STRING },
                      body: { type: Type.STRING },
                      metric: { type: Type.STRING },
                      icon: { type: Type.STRING },
                    },
                    required: ['heading', 'body'],
                  },
                },
                chart: {
                  type: Type.OBJECT,
                  properties: {
                    chartType: { type: Type.STRING },
                    title: { type: Type.STRING },
                    data: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          label: { type: Type.STRING },
                          value: { type: Type.NUMBER },
                        },
                        required: ['label', 'value'],
                      },
                    },
                  },
                  required: ['chartType', 'title', 'data'],
                },
                imageCategory: { type: Type.STRING },
                notes: { type: Type.STRING },
              },
              required: ['title', 'subtitle', 'layout'],
            },
          },
        },
        required: ['variations'],
      },
    },
  });

  const parsed = JSON.parse((response.text || '').trim()) as {
    variations: RawAISlideSpec[];
  };
  return (parsed.variations || []).slice(0, 3).map((spec, idx) => ({
    ...buildElementsFromSpec(spec, idx + 1, 6, theme),
    id: slide.id,
  }));
}
