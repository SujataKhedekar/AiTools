export type SummaryLength =
  | 'Very Short'
  | 'Short'
  | 'Medium'
  | 'Detailed'
  | 'Comprehensive';

export type SummaryFormat =
  | 'Paragraph'
  | 'Bullet Points'
  | 'Numbered List'
  | 'Key Takeaways'
  | 'Executive Summary';

export type SummaryTone =
  | 'Professional'
  | 'Simple'
  | 'Academic'
  | 'Casual'
  | 'Business'
  | 'Technical';

export type SummarizationMode =
  | 'General'
  | 'Article Summarizer'
  | 'Document Summarizer'
  | 'Meeting Summarizer'
  | 'Research Paper Summarizer'
  | 'YouTube Transcript Summarizer'
  | 'Academic Summarizer'
  | 'Business Summarizer'
  | 'Simple Language Summarizer';

export type OutputFeature =
  | 'Full Summary'
  | 'Key Points Extractor'
  | 'Important Facts Extractor'
  | 'Action Items Generator'
  | 'Main Idea Extractor'
  | 'Pros and Cons Extractor'
  | 'Important Keywords'
  | 'Questions and Answers Generator'
  | 'Conclusion Generator'
  | 'TL;DR Generator';

export interface QaPair {
  question: string;
  answer: string;
}

export interface ProsAndCons {
  pros: string[];
  cons: string[];
}

export interface SummaryRequest {
  text: string;
  length: SummaryLength;
  format: SummaryFormat;
  tone: SummaryTone;
  language: string;
  mode: SummarizationMode;
  feature: OutputFeature;
}

export interface SummaryResult {
  title: string;
  summary: string;
  keyPoints: string[];
  importantInfo: string[];
  actionItems: string[];
  prosAndCons: ProsAndCons;
  qaPairs: QaPair[];
  keywords: string[];
  conclusion: string;
  detectedLanguage: string;
  wordCount: number;
  readingTimeMinutes: number;
  sourceWordCount: number;
  compressionPercent: number;
}

export interface ExtractedFileResponse {
  text: string;
  filename: string;
  fileSize: number;
  charCount: number;
  wordCount: number;
}

export const SUMMARY_LENGTHS: SummaryLength[] = [
  'Very Short',
  'Short',
  'Medium',
  'Detailed',
  'Comprehensive',
];

export const SUMMARY_FORMATS: SummaryFormat[] = [
  'Paragraph',
  'Bullet Points',
  'Numbered List',
  'Key Takeaways',
  'Executive Summary',
];

export const SUMMARY_TONES: SummaryTone[] = [
  'Professional',
  'Simple',
  'Academic',
  'Casual',
  'Business',
  'Technical',
];

export const SUMMARY_LANGUAGES: string[] = [
  'Auto Detect',
  'English',
  'Hindi',
  'Marathi',
  'Spanish',
  'French',
  'German',
  'Portuguese',
  'Italian',
  'Japanese',
  'Korean',
  'Arabic',
  'Chinese (Simplified)',
  'Other',
];

export const SUMMARIZATION_MODES: { value: SummarizationMode; label: string; hint: string }[] = [
  { value: 'General', label: 'Standard Summarizer', hint: 'Balanced condensation for any long text' },
  { value: 'Article Summarizer', label: 'Article Summarizer', hint: 'Blog posts, news, and editorial essays' },
  { value: 'Document Summarizer', label: 'Document Summarizer', hint: 'Lengthy reports, policies, and manuals' },
  { value: 'Meeting Summarizer', label: 'Meeting Summarizer', hint: 'Discussions, decisions, and action items' },
  { value: 'Research Paper Summarizer', label: 'Research Paper Summarizer', hint: 'Objectives, methodology, findings, conclusions' },
  { value: 'YouTube Transcript Summarizer', label: 'YouTube Transcript Summarizer', hint: 'Video transcripts turned into structured notes' },
  { value: 'Academic Summarizer', label: 'Academic Summarizer', hint: 'Study chapters, lectures, and textbook notes' },
  { value: 'Business Summarizer', label: 'Business Summarizer', hint: 'Executive briefings and strategy memos' },
  { value: 'Simple Language Summarizer', label: 'Simple Language Summarizer', hint: 'Complex material rewritten in plain words' },
];

export const OUTPUT_FEATURES: { value: OutputFeature; label: string }[] = [
  { value: 'Full Summary', label: 'Full Summary' },
  { value: 'Key Points Extractor', label: 'Key Points Extractor' },
  { value: 'Important Facts Extractor', label: 'Important Facts Extractor' },
  { value: 'Action Items Generator', label: 'Action Items Generator' },
  { value: 'Main Idea Extractor', label: 'Main Idea Extractor' },
  { value: 'Pros and Cons Extractor', label: 'Pros and Cons Extractor' },
  { value: 'Important Keywords', label: 'Important Keywords' },
  { value: 'Questions and Answers Generator', label: 'Questions & Answers Generator' },
  { value: 'Conclusion Generator', label: 'Conclusion Generator' },
  { value: 'TL;DR Generator', label: 'TL;DR Generator' },
];
