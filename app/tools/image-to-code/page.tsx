import type { Metadata } from "next";
import ImageToCodeEntry from "@/components/image-to-code/ImageToCodeEntry";

export const metadata: Metadata = {
  title: "AI Image to Code | Aivora",
  description: "Turn UI screenshots into responsive frontend code with design analysis and a live preview.",
};

export default function ImageToCodePage() { return <ImageToCodeEntry />; }
