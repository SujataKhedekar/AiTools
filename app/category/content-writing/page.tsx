import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileText, Mail, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Content Writing Tools",
  description: "Explore Aivora content writing tools, starting with AI Summarizer.",
};

export default function ContentWritingCategoryPage() {
  return (
    <section className="w-full max-w-5xl animate-fade-up">
      <p className="eyebrow">Category</p>
      <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Content Writing</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--muted)] sm:text-base">
        Tools to make long-form reading and writing workflows clearer and faster.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Link href="/tools/ai-summarizer" className="card card-hover group flex min-h-56 flex-col p-5 sm:p-6">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
            <FileText className="h-6 w-6" strokeWidth={1.75} />
          </span>
          <h2 className="mt-5 font-display text-lg font-semibold tracking-tight">AI Summarizer</h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
            Summarize text or PDF, DOCX, TXT, and Markdown files into structured, source-grounded notes.
          </p>
          <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold text-[var(--accent)]">
            Open tool <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </Link>
        <Link href="/tools/newsletter" className="card card-hover group flex min-h-56 flex-col p-5 sm:p-6">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-rose-50 text-rose-600 ring-1 ring-rose-100">
            <Mail className="h-6 w-6" strokeWidth={1.75} />
          </span>
          <h2 className="mt-5 font-display text-lg font-semibold tracking-tight">Newsletter Studio</h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
            Draft editorial newsletters with AI, refine copy, organize sections, and export email-ready HTML.
          </p>
          <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold text-[var(--accent)]">
            Open tool <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </Link>
        <Link href="/tools/ai-content-intelligence" className="card card-hover group flex min-h-56 flex-col p-5 sm:p-6">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-sky-50 text-sky-600 ring-1 ring-sky-100">
            <Sparkles className="h-6 w-6" strokeWidth={1.75} />
          </span>
          <h2 className="mt-5 font-display text-lg font-semibold tracking-tight">AI Content Intelligence</h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
            Analyze writing patterns, refine copy while protecting keywords, check content quality, and audit website pages.
          </p>
          <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold text-[var(--accent)]">
            Open tool <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </Link>
      </div>
    </section>
  );
}
