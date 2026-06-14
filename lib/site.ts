// Single source of truth for site-wide SEO metadata.
// Set NEXT_PUBLIC_SITE_URL in Vercel to your final domain (e.g.
// https://aivora.codepalette.com) so canonicals, sitemap and OG tags are
// absolute and correct. Falls back to the Vercel production URL, then a default.

function resolveUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;
  return "https://aivora.vercel.app";
}

export const SITE = {
  name: "Aivora",
  brand: "Aivora by codepalette",
  url: resolveUrl(),
  tagline: "80+ AI tools, one premium workspace",
  description:
    "Aivora is a premium workspace of 80+ focused AI tools — AI writing, code, social content, design, video, e-commerce and business tools. Fast, free to run, and works right in your browser.",
  keywords: [
    "AI tools",
    "free AI tools",
    "AI writing tools",
    "AI content generator",
    "AI email writer",
    "AI coding tools",
    "AI social media tools",
    "AI marketing tools",
    "blog post generator",
    "product description generator",
    "AI toolkit",
    "Aivora",
  ],
};
