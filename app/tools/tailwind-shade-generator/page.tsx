import type { Metadata } from "next";
import TailwindShadeEntry from "@/components/tailwind-shades/TailwindShadeEntry";

export const metadata: Metadata = {
  title: "Tailwind Shade Generator",
  description: "Generate, tune, preview, and export accessible Tailwind colour scales.",
};

export default function TailwindShadeGeneratorPage() {
  return <TailwindShadeEntry />;
}
