"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Menu, X, Sparkles, ArrowUpRight } from "lucide-react";
import { CATEGORIES } from "@/lib/tools";
import { categoryIcon } from "@/lib/icons";
import SearchBox from "@/components/SearchBox";
import ApiKeyManager from "@/components/ApiKeyManager";

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--ink)] text-[#fdfcfa] shadow-sm">
        <Sparkles className="h-[18px] w-[18px]" strokeWidth={1.75} />
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-[19px] font-semibold tracking-tight">
          Aivora
        </span>
        <span className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--faint)]">
          by codepalette
        </span>
      </span>
    </Link>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const homeActive = pathname === "/";

  return (
    <nav className="flex flex-col gap-0.5">
      <Link
        href="/"
        onClick={onNavigate}
        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          homeActive
            ? "bg-[var(--ink)] text-[#fdfcfa]"
            : "text-[var(--muted)] hover:bg-black/[0.04] hover:text-[var(--ink)]"
        }`}
      >
        <LayoutGrid className="h-[18px] w-[18px]" strokeWidth={1.75} />
        All tools
      </Link>

      <p className="eyebrow mt-5 mb-1.5 px-3">Categories</p>

      {CATEGORIES.map((cat) => {
        const Icon = categoryIcon(cat.id);
        const active = pathname === `/category/${cat.id}`;
        return (
          <Link
            key={cat.id}
            href={`/category/${cat.id}`}
            onClick={onNavigate}
            className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
              active
                ? "bg-black/[0.05] font-medium text-[var(--ink)]"
                : "text-[var(--muted)] hover:bg-black/[0.04] hover:text-[var(--ink)]"
            }`}
          >
            <span
              className={`grid h-7 w-7 place-items-center rounded-lg ${cat.soft} ${cat.accent} ring-1 ${cat.ring}`}
            >
              <Icon className="h-[15px] w-[15px]" strokeWidth={2} />
            </span>
            {cat.name}
          </Link>
        );
      })}
    </nav>
  );
}

export default function Shell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-[260px] shrink-0 flex-col border-r border-[var(--border)] bg-white/70 px-4 py-5 backdrop-blur-sm lg:flex">
        <div className="px-2">
          <Brand />
        </div>
        <div className="mt-7 flex-1 overflow-y-auto pr-1">
          <NavLinks />
        </div>
        <a
          href="https://console.groq.com/keys"
          target="_blank"
          rel="noreferrer"
          className="card mt-4 flex items-center justify-between gap-2 px-3.5 py-3 text-sm"
        >
          <span>
            <span className="block font-medium text-[var(--ink)]">
              Free to run
            </span>
            <span className="text-xs text-[var(--muted)]">
              Powered by Groq
            </span>
          </span>
          <ArrowUpRight className="h-4 w-4 text-[var(--faint)]" />
        </a>
      </aside>

      {/* mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-[var(--ink)]/30 backdrop-blur-sm animate-fade-in"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-[280px] border-r border-[var(--border)] bg-[var(--paper)] px-4 py-5 animate-fade-in">
            <div className="flex items-center justify-between px-2">
              <Brand />
              <button
                onClick={() => setOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-lg text-[var(--muted)] hover:bg-black/5"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-6">
              <NavLinks onNavigate={() => setOpen(false)} />
            </div>
          </aside>
        </div>
      )}

      {/* main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-[var(--border)] bg-[var(--paper)]/85 px-4 backdrop-blur-md sm:px-6">
          <button
            onClick={() => setOpen(true)}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[var(--muted)] hover:bg-black/5 lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="lg:hidden">
            <Brand />
          </div>

          <div className="ml-auto flex flex-1 items-center justify-end gap-3">
            <div className="hidden max-w-md flex-1 sm:block">
              <SearchBox />
            </div>
            <ApiKeyManager />
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1180px] flex-1 px-4 py-7 sm:px-6 lg:px-10 lg:py-10">
          {/* mobile search */}
          <div className="mb-6 sm:hidden">
            <SearchBox />
          </div>
          {children}
        </main>

        <footer className="border-t border-[var(--border)] px-6 py-7 text-center text-sm text-[var(--faint)]">
          <span className="font-medium text-[var(--ink)]">Aivora</span> · built by
          Harshad · {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  );
}
