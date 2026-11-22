import crypto from "node:crypto";
import { DEFAULT_CONTEXT_PROFILE } from "@/components/content-intelligence/config/contentConfig";
import type { ContentAnalysisResponse, ContextualRewriteProfile, CrawlMode, RewriteRequest, WebsiteAuditReport } from "@/components/content-intelligence/types/contentIntelligence";
import { TtlCache } from "@/components/content-intelligence/server/utils/cache";
import { createContentRateLimiter } from "@/components/content-intelligence/server/utils/rateLimiter";
import { extractTextFromUploadedFile } from "@/components/content-intelligence/server/content/fileExtractor";
import { runFullContentAnalysis, runIntelligentRewrite, synthesizeWebsiteEditorialSummary } from "@/components/content-intelligence/server/content/geminiContentEngine";
import { generateExportBuffer } from "@/components/content-intelligence/server/content/reportExporter";
import { analyzeObjectiveMetrics } from "@/components/content-intelligence/server/content/textMetrics";
import { contentUsageMonitor } from "@/components/content-intelligence/server/content/usageMonitor";
import { crawlWebsiteContent } from "@/components/content-intelligence/server/content/websiteCrawler";
import { buildProjectZipBuffer } from "@/components/content-intelligence/server/services/projectBundle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const configuredCacheTtl = Number(process.env.CONTENT_CACHE_TTL_SECONDS || 1800);
const analysisCache = new TtlCache(Number.isFinite(configuredCacheTtl) ? configuredCacheTtl : 1800, 200);
const aiLimiter = createContentRateLimiter({ windowMs: 60_000, maxRequests: 20 });
const crawlLimiter = createContentRateLimiter({ windowMs: 60_000, maxRequests: 8 });
const uploadLimiter = createContentRateLimiter({ windowMs: 60_000, maxRequests: 10 });
const exportLimiter = createContentRateLimiter({ windowMs: 60_000, maxRequests: 15 });
const respond = (body: unknown, status = 200) => Response.json(body, { status });

function clientKey(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function rateLimit(limiter: (key: string) => { allowed: boolean; retryAfterSeconds: number }, key: string) {
  const result = limiter(key);
  return result.allowed ? null : respond({ error: `Request limit reached. Try again in ${result.retryAfterSeconds} seconds.`, retryAfterSeconds: result.retryAfterSeconds }, 429);
}

function mergeProfile(partial?: Partial<ContextualRewriteProfile>): ContextualRewriteProfile {
  return {
    ...DEFAULT_CONTEXT_PROFILE,
    ...(partial || {}),
    secondaryKeywords: Array.isArray(partial?.secondaryKeywords)
      ? partial.secondaryKeywords.filter((keyword) => typeof keyword === "string" && keyword.trim()).slice(0, 12)
      : DEFAULT_CONTEXT_PROFILE.secondaryKeywords,
  };
}

function mapError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected server error.";
  if (/GEMINI_API_KEY/.test(message)) return respond({ error: message }, 503);
  if (/API_KEY_INVALID|PERMISSION_DENIED/.test(message)) return respond({ error: "Gemini API authentication failed. Check the server-side GEMINI_API_KEY." }, 403);
  if (/RESOURCE_EXHAUSTED|429|quota/i.test(message)) return respond({ error: "AI quota or rate limit reached. Please retry shortly." }, 429);
  if (/restricted|Local or internal|Invalid website URL|robots\.txt/i.test(message)) return respond({ error: message }, 400);
  console.error("Content Intelligence API error:", message);
  return respond({ error: message || "Request failed." }, 500);
}

export async function GET(_request: Request, context: { params: { action: string } }) {
  if (context.params.action === "usage") return respond(contentUsageMonitor.snapshot());
  if (context.params.action === "export-source") {
    const blocked = rateLimit(exportLimiter, clientKey(_request));
    if (blocked) return blocked;
    try {
      const { buffer, fileCount } = await buildProjectZipBuffer();
      return new Response(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": 'attachment; filename="ai-content-intelligence-source.zip"',
          "Cache-Control": "no-store",
          "X-Bundle-File-Count": String(fileCount),
        },
      });
    } catch (error) {
      return mapError(error);
    }
  }
  return respond({ error: "Unknown content action." }, 404);
}

export async function POST(request: Request, context: { params: { action: string } }) {
  const action = context.params.action;
  if (Number(request.headers.get("content-length") || 0) > 8 * 1024 * 1024) return respond({ error: "Request exceeds the 8 MB limit." }, 413);
  const key = clientKey(request);
  const blocked = action === "crawl-audit" ? rateLimit(crawlLimiter, key)
    : action === "upload" ? rateLimit(uploadLimiter, key)
      : action === "export" ? rateLimit(exportLimiter, key)
        : ["analyze", "rewrite"].includes(action) ? rateLimit(aiLimiter, key) : null;
  if (blocked) return blocked;

  try {
    if (action === "upload") {
      const form = await request.formData();
      const file = form.get("file");
      if (!(file instanceof File)) return respond({ error: "Select a document to upload." }, 400);
      if (!file.size) return respond({ error: "The selected document is empty." }, 400);
      if (file.size > 5 * 1024 * 1024) return respond({ error: "Document exceeds the 5 MB upload limit." }, 413);
      try {
        const result = await extractTextFromUploadedFile(Buffer.from(await file.arrayBuffer()), file.name, file.type);
        if (!result.text.trim()) return respond({ error: "No readable text was found in this document." }, 422);
        return respond(result);
      } catch (error) { return respond({ error: error instanceof Error ? error.message : "Could not read this document." }, 400); }
    }

    let body: Record<string, unknown>;
    try { body = await request.json() as Record<string, unknown>; }
    catch { return respond({ error: "Invalid request data." }, 400); }

    if (action === "metrics") {
      const text = typeof body.text === "string" ? body.text : "";
      if (!text.trim()) return respond({ error: "Text content is required." }, 400);
      if (text.length > 60_000) return respond({ error: "Text exceeds the 60,000 character limit." }, 413);
      const secondary = Array.isArray(body.secondaryKeywords) ? body.secondaryKeywords.filter((item): item is string => typeof item === "string") : [];
      return respond({ metrics: analyzeObjectiveMetrics(text, typeof body.primaryKeyword === "string" ? body.primaryKeyword : "", secondary) });
    }

    if (action === "analyze") {
      contentUsageMonitor.recordRequest();
      const text = typeof body.text === "string" ? body.text.trim() : "";
      if (text.length < 20) return respond({ error: "Enter at least 20 characters for content analysis." }, 400);
      if (text.length > 60_000) return respond({ error: "Document exceeds the 60,000 character analysis limit." }, 413);
      const profile = mergeProfile(body.profile as Partial<ContextualRewriteProfile> | undefined);
      const cacheKey = `analyze:${crypto.createHash("sha256").update(JSON.stringify({ text, profile })).digest("hex")}`;
      const cached = analysisCache.get<ContentAnalysisResponse>(cacheKey);
      if (cached) { contentUsageMonitor.recordCacheHit(); return respond({ ...cached, cached: true }); }
      contentUsageMonitor.recordCacheMiss();
      const result = await runFullContentAnalysis(text, profile);
      analysisCache.set(cacheKey, result);
      return respond(result);
    }

    if (action === "rewrite") {
      contentUsageMonitor.recordRequest();
      const input = body as Partial<RewriteRequest>;
      const targetText = typeof input.targetText === "string" ? input.targetText.trim() : "";
      const originalText = typeof input.originalText === "string" ? input.originalText.trim() : targetText;
      if (targetText.length < 5) return respond({ error: "Text to rewrite must contain at least 5 characters." }, 400);
      if (targetText.length > 60_000) return respond({ error: "Text exceeds the 60,000 character limit." }, 413);
      const payload: RewriteRequest = {
        originalText, targetText, scope: input.scope || "article", style: input.style || "Human editorial",
        profile: mergeProfile(input.profile), preserveKeywords: input.preserveKeywords !== false,
        preserveEntities: input.preserveEntities !== false, paragraphIndex: input.paragraphIndex,
        sentenceIndex: input.sentenceIndex, customInstruction: typeof input.customInstruction === "string" ? input.customInstruction.slice(0, 500) : undefined,
      };
      return respond(await runIntelligentRewrite(payload));
    }

    if (action === "crawl-audit") {
      contentUsageMonitor.recordRequest(); contentUsageMonitor.recordCrawlRequest();
      const rootUrl = typeof body.url === "string" ? body.url.trim() : "";
      if (!rootUrl) return respond({ error: "Provide a website URL to crawl." }, 400);
      const crawlMode: CrawlMode = ["single_page", "selected_pages", "site_crawl"].includes(String(body.crawlMode)) ? body.crawlMode as CrawlMode : "single_page";
      const selectedUrls = Array.isArray(body.selectedUrls) ? body.selectedUrls.filter((item): item is string => typeof item === "string" && item.trim().length > 0).slice(0, 15) : undefined;
      const maxPages = Math.max(1, Math.min(15, Number(body.maxPages) || (crawlMode === "single_page" ? 1 : 6)));
      const maxDepth = Math.max(0, Math.min(4, Number(body.maxDepth) || 2));
      const cacheKey = `crawl:${crypto.createHash("sha256").update(JSON.stringify({ rootUrl, crawlMode, selectedUrls, maxPages, maxDepth })).digest("hex")}`;
      const cached = analysisCache.get<WebsiteAuditReport>(cacheKey);
      if (cached) { contentUsageMonitor.recordCacheHit(); return respond(cached); }
      contentUsageMonitor.recordCacheMiss();
      const base = await crawlWebsiteContent({ rootUrl, crawlMode, selectedUrls, maxPages, maxDepth });
      let siteEditorialSummary = "Programmatic audit complete. Configure GEMINI_API_KEY for AI editorial recommendations.";
      let tokenUsage = { promptTokens: 0, outputTokens: 0, totalTokens: 0 };
      if (process.env.GEMINI_API_KEY?.trim()) {
        const synthesis = await synthesizeWebsiteEditorialSummary(base.rootUrl, base.pages);
        siteEditorialSummary = synthesis.siteEditorialSummary;
        tokenUsage = { promptTokens: synthesis.promptTokens, outputTokens: synthesis.outputTokens, totalTokens: synthesis.totalTokens };
        for (const recommendation of synthesis.pageRecommendations) {
          const page = base.pages.find((item) => item.url === recommendation.url);
          if (page && recommendation.recommendation) page.recommendations.unshift(recommendation.recommendation);
        }
      }
      const report: WebsiteAuditReport = { ...base, siteEditorialSummary, tokenUsage };
      analysisCache.set(cacheKey, report);
      return respond(report);
    }

    if (action === "export") {
      const kind = ["original", "improved", "full_report"].includes(String(body.kind)) ? body.kind as "original" | "improved" | "full_report" : "full_report";
      const format = ["txt", "docx", "pdf"].includes(String(body.format)) ? body.format as "txt" | "docx" | "pdf" : "txt";
      const originalText = typeof body.originalText === "string" ? body.originalText : "";
      const improvedText = typeof body.improvedText === "string" ? body.improvedText : "";
      if (!originalText.trim() && !improvedText.trim()) return respond({ error: "Cannot export an empty document." }, 400);
      const result = await generateExportBuffer({ kind, format, originalText, improvedText, analysis: (body.analysis as ContentAnalysisResponse | null) || null, documentTitle: typeof body.documentTitle === "string" ? body.documentTitle : "content-intelligence" });
      return new Response(new Uint8Array(result.buffer), { headers: { "Content-Type": result.contentType, "Content-Disposition": `attachment; filename="${result.fileName}"`, "Cache-Control": "no-store" } });
    }

    return respond({ error: "Unknown content action." }, 404);
  } catch (error) {
    contentUsageMonitor.recordError(error instanceof Error ? error.message : "Content request failed.");
    return mapError(error);
  }
}
