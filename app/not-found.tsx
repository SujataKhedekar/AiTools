import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[55vh] flex-col items-center justify-center text-center">
      <p className="font-display text-7xl font-semibold text-[var(--ink)]">404</p>
      <h1 className="mt-3 text-xl font-medium">This page wandered off</h1>
      <p className="mt-2 text-[var(--muted)]">
        The tool or page you’re looking for doesn’t exist.
      </p>
      <Link
        href="/"
        className="btn-ink mt-7 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold"
      >
        <ArrowLeft className="h-4 w-4" /> Back to all tools
      </Link>
    </div>
  );
}
