"use client";

import dynamic from "next/dynamic";
import "./image-to-code.css";

const Workspace = dynamic(() => import("./App").then((module) => module.App), {
  ssr: false,
  loading: () => <div className="grid min-h-screen place-items-center bg-slate-50 text-sm text-slate-500">Loading Image to Code workspace…</div>,
});

export default function ImageToCodeEntry() { return <Workspace />; }
