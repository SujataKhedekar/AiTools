"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ArrowRight } from "lucide-react";
import { CATEGORIES, TOOLS } from "@/lib/tools";

export default function Explorer() {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const matches = useMemo(() => {
    if (!q) return null;
    return TOOLS.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.blurb.toLowerCase().includes(q) ||
        t.category.includes(q),
    );
  }, [q]);

  return (
    <section id="tools" className="scroll-mt-24">
      {/* search */}
      <div className="mx-auto mb-10 max-w-xl">
        <div className="glass flex items-center gap-3 rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-indigo-500/40">
          <Search className="h-5 w-5 shrink-0 text-zinc-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search 80+ tools — try “email”, “regex”, “thumbnail”…"
            className="w-full bg-transparent text-sm text-white placeholder:text-zinc-500 focus:outline-none"
          />
          {q && (
            <button
              onClick={() => setQuery("")}
              className="text-xs text-zinc-500 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* search results */}
      {matches && (
        <div className="animate-fade-in">
          <p className="mb-4 text-sm text-zinc-400">
            {matches.length} result{matches.length === 1 ? "" : "s"} for “{query}”
          </p>
          {matches.length === 0 ? (
            <p className="py-10 text-center text-zinc-500">
              No tools match. Try another keyword.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {matches.map((t) => {
                const cat = CATEGORIES.find((c) => c.id === t.category)!;
                return (
                  <Link
                    key={t.slug}
                    href={`/tools/${t.slug}`}
                    className="glass group rounded-2xl p-4 transition-colors hover:bg-white/[0.06]"
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span className={`text-xs font-medium ${cat.tint}`}>
                        {cat.emoji} {cat.name}
                      </span>
                      {t.isNew && <NewBadge />}
                    </div>
                    <h3 className="font-medium text-white">{t.name}</h3>
                    <p className="mt-1 text-sm text-zinc-400">{t.blurb}</p>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* category columns (hidden while searching) */}
      {!matches && (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {CATEGORIES.map((cat) => {
            const tools = TOOLS.filter((t) => t.category === cat.id);
            return (
              <div
                key={cat.id}
                className="glass flex flex-col overflow-hidden rounded-2xl"
              >
                <div
                  className={`flex items-center gap-2 bg-gradient-to-r ${cat.from} ${cat.to} px-4 py-3`}
                >
                  <span className="text-base">{cat.emoji}</span>
                  <span className="text-sm font-semibold text-white drop-shadow">
                    {cat.name}
                  </span>
                  <span className="ml-auto rounded-full bg-black/20 px-2 py-0.5 text-[11px] font-medium text-white/90">
                    {tools.length}
                  </span>
                </div>
                <div className="flex-1 divide-y divide-white/5">
                  {tools.map((t) => (
                    <Link
                      key={t.slug}
                      href={`/tools/${t.slug}`}
                      className="group flex items-center gap-2 px-4 py-2.5 text-sm text-zinc-300 transition-colors hover:bg-white/5 hover:text-white"
                    >
                      <span className="truncate">{t.name}</span>
                      {t.isNew && <NewBadge />}
                      <ArrowRight className="ml-auto h-3.5 w-3.5 shrink-0 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                    </Link>
                  ))}
                </div>
                <Link
                  href={`/category/${cat.id}`}
                  className="border-t border-white/5 px-4 py-2.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
                >
                  View all →
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function NewBadge() {
  return (
    <span className="shrink-0 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300 ring-1 ring-emerald-500/20">
      New
    </span>
  );
}
