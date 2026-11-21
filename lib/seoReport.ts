import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import http from "node:http";
import https from "node:https";
import { load } from "cheerio";

const MAX_RESPONSE_BYTES = 1_000_000;
const MAX_REDIRECTS = 3;
const REQUEST_TIMEOUT_MS = 10_000;

export type SeoCheckStatus = "good" | "warning" | "issue" | "info";
export type SeoCategory = "Technical SEO" | "On-page SEO" | "Content SEO" | "Schema" | "Performance";
export type SeoPriority = "Critical" | "High" | "Medium" | "Low";
export type SeoEffort = "Quick fix" | "1–2 hours" | "Half day" | "Depends on project";
export type TaskStatus = "pending" | "fixed";

export interface SeoCheck {
  title: string;
  category: SeoCategory;
  status: SeoCheckStatus;
  detail: string;
  recommendation?: string;
  whyItMatters?: string;
  priority?: SeoPriority;
  effort?: SeoEffort;
  codeExample?: string;
  affectedUrls?: string[];
}

export interface SeoAction {
  id: string;
  issue: string;
  whatIsWrong: string;
  whyItMatters: string;
  affectedUrl: string;
  recommendedFix: string;
  priority: SeoPriority;
  effort: SeoEffort;
  status: TaskStatus;
  codeExample?: string;
}

export interface PageSpeedResult {
  strategy: "mobile" | "desktop";
  scores: { performance: number | null; seo: number | null };
  metrics: { lcpMs: number | null; cls: number | null; inpMs: number | null };
  opportunities: Array<{ title: string; description: string; savingsMs: number | null }>;
  error?: string;
}

export interface ImageAltSuggestion {
  id: number;
  imageUrl: string;
  suggestion: string;
  source: "caption" | "image label" | "filename" | "manual review";
  needsVisualReview: boolean;
}

export interface SeoReport {
  url: string;
  scannedAt: string;
  pageStatus: number;
  title: string;
  score: number;
  checks: SeoCheck[];
  categoryScores: Record<SeoCategory, number | null>;
  pageSpeed: PageSpeedResult[];
  actions: SeoAction[];
  brokenLinks: Array<{ sourceUrl: string; url: string; status: number | null }>;
  generatedSitemap: string;
  missingAltImageCount: number;
  imageAltSuggestions: ImageAltSuggestion[];
}

function usableAltClue(value: string): string {
  const cleaned = value.replace(/\s+/g, " ").trim().replace(/[.!?]+$/, "");
  if (
    !cleaned ||
    cleaned.length < 3 ||
    /^(image|img|photo|picture|visual|asset|logo|icon|banner|thumbnail)([\s_-]*\d+)?$/i.test(cleaned)
  ) {
    return "";
  }
  return cleaned.slice(0, 125);
}

function escapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function suggestedMetaDescription(value: string): string {
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (cleaned.length <= 155) return cleaned;
  const excerpt = cleaned.slice(0, 152);
  const lastSpace = excerpt.lastIndexOf(" ");
  return `${excerpt.slice(0, lastSpace > 110 ? lastSpace : 152).replace(/[,.:\s]+$/, "")}…`;
}

function suggestImageAlt(clues: {
  caption: string;
  label: string;
  filename: string;
}): { suggestion: string; source: ImageAltSuggestion["source"] } | null {
  const caption = usableAltClue(clues.caption);
  if (caption) return { suggestion: caption, source: "caption" };

  const label = usableAltClue(clues.label);
  if (label) return { suggestion: label, source: "image label" };

  const filename = usableAltClue(clues.filename);
  if (filename) {
    const naturalized = filename[0].toLocaleUpperCase() + filename.slice(1);
    return {
      suggestion: /[.!?]$/.test(naturalized) ? naturalized : `${naturalized}.`,
      source: "filename",
    };
  }
  return null;
}

function isPublicAddress(address: string): boolean {
  const version = isIP(address);
  if (version === 4) {
    const octets = address.split(".").map(Number);
    const ip = octets.reduce((value, octet) => value * 256 + octet, 0);
    const blocked: Array<[number, number]> = [
      [0x00000000, 8],
      [0x0a000000, 8],
      [0x64400000, 10],
      [0x7f000000, 8],
      [0xa9fe0000, 16],
      [0xac100000, 12],
      [0xc0000000, 24],
      [0xc0000200, 24],
      [0xc0586300, 24],
      [0xc0a80000, 16],
      [0xc6120000, 15],
      [0xc6336400, 24],
      [0xcb007100, 24],
      [0xe0000000, 4],
      [0xf0000000, 4],
    ];
    return !blocked.some(
      ([base, prefix]) => (ip >>> (32 - prefix)) === (base >>> (32 - prefix)),
    );
  }

  if (version !== 6) return false;
  const normalized = address.toLowerCase();
  const firstHextet = Number.parseInt(normalized.split(":")[0] || "0", 16);
  return (
    firstHextet >= 0x2000 &&
    firstHextet <= 0x3fff &&
    !normalized.startsWith("2001:") &&
    !normalized.startsWith("2002:") &&
    !normalized.startsWith("3fff:")
  );
}

async function resolvePublicAddress(hostname: string) {
  const version = isIP(hostname);
  const addresses = version
    ? [{ address: hostname, family: version }]
    : await lookup(hostname, { all: true, verbatim: true });

  if (!addresses.length || addresses.some(({ address }) => !isPublicAddress(address))) {
    throw new Error("This URL does not resolve to a publicly accessible address.");
  }
  return addresses[0];
}

function requestPage(url: URL, address: string, family: number, method = "GET") {
  const transport = url.protocol === "https:" ? https : http;
  return new Promise<{ status: number; headers: http.IncomingHttpHeaders; body: string }>(
    (resolve, reject) => {
      const request = transport.request(
        url,
        {
          method,
          headers: {
            "User-Agent": "CodepaletteSeoAudit/1.0 (+https://example.com)",
            Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.1",
          },
          lookup: (_hostname, _options, callback) => {
            if (typeof _options === "object" && _options.all) {
              callback(null, [{ address, family }]);
            } else {
              callback(null, address, family);
            }
          },
        },
        (response) => {
          const status = response.statusCode ?? 0;
          const headers = response.headers;
          let body = "";
          let size = 0;
          response.setEncoding("utf8");
          response.on("data", (chunk: string) => {
            size += Buffer.byteLength(chunk);
            if (size > MAX_RESPONSE_BYTES) {
              request.destroy(new Error("The page is larger than the 1 MB scan limit."));
              return;
            }
            body += chunk;
          });
          response.on("end", () => resolve({ status, headers, body }));
          response.on("error", reject);
        },
      );
      request.setTimeout(REQUEST_TIMEOUT_MS, () => {
        request.destroy(new Error("The page request timed out."));
      });
      request.on("error", reject);
      request.end();
    },
  );
}

async function fetchPublicPage(input: URL, method = "GET"): Promise<{
  url: URL;
  status: number;
  headers: http.IncomingHttpHeaders;
  body: string;
}> {
  let url = new URL(input);
  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      (url.port && url.port !== "80" && url.port !== "443")
    ) {
      throw new Error("Only public HTTP or HTTPS pages on standard ports can be scanned.");
    }

    const { address, family } = await resolvePublicAddress(url.hostname);
    const response = await requestPage(url, address, family, method);
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.location;
      if (!location || redirects === MAX_REDIRECTS) {
        throw new Error("The page redirected too many times or returned an invalid redirect.");
      }
      url = new URL(location, url);
      continue;
    }
    return { url, ...response };
  }
  throw new Error("The page redirected too many times.");
}

/** Fetch a public HTML page using the same DNS, redirect, size and timeout limits as the audit. */
export async function fetchPublicHtml(rawUrl: string) {
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`);
  } catch {
    throw new Error("Enter a valid website URL.");
  }
  if (!url.hostname || url.username || url.password) throw new Error("Enter a public website URL without credentials.");
  return fetchPublicPage(url);
}

async function checkPublicLink(input: URL) {
  try {
    let response = await fetchPublicPage(input, "HEAD");
    if (response.status === 405 || response.status === 501) {
      response = await fetchPublicPage(input, "GET");
    }
    return { url: response.url.href, status: response.status };
  } catch {
    return { url: input.href, status: null };
  }
}

async function getPageSpeed(url: string, strategy: "mobile" | "desktop"): Promise<PageSpeedResult> {
  const endpoint = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
  endpoint.searchParams.set("url", url);
  endpoint.searchParams.set("strategy", strategy.toUpperCase());
  for (const category of ["performance", "seo"]) {
    endpoint.searchParams.append("category", category);
  }
  if (process.env.PAGESPEED_API_KEY) {
    endpoint.searchParams.set("key", process.env.PAGESPEED_API_KEY);
  }

  try {
    const response = await fetch(endpoint, { signal: AbortSignal.timeout(18_000) });
    if (!response.ok) {
      return {
        strategy,
        scores: { performance: null, seo: null },
        metrics: { lcpMs: null, cls: null, inpMs: null },
        opportunities: [],
        error: response.status === 429
          ? "PageSpeed Insights quota was exceeded (HTTP 429). Configure PAGESPEED_API_KEY in the deployment environment and redeploy to enable reliable mobile scores."
          : `PageSpeed Insights returned HTTP ${response.status}.`,
      };
    }
    const data = await response.json();
    const lighthouse = data.lighthouseResult;
    const audits = lighthouse?.audits ?? {};
    const score = (name: string) => {
      const value = lighthouse?.categories?.[name]?.score;
      return typeof value === "number" ? Math.round(value * 100) : null;
    };
    return {
      strategy,
      scores: { performance: score("performance"), seo: score("seo") },
      metrics: {
        lcpMs: typeof audits["largest-contentful-paint"]?.numericValue === "number"
          ? Math.round(audits["largest-contentful-paint"].numericValue)
          : null,
        cls: typeof audits["cumulative-layout-shift"]?.numericValue === "number"
          ? Number(audits["cumulative-layout-shift"].numericValue.toFixed(3))
          : null,
        inpMs: typeof audits["interaction-to-next-paint"]?.numericValue === "number"
          ? Math.round(audits["interaction-to-next-paint"].numericValue)
          : typeof audits["max-potential-fid"]?.numericValue === "number"
            ? Math.round(audits["max-potential-fid"].numericValue)
            : null,
      },
      opportunities: (Object.values(lighthouse?.audits ?? {}) as Array<{
        title?: string;
        description?: string;
        details?: { type?: string; overallSavingsMs?: number };
        score?: number | null;
      }>)
        .filter((audit) =>
          audit.details?.type === "opportunity" && audit.score !== 1,
        )
        .slice(0, 5)
        .map((audit) => ({
          title: audit.title ?? "PageSpeed opportunity",
          description: audit.description ?? "",
          savingsMs: typeof audit.details?.overallSavingsMs === "number"
            ? Math.round(audit.details.overallSavingsMs)
            : null,
        })),
    };
  } catch (error) {
    return {
      strategy,
      scores: { performance: null, seo: null },
      metrics: { lcpMs: null, cls: null, inpMs: null },
      opportunities: [],
      error: error instanceof Error ? error.message : "PageSpeed Insights is unavailable.",
    };
  }
}

const CHECK_DETAILS: Record<string, { category: SeoCategory; why: string; effort: SeoEffort; code?: string }> = {
  "Page response": { category: "Technical SEO", why: "Search engines and visitors need a successful response to access and index the page.", effort: "Depends on project" },
  "Meta title": { category: "On-page SEO", why: "The title helps search engines and people understand the page and can affect search-result clicks.", effort: "Quick fix", code: "<title>Clear page topic | Brand</title>" },
  "Meta description": { category: "On-page SEO", why: "A useful description can explain the result and encourage relevant searchers to click.", effort: "Quick fix", code: '<meta name="description" content="A concise, accurate summary of this page.">' },
  "Robots directives": { category: "Technical SEO", why: "A noindex directive can prevent this page from appearing in search results.", effort: "Quick fix", code: '<meta name="robots" content="index, follow">' },
  "Open Graph tags": { category: "On-page SEO", why: "These tags control how the page is presented when shared on social platforms.", effort: "Quick fix", code: '<meta property="og:title" content="Page title">\n<meta property="og:description" content="Page summary">\n<meta property="og:image" content="https://example.com/share.jpg">' },
  "Canonical URL": { category: "Technical SEO", why: "Canonical URLs help search engines consolidate duplicate page variants under the intended URL.", effort: "Quick fix", code: '<link rel="canonical" href="https://example.com/page">' },
  "Heading structure": { category: "On-page SEO", why: "A clear heading outline makes page sections easier to understand for readers and crawlers.", effort: "Quick fix", code: "<h1>Main page topic</h1>\n<h2>Section</h2>\n<h3>Subsection</h3>" },
  "Image alt text": { category: "On-page SEO", why: "Descriptive alt text makes informative images accessible and gives crawlers text context.", effort: "Quick fix", code: '<img src="/product.jpg" alt="Blue ceramic mug on a wooden table">' },
  "Internal links": { category: "Technical SEO", why: "Relevant internal links help people and crawlers discover related pages.", effort: "1–2 hours" },
  "Broken links": { category: "Technical SEO", why: "Broken destinations interrupt user journeys and can waste crawl activity.", effort: "1–2 hours" },
  "Sitemap": { category: "Technical SEO", why: "An XML sitemap helps crawlers discover canonical, indexable URLs.", effort: "1–2 hours", code: '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>https://example.com/page</loc></url>\n</urlset>' },
  "Robots.txt": { category: "Technical SEO", why: "robots.txt publishes crawl guidance and can help crawlers find your sitemap.", effort: "Quick fix", code: "User-agent: *\nAllow: /\nSitemap: https://example.com/sitemap.xml" },
  "Schema validator (JSON-LD syntax)": { category: "Schema", why: "Malformed or incomplete structured data may prevent search engines from understanding eligible page entities.", effort: "1–2 hours", code: '<script type="application/ld+json">\n{"@context":"https://schema.org","@type":"WebPage","name":"Page title"}\n</script>' },
  "Main content length": { category: "Content SEO", why: "The visible main content should provide enough useful context to satisfy the page’s intended purpose; there is no universal word-count target.", effort: "Half day" },
  "HTTPS encryption": { category: "Technical SEO", why: "HTTPS protects connections and is expected for secure, trustworthy websites.", effort: "Depends on project" },
  "Mobile viewport": { category: "Technical SEO", why: "A viewport declaration lets browsers lay out pages for mobile screen sizes.", effort: "Quick fix", code: '<meta name="viewport" content="width=device-width, initial-scale=1">' },
  "Document language": { category: "Technical SEO", why: "The document language helps assistive technology and search engines interpret page text.", effort: "Quick fix", code: '<html lang="en">' },
  "PageSpeed mobile": { category: "Performance", why: "Slow mobile pages can frustrate users and contribute to poor real-world page experience.", effort: "Depends on project" },
};

const DEFAULT_RECOMMENDATIONS: Record<string, string> = {
  "Page response": "Check the affected URL, hosting logs, and CDN or server rules; fix the reported HTTP response and confirm the page returns HTTP 200.",
  "Meta title": "Write a unique title that clearly describes this page and place it in the document <head>.",
  "Meta description": "Write a unique, accurate summary of this page and add it as a meta description in the document <head>.",
  "Robots directives": "Remove the noindex directive if this page should be available in search results; keep it only when exclusion is intentional.",
  "Open Graph tags": "Add the missing Open Graph title, description, or absolute image URL to the document <head>.",
  "Canonical URL": "Set a valid canonical URL that points to this page's preferred, indexable version.",
  "Heading structure": "Use one descriptive H1, then organize sections with H2 and nested H3 headings without skipping a level.",
  "Image alt text": "Add concise alt text describing each informative image; use alt=\"\" only for decorative images.",
  "Internal links": "Add relevant links to related pages, and replace links to broken destinations with working canonical URLs.",
  "Broken links": "Update each affected link to a working destination or remove it; check the affected URLs listed in the report.",
  "Main content length": "Review whether the page answers its intended query with useful, original detail. Add only content that helps visitors; there is no universal word-count target.",
  "HTTPS encryption": "Install or renew a TLS certificate, then redirect HTTP requests to the HTTPS version and update canonical links.",
  "Mobile viewport": "Add a responsive viewport declaration to the document <head>.",
  "Document language": "Set the correct BCP 47 language code on the root HTML element, for example <html lang=\"en\">.",
  Sitemap: "Generate and publish an XML sitemap containing canonical, indexable URLs, then reference it from robots.txt.",
  "Schema validator (JSON-LD syntax)": "Fix malformed JSON and check each structured-data object for a valid Schema.org context, type, and required properties.",
  "PageSpeed mobile": "Use the measured Lighthouse opportunities below to reduce mobile loading and rendering work, then rerun the mobile audit.",
};

function check(
  checks: SeoCheck[],
  title: string,
  status: SeoCheckStatus,
  detail: string,
  recommendation?: string,
  options: {
    affectedUrls?: string[];
    priority?: SeoPriority;
    codeExample?: string;
  } = {},
) {
  const metadata = CHECK_DETAILS[title] ?? {
    category: "Technical SEO" as const,
    why: "This finding identifies a technical factor that may affect users or search engines.",
    effort: "1–2 hours" as const,
  };
  const actionableRecommendation =
    recommendation ??
    (status === "issue" || status === "warning"
      ? DEFAULT_RECOMMENDATIONS[title]
      : undefined);
  const priority =
    options.priority ??
    (status === "issue" ? "High" : status === "warning" ? "Medium" : "Low");
  checks.push({
    title,
    category: metadata.category,
    status,
    detail,
    ...(actionableRecommendation
      ? {
          recommendation: actionableRecommendation,
          whyItMatters: metadata.why,
          priority,
          effort: metadata.effort,
        }
      : {}),
    ...(actionableRecommendation && (options.codeExample ?? metadata.code)
      ? { codeExample: options.codeExample ?? metadata.code }
      : {}),
    ...(options.affectedUrls?.length ? { affectedUrls: options.affectedUrls } : {}),
  });
}

async function findSitemap(url: URL) {
  const candidates = ["/sitemap.xml", "/sitemap_index.xml"];
  for (const path of candidates) {
    const result = await fetchPublicPage(new URL(path, url.origin));
    const contentType = result.headers["content-type"]?.toLowerCase() ?? "";
    if (result.status >= 200 && result.status < 300 && /xml|text\/plain/.test(contentType)) {
      return new URL(path, url.origin).href;
    }
  }
  return null;
}

export async function generateSeoReport(rawUrl: string): Promise<SeoReport> {
  let input: URL;
  try {
    input = new URL(/^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`);
  } catch {
    throw new Error("Enter a valid website URL, such as https://example.com/page.");
  }
  if (
    !["http:", "https:"].includes(input.protocol) ||
    input.username ||
    input.password ||
    (input.port && input.port !== "80" && input.port !== "443")
  ) {
    throw new Error("Enter a public HTTP or HTTPS page URL on the standard port.");
  }

  const page = await fetchPublicPage(input);
  const contentType = page.headers["content-type"]?.toLowerCase() ?? "";
  if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
    throw new Error("The URL did not return an HTML page that can be audited.");
  }
  const $ = load(page.body);
  const checks: SeoCheck[] = [];
  const title = $("title").first().text().trim();
  const description =
    $('meta[name="description" i]').attr("content")?.trim() ?? "";
  const robots = $('meta[name="robots" i]').attr("content")?.trim() ?? "";
  const canonical = $('link[rel~="canonical" i]').first().attr("href")?.trim() ?? "";
  let canonicalUrl = "";
  if (canonical) {
    try {
      canonicalUrl = new URL(canonical, page.url).href;
    } catch {
      canonicalUrl = "";
    }
  }
  const ogTitle = $('meta[property="og:title" i]').attr("content")?.trim() ?? "";
  const ogDescription = $('meta[property="og:description" i]').attr("content")?.trim() ?? "";
  const ogImage = $('meta[property="og:image" i]').attr("content")?.trim() ?? "";
  const viewport = $('meta[name="viewport" i]').attr("content")?.trim() ?? "";
  const documentLanguage = $("html").attr("lang")?.trim() ?? "";
  const robotsHeader = page.headers["x-robots-tag"]?.toString() ?? "";
  const h1s = $("h1").map((_, element) => $(element).text().trim()).get().filter(Boolean);
  const pathTitle = (page.url.pathname.split("/").filter(Boolean).pop() || "")
    .replace(/%20/gi, " ")
    .replace(/\.[a-z0-9]{2,6}$/i, "")
    .replace(/[-_]+/g, " ")
    .trim();
  const titleSource = h1s[0] || pathTitle;
  const titleSuggestion = titleSource.length > 60
    ? `${titleSource.slice(0, 57).replace(/\s+\S*$/, "").trim()}…`
    : titleSource;
  const descriptionSource =
    $("main p, article p").first().text().trim() || $("p").first().text().trim();
  const descriptionSuggestion = suggestedMetaDescription(descriptionSource);
  const headingLevels = $("h1, h2, h3")
    .map((_, element) => Number(element.tagName.slice(1)))
    .get();
  const skippedHeadingLevel = headingLevels.some(
    (level, index) => index > 0 && level > headingLevels[index - 1] + 1,
  );
  const images = $("img").toArray();
  const imagesWithAlt = images.filter(
    (image) => $(image).attr("alt")?.trim(),
  ).length;
  const decorativeImages = images.filter(
    (image) => $(image).attr("alt") === "",
  ).length;
  const missingAltImages = images.filter(
    (image) => $(image).attr("alt") === undefined,
  );
  const imageAltSuggestions = missingAltImages.slice(0, 20).map((image, index) => {
    const $image = $(image);
    const src = $image.attr("src") || $image.attr("data-src") || "";
    let filename = "";
    let imageUrl = "";
    if (src && !src.startsWith("data:")) {
      try {
        const parsed = new URL(src, page.url);
        imageUrl = ["http:", "https:"].includes(parsed.protocol) ? parsed.href : "";
        const encodedName = parsed.pathname.split("/").pop() || "";
        filename = decodeURIComponent(encodedName)
          .replace(/\.[a-z0-9]{2,6}$/i, "")
          .replace(/[-_]+/g, " ")
          .replace(/\b[0-9a-f]{12,}\b/gi, "")
          .replace(/\b\d{2,4}x\d{2,4}\b/gi, "")
          .replace(/\s+/g, " ")
          .trim();
      } catch {
        filename = "";
      }
    }

    const suggestion = suggestImageAlt({
      caption: $image.closest("figure").find("figcaption").first().text(),
      label:
        $image.attr("title") ||
        $image.attr("aria-label") ||
        $image.parent().attr("aria-label") ||
        "",
      filename,
    });
    return {
      id: index,
      imageUrl,
      suggestion: suggestion?.suggestion ?? "",
      source: suggestion?.source ?? "manual review",
      needsVisualReview: !suggestion,
    };
  });
  const missingAlt = missingAltImages.length;
  const pageOrigin = page.url.origin;
  const links = $("a[href]").toArray();
  const internalUrls = new Set<string>();
  const allLinkUrls = new Map<string, URL>();
  const internalLinks = links.filter((link) => {
    try {
      const target = new URL($(link).attr("href")!, page.url);
      if (!["http:", "https:"].includes(target.protocol)) return false;
      target.hash = "";
      if (!allLinkUrls.has(target.href)) {
        allLinkUrls.set(target.href, target);
      }
      if (target.origin === pageOrigin) internalUrls.add(target.href);
      return target.origin === pageOrigin;
    } catch {
      return false;
    }
  }).length;
  const linkResults = await Promise.all(
    [...allLinkUrls.values()].slice(0, 20).map(checkPublicLink),
  );
  const brokenLinks = linkResults.filter(
    (result) => result.status !== null && result.status >= 400,
  ).map((result) => ({ ...result, sourceUrl: page.url.href }));
  const sitemapUrls = [page.url.href, ...internalUrls].slice(0, 50);
  const escapeXml = (value: string) =>
    value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const generatedSitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...sitemapUrls.map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`),
    "</urlset>",
  ].join("\n");
  const schemaScripts = $('script[type="application/ld+json" i]').toArray();
  const parsedSchemas: unknown[] = [];
  const invalidSchemaScripts = schemaScripts.filter((script) => {
    try {
      parsedSchemas.push(JSON.parse($(script).contents().text()));
      return false;
    } catch {
      return true;
    }
  }).length;
  const schemaObjects = parsedSchemas.flatMap((schema) =>
    Array.isArray(schema) ? schema : [schema],
  ).flatMap((schema) => {
    if (!schema || typeof schema !== "object") return [];
    const graph = (schema as { "@graph"?: unknown })["@graph"];
    return Array.isArray(graph) ? graph : [schema];
  }).filter((schema): schema is Record<string, unknown> =>
    Boolean(schema && typeof schema === "object"),
  );
  const schemaMissingRequired = schemaObjects.filter((schema) => {
    const type = schema["@type"];
    const typeName = Array.isArray(type) ? String(type[0]) : String(type ?? "");
    const requiredProperty: Record<string, string> = {
      Article: "headline",
      BlogPosting: "headline",
      NewsArticle: "headline",
      Product: "name",
      Organization: "name",
      LocalBusiness: "name",
      Event: "name",
      BreadcrumbList: "itemListElement",
    };
    const property = requiredProperty[typeName.split("/").pop() ?? typeName];
    return !schema["@type"] || !String(schema["@context"] ?? "").includes("schema.org") ||
      Boolean(property && !schema[property]);
  }).length;

  const $content = $("main").length ? $("main").first().clone() : $("body").clone();
  $content.find("script, style, nav, footer, header, noscript, template").remove();
  const contentText = $content.text().replace(/\s+/g, " ").trim();
  const wordCount = contentText ? contentText.split(" ").length : 0;
  const robotsUrl = new URL("/robots.txt", pageOrigin);
  const [pageSpeed, robotsResult, sitemap] = await Promise.all([
    Promise.all([getPageSpeed(page.url.href, "mobile")]),
    fetchPublicPage(robotsUrl).catch(() => null),
    findSitemap(page.url).catch(() => null),
  ]);

  check(
    checks,
    "Page response",
    page.status >= 200 && page.status < 300 ? "good" : "issue",
    `The page returned HTTP ${page.status}.`,
    page.status >= 400 ? "Fix the page response so search engines and visitors can access it." : undefined,
    { priority: page.status >= 500 ? "Critical" : "High" },
  );
  check(
    checks,
    "HTTPS encryption",
    page.url.protocol === "https:" ? "good" : "issue",
    page.url.protocol === "https:" ? "The page is served over HTTPS." : "The final page URL uses HTTP, not HTTPS.",
    page.url.protocol === "https:" ? undefined : "Configure TLS and redirect HTTP requests to the HTTPS version.",
    { priority: "Critical" },
  );
  check(
    checks,
    "Mobile viewport",
    viewport ? "good" : "warning",
    viewport ? `Viewport is set to “${viewport}”.` : "No mobile viewport meta tag was found.",
    viewport ? undefined : "Add a responsive viewport declaration so mobile browsers use the device width.",
  );
  check(
    checks,
    "Document language",
    documentLanguage ? "good" : "warning",
    documentLanguage ? `HTML language is set to “${documentLanguage}”.` : "The HTML element has no lang attribute.",
    documentLanguage ? undefined : "Set the correct language on the root HTML element, for example <html lang=\"en\">.",
  );
  check(
    checks,
    "Meta title",
    !title ? "issue" : title.length > 60 ? "warning" : title.length < 30 ? "warning" : "good",
    title ? `${title.length} characters: “${title}”` : "No title tag was found.",
    !title
      ? titleSuggestion
        ? `Add a unique title to the document head. Suggested from this page's ${h1s[0] ? "H1" : "URL"}: “${titleSuggestion}”. Review it for accuracy.`
        : "Add a unique, descriptive title for this page based on its actual content."
      : title.length > 60 || title.length < 30
        ? "Aim for a concise, descriptive title, typically around 30–60 characters."
        : undefined,
    {
      ...(titleSuggestion
        ? { codeExample: `<title>${escapeHtmlAttribute(titleSuggestion)}</title>` }
        : {}),
    },
  );
  check(
    checks,
    "Meta description",
    !description ? "issue" : description.length > 160 ? "warning" : description.length < 120 ? "warning" : "good",
    description ? `${description.length} characters: “${description}”` : "No meta description was found.",
    !description
      ? descriptionSuggestion
        ? `Add a distinct summary to the document head. Suggested from the page's visible text: “${descriptionSuggestion}” Review and edit it to accurately summarize this page.`
        : "Add a distinct summary based on the page's actual content. No visible paragraph was available to draft one automatically."
      : description.length > 160 || description.length < 120
        ? "Write a clear page summary, typically around 120–160 characters."
        : undefined,
    {
      ...(descriptionSuggestion
        ? {
            codeExample: `<meta name="description" content="${escapeHtmlAttribute(descriptionSuggestion)}">`,
          }
        : {}),
    },
  );

  check(
    checks,
    "Robots directives",
    /\bnoindex\b/i.test(`${robots} ${robotsHeader}`) ? "warning" : "good",
    [robots && `Page robots meta: ${robots}.`, robotsHeader && `X-Robots-Tag: ${robotsHeader}.`]
      .filter(Boolean).join(" ") || "No page-level robots directive was found.",
    /\bnoindex\b/i.test(`${robots} ${robotsHeader}`) ? "Remove the noindex directive if this page should appear in search results." : undefined,
  );
  check(
    checks,
    "Open Graph tags",
    ogTitle && ogDescription && ogImage ? "good" : "warning",
    `og:title ${ogTitle ? "found" : "missing"}; og:description ${ogDescription ? "found" : "missing"}; og:image ${ogImage ? "found" : "missing"}.`,
    !ogTitle || !ogDescription || !ogImage
      ? "Add Open Graph title, description, and image for better social sharing previews."
      : undefined,
  );
  const canonicalOffOrigin = Boolean(canonicalUrl) && new URL(canonicalUrl).origin !== pageOrigin;
  check(
    checks,
    "Canonical URL",
    !canonical ? "warning" : !canonicalUrl ? "issue" : canonicalOffOrigin ? "warning" : "good",
    canonicalUrl ? `Canonical URL: ${canonicalUrl}` : canonical ? "The canonical URL is invalid." : "No canonical link was found.",
    !canonical
      ? "Add a canonical URL when this page has duplicate or similar versions."
      : !canonicalUrl
        ? "Set the canonical link to a valid absolute or relative URL."
        : canonicalOffOrigin
          ? "Confirm that this page is intentionally canonicalized to a different domain."
          : undefined,
  );
  check(
    checks,
    "Heading structure",
    h1s.length !== 1 || skippedHeadingLevel ? "warning" : "good",
    `${h1s.length} H1, ${$("h2").length} H2, and ${$("h3").length} H3 headings found.${h1s.length ? ` H1: “${h1s[0]}”` : ""}${skippedHeadingLevel ? " Heading levels skip a rank." : ""}`,
    h1s.length !== 1 || skippedHeadingLevel
      ? "Use one clear H1 and organize subtopics under H2 and H3 headings without skipping levels."
      : undefined,
  );
  check(
    checks,
    "Image alt text",
    missingAlt === 0 ? "good" : "warning",
    `${imagesWithAlt} images have descriptive alt text, ${decorativeImages} are marked decorative, and ${missingAlt} informative image${missingAlt === 1 ? " is" : "s are"} missing an alt attribute.`,
    missingAlt ? "Add concise alt text that describes each image’s visible subject and purpose. Leave alt=\"\" only for decorative images." : undefined,
  );
  check(
    checks,
    "Internal links",
    brokenLinks.length ? "warning" : internalLinks > 0 ? "good" : "warning",
    `${internalLinks} internal links found among ${links.length} links; checked ${linkResults.length} unique destinations, ${linkResults.filter((item) => item.status === null).length} could not be verified.`,
    internalLinks === 0
      ? "Add relevant internal links to help visitors and crawlers discover related pages."
      : brokenLinks.length
        ? "Review the affected broken link URLs and replace them with working destinations or remove them."
        : undefined,
  );
  check(
    checks,
    "Broken links",
    brokenLinks.length ? "issue" : linkResults.some((item) => item.status === null) ? "info" : "good",
    brokenLinks.length
      ? `${brokenLinks.length} broken link${brokenLinks.length === 1 ? "" : "s"} found among ${linkResults.length} checked of ${allLinkUrls.size} unique destinations: ${brokenLinks.slice(0, 5).map((item) => `${item.url} (HTTP ${item.status})`).join("; ")}${brokenLinks.length > 5 ? `; and ${brokenLinks.length - 5} more` : ""}.`
      : linkResults.some((item) => item.status === null)
        ? `No HTTP errors found among ${linkResults.length} checked of ${allLinkUrls.size} destinations, but some destinations could not be verified.`
        : `All ${linkResults.length} checked of ${allLinkUrls.size} unique link destinations returned successful HTTP responses.`,
    brokenLinks.length ? "Update each affected link to a working destination or remove it; check the affected URLs listed in the report." : undefined,
    { affectedUrls: brokenLinks.map((item) => item.url), priority: brokenLinks.some((item) => (item.status ?? 0) >= 500) ? "Critical" : brokenLinks.some((item) => item.status === 404) ? "High" : "Medium" },
  );
  check(
    checks,
    "Main content length",
    wordCount < 100 ? "warning" : wordCount < 300 ? "info" : "good",
    `${wordCount} words found in the main content area after excluding navigation, footer, scripts, and styles.`,
    wordCount < 100
      ? "Review whether the page answers its intended search query with enough original, useful detail. There is no universal word-count target."
      : undefined,
  );
  check(
    checks,
    "Sitemap",
    sitemap ? "good" : "warning",
    sitemap
      ? `Sitemap found at ${sitemap}. A draft with ${sitemapUrls.length} same-site URLs found on this page is also available below.`
      : `No sitemap.xml or sitemap_index.xml was found at the site root. A draft was generated from ${sitemapUrls.length} same-site URL${sitemapUrls.length === 1 ? "" : "s"} found on this page.`,
    sitemap ? undefined : "Publish the generated draft after reviewing its URLs, then reference it from robots.txt.",
  );
  check(
    checks,
    "Robots.txt",
    robotsResult && robotsResult.status >= 200 && robotsResult.status < 300 ? "good" : "info",
    robotsResult && robotsResult.status >= 200 && robotsResult.status < 300
      ? `${robotsUrl.href} is available${robotsResult.body.match(/sitemap:\s*(\S+)/i) ? ` and references ${robotsResult.body.match(/sitemap:\s*(\S+)/i)?.[1]}` : ""}.`
      : "robots.txt was not available at the site root.",
    robotsResult && robotsResult.status >= 200 && robotsResult.status < 300
      ? undefined
      : "Optional: publish a robots.txt file at the site root with crawl rules appropriate for your site, and include your sitemap URL.",
  );
  check(
    checks,
    "Schema validator (JSON-LD syntax)",
    !schemaScripts.length ? "warning" : invalidSchemaScripts || schemaMissingRequired ? "issue" : "good",
    !schemaScripts.length
      ? "No JSON-LD structured data blocks were found."
      : `${schemaScripts.length - invalidSchemaScripts} of ${schemaScripts.length} JSON-LD blocks contain valid JSON; ${schemaMissingRequired} schema objects have missing Schema.org context/type or a basic required property.`,
    !schemaScripts.length
      ? "Add relevant Schema.org JSON-LD data where it describes the page."
      : invalidSchemaScripts || schemaMissingRequired
        ? "Fix malformed JSON and check each object for a Schema.org context, type, and its type’s required properties."
        : undefined,
  );

  for (const strategy of ["mobile"] as const) {
    const result = pageSpeed.find((item) => item.strategy === strategy)!;
    const score = result.scores.performance;
    const performanceFixes = result.opportunities
      .map((item) => `${item.title}: ${item.description}`)
      .join(" ");
    check(
      checks,
      `PageSpeed ${strategy}`,
      score === null ? "info" : score < 50 ? "issue" : score < 90 ? "warning" : "good",
      score === null
        ? result.error ?? `PageSpeed ${strategy} data is unavailable.`
        : `Google Lighthouse ${strategy} performance score: ${score}/100.${result.metrics.lcpMs === null ? "" : ` LCP ${result.metrics.lcpMs} ms;`}${result.metrics.cls === null ? "" : ` CLS ${result.metrics.cls};`}${result.metrics.inpMs === null ? "" : ` INP ${result.metrics.inpMs} ms.`}`,
      score !== null && score < 90
        ? performanceFixes || `Review the PageSpeed ${strategy} diagnostics and address the measured performance bottlenecks.`
        : score === null
          ? result.error?.includes("429")
            ? "Configure PAGESPEED_API_KEY in the deployment environment and redeploy; the current PageSpeed quota was exceeded. Scores remain unavailable until the service can be queried."
            : "PageSpeed could not return measurements. Check the URL and PageSpeed service or quota configuration, then rerun the audit. Scores are unavailable, not estimated."
          : undefined,
      { priority: score !== null && score < 50 ? "High" : "Medium" },
    );
  }

  const scoreFor = (category: SeoCategory) => {
    const relevant = checks.filter((item) => item.category === category && item.status !== "info");
    if (!relevant.length) return null;
    return Math.round((relevant.filter((item) => item.status === "good").length / relevant.length) * 100);
  };
  const categoryScores = {
    "Technical SEO": scoreFor("Technical SEO"),
    "On-page SEO": scoreFor("On-page SEO"),
    "Content SEO": scoreFor("Content SEO"),
    Schema: scoreFor("Schema"),
    Performance: scoreFor("Performance"),
  };
  const overallScores = Object.values(categoryScores).filter((value): value is number => value !== null);
  const score = overallScores.length
    ? Math.round(overallScores.reduce((total, value) => total + value, 0) / overallScores.length)
    : 0;
  const priorityOrder: Record<SeoPriority, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
  const actions: SeoAction[] = checks
    .filter((item) => item.recommendation && (item.status === "issue" || item.status === "warning"))
    .map((item) => ({
      id: item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      issue: item.title,
      whatIsWrong: item.detail,
      whyItMatters: item.whyItMatters ?? "This finding may affect search visibility or visitor experience.",
      affectedUrl: item.affectedUrls?.join("\n") || page.url.href,
      recommendedFix: item.recommendation!,
      priority: item.priority ?? "Medium",
      effort: item.effort ?? "1–2 hours",
      status: "pending" as const,
      ...(item.codeExample ? { codeExample: item.codeExample } : {}),
    }))
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  return {
    url: page.url.href,
    scannedAt: new Date().toISOString(),
    pageStatus: page.status,
    title: title || "Untitled page",
    score,
    checks,
    categoryScores,
    pageSpeed,
    actions,
    brokenLinks,
    generatedSitemap,
    missingAltImageCount: missingAltImages.length,
    imageAltSuggestions,
  };
}
