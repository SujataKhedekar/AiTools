import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 mb-8 border-b border-white/5 bg-[#07070b]/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/30 transition-transform group-hover:scale-105">
            <Sparkles className="h-5 w-5 text-white" />
          </span>
          <span className="text-lg font-semibold tracking-tight">
            Nova<span className="text-indigo-400">.</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/#tools"
            className="rounded-lg px-3 py-2 text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            Browse tools
          </Link>
          <a
            href="https://platform.claude.com"
            target="_blank"
            rel="noreferrer"
            className="rounded-lg bg-white/5 px-3.5 py-2 font-medium text-white ring-1 ring-white/10 transition-colors hover:bg-white/10"
          >
            Powered by Claude
          </a>
        </nav>
      </div>
    </header>
  );
}
