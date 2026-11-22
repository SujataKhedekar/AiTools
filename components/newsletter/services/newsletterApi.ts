import { createId, STUDIO_IMAGES, THEME_PRESETS } from '../data/presets';
import {
  GeneratorBrief,
  HeaderLayout,
  NewsletterBlock,
  NewsletterIssue,
  RewriteAction,
  SubjectOption,
  TypographyPreset,
} from '../types/newsletter';

interface RawGeneratedBlock {
  type?: string;
  level?: number;
  kicker?: string;
  text?: string;
  dropCap?: boolean;
  attribution?: string;
  heading?: string;
  linkItems?: Array<{
    title?: string;
    url?: string;
    source?: string;
    note?: string;
  }>;
  title?: string;
  body?: string;
  label?: string;
  url?: string;
  alignment?: string;
  variant?: string;
  metricItems?: Array<{
    value?: string;
    label?: string;
    detail?: string;
  }>;
  dividerStyle?: string;
}

interface RawGenerateResponse {
  publicationName?: string;
  authorName?: string;
  subjectOptions?: SubjectOption[];
  blocks?: RawGeneratedBlock[];
  error?: string;
}

function normalizeBlocks(rawBlocks: RawGeneratedBlock[]): NewsletterBlock[] {
  const result: NewsletterBlock[] = [];

  for (const raw of rawBlocks) {
    switch (raw.type) {
      case 'heading':
        if (raw.text?.trim()) {
          result.push({
            id: createId('hdg'),
            type: 'heading',
            level: raw.level === 3 ? 3 : 2,
            kicker: (raw.kicker || '').trim(),
            text: raw.text.trim(),
          });
        }
        break;
      case 'paragraph':
        if (raw.text?.trim()) {
          result.push({
            id: createId('par'),
            type: 'paragraph',
            text: raw.text.trim(),
            dropCap: Boolean(raw.dropCap),
          });
        }
        break;
      case 'quote':
        if (raw.text?.trim()) {
          result.push({
            id: createId('qte'),
            type: 'quote',
            text: raw.text.trim(),
            attribution: (raw.attribution || '').trim(),
          });
        }
        break;
      case 'links':
        if (Array.isArray(raw.linkItems) && raw.linkItems.length > 0) {
          result.push({
            id: createId('lnk'),
            type: 'links',
            heading: (raw.heading || 'Worth Reading').trim(),
            items: raw.linkItems
              .filter((it) => it && it.title)
              .map((it) => ({
                id: createId('li'),
                title: String(it.title || '').trim(),
                url: String(it.url || 'https://example.com').trim(),
                source: String(it.source || '').trim(),
                note: String(it.note || '').trim(),
              })),
          });
        }
        break;
      case 'callout':
        if (raw.body?.trim() || raw.title?.trim()) {
          result.push({
            id: createId('cal'),
            type: 'callout',
            title: (raw.title || 'Editor’s Note').trim(),
            body: (raw.body || '').trim(),
          });
        }
        break;
      case 'button':
        if (raw.label?.trim()) {
          result.push({
            id: createId('btn'),
            type: 'button',
            label: raw.label.trim(),
            url: (raw.url || 'https://example.com').trim(),
            alignment: raw.alignment === 'center' ? 'center' : 'left',
            variant: raw.variant === 'outline' ? 'outline' : 'solid',
          });
        }
        break;
      case 'metrics':
        if (Array.isArray(raw.metricItems) && raw.metricItems.length > 0) {
          result.push({
            id: createId('met'),
            type: 'metrics',
            heading: (raw.heading || 'Key Figures').trim(),
            items: raw.metricItems.slice(0, 3).map((it) => ({
              id: createId('m'),
              value: String(it.value || '—').trim(),
              label: String(it.label || 'Metric').trim(),
              detail: String(it.detail || '').trim(),
            })),
          });
        }
        break;
      case 'divider':
        result.push({
          id: createId('div'),
          type: 'divider',
          style:
            raw.dividerStyle === 'dinkus'
              ? 'dinkus'
              : raw.dividerStyle === 'space'
              ? 'space'
              : 'hairline',
        });
        break;
      default:
        break;
    }
  }

  return result;
}

export async function generateNewsletterFromBrief(
  brief: GeneratorBrief,
  nextIssueNumber: string
): Promise<{ issue: NewsletterIssue; subjectOptions: SubjectOption[] }> {
  const response = await fetch('/api/newsletter/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(brief),
  });

  const data = (await response.json()) as RawGenerateResponse;
  if (!response.ok) {
    throw new Error(data.error || `Generation failed (HTTP ${response.status}).`);
  }

  const subjectOptions: SubjectOption[] =
    Array.isArray(data.subjectOptions) && data.subjectOptions.length > 0
      ? data.subjectOptions
      : [
          {
            subject: brief.topic.slice(0, 54),
            preheader: 'Freshly generated editorial issue ready for review.',
            angle: 'Direct',
          },
        ];

  const primary = subjectOptions[0];
  const blocks = normalizeBlocks(Array.isArray(data.blocks) ? data.blocks : []);

  if (brief.includeCoverImage) {
    const coverIndex =
      brief.format === 'essay' ? 0 : brief.format === 'digest' ? 2 : 1;
    const cover = STUDIO_IMAGES[coverIndex] || STUDIO_IMAGES[0];
    blocks.unshift({
      id: createId('img'),
      type: 'image',
      src: cover.src,
      alt: cover.defaultAlt,
      caption: cover.defaultCaption,
      aspect: '16:9',
    });
  }

  const typographyByFormat: Record<GeneratorBrief['format'], TypographyPreset> = {
    essay: 'editorial-serif',
    digest: 'modern-sans',
    product: 'modern-sans',
    letter: 'book-monograph',
  };

  const headerByFormat: Record<GeneratorBrief['format'], HeaderLayout> = {
    essay: 'masthead',
    digest: 'left',
    product: 'left',
    letter: 'minimal',
  };

  const today = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const theme = THEME_PRESETS[brief.themeId] || THEME_PRESETS['gallery-stark'];
  const pubName =
    brief.publicationName.trim() || data.publicationName?.trim() || 'The Margin Dispatch';
  const authorName =
    brief.authorName.trim() || data.authorName?.trim() || 'Editorial Desk';

  const senderHandle =
    pubName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '')
      .slice(0, 20) || 'newsletter';

  const issue: NewsletterIssue = {
    id: createId('issue'),
    issueNumber: nextIssueNumber,
    publicationName: pubName,
    subject: primary.subject,
    preheader: primary.preheader,
    authorName,
    senderEmail: `editor@${senderHandle}.org`,
    publishDate: today,
    status: 'draft',
    updatedAt: new Date().toISOString(),
    footerNote: `You are receiving ${pubName} because you subscribed to our updates.`,
    addressLine: `${pubName} · Editorial Studio`,
    unsubscribeLabel: 'Unsubscribe or manage delivery preferences',
    design: {
      ...theme.design,
      typography: typographyByFormat[brief.format],
      headerLayout: headerByFormat[brief.format],
      maxWidth: brief.format === 'letter' ? 580 : 620,
    },
    blocks,
  };

  return { issue, subjectOptions };
}

export async function generateSubjectVariations(
  issue: NewsletterIssue
): Promise<SubjectOption[]> {
  const excerpt = issue.blocks
    .map((b) => {
      if (b.type === 'heading' || b.type === 'paragraph' || b.type === 'quote') return b.text;
      if (b.type === 'callout') return `${b.title} ${b.body}`;
      if (b.type === 'links') return b.items.map((i) => `${i.title}: ${i.note}`).join(' ');
      return '';
    })
    .filter(Boolean)
    .join('\n')
    .slice(0, 2500);

  const response = await fetch('/api/newsletter/subjects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subject: issue.subject,
      preheader: issue.preheader,
      publicationName: issue.publicationName,
      excerpt,
    }),
  });

  const data = (await response.json()) as { options?: SubjectOption[]; error?: string };
  if (!response.ok) {
    throw new Error(data.error || `Subject generation failed (HTTP ${response.status}).`);
  }
  return Array.isArray(data.options) ? data.options : [];
}

export async function rewriteBlockText(params: {
  text: string;
  blockType: string;
  action: RewriteAction;
  issueSubject: string;
}): Promise<string> {
  const response = await fetch('/api/newsletter/rewrite', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = (await response.json()) as { rewrittenText?: string; error?: string };
  if (!response.ok) {
    throw new Error(data.error || `Rewrite failed (HTTP ${response.status}).`);
  }
  if (!data.rewrittenText?.trim()) {
    throw new Error('No rewritten text was returned.');
  }
  return data.rewrittenText.trim();
}
