import { load } from "cheerio";
import { fetchPublicHtml } from "@/lib/seoReport";

export type SiteProfile = { url: string; name: string; title: string; description: string; headings: string[]; services: string[]; pages: string[] };
export type Competitor = SiteProfile & { kind: string; reason: string; relevance: number; searchEvidence: string[] };
export type Research = { createdAt: string; target: SiteProfile; competitors: Competitor[]; provider: string; notice?: string; gaps: string[]; topics: string[]; recommendations: Array<{ priority: string; title: string; reason: string }> };

function profile(url: string, html: string): SiteProfile {
  const $ = load(html);
  const title = $("title").first().text().trim();
  const description = $("meta[name='description']").attr("content")?.trim() ?? "";
  const headings = $("h1,h2,h3").map((_, el) => $(el).text().replace(/\s+/g, " ").trim()).get().filter(Boolean).slice(0, 30);
  const name = $("meta[property='og:site_name']").attr("content")?.trim() || title.split(/[|–—-]/)[0]?.trim() || new URL(url).hostname.replace(/^www\./, "");
  const links = $("a[href]").map((_, el) => $(el).attr("href") ?? "").get();
  const pages = [...new Set(links.map((href) => { try { const u = new URL(href, url); return u.origin === new URL(url).origin ? u.href : ""; } catch { return ""; } }).filter(Boolean))].slice(0, 30);
  const services = [...new Set(headings.filter((h) => /service|solution|product|consult|design|develop|repair|marketing|pricing/i.test(h)))].slice(0, 10);
  return { url, name, title, description, headings, services, pages };
}

async function search(query: string, country: string) {
  const endpoint = new URL("https://serpapi.com/search.json");
  endpoint.searchParams.set("engine", "google"); endpoint.searchParams.set("q", query);
  endpoint.searchParams.set("gl", country.toLowerCase().slice(0, 2)); endpoint.searchParams.set("api_key", process.env.SERPAPI_KEY!);
  const response = await fetch(endpoint, { signal: AbortSignal.timeout(15000), cache: "no-store" });
  if (!response.ok) throw new Error(`Search provider returned ${response.status}.`);
  const data = await response.json();
  return (data.organic_results ?? []) as Array<{ link?: string; title?: string; snippet?: string }>;
}

export async function runResearch(input: { url: string; country: string; industry: string; location: string; count: number }): Promise<Research> {
  const initial = await fetchPublicHtml(input.url);
  if (initial.status < 200 || initial.status >= 400) throw new Error(`Your website returned HTTP ${initial.status}.`);
  const target = profile(initial.url.href, initial.body);
  let notice: string | undefined; let provider = "SerpAPI · Google organic results";
  const found = new Map<string, { link: string; titles: string[]; snippets: string[] }>();
  if (!process.env.SERPAPI_KEY) { notice = "Live competitor discovery needs SERPAPI_KEY. Your website analysis is complete; competitor and ranking data are not fabricated."; provider = "Website analysis only"; }
  else {
    const topic = input.industry || target.title || target.name;
    const serviceTerms = target.services.slice(0, 2).join(" ");
    const queries = [`${topic} ${serviceTerms} ${input.location} ${input.country}`.trim(), `${topic} companies ${input.country}`, `${topic} services ${input.location} ${input.country}`.trim()];
    try {
      const batches = await Promise.all(queries.map((q) => search(q, input.country)));
      for (const result of batches.flat()) {
        if (!result.link) continue;
        try { const u = new URL(result.link); if (!/^https?:$/.test(u.protocol) || u.hostname === new URL(target.url).hostname) continue;
          const key = u.origin; const item = found.get(key) ?? { link: u.href, titles: [], snippets: [] };
          if (result.title) item.titles.push(result.title); if (result.snippet) item.snippets.push(result.snippet); found.set(key, item);
        } catch { /* Ignore malformed result URLs. */ }
      }
    } catch (error) { notice = `Search provider unavailable: ${error instanceof Error ? error.message : "request failed"}. Website analysis is complete; live competitor data is unavailable.`; }
  }
  const competitors: Competitor[] = [];
  const candidates = [...found.values()].slice(0, Math.min(input.count * 2, 30));
  const verified = await Promise.all(candidates.map(async (entry) => {
    try {
      const page = await fetchPublicHtml(entry.link);
      if (page.status < 200 || page.status >= 400 || !/text\/html/i.test(String(page.headers["content-type"] ?? "text/html"))) return null;
      const item = profile(page.url.href, page.body);
      const evidence = [...new Set([...entry.titles, ...entry.snippets])].slice(0, 4);
      const overlap = (item.headings.join(" ") + " " + item.title + " " + item.description).toLowerCase().split(/\W+/).filter((w) => w.length > 4 && (target.title + " " + target.description + " " + input.industry).toLowerCase().includes(w));
      const relevance = Math.min(96, Math.max(42, 50 + overlap.length * 4 + evidence.length * 5));
      const kind = overlap.length > 3 ? "Direct Competitor" : overlap.length > 0 ? "Indirect Competitor" : "Organic Search Competitor";
      return { ...item, kind, reason: evidence[0] || `Appeared in Google results for ${input.industry || target.name}.`, relevance, searchEvidence: evidence } as Competitor;
    } catch { return null; }
  }));
  competitors.push(...verified.filter((item): item is Competitor => item !== null).slice(0, input.count));
  const names = competitors.map((c) => c.name);
  const gaps = competitors.flatMap((c) => c.headings).filter((h) => !target.headings.some((t) => t.toLowerCase() === h.toLowerCase())).slice(0, 30);
  const base = input.industry || target.name;
  const topics = ["Complete guide to " + base, "How to choose a " + base + " provider", base + " pricing explained", "Common " + base + " mistakes and how to avoid them", base + " checklist for 2026", "What to expect from " + base + " services", base + " vs alternatives", "Questions to ask before hiring a " + base + " company", "How " + base + " works: a step-by-step guide", base + " trends and best practices", "Benefits of professional " + base, "DIY vs professional " + base, "How to measure " + base + " results", base + " case study: process and outcomes", "Choosing " + base + " in " + (input.location || input.country), base + " for small businesses", "The beginner's guide to " + base, "How much does " + base + " cost?", "A practical " + base + " comparison guide", "The future of " + base];
  return { createdAt: new Date().toISOString(), target, competitors, provider, ...(notice ? { notice } : {}), gaps, topics, recommendations: [
    { priority: competitors.length ? "High" : "Medium", title: competitors.length ? `Review ${names.slice(0, 3).join(", ")}` : "Enable live search discovery", reason: competitors.length ? "These verified sites appeared in relevant Google results; inspect their service positioning and landing pages." : "Set SERPAPI_KEY to retrieve and verify real organic search competitors." },
    { priority: "High", title: "Compare page titles and heading coverage", reason: `The submitted site has ${target.headings.length} extracted headings; use competitor page structures to identify missing service and intent coverage.` },
    { priority: "Medium", title: "Publish a focused content cluster", reason: "The 20 suggested topics target service education, comparisons, commercial evaluation and location intent." },
  ] };
}
