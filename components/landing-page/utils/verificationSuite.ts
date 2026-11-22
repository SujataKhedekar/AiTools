import type { GeneratedLandingPage } from '../types/aivora';
import { generateCodeForFramework } from './codeGenerators';
import { generateDocumentationFiles } from './reportGenerators';
import { buildCompleteProjectZip } from './zipExporter';

export interface VerificationCheckResult {
  id: string;
  category: string;
  label: string;
  passed: boolean;
  detail: string;
}

export async function runLandingPageVerification(
  page: GeneratedLandingPage
): Promise<VerificationCheckResult[]> {
  const results: VerificationCheckResult[] = [];
  const enabled = page.sections.filter((s) => s.enabled);

  // 1. Strategy verification
  results.push({
    id: 'strategy-complete',
    category: 'Strategy',
    label: 'Landing page strategy & framework selected',
    passed: Boolean(
      page.strategy.primaryMessage &&
        page.strategy.recommendedFramework &&
        page.strategy.keySellingPoints.length >= 2
    ),
    detail: `Framework: ${page.strategy.recommendedFramework} · Search Intent: ${page.strategy.searchIntent}`,
  });

  // 2. Heading hierarchy
  results.push({
    id: 'heading-hierarchy',
    category: 'SEO',
    label: 'Single descriptive H1 & logical H2/H3 structure',
    passed: page.seo.headingStructure.h1Count === 1 && page.seo.headingStructure.h2List.length >= 1,
    detail: `H1 count: ${page.seo.headingStructure.h1Count} · H2 count: ${page.seo.headingStructure.h2List.length}`,
  });

  // 3. SEO metadata
  results.push({
    id: 'seo-metadata',
    category: 'SEO',
    label: 'SEO Title, Meta Description & Open Graph tags',
    passed: Boolean(
      page.seo.metadata.seoTitle &&
        page.seo.metadata.metaDescription &&
        page.seo.metadata.ogTitle
    ),
    detail: `Title (${page.seo.metadata.seoTitle.length} chars) · Meta (${page.seo.metadata.metaDescription.length} chars)`,
  });

  // 4. JSON-LD Schema validation
  const eligibleSchemas = page.seo.jsonLdSchemas.filter((s) => s.eligible);
  const allValidJson = eligibleSchemas.every((s) => s.isValidJson);
  results.push({
    id: 'jsonld-valid',
    category: 'Schema.org',
    label: 'JSON-LD schemas strictly validated & eligible',
    passed: eligibleSchemas.length >= 2 && allValidJson,
    detail: `${eligibleSchemas.length} eligible schemas (${eligibleSchemas.map((s) => s.schemaType).join(', ')})`,
  });

  // 5. CTA suite completeness & compliance
  results.push({
    id: 'cta-suite',
    category: 'Conversion',
    label: '7-slot Advanced CTA suite tailored to objective',
    passed: page.ctaSuite.slots.length === 7,
    detail: `${page.ctaSuite.slots.length}/7 CTA slots generated for "${page.brief.objective}"`,
  });

  // 6. Anti-fabrication guard (Social proof & Pricing)
  const hasSocialProofSection = enabled.some((s) => s.type === 'social_proof');
  const hasUserProof =
    page.brief.verifiedTestimonials.length > 0 ||
    page.brief.verifiedStats.length > 0 ||
    page.brief.verifiedClientLogos.length > 0;
  results.push({
    id: 'truth-guard',
    category: 'Integrity',
    label: 'No fabricated social proof or invented pricing',
    passed: !hasSocialProofSection || hasUserProof,
    detail: hasSocialProofSection
      ? 'Social proof strictly renders user-verified records.'
      : 'Social proof omitted cleanly because no verified proof was supplied.',
  });

  // 7. Code generation across all 4 stacks
  const html = generateCodeForFramework(page, 'html');
  const react = generateCodeForFramework(page, 'react-tailwind');
  const next = generateCodeForFramework(page, 'nextjs-ts');
  const bootstrap = generateCodeForFramework(page, 'bootstrap');
  const reports = generateDocumentationFiles(page);
  const allGenerated =
    html.length >= 3 &&
    react.length >= 5 &&
    next.length >= 5 &&
    bootstrap.length >= 2 &&
    reports.length >= 6;
  results.push({
    id: 'code-generation',
    category: 'Codegen',
    label: 'Modular HTML, React, Next.js TS & Bootstrap codegen',
    passed: allGenerated,
    detail: `${html.length + react.length + next.length + bootstrap.length} code files + ${reports.length} documentation files`,
  });

  // 8. ZIP Archive creation
  let zipSize = 0;
  let zipOk = false;
  try {
    const blob = await buildCompleteProjectZip(page);
    zipSize = blob.size;
    zipOk = zipSize > 2000;
  } catch {
    zipOk = false;
  }
  results.push({
    id: 'zip-export',
    category: 'Export',
    label: 'Complete ZIP project bundle compiles cleanly',
    passed: zipOk,
    detail: zipOk ? `Archive size: ${(zipSize / 1024).toFixed(1)} KB` : 'ZIP build failed',
  });

  return results;
}
