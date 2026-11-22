export type StudioView = 'generate' | 'write' | 'preview' | 'issues' | 'templates';

export type IssueStatus = 'draft' | 'ready';

export type GeneratorFormat = 'essay' | 'digest' | 'product' | 'letter';

export type GeneratorTone = 'editorial' | 'analytical' | 'warm' | 'concise';

export type GeneratorLength = 'short' | 'medium' | 'deep';

export type RewriteAction = 'tighten' | 'expand' | 'warmer' | 'sharper';

export interface SubjectOption {
  subject: string;
  preheader: string;
  angle: string;
}

export interface GeneratorBrief {
  topic: string;
  sourceNotes: string;
  publicationName: string;
  authorName: string;
  audience: string;
  format: GeneratorFormat;
  tone: GeneratorTone;
  length: GeneratorLength;
  themeId: ThemePresetId;
  includeCoverImage: boolean;
  includeQuote: boolean;
  includeLinks: boolean;
  includeMetrics: boolean;
  includeCallout: boolean;
  includeCta: boolean;
}

export type HeaderLayout = 'masthead' | 'left' | 'minimal';

export type TypographyPreset = 'editorial-serif' | 'book-monograph' | 'modern-sans';

export type ThemePresetId = 'gallery-stark' | 'archival-paper' | 'forest-monograph' | 'broadsheet-crimson';

export interface NewsletterDesign {
  themeId: ThemePresetId;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  mutedColor: string;
  accentColor: string;
  borderColor: string;
  typography: TypographyPreset;
  headerLayout: HeaderLayout;
  maxWidth: 580 | 620 | 680;
}

export interface LinkDigestItem {
  id: string;
  title: string;
  url: string;
  source: string;
  note: string;
}

export interface MetricItem {
  id: string;
  value: string;
  label: string;
  detail: string;
}

export type NewsletterBlock =
  | {
      id: string;
      type: 'heading';
      level: 2 | 3;
      kicker: string;
      text: string;
    }
  | {
      id: string;
      type: 'paragraph';
      text: string;
      dropCap?: boolean;
    }
  | {
      id: string;
      type: 'image';
      src: string;
      alt: string;
      caption: string;
      aspect: '16:9' | '4:3' | 'auto';
    }
  | {
      id: string;
      type: 'quote';
      text: string;
      attribution: string;
    }
  | {
      id: string;
      type: 'links';
      heading: string;
      items: LinkDigestItem[];
    }
  | {
      id: string;
      type: 'callout';
      title: string;
      body: string;
    }
  | {
      id: string;
      type: 'button';
      label: string;
      url: string;
      alignment: 'left' | 'center';
      variant: 'solid' | 'outline';
    }
  | {
      id: string;
      type: 'metrics';
      heading: string;
      items: MetricItem[];
    }
  | {
      id: string;
      type: 'divider';
      style: 'hairline' | 'dinkus' | 'space';
    };

export type BlockType = NewsletterBlock['type'];

export interface NewsletterIssue {
  id: string;
  issueNumber: string;
  publicationName: string;
  subject: string;
  preheader: string;
  authorName: string;
  senderEmail: string;
  publishDate: string;
  status: IssueStatus;
  updatedAt: string;
  footerNote: string;
  addressLine: string;
  unsubscribeLabel: string;
  design: NewsletterDesign;
  blocks: NewsletterBlock[];
}

export interface NewsletterTemplate {
  id: string;
  name: string;
  category: string;
  summary: string;
  estimatedRead: string;
  previewImage: string;
  design: NewsletterDesign;
  createIssue: (nextNumber: string) => NewsletterIssue;
}

export interface EditorialCheck {
  id: string;
  label: string;
  detail: string;
  status: 'pass' | 'warn' | 'fail';
}

export interface IssueStats {
  wordCount: number;
  readingMinutes: number;
  blockCount: number;
  linkCount: number;
  imageCount: number;
  htmlBytes: number;
}
