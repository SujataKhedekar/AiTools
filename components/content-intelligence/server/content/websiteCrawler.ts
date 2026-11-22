import * as cheerio from 'cheerio';
import type {
  CrawledPageExtract,
  CrawlMode,
  CrossPageFinding,
  WebsiteAuditReport,
} from '../../types/contentIntelligence';
import { validatePublicUrl } from '../utils/urlSecurity';
import { analyzeObjectiveMetrics, computeTextSimilarityPercent } from './textMetrics';
import { contentUsageMonitor } from './usageMonitor';

interface RobotsRules {
  found: boolean;
  disallowedPaths: string[];
  allowedPaths: string[];
  crawlDelayMs: number;
}

const USER_AGENT = 'AIContentIntelligenceBot/1.0 (+https://example.invalid/editorial-audit)';

async function safeFetchPublic(rawUrl: string, timeoutMs = 12000): Promise<Response> {
  let currentUrl = (await validatePublicUrl(rawUrl)).toString();
  const maxRedirects = 4;

  for (let hop = 0; hop <= maxRedirects; hop++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(currentUrl, {
        method: 'GET',
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8',
        },
      });
      clearTimeout(timer);

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (!location) return response;
        const resolved = new URL(location, currentUrl).toString();
        currentUrl = (await validatePublicUrl(resolved)).toString();
        continue;
      }

      return response;
    } catch (error) {
      clearTimeout(timer);
      throw error;
    }
  }

  throw new Error('Too many redirects while fetching target URL.');
}

async function fetchRobotsTxt(origin: string): Promise<RobotsRules> {
  try {
    const robotsUrl = new URL('/robots.txt', origin).toString();
    const res = await safeFetchPublic(robotsUrl, 6000);
    if (!res.ok) {
      return { found: false, disallowedPaths: [], allowedPaths: [], crawlDelayMs: 150 };
    }
    const text = await res.text();
    const lines = text.split(/\r?\n/);

    let activeForUs = false;
    const disallowedPaths: string[] = [];
    const allowedPaths: string[] = [];
    let crawlDelayMs = 200;

    for (const rawLine of lines) {
      const line = rawLine.split('#')[0].trim();
      if (!line) continue;
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) continue;
      const directive = line.slice(0, colonIdx).trim().toLowerCase();
      const value = line.slice(colonIdx + 1).trim();

      if (directive === 'user-agent') {
        const ua = value.toLowerCase();
        activeForUs = ua === '*' || ua.includes('aicontentintelligence');
      } else if (activeForUs && directive === 'disallow' && value) {
        disallowedPaths.push(value);
      } else if (activeForUs && directive === 'allow' && value) {
        allowedPaths.push(value);
      } else if (activeForUs && directive === 'crawl-delay') {
        const sec = Number(value);
        if (Number.isFinite(sec) && sec >= 0 && sec <= 5) {
          crawlDelayMs = Math.max(150, sec * 1000);
        }
      }
    }

    return {
      found: true,
      disallowedPaths,
      allowedPaths,
      crawlDelayMs,
    };
  } catch {
    return { found: false, disallowedPaths: [], allowedPaths: [], crawlDelayMs: 150 };
  }
}

function isAllowedByRobots(targetUrl: URL, rules: RobotsRules): boolean {
  const pathWithQuery = `${targetUrl.pathname}${targetUrl.search}`;
  let longestAllow = -1;
  for (const allow of rules.allowedPaths) {
    if (pathWithQuery.startsWith(allow)) {
      longestAllow = Math.max(longestAllow, allow.length);
    }
  }
  let longestDisallow = -1;
  for (const disallow of rules.disallowedPaths) {
    if (disallow === '/') {
      longestDisallow = Math.max(longestDisallow, 1);
    } else if (pathWithQuery.startsWith(disallow)) {
      longestDisallow = Math.max(longestDisallow, disallow.length);
    }
  }
  if (longestDisallow === -1) return true;
  return longestAllow >= longestDisallow;
}

function extractMainPageContent(html: string, pageUrl: string): {
  title: string;
  metaDescription: string;
  headings: Array<{ level: number; text: string }>;
  paragraphs: string[];
  mainContent: string;
  internalLinks: string[];
} {
  const $ = cheerio.load(html);
  const title = $('title').first().text().replace(/\s+/g, ' ').trim();
  const metaDescription =
    $('meta[name="description"]').attr('content')?.replace(/\s+/g, ' ').trim() ||
    $('meta[property="og:description"]').attr('content')?.replace(/\s+/g, ' ').trim() ||
    '';

  const baseUrl = new URL(pageUrl);
  const discoveredLinks = new Set<string>();
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href')?.trim();
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) {
      return;
    }
    try {
      const resolved = new URL(href, baseUrl);
      if (resolved.hostname === baseUrl.hostname && ['http:', 'https:'].includes(resolved.protocol)) {
        resolved.hash = '';
        // Skip binary/asset links
        if (!/\.(pdf|jpg|jpeg|png|gif|svg|webp|zip|css|js|xml|json)$/i.test(resolved.pathname)) {
          discoveredLinks.add(resolved.toString());
        }
      }
    } catch {
      // Ignore malformed link
    }
  });

  // Remove boilerplate, navigation, cookie notices, footers, scripts, and modals
  $(
    'script, style, noscript, iframe, svg, nav, footer, header, aside, form[role="search"], ' +
      '[role="navigation"], [role="banner"], [role="contentinfo"], ' +
      '.cookie, .cookie-banner, .cookie-notice, #cookie-banner, #onetrust-banner-sdk, ' +
      '.consent, .gdpr, .navbar, .nav, .footer, .site-footer, .site-header, .sidebar, .breadcrumb'
  ).remove();

  // Prefer <main> or <article> when substantial content exists inside it
  let rootContainer = $('main').first();
  if (!rootContainer.length || rootContainer.text().trim().length < 180) {
    const articleEl = $('article').first();
    if (articleEl.length && articleEl.text().trim().length >= 180) {
      rootContainer = articleEl;
    } else {
      rootContainer = $('body');
    }
  }

  const headings: Array<{ level: number; text: string }> = [];
  rootContainer.find('h1, h2, h3, h4').each((_, el) => {
    const tag = el.tagName.toLowerCase();
    const level = Number(tag.slice(1));
    const text = $(el).text().replace(/\s+/g, ' ').trim();
    if (text && text.length > 1) {
      headings.push({ level, text });
    }
  });

  const paragraphs: string[] = [];
  const seenParagraphs = new Set<string>();

  rootContainer.find('p, li, blockquote').each((_, el) => {
    const text = $(el).text().replace(/\s+/g, ' ').trim();
    if (!text || text.length < 25) return;
    // Filter common leftover boilerplate sentences
    if (/^(accept all|cookie policy|privacy policy|all rights reserved|subscribe to our newsletter)/i.test(text)) {
      return;
    }
    const normalizedKey = text.toLowerCase();
    if (!seenParagraphs.has(normalizedKey)) {
      seenParagraphs.add(normalizedKey);
      paragraphs.push(text);
    }
  });

  const mainLines: string[] = [];
  rootContainer.find('h1, h2, h3, h4, p, li, blockquote').each((_, el) => {
    const tag = el.tagName.toLowerCase();
    const text = $(el).text().replace(/\s+/g, ' ').trim();
    if (!text) return;
    if (tag === 'h1') mainLines.push(`# ${text}`);
    else if (tag === 'h2') mainLines.push(`## ${text}`);
    else if (tag === 'h3') mainLines.push(`### ${text}`);
    else if (tag === 'h4') mainLines.push(`#### ${text}`);
    else if (text.length >= 20) {
      if (tag === 'li') mainLines.push(`- ${text}`);
      else mainLines.push(text);
    }
  });

  return {
    title,
    metaDescription,
    headings,
    paragraphs,
    mainContent: mainLines.join('\n\n'),
    internalLinks: Array.from(discoveredLinks),
  };
}

export async function crawlWebsiteContent(options: {
  rootUrl: string;
  crawlMode: CrawlMode;
  selectedUrls?: string[];
  maxPages?: number;
  maxDepth?: number;
}): Promise<Omit<WebsiteAuditReport, 'siteEditorialSummary' | 'tokenUsage'>> {
  const validatedRoot = await validatePublicUrl(options.rootUrl);
  const maxAllowedPages = Math.min(
    Number(process.env.CONTENT_MAX_CRAWL_PAGES || 15),
    Math.max(1, options.maxPages ?? (options.crawlMode === 'single_page' ? 1 : 6))
  );
  const maxDepth = Math.min(3, Math.max(0, options.maxDepth ?? 2));

  const robots = await fetchRobotsTxt(validatedRoot.origin);
  const robotsAllowedRoot = isAllowedByRobots(validatedRoot, robots);
  const robotsBlockedUrls: string[] = [];

  if (!robotsAllowedRoot) {
    throw new Error(
      `Crawling ${validatedRoot.toString()} is disallowed by the site's robots.txt policy.`
    );
  }

  const queue: Array<{ url: string; depth: number }> = [];
  const visited = new Set<string>();

  if (options.crawlMode === 'selected_pages' && options.selectedUrls?.length) {
    for (const candidate of options.selectedUrls.slice(0, maxAllowedPages)) {
      try {
        const parsed = await validatePublicUrl(candidate);
        if (parsed.hostname === validatedRoot.hostname) {
          queue.push({ url: parsed.toString(), depth: 0 });
        }
      } catch {
        // Skip invalid selected URL
      }
    }
    if (queue.length === 0) {
      queue.push({ url: validatedRoot.toString(), depth: 0 });
    }
  } else {
    queue.push({ url: validatedRoot.toString(), depth: 0 });
  }

  const rawPages: Array<{
    url: string;
    statusCode: number;
    title: string;
    metaDescription: string;
    headings: Array<{ level: number; text: string }>;
    paragraphs: string[];
    mainContent: string;
  }> = [];

  let discoveredCount = queue.length;

  while (queue.length > 0 && rawPages.length < maxAllowedPages) {
    const next = queue.shift()!;
    if (visited.has(next.url)) continue;
    visited.add(next.url);

    const parsedNext = new URL(next.url);
    if (!isAllowedByRobots(parsedNext, robots)) {
      robotsBlockedUrls.push(next.url);
      continue;
    }

    contentUsageMonitor.recordCrawlRequest();

    try {
      const response = await safeFetchPublic(next.url, 12000);
      const contentType = response.headers.get('content-type') || '';
      if (!response.ok || !contentType.includes('text/html')) {
        continue;
      }

      const html = await response.text();
      const extracted = extractMainPageContent(html, response.url || next.url);

      rawPages.push({
        url: response.url || next.url,
        statusCode: response.status,
        title: extracted.title || 'Untitled Page',
        metaDescription: extracted.metaDescription,
        headings: extracted.headings,
        paragraphs: extracted.paragraphs,
        mainContent: extracted.mainContent,
      });

      if (options.crawlMode === 'site_crawl' && next.depth < maxDepth) {
        for (const link of extracted.internalLinks) {
          if (!visited.has(link) && !queue.some((q) => q.url === link)) {
            discoveredCount += 1;
            queue.push({ url: link, depth: next.depth + 1 });
          }
        }
      }

      if (queue.length > 0 && rawPages.length < maxAllowedPages) {
        await new Promise((r) => setTimeout(r, Math.min(400, robots.crawlDelayMs)));
      }
    } catch {
      // Skip unreachable page while continuing crawl
    }
  }

  if (rawPages.length === 0) {
    throw new Error(
      'No readable HTML pages could be extracted from the target URL. The site may block automated requests or require JavaScript rendering.'
    );
  }

  // Analyze individual pages and cross-page similarity
  const pages: CrawledPageExtract[] = rawPages.map((page, idx) => {
    const metrics = analyzeObjectiveMetrics(page.mainContent, '', [], page.headings);

    let maxSim = 0;
    let matchedUrl: string | null = null;
    for (let j = 0; j < rawPages.length; j++) {
      if (idx === j) continue;
      const sim = computeTextSimilarityPercent(page.mainContent, rawPages[j].mainContent);
      if (sim > maxSim) {
        maxSim = sim;
        matchedUrl = rawPages[j].url;
      }
    }

    const issues: string[] = [];
    const recommendations: string[] = [];

    if (metrics.wordCount < 200) {
      issues.push(`Thin main content (${metrics.wordCount} words).`);
      recommendations.push('Add concrete specifics, product/service proof points, or workflow steps.');
    }
    if (!page.metaDescription || page.metaDescription.length < 50) {
      issues.push('Missing or overly short meta description.');
      recommendations.push('Write a page-specific 135–155 character meta description summarizing unique value.');
    }
    if (!page.headings.some((h) => h.level === 1)) {
      issues.push('No H1 heading detected in main content.');
      recommendations.push('Add a clear primary H1 aligned with the page topic.');
    }
    if (metrics.clicheMatches.length > 0) {
      issues.push(
        `Contains ${metrics.clicheMatches.length} overused AI-like expression(s): ${metrics.clicheMatches
          .slice(0, 3)
          .map((c) => `"${c.phrase}"`)
          .join(', ')}.`
      );
      recommendations.push('Replace generic phrases with concrete customer outcomes or domain evidence.');
    }
    if (maxSim >= 40 && matchedUrl) {
      issues.push(`Shares ${maxSim}% shingle similarity with ${matchedUrl}.`);
      recommendations.push('Differentiate page copy so each URL serves a distinct search intent and angle.');
    }

    return {
      url: page.url,
      statusCode: page.statusCode,
      title: page.title,
      metaDescription: page.metaDescription,
      headings: page.headings,
      paragraphs: page.paragraphs,
      mainContent: page.mainContent,
      wordCount: metrics.wordCount,
      readingTimeMinutes: metrics.estimatedReadingTimeMinutes,
      objectiveMetrics: metrics,
      duplicateSimilarityPercent: maxSim,
      matchedDuplicateUrl: maxSim >= 25 ? matchedUrl : null,
      issues,
      recommendations,
    };
  });

  // Cross-page findings
  const crossPageFindings: CrossPageFinding[] = [];

  // 1. Near-duplicate pages
  const highDupPages = pages.filter((p) => p.duplicateSimilarityPercent >= 40);
  if (highDupPages.length > 0) {
    crossPageFindings.push({
      id: 'cpf-duplicate',
      category: 'Duplicate or Near-Duplicate Content',
      severity: 'High',
      affectedUrls: highDupPages.map((p) => p.url),
      summary: `${highDupPages.length} page(s) share 40%+ overlapping phrasing with other crawled pages.`,
      recommendation: 'Rewrite overlapping sections with page-specific case examples, specs, or audience framing.',
    });
  }

  // 2. Repetitive introductions (opening paragraph overlap)
  const introBuckets = new Map<string, string[]>();
  for (const p of pages) {
    const firstPara = (p.paragraphs[0] ?? '').toLowerCase().slice(0, 60).trim();
    if (firstPara.length > 20) {
      const list = introBuckets.get(firstPara) ?? [];
      list.push(p.url);
      introBuckets.set(firstPara, list);
    }
  }
  const repeatedIntros = Array.from(introBuckets.values()).filter((urls) => urls.length > 1);
  if (repeatedIntros.length > 0) {
    crossPageFindings.push({
      id: 'cpf-intros',
      category: 'Repetitive Page Introductions',
      severity: 'Medium',
      affectedUrls: repeatedIntros.flat(),
      summary: 'Multiple pages open with nearly identical introductory sentences.',
      recommendation: 'Tailor each opening paragraph to the specific problem or product covered on that URL.',
    });
  }

  // 3. Generic or missing meta descriptions
  const weakMetaPages = pages.filter(
    (p) => !p.metaDescription || p.metaDescription.length < 55
  );
  if (weakMetaPages.length > 0) {
    crossPageFindings.push({
      id: 'cpf-meta',
      category: 'Generic Meta Descriptions',
      severity: 'Medium',
      affectedUrls: weakMetaPages.map((p) => p.url),
      summary: `${weakMetaPages.length} crawled page(s) lack a descriptive meta summary.`,
      recommendation: 'Author distinct 135–155 character meta descriptions highlighting concrete deliverables.',
    });
  }

  // 4. Thin / low-specificity pages
  const thinPages = pages.filter((p) => p.wordCount < 220 || p.objectiveMetrics.clicheMatches.length >= 2);
  if (thinPages.length > 0) {
    crossPageFindings.push({
      id: 'cpf-thin',
      category: 'Low Specificity / Thin Depth',
      severity: thinPages.some((p) => p.wordCount < 120) ? 'High' : 'Medium',
      affectedUrls: thinPages.map((p) => p.url),
      summary: `${thinPages.length} page(s) have thin body copy or rely on generic buzzwords instead of concrete proof.`,
      recommendation: 'Expand weak service or feature pages with pricing clarity, process steps, or real examples.',
    });
  }

  return {
    auditId: `audit_${Date.now().toString(36)}`,
    rootUrl: validatedRoot.toString(),
    crawlMode: options.crawlMode,
    auditedAt: new Date().toISOString(),
    robotsTxtChecked: true,
    robotsTxtFound: robots.found,
    robotsAllowedRoot,
    robotsBlockedUrls,
    crawlLimits: {
      maxPages: maxAllowedPages,
      maxDepth,
      pagesDiscovered: discoveredCount,
      pagesAnalyzed: pages.length,
    },
    pages,
    crossPageFindings,
  };
}
