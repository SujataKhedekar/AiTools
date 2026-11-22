import type { UsageSnapshot } from '../../types/contentIntelligence';

class ContentUsageMonitor {
  private readonly startedAt = new Date().toISOString();
  private requestsTotal = 0;
  private cacheHits = 0;
  private cacheMisses = 0;
  private geminiCalls = 0;
  private crawlRequests = 0;
  private totalPromptTokens = 0;
  private totalOutputTokens = 0;
  private totalTokens = 0;
  private lastError: string | null = null;

  recordRequest(): void {
    this.requestsTotal += 1;
  }

  recordCacheHit(): void {
    this.cacheHits += 1;
  }

  recordCacheMiss(): void {
    this.cacheMisses += 1;
  }

  recordGeminiUsage(promptTokens = 0, outputTokens = 0, totalTokens = 0): void {
    this.geminiCalls += 1;
    this.totalPromptTokens += Math.max(0, promptTokens);
    this.totalOutputTokens += Math.max(0, outputTokens);
    this.totalTokens += Math.max(0, totalTokens || promptTokens + outputTokens);
  }

  recordCrawlRequest(): void {
    this.crawlRequests += 1;
  }

  recordError(message: string): void {
    this.lastError = message.slice(0, 300);
  }

  snapshot(): UsageSnapshot {
    // Approximate blended cost estimate for monitoring transparency
    const estimatedCostUsd =
      Math.round(((this.totalPromptTokens * 0.0000003) + (this.totalOutputTokens * 0.0000025)) * 100000) /
      100000;

    return {
      startedAt: this.startedAt,
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY?.trim()),
      requestsTotal: this.requestsTotal,
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      geminiCalls: this.geminiCalls,
      crawlRequests: this.crawlRequests,
      totalPromptTokens: this.totalPromptTokens,
      totalOutputTokens: this.totalOutputTokens,
      totalTokens: this.totalTokens,
      estimatedCostUsd,
      lastError: this.lastError,
    };
  }
}

export const contentUsageMonitor = new ContentUsageMonitor();
