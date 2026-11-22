import { ThinkingLevel, Type } from '@google/genai';
import type { BusinessBrief, LandingPageStrategy } from '../../types/aivora';
import { generateStructuredJson, recordCacheHit } from '../geminiClient';
import { getCachedValue, makeCacheKey, setCachedValue } from '../security';

const strategyResponseSchema = {
  type: Type.OBJECT,
  properties: {
    businessPositioning: { type: Type.STRING },
    targetAudienceProfile: { type: Type.STRING },
    customerProblems: { type: Type.ARRAY, items: { type: Type.STRING } },
    customerNeeds: { type: Type.ARRAY, items: { type: Type.STRING } },
    buyingMotivations: { type: Type.ARRAY, items: { type: Type.STRING } },
    mainObjections: { type: Type.ARRAY, items: { type: Type.STRING } },
    productBenefits: { type: Type.ARRAY, items: { type: Type.STRING } },
    uniqueSellingProposition: { type: Type.STRING },
    competitorPositioning: { type: Type.STRING },
    conversionObjective: { type: Type.STRING },
    searchIntent: { type: Type.STRING },
    primaryMessage: { type: Type.STRING },
    keySellingPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
    recommendedFramework: { type: Type.STRING },
    frameworkRationale: { type: Type.STRING },
    recommendedSections: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING },
          title: { type: Type.STRING },
          purpose: { type: Type.STRING },
          included: { type: Type.BOOLEAN },
        },
        required: ['type', 'title', 'purpose', 'included'],
      },
    },
    ctaStrategy: { type: Type.STRING },
    recommendedTone: { type: Type.STRING },
  },
  required: [
    'businessPositioning',
    'targetAudienceProfile',
    'customerProblems',
    'customerNeeds',
    'buyingMotivations',
    'mainObjections',
    'productBenefits',
    'uniqueSellingProposition',
    'competitorPositioning',
    'conversionObjective',
    'searchIntent',
    'primaryMessage',
    'keySellingPoints',
    'recommendedFramework',
    'frameworkRationale',
    'recommendedSections',
    'ctaStrategy',
    'recommendedTone',
  ],
};

export async function generateLandingPageStrategy(
  brief: BusinessBrief
): Promise<LandingPageStrategy> {
  const cacheKey = makeCacheKey('strategy-v1', brief);
  const cached = getCachedValue<LandingPageStrategy>(cacheKey);
  if (cached) {
    recordCacheHit();
    return cached;
  }

  const hasVerifiedSocialProof =
    brief.verifiedTestimonials.length > 0 ||
    brief.verifiedStats.length > 0 ||
    brief.verifiedClientLogos.length > 0;
  const hasVerifiedPricing = brief.verifiedPricingPlans.length > 0;

  const systemInstruction = `You are a senior Conversion Rate Optimization (CRO) strategist and SEO architect.
Analyze the user's business brief and produce a concrete, disciplined landing page strategy.

STRICT RULES:
1. Never invent business claims, awards, guarantees, discounts, client counts, or fake statistics.
2. Select recommendedFramework strictly from: "AIDA", "PAS", "FAB", "Before-After-Bridge", "Problem-Solution-Benefit".
3. Select searchIntent strictly from: "Commercial", "Transactional", "Informational", "Navigational".
4. For recommendedSections, only use section types from: "hero", "problem", "solution", "features", "how_it_works", "why_choose_us", "social_proof", "pricing", "faq", "final_cta", "footer".
   - Tailor which sections have included: true to the business type and conversion objective — do NOT blindly include every section.
   - Set social_proof included: ${hasVerifiedSocialProof} (only include when verified user-supplied testimonials/stats/logos exist).
   - Set pricing included: ${hasVerifiedPricing} (only include when verified pricing plans are supplied).
   - Always include "hero", "final_cta", and "footer".
5. Avoid generic AI hype ("supercharge", "empower", "unlock", "elevate", "game-changing"). Write clear, concrete strategy prose.`;

  const userPrompt = `Business Brief:
- Business Name: ${brief.businessName}
- Website: ${brief.websiteUrl || 'Not supplied'}
- Category: ${brief.category}
- Product/Service: ${brief.productName}
- Description: ${brief.productDescription}
- Target Audience: ${brief.targetAudience}
- Location: ${brief.targetLocation}
- Objective: ${brief.objective}
- Primary Keyword: ${brief.primaryKeyword || '(derive from product & category)'}
- Secondary Keywords: ${brief.secondaryKeywords.join(', ') || '(none provided)'}
- USP: ${brief.usp || '(derive directly from description without inventing facts)'}
- Competitor URLs: ${brief.competitorUrls.join(', ') || 'None provided'}
- Preferred Design Style: ${brief.designStyle}
- Preferred Tone: ${brief.toneOfVoice}
- Has Verified Social Proof: ${hasVerifiedSocialProof ? 'Yes' : 'No (do not invent any)'}
- Has Verified Pricing: ${hasVerifiedPricing ? 'Yes' : 'No (do not invent prices)'}
- Confirmed Offers: freeTrial=${brief.confirmedOffers.freeTrial}, freeConsultation=${brief.confirmedOffers.freeConsultation}, discount="${brief.confirmedOffers.discountText}", guarantee="${brief.confirmedOffers.guaranteeText}"`;

  const raw = await generateStructuredJson<LandingPageStrategy>({
    systemInstruction,
    userPrompt,
    responseSchema: strategyResponseSchema,
    thinkingLevel: ThinkingLevel.MEDIUM,
  });

  // Enforce strict truth guards on social_proof and pricing
  const allowedTypes = new Set([
    'hero',
    'problem',
    'solution',
    'features',
    'how_it_works',
    'why_choose_us',
    'social_proof',
    'pricing',
    'faq',
    'final_cta',
    'footer',
  ]);

  const cleanedSections = raw.recommendedSections
    .filter((s) => allowedTypes.has(s.type))
    .map((s) => {
      if (s.type === 'social_proof' && !hasVerifiedSocialProof) {
        return { ...s, included: false };
      }
      if (s.type === 'pricing' && !hasVerifiedPricing) {
        return { ...s, included: false };
      }
      return s;
    });

  const normalized: LandingPageStrategy = {
    ...raw,
    recommendedSections: cleanedSections,
  };

  setCachedValue(cacheKey, normalized);
  return normalized;
}
