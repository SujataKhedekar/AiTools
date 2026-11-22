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
  brand: "Aivora",
  url: resolveUrl(),
  tagline: "A workspace for what’s next",
  description: "Aivora is a thoughtful workspace ready for its next useful idea.",
  keywords: ["Aivora", "creative workspace"],
};
