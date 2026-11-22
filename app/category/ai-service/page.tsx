import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, AudioLines } from "lucide-react";

export const metadata: Metadata = {
  title: "AI Service Tools",
  description: "Browse Aivora AI tools, starting with VoxAI voice studio.",
};

export default function AiServiceCategoryPage() {
  return (
    <section className="w-full max-w-5xl animate-fade-up">
      <p className="eyebrow">Category</p>
      <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        AI Service
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--muted)] sm:text-base">
        Explore AI-powered tools for voice, speech, and creative workflows.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Link
          href="/tools/voxai"
          className="card card-hover group flex min-h-56 flex-col p-5 sm:p-6"
        >
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-violet-50 text-violet-600 ring-1 ring-violet-100">
            <AudioLines className="h-6 w-6" strokeWidth={1.75} />
          </span>
          <h2 className="mt-5 font-display text-lg font-semibold tracking-tight">VoxAI Voice Studio</h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
            Turn scripts into speech, direct two-speaker dialogue, browse voices, and manage your audio library.
          </p>
          <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold text-[var(--accent)]">
            Open tool <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </Link>
      </div>
    </section>
  );
}
