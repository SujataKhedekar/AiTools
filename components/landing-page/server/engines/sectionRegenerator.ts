import { ThinkingLevel, Type } from '@google/genai';
import type {
  BusinessBrief,
  LandingPageStrategy,
  PageSection,
} from '../../types/aivora';
import { generateStructuredJson } from '../geminiClient';

const regeneratedSectionSchema = {
  type: Type.OBJECT,
  properties: {
    eyebrow: { type: Type.STRING },
    headline: { type: Type.STRING },
    subheadline: { type: Type.STRING },
    description: { type: Type.STRING },
    primaryCtaText: { type: Type.STRING },
    secondaryCtaText: { type: Type.STRING },
    imageSuggestion: { type: Type.STRING },
    imageAlt: { type: Type.STRING },
    trustIndicators: { type: Type.ARRAY, items: { type: Type.STRING } },
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          benefit: { type: Type.STRING },
          metric: { type: Type.STRING },
          stepNumber: { type: Type.STRING },
        },
        required: ['title', 'description'],
      },
    },
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
  required: ['headline', 'description'],
};

export async function regenerateSingleSection(params: {
  brief: BusinessBrief;
  strategy: LandingPageStrategy;
  targetSection: PageSection;
  otherSectionsSummary: string;
  userDirection?: string;
}): Promise<PageSection> {
  const { brief, strategy, targetSection, otherSectionsSummary, userDirection } = params;

  const systemInstruction = `You are a direct-response conversion copywriter regenerating ONE specific landing page section while keeping complete continuity with the rest of the page.
STRICT RULES:
1. Write crisp, persuasive, customer-focused copy aligned with the ${strategy.recommendedFramework} framework.
2. Ban AI buzzwords ("supercharge", "empower", "unlock", "elevate", "revolutionize", "seamless").
3. NEVER invent discounts, free trials, free consultations, guarantees, prices, or statistics unless explicitly confirmed in the brief.
4. Keep headlines scannable and free of filler.`;

  const userPrompt = `Business: ${brief.businessName} (${brief.category})
Product/Service: ${brief.productName} — ${brief.productDescription}
Target Audience: ${brief.targetAudience}
Objective: ${brief.objective}
Tone: ${brief.toneOfVoice}
Primary Keyword: ${brief.primaryKeyword}
Confirmed Offers: freeTrial=${brief.confirmedOffers.freeTrial}, freeConsultation=${brief.confirmedOffers.freeConsultation}, discount="${brief.confirmedOffers.discountText}", guarantee="${brief.confirmedOffers.guaranteeText}"

Section to Regenerate:
- Type: ${targetSection.type}
- Current Headline: ${targetSection.headline}
- Current Description: ${targetSection.description}
- User Direction: ${userDirection || 'Improve clarity, specificity, and conversion focus while keeping a fresh angle.'}

Surrounding Page Context (preserve alignment with these edited sections):
${otherSectionsSummary}`;

  const updated = await generateStructuredJson<{
    eyebrow?: string;
    headline: string;
    subheadline?: string;
    description: string;
    primaryCtaText?: string;
    secondaryCtaText?: string;
    imageSuggestion?: string;
    imageAlt?: string;
    trustIndicators?: string[];
    items?: { title: string; description: string; benefit?: string; metric?: string; stepNumber?: string }[];
    faqs?: { question: string; answer: string }[];
  }>({
    systemInstruction,
    userPrompt,
    responseSchema: regeneratedSectionSchema,
    thinkingLevel: ThinkingLevel.MEDIUM,
  });

  return {
    ...targetSection,
    eyebrow: updated.eyebrow ?? targetSection.eyebrow,
    headline: updated.headline || targetSection.headline,
    subheadline: updated.subheadline ?? targetSection.subheadline,
    description: updated.description || targetSection.description,
    primaryCtaText: updated.primaryCtaText ?? targetSection.primaryCtaText,
    secondaryCtaText: updated.secondaryCtaText ?? targetSection.secondaryCtaText,
    imageSuggestion: updated.imageSuggestion ?? targetSection.imageSuggestion,
    imageAlt: updated.imageAlt ?? targetSection.imageAlt,
    trustIndicators:
      updated.trustIndicators && updated.trustIndicators.length > 0
        ? updated.trustIndicators
        : targetSection.trustIndicators,
    items:
      updated.items && updated.items.length > 0
        ? updated.items.map((item, idx) => ({
            id: `${targetSection.id}-item-${idx + 1}`,
            ...item,
          }))
        : targetSection.items,
    faqs:
      updated.faqs && updated.faqs.length > 0
        ? updated.faqs.map((faq, idx) => ({
            id: `${targetSection.id}-faq-${idx + 1}`,
            ...faq,
          }))
        : targetSection.faqs,
    userEdited: false,
  };
}
