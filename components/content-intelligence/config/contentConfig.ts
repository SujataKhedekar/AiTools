import type {
  ContextualRewriteProfile,
  DocumentCategory,
  WritingStyle,
} from '../types/contentIntelligence';

export const WRITING_STYLES: Array<{
  value: WritingStyle;
  description: string;
}> = [
  {
    value: 'Natural and conversational',
    description: 'Varied rhythm, everyday spoken clarity, zero robotic stiffness.',
  },
  {
    value: 'Human editorial',
    description: 'Magazine-grade voice with intentional pacing and concrete phrasing.',
  },
  {
    value: 'Professional',
    description: 'Crisp, credible, direct prose suited to external stakeholders.',
  },
  {
    value: 'Friendly and approachable',
    description: 'Warm, helpful, reader-first tone without hollow enthusiasm.',
  },
  {
    value: 'Expert and authoritative',
    description: 'Substantive domain precision backed by clear reasoning.',
  },
  {
    value: 'Simple and easy to understand',
    description: 'Plain language, short clauses, minimal jargon.',
  },
  {
    value: 'Business-oriented',
    description: 'Outcome-focused, executive clarity, concise value framing.',
  },
  {
    value: 'Informative',
    description: 'Neutral, well-structured explanation prioritized for comprehension.',
  },
  {
    value: 'Academic',
    description: 'Rigorous, hedged, evidence-grounded scholarly register.',
  },
  {
    value: 'Persuasive',
    description: 'Clear thesis, compelling benefit framing, credible specificity.',
  },
  {
    value: 'Storytelling',
    description: 'Narrative flow with grounded scenes, tension, and momentum.',
  },
];

export const DOCUMENT_CATEGORIES: Array<{
  value: DocumentCategory;
  label: string;
}> = [
  { value: 'blog', label: 'Blog Article' },
  { value: 'website', label: 'Website Page' },
  { value: 'marketing', label: 'Marketing Copy' },
  { value: 'business', label: 'Business Writing' },
  { value: 'academic', label: 'Academic Paper' },
  { value: 'ecommerce', label: 'E-Commerce Description' },
];

export const DEFAULT_CONTEXT_PROFILE: ContextualRewriteProfile = {
  targetAudience: 'Operations & finance leaders at mid-market B2B companies',
  industry: 'B2B SaaS & Financial Operations',
  businessType: 'Software Platform',
  brandVoice: 'Clear, pragmatic, and grounded in real operational trade-offs',
  contentObjective: 'Educate readers and encourage a product evaluation',
  primaryKeyword: 'automated invoice reconciliation',
  secondaryKeywords: ['accounts payable', 'month-end close', 'ERP sync'],
  desiredTone: 'Clear, authoritative, and natural',
  preferredReadingLevel: 'Professional (Grade 10-12)',
  documentType: 'blog',
};

export interface SamplePreset {
  id: string;
  label: string;
  category: DocumentCategory;
  summary: string;
  profile: Partial<ContextualRewriteProfile>;
  text: string;
}

export const SAMPLE_PRESETS: SamplePreset[] = [
  {
    id: 'ai-heavy-blog',
    label: 'AI-Patterned B2B Draft',
    category: 'blog',
    summary: 'Contains classic AI-like clichés, uniform cadence, and generic transitions for testing detection and humanization.',
    profile: {
      targetAudience: 'Controllers and AP managers at 100–500 person firms',
      industry: 'Accounting & Financial Operations',
      businessType: 'B2B SaaS',
      brandVoice: 'Direct, pragmatic, skeptical of hype',
      contentObjective: 'Show practical steps to speed up month-end reconciliation',
      primaryKeyword: 'automated invoice reconciliation',
      secondaryKeywords: ['accounts payable', 'month-end close', 'ERP sync'],
      documentType: 'blog',
    },
    text: `# Why Automated Invoice Reconciliation Matters for Modern Finance Teams

In today's fast-paced world, finance teams are constantly seeking ways to streamline their operations and stay competitive. Furthermore, manual data entry often creates bottlenecks that delay the month-end close. It is important to note that automated invoice reconciliation has emerged as a game-changing solution for growing organizations.

Moreover, when companies delve into their accounts payable workflows, they frequently uncover hidden inefficiencies. A comprehensive approach to ERP sync allows teams to unlock the potential of real-time financial visibility. Seamless integration between procurement and accounting ensures that every stakeholder remains aligned.

In today's digital landscape, leveraging innovative solutions is no longer optional for businesses that want to scale effectively. By adopting modern tools, organizations can enhance productivity, reduce costly errors, and empower their staff to focus on strategic initiatives. Ultimately, investing in automation drives sustainable long-term growth and operational excellence.`,
  },
  {
    id: 'human-editorial-blog',
    label: 'Human Editorial Essay',
    category: 'blog',
    summary: 'Varied sentence cadence, concrete numbers, and natural voice to test false-positive restraint.',
    profile: {
      targetAudience: 'Engineering managers and staff engineers',
      industry: 'Software Engineering',
      businessType: 'Engineering Publication',
      brandVoice: 'Candid, field-tested, specific',
      contentObjective: 'Share practical lessons from migrating an incident queue',
      primaryKeyword: 'on-call rotation',
      secondaryKeywords: ['alert fatigue', 'incident response', 'runbooks'],
      documentType: 'blog',
    },
    text: `# What Three Months Without Pager Fatigue Taught Our Core Platform Team

Last October, our eight-person platform squad got paged 41 times during a single two-week sprint. Thirty-four of those alerts resolved themselves before an engineer even finished unlocking their laptop. That wasn't reliability engineering; it was sleep deprivation dressed up as vigilance.

Instead of buying another observability dashboard, we froze feature work for four days and audited every alert firing in our on-call rotation. Roughly half existed because someone wrote a threshold check after a 2022 outage and never revisited it after we moved to regional failover.

Cutting noisy alerts took three concrete rules:
- Every page had to name a human action in the runbook, not just "investigate CPU."
- Transient spikes under four minutes went to a Slack digest rather than SMS.
- Any alert that fired twice without an engineer touching production was deleted on Friday afternoon.

Six weeks later, total pages dropped from 41 per sprint to 6. More importantly, when a real database lock stalled checkout on a Tuesday morning, the on-call engineer spotted it in ninety seconds because she wasn't desensitized by false alarms.`,
  },
  {
    id: 'mixed-seo-landing',
    label: 'Mixed SEO Landing Page',
    category: 'website',
    summary: 'Real product details mixed with repetitive SEO phrasing to test keyword preservation and restructuring.',
    profile: {
      targetAudience: 'HR directors at distributed companies',
      industry: 'Global Payroll & Compliance',
      businessType: 'B2B SaaS',
      brandVoice: 'Trustworthy, clear, compliant',
      contentObjective: 'Convert organic search visitors to book a compliance demo',
      primaryKeyword: 'global contractor payroll',
      secondaryKeywords: ['multi-currency payouts', 'W-8BEN compliance', 'contractor onboarding'],
      documentType: 'website',
    },
    text: `# Global Contractor Payroll Built for Cross-Border Teams

Managing global contractor payroll across 40+ countries requires accurate tax documentation, predictable settlement windows, and clear local compliance rules. Our platform automates W-8BEN compliance, verifies local bank routing codes before payout day, and supports multi-currency payouts in 38 currencies with locked FX rates.

Furthermore, in today's digital landscape, distributed organizations need a comprehensive approach to contractor onboarding that eliminates spreadsheet errors. Seamless integration with Xero, QuickBooks, and NetSuite keeps every ledger entry reconciled automatically.

Why finance teams choose our global contractor payroll software:
- Cut contractor onboarding from five days to under 12 minutes with guided country-specific tax forms.
- Pay international freelancers on a single consolidated USD or EUR funding batch.
- Download audit-ready compliance packets before every quarterly close.

Ultimately, our game-changing solutions help you unlock the potential of your international workforce while keeping global contractor payroll simple and compliant.`,
  },
  {
    id: 'ecommerce-product',
    label: 'E-Commerce Product Copy',
    category: 'ecommerce',
    summary: 'Merino wool travel jacket copy with mixed concrete specs and generic marketing filler.',
    profile: {
      targetAudience: 'Frequent business and carry-on travelers',
      industry: 'Performance Apparel',
      businessType: 'Direct-to-Consumer E-Commerce',
      brandVoice: 'Refined, tactile, practical',
      contentObjective: 'Increase product page add-to-cart conversion',
      primaryKeyword: 'merino travel blazer',
      secondaryKeywords: ['wrinkle-resistant', 'carry-on travel', 'breathable wool'],
      documentType: 'ecommerce',
    },
    text: `# The Transit Merino Travel Blazer

Crafted from 260gsm superfine Australian merino wool woven in Biella, Italy, this merino travel blazer handles 11-hour flights without losing its shoulder line. Natural wool fibers regulate warmth inside chilly cabins and breathe when you step off the jet bridge into humid terminals.

Designed specifically for carry-on travel, the jacket includes two zippered passport pockets inside the chest lining and a hidden key tether in the right welt pocket. Because the high-twist weave is naturally wrinkle-resistant, you can pull it straight out of an overhead backpack and walk into a client dinner.

In today's fast-paced world, this versatile piece offers seamless integration between office polish and weekend comfort. Unlock the potential of minimalist packing with a garment that elevates your everyday wardrobe.`,
  },
];
