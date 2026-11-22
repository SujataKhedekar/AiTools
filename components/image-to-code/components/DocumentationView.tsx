export function DocumentationView() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      <section className="rounded-xl border border-slate-200 bg-white p-6 space-y-3">
        <h1 className="text-xl font-bold text-slate-900">
          AIVORA — Architecture, Setup &amp; Integration Guide
        </h1>
        <p className="text-sm leading-relaxed text-slate-600">
          AIVORA converts UI screenshots and multi-screen design references into modular, responsive frontend projects across React, Next.js App Router, Tailwind CSS, Vue.js, Bootstrap, and semantic HTML/CSS/JS.
        </p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 space-y-3">
        <h2 className="text-base font-semibold text-slate-900">
          1. System Pipeline &amp; Security Architecture
        </h2>
        <div className="space-y-2 text-xs leading-relaxed text-slate-700">
          <p>
            <strong>Image Validation &amp; Optimization:</strong> Uploaded PNG, JPG/JPEG, and WebP images are checked client-side and verified server-side using binary magic-byte signatures, MIME allowlists, and a 10 MB per-image ceiling. Oversized retina screenshots are safely resized on an offscreen canvas before upload.
          </p>
          <p>
            <strong>Server-Side Gemini Multimodal Engine:</strong> All Gemini API requests run exclusively on the Node.js/Express backend via <code className="font-mono text-slate-900">@google/genai</code> using <code className="font-mono text-slate-900">process.env.GEMINI_API_KEY</code>. API keys are never sent to the browser.
          </p>
          <p>
            <strong>Sandboxed Live Preview:</strong> Generated frontend code is bundled on the server via <code className="font-mono text-slate-900">esbuild</code> and Tailwind utility compilation, then rendered inside a sandboxed <code className="font-mono text-slate-900">&lt;iframe sandbox=&quot;allow-scripts allow-forms allow-modals&quot;&gt;</code> without <code className="font-mono text-slate-900">allow-same-origin</code>, isolating preview execution from the parent workspace.
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 space-y-3">
        <h2 className="text-base font-semibold text-slate-900">
          2. Integrating Exported Code into a Next.js App Router Project
        </h2>
        <ol className="list-decimal pl-5 space-y-2 text-xs leading-relaxed text-slate-700">
          <li>
            Select <strong>Next.js + Tailwind CSS</strong> or <strong>Next.js App Router</strong> before generating, then click <strong>Export ZIP</strong>.
          </li>
          <li>
            Unzip the archive and run <code className="font-mono text-slate-900">npm install</code> followed by <code className="font-mono text-slate-900">npm run dev</code> to verify locally on port 3000.
          </li>
          <li>
            To copy components into an existing Next.js repository, copy <code className="font-mono text-slate-900">src/components/*</code> into your project&apos;s <code className="font-mono text-slate-900">src/components/</code> directory, merge the CSS custom properties from <code className="font-mono text-slate-900">globals.css</code>, and copy any uploaded assets from <code className="font-mono text-slate-900">public/assets/</code> into your app&apos;s <code className="font-mono text-slate-900">public/assets/</code> folder.
          </li>
        </ol>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 space-y-3">
        <h2 className="text-base font-semibold text-slate-900">
          3. Known Limitations &amp; Scope Boundaries
        </h2>
        <ul className="list-disc pl-5 space-y-1.5 text-xs leading-relaxed text-slate-700">
          <li>
            <strong>No Fabricated External Assets:</strong> Original photography embedded inside flat screenshots cannot be extracted directly as clean image files. Unless you upload matching brand assets in the Brand Assets tray, generated code uses descriptive SVG/CSS visual placeholders instead of inventing external URLs.
          </li>
          <li>
            <strong>Frontend-Only Interactivity:</strong> Navigation drawers, tabs, dropdowns, modals, search filters, and form validation run via client-side state. Backend database persistence and authentication endpoints are intentionally excluded unless explicitly integrated later.
          </li>
          <li>
            <strong>Vue.js Preview Fidelity:</strong> React, Next.js, Tailwind, HTML/CSS/JS, and Bootstrap previews execute full interactive JS/React bundles inside the sandboxed iframe; Vue.js SFC previews render compiled template markup and scoped styles, while full Vue 3 reactivity runs upon <code className="font-mono text-slate-900">npm install &amp;&amp; npm run dev</code> in the exported ZIP.
          </li>
          <li>
            <strong>Visual Accuracy Disclaimer:</strong> While layout hierarchy, spacing, color tokens, and typography are extracted directly from the reference screenshot, exact proprietary fonts are mapped to web-safe or Google Font equivalents and noted in the Design Analysis panel.
          </li>
        </ul>
      </section>
    </div>
  );
}
