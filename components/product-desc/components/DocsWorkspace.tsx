import { BENCHMARK_PRESETS } from '../data/presets';
import { PRODUCT_CATEGORIES } from '../shared/catalogTaxonomy';

export function DocsWorkspace() {
  return (
    <div className="mx-auto max-w-[1160px] space-y-6 px-6 py-6">
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <h1 className="font-display text-xl font-semibold text-zinc-900">
          Aivora Architecture, Benchmark Suite &amp; Next.js Integration
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">
          Aivora uses a modular server-side Gemini generation architecture paired with structured
          category validation, non-fabricating specification guards, and multi-format client export
          engines.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="font-display text-base font-semibold text-zinc-900">
            Supported Taxonomy ({PRODUCT_CATEGORIES.length} Categories)
          </h2>
          <ul className="mt-3 space-y-2 text-xs text-zinc-700">
            {PRODUCT_CATEGORIES.map((cat) => (
              <li key={cat.id} className="border-b border-zinc-100 pb-2">
                <div className="font-semibold text-zinc-900">{cat.label}</div>
                <div className="mt-0.5 text-zinc-500">{cat.subcategories.join(', ')}</div>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <h2 className="font-display text-base font-semibold text-zinc-900">
              Server API Endpoints
            </h2>
            <dl className="mt-3 space-y-2.5 text-xs">
              <div className="border-b border-zinc-100 pb-2">
                <dt className="font-mono font-semibold text-zinc-900">POST /api/product-description/analyze-image</dt>
                <dd className="mt-0.5 text-zinc-600">
                  Multimodal visual attribute extraction separating visible traits from unverified
                  technical or material claims.
                </dd>
              </div>
              <div className="border-b border-zinc-100 pb-2">
                <dt className="font-mono font-semibold text-zinc-900">POST /api/product-description/analyze-url</dt>
                <dd className="mt-0.5 text-zinc-600">
                  Public URL fetcher with DNS/IP validation, cheerio extraction, and structured JSON
                  normalization.
                </dd>
              </div>
              <div className="border-b border-zinc-100 pb-2">
                <dt className="font-mono font-semibold text-zinc-900">POST /api/product-description/detect-category</dt>
                <dd className="mt-0.5 text-zinc-600">
                  Automatic classification across the 10-category ecommerce taxonomy with manual
                  override support.
                </dd>
              </div>
              <div className="border-b border-zinc-100 pb-2">
                <dt className="font-mono font-semibold text-zinc-900">POST /api/product-description/generate-listing</dt>
                <dd className="mt-0.5 text-zinc-600">
                  Full category-specific catalog, wash care, size guide, SEO, FAQ, and marketplace
                  listing synthesis.
                </dd>
              </div>
              <div className="border-b border-zinc-100 pb-2">
                <dt className="font-mono font-semibold text-zinc-900">
                  POST /api/product-description/regenerate-section
                </dt>
                <dd className="mt-0.5 text-zinc-600">
                  Targeted section regeneration with diff preview (Accept / Reject) preserving
                  existing edits.
                </dd>
              </div>
              <div>
                <dt className="font-mono font-semibold text-zinc-900">POST /api/product-description/bulk-generate</dt>
                <dd className="mt-0.5 text-zinc-600">
                  Concurrency-capped batch processor preserving SKUs and flagging missing fields.
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <h2 className="font-display text-base font-semibold text-zinc-900">
              Next.js App Router Migration Notes
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-zinc-600">
              All domain modules in <span className="font-mono">src/shared/</span> and prompt
              schemas in <span className="font-mono">server/prompts.ts</span> are framework-agnostic.
              To embed Aivora inside Next.js App Router:
            </p>
            <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-xs text-zinc-700">
              <li>
                Move each Express handler in <span className="font-mono">server.ts</span> to{' '}
                <span className="font-mono">app/api/*/route.ts</span> Route Handlers.
              </li>
              <li>
                Keep <span className="font-mono">server/geminiClient.ts</span> and{' '}
                <span className="font-mono">GEMINI_API_KEY</span> strictly server-only.
              </li>
              <li>
                Add <span className="font-mono">"use client";</span> to interactive components in{' '}
                <span className="font-mono">src/components/</span>.
              </li>
            </ol>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="font-display text-base font-semibold text-zinc-900">
          10 Benchmark Test Products (Available in Studio Presets)
        </h2>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {BENCHMARK_PRESETS.map((p) => (
            <div key={p.id} className="rounded-lg border border-zinc-200 p-3 text-xs">
              <div className="font-semibold text-zinc-900">{p.label}</div>
              <div className="mt-1 text-zinc-500">{p.categoryLabel}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
