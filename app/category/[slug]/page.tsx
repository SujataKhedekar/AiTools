import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChevronLeft, ArrowRight } from "lucide-react";
import { CATEGORIES, getCategory, toolsByCategory } from "@/lib/tools";

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.id }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const cat = getCategory(params.slug);
  if (!cat) return { title: "Category not found · Nova" };
  return { title: `${cat.name} tools · Nova`, description: cat.blurb };
}

export default function CategoryPage({ params }: { params: { slug: string } }) {
  const cat = getCategory(params.slug);
  if (!cat) notFound();

  const tools = toolsByCategory(cat.id);

  return (
    <div className="animate-fade-up">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-white"
      >
        <ChevronLeft className="h-4 w-4" /> All categories
      </Link>

      <div
        className={`mb-8 rounded-2xl bg-gradient-to-r ${cat.from} ${cat.to} p-6`}
      >
        <div className="text-3xl">{cat.emoji}</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white drop-shadow">
          {cat.name}
        </h1>
        <p className="mt-1 max-w-2xl text-white/90">{cat.blurb}</p>
        <p className="mt-3 text-sm font-medium text-white/80">
          {tools.length} tools
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((t) => (
          <Link
            key={t.slug}
            href={`/tools/${t.slug}`}
            className="glass group flex flex-col rounded-2xl p-4 transition-colors hover:bg-white/[0.06]"
          >
            <div className="mb-1 flex items-center justify-between">
              <h3 className="font-medium text-white">{t.name}</h3>
              {t.isNew && (
                <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-emerald-300">
                  New
                </span>
              )}
            </div>
            <p className="text-sm text-zinc-400">{t.blurb}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-zinc-500 transition-colors group-hover:text-white">
              Open tool <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
