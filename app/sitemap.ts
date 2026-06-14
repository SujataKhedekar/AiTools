import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { TOOLS, CATEGORIES } from "@/lib/tools";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const home: MetadataRoute.Sitemap = [
    {
      url: SITE.url,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
  ];

  const categories: MetadataRoute.Sitemap = CATEGORIES.map((c) => ({
    url: `${SITE.url}/category/${c.id}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const tools: MetadataRoute.Sitemap = TOOLS.map((t) => ({
    url: `${SITE.url}/tools/${t.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...home, ...categories, ...tools];
}
