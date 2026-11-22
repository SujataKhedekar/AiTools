import { ThinkingLevel, Type } from '@google/genai';
import type {
  BusinessBrief,
  CtaSuite,
  LandingPageStrategy,
  PageSection,
  SectionType,
} from '../../types/aivora';
import { generateStructuredJson, recordCacheHit } from '../geminiClient';
import { getCachedValue, makeCacheKey, setCachedValue } from '../security';

const ctaVariationSchema = {
  type: Type.OBJECT,
  properties: {
    text: { type: Type.STRING },
    placement: { type: Type.STRING },
    intendedAction: { type: Type.STRING },
    supportingMessage: { type: Type.STRING },
    destination: { type: Type.STRING },
  },
  required: ['text', 'placement', 'intendedAction', 'supportingMessage', 'destination'],
};

const pageGenerationSchema = {
  type: Type.OBJECT,
  properties: {
    sections: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING },
          navLabel: { type: Type.STRING },
          eyebrow: { type: Type.STRING },
          headline: { type: Type.STRING },
          subheadline: { type: Type.STRING },
          description: { type: Type.STRING },
          primaryCtaText: { type: Type.STRING },
          primaryCtaDestination: { type: Type.STRING },
          secondaryCtaText: { type: Type.STRING },
          secondaryCtaDestination: { type: Type.STRING },
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
          contactAddress: { type: Type.STRING },
          legalNote: { type: Type.STRING },
        },
        required: ['type', 'navLabel', 'headline', 'description'],
      },
    },
    ctaSuite: {
      type: Type.OBJECT,
      properties: {
        objectiveAlignment: { type: Type.STRING },
        complianceNote: { type: Type.STRING },
        slots: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              slot: { type: Type.STRING },
              recommended: ctaVariationSchema,
              variations: {
                type: Type.ARRAY,
                items: ctaVariationSchema,
              },
            },
            required: ['slot', 'recommended', 'variations'],
          },
        },
      },
      required: ['objectiveAlignment', 'complianceNote', 'slots'],
    },
  },
  required: ['sections', 'ctaSuite'],
};

function selectDefaultHeroImage(brief: BusinessBrief): string {
  if (brief.referenceImageUrls.length > 0 && brief.referenceImageUrls[0]) {
    return brief.referenceImageUrls[0];
  }
  const cat = `${brief.category} ${brief.designStyle}`.toLowerCase();
  if (cat.includes('health') || cat.includes('clinic') || cat.includes('rehab') || cat.includes('medical')) {
    return '/landing-page/assets/hero_healthcare_clinic_1795364463489.jpg';
  }
  if (cat.includes('ecommerce') || cat.includes('fashion') || cat.includes('product') || cat.includes('audio')) {
    return '/landing-page/assets/hero_ecommerce_product_1795364463582.jpg';
  }
  if (cat.includes('agency') || cat.includes('consult') || cat.includes('cpa') || cat.includes('finance') || cat.includes('editorial')) {
    return '/landing-page/assets/hero_agency_editorial_1795364463495.jpg';
  }
  return '/landing-page/assets/hero_saas_workspace_1795364462832.jpg';
}

function resolveDefaultDestination(brief: BusinessBrief): string {
  if (brief.integrations.bookingUrl) return brief.integrations.bookingUrl;
  if (brief.integrations.purchaseUrl) return brief.integrations.purchaseUrl;
  if (brief.integrations.formKind !== 'none') return '#conversion-form';
  if (brief.integrations.whatsappNumber) {
    const clean = brief.integrations.whatsappNumber.replace(/[^\d]/g, '');
    if (clean) return `https://wa.me/${clean}`;
  }
  if (brief.integrations.phoneNumber) return `tel:${brief.integrations.phoneNumber}`;
  if (brief.integrations.contactEmail) return `mailto:${brief.integrations.contactEmail}`;
  return '#conversion-form';
}

export async function generatePageAndCtas(params: {
  brief: BusinessBrief;
  strategy: LandingPageStrategy;
}): Promise<{ sections: PageSection[]; ctaSuite: CtaSuite }> {
  const { brief, strategy } = params;
  const cacheKey = makeCacheKey('page-v1', { brief, strategy });
  const cached = getCachedValue<{ sections: PageSection[]; ctaSuite: CtaSuite }>(cacheKey);
  if (cached) {
    recordCacheHit();
    return cached;
  }

  const enabledSectionTypes = strategy.recommendedSections
    .filter((s) => s.included)
    .map((s) => s.type);

  const hasVerifiedSocialProof =
    brief.verifiedTestimonials.length > 0 ||
    brief.verifiedStats.length > 0 ||
    brief.verifiedClientLogos.length > 0;
  const hasVerifiedPricing = brief.verifiedPricingPlans.length > 0;
  const primaryDestination = resolveDefaultDestination(brief);

  const systemInstruction = `You are a world-class direct-response copywriter, CRO specialist, and SEO content architect.
Generate the complete landing page sections AND the 7-slot Advanced CTA Suite based on the strategy and business brief.

COPYWRITING RULES:
1. Apply the ${strategy.recommendedFramework} copywriting framework naturally across the section sequence.
2. Ban generic AI filler ("supercharge", "empower", "unlock", "elevate", "revolutionize", "seamless", "in today's fast-paced world", "take your business to the next level").
3. Write clear, specific, benefit-oriented prose with strong scannable headlines and short readable paragraphs.
4. Naturally integrate the primary keyword "${brief.primaryKeyword || brief.productName}" in the Hero headline/subheadline and relevant H2s without keyword stuffing.

STRICT TRUTH & COMPLIANCE RULES:
5. NEVER fabricate testimonials, customer reviews, ratings, client logos, statistics, or case study numbers.
6. NEVER fabricate pricing numbers.
7. NEVER promise discounts, free trials, free consultations, or guarantees in copy OR CTAs unless explicitly confirmed below:
   - Free Trial Confirmed: ${brief.confirmedOffers.freeTrial}
   - Free Consultation Confirmed: ${brief.confirmedOffers.freeConsultation}
   - Confirmed Discount Text: "${brief.confirmedOffers.discountText || 'NONE — do NOT mention any discount'}"
   - Confirmed Guarantee Text: "${brief.confirmedOffers.guaranteeText || 'NONE — do NOT promise any guarantee'}"
8. Avoid generic CTA repetition (e.g., do not just write "Learn More" or "Submit" everywhere). Tailor every CTA slot to "${brief.objective}".

REQUIRED CTA SLOTS (generate ALL 7 in ctaSuite.slots, each with 1 recommended + 2 distinct variations):
- "Primary CTA"
- "Secondary CTA"
- "Hero CTA"
- "Mid-page CTA"
- "Final CTA"
- "Sticky CTA"
- "Mobile CTA"`;

  const userPrompt = `Generate sections ONLY for these enabled section types in this exact order:
${enabledSectionTypes.map((t, i) => `${i + 1}. ${t}`).join('\n')}

Business Brief:
- Business Name: ${brief.businessName}
- Category: ${brief.category}
- Product/Service: ${brief.productName}
- Description: ${brief.productDescription}
- Target Audience: ${brief.targetAudience}
- Location: ${brief.targetLocation}
- Objective: ${brief.objective}
- Primary Keyword: ${brief.primaryKeyword || brief.productName}
- Secondary Keywords: ${brief.secondaryKeywords.join(', ') || 'None'}
- USP: ${brief.usp}
- Tone: ${brief.toneOfVoice}
- Strategy Primary Message: ${strategy.primaryMessage}
- Key Selling Points: ${strategy.keySellingPoints.join(' | ')}
- Main Objections to Address in FAQ/Copy: ${strategy.mainObjections.join(' | ')}
- Primary CTA Destination URL/Anchor: ${primaryDestination}
- Contact Email: ${brief.integrations.contactEmail || 'Not configured'}
- Phone: ${brief.integrations.phoneNumber || 'Not configured'}
- Booking URL: ${brief.integrations.bookingUrl || 'Not configured'}
- Purchase URL: ${brief.integrations.purchaseUrl || 'Not configured'}

For "hero": provide 2–3 factual trustIndicators grounded ONLY in verified brief details (e.g., location, licensed status, USP facts — NO fake "10,000+ users" or "4.9/5 stars").
For "features": provide 3–4 items with title, description, and customer benefit.
For "how_it_works": provide 3–4 sequential steps with stepNumber ("01", "02", etc.), title, description.
For "faq": provide 4–5 realistic objection-handling Q&As.`;

  const generated = await generateStructuredJson<{
    sections: Array<Omit<PageSection, 'id' | 'enabled'>>;
    ctaSuite: CtaSuite;
  }>({
    systemInstruction,
    userPrompt,
    responseSchema: pageGenerationSchema,
    thinkingLevel: ThinkingLevel.MEDIUM,
  });

  const defaultHeroImage = selectDefaultHeroImage(brief);

  const sections: PageSection[] = generated.sections
    .filter((s) => enabledSectionTypes.includes(s.type as SectionType))
    .map((s, idx) => {
      const sectionType = s.type as SectionType;
      const base: PageSection = {
        id: `sec-${sectionType}-${idx + 1}`,
        type: sectionType,
        enabled: true,
        navLabel: s.navLabel || sectionType.replace(/_/g, ' '),
        eyebrow: s.eyebrow,
        headline: s.headline,
        subheadline: s.subheadline,
        description: s.description,
        primaryCtaText: s.primaryCtaText,
        primaryCtaDestination: s.primaryCtaDestination || primaryDestination,
        secondaryCtaText: s.secondaryCtaText,
        secondaryCtaDestination: s.secondaryCtaDestination || '#how-it-works',
        imageUrl:
          sectionType === 'hero'
            ? defaultHeroImage
            : sectionType === 'solution'
              ? brief.referenceImageUrls[1] || defaultHeroImage
              : undefined,
        imageAlt:
          s.imageAlt ||
          `${brief.businessName} — ${brief.productName} ${sectionType.replace(/_/g, ' ')} visual`,
        imageSuggestion: s.imageSuggestion,
        trustIndicators: s.trustIndicators,
        items: s.items?.map((item, itemIdx) => ({
          ...item,
          id: item.id || `item-${idx}-${itemIdx + 1}`,
        })),
        faqs: s.faqs?.map((faq, faqIdx) => ({
          ...faq,
          id: faq.id || `faq-${idx}-${faqIdx + 1}`,
        })),
        contactAddress: s.contactAddress || brief.targetLocation,
        legalNote:
          s.legalNote ||
          `© ${new Date().getFullYear()} ${brief.businessName}. All rights reserved.`,
        userEdited: false,
      };

      if (sectionType === 'social_proof') {
        if (!hasVerifiedSocialProof) {
          base.enabled = false;
        }
        base.testimonials = brief.verifiedTestimonials;
        base.stats = brief.verifiedStats;
        base.clientLogos = brief.verifiedClientLogos;
      }

      if (sectionType === 'pricing') {
        if (!hasVerifiedPricing) {
          base.enabled = false;
        }
        base.pricingPlans = brief.verifiedPricingPlans;
      }

      return base;
    });

  const result = { sections, ctaSuite: generated.ctaSuite };
  setCachedValue(cacheKey, result);
  return result;
}
