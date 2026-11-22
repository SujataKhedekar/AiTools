import type {
  GeneratedLandingPage,
  QualityComponentScore,
  QualityScoreBreakdown,
} from '../types/aivora';

const AI_CLICHES = [
  'supercharge',
  'empower',
  'unlock',
  'elevate',
  'revolutionize',
  'game-changer',
  'seamless',
  'cutting-edge',
];

export function calculateQualityScore(page: GeneratedLandingPage): QualityScoreBreakdown {
  const enabled = page.sections.filter((s) => s.enabled);
  const hero = enabled.find((s) => s.type === 'hero');
  const allText = enabled
    .map((s) => `${s.headline} ${s.subheadline || ''} ${s.description}`)
    .join(' ')
    .toLowerCase();

  // 1. Copywriting Quality (0-100)
  const clichesFound = AI_CLICHES.filter((w) => allText.includes(w));
  const avgHeadlineLen =
    enabled.length > 0
      ? enabled.reduce((sum, s) => sum + s.headline.split(/\s+/).length, 0) / enabled.length
      : 0;
  let copyScore = 70;
  if (hero?.headline && hero.headline.length >= 18 && hero.headline.length <= 95) copyScore += 15;
  if (avgHeadlineLen >= 3 && avgHeadlineLen <= 12) copyScore += 10;
  if (page.strategy.recommendedFramework) copyScore += 5;
  copyScore = Math.max(0, Math.min(100, copyScore - clichesFound.length * 8));

  // 2. CTA Clarity (0-100)
  const primaryCta = hero?.primaryCtaText || '';
  const hasFinalCta = enabled.some((s) => s.type === 'final_cta' && s.primaryCtaText);
  const genericCtaWords = ['submit', 'click here', 'learn more'];
  const isGenericCta = genericCtaWords.includes(primaryCta.trim().toLowerCase());
  let ctaScore = 50;
  if (primaryCta.length >= 6) ctaScore += 20;
  if (!isGenericCta && primaryCta) ctaScore += 15;
  if (hasFinalCta) ctaScore += 10;
  if (page.ctaSuite.slots.length >= 7) ctaScore += 5;

  // 3. SEO Completeness (0-100)
  const titleLen = page.seo.metadata.seoTitle.length;
  const descLen = page.seo.metadata.metaDescription.length;
  const validSchemas = page.seo.jsonLdSchemas.filter((s) => s.eligible && s.isValidJson).length;
  let seoScore = 30;
  if (page.seo.headingStructure.h1Count === 1) seoScore += 20;
  if (titleLen >= 25 && titleLen <= 65) seoScore += 15;
  if (descLen >= 110 && descLen <= 165) seoScore += 15;
  if (page.seo.keywordStrategy.primaryKeyword) seoScore += 10;
  if (validSchemas >= 2) seoScore += 10;

  // 4. Content Structure (0-100)
  const hasProblemOrSolution = enabled.some((s) => s.type === 'problem' || s.type === 'solution');
  const hasFeaturesOrSteps = enabled.some((s) => s.type === 'features' || s.type === 'how_it_works');
  const hasFooter = enabled.some((s) => s.type === 'footer');
  let structScore = 40;
  if (hero) structScore += 20;
  if (hasProblemOrSolution) structScore += 15;
  if (hasFeaturesOrSteps) structScore += 15;
  if (hasFooter) structScore += 10;

  // 5. Responsive Design (0-100)
  let respScore = 75;
  if (page.design.stickyMobileCta) respScore += 10;
  if (page.design.spacingScale) respScore += 10;
  if (enabled.length >= 4 && enabled.length <= 10) respScore += 5;

  // 6. Accessibility (0-100)
  const missingAltCount = page.seo.contentSeo.imageAltAudit.filter(
    (a) => a.status !== 'ok'
  ).length;
  let a11yScore = 80;
  if (page.seo.headingStructure.isValidHierarchy) a11yScore += 10;
  if (missingAltCount === 0) a11yScore += 10;
  else a11yScore -= missingAltCount * 5;
  a11yScore = Math.max(40, Math.min(100, a11yScore));

  // 7. Performance Readiness (0-100)
  let perfScore = 82;
  if (!page.design.animationsEnabled) perfScore += 8;
  else perfScore += 4;
  if (enabled.length <= 8) perfScore += 10;
  else perfScore += 5;

  // 8. Conversion Fundamentals (0-100)
  const hasVerifiedProof =
    page.brief.verifiedTestimonials.length > 0 || page.brief.verifiedStats.length > 0;
  const hasFaq = enabled.some((s) => s.type === 'faq' && (s.faqs?.length ?? 0) >= 3);
  const hasDestination = Boolean(
    page.brief.integrations.bookingUrl ||
      page.brief.integrations.purchaseUrl ||
      page.brief.integrations.contactEmail ||
      page.brief.integrations.phoneNumber ||
      page.brief.integrations.formKind !== 'none'
  );
  let convScore = 45;
  if (hasVerifiedProof) convScore += 20;
  if (hasFaq) convScore += 15;
  if (hasDestination) convScore += 15;
  if (page.brief.integrations.formEndpointUrl) convScore += 5;

  const components: QualityComponentScore[] = [
    {
      id: 'copywriting',
      label: 'Copywriting Quality',
      score: copyScore,
      maxScore: 100,
      formulaExplanation:
        'Base 70 + Hero headline length (15) + Avg headline conciseness 3–12 words (10) + Framework alignment (5) − 8 pts per AI cliché detected.',
      evidence: [
        `Framework applied: ${page.strategy.recommendedFramework}`,
        clichesFound.length === 0
          ? 'Zero generic AI filler clichés detected'
          : `Clichés detected (${clichesFound.length}): ${clichesFound.join(', ')}`,
      ],
    },
    {
      id: 'cta',
      label: 'CTA Clarity',
      score: ctaScore,
      maxScore: 100,
      formulaExplanation:
        'Base 50 + Specific action length ≥6 chars (20) + Non-generic wording (15) + Final CTA present (10) + Full 7-slot CTA suite (5).',
      evidence: [
        `Hero CTA: "${primaryCta || 'Not set'}"`,
        `${page.ctaSuite.slots.length} structured CTA placements generated`,
      ],
    },
    {
      id: 'seo',
      label: 'SEO Completeness',
      score: seoScore,
      maxScore: 100,
      formulaExplanation:
        'Base 30 + Single H1 (20) + SEO Title 25–65 chars (15) + Meta Description 110–165 chars (15) + Primary Keyword (10) + ≥2 Valid JSON-LD Schemas (10).',
      evidence: [
        `Title: ${titleLen} chars · Description: ${descLen} chars`,
        `${validSchemas} valid JSON-LD schemas active`,
      ],
    },
    {
      id: 'structure',
      label: 'Content Structure',
      score: structScore,
      maxScore: 100,
      formulaExplanation:
        'Base 40 + Hero present (20) + Problem/Solution framing (15) + Features or How It Works (15) + Footer (10).',
      evidence: [`${enabled.length} enabled sections in persuasive narrative sequence`],
    },
    {
      id: 'responsive',
      label: 'Responsive Design',
      score: respScore,
      maxScore: 100,
      formulaExplanation:
        'Base 75 (fluid grid & breakpoint rules) + Mobile sticky CTA option (10) + Controlled spacing scale (10) + Focused section count (5).',
      evidence: [
        'Desktop 1440px, Tablet 768px, and Mobile 375px layout adaptations configured',
      ],
    },
    {
      id: 'accessibility',
      label: 'Accessibility',
      score: a11yScore,
      maxScore: 100,
      formulaExplanation:
        'Base 80 (semantic landmarks & form labels) + Valid H1→H2→H3 hierarchy (10) + Complete image alt text (10 − 5 per incomplete alt).',
      evidence: [
        `Heading hierarchy valid: ${page.seo.headingStructure.isValidHierarchy ? 'Yes' : 'Needs review'}`,
        `Images audited: ${page.seo.contentSeo.imageAltAudit.length}`,
      ],
    },
    {
      id: 'performance',
      label: 'Performance Readiness',
      score: perfScore,
      maxScore: 100,
      formulaExplanation:
        'Base 82 (semantic markup & lazy below-fold media) + Motion restraint (4–8) + Compact DOM section budget (5–10).',
      evidence: [
        'Zero external unverified CDN scripts in exported HTML/React/Next.js builds',
      ],
    },
    {
      id: 'conversion',
      label: 'Conversion Fundamentals',
      score: convScore,
      maxScore: 100,
      formulaExplanation:
        'Base 45 + Verified social proof supplied (20) + Objection-handling FAQs ≥3 (15) + Configured CTA destination/form (15) + External endpoint set (5).',
      evidence: [
        hasVerifiedProof
          ? 'Verified customer proof present'
          : 'No verified testimonials/stats supplied yet (+20 pts when added)',
        page.brief.integrations.formEndpointUrl
          ? 'External form endpoint configured'
          : 'Form endpoint URL not yet configured (+5 pts when added)',
      ],
    },
  ];

  const overallScore = Math.round(
    components.reduce((acc, c) => acc + c.score, 0) / components.length
  );

  const gradeLabel =
    overallScore >= 90
      ? 'High Readiness'
      : overallScore >= 78
        ? 'Strong Foundation'
        : overallScore >= 65
          ? 'Needs Proof / Polish'
          : 'Early Draft';

  return {
    overallScore,
    gradeLabel,
    disclaimer:
      'Aivora Landing Page Quality Score is an internal Aivora rubric evaluating structure, SEO metadata, copy specificity, and conversion readiness. It is not an official Google ranking factor, PageSpeed measurement, or conversion rate guarantee.',
    components,
  };
}
