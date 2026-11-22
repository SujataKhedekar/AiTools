import type { Metadata } from "next";
import SummarizerEntry from "@/components/summarizer/SummarizerEntry";

export const metadata: Metadata = {
  title: "AI Summarizer",
  description: "Summarize text and documents with source-grounded AI summaries.",
};

export default function AISummarizerPage() {
  return <SummarizerEntry />;
}
