import Link from "next/link";
import { ArrowRight, Zap, ShieldCheck, Wand2 } from "lucide-react";
import Explorer from "@/components/Explorer";
import { TOOLS, CATEGORIES } from "@/lib/tools";
import { categoryIcon } from "@/lib/icons";

export default function HomePage() {
  const featured = TOOLS.filter((t) => t.isNew).slice(0, 6);

  return (
    <div className="animate-fade-up">
      {/* welcome / hero */}
      <section className="card relative overflow-hidden p-7 sm:p-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[var(--accent)]/[0.07] blur-3xl"
        />
        <p className="eyebrow mb-3">AI workspace</p>
        <h1 className="font-display max-w-2xl text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
          What will you make today?
        </h1>
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-[var(--muted)]">
          {TOOLS.length} focused AI tools for writing, code, design, marketing and
          business — each one a clean single-purpose workspace. Bring your free
          key and start in seconds.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href="#tools"
            className="btn-ink inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold"
          >
            Browse all tools <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/tools/ai-email-writer"
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-strong)] bg-white px-5 py-2.5 text-sm font-semibold text-[var(--ink)] transition-colors hover:bg-black/[0.03]"
          >
            Try the email writer
          </Link>
        </div>

        <div className="mt-8 flex flex-wrap gap-x-7 gap-y-3 border-t border-[var(--border)] pt-5 text-sm text-[var(--muted)]">
          <span className="inline-flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-[var(--accent)]" strokeWidth={1.75} />
            {TOOLS.length} tools · {CATEGORIES.length} categories
          </span>
          <span className="inline-flex items-center gap-2">
            <Zap className="h-4 w-4 text-[var(--accent)]" strokeWidth={1.75} />
            Streams instantly on Groq
          </span>
          <span className="inline-flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[var(--accent)]" strokeWidth={1.75} />
            Your key stays in your browser
          </span>
        </div>
      </section>

      {/* featured / new */}
      {featured.length > 0 && (
        <section className="mt-10">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="eyebrow mb-1">Just added</p>
              <h2 className="font-display text-2xl font-semibold tracking-tight">
                Fresh tools
              </h2>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((t) => {
              const cat = CATEGORIES.find((c) => c.id === t.category)!;
              const Icon = categoryIcon(t.category);
              return (
                <Link
                  key={t.slug}
                  href={`/tools/${t.slug}`}
                  className="card card-hover group flex flex-col p-5"
                >
                  <span
                    className={`mb-4 grid h-11 w-11 place-items-center rounded-xl ${cat.soft} ${cat.accent} ring-1 ${cat.ring}`}
                  >
                    <Icon className="h-[22px] w-[22px]" strokeWidth={1.75} />
                  </span>
                  <h3 className="font-medium text-[var(--ink)]">{t.name}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">
                    {t.blurb}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[var(--accent)]">
                    Open
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <div className="mt-12">
        <Explorer />
      </div>
    </div>
  );
}
