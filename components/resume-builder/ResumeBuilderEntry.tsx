"use client";

import dynamic from "next/dynamic";
import "./resume-builder.css";

const ResumeApp = dynamic(() => import("./App"), {
  ssr: false,
  loading: () => <div className="grid min-h-screen place-items-center bg-[#0B0E14] text-sm text-slate-400">Loading Resume Builder…</div>,
});

export default function ResumeBuilderEntry() {
  return <ResumeApp />;
}
