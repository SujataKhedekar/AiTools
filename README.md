# AI Tools — Powered by Codepalette

A modern, single-app AI toolkit inspired by multi-category tool directories. **80+ tools** across 8 categories — AI Service, Web Developer, Social Content, Design, Video, E-commerce, Content Writing, and Business Tools — powered by Groq and runnable in the browser.

Built with **Next.js (App Router)**, **Tailwind CSS**, and the **OpenAI TypeScript SDK** with streaming responses.

## How it works (the smart part)

Instead of 80 bespoke pages, the app is **data-driven**:

- [`lib/tools.ts`](lib/tools.ts) — a single registry. Each tool is plain data: its form `fields` and the `system` prompt that configures the AI for that specific tool. Field types include short text, long text, code, dropdown, and number inputs.
- [`app/tools/[slug]/page.tsx`](app/tools/[slug]/page.tsx) — one dynamic page renders **any** tool from the registry.
- [`app/api/generate/route.ts`](app/api/generate/route.ts) — one streaming API route runs **any** tool by building the prompt from its fields + the user's input.
- The **SEO Report Generator** accepts a public page URL and checks metadata, robots directives, Open Graph tags, canonical URL, headings, image alt text, internal links, sitemap availability, and JSON-LD syntax. It suggests editable alt-text drafts from image captions, labels, or filenames, and creates a draft XML sitemap from up to 50 same-site URLs linked by the submitted page; it does not crawl the whole site. Alt drafts must be verified against the actual image. The scanner uses `/api/seo-report` and does not require an AI API key.
- SEO reports include technical, on-page, content, schema, and Google PageSpeed mobile/desktop findings when available; prioritized recommendations; a task list with local fixed/pending state; and PDF, Excel, and CSV downloads. Google PageSpeed Insights can be used without a key subject to its public quota; set `PAGESPEED_API_KEY` in `.env.local` or Vercel for a higher quota. Unavailable PageSpeed data is shown as unavailable rather than estimated.
- **Competitor Research & Discovery** analyzes the submitted site's public title, description, headings, service cues, and internal links. With `SERPAPI_KEY` set on the server, it searches Google organic results for the selected market and only lists results whose public HTML pages can be verified. It provides a comparison view plus PDF, Excel, and CSV downloads. Search visibility is not equivalent to rank-tracking data: search volume, keyword difficulty/positions, estimated traffic, backlinks, and domain authority remain unavailable until a ranking/link data API is integrated. Set `SERPAPI_KEY` in `.env.local` or the deployment's server environment; the key is never sent to the browser.

Add a new working tool by appending one object to `TOOLS` — no new files needed.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

Click **API key** in the app and add a Groq key from https://console.groq.com/keys.
The key is stored in your browser and sent to the app's generation endpoint for
requests. Alternatively, set `GROQ_API_KEY` in `.env.local` for a server-side
fallback key.

### Model

Defaults to `openai/gpt-oss-120b`. The previous default,
`llama-3.3-70b-versatile`, was deprecated by Groq and shut down on August 16,
2026. Set `AI_MODEL` and optionally `AI_BASE_URL` in `.env.local` to use another
OpenAI-compatible provider. See `.env.local.example` for examples.

## Project structure

```
app/
  page.tsx                 # hero + searchable category grid
  layout.tsx               # shell, ambient background
  not-found.tsx
  category/[slug]/page.tsx # all tools in a category
  tools/[slug]/page.tsx    # runs a single tool
  api/generate/route.ts    # streaming Groq endpoint (powers every tool)
  api/seo-report/route.ts  # URL-based SEO scan
components/
  Header.tsx
  Explorer.tsx             # search + category columns (client)
  ToolRunner.tsx           # model-specific form + live streaming output (client)
  SeoReportRunner.tsx      # URL scan form + SEO findings and sitemap draft
lib/
  tools.ts                 # the tool + category registry (source of truth)
  seoReport.ts             # safe public-page fetch and SEO analysis
```

## Notes

- Inherently non-text tools (image/logo/voice/etc.) produce the most useful
  *text* artifact — a detailed generation prompt, brief, or spec — so every tool
  does something real out of the box. Swap their `system` prompts (or wire an
  image/audio model) to extend them.
- Responses stream token-by-token from the chat completions API.
```
