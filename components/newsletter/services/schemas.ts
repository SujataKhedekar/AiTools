import { Type } from "@google/genai";

export interface GenerateRequestBody {
  topic?: string;
  sourceNotes?: string;
  publicationName?: string;
  authorName?: string;
  audience?: string;
  format?: 'essay' | 'digest' | 'product' | 'letter';
  tone?: 'editorial' | 'analytical' | 'warm' | 'concise';
  length?: 'short' | 'medium' | 'deep';
  includeQuote?: boolean;
  includeLinks?: boolean;
  includeMetrics?: boolean;
  includeCallout?: boolean;
  includeCta?: boolean;
}

export const NEWSLETTER_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    publicationName: {
      type: Type.STRING,
      description: 'Clean, realistic editorial publication title.',
    },
    authorName: {
      type: Type.STRING,
      description: 'Author or editorial desk byline.',
    },
    subjectOptions: {
      type: Type.ARRAY,
      description: 'Exactly 3 distinct, compelling subject line and preheader pairs.',
      items: {
        type: Type.OBJECT,
        properties: {
          subject: {
            type: Type.STRING,
            description: 'Concise email subject line under 55 characters, no clickbait or emoji clutter.',
          },
          preheader: {
            type: Type.STRING,
            description: 'Complementary inbox preview line (60-95 characters) that does not repeat the subject.',
          },
          angle: {
            type: Type.STRING,
            description: 'Short 2-3 word label describing the angle (e.g., Direct, Reflective, Analytical).',
          },
        },
        required: ['subject', 'preheader', 'angle'],
      },
    },
    blocks: {
      type: Type.ARRAY,
      description: 'Ordered modular blocks that make up the full newsletter body.',
      items: {
        type: Type.OBJECT,
        properties: {
          type: {
            type: Type.STRING,
            description:
              'Block type: one of "heading", "paragraph", "quote", "links", "callout", "button", "metrics", "divider".',
          },
          level: {
            type: Type.INTEGER,
            description: 'For heading blocks: 2 or 3.',
          },
          kicker: {
            type: Type.STRING,
            description: 'For heading blocks: optional short kicker such as "Part One" or "Deep Dive".',
          },
          text: {
            type: Type.STRING,
            description:
              'For heading, paragraph, or quote blocks. Paragraph text may use **bold** and *italic* sparingly.',
          },
          dropCap: {
            type: Type.BOOLEAN,
            description: 'For the first opening paragraph in essays: true or false.',
          },
          attribution: {
            type: Type.STRING,
            description: 'For quote blocks: speaker or source attribution.',
          },
          heading: {
            type: Type.STRING,
            description: 'For links or metrics blocks: section heading.',
          },
          linkItems: {
            type: Type.ARRAY,
            description: 'For links blocks: 3 to 4 curated items.',
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                url: { type: Type.STRING, description: 'Plausible https:// URL' },
                source: { type: Type.STRING, description: 'Publication or domain name' },
                note: { type: Type.STRING, description: '1-2 sentence editorial annotation.' },
              },
              required: ['title', 'url', 'source', 'note'],
            },
          },
          title: {
            type: Type.STRING,
            description: 'For callout blocks: short editorial title.',
          },
          body: {
            type: Type.STRING,
            description: 'For callout blocks: 1-3 crisp sentences.',
          },
          label: {
            type: Type.STRING,
            description: 'For button blocks: clear action label (2-5 words).',
          },
          url: {
            type: Type.STRING,
            description: 'For button blocks: valid https:// destination URL.',
          },
          alignment: {
            type: Type.STRING,
            description: 'For button blocks: "left" or "center".',
          },
          variant: {
            type: Type.STRING,
            description: 'For button blocks: "solid" or "outline".',
          },
          metricItems: {
            type: Type.ARRAY,
            description: 'For metrics blocks: exactly 3 concise highlight figures.',
            items: {
              type: Type.OBJECT,
              properties: {
                value: { type: Type.STRING },
                label: { type: Type.STRING },
                detail: { type: Type.STRING },
              },
              required: ['value', 'label', 'detail'],
            },
          },
          dividerStyle: {
            type: Type.STRING,
            description: 'For divider blocks: "hairline", "dinkus", or "space".',
          },
        },
        required: ['type'],
      },
    },
  },
  required: ['publicationName', 'authorName', 'subjectOptions', 'blocks'],
};

export const SUBJECTS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    options: {
      type: Type.ARRAY,
      description: 'Exactly 4 distinct subject line and preheader variations.',
      items: {
        type: Type.OBJECT,
        properties: {
          subject: { type: Type.STRING },
          preheader: { type: Type.STRING },
          angle: { type: Type.STRING },
        },
        required: ['subject', 'preheader', 'angle'],
      },
    },
  },
  required: ['options'],
};

export const REWRITE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    rewrittenText: {
      type: Type.STRING,
      description: 'The rewritten editorial copy ready to replace the original block text.',
    },
  },
  required: ['rewrittenText'],
};
