"use client";
import dynamic from "next/dynamic";
const NewsletterApp = dynamic(() => import("./App"), { ssr: false, loading: () => <div className="grid min-h-screen place-items-center bg-[#FAFAFA] text-sm text-neutral-500">Loading Newsletter Studio…</div> });
export default function NewsletterEntry() { return <NewsletterApp />; }
