# Aivora

A Next.js workspace for focused creative and productivity tools.

Built with the Next.js App Router, TypeScript, and Tailwind CSS.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## VoxAI setup

Open **AI Service → VoxAI Voice Studio**. Add a Gemini API key to `.env.local` as `GEMINI_API_KEY` to enable speech generation, voice previews, script enhancement, and voice profile creation. `ELEVENLABS_API_KEY` is optional and enables ElevenLabs voice cloning and synthesis for cloned voices. Both credentials are read only by server routes.

WAV downloads work without FFmpeg. MP3 conversion, trimming, and server-side speed/pitch processing require FFmpeg to be installed on the host. Provider availability is shown in VoxAI Settings.

## AI Summarizer setup

Open **Content Writing → AI Summarizer**. It uses the same server-only `GEMINI_API_KEY` for summaries. PDF, DOCX, TXT, and Markdown uploads are processed on the server; scanned image-only PDFs are not OCR-processed.


## Tailwind Shade Generator

Open **Design → Tailwind Shade Generator** to build and export color scales. Shade generation runs in the browser and saves local projects in browser storage.

## DeckAI Presentation Maker

Open **Business Tools → DeckAI Presentation Maker** to generate editable presentations, refine slides, and export PDF, HTML, or PowerPoint. AI generation and slide assistance use the server-only `GEMINI_API_KEY`. Email accounts and saved presentations use PostgreSQL when configured; apply `components/deckai/db/schema.sql` to the database first. Without a reachable database, the local fallback store under `/tmp` is used for development and is not durable across deployments. Configure a long random `SESSION_SECRET` for stable signed sessions. Google sign-in requires `NEXT_PUBLIC_FIREBASE_*` web configuration plus `FIREBASE_PROJECT_ID` and valid server credentials for Firebase Admin verification. Web configuration is loaded from environment variables rather than committed in the source. Stripe checkout is enabled by `STRIPE_SECRET_KEY`; without it, plan selection uses the source tool's local/direct plan behavior.

## InstantBG Studio

Open **Design → InstantBG Studio** to remove a photo background, refine the matte, adjust the edge, and export a PNG, WebP, or JPEG. The pixels are processed in the browser. The first neural run downloads the segmentation model and can take longer; the source-image pixels are not sent to an AI API. The app serves the ONNX Runtime Web CPU WebAssembly runtime from `public/onnxruntime-web`.

**License note:** InstantBG uses `@imgly/background-removal`, which is licensed under AGPL-3.0. Review its source-sharing obligations for the intended deployment, or replace it with a commercially licensed alternative before distributing a closed-source hosted product.

## Newsletter Studio

Open **Content Writing → Newsletter Studio** to generate and edit structured newsletter issues, save drafts in browser storage, refine copy and subject lines, and export email-ready HTML. AI generation, subject variations, and block rewrites use the existing server-only `GEMINI_API_KEY`; requests are rate-limited by IP. A missing key returns a clear configuration error.

## AI Landing Page Generator

Open **Web Developer → AI Landing Page Generator** to analyze a public business website, create a landing page strategy and page copy, edit the generated sections, and export HTML, React/Tailwind, Next.js, or Bootstrap projects. AI requests use the server-only `GEMINI_API_KEY`. URL analysis blocks private/internal hosts and rate-limits generation requests. Exported projects include the bundled preview images.

## AI Product Description Writer

Open **E-commerce → AI Product Description Writer** to create product listings from seller details, product photos, or public product pages. It includes a structured product catalog taxonomy, SEO and marketplace copy, draft saving, bulk CSV/XLSX workflows, and PDF/DOCX/XLSX/CSV exports. All Gemini calls use the existing server-only `GEMINI_API_KEY`; product URL analysis validates public DNS/IP targets before fetching.

## Shopify AI Section Builder

Open **E-commerce → Shopify AI Section Builder** to analyze design screenshots and generate Shopify Online Store 2.0 Liquid sections. The workspace includes design analysis, schema and Liquid validation, live preview, refinement, and a local saved-section library. AI generation uses the server-only `GEMINI_API_KEY`.
