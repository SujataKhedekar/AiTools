"use client";

import dynamic from "next/dynamic";
import "./content-intelligence.css";

const ContentWorkspace = dynamic(() => import("./App").then((module) => module.App), {
  ssr: false,
  loading: () => <div className="grid min-h-screen place-items-center bg-slate-50 text-sm text-slate-500">Loading Content Intelligence…</div>,
});

export default function ContentIntelligenceEntry() { return <ContentWorkspace />; }
