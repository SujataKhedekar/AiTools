import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ImagePlus, Palette, QrCode, Scissors, Type } from "lucide-react";

export const metadata: Metadata = {
  title: "Design Tools",
  description: "Browse Aivora design tools, starting with QR Code Generator.",
};

export default function DesignCategoryPage() {
  return (
    <section className="w-full max-w-5xl animate-fade-up">
      <p className="eyebrow">Category</p>
      <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        Design
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--muted)] sm:text-base">
        Explore tools for creating polished visual assets. Choose a tool to get started.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Link
          href="/tools/tailwind-shade-generator"
          className="card card-hover group flex min-h-56 flex-col p-5 sm:p-6"
        >
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
            <Palette className="h-6 w-6" strokeWidth={1.75} />
          </span>
          <h2 className="mt-5 font-display text-lg font-semibold tracking-tight">Tailwind Shade Generator</h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
            Build perceptual 50–950 colour scales, check contrast and harmonies, preview UI components, and export design tokens.
          </p>
          <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold text-[var(--accent)]">
            Open tool <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </Link>
        <Link
          href="/tools/instantbg"
          className="card card-hover group flex min-h-56 flex-col p-5 sm:p-6"
        >
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-sky-50 text-sky-600 ring-1 ring-sky-100">
            <ImagePlus className="h-6 w-6" strokeWidth={1.75} />
          </span>
          <h2 className="mt-5 font-display text-lg font-semibold tracking-tight">InstantBG Studio</h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
            Remove image backgrounds in your browser, refine edges, change backdrops, and export clean product or portrait images.
          </p>
          <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold text-[var(--accent)]">
            Open tool <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </Link>
        <Link
          href="/tools/qr-studio"
          className="card card-hover group flex min-h-56 flex-col p-5 sm:p-6"
        >
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-100">
            <QrCode className="h-6 w-6" strokeWidth={1.75} />
          </span>
          <h2 className="mt-5 font-display text-lg font-semibold tracking-tight">
            QR Code Generator
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
            Create and customize QR codes for links, contact details, Wi-Fi, social profiles, and more.
          </p>
          <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold text-[var(--accent)]">
            Open tool <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </Link>
        <Link
          href="/tools/typepair"
          className="card card-hover group flex min-h-56 flex-col p-5 sm:p-6"
        >
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-fuchsia-50 text-fuchsia-600 ring-1 ring-fuchsia-100">
            <Type className="h-6 w-6" strokeWidth={1.75} />
          </span>
          <h2 className="mt-5 font-display text-lg font-semibold tracking-tight">Typepair Studio</h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
            Pair display, body, and accent fonts, explore curated specimens, build type scales, and export design tokens.
          </p>
          <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold text-[var(--accent)]">
            Open tool <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </Link>
        <Link
          href="/tools/rembg"
          className="card card-hover group flex min-h-56 flex-col p-5 sm:p-6"
        >
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-lime-50 text-lime-700 ring-1 ring-lime-100">
            <Scissors className="h-6 w-6" strokeWidth={1.75} />
          </span>
          <h2 className="mt-5 font-display text-lg font-semibold tracking-tight">RemBG Background Remover</h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
            Remove photo backgrounds in your browser and download transparent PNG cutouts.
          </p>
          <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold text-[var(--accent)]">
            Open tool <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </Link>
      </div>
    </section>
  );
}
