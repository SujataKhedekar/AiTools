"use client";

import dynamic from "next/dynamic";
import "./typepair.css";

const TypepairApp = dynamic(() => import("./App"), {
  ssr: false,
  loading: () => <div className="grid min-h-screen place-items-center bg-white text-sm text-zinc-500">Loading Typepair…</div>,
});

export default function TypepairEntry() { return <TypepairApp />; }
