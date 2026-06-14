import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChevronLeft, ArrowRight } from "lucide-react";
import { CATEGORIES, getCategory, toolsByCategory } from "@/lib/tools";
import { categoryIcon } from "@/lib/icons";
import JsonLd from "@/components/JsonLd";
import { SITE } from "@/lib/site";

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.id }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const cat = getCategory(params.slug);
  if (!cat) return { title: "Category not found" };
  const count = toolsByCategory(cat.id).length;
  const description = `${count} free AI ${cat.name.toLowerCase()} tools on ${SITE.name}. ${cat.blurb}`;
  const url = `${SITE.url}/category/${cat.id}`;
  return {
    title: `${cat.name} tools`,
    description,
    alternates: { canonical: `/category/${cat.id}` },
    openGraph: {
      type: "website",
      title: `${cat.name} AI tools · ${SITE.name}`,
      description,
      url,
    },
  };
}

export default function CategoryPage({ params }: { params: { slug: string } }) {
  const cat = getCategory(params.slug);
  if (!cat) notFound();

  const tools = toolsByCategory(cat.id);
  const Icon = categoryIcon(cat.id);

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE.url },
      {
        "@type": "ListItem",
        position: 2,
        name: cat.name,
        item: `${SITE.url}/category/${cat.id}`,
      },
    ],
  };

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${cat.name} AI tools`,
    numberOfItems: tools.length,
    itemListElement: tools.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      url: `${SITE.url}/tools/${t.slug}`,
    })),
  };

  return (
    <div className="animate-fade-up">
      <JsonLd data={breadcrumbLd} />
      <JsonLd data={itemListLd} />
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1 text-sm text-[var(--faint)] hover:text-[var(--ink)]"
      >
        <ChevronLeft className="h-4 w-4" /> All tools
      </Link>

      {/* header */}
      <div className="mb-8 flex items-start gap-4">
        <span
          className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl ${cat.soft} ${cat.accent} ring-1 ${cat.ring}`}
        >
          <Icon className="h-7 w-7" strokeWidth={1.6} />
        </span>
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            {cat.name}
          </h1>
          <p className="mt-1 max-w-2xl text-[var(--muted)]">{cat.blurb}</p>
          <p className="mt-2 text-sm font-medium text-[var(--faint)]">
            {tools.length} tools
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((t) => (
          <Link
            key={t.slug}
            href={`/tools/${t.slug}`}
            className="card card-hover group flex flex-col p-5"
          >
            <div className="mb-1.5 flex items-center justify-between">
              <h3 className="font-medium text-[var(--ink)]">{t.name}</h3>
              {t.isNew && (
                <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-emerald-600 ring-1 ring-emerald-100">
                  New
                </span>
              )}
            </div>
            <p className="text-sm leading-relaxed text-[var(--muted)]">
              {t.blurb}
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[var(--accent)]">
              Open tool
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
