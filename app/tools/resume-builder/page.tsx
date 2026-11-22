import type { Metadata } from "next";
import ResumeBuilderEntry from "@/components/resume-builder/ResumeBuilderEntry";

export const metadata: Metadata = {
  title: "AI Resume Builder | Aivora",
  description: "Build, tailor, and export an ATS-ready resume with Aivora.",
};

export default function ResumeBuilderPage() {
  return <ResumeBuilderEntry />;
}
