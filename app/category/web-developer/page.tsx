import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Code2, PanelsTopLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Web Developer Tools | Aivora",
  description: "Developer tools for designing, generating, and refining frontend projects.",
};

export default function WebDeveloperPage() {
  return <section className="w-full max-w-5xl animate-fade-up">
    <p className="eyebrow">Category</p>
    <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Web Developer</h1>
    <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--muted)] sm:text-base">Build, inspect, and refine frontend experiences with focused developer tools.</p>
    <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <Link href="/tools/image-to-code" className="card card-hover group flex min-h-56 flex-col p-5 sm:p-6">
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-sky-50 text-sky-600 ring-1 ring-sky-100"><Code2 className="h-6 w-6" strokeWidth={1.75}/></span>
        <h2 className="mt-5 font-display text-lg font-semibold tracking-tight">AI Image to Code</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">Analyze UI screenshots, generate responsive multi-file projects, edit code, and preview it in an isolated workspace.</p>
        <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold text-[var(--accent)]">Open tool <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1"/></span>
      </Link>
      <Link href="/tools/landing-page" className="card card-hover group flex min-h-56 flex-col p-5 sm:p-6">
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-violet-50 text-violet-600 ring-1 ring-violet-100"><PanelsTopLeft className="h-6 w-6" strokeWidth={1.75}/></span>
        <h2 className="mt-5 font-display text-lg font-semibold tracking-tight">AI Landing Page Generator</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">Analyze your business, build a conversion strategy, create and edit landing pages, then export the finished project.</p>
        <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold text-[var(--accent)]">Open tool <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1"/></span>
      </Link>
    </div>
  </section>;
}
