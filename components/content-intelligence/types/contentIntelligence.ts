export type DocumentCategory =
  | 'blog'
  | 'website'
  | 'marketing'
  | 'academic'
  | 'business'
  | 'ecommerce';

export type WritingStyle =
  | 'Natural and conversational'
  | 'Professional'
  | 'Human editorial'
  | 'Friendly and approachable'
  | 'Expert and authoritative'
  | 'Simple and easy to understand'
  | 'Business-oriented'
  | 'Informative'
  | 'Academic'
  | 'Persuasive'
  | 'Storytelling';

export type RewriteScope = 'sentence' | 'paragraph' | 'selection' | 'article';

export type SentenceSeverity = 'red' | 'orange' | 'yellow' | 'green';

export type PatternPrevalenceLevel = 'Low' | 'Moderate' | 'Elevated' | 'High';

export type ConfidenceLevel = 'Low' | 'Moderate' | 'High';

export interface ContextualRewriteProfile {
  targetAudience: string;
  industry: string;
  businessType: string;
  brandVoice: string;
  contentObjective: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  desiredTone: string;
  preferredReadingLevel: 'General (Grade 7-9)' | 'Accessible (Grade 5-6)' | 'Professional (Grade 10-12)' | 'Academic / Technical (College+)';
  documentType: DocumentCategory;
}

export interface KeywordOccurrenceStats {
  keyword: string;
  isPrimary: boolean;
  count: number;
  densityPercent: number;
  inFirstParagraph: boolean;
  inHeadings: boolean;
  positions: number[];
}

export interface RepeatedNgram {
  phrase: string;
  count: number;
}

export interface ObjectiveTextMetrics {
  wordCount: number;
  characterCount: number;
  characterCountNoSpaces: number;
  sentenceCount: number;
  paragraphCount: number;
  estimatedReadingTimeMinutes: number;
  avgSentenceLength: number;
  sentenceLengthStdDev: number;
  minSentenceLength: number;
  maxSentenceLength: number;
  avgParagraphLengthWords: number;
  fleschReadingEase: number;
  fleschKincaidGrade: number;
  gunningFogIndex: number;
  readabilityBand: string;
  difficultWordCount: number;
  difficultWordRatioPercent: number;
  difficultWordsSample: string[];
  typeTokenRatio: number;
  repeatedNgrams: RepeatedNgram[];
  transitionMatches: Array<{ phrase: string; count: number }>;
  fillerMatches: Array<{ phrase: string; count: number }>;
  clicheMatches: Array<{ phrase: string; count: number; sentenceIndices: number[] }>;
  passiveVoiceSentenceCount: number;
  headingCount: number;
  headings: Array<{ level: number; text: string }>;
  keywordStats: KeywordOccurrenceStats[];
  sentenceLengths: number[];
}

export interface WritingPatternFinding {
  id: string;
  dimension:
    | 'Repetitive sentence structures'
    | 'Predictable phrasing'
    | 'Generic introductions'
    | 'Repeated transitions'
    | 'Overused expressions'
    | 'Uniform sentence lengths'
    | 'Repetitive paragraph patterns'
    | 'Generic conclusions'
    | 'Excessive filler words'
    | 'Vague statements'
    | 'Lack of concrete examples'
    | 'Unnatural wording'
    | 'Repetitive vocabulary'
    | 'Weak contextual details';
  signalLevel: PatternPrevalenceLevel;
  confidence: ConfidenceLevel;
  evidenceSummary: string;
  affectedLocations: string[];
  limitationNote: string;
}

export interface DetectionAssessment {
  patternPrevalence: PatternPrevalenceLevel;
  confidence: ConfidenceLevel;
  methodologySummary: string;
  limitationsDisclaimer: string;
  falsePositiveRiskFactors: string[];
  uniformityNote: string;
  patternFindings: WritingPatternFinding[];
}

export interface SentenceAnalysisItem {
  id: string;
  index: number;
  paragraphIndex: number;
  originalSentence: string;
  severity: SentenceSeverity;
  severityLabel:
    | 'Needs substantial editing'
    | 'Could be improved'
    | 'Minor writing improvement'
    | 'Clear and natural writing';
  patternIdentified: string;
  whyGenericOrUnnatural: string;
  repetitiveOrVaguePhrases: string[];
  suggestedImprovements: string[];
  alternativeWordings: string[];
  improvedSentence: string;
  confidence: ConfidenceLevel;
  falsePositiveNote: string;
  wordCount: number;
}

export interface PhraseSuggestion {
  id: string;
  sentenceIndex: number;
  originalPhrase: string;
  category:
    | 'Overused AI Expression'
    | 'Filler Phrase'
    | 'Vague Buzzword'
    | 'Repeated Transition'
    | 'Generic Opener';
  whyImprove: string;
  suggestedAlternatives: string[];
  recommendedReplacement: string;
  contextSnippet: string;
  updatedSentencePreview: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface QualityReport {
  readabilityAssessment: {
    objectiveSummary: string;
    editorialJudgment: string;
    targetAlignment: string;
  };
  writingQuality: {
    grammarAndMechanicsNotes: string[];
    sentenceClarityRating: 'Strong' | 'Moderate' | 'Needs Work';
    vocabularyDiversityAssessment: string;
    repetitionAssessment: string;
    transitionQualityAssessment: string;
  };
  contentQuality: {
    informationDepthAssessment: string;
    specificityAssessment: string;
    contextualRelevanceAssessment: string;
    supportingExamplesAssessment: string;
    factualClarityAssessment: string;
    completenessAssessment: string;
  };
  seoQuality: {
    keywordUsageAssessment: string;
    keywordPlacementAssessment: string;
    headingStructureAssessment: string;
    searchIntentAlignment: string;
    topicCoverageAssessment: string;
    keywordStuffingRisk: 'None' | 'Low' | 'Moderate' | 'High';
    recommendedMetaTitle: string;
    recommendedMetaDescription: string;
  };
}

export interface RestructuringItem {
  id: string;
  issueType:
    | 'Weak introduction'
    | 'Repetitive paragraph'
    | 'Unnecessary sentence'
    | 'Missing explanation'
    | 'Weak conclusion'
    | 'Poor heading hierarchy'
    | 'Overly long section'
    | 'Missing concrete example'
    | 'Unclear call to action';
  locationLabel: string;
  explanation: string;
  recommendedFix: string;
  paragraphIndex?: number;
}

export interface DocumentSection {
  id: string;
  heading: string;
  headingLevel: number;
  paragraphs: string[];
  paragraphIndices: number[];
  wordCount: number;
}

export interface ContentAnalysisResponse {
  analysisId: string;
  analyzedAt: string;
  chunkCount: number;
  modelUsed: string;
  tokenUsage: {
    promptTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  objectiveMetrics: ObjectiveTextMetrics;
  detectionAssessment: DetectionAssessment;
  sentences: SentenceAnalysisItem[];
  phraseSuggestions: PhraseSuggestion[];
  qualityReport: QualityReport;
  restructuringRecommendations: RestructuringItem[];
  recommendedOutline: string[];
  sections: DocumentSection[];
  cached: boolean;
}

export interface RewriteRequest {
  originalText: string;
  targetText: string;
  scope: RewriteScope;
  style: WritingStyle;
  profile: ContextualRewriteProfile;
  preserveKeywords: boolean;
  preserveEntities: boolean;
  paragraphIndex?: number;
  sentenceIndex?: number;
  customInstruction?: string;
}

export interface RewriteResponse {
  rewrittenText: string;
  scope: RewriteScope;
  style: WritingStyle;
  changeRationale: string[];
  preservedKeywords: string[];
  missingKeywords: string[];
  preservedFactsAndEntities: string[];
  originalMetrics: ObjectiveTextMetrics;
  rewrittenMetrics: ObjectiveTextMetrics;
  tokenUsage: {
    promptTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
}

export type CrawlMode = 'single_page' | 'selected_pages' | 'site_crawl';

export interface CrawledPageExtract {
  url: string;
  statusCode: number;
  title: string;
  metaDescription: string;
  headings: Array<{ level: number; text: string }>;
  paragraphs: string[];
  mainContent: string;
  wordCount: number;
  readingTimeMinutes: number;
  objectiveMetrics: ObjectiveTextMetrics;
  duplicateSimilarityPercent: number;
  matchedDuplicateUrl: string | null;
  issues: string[];
  recommendations: string[];
}

export interface CrossPageFinding {
  id: string;
  category:
    | 'Duplicate or Near-Duplicate Content'
    | 'Repetitive Page Introductions'
    | 'Generic Meta Descriptions'
    | 'Weak Service Descriptions'
    | 'Low Specificity / Thin Depth';
  severity: 'High' | 'Medium' | 'Low';
  affectedUrls: string[];
  summary: string;
  recommendation: string;
}

export interface WebsiteAuditReport {
  auditId: string;
  rootUrl: string;
  crawlMode: CrawlMode;
  auditedAt: string;
  robotsTxtChecked: boolean;
  robotsTxtFound: boolean;
  robotsAllowedRoot: boolean;
  robotsBlockedUrls: string[];
  crawlLimits: {
    maxPages: number;
    maxDepth: number;
    pagesDiscovered: number;
    pagesAnalyzed: number;
  };
  pages: CrawledPageExtract[];
  crossPageFindings: CrossPageFinding[];
  siteEditorialSummary: string;
  tokenUsage: {
    promptTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
}

export interface UsageSnapshot {
  startedAt: string;
  geminiConfigured: boolean;
  requestsTotal: number;
  cacheHits: number;
  cacheMisses: number;
  geminiCalls: number;
  crawlRequests: number;
  totalPromptTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  lastError: string | null;
}
