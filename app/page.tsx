import Explorer from "@/components/Explorer";
import { TOOLS, CATEGORIES } from "@/lib/tools";

export default function HomePage() {
  return (
    <div>
      {/* hero */}
      <section className="animate-fade-up py-12 text-center sm:py-16">
        <span className="glass mb-5 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium text-zinc-300">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          {TOOLS.length} AI tools · {CATEGORIES.length} categories
        </span>
        <h1 className="mx-auto max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
          One toolkit for{" "}
          <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-teal-300 bg-clip-text text-transparent">
            everything AI
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-pretty text-base text-zinc-400 sm:text-lg">
          Write, code, design, market and grow — every tool runs on Groq’s free
          tier with your own key. No setup, no switching tabs.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <a
            href="#tools"
            className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-transform hover:scale-[1.03]"
          >
            Explore the tools
          </a>
          <a
            href="/tools/ai-email-writer"
            className="glass rounded-xl px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            Try the email writer
          </a>
        </div>
      </section>

      <Explorer />
    </div>
  );
}
