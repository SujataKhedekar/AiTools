// Central registry. Every tool in the app is defined here as data.
// One dynamic page renders any tool, and one API route runs any tool,
// by reading the `fields` (the form) and `system` (the Claude instruction).

export type FieldType = "text" | "textarea" | "select" | "number";

export interface Field {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  options?: string[];
  required?: boolean;
  /** textarea rows */
  rows?: number;
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
  blurb: string;
  /** tailwind gradient stops used for accents */
  from: string;
  to: string;
  /** soft text/border tint */
  tint: string;
}

export interface Tool {
  slug: string;
  category: string;
  name: string;
  blurb: string;
  fields: Field[];
  /** system prompt that turns generic Claude into this specific tool */
  system: string;
  /** short instruction prepended to the user's inputs */
  instruction: string;
  isNew?: boolean;
}

export const CATEGORIES: Category[] = [
  {
    id: "ai-service",
    name: "AI Service",
    emoji: "🤖",
    blurb: "Writing, summarizing, translating & assistant builders.",
    from: "from-indigo-500",
    to: "to-violet-500",
    tint: "text-indigo-300",
  },
  {
    id: "web-developer",
    name: "Web Developer",
    emoji: "💻",
    blurb: "Generate, explain, debug and document code.",
    from: "from-sky-500",
    to: "to-blue-600",
    tint: "text-sky-300",
  },
  {
    id: "social-content",
    name: "Social Content",
    emoji: "📱",
    blurb: "Captions, hooks, hashtags & platform-ready posts.",
    from: "from-teal-400",
    to: "to-emerald-500",
    tint: "text-teal-300",
  },
  {
    id: "design",
    name: "Design",
    emoji: "🎨",
    blurb: "Briefs, palettes, prompts & creative direction.",
    from: "from-amber-400",
    to: "to-orange-500",
    tint: "text-amber-300",
  },
  {
    id: "video",
    name: "Video",
    emoji: "🎬",
    blurb: "Scripts, titles, voiceovers & descriptions.",
    from: "from-rose-500",
    to: "to-red-500",
    tint: "text-rose-300",
  },
  {
    id: "ecommerce",
    name: "E-commerce",
    emoji: "🛍️",
    blurb: "Product copy, listings & conversion writing.",
    from: "from-lime-400",
    to: "to-green-500",
    tint: "text-lime-300",
  },
  {
    id: "content-writing",
    name: "Content Writing",
    emoji: "📝",
    blurb: "Blogs, newsletters, PR & long-form drafting.",
    from: "from-pink-500",
    to: "to-fuchsia-500",
    tint: "text-pink-300",
  },
  {
    id: "business-tools",
    name: "Business Tools",
    emoji: "📊",
    blurb: "Decks, plans, proposals & operations docs.",
    from: "from-zinc-400",
    to: "to-slate-500",
    tint: "text-zinc-300",
  },
];

// --- small builders to keep the registry compact -------------------------

const TEXTAREA = (name: string, label: string, placeholder: string, rows = 5, required = true): Field => ({
  name,
  label,
  type: "textarea",
  placeholder,
  rows,
  required,
});
const TEXT = (name: string, label: string, placeholder: string, required = true): Field => ({
  name,
  label,
  type: "text",
  placeholder,
  required,
});
const SELECT = (name: string, label: string, options: string[]): Field => ({
  name,
  label,
  type: "select",
  options,
});

const TONE = SELECT("tone", "Tone", [
  "Professional",
  "Friendly",
  "Confident",
  "Playful",
  "Persuasive",
  "Minimal",
]);

// --- the tools ------------------------------------------------------------

export const TOOLS: Tool[] = [
  // ===================== AI SERVICE =====================
  {
    slug: "prompt-generator",
    category: "ai-service",
    name: "Prompt Generator",
    blurb: "Turn a rough idea into a precise, structured AI prompt.",
    fields: [TEXTAREA("idea", "Your idea", "e.g. a prompt that writes cold sales emails"), SELECT("model", "Target model", ["Any LLM", "Claude", "Image model", "Coding model"])],
    instruction: "Create an optimized, reusable prompt based on the idea below.",
    system:
      "You are a world-class prompt engineer. Produce a single, well-structured prompt with clear role, context, task, constraints, and output format. Add a short 'How to use' note. Keep it copy-paste ready.",
  },
  {
    slug: "code-minimizer",
    category: "ai-service",
    name: "Code Minimizer",
    blurb: "Shrink code while keeping behaviour identical.",
    fields: [TEXTAREA("code", "Code", "Paste code to minify / simplify", 8), SELECT("lang", "Language", ["Auto", "JavaScript", "TypeScript", "Python", "CSS", "HTML"])],
    instruction: "Minimize and simplify this code without changing its behaviour.",
    system:
      "You are an expert software engineer. Return the minimized code in a single fenced code block, then a one-line summary of what you changed. Preserve correctness.",
  },
  {
    slug: "schema-generator",
    category: "ai-service",
    name: "Schema Generator",
    blurb: "Generate JSON Schema or DB schema from a description.",
    fields: [TEXTAREA("description", "Describe the data", "e.g. a blog post with author, tags, comments"), SELECT("format", "Output", ["JSON Schema", "TypeScript types", "SQL table", "Zod"])],
    instruction: "Generate a schema for the data described below.",
    system:
      "You output clean, valid schemas in a fenced code block matching the requested format, followed by a brief field-by-field explanation.",
  },
  {
    slug: "meta-title",
    category: "ai-service",
    name: "Meta Title Generator",
    blurb: "SEO page titles under 60 characters.",
    fields: [TEXT("topic", "Page / topic", "e.g. best running shoes 2026"), TEXT("keyword", "Primary keyword", "running shoes", false)],
    instruction: "Write SEO meta titles for the page below.",
    system:
      "You are an SEO specialist. Produce 8 click-worthy meta titles, each under 60 characters, numbered. Front-load the keyword where natural.",
  },
  {
    slug: "meta-description",
    category: "ai-service",
    name: "Meta Description Generator",
    blurb: "Compelling search snippets under 155 characters.",
    fields: [TEXT("topic", "Page / topic", "e.g. best running shoes 2026"), TEXT("keyword", "Primary keyword", "running shoes", false)],
    instruction: "Write SEO meta descriptions for the page below.",
    system:
      "You are an SEO copywriter. Produce 6 meta descriptions, each 140-155 characters, with a clear value proposition and call to action. Number them.",
  },
  {
    slug: "ai-email-writer",
    category: "ai-service",
    name: "AI Email Writer",
    blurb: "Draft any email in seconds.",
    isNew: true,
    fields: [TEXTAREA("about", "What's the email about?", "e.g. follow up after a sales demo, asking for next steps"), SELECT("type", "Type", ["Outreach", "Follow-up", "Apology", "Announcement", "Sales", "Internal"]), TONE],
    instruction: "Write an email based on the details below.",
    system:
      "You are an expert business communicator. Write a complete email with a strong subject line, greeting, concise body, and clear call to action. Match the requested tone.",
  },
  {
    slug: "ai-resume-builder",
    category: "ai-service",
    name: "AI Resume Builder",
    blurb: "Polished, ATS-friendly resume bullets & sections.",
    isNew: true,
    fields: [TEXT("role", "Target role", "e.g. Senior Product Designer"), TEXTAREA("experience", "Experience / background", "Companies, responsibilities, achievements, skills"), TEXT("years", "Years of experience", "e.g. 6", false)],
    instruction: "Build a strong, ATS-friendly resume from the information below.",
    system:
      "You are a professional resume writer. Produce a clean resume with Summary, Skills, Experience (achievement-focused bullets with metrics), and Education. Use strong action verbs and quantify impact.",
  },
  {
    slug: "ai-cover-letter",
    category: "ai-service",
    name: "AI Cover Letter",
    blurb: "Tailored cover letters that get replies.",
    isNew: true,
    fields: [TEXT("role", "Role & company", "e.g. Frontend Engineer at Vercel"), TEXTAREA("background", "Your background", "Relevant experience, skills, why you're a fit"), TONE],
    instruction: "Write a tailored cover letter using the details below.",
    system:
      "You are a career coach. Write a one-page cover letter: a hook opening, two body paragraphs tying experience to the role, and a confident close. Avoid clichés.",
  },
  {
    slug: "ai-chatbot-builder",
    category: "ai-service",
    name: "AI Chatbot Builder",
    blurb: "Generate a chatbot persona & system prompt.",
    isNew: true,
    fields: [TEXT("purpose", "Chatbot purpose", "e.g. support bot for a SaaS billing tool"), TEXTAREA("knowledge", "Key facts / rules", "What it should know, do, and never do", 5, false), TONE],
    instruction: "Design a chatbot configuration for the use case below.",
    system:
      "You are a conversation designer. Output: 1) a system prompt for the bot, 2) a persona summary, 3) 5 example user questions with ideal answers, 4) guardrails. Use clear headings.",
  },
  {
    slug: "ai-faq-generator",
    category: "ai-service",
    name: "AI FAQ Generator",
    blurb: "Anticipate and answer customer questions.",
    isNew: true,
    fields: [TEXTAREA("topic", "Product / topic", "Describe your product, service, or page"), { name: "count", label: "How many FAQs", type: "number", placeholder: "8" }],
    instruction: "Generate frequently asked questions with answers for the topic below.",
    system:
      "You write helpful FAQ sections. Produce concise, genuinely useful Q&A pairs that address real buyer objections. Format as **Q:** / **A:**.",
  },
  {
    slug: "ai-summarizer",
    category: "ai-service",
    name: "AI Summarizer",
    blurb: "Condense long text into clear key points.",
    isNew: true,
    fields: [TEXTAREA("text", "Text to summarize", "Paste an article, transcript, or document", 10), SELECT("length", "Length", ["TL;DR (1 line)", "Short paragraph", "Bullet points", "Detailed"])],
    instruction: "Summarize the text below.",
    system:
      "You are an expert at distilling information. Summarize accurately at the requested length, preserving the key facts, numbers, and conclusions. No fluff.",
  },
  {
    slug: "ai-translator",
    category: "ai-service",
    name: "AI Translator",
    blurb: "Natural, context-aware translation.",
    isNew: true,
    fields: [TEXTAREA("text", "Text", "Paste text to translate", 6), TEXT("language", "Translate to", "e.g. Spanish, Japanese, French"), SELECT("style", "Style", ["Natural", "Formal", "Casual", "Literal"])],
    instruction: "Translate the text below.",
    system:
      "You are a professional translator. Provide a fluent, culturally-appropriate translation in the requested style. If helpful, add a brief note on any nuance that doesn't translate directly.",
  },
  {
    slug: "ai-voice-to-text",
    category: "ai-service",
    name: "Transcript Cleaner",
    blurb: "Clean up and format raw transcripts.",
    isNew: true,
    fields: [TEXTAREA("transcript", "Raw transcript", "Paste a messy / auto-generated transcript", 10), SELECT("output", "Output", ["Clean paragraphs", "Speaker-labelled", "Summary + transcript"])],
    instruction: "Clean up and format the raw transcript below.",
    system:
      "You fix auto-generated transcripts: correct punctuation and obvious errors, remove filler words, add paragraph breaks, and format per the requested output. Do not invent content.",
  },

  // ===================== WEB DEVELOPER =====================
  {
    slug: "vibe-coder",
    category: "web-developer",
    name: "Vibe Coder",
    blurb: "Describe an app, get working starter code.",
    fields: [TEXTAREA("idea", "What do you want to build?", "e.g. a todo app with filters and localStorage"), SELECT("stack", "Stack", ["React + Tailwind", "Next.js", "Vanilla JS", "HTML/CSS", "Python"])],
    instruction: "Build a working starter for the idea below.",
    system:
      "You are a senior full-stack engineer. Return clean, runnable code in fenced blocks with brief setup notes. Prefer a single-file solution when reasonable.",
  },
  {
    slug: "image-to-code",
    category: "web-developer",
    name: "Image → Code (describe)",
    blurb: "Describe a UI, get the markup that builds it.",
    fields: [TEXTAREA("ui", "Describe the UI", "e.g. a pricing section with 3 cards and a toggle"), SELECT("stack", "Output", ["React + Tailwind", "HTML + Tailwind", "HTML + CSS"])],
    instruction: "Generate front-end code for the UI described below.",
    system:
      "You are a front-end engineer. Output responsive, accessible code in a single fenced block. Use semantic HTML and sensible defaults.",
  },
  {
    slug: "landing-page-generator",
    category: "web-developer",
    name: "Landing Page Generator",
    blurb: "Full landing page copy + structure.",
    fields: [TEXT("product", "Product", "e.g. an AI note-taking app"), TEXTAREA("audience", "Audience & key benefits", "Who it's for and why they'd love it", 4)],
    instruction: "Generate a complete landing page for the product below.",
    system:
      "You are a conversion copywriter and front-end dev. Produce a single HTML+Tailwind page: hero, features, social proof, FAQ, CTA. Realistic, compelling copy throughout.",
  },
  {
    slug: "web-page-generator",
    category: "web-developer",
    name: "Web Page Generator",
    blurb: "Any single page from a prompt.",
    fields: [TEXTAREA("page", "Describe the page", "e.g. an about page for a coffee roastery"), SELECT("stack", "Output", ["HTML + Tailwind", "React + Tailwind"])],
    instruction: "Generate the web page described below.",
    system:
      "You build polished single pages. Return one fenced code block, responsive and self-contained, with tasteful placeholder content.",
  },
  {
    slug: "shopify-theme",
    category: "web-developer",
    name: "Shopify Section Builder",
    blurb: "Liquid section markup for Shopify themes.",
    fields: [TEXTAREA("section", "Describe the section", "e.g. a featured-collection grid with a heading"), TEXT("name", "Section name", "Featured Collection", false)],
    instruction: "Generate a Shopify Liquid section for the description below.",
    system:
      "You are a Shopify theme developer. Output a complete `.liquid` section with schema settings in a fenced block, plus a one-line install note.",
  },
  {
    slug: "api-doc-generator",
    category: "web-developer",
    name: "API Doc Generator",
    blurb: "Readable docs from an endpoint spec.",
    isNew: true,
    fields: [TEXTAREA("endpoint", "Endpoint details", "Method, path, params, example request/response", 7)],
    instruction: "Write API documentation for the endpoint below.",
    system:
      "You write developer documentation. Produce: description, auth, parameters table, example request (curl), example response, and error codes. Use Markdown.",
  },
  {
    slug: "bug-fixer",
    category: "web-developer",
    name: "Bug Fixer",
    blurb: "Find and fix the bug, with an explanation.",
    isNew: true,
    fields: [TEXTAREA("code", "Code", "Paste the buggy code", 8), TEXT("error", "Error / symptom", "e.g. TypeError: undefined is not a function", false)],
    instruction: "Find and fix the bug in the code below.",
    system:
      "You are a debugging expert. Identify the root cause, return the corrected code in a fenced block, and explain the fix in 2-3 sentences.",
  },
  {
    slug: "code-explainer",
    category: "web-developer",
    name: "Code Explainer",
    blurb: "Plain-English walkthrough of any code.",
    isNew: true,
    fields: [TEXTAREA("code", "Code", "Paste code to explain", 8), SELECT("level", "Audience", ["Beginner", "Intermediate", "Expert"])],
    instruction: "Explain the code below.",
    system:
      "You are a patient engineering mentor. Explain what the code does, how it works step by step, and any gotchas — pitched at the requested level.",
  },
  {
    slug: "database-schema-builder",
    category: "web-developer",
    name: "Database Schema Builder",
    blurb: "Tables, relations & SQL from a description.",
    isNew: true,
    fields: [TEXTAREA("app", "Describe the app data", "e.g. a marketplace with users, listings, orders, reviews"), SELECT("db", "Database", ["PostgreSQL", "MySQL", "SQLite", "MongoDB"])],
    instruction: "Design a database schema for the app described below.",
    system:
      "You are a database architect. Output CREATE statements (or collection shapes) with primary/foreign keys and indexes in a fenced block, then an ER summary of relationships.",
  },
  {
    slug: "json-formatter",
    category: "web-developer",
    name: "JSON Formatter & Fixer",
    blurb: "Format, validate and repair JSON.",
    isNew: true,
    fields: [TEXTAREA("json", "JSON", "Paste JSON to format or fix", 8)],
    instruction: "Format and validate the JSON below, fixing any errors.",
    system:
      "You format and repair JSON. Return valid, pretty-printed JSON in a fenced block. If it was invalid, list the fixes you made below it.",
  },
  {
    slug: "regex-generator",
    category: "web-developer",
    name: "Regex Generator",
    blurb: "Describe a pattern, get the regex.",
    isNew: true,
    fields: [TEXTAREA("need", "What should it match?", "e.g. valid emails, or dates like 2026-01-31"), SELECT("flavor", "Flavor", ["JavaScript", "Python", "PCRE", "Go"])],
    instruction: "Create a regular expression for the requirement below.",
    system:
      "You are a regex expert. Provide the pattern in a fenced block, an explanation of each part, and 3 matching plus 2 non-matching examples.",
  },
  {
    slug: "seo-audit-tool",
    category: "web-developer",
    name: "SEO Audit Helper",
    blurb: "Spot on-page SEO issues & fixes.",
    isNew: true,
    fields: [TEXTAREA("page", "Page content / HTML head", "Paste title, meta, headings, or full HTML", 8), TEXT("keyword", "Target keyword", "", false)],
    instruction: "Audit the page below for on-page SEO.",
    system:
      "You are a technical SEO auditor. Review titles, meta, headings, content, and keyword usage. Return a prioritized checklist of issues with concrete fixes.",
  },
  {
    slug: "ui-component-generator",
    category: "web-developer",
    name: "UI Component Generator",
    blurb: "Reusable React + Tailwind components.",
    isNew: true,
    fields: [TEXTAREA("component", "Describe the component", "e.g. a testimonial card with avatar, name, quote and rating"), SELECT("stack", "Output", ["React + Tailwind", "HTML + Tailwind"])],
    instruction: "Generate the UI component described below.",
    system:
      "You build reusable components. Return a single fenced code block: typed props, accessible markup, Tailwind styling, and a usage example.",
  },

  // ===================== SOCIAL CONTENT =====================
  {
    slug: "social-prompt-generator",
    category: "social-content",
    name: "Content Idea Generator",
    blurb: "Endless post ideas for any niche.",
    fields: [TEXT("niche", "Niche / brand", "e.g. sustainable skincare"), SELECT("platform", "Platform", ["Instagram", "TikTok", "X/Twitter", "LinkedIn", "YouTube"])],
    instruction: "Generate fresh content ideas for the niche below.",
    system:
      "You are a social media strategist. Produce 12 specific, scroll-stopping post ideas tailored to the platform, each with a one-line angle. Number them.",
  },
  {
    slug: "hashtag-generator",
    category: "social-content",
    name: "Hashtag Generator",
    blurb: "Balanced hashtag sets that boost reach.",
    fields: [TEXTAREA("post", "Post / topic", "Describe your post or paste the caption"), SELECT("platform", "Platform", ["Instagram", "TikTok", "LinkedIn", "X/Twitter"])],
    instruction: "Generate hashtags for the post below.",
    system:
      "You are a growth marketer. Return a mix of broad, niche, and long-tail hashtags (about 20), grouped by reach. Avoid banned/spammy tags.",
  },
  {
    slug: "trending-reel-suggestions",
    category: "social-content",
    name: "Reel Idea Generator",
    blurb: "Short-form video concepts that hook fast.",
    fields: [TEXT("niche", "Niche", "e.g. home fitness"), SELECT("goal", "Goal", ["Reach", "Saves", "Sales", "Follows"])],
    instruction: "Suggest short-form video concepts for the niche below.",
    system:
      "You are a short-form video producer. Give 8 reel concepts, each with hook, shot list, on-screen text, and a trending-style audio suggestion.",
  },
  {
    slug: "trending-songs-instagram",
    category: "social-content",
    name: "Audio / Vibe Matcher",
    blurb: "Match the right audio mood to your content.",
    fields: [TEXTAREA("content", "Describe your content", "e.g. a calm morning routine reel"), SELECT("mood", "Desired vibe", ["Upbeat", "Calm", "Cinematic", "Trendy", "Emotional"])],
    instruction: "Recommend audio direction for the content below.",
    system:
      "You advise creators on audio. Describe the ideal sound profile, tempo, and genre, and give search terms to find matching trending audio on Instagram/TikTok. (You can't access live charts, so give evergreen guidance.)",
  },
  {
    slug: "caption-generator",
    category: "social-content",
    name: "Caption Generator",
    blurb: "Captions that stop the scroll.",
    fields: [TEXTAREA("post", "What's the post about?", "Describe the photo/video or message"), SELECT("platform", "Platform", ["Instagram", "TikTok", "LinkedIn", "X/Twitter"]), TONE],
    instruction: "Write captions for the post below.",
    system:
      "You are a social copywriter. Produce 5 caption options with a strong hook first line, a body, and a CTA. Add a few fitting emojis where natural.",
  },
  {
    slug: "trending-topics",
    category: "social-content",
    name: "Topic Angle Finder",
    blurb: "Fresh angles on what your audience cares about.",
    fields: [TEXT("niche", "Niche", "e.g. personal finance for Gen Z"), SELECT("format", "Format", ["Carousel", "Reel", "Thread", "Blog"])],
    instruction: "Find content angles for the niche below.",
    system:
      "You are a content researcher. Suggest 10 evergreen-but-fresh topic angles likely to resonate, each with a one-line reason it works. Number them.",
  },
  {
    slug: "bio-link-builder",
    category: "social-content",
    name: "Bio Link Builder",
    blurb: "Optimized profile bios & link-in-bio copy.",
    isNew: true,
    fields: [TEXT("brand", "Brand / person", "e.g. fitness coach helping busy moms"), SELECT("platform", "Platform", ["Instagram", "TikTok", "X/Twitter", "LinkedIn"])],
    instruction: "Write profile bio options for the brand below.",
    system:
      "You write punchy social bios within character limits. Give 5 bio options plus a suggested link-in-bio button list (4-6 buttons).",
  },
  {
    slug: "content-calendar",
    category: "social-content",
    name: "Content Calendar",
    blurb: "A week of posts, planned for you.",
    isNew: true,
    fields: [TEXT("niche", "Niche", "e.g. indie coffee shop"), SELECT("platform", "Platform", ["Instagram", "TikTok", "LinkedIn", "Multi-platform"]), SELECT("days", "Span", ["7 days", "14 days", "30 days"])],
    instruction: "Build a content calendar for the brand below.",
    system:
      "You are a content planner. Output a table: Day | Format | Hook/Title | Caption idea | CTA. Keep it varied and on-brand.",
  },
  {
    slug: "reply-generator",
    category: "social-content",
    name: "Reply Generator",
    blurb: "On-brand replies to comments & DMs.",
    isNew: true,
    fields: [TEXTAREA("message", "Comment / DM", "Paste the message you received"), TONE],
    instruction: "Write reply options for the message below.",
    system:
      "You handle community management. Give 3 reply options of varying warmth, each concise and on-brand. Flag if a message looks like spam or a troll.",
  },
  {
    slug: "viral-hook-writer",
    category: "social-content",
    name: "Viral Hook Writer",
    blurb: "First-3-second hooks that retain viewers.",
    isNew: true,
    fields: [TEXTAREA("topic", "Video / post topic", "What's it about?"), SELECT("platform", "Platform", ["TikTok", "Reels", "YouTube", "X/Twitter"])],
    instruction: "Write scroll-stopping hooks for the topic below.",
    system:
      "You are a viral content expert. Produce 12 hook lines using proven patterns (curiosity, contrarian, stakes, listicle). Punchy, under 12 words each. Number them.",
  },
  {
    slug: "youtube-title-optimizer",
    category: "social-content",
    name: "YouTube Title Optimizer",
    blurb: "High-CTR titles without clickbait.",
    isNew: true,
    fields: [TEXTAREA("video", "What's the video about?", "Describe the content"), TEXT("keyword", "Keyword", "", false)],
    instruction: "Generate YouTube titles for the video below.",
    system:
      "You optimize YouTube titles for CTR. Give 10 titles under 60 characters mixing curiosity and clarity, then suggest the single best one with a reason.",
  },
  {
    slug: "thread-writer",
    category: "social-content",
    name: "Thread Writer (X)",
    blurb: "Cohesive, high-retention X threads.",
    isNew: true,
    fields: [TEXTAREA("topic", "Topic", "What's the thread about?"), { name: "count", label: "Number of posts", type: "number", placeholder: "7" }],
    instruction: "Write an X/Twitter thread on the topic below.",
    system:
      "You write viral threads. Open with a strong hook tweet, deliver value per post, number each post, and end with a CTA. Keep each post under 280 characters.",
  },
  {
    slug: "linkedin-post-writer",
    category: "social-content",
    name: "LinkedIn Post Writer",
    blurb: "Professional posts that drive engagement.",
    isNew: true,
    fields: [TEXTAREA("idea", "Post idea / story", "What do you want to share?"), SELECT("goal", "Goal", ["Thought leadership", "Hiring", "Promotion", "Storytelling"])],
    instruction: "Write a LinkedIn post for the idea below.",
    system:
      "You write engaging LinkedIn posts: a hook first line, short punchy paragraphs with line breaks, a takeaway, and a question to spark comments. Professional, not corporate.",
  },

  // ===================== DESIGN =====================
  {
    slug: "background-remover",
    category: "design",
    name: "Cutout Brief",
    blurb: "Prep specs for clean product cutouts.",
    fields: [TEXTAREA("image", "Describe the image", "e.g. a sneaker on a cluttered desk"), SELECT("use", "Final use", ["E-commerce white bg", "Transparent PNG", "Lifestyle composite"])],
    instruction: "Create cutout & background guidance for the image below.",
    system:
      "You are a photo retoucher. Describe how to cut out the subject cleanly, edge/shadow handling, the ideal replacement background, and export settings for the stated use.",
  },
  {
    slug: "image-generator",
    category: "design",
    name: "Image Prompt Studio",
    blurb: "Detailed prompts for AI image models.",
    fields: [TEXTAREA("subject", "What do you want to see?", "e.g. a cozy reading nook by a rainy window"), SELECT("style", "Style", ["Photorealistic", "3D render", "Illustration", "Minimal", "Cinematic"]), SELECT("ratio", "Aspect ratio", ["1:1", "16:9", "9:16", "4:5"])],
    instruction: "Write an AI image-generation prompt for the request below.",
    system:
      "You are an expert at prompting image models. Output one richly detailed prompt (subject, composition, lighting, style, lens, mood), a negative prompt, and the recommended settings.",
  },
  {
    slug: "image-enhancer",
    category: "design",
    name: "Photo Enhance Guide",
    blurb: "Step-by-step edits to elevate a photo.",
    fields: [TEXTAREA("photo", "Describe the photo & issues", "e.g. dim indoor portrait, slightly blurry"), SELECT("look", "Target look", ["Natural", "Bright & airy", "Moody", "Product-clean"])],
    instruction: "Give an enhancement plan for the photo below.",
    system:
      "You are a photo editor. Provide an ordered edit recipe (exposure, color, sharpening, retouch) with specific adjustment values to reach the target look.",
  },
  {
    slug: "brand-guidelines",
    category: "design",
    name: "Brand Guidelines",
    blurb: "Voice, colors & usage rules for a brand.",
    fields: [TEXT("brand", "Brand", "e.g. a premium tea startup"), TEXTAREA("values", "Values & vibe", "What should it feel like? Who is it for?", 4)],
    instruction: "Draft brand guidelines for the brand below.",
    system:
      "You are a brand strategist. Produce mini brand guidelines: positioning, voice & tone, a color palette with hex codes, font pairing, and do/don't rules.",
  },
  {
    slug: "moodboard",
    category: "design",
    name: "Moodboard Brief",
    blurb: "A clear creative direction to source visuals.",
    fields: [TEXT("project", "Project", "e.g. wedding photography rebrand"), SELECT("aesthetic", "Aesthetic", ["Minimal", "Maximalist", "Retro", "Futuristic", "Organic"])],
    instruction: "Create a moodboard brief for the project below.",
    system:
      "You are an art director. Describe the visual direction: color story (hex), textures, typography feel, imagery themes, and 8 specific search terms to find matching references.",
  },
  {
    slug: "ai-shadow-generator",
    category: "design",
    name: "Shadow & Depth Guide",
    blurb: "Realistic shadow setups for product shots.",
    fields: [TEXTAREA("product", "Product & scene", "e.g. a perfume bottle on marble"), SELECT("type", "Shadow style", ["Soft natural", "Hard dramatic", "Floating", "Reflection"])],
    instruction: "Specify a shadow/lighting setup for the product below.",
    system:
      "You are a product photographer. Specify light position, softness, shadow direction/length, and (for compositing) CSS or layer settings to achieve the requested shadow style.",
  },
  {
    slug: "image-prompt-generator",
    category: "design",
    name: "Image Prompt Generator",
    blurb: "Quick prompts from a one-line idea.",
    fields: [TEXT("idea", "One-line idea", "e.g. astronaut watering plants on mars"), SELECT("model", "For model", ["Generic", "Midjourney-style", "Photoreal", "Flat illustration"])],
    instruction: "Expand the idea below into image prompts.",
    system:
      "You craft image prompts. Return 3 varied, detailed prompt options for the idea, each one line, with style and composition cues.",
  },
  {
    slug: "icon-generator",
    category: "design",
    name: "Icon Concept Generator",
    blurb: "Icon concepts & SVG starters.",
    fields: [TEXT("concept", "Icon concept", "e.g. a friendly analytics dashboard"), SELECT("style", "Style", ["Line", "Solid", "Duotone", "Rounded"])],
    instruction: "Design icon concepts for the idea below.",
    system:
      "You design icons. Describe 3 icon concepts (metaphor, shapes, stroke), then provide a clean starter SVG for the strongest concept in a fenced block.",
  },
  {
    slug: "color-palette-generator",
    category: "design",
    name: "Color Palette Generator",
    blurb: "Harmonious palettes with hex codes.",
    fields: [TEXT("brief", "Describe the mood/brand", "e.g. calm wellness app"), SELECT("type", "Palette type", ["Brand", "Website UI", "Gradient set", "Pastel"])],
    instruction: "Generate a color palette for the brief below.",
    system:
      "You are a color expert. Output a palette of 5-6 colors with names, hex codes, and roles (primary, accent, background, text). Note accessibility/contrast. Add one gradient suggestion.",
  },
  {
    slug: "logo-maker",
    category: "design",
    name: "Logo Concept Maker",
    blurb: "Logo directions & a starter mark.",
    isNew: true,
    fields: [TEXT("brand", "Brand name", "e.g. Northwind Coffee"), TEXTAREA("about", "About the brand", "Industry, personality, audience", 3)],
    instruction: "Create logo concepts for the brand below.",
    system:
      "You are a logo designer. Give 3 distinct logo directions (concept, type style, color, symbol idea), then a simple starter SVG wordmark/monogram in a fenced block.",
  },
  {
    slug: "font-pairing-tool",
    category: "design",
    name: "Font Pairing Tool",
    blurb: "Heading + body font combinations.",
    isNew: true,
    fields: [TEXT("project", "Project / vibe", "e.g. editorial fashion blog"), SELECT("source", "Source", ["Google Fonts", "System fonts", "Any"])],
    instruction: "Recommend font pairings for the project below.",
    system:
      "You are a typographer. Recommend 4 heading+body pairings with rationale, suggested weights/sizes, and a CSS `font-family` snippet for each.",
  },
  {
    slug: "ui-wireframe-generator",
    category: "design",
    name: "Wireframe Generator",
    blurb: "Low-fi layout structure for any screen.",
    isNew: true,
    fields: [TEXTAREA("screen", "Describe the screen", "e.g. a SaaS dashboard home"), SELECT("device", "Device", ["Desktop", "Mobile", "Tablet"])],
    instruction: "Produce a wireframe layout for the screen below.",
    system:
      "You are a UX designer. Describe the layout section by section (top to bottom) with components and hierarchy, then render an ASCII wireframe in a fenced block.",
  },
  {
    slug: "infographic-maker",
    category: "design",
    name: "Infographic Planner",
    blurb: "Structure & copy for a clear infographic.",
    isNew: true,
    fields: [TEXTAREA("topic", "Topic / data", "What should the infographic explain?"), SELECT("type", "Type", ["Process", "Comparison", "Stats", "Timeline"])],
    instruction: "Plan an infographic for the topic below.",
    system:
      "You design infographics. Output a section-by-section layout: title, each block's headline + microcopy + suggested icon/visual, and a color/flow recommendation.",
  },
  {
    slug: "mockup-generator",
    category: "design",
    name: "Mockup Scene Brief",
    blurb: "Stage your product in the perfect scene.",
    isNew: true,
    fields: [TEXTAREA("product", "Product", "e.g. a phone app screenshot"), SELECT("scene", "Scene", ["Studio", "Lifestyle", "Flat lay", "Outdoor"])],
    instruction: "Create a mockup scene brief for the product below.",
    system:
      "You art-direct product mockups. Describe the scene, props, angle, lighting, surface, and color story, plus an image-model prompt to generate it.",
  },

  // ===================== VIDEO =====================
  {
    slug: "minimal-template",
    category: "video",
    name: "Video Outline Template",
    blurb: "A clean structure for any video.",
    fields: [TEXT("topic", "Video topic", "e.g. how to start journaling"), SELECT("length", "Length", ["< 1 min", "1-3 min", "5-10 min", "10+ min"])],
    instruction: "Create a video outline for the topic below.",
    system:
      "You are a video producer. Output a timestamped outline: hook, intro, main beats, b-roll notes, and outro/CTA, scaled to the requested length.",
  },
  {
    slug: "video-script-writer",
    category: "video",
    name: "Video Script Writer",
    blurb: "Full spoken script, ready to record.",
    isNew: true,
    fields: [TEXTAREA("topic", "Topic & key points", "What should the video cover?"), SELECT("length", "Length", ["30 sec", "60 sec", "3 min", "5-10 min"]), TONE],
    instruction: "Write a video script for the brief below.",
    system:
      "You are a scriptwriter. Write a natural, spoken-word script with a strong hook, clear sections, [b-roll] and [on-screen text] cues, and a CTA.",
  },
  {
    slug: "video-title-generator",
    category: "video",
    name: "Video Title Generator",
    blurb: "Titles built for clicks and search.",
    isNew: true,
    fields: [TEXTAREA("video", "Video topic", "Describe the content"), SELECT("platform", "Platform", ["YouTube", "TikTok", "Reels", "Shorts"])],
    instruction: "Generate video titles for the content below.",
    system:
      "You optimize video titles. Give 10 platform-appropriate titles balancing curiosity, clarity, and keywords. Number them and star your top pick.",
  },
  {
    slug: "shorts-idea-generator",
    category: "video",
    name: "Shorts Idea Generator",
    blurb: "Snackable short-form video concepts.",
    isNew: true,
    fields: [TEXT("niche", "Niche / channel", "e.g. cooking on a budget"), { name: "count", label: "How many ideas", type: "number", placeholder: "10" }],
    instruction: "Generate Shorts ideas for the niche below.",
    system:
      "You ideate short-form content. Give specific Shorts ideas, each with a hook, a 3-beat structure, and a payoff. Number them.",
  },
  {
    slug: "ai-voiceover",
    category: "video",
    name: "Voiceover Script Formatter",
    blurb: "TTS-ready scripts with pacing cues.",
    isNew: true,
    fields: [TEXTAREA("script", "Script or topic", "Paste a script or describe the content", 6), SELECT("voice", "Delivery", ["Energetic", "Calm", "Authoritative", "Friendly"])],
    instruction: "Format a voiceover script for the input below.",
    system:
      "You prepare scripts for AI voiceover. Rewrite for natural speech, add pause markers, emphasis, and pacing notes, and suggest a voice style. Keep sentences speakable.",
  },
  {
    slug: "thumbnail-creator",
    category: "video",
    name: "Thumbnail Concept Creator",
    blurb: "High-CTR thumbnail concepts & text.",
    isNew: true,
    fields: [TEXTAREA("video", "Video topic", "What's the video about?"), SELECT("platform", "Platform", ["YouTube", "Shorts", "Course"])],
    instruction: "Design thumbnail concepts for the video below.",
    system:
      "You design thumbnails for CTR. Give 3 concepts (focal image, expression, background, color), 5 punchy 2-4 word text overlays, and a layout note for each.",
  },
  {
    slug: "intro-outro-generator",
    category: "video",
    name: "Intro / Outro Generator",
    blurb: "Memorable openings and closings.",
    isNew: true,
    fields: [TEXT("channel", "Channel / show", "e.g. a weekly tech news show"), TONE],
    instruction: "Write intro and outro scripts for the show below.",
    system:
      "You write video intros/outros. Provide 3 short intro options (with a tagline) and 2 outro options (with a CTA and subscribe nudge).",
  },
  {
    slug: "video-description-writer",
    category: "video",
    name: "Video Description Writer",
    blurb: "SEO descriptions with timestamps & links.",
    isNew: true,
    fields: [TEXTAREA("video", "Video summary", "What happens in the video? Key points."), TEXT("keyword", "Keyword", "", false)],
    instruction: "Write a video description for the content below.",
    system:
      "You write YouTube descriptions. Produce a keyword-rich opening, a summary, a placeholder timestamp list, hashtags, and a links/CTA section.",
  },
  {
    slug: "subtitle-generator",
    category: "video",
    name: "Subtitle / SRT Formatter",
    blurb: "Turn a transcript into clean SRT captions.",
    isNew: true,
    fields: [TEXTAREA("transcript", "Transcript", "Paste the spoken transcript", 8)],
    instruction: "Convert the transcript below into subtitle format.",
    system:
      "You format subtitles. Break the transcript into short caption lines (max ~7 words) and output valid SRT with sequential numbers and placeholder timestamps in a fenced block.",
  },

  // ===================== E-COMMERCE =====================
  {
    slug: "product-description-writer",
    category: "ecommerce",
    name: "Product Description Writer",
    blurb: "Persuasive, benefit-led product copy.",
    isNew: true,
    fields: [TEXT("product", "Product name", "e.g. Bamboo travel toothbrush"), TEXTAREA("features", "Features & details", "Materials, specs, benefits, who it's for", 4), TONE],
    instruction: "Write a product description for the item below.",
    system:
      "You are an e-commerce copywriter. Write a compelling description: a hook, benefit-led body, a scannable feature list, and a short CTA. Sell the outcome, not just specs.",
  },
  {
    slug: "product-name-generator",
    category: "ecommerce",
    name: "Product Name Generator",
    blurb: "Memorable, available-sounding product names.",
    isNew: true,
    fields: [TEXTAREA("product", "What is it?", "Describe the product and its vibe"), SELECT("style", "Style", ["Modern", "Playful", "Premium", "Descriptive"])],
    instruction: "Generate product names for the item below.",
    system:
      "You are a naming expert. Give 15 product name ideas grouped by style, each with a one-line rationale. Avoid trademarked names.",
  },
  {
    slug: "review-reply-generator",
    category: "ecommerce",
    name: "Review Reply Generator",
    blurb: "Professional replies to any review.",
    isNew: true,
    fields: [TEXTAREA("review", "Customer review", "Paste the review"), SELECT("sentiment", "Review type", ["Positive", "Negative", "Neutral", "Auto-detect"])],
    instruction: "Write a reply to the customer review below.",
    system:
      "You handle customer reviews. Write a warm, professional reply that thanks the customer, addresses specifics, and (for negatives) offers a resolution without being defensive. Give 2 options.",
  },
  {
    slug: "upsell-copy-writer",
    category: "ecommerce",
    name: "Upsell Copy Writer",
    blurb: "Cross-sell & upsell prompts that convert.",
    isNew: true,
    fields: [TEXT("product", "Main product", "e.g. running shoes"), TEXTAREA("addons", "Add-ons / bundle", "What else can they buy?", 3)],
    instruction: "Write upsell and cross-sell copy for the products below.",
    system:
      "You write upsell copy. Produce cart/checkout upsell lines, a bundle pitch, and a 'complete the look/set' suggestion. Persuasive but not pushy.",
  },
  {
    slug: "email-campaign-builder",
    category: "ecommerce",
    name: "Email Campaign Builder",
    blurb: "Multi-email campaigns that drive sales.",
    isNew: true,
    fields: [TEXT("goal", "Campaign goal", "e.g. launch a summer collection"), TEXTAREA("offer", "Offer & details", "Product, discount, deadline, audience", 4)],
    instruction: "Build an email campaign for the goal below.",
    system:
      "You are an email marketer. Outline a 3-email sequence (tease, launch, last-chance). For each: subject line, preview text, and body copy with a CTA.",
  },
  {
    slug: "pricing-page-copy",
    category: "ecommerce",
    name: "Pricing Page Copy",
    blurb: "Clear tiers that make the choice easy.",
    isNew: true,
    fields: [TEXTAREA("product", "Product & plans", "Describe the product and what each tier includes", 5)],
    instruction: "Write pricing page copy for the product below.",
    system:
      "You write pricing pages. Produce tier names, a one-line value prop per tier, feature bullets, a 'most popular' recommendation, and 3 FAQ answers about billing.",
  },
  {
    slug: "faq-page-generator",
    category: "ecommerce",
    name: "Store FAQ Generator",
    blurb: "Shipping, returns & product FAQs.",
    isNew: true,
    fields: [TEXTAREA("store", "Store / product info", "What do you sell? Shipping, returns, policies."), { name: "count", label: "How many FAQs", type: "number", placeholder: "10" }],
    instruction: "Generate store FAQs from the info below.",
    system:
      "You write store FAQs covering shipping, returns, sizing, payments, and product care. Clear, reassuring answers. Format as **Q:** / **A:**.",
  },
  {
    slug: "amazon-listing-optimizer",
    category: "ecommerce",
    name: "Amazon Listing Optimizer",
    blurb: "Title, bullets & keywords for Amazon.",
    isNew: true,
    fields: [TEXT("product", "Product", "e.g. stainless steel water bottle 1L"), TEXTAREA("details", "Features & keywords", "Specs, benefits, target keywords", 4)],
    instruction: "Optimize an Amazon listing for the product below.",
    system:
      "You optimize Amazon listings. Output: a keyword-rich title (under 200 chars), 5 benefit-led bullet points, a description, and a backend search-terms list.",
  },

  // ===================== CONTENT WRITING =====================
  {
    slug: "blog-post-writer",
    category: "content-writing",
    name: "Blog Post Writer",
    blurb: "Full, structured blog articles.",
    isNew: true,
    fields: [TEXT("title", "Title / topic", "e.g. 10 ways to sleep better"), TEXT("keyword", "Primary keyword", "", false), SELECT("length", "Length", ["~600 words", "~1000 words", "~1500 words"]), TONE],
    instruction: "Write a blog post for the topic below.",
    system:
      "You are an expert blog writer. Produce a complete article in Markdown: SEO title, intro, H2/H3 sections, scannable formatting, a conclusion, and a meta description. Helpful and original.",
  },
  {
    slug: "newsletter-writer",
    category: "content-writing",
    name: "Newsletter Writer",
    blurb: "Engaging newsletters people open.",
    isNew: true,
    fields: [TEXTAREA("topic", "This issue is about…", "Main story, updates, links"), TONE],
    instruction: "Write a newsletter issue from the brief below.",
    system:
      "You write newsletters. Produce a catchy subject line, preview text, a warm intro, the main content in skimmable sections, and a sign-off with a CTA.",
  },
  {
    slug: "press-release-generator",
    category: "content-writing",
    name: "Press Release Generator",
    blurb: "Newsworthy, AP-style announcements.",
    isNew: true,
    fields: [TEXT("company", "Company", "e.g. Acme Inc."), TEXTAREA("news", "The announcement", "What's the news, when, why it matters, quotes", 5)],
    instruction: "Write a press release for the announcement below.",
    system:
      "You write press releases in AP style: headline, dateline, strong lead, body with a quote, boilerplate, and contact placeholder. Objective, newsworthy tone.",
  },
  {
    slug: "case-study-writer",
    category: "content-writing",
    name: "Case Study Writer",
    blurb: "Results-driven customer stories.",
    isNew: true,
    fields: [TEXTAREA("details", "Customer & results", "Who, the problem, your solution, the outcomes/metrics", 6)],
    instruction: "Write a case study from the details below.",
    system:
      "You write B2B case studies. Structure: Challenge, Solution, Results (with metrics), and a customer quote. Credible, specific, persuasive.",
  },
  {
    slug: "ad-copy-generator",
    category: "content-writing",
    name: "Ad Copy Generator",
    blurb: "High-converting ad variations.",
    isNew: true,
    fields: [TEXT("product", "Product / offer", "e.g. an online yoga membership"), SELECT("platform", "Platform", ["Google", "Facebook/Instagram", "TikTok", "LinkedIn"]), TEXTAREA("audience", "Audience & angle", "Who and what hook", 3, false)],
    instruction: "Write ad copy for the offer below.",
    system:
      "You are a direct-response copywriter. Produce platform-appropriate ad variations: headlines, primary text, and CTAs (5 variants). Lead with benefits and urgency.",
  },
  {
    slug: "landing-page-copy",
    category: "content-writing",
    name: "Landing Page Copy",
    blurb: "Section-by-section conversion copy.",
    isNew: true,
    fields: [TEXT("product", "Product", "e.g. a habit-tracking app"), TEXTAREA("audience", "Audience & benefits", "Who it's for, pain points, outcomes", 4)],
    instruction: "Write landing page copy for the product below.",
    system:
      "You write landing pages. Deliver copy for: hero (headline, subhead, CTA), problem, solution, features, social proof, objections/FAQ, and final CTA. Persuasive and clear.",
  },
  {
    slug: "podcast-show-notes",
    category: "content-writing",
    name: "Podcast Show Notes",
    blurb: "Summaries, timestamps & quotes.",
    isNew: true,
    fields: [TEXTAREA("episode", "Episode summary / transcript", "Paste a summary or transcript of the episode", 7), TEXT("guest", "Guest (if any)", "", false)],
    instruction: "Write podcast show notes from the input below.",
    system:
      "You write podcast show notes: a hook intro, episode summary, key takeaways, placeholder timestamps, notable quotes, and links/CTA section.",
  },
  {
    slug: "content-repurposer",
    category: "content-writing",
    name: "Content Repurposer",
    blurb: "One piece → many platform-ready posts.",
    isNew: true,
    fields: [TEXTAREA("source", "Source content", "Paste a blog post, transcript, or notes", 8), SELECT("into", "Repurpose into", ["Twitter thread", "LinkedIn post", "Instagram carousel", "Newsletter", "All of these"])],
    instruction: "Repurpose the content below.",
    system:
      "You repurpose long-form content into native short-form pieces, preserving the key ideas and adapting tone/format for each requested platform. Label each output clearly.",
  },

  // ===================== BUSINESS TOOLS =====================
  {
    slug: "pitch-deck-generator",
    category: "business-tools",
    name: "Pitch Deck Generator",
    blurb: "A full investor deck outline, slide by slide.",
    isNew: true,
    fields: [TEXT("company", "Company", "e.g. an AI scheduling assistant"), TEXTAREA("details", "The business", "Problem, solution, market, model, traction, team", 6)],
    instruction: "Create a pitch deck outline for the company below.",
    system:
      "You build investor pitch decks. Produce 10-12 slides (Problem, Solution, Market, Product, Business Model, Traction, Competition, Team, Ask). For each: a title and the bullet content.",
  },
  {
    slug: "business-plan-writer",
    category: "business-tools",
    name: "Business Plan Writer",
    blurb: "A structured plan you can act on.",
    isNew: true,
    fields: [TEXT("business", "Business", "e.g. a mobile car-wash service"), TEXTAREA("details", "Key details", "Offering, market, model, goals", 5)],
    instruction: "Write a business plan for the venture below.",
    system:
      "You write lean business plans: Executive Summary, Market, Offering, Marketing, Operations, Financial outline, and Milestones. Practical and specific.",
  },
  {
    slug: "meeting-summarizer",
    category: "business-tools",
    name: "Meeting Summarizer",
    blurb: "Notes → decisions, actions & owners.",
    isNew: true,
    fields: [TEXTAREA("notes", "Meeting notes / transcript", "Paste raw notes or transcript", 9)],
    instruction: "Summarize the meeting below.",
    system:
      "You summarize meetings. Output: a 3-line summary, key decisions, action items (owner + due date if mentioned), and open questions. Concise and structured.",
  },
  {
    slug: "proposal-generator",
    category: "business-tools",
    name: "Proposal Generator",
    blurb: "Win clients with a clear proposal.",
    isNew: true,
    fields: [TEXT("client", "Client / project", "e.g. website redesign for a law firm"), TEXTAREA("scope", "Scope, deliverables, pricing", "What you'll do, timeline, price", 5)],
    instruction: "Write a client proposal from the details below.",
    system:
      "You write winning proposals: overview, understanding of needs, proposed solution, deliverables, timeline, pricing, and next steps. Professional and persuasive.",
  },
  {
    slug: "invoice-generator",
    category: "business-tools",
    name: "Invoice Generator",
    blurb: "Clean, itemized invoice text.",
    isNew: true,
    fields: [TEXT("from", "From (you/business)", "Your name / business"), TEXT("to", "Bill to (client)", "Client name"), TEXTAREA("items", "Line items", "Description, quantity, rate per line", 4)],
    instruction: "Generate an invoice from the details below.",
    system:
      "You generate professional invoices. Output a clean, itemized invoice with an invoice number placeholder, date, line items, subtotal, tax line, total, and payment terms. Use a tidy layout.",
  },
  {
    slug: "competitor-analysis-tool",
    category: "business-tools",
    name: "Competitor Analysis",
    blurb: "Size up rivals & find your edge.",
    isNew: true,
    fields: [TEXT("business", "Your business", "e.g. a meal-prep delivery startup"), TEXTAREA("competitors", "Competitors", "Names and anything you know about them", 4)],
    instruction: "Analyze competitors for the business below.",
    system:
      "You are a market analyst. Produce a comparison of strengths/weaknesses, positioning gaps, and 3-5 concrete opportunities to differentiate. Note where assumptions are made.",
  },
  {
    slug: "sop-writer",
    category: "business-tools",
    name: "SOP Writer",
    blurb: "Step-by-step standard operating procedures.",
    isNew: true,
    fields: [TEXT("process", "Process", "e.g. onboarding a new client"), TEXTAREA("details", "Details", "Steps, tools, roles involved", 4, false)],
    instruction: "Write an SOP for the process below.",
    system:
      "You document SOPs. Output: purpose, scope, roles, required tools, numbered step-by-step instructions, and a quality checklist. Clear enough for a new hire to follow.",
  },
  {
    slug: "job-description-writer",
    category: "business-tools",
    name: "Job Description Writer",
    blurb: "Attract the right candidates.",
    isNew: true,
    fields: [TEXT("role", "Role", "e.g. Senior Backend Engineer"), TEXTAREA("details", "Company & requirements", "About the company, responsibilities, must-haves", 5), SELECT("type", "Type", ["Full-time", "Part-time", "Contract", "Remote"])],
    instruction: "Write a job description for the role below.",
    system:
      "You write inclusive, compelling job descriptions: a hook about the company, the role's mission, responsibilities, requirements, nice-to-haves, and benefits. Avoid biased language.",
  },
];

// --- lookups --------------------------------------------------------------

export const getTool = (slug: string) => TOOLS.find((t) => t.slug === slug);
export const getCategory = (id: string) => CATEGORIES.find((c) => c.id === id);
export const toolsByCategory = (id: string) => TOOLS.filter((t) => t.category === id);
