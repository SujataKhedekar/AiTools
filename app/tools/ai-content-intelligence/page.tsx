import type { Metadata } from "next";
import ContentIntelligenceEntry from "@/components/content-intelligence/ContentIntelligenceEntry";

export const metadata: Metadata = {
  title: "AI Content Intelligence | Aivora",
  description: "Analyze, improve, and audit your writing with context-aware AI and measurable content insights.",
};

export default function AIContentIntelligencePage() { return <ContentIntelligenceEntry />; }
