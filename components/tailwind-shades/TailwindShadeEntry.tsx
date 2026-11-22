"use client";

import dynamic from "next/dynamic";

const TailwindShadeApp = dynamic(() => import("./App"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[50vh] items-center justify-center bg-[#F7F6F2] text-sm text-slate-500">
      Loading Tailwind Shade Generator…
    </div>
  ),
});

export default function TailwindShadeEntry() {
  return <TailwindShadeApp />;
}
