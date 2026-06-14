import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CATEGORIES, TOOLS } from "@/lib/tools";
import { categoryIcon } from "@/lib/icons";

export default function Explorer() {
  return (
    <section id="tools" className="scroll-mt-24">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <p className="eyebrow mb-1">Browse</p>
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            Every category
          </h2>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {CATEGORIES.map((cat) => {
          const tools = TOOLS.filter((t) => t.category === cat.id);
          const Icon = categoryIcon(cat.id);
          return (
            <div key={cat.id} className="card card-hover flex flex-col">
              <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3.5">
                <span
                  className={`grid h-10 w-10 place-items-center rounded-xl ${cat.soft} ${cat.accent} ring-1 ${cat.ring}`}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <div className="min-w-0">
                  <h3 className="font-medium leading-tight text-[var(--ink)]">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-[var(--muted)]">
                    {tools.length} tools
                  </p>
                </div>
                <Link
                  href={`/category/${cat.id}`}
                  className="ml-auto grid h-8 w-8 place-items-center rounded-lg text-[var(--faint)] transition-colors hover:bg-black/[0.04] hover:text-[var(--ink)]"
                  aria-label={`View ${cat.name}`}
                >
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="flex flex-col p-1.5">
                {tools.slice(0, 5).map((t) => (
                  <Link
                    key={t.slug}
                    href={`/tools/${t.slug}`}
                    className="group flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-[var(--muted)] transition-colors hover:bg-black/[0.035] hover:text-[var(--ink)]"
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${cat.dot}`} />
                    <span className="truncate">{t.name}</span>
                    {t.isNew && (
                      <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-600 ring-1 ring-emerald-100">
                        New
                      </span>
                    )}
                  </Link>
                ))}
              </div>

              <Link
                href={`/category/${cat.id}`}
                className="mt-auto flex items-center justify-between border-t border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
              >
                View all {tools.length}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
