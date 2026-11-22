"use client";

import dynamic from "next/dynamic";

const DeckAIApp = dynamic(() => import("./App"), { ssr: false, loading: () => <div className="grid min-h-screen place-items-center text-sm text-slate-500">Loading DeckAI…</div> });

export default function DeckAIEntry() {
  return <DeckAIApp />;
}
