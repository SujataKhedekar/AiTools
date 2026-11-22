import type { Metadata } from "next";
import RemBGEntry from "@/components/rembg/RemBGEntry";

export const metadata: Metadata = {
  title: "RemBG Background Remover | Aivora",
  description: "Remove image backgrounds in your browser and download transparent PNG cutouts.",
};

export default function RemBGPage() { return <RemBGEntry />; }
