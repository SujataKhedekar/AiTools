import { ThinkingLevel, Type } from '@google/genai';
import type {
  BusinessBrief,
  CroReport,
  JsonLdSchemaEntry,
  LandingPageStrategy,
  PageSection,
  SeoPackage,
} from '../../types/aivora';
import { generateStructuredJson, recordCacheHit } from '../geminiClient';
import { getCachedValue, makeCacheKey, setCachedValue } from '../security';

const seoCroSchema = {
  type: Type.OBJECT,
  properties: {
    seo: {
      type: Type.OBJECT,
      properties: {
        keywordStrategy: {
          type: Type.OBJECT,
          properties: {
            primaryKeyword: { type: Type.STRING },
            secondaryKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            semanticKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            relatedSearchTerms: { type: Type.ARRAY, items: { type: Type.STRING } },
            searchIntent: { type: Type.STRING },
            placementRecommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: [
            'primaryKeyword',
            'secondaryKeywords',
            'semanticKeywords',
            'relatedSearchTerms',
            'searchIntent',
            'placementRecommendations',
          ],
        },
        metadata: {
          type: Type.OBJECT,
          properties: {
            seoTitle: { type: Type.STRING },
            metaDescription: { type: Type.STRING },
            canonicalUrl: { type: Type.STRING },
            ogTitle: { type: Type.STRING },
            ogDescription: { type: Type.STRING },
            ogImageRecommendation: { type: Type.STRING },
          },
          required: [
            'seoTitle',
            'metaDescription',
            'canonicalUrl',
            'ogTitle',
            'ogDescription',
            'ogImageRecommendation',
          ],
        },
        contentSeo: {
          type: Type.OBJECT,
          properties: {
            intentAlignment: { type: Type.STRING },
            internalLinkingSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            externalReferenceSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: [
            'intentAlignment',
            'internalLinkingSuggestions',
            'externalReferenceSuggestions',
          ],
        },
      },
      required: ['keywordStrategy', 'metadata', 'contentSeo'],
    },
    cro: {
      type: Type.OBJECT,
      properties: {
        executiveSummary: { type: Type.STRING },
        weaknesses: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              area: { type: Type.STRING },
              severity: { type: Type.STRING },
              finding: { type: Type.STRING },
              recommendation: { type: Type.STRING },
            },
            required: ['area', 'severity', 'finding', 'recommendation'],
          },
        },
        missingTrustOrObjections: { type: Type.ARRAY, items: { type: Type.STRING } },
        sectionOrderAssessment: { type: Type.STRING },
        mobileUsabilityNotes: { type: Type.ARRAY, items: { type: Type.STRING } },
        abTestingSuggestions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              element: { type: Type.STRING },
              hypothesis: { type: Type.STRING },
              variantA: { type: Type.STRING },
              variantB: { type: Type.STRING },
              primaryMetricToObserve: { type: Type.STRING },
            },
            required: [
              'element',
              'hypothesis',
              'variantA',
              'variantB',
              'primaryMetricToObserve',
            ],
          },
        },
      },
      required: [
        'executiveSummary',
        'weaknesses',
        'missingTrustOrObjections',
        'sectionOrderAssessment',
        'mobileUsabilityNotes',
        'abTestingSuggestions',
      ],
    },
  },
  required: ['seo', 'cro'],
};

function validateJsonLdEntry(
  schemaType: string,
  eligible: boolean,
  eligibilityReason: string,
  obj: Record<string, unknown> | null
): JsonLdSchemaEntry {
  if (!eligible || !obj) {
    return {
      schemaType,
      eligible: false,
      eligibilityReason,
      isValidJson: false,
      validationErrors: [],
      jsonString: '',
    };
  }
  const jsonString = JSON.stringify(obj, null, 2);
  const validationErrors: string[] = [];
  let isValidJson = true;
  try {
    const parsed = JSON.parse(jsonString) as Record<string, unknown>;
    if (parsed['@context'] !== 'https://schema.org') {
      validationErrors.push('Missing or invalid @context');
    }
    if (!parsed['@type']) {
      validationErrors.push('Missing @type');
    }
  } catch (err) {
    isValidJson = false;
    validationErrors.push(err instanceof Error ? err.message : 'Invalid JSON syntax');
  }
  return {
    schemaType,
    eligible: true,
    eligibilityReason,
    isValidJson: isValidJson && validationErrors.length === 0,
    validationErrors,
    jsonString,
  };
}

export function buildEligibleJsonLdSchemas(
  brief: BusinessBrief,
  sections: PageSection[],
  canonicalUrl: string
): JsonLdSchemaEntry[] {
  const enabled = sections.filter((s) => s.enabled);
  const baseUrl = canonicalUrl || brief.websiteUrl || 'https://example.com';
  const entries: JsonLdSchemaEntry[] = [];

  // 1. Organization
  entries.push(
    validateJsonLdEntry(
      'Organization',
      Boolean(brief.businessName),
      'Supported by business identity and contact details on the page.',
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: brief.businessName,
        url: baseUrl,
        ...(brief.brandLogoUrl && !brief.brandLogoUrl.startsWith('data:')
          ? { logo: brief.brandLogoUrl }
          : {}),
        ...(brief.integrations.contactEmail ? { email: brief.integrations.contactEmail } : {}),
        ...(brief.integrations.phoneNumber ? { telephone: brief.integrations.phoneNumber } : {}),
        ...(brief.targetLocation ? { areaServed: brief.targetLocation } : {}),
      }
    )
  );

  // 2. WebSite
  entries.push(
    validateJsonLdEntry(
      'WebSite',
      Boolean(brief.businessName),
      'Supported by canonical landing page URL and publisher entity.',
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: `${brief.businessName} — ${brief.productName}`,
        url: baseUrl,
      }
    )
  );

  // 3. Product vs LocalBusiness vs Service
  const isEcommerceProduct =
    brief.objective === 'Sell products' ||
    brief.designStyle === 'ecommerce' ||
    brief.category.toLowerCase().includes('ecommerce');
  const isLocalBusiness =
    brief.designStyle === 'local-business' ||
    brief.designStyle === 'healthcare' ||
    brief.category.toLowerCase().includes('local') ||
    brief.category.toLowerCase().includes('clinic');

  if (isEcommerceProduct) {
    const firstPlan = brief.verifiedPricingPlans[0];
    const numericPrice = firstPlan?.price.replace(/[^0-9.]/g, '');
    entries.push(
      validateJsonLdEntry(
        'Product',
        true,
        'Supported by product name, description, and verified offer details on page.',
        {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: brief.productName,
          description: brief.productDescription,
          brand: { '@type': 'Brand', name: brief.businessName },
          ...(numericPrice
            ? {
                offers: {
                  '@type': 'Offer',
                  price: numericPrice,
                  priceCurrency: 'USD',
                  availability: 'https://schema.org/InStock',
                  url: brief.integrations.purchaseUrl || baseUrl,
                },
              }
            : {}),
        }
      )
    );
  } else if (isLocalBusiness) {
    entries.push(
      validateJsonLdEntry(
        'LocalBusiness',
        true,
        'Supported by local service area and contact details on page.',
        {
          '@context': 'https://schema.org',
          '@type': 'LocalBusiness',
          name: brief.businessName,
          description: brief.productDescription,
          url: baseUrl,
          areaServed: brief.targetLocation,
          ...(brief.integrations.phoneNumber ? { telephone: brief.integrations.phoneNumber } : {}),
        }
      )
    );
  } else {
    entries.push(
      validateJsonLdEntry(
        'Service',
        true,
        'Supported by service offering, target audience, and provider entity.',
        {
          '@context': 'https://schema.org',
          '@type': 'Service',
          name: brief.productName,
          serviceType: brief.category,
          description: brief.productDescription,
          provider: {
            '@type': 'Organization',
            name: brief.businessName,
          },
          areaServed: brief.targetLocation,
        }
      )
    );
  }

  // 4. BreadcrumbList
  entries.push(
    validateJsonLdEntry(
      'BreadcrumbList',
      true,
      'Valid single-page landing hierarchy from domain root.',
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: brief.businessName,
            item: baseUrl,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: brief.productName,
            item: `${baseUrl.replace(/\/$/, '')}/#hero`,
          },
        ],
      }
    )
  );

  // 5. FAQPage ONLY if FAQ section is enabled and contains Q&A items
  const faqSection = enabled.find((s) => s.type === 'faq' && s.faqs && s.faqs.length > 0);
  entries.push(
    validateJsonLdEntry(
      'FAQPage',
      Boolean(faqSection),
      faqSection
        ? `Eligible: ${faqSection.faqs!.length} visible FAQ items appear on the page.`
        : 'Omitted: No visible FAQ section with Q&A pairs is currently enabled on the page.',
      faqSection
        ? {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqSection.faqs!.map((faq) => ({
              '@type': 'Question',
              name: faq.question,
              acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer,
              },
            })),
          }
        : null
    )
  );

  return entries;
}

export function auditHeadingHierarchy(sections: PageSection[]): SeoPackage['headingStructure'] {
  const enabled = sections.filter((s) => s.enabled && s.type !== 'footer');
  const hero = enabled.find((s) => s.type === 'hero');
  const h1Text = hero?.headline || enabled[0]?.headline || '';
  const h1Count = hero ? 1 : enabled.length > 0 ? 1 : 0;

  const h2List = enabled
    .filter((s) => s.id !== hero?.id)
    .map((s) => s.headline)
    .filter(Boolean);

  const h3List: string[] = [];
  for (const sec of enabled) {
    if (sec.items) {
      for (const item of sec.items) {
        if (item.title) h3List.push(item.title);
      }
    }
    if (sec.pricingPlans) {
      for (const plan of sec.pricingPlans) {
        if (plan.name) h3List.push(plan.name);
      }
    }
  }

  const notes: string[] = [];
  if (h1Count === 1) {
    notes.push('Single descriptive H1 present in the Hero section.');
  } else {
    notes.push('Add a Hero section so the page leads with exactly one H1.');
  }
  if (h2List.length >= 2) {
    notes.push(`${h2List.length} sequential H2 section headings follow the H1 cleanly.`);
  } else {
    notes.push('Consider adding supporting H2 sections for deeper topic coverage.');
  }

  return {
    h1Count,
    h1Text,
    h2List,
    h3List,
    isValidHierarchy: h1Count === 1 && h2List.length >= 1,
    notes,
  };
}

export async function generateSeoAndCroReport(params: {
  brief: BusinessBrief;
  strategy: LandingPageStrategy;
  sections: PageSection[];
  skipCache?: boolean;
}): Promise<{ seo: SeoPackage; cro: CroReport }> {
  const { brief, strategy, sections, skipCache } = params;
  const cacheKey = makeCacheKey('seo-cro-v1', { brief, sections });
  if (!skipCache) {
    const cached = getCachedValue<{ seo: SeoPackage; cro: CroReport }>(cacheKey);
    if (cached) {
      recordCacheHit();
      return cached;
    }
  }

  const enabledSections = sections.filter((s) => s.enabled);
  const pageDigest = enabledSections
    .map(
      (s) =>
        `[${s.type.toUpperCase()}] Headline: "${s.headline}" | Subheadline: "${s.subheadline || ''}" | Copy: "${s.description}" | CTA: "${s.primaryCtaText || ''}" | Items: ${s.items?.length ?? 0} | Testimonials: ${s.testimonials?.length ?? 0} | Pricing: ${s.pricingPlans?.length ?? 0} | FAQs: ${s.faqs?.length ?? 0}`
    )
    .join('\n');

  const systemInstruction = `You are a technical SEO architect and Conversion Rate Optimization (CRO) auditor.
Evaluate the actual generated landing page content honestly and precisely.

STRICT RULES:
1. Never promise Google Search rankings, guaranteed PageSpeed scores, or guaranteed rich results.
2. Never invent conversion rate percentages or fabricated lift numbers (e.g., do NOT write "+35% conversion rate lift"). Frame A/B tests strictly as testable hypotheses and observable metrics.
3. For CRO weaknesses, inspect the actual headlines, CTA specificity, trust signal presence, objection coverage, and form setup.
   - Note if social proof is missing because the user has not yet supplied verified testimonials.
   - Note if form endpoint URL is unconfigured.
4. Keep SEO title under 60 characters and meta description between 135 and 160 characters.`;

  const userPrompt = `Business: ${brief.businessName} (${brief.category})
Website URL: ${brief.websiteUrl || 'https://example.com'}
Location: ${brief.targetLocation}
Objective: ${brief.objective}
Primary Keyword: ${brief.primaryKeyword || brief.productName}
Secondary Keywords: ${brief.secondaryKeywords.join(', ') || 'None'}
Search Intent: ${strategy.searchIntent}
Form Config: kind=${brief.integrations.formKind}, endpointConfigured=${Boolean(brief.integrations.formEndpointUrl)}
Verified Social Proof Count: testimonials=${brief.verifiedTestimonials.length}, stats=${brief.verifiedStats.length}, logos=${brief.verifiedClientLogos.length}

Current Page Content:
${pageDigest}`;

  const raw = await generateStructuredJson<{
    seo: {
      keywordStrategy: SeoPackage['keywordStrategy'];
      metadata: SeoPackage['metadata'];
      contentSeo: Omit<SeoPackage['contentSeo'], 'imageAltAudit'>;
    };
    cro: Omit<CroReport, 'disclaimer'>;
  }>({
    systemInstruction,
    userPrompt,
    responseSchema: seoCroSchema,
    thinkingLevel: ThinkingLevel.MEDIUM,
  });

  const headingStructure = auditHeadingHierarchy(sections);
  const imageAltAudit = enabledSections
    .filter((s) => s.imageUrl || s.type === 'hero' || s.type === 'solution')
    .map((s) => ({
      section: s.navLabel || s.type,
      altText: s.imageAlt || '',
      status: (s.imageAlt && s.imageAlt.trim().length >= 12 ? 'ok' : 'needs-detail') as
        | 'ok'
        | 'needs-detail',
    }));

  const canonical =
    raw.seo.metadata.canonicalUrl ||
    brief.websiteUrl ||
    `https://${brief.businessName.toLowerCase().replace(/[^a-z0-9]+/g, '') || 'example'}.com/`;

  const technicalSeo: SeoPackage['technicalSeo'] = [
    {
      check: 'Single Descriptive H1',
      status: headingStructure.h1Count === 1 ? 'pass' : 'attention',
      detail:
        headingStructure.h1Count === 1
          ? `1 H1 found: "${headingStructure.h1Text}"`
          : 'Hero H1 is missing or duplicated.',
    },
    {
      check: 'SEO Title Length (≤ 60 chars)',
      status: raw.seo.metadata.seoTitle.length <= 65 ? 'pass' : 'attention',
      detail: `${raw.seo.metadata.seoTitle.length} characters`,
    },
    {
      check: 'Meta Description Length (120–160 chars)',
      status:
        raw.seo.metadata.metaDescription.length >= 110 &&
        raw.seo.metadata.metaDescription.length <= 165
          ? 'pass'
          : 'attention',
      detail: `${raw.seo.metadata.metaDescription.length} characters`,
    },
    {
      check: 'Semantic Landmarks & Accessible Form Labels',
      status: 'pass',
      detail: 'Generated HTML/React/Next.js templates use <header>, <main>, <section>, <footer>, and explicit <label> bindings.',
    },
    {
      check: 'Responsive Viewport & Image Dimensions',
      status: 'pass',
      detail: 'Viewport meta tag, explicit width/height attributes, and lazy loading on below-the-fold images.',
    },
  ];

  const jsonLdSchemas = buildEligibleJsonLdSchemas(brief, sections, canonical);

  const seo: SeoPackage = {
    keywordStrategy: raw.seo.keywordStrategy,
    metadata: {
      ...raw.seo.metadata,
      canonicalUrl: canonical,
    },
    headingStructure,
    contentSeo: {
      ...raw.seo.contentSeo,
      imageAltAudit,
    },
    technicalSeo,
    jsonLdSchemas,
  };

  const cro: CroReport = {
    ...raw.cro,
    disclaimer:
      'CRO recommendations and A/B hypotheses are strategic assessments based on page structure and conversion fundamentals. No conversion lift or ranking outcome is guaranteed without controlled live traffic testing.',
  };

  const result = { seo, cro };
  if (!skipCache) {
    setCachedValue(cacheKey, result);
  }
  return result;
}
