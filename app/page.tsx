import Link from "next/link";
import { ArrowRight, Palette, Sparkles } from "lucide-react";

export default function HomePage() {
  return (
    <div className="mx-auto flex min-h-[62vh] w-full max-w-4xl items-center justify-center">
      <section className="card relative w-full overflow-hidden p-8 text-center sm:p-14">
        <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[var(--accent)]/[0.08] blur-3xl" />
        <span className="relative mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[var(--ink)] text-white shadow-sm">
          <Sparkles className="h-6 w-6" />
        </span>
        <p className="eyebrow relative mt-6">Aivora workspace</p>
        <h1 className="font-display relative mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Ready for your first idea
        </h1>
        <p className="relative mx-auto mt-3 max-w-lg text-sm leading-relaxed text-[var(--muted)] sm:text-base">
          The workspace is clear. Tell me what you want to build, and we’ll shape it one useful piece at a time.
        </p>
        <Link
          href="/category/design"
          className="btn-ink relative mt-7 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold"
        >
          <Palette className="h-4 w-4" /> Explore Design Tools <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}
