import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import { TOOLS, getTool, getCategory, toolsByCategory } from "@/lib/tools";
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
  const related = toolsByCategory(tool.category)
    .filter((t) => t.slug !== tool.slug)
    .slice(0, 6);

  return (
    <div className="animate-fade-up">
      {/* breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-zinc-500">
        <Link href="/" className="inline-flex items-center gap-1 hover:text-white">
          <ChevronLeft className="h-4 w-4" /> Home
        </Link>
        <span>/</span>
        <Link href={`/category/${cat.id}`} className={`hover:text-white ${cat.tint}`}>
          {cat.emoji} {cat.name}
        </Link>
      </div>

      {/* header */}
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">{tool.name}</h1>
          {tool.isNew && (
            <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-300 ring-1 ring-emerald-500/20">
              New
            </span>
          )}
        </div>
        <p className="max-w-2xl text-zinc-400">{tool.blurb}</p>
      </div>

      <ToolRunner tool={tool} />

      {/* related */}
      {related.length > 0 && (
        <div className="mt-14">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            More {cat.name} tools
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((t) => (
              <Link
                key={t.slug}
                href={`/tools/${t.slug}`}
                className="glass group rounded-xl p-4 transition-colors hover:bg-white/[0.06]"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-white">{t.name}</h3>
                  {t.isNew && (
                    <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-emerald-300">
                      New
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-zinc-400">{t.blurb}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
