"use client";

import dynamic from "next/dynamic";

const RemBGApp = dynamic(() => import("./RemBGApp"), {
  ssr: false,
  loading: () => <div className="grid min-h-screen place-items-center bg-[#f6f5f1] text-sm text-[#777871]">Loading RemBG…</div>,
});

export default function RemBGEntry() { return <RemBGApp />; }
