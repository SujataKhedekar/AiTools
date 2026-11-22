"use client";

import dynamic from "next/dynamic";

const Studio = dynamic(() => import("./Studio"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[50vh] items-center justify-center bg-slate-50 text-sm text-slate-500">
      Preparing QR Studio…
    </div>
  ),
});

export default function QRStudioEntry() {
  return <Studio />;
}
