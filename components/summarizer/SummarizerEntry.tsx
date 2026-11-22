"use client";

import dynamic from "next/dynamic";

const SummarizerApp = dynamic(() => import("./App"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[50vh] items-center justify-center bg-[#faf9f6] text-sm text-slate-500">
      Loading AI Summarizer…
    </div>
  ),
});

export default function SummarizerEntry() {
  return <SummarizerApp />;
}
