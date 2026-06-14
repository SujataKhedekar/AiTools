"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search } from "lucide-react";
import { TOOLS, CATEGORIES } from "@/lib/tools";
import { categoryIcon } from "@/lib/icons";

export default function SearchBox() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const q = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (!q) return [];
    return TOOLS.filter(
      (t) =>
        t.name.toLowerCase().includes(q) || t.blurb.toLowerCase().includes(q),
    ).slice(0, 6);
  }, [q]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      router.push(`/tools/${results[active].slug}`);
      setOpen(false);
      setQuery("");
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={boxRef} className="relative w-full">
      <div className="flex items-center gap-2.5 rounded-xl border border-[var(--border-strong)] bg-white px-3.5 py-2 transition focus-within:border-[var(--accent)] focus-within:shadow-[0_0_0_3px_rgba(31,111,99,0.12)]">
        <Search className="h-[18px] w-[18px] shrink-0 text-[var(--faint)]" strokeWidth={1.75} />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => query && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search 80+ tools…"
          className="w-full bg-transparent text-sm text-[var(--ink)] placeholder:text-[var(--faint)] focus:outline-none"
        />
        <kbd className="hidden rounded border border-[var(--border)] bg-[var(--paper)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--faint)] sm:block">
          /
        </kbd>
      </div>

      {open && q && (
        <div className="card absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden p-1.5 animate-fade-in">
          {results.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-[var(--muted)]">
              No tools match “{query}”.
            </p>
          ) : (
            results.map((t, i) => {
              const cat = CATEGORIES.find((c) => c.id === t.category)!;
              const Icon = categoryIcon(t.category);
              return (
                <Link
                  key={t.slug}
                  href={`/tools/${t.slug}`}
                  onClick={() => {
                    setOpen(false);
                    setQuery("");
                  }}
                  onMouseEnter={() => setActive(i)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                    i === active ? "bg-black/[0.04]" : ""
                  }`}
                >
                  <span
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${cat.soft} ${cat.accent} ring-1 ${cat.ring}`}
                  >
                    <Icon className="h-4 w-4" strokeWidth={2} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-[var(--ink)]">
                      {t.name}
                    </span>
                    <span className="block truncate text-xs text-[var(--muted)]">
                      {t.blurb}
                    </span>
                  </span>
                </Link>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
