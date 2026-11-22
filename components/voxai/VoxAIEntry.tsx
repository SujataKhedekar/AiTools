"use client";

import dynamic from "next/dynamic";

const VoxAIApp = dynamic(() => import("./App"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[50vh] items-center justify-center bg-slate-50 text-sm text-slate-500">
      Loading VoxAI Studio…
    </div>
  ),
});

export default function VoxAIEntry() {
  return <VoxAIApp />;
}
