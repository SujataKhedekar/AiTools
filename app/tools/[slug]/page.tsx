import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChevronLeft, ArrowRight } from "lucide-react";
import { TOOLS, getTool, getCategory, toolsByCategory } from "@/lib/tools";
import { categoryIcon } from "@/lib/icons";
import ToolRunner from "@/components/ToolRunner";

export function generateStaticParams() {
  return TOOLS.map((t) => ({ slug: t.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const tool = getTool(params.slug);
  if (!tool) return { title: "Tool not found · Nova" };
  return { title: `${tool.name} · Nova`, description: tool.blurb };
}

export default function ToolPage({ params }: { params: { slug: string } }) {
  const tool = getTool(params.slug);
  if (!tool) notFound();

  const cat = getCategory(tool.category)!;
  const Icon = categoryIcon(tool.category);
  const related = toolsByCategory(tool.category)
    .filter((t) => t.slug !== tool.slug)
    .slice(0, 6);

  return (
    <div className="animate-fade-up">
      {/* breadcrumb */}
      <div className="mb-6 flex items-center gap-1.5 text-sm text-[var(--faint)]">
        <Link href="/" className="hover:text-[var(--ink)]">
          Home
        </Link>
        <ChevronLeft className="h-3.5 w-3.5 rotate-180" />
        <Link
          href={`/category/${cat.id}`}
          className="hover:text-[var(--ink)]"
        >
          {cat.name}
        </Link>
        <ChevronLeft className="h-3.5 w-3.5 rotate-180" />
        <span className="text-[var(--muted)]">{tool.name}</span>
      </div>

      {/* header */}
      <div className="mb-7 flex items-start gap-4">
        <span
          className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl ${cat.soft} ${cat.accent} ring-1 ${cat.ring}`}
        >
          <Icon className="h-7 w-7" strokeWidth={1.6} />
        </span>
        <div>
          <div className="mb-1 flex items-center gap-2.5">
            <h1 className="font-display text-3xl font-semibold tracking-tight">
              {tool.name}
            </h1>
            {tool.isNew && (
              <span className="rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-600 ring-1 ring-emerald-100">
                New
              </span>
            )}
          </div>
          <p className="max-w-2xl text-[var(--muted)]">{tool.blurb}</p>
        </div>
      </div>

      <ToolRunner tool={tool} />

      {/* related */}
      {related.length > 0 && (
        <div className="mt-14">
          <p className="eyebrow mb-4">More {cat.name} tools</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((t) => (
              <Link
                key={t.slug}
                href={`/tools/${t.slug}`}
                className="card card-hover group flex flex-col p-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-[var(--ink)]">{t.name}</h3>
                  {t.isNew && (
                    <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-emerald-600 ring-1 ring-emerald-100">
                      New
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">
                  {t.blurb}
                </p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[var(--accent)]">
                  Open <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
