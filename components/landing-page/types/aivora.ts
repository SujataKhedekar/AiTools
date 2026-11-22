export type LandingPageObjective =
  | 'Generate leads'
  | 'Sell products'
  | 'Book appointments'
  | 'Get consultation requests'
  | 'Promote a service'
  | 'Launch a product'
  | 'Collect email subscribers'
  | 'Promote an event'
  | 'Download resources'
  | 'Generate enquiries';

export type DesignStyleId =
  | 'modern-minimal'
  | 'premium-luxury'
  | 'corporate-professional'
  | 'saas-technology'
  | 'creative-agency'
  | 'ecommerce'
  | 'healthcare'
  | 'finance'
  | 'local-business'
  | 'bold-editorial'
  | 'clean-minimalist';

export type SectionType =
  | 'hero'
  | 'problem'
  | 'solution'
  | 'features'
  | 'how_it_works'
  | 'why_choose_us'
  | 'social_proof'
  | 'pricing'
  | 'faq'
  | 'final_cta'
  | 'footer';

export type CopywritingFramework =
  | 'AIDA'
  | 'PAS'
  | 'FAB'
  | 'Before-After-Bridge'
  | 'Problem-Solution-Benefit';

export type FormKind =
  | 'lead-generation'
  | 'contact'
  | 'newsletter'
  | 'none';

export interface VerifiedTestimonial {
  id: string;
  quote: string;
  authorName: string;
  authorRole: string;
  company: string;
  rating?: number;
}

export interface VerifiedStat {
  id: string;
  value: string;
  label: string;
  context: string;
}

export interface VerifiedPricingPlan {
  id: string;
  name: string;
  targetAudience: string;
  price: string;
  billingCycle: string;
  features: string[];
  ctaText: string;
  isHighlighted?: boolean;
}

export interface FunctionalIntegrations {
  formKind: FormKind;
  formEndpointUrl: string;
  bookingUrl: string;
  whatsappNumber: string;
  phoneNumber: string;
  contactEmail: string;
  purchaseUrl: string;
}

export interface ConfirmedOffers {
  freeTrial: boolean;
  freeConsultation: boolean;
  discountText: string;
  guaranteeText: string;
}

export interface BusinessBrief {
  businessName: string;
  websiteUrl: string;
  category: string;
  productName: string;
  productDescription: string;
  targetAudience: string;
  targetLocation: string;
  objective: LandingPageObjective;
  primaryKeyword: string;
  secondaryKeywords: string[];
  usp: string;
  competitorUrls: string[];
  brandColors: {
    primary: string;
    secondary: string;
    background: string;
  };
  brandLogoUrl: string;
  referenceImageUrls: string[];
  designStyle: DesignStyleId;
  toneOfVoice: string;
  verifiedTestimonials: VerifiedTestimonial[];
  verifiedStats: VerifiedStat[];
  verifiedClientLogos: string[];
  verifiedPricingPlans: VerifiedPricingPlan[];
  confirmedOffers: ConfirmedOffers;
  integrations: FunctionalIntegrations;
}

export interface BusinessUrlAnalysis {
  url: string;
  fetchedTitle: string;
  fetchedDescription: string;
  fetchedHeadings: string[];
  extractedSummary: string;
  inferredCategory: string;
  inferredOfferings: string;
  inferredAudience: string;
  inferredTone: string;
  inferredUsp: string;
  missingCriticalDetails: string[];
}

export interface LandingPageStrategy {
  businessPositioning: string;
  targetAudienceProfile: string;
  customerProblems: string[];
  customerNeeds: string[];
  buyingMotivations: string[];
  mainObjections: string[];
  productBenefits: string[];
  uniqueSellingProposition: string;
  competitorPositioning: string;
  conversionObjective: string;
  searchIntent: 'Commercial' | 'Transactional' | 'Informational' | 'Navigational';
  primaryMessage: string;
  keySellingPoints: string[];
  recommendedFramework: CopywritingFramework;
  frameworkRationale: string;
  recommendedSections: {
    type: SectionType;
    title: string;
    purpose: string;
    included: boolean;
  }[];
  ctaStrategy: string;
  recommendedTone: string;
}

export interface SectionItem {
  id: string;
  title: string;
  description: string;
  benefit?: string;
  metric?: string;
  stepNumber?: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface PageSection {
  id: string;
  type: SectionType;
  enabled: boolean;
  navLabel: string;
  eyebrow?: string;
  headline: string;
  subheadline?: string;
  description: string;
  primaryCtaText?: string;
  primaryCtaDestination?: string;
  secondaryCtaText?: string;
  secondaryCtaDestination?: string;
  imageUrl?: string;
  imageAlt?: string;
  imageSuggestion?: string;
  trustIndicators?: string[];
  items?: SectionItem[];
  testimonials?: VerifiedTestimonial[];
  stats?: VerifiedStat[];
  clientLogos?: string[];
  pricingPlans?: VerifiedPricingPlan[];
  faqs?: FaqItem[];
  contactAddress?: string;
  legalNote?: string;
  userEdited?: boolean;
}

export interface CtaVariation {
  text: string;
  placement: string;
  intendedAction: string;
  supportingMessage: string;
  destination: string;
}

export interface CtaSlot {
  slot:
    | 'Primary CTA'
    | 'Secondary CTA'
    | 'Hero CTA'
    | 'Mid-page CTA'
    | 'Final CTA'
    | 'Sticky CTA'
    | 'Mobile CTA';
  recommended: CtaVariation;
  variations: CtaVariation[];
}

export interface CtaSuite {
  objectiveAlignment: string;
  complianceNote: string;
  slots: CtaSlot[];
}

export interface JsonLdSchemaEntry {
  schemaType: string;
  eligible: boolean;
  eligibilityReason: string;
  isValidJson: boolean;
  validationErrors: string[];
  jsonString: string;
}

export interface SeoPackage {
  keywordStrategy: {
    primaryKeyword: string;
    secondaryKeywords: string[];
    semanticKeywords: string[];
    relatedSearchTerms: string[];
    searchIntent: string;
    placementRecommendations: string[];
  };
  metadata: {
    seoTitle: string;
    metaDescription: string;
    canonicalUrl: string;
    ogTitle: string;
    ogDescription: string;
    ogImageRecommendation: string;
  };
  headingStructure: {
    h1Count: number;
    h1Text: string;
    h2List: string[];
    h3List: string[];
    isValidHierarchy: boolean;
    notes: string[];
  };
  contentSeo: {
    intentAlignment: string;
    internalLinkingSuggestions: string[];
    externalReferenceSuggestions: string[];
    imageAltAudit: { section: string; altText: string; status: 'ok' | 'needs-detail' }[];
  };
  technicalSeo: {
    check: string;
    status: 'pass' | 'attention';
    detail: string;
  }[];
  jsonLdSchemas: JsonLdSchemaEntry[];
}

export interface CroWeakness {
  area: string;
  severity: 'High' | 'Medium' | 'Low';
  finding: string;
  recommendation: string;
}

export interface AbTestSuggestion {
  element: 'Headline' | 'CTA Wording' | 'Hero Layout' | 'Form Length' | 'Section Order';
  hypothesis: string;
  variantA: string;
  variantB: string;
  primaryMetricToObserve: string;
}

export interface CroReport {
  executiveSummary: string;
  weaknesses: CroWeakness[];
  missingTrustOrObjections: string[];
  sectionOrderAssessment: string;
  mobileUsabilityNotes: string[];
  abTestingSuggestions: AbTestSuggestion[];
  disclaimer: string;
}

export interface QualityComponentScore {
  id: string;
  label: string;
  score: number;
  maxScore: number;
  formulaExplanation: string;
  evidence: string[];
}

export interface QualityScoreBreakdown {
  overallScore: number;
  gradeLabel: string;
  disclaimer: string;
  components: QualityComponentScore[];
}

export interface DesignConfig {
  styleId: DesignStyleId;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  headingFont: 'Plus Jakarta Sans' | 'Outfit' | 'Playfair Display' | 'Fraunces' | 'Manrope';
  bodyFont: 'DM Sans' | 'Plus Jakarta Sans' | 'Public Sans' | 'Manrope';
  buttonStyle: 'sharp' | 'rounded' | 'pill';
  borderRadius: 'none' | 'sm' | 'md' | 'lg';
  spacingScale: 'compact' | 'balanced' | 'airy';
  animationsEnabled: boolean;
  stickyMobileCta: boolean;
}

export interface GeneratedLandingPage {
  brief: BusinessBrief;
  strategy: LandingPageStrategy;
  sections: PageSection[];
  ctaSuite: CtaSuite;
  seo: SeoPackage;
  cro: CroReport;
  design: DesignConfig;
  generatedAt: string;
}

export interface TokenUsageStats {
  totalRequests: number;
  promptTokens: number;
  candidateTokens: number;
  totalTokens: number;
  cacheHits: number;
  lastModel: string;
}

export type WorkspaceTab = 'brief' | 'strategy' | 'editor' | 'seo-cro' | 'export';

export type CodeFramework = 'html' | 'react-tailwind' | 'nextjs-ts' | 'bootstrap';

export interface GeneratedCodeFile {
  path: string;
  language: 'html' | 'css' | 'typescript' | 'javascript' | 'json' | 'markdown';
  content: string;
}
