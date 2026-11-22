import {
  NewsletterBlock,
  NewsletterDesign,
  NewsletterIssue,
  NewsletterTemplate,
  ThemePresetId,
} from '../types/newsletter';

export const STUDIO_IMAGES = [
  {
    id: 'library-hero',
    label: 'Modernist Reading Room',
    src: '/newsletter/assets/editorial_architecture_hero_1795294935373.jpg',
    defaultAlt: 'Sunlit concrete and glass library interior with reading tables',
    defaultCaption: 'Fig. 1 — Morning light across the east reading room.',
  },
  {
    id: 'print-studio',
    label: 'Editorial Print Desk',
    src: '/newsletter/assets/editorial_print_studio_1795294932063.jpg',
    defaultAlt: 'Publishing desk with archival paper proofs, fountain pen, and brass straightedge',
    defaultCaption: 'Fig. 2 — Type proofs and margin measurements before press.',
  },
  {
    id: 'desk-still-life',
    label: 'Morning Notebook Study',
    src: '/newsletter/assets/editorial_desk_still_life_1795294932765.jpg',
    defaultAlt: 'Matte ceramic cup beside a linen notebook and spectacles on travertine',
    defaultCaption: 'Fig. 3 — Notes gathered over the course of the week.',
  },
];

export const THEME_PRESETS: Record<
  ThemePresetId,
  {
    name: string;
    description: string;
    design: Omit<NewsletterDesign, 'typography' | 'headerLayout' | 'maxWidth'>;
  }
> = {
  'gallery-stark': {
    name: 'Gallery Stark',
    description: 'Pure white paper with deep cobalt ink',
    design: {
      themeId: 'gallery-stark',
      backgroundColor: '#FFFFFF',
      surfaceColor: '#F5F5F5',
      textColor: '#171717',
      mutedColor: '#525252',
      accentColor: '#1D4ED8',
      borderColor: '#E5E5E5',
    },
  },
  'archival-paper': {
    name: 'Archival Paper',
    description: 'Soft limestone alabaster with slate ink',
    design: {
      themeId: 'archival-paper',
      backgroundColor: '#FAF8F5',
      surfaceColor: '#F1EDE6',
      textColor: '#1C1917',
      mutedColor: '#57534E',
      accentColor: '#1E3A8A',
      borderColor: '#E5E0D8',
    },
  },
  'forest-monograph': {
    name: 'Forest Monograph',
    description: 'Crisp cotton white with deep pine ink',
    design: {
      themeId: 'forest-monograph',
      backgroundColor: '#FFFFFF',
      surfaceColor: '#F4F7F5',
      textColor: '#141A16',
      mutedColor: '#4B5950',
      accentColor: '#14532D',
      borderColor: '#DFE6E1',
    },
  },
  'broadsheet-crimson': {
    name: 'Broadsheet Classic',
    description: 'Newspaper stark white with editorial crimson',
    design: {
      themeId: 'broadsheet-crimson',
      backgroundColor: '#FFFFFF',
      surfaceColor: '#F8F5F6',
      textColor: '#141414',
      mutedColor: '#525252',
      accentColor: '#9F1239',
      borderColor: '#E5E5E5',
    },
  },
};

export const ACCENT_SWATCHES = [
  { label: 'Cobalt Ink', value: '#1D4ED8' },
  { label: 'Deep Lapis', value: '#1E3A8A' },
  { label: 'Forest Ink', value: '#14532D' },
  { label: 'Broadsheet Crimson', value: '#9F1239' },
  { label: 'Charcoal Black', value: '#171717' },
  { label: 'Sienna Ochre', value: '#9A3412' },
];

export function createId(prefix = 'blk'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export function createDefaultBlock(type: NewsletterBlock['type']): NewsletterBlock {
  const id = createId(type);
  switch (type) {
    case 'heading':
      return {
        id,
        type: 'heading',
        level: 2,
        kicker: '',
        text: 'Section Heading',
      };
    case 'paragraph':
      return {
        id,
        type: 'paragraph',
        text: 'Write your paragraph here. Use **bold**, *italic*, or [links](https://example.com) to add emphasis.',
        dropCap: false,
      };
    case 'image':
      return {
        id,
        type: 'image',
        src: STUDIO_IMAGES[2].src,
        alt: STUDIO_IMAGES[2].defaultAlt,
        caption: STUDIO_IMAGES[2].defaultCaption,
        aspect: '16:9',
      };
    case 'quote':
      return {
        id,
        type: 'quote',
        text: 'Good editing is mostly the courage to leave space around the sentence that carries the weight.',
        attribution: 'Editorial Note',
      };
    case 'links':
      return {
        id,
        type: 'links',
        heading: 'Worth Reading This Week',
        items: [
          {
            id: createId('lnk'),
            title: 'Why Calm Software Outlasts Noisy Feeds',
            url: 'https://example.com/calm-software',
            source: 'Design Quarterly',
            note: 'A thoughtful breakdown of how deliberate pacing improves reader retention across independent publications.',
          },
          {
            id: createId('lnk'),
            title: 'Field Notes on Archival Paper & Ink Permanence',
            url: 'https://example.com/archival-paper',
            source: 'Press & Bindery',
            note: 'What 19th-century bookmakers can still teach digital writers about contrast and line measure.',
          },
        ],
      };
    case 'callout':
      return {
        id,
        type: 'callout',
        title: 'Editor’s Note',
        body: 'Reply directly to this email if you have a question, correction, or a piece you think belongs in next week’s dispatch.',
      };
    case 'button':
      return {
        id,
        type: 'button',
        label: 'Read the Full Archive',
        url: 'https://example.com/archive',
        alignment: 'left',
        variant: 'solid',
      };
    case 'metrics':
      return {
        id,
        type: 'metrics',
        heading: 'By the Numbers',
        items: [
          { id: createId('met'), value: '14,280', label: 'Subscribers', detail: '+620 this month' },
          { id: createId('met'), value: '54.2%', label: 'Average Open Rate', detail: 'Last 10 issues' },
          { id: createId('met'), value: '4 min', label: 'Reading Cadence', detail: 'Weekly Thursday send' },
        ],
      };
    case 'divider':
      return {
        id,
        type: 'divider',
        style: 'hairline',
      };
  }
}

export const INITIAL_ISSUES: NewsletterIssue[] = [
  {
    id: 'issue-14',
    issueNumber: '14',
    publicationName: 'The Margin Dispatch',
    subject: 'The Quiet Craft of Digital Reading',
    preheader: 'Why deliberate typography, generous line measure, and unhurried cadence keep readers coming back.',
    authorName: 'Clara Lindqvist',
    senderEmail: 'clara@margindispatch.org',
    publishDate: 'November 21, 2026',
    status: 'draft',
    updatedAt: '2026-11-21T12:40:00.000Z',
    footerNote: 'You are receiving The Margin Dispatch because you subscribed on our site.',
    addressLine: 'Folio Press · 418 Mercer Street, Suite 4B, Portland, OR',
    unsubscribeLabel: 'Unsubscribe or manage delivery preferences',
    design: {
      ...THEME_PRESETS['gallery-stark'].design,
      typography: 'editorial-serif',
      headerLayout: 'masthead',
      maxWidth: 620,
    },
    blocks: [
      {
        id: 'blk-14-img',
        type: 'image',
        src: STUDIO_IMAGES[0].src,
        alt: STUDIO_IMAGES[0].defaultAlt,
        caption: 'Fig. 1 — Morning light in the municipal reading room; architecture built around uninterrupted attention.',
        aspect: '16:9',
      },
      {
        id: 'blk-14-p1',
        type: 'paragraph',
        dropCap: true,
        text: 'Most software treats reading as a byproduct of scrolling. Yet every time you open a thoughtful newsletter on a Sunday morning, you notice the difference immediately: the rhythm slows down, the column narrows to a comfortable measure, and each paragraph earns its place on the page.',
      },
      {
        id: 'blk-14-p2',
        type: 'paragraph',
        text: 'Over the past year, we audited **forty-two independent publications** with open rates above fifty percent. Almost none of them relied on heavy graphics or promotional banners. Instead, they shared three quiet disciplines: an unmistakable voice in the first two sentences, clear visual hierarchy between sections, and a predictable weekly rhythm.',
      },
      {
        id: 'blk-14-quote',
        type: 'quote',
        text: 'A newsletter is not a billboard in someone’s inbox; it is a guest invited to the breakfast table.',
        attribution: 'Notes from our Autumn Reader Survey',
      },
      {
        id: 'blk-14-h2',
        type: 'heading',
        level: 2,
        kicker: 'Part One',
        text: 'Designing for the 65-Character Line',
      },
      {
        id: 'blk-14-p3',
        type: 'paragraph',
        text: 'When lines stretch past eighty characters, the eye loses its return path to the left margin. Keeping your email body around **600 to 620 pixels wide** with relaxed leading makes even a twelve-hundred-word essay feel effortless on both desktop monitors and phones.',
      },
      {
        id: 'blk-14-links',
        type: 'links',
        heading: 'Three Pieces Worth Your Time',
        items: [
          {
            id: 'lnk-14-1',
            title: 'The Elements of Typographic Rhythm on Small Screens',
            url: 'https://example.com/typographic-rhythm',
            source: 'Type & Measure',
            note: 'Practical benchmarks for font sizing, paragraph breaks, and mobile legibility without custom hacks.',
          },
          {
            id: 'lnk-14-2',
            title: 'How Independent Editors Build Sustainable Weekly Cadences',
            url: 'https://example.com/weekly-cadence',
            source: 'Pressroom Notes',
            note: 'Interviews with six solo writers who have shipped over two hundred consecutive issues without burnout.',
          },
          {
            id: 'lnk-14-3',
            title: 'Plain-Text Fallbacks and Why They Still Matter',
            url: 'https://example.com/plain-text-email',
            source: 'Email Craft',
            note: 'Keeping message weight under Gmail’s 102 KB clipping ceiling ensures your closing paragraph always arrives intact.',
          },
        ],
      },
      {
        id: 'blk-14-callout',
        type: 'callout',
        title: 'Reader Question for Next Week',
        body: 'Which newsletter in your inbox do you read from top to bottom every single week—and what makes it work? Hit reply and let me know; I will feature the most thoughtful answers in Issue 15.',
      },
      {
        id: 'blk-14-cta',
        type: 'button',
        label: 'Browse Past Issues in the Archive',
        url: 'https://example.com/archive',
        alignment: 'left',
        variant: 'solid',
      },
    ],
  },
  {
    id: 'issue-13',
    issueNumber: '13',
    publicationName: 'The Margin Dispatch',
    subject: 'Notes on Editorial Rhythm & Proofing',
    preheader: 'A short checklist we run through fifteen minutes before sending any dispatch to fourteen thousand readers.',
    authorName: 'Clara Lindqvist',
    senderEmail: 'clara@margindispatch.org',
    publishDate: 'November 14, 2026',
    status: 'ready',
    updatedAt: '2026-11-14T09:15:00.000Z',
    footerNote: 'You are receiving The Margin Dispatch because you subscribed on our site.',
    addressLine: 'Folio Press · 418 Mercer Street, Suite 4B, Portland, OR',
    unsubscribeLabel: 'Unsubscribe or manage delivery preferences',
    design: {
      ...THEME_PRESETS['archival-paper'].design,
      typography: 'book-monograph',
      headerLayout: 'left',
      maxWidth: 620,
    },
    blocks: [
      {
        id: 'blk-13-img',
        type: 'image',
        src: STUDIO_IMAGES[1].src,
        alt: STUDIO_IMAGES[1].defaultAlt,
        caption: 'Fig. 1 — Reviewing hard-copy proofs catches cadence errors that screens hide.',
        aspect: '16:9',
      },
      {
        id: 'blk-13-p1',
        type: 'paragraph',
        dropCap: true,
        text: 'Before an issue goes out, read the opening paragraph aloud once at speaking pace. Any sentence where you run out of breath is asking to be split in two.',
      },
      {
        id: 'blk-13-metrics',
        type: 'metrics',
        heading: 'Autumn Reader Snapshot',
        items: [
          { id: 'met-13-1', value: '14,280', label: 'Active Readers', detail: '+11% quarter over quarter' },
          { id: 'met-13-2', value: '56.4%', label: 'Median Open Rate', detail: 'Issues 01–12' },
          { id: 'met-13-3', value: '312', label: 'Reader Replies', detail: 'Avg. 26 per issue' },
        ],
      },
      {
        id: 'blk-13-divider',
        type: 'divider',
        style: 'dinkus',
      },
      {
        id: 'blk-13-p2',
        type: 'paragraph',
        text: 'Always verify your subject line alongside its preheader text. Together they form a single headline in most desktop and mobile inboxes—never repeat the exact same phrasing in both.',
      },
    ],
  },
];

function todayFormatted(): string {
  return new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export const NEWSLETTER_TEMPLATES: NewsletterTemplate[] = [
  {
    id: 'tpl-essay',
    name: 'Long-Form Essay',
    category: 'Editorial & Commentary',
    summary: 'Built for deep thinking: masthead, hero photograph, drop-cap opening, subheadings, pull quote, and reader discussion prompt.',
    estimatedRead: '5 min read',
    previewImage: STUDIO_IMAGES[0].src,
    design: {
      ...THEME_PRESETS['gallery-stark'].design,
      typography: 'editorial-serif',
      headerLayout: 'masthead',
      maxWidth: 620,
    },
    createIssue: (nextNumber: string) => ({
      id: createId('issue'),
      issueNumber: nextNumber,
      publicationName: 'The Margin Dispatch',
      subject: 'Untitled Essay Issue',
      preheader: 'A concise one-line invitation that complements your subject line in the inbox.',
      authorName: 'Clara Lindqvist',
      senderEmail: 'hello@publication.org',
      publishDate: todayFormatted(),
      status: 'draft',
      updatedAt: new Date().toISOString(),
      footerNote: 'Thank you for reading. Forward this essay to a colleague who would appreciate it.',
      addressLine: '418 Mercer Street, Suite 4B, Portland, OR',
      unsubscribeLabel: 'Unsubscribe from this list',
      design: {
        ...THEME_PRESETS['gallery-stark'].design,
        typography: 'editorial-serif',
        headerLayout: 'masthead',
        maxWidth: 620,
      },
      blocks: [
        {
          id: createId('img'),
          type: 'image',
          src: STUDIO_IMAGES[0].src,
          alt: STUDIO_IMAGES[0].defaultAlt,
          caption: 'Fig. 1 — Add a concise caption grounding your lead visual.',
          aspect: '16:9',
        },
        {
          id: createId('p'),
          type: 'paragraph',
          dropCap: true,
          text: 'Open with a concrete scene, observation, or tension that pulls the reader straight into the essay. Keep the first paragraph grounded and free of throat-clearing.',
        },
        {
          id: createId('h'),
          type: 'heading',
          level: 2,
          kicker: 'Section I',
          text: 'The Core Observation',
        },
        {
          id: createId('p'),
          type: 'paragraph',
          text: 'Develop your primary argument across two or three short paragraphs. Use **bold phrasing** sparingly to anchor scannable ideas.',
        },
        {
          id: createId('q'),
          type: 'quote',
          text: 'Place the single sentence here that you hope a reader screenshots or remembers tomorrow morning.',
          attribution: 'Source or Author',
        },
        {
          id: createId('c'),
          type: 'callout',
          title: 'Continue the Conversation',
          body: 'Reply directly to this email with your perspective—every response lands in my personal inbox.',
        },
      ],
    }),
  },
  {
    id: 'tpl-digest',
    name: 'Weekly Curated Digest',
    category: 'Curation & Links',
    summary: 'Structured for crisp weekly roundups: brief opening note, annotated link list, visual break, and closing takeaway.',
    estimatedRead: '3 min read',
    previewImage: STUDIO_IMAGES[2].src,
    design: {
      ...THEME_PRESETS['forest-monograph'].design,
      typography: 'modern-sans',
      headerLayout: 'left',
      maxWidth: 620,
    },
    createIssue: (nextNumber: string) => ({
      id: createId('issue'),
      issueNumber: nextNumber,
      publicationName: 'Field & Signal',
      subject: 'Five Ideas Worth Bookmarking This Week',
      preheader: 'Hand-picked essays, studio notes, and practical tools from the past seven days.',
      authorName: 'Editorial Desk',
      senderEmail: 'desk@fieldandsignal.org',
      publishDate: todayFormatted(),
      status: 'draft',
      updatedAt: new Date().toISOString(),
      footerNote: 'Curated weekly without sponsored clutter.',
      addressLine: '210 Pine Street, Seattle, WA',
      unsubscribeLabel: 'Unsubscribe or pause delivery',
      design: {
        ...THEME_PRESETS['forest-monograph'].design,
        typography: 'modern-sans',
        headerLayout: 'left',
        maxWidth: 620,
      },
      blocks: [
        {
          id: createId('p'),
          type: 'paragraph',
          text: 'Good morning—here are the three essays, one tool, and one quiet design detail that stayed with us all week.',
        },
        {
          id: createId('lnk'),
          type: 'links',
          heading: 'This Week’s Curated Links',
          items: [
            {
              id: createId('li'),
              title: 'Lead Article Headline Goes Here',
              url: 'https://example.com/lead-story',
              source: 'Publication Name',
              note: 'Two sentences explaining why this piece matters and what stood out.',
            },
            {
              id: createId('li'),
              title: 'Second Essential Read of the Week',
              url: 'https://example.com/second-story',
              source: 'Journal / Blog',
              note: 'A concise editorial annotation that gives readers context before clicking.',
            },
            {
              id: createId('li'),
              title: 'Tool or Resource Worth Trying',
              url: 'https://example.com/resource',
              source: 'Independent Studio',
              note: 'Explain the exact problem this solves in plain language.',
            },
          ],
        },
        {
          id: createId('img'),
          type: 'image',
          src: STUDIO_IMAGES[2].src,
          alt: STUDIO_IMAGES[2].defaultAlt,
          caption: 'Desk study — stillness before the weekend.',
          aspect: '4:3',
        },
        {
          id: createId('div'),
          type: 'divider',
          style: 'hairline',
        },
        {
          id: createId('btn'),
          type: 'button',
          label: 'Submit a Link for Next Issue',
          url: 'https://example.com/submit',
          alignment: 'left',
          variant: 'outline',
        },
      ],
    }),
  },
  {
    id: 'tpl-product',
    name: 'Studio & Product Update',
    category: 'Changelog & Releases',
    summary: 'Built for founders and product teams: headline summary, 3-metric highlight bar, release breakdown, and clear primary CTA.',
    estimatedRead: '2 min read',
    previewImage: STUDIO_IMAGES[1].src,
    design: {
      ...THEME_PRESETS['broadsheet-crimson'].design,
      typography: 'modern-sans',
      headerLayout: 'left',
      maxWidth: 620,
    },
    createIssue: (nextNumber: string) => ({
      id: createId('issue'),
      issueNumber: nextNumber,
      publicationName: 'Studio Changelog',
      subject: 'November Release: Faster Exports & Cleaner Templates',
      preheader: 'Everything we shipped this month, plus a quick look at what is next on the roadmap.',
      authorName: 'Product Team',
      senderEmail: 'updates@studio.co',
      publishDate: todayFormatted(),
      status: 'draft',
      updatedAt: new Date().toISOString(),
      footerNote: 'Monthly product updates sent to active workspace members.',
      addressLine: '88 Howard Street, San Francisco, CA',
      unsubscribeLabel: 'Manage notification preferences',
      design: {
        ...THEME_PRESETS['broadsheet-crimson'].design,
        typography: 'modern-sans',
        headerLayout: 'left',
        maxWidth: 620,
      },
      blocks: [
        {
          id: createId('p'),
          type: 'paragraph',
          text: 'This month we focused on speed, reliability, and removing friction from your everyday publishing workflow. Here is a concise summary of what is now live.',
        },
        {
          id: createId('met'),
          type: 'metrics',
          heading: 'Release Highlights',
          items: [
            { id: createId('m'), value: '2.4×', label: 'Faster Preview', detail: 'Zero layout shift' },
            { id: createId('m'), value: '14 KB', label: 'Avg. Email HTML', detail: 'Well below clip limits' },
            { id: createId('m'), value: '100%', label: 'Client Compatibility', detail: 'Gmail, Apple, Outlook' },
          ],
        },
        {
          id: createId('h'),
          type: 'heading',
          level: 2,
          kicker: 'What’s New',
          text: 'Table-Safe Inline CSS Export',
        },
        {
          id: createId('p'),
          type: 'paragraph',
          text: 'Every layout now compiles directly to clean, inline-styled email HTML alongside Markdown and plain-text fallbacks—ready to paste into your sending platform.',
        },
        {
          id: createId('btn'),
          type: 'button',
          label: 'Explore Full Release Notes',
          url: 'https://example.com/changelog',
          alignment: 'center',
          variant: 'solid',
        },
      ],
    }),
  },
  {
    id: 'tpl-letter',
    name: 'Personal Member Letter',
    category: 'Patron & Community',
    summary: 'Warm archival paper with bookish serif typography, minimal framing, and intimate prose meant for close readers.',
    estimatedRead: '4 min read',
    previewImage: STUDIO_IMAGES[1].src,
    design: {
      ...THEME_PRESETS['archival-paper'].design,
      typography: 'book-monograph',
      headerLayout: 'minimal',
      maxWidth: 580,
    },
    createIssue: (nextNumber: string) => ({
      id: createId('issue'),
      issueNumber: nextNumber,
      publicationName: 'Letters from the Studio',
      subject: 'A Quick Note Before the Month Closes',
      preheader: 'Reflections on recent work, what slowed us down, and where we are focusing next.',
      authorName: 'Julian Vance',
      senderEmail: 'julian@studioletters.org',
      publishDate: todayFormatted(),
      status: 'draft',
      updatedAt: new Date().toISOString(),
      footerNote: 'Sent exclusively to supporting members.',
      addressLine: 'Studio 12, Antwerp',
      unsubscribeLabel: 'Unsubscribe from member letters',
      design: {
        ...THEME_PRESETS['archival-paper'].design,
        typography: 'book-monograph',
        headerLayout: 'minimal',
        maxWidth: 580,
      },
      blocks: [
        {
          id: createId('p'),
          type: 'paragraph',
          text: 'Friends,',
        },
        {
          id: createId('p'),
          type: 'paragraph',
          text: 'It has been a quietly productive autumn at the studio. Rather than sending a polished marketing announcement, I wanted to share a candid account of what worked, what we shelved, and what we are building through winter.',
        },
        {
          id: createId('div'),
          type: 'divider',
          style: 'dinkus',
        },
        {
          id: createId('p'),
          type: 'paragraph',
          text: 'Add your personal reflection here. Plain paragraphs with generous breathing room often outperform heavily formatted campaigns when writing directly to members.',
        },
        {
          id: createId('p'),
          type: 'paragraph',
          text: 'Warmly,\nJulian',
        },
      ],
    }),
  },
];
