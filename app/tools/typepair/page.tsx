import type { Metadata } from "next";
import TypepairEntry from "@/components/typepair/TypepairEntry";

export const metadata: Metadata = {
  title: "Typepair Font Pairing Studio | Aivora",
  description: "Explore font pairings, design a typographic scale, and export your type styles.",
};

export default function TypepairPage() { return <TypepairEntry />; }
