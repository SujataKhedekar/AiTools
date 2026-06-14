# Nova — AI Tools Hub

A modern, single-app AI toolkit inspired by multi-category tool directories. **80+ tools** across 8 categories — AI Service, Web Developer, Social Content, Design, Video, E-commerce, Content Writing, and Business Tools — every one powered by Claude and runnable in the browser.

Built with **Next.js (App Router)**, **Tailwind CSS**, and the **Anthropic TypeScript SDK** with streaming responses.

## How it works (the smart part)

Instead of 80 bespoke pages, the app is **data-driven**:

- [`lib/tools.ts`](lib/tools.ts) — a single registry. Each tool is plain data: its form `fields` and the `system` prompt that turns Claude into that specific tool.
- [`app/tools/[slug]/page.tsx`](app/tools/[slug]/page.tsx) — one dynamic page renders **any** tool from the registry.
- [`app/api/generate/route.ts`](app/api/generate/route.ts) — one streaming API route runs **any** tool by building the prompt from its fields + the user's input.

Add a new working tool by appending one object to `TOOLS` — no new files needed.

## Getting started

```bash
npm install
cp .env.local.example .env.local   # then paste your ANTHROPIC_API_KEY
npm run dev
```

Open http://localhost:3000.

Get an API key at https://platform.claude.com.

### Model

Defaults to `claude-opus-4-8` (highest quality). To trade some quality for lower
cost/latency on high-volume use, set `ANTHROPIC_MODEL=claude-sonnet-4-6` (or
`claude-haiku-4-5`) in `.env.local`.

## Project structure

```
app/
  page.tsx                 # hero + searchable category grid
  layout.tsx               # shell, ambient background
  not-found.tsx
  category/[slug]/page.tsx # all tools in a category
  tools/[slug]/page.tsx    # runs a single tool
  api/generate/route.ts    # streaming Claude endpoint (powers every tool)
components/
  Header.tsx
  Explorer.tsx             # search + category columns (client)
  ToolRunner.tsx           # form + live streaming output (client)
lib/
  tools.ts                 # the tool + category registry (source of truth)
```

## Notes

- Inherently non-text tools (image/logo/voice/etc.) produce the most useful
  *text* artifact — a detailed generation prompt, brief, or spec — so every tool
  does something real out of the box. Swap their `system` prompts (or wire an
  image/audio model) to extend them.
- Responses stream token-by-token via the SDK's `messages.stream()` helper.
```
