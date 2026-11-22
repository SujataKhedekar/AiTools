import type { Metadata } from "next";
import VoxAIEntry from "@/components/voxai/VoxAIEntry";

export const metadata: Metadata = {
  title: "VoxAI Voice Studio",
  description: "Create, customize, and manage AI generated speech.",
};

export default function VoxAIPage() {
  return <VoxAIEntry />;
}
