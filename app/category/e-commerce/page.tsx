import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, PanelsTopLeft, ShoppingBag } from 'lucide-react';

export const metadata: Metadata = {
  title: 'E-commerce Tools | Aivora',
  description: 'Create product catalogs and improve ecommerce content with focused Aivora tools.',
};

export default function EcommerceCategoryPage() {
  return <section className="w-full max-w-5xl animate-fade-up">
    <p className="eyebrow">Category</p>
    <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">E-commerce</h1>
    <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--muted)] sm:text-base">Create clear product content and catalog assets for your online store.</p>
    <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <Link href="/tools/product-description" className="card card-hover group flex min-h-56 flex-col p-5 sm:p-6">
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100"><ShoppingBag className="h-6 w-6" strokeWidth={1.75}/></span>
        <h2 className="mt-5 font-display text-lg font-semibold tracking-tight">AI Product Description Writer</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">Analyze product photos or pages, generate factual listings, and prepare marketplace-ready catalog exports.</p>
        <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold text-[var(--accent)]">Open tool <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1"/></span>
      </Link>
      <Link href="/tools/shopify-section-builder" className="card card-hover group flex min-h-56 flex-col p-5 sm:p-6">
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-sky-50 text-sky-600 ring-1 ring-sky-100"><PanelsTopLeft className="h-6 w-6" strokeWidth={1.75}/></span>
        <h2 className="mt-5 font-display text-lg font-semibold tracking-tight">Shopify AI Section Builder</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">Turn storefront screenshots into responsive Shopify Liquid sections with editable Theme Editor settings, validation, and live preview.</p>
        <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold text-[var(--accent)]">Open tool <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1"/></span>
      </Link>
    </div>
  </section>;
}
