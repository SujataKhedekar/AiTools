"use client";
import dynamic from "next/dynamic";
const InstantBGApp = dynamic(() => import("./App"), { ssr: false, loading: () => <div className="grid min-h-screen place-items-center bg-[#0C0D10] text-sm text-white/70">Loading InstantBG Studio…</div> });
export default function InstantBGEntry() { return <InstantBGApp />; }
