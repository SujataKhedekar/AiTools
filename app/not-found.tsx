import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <p className="text-6xl font-semibold text-indigo-400">404</p>
      <h1 className="mt-4 text-2xl font-semibold">This page wandered off</h1>
      <p className="mt-2 text-zinc-400">
        The tool or page you’re looking for doesn’t exist.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-transform hover:scale-105"
      >
        Back to all tools
      </Link>
    </div>
  );
}
