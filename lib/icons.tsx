import {
  Bot,
  Code2,
  Hash,
  Palette,
  Clapperboard,
  ShoppingBag,
  PenLine,
  Briefcase,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

// Line icons per category (lucide). Kept out of lib/tools.ts so that file
// stays plain serialisable data usable on both server and client.
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  "ai-service": Bot,
  "web-developer": Code2,
  "social-content": Hash,
  design: Palette,
  video: Clapperboard,
  ecommerce: ShoppingBag,
  "content-writing": PenLine,
  "business-tools": Briefcase,
};

export const categoryIcon = (id: string): LucideIcon =>
  CATEGORY_ICONS[id] ?? Sparkles;
