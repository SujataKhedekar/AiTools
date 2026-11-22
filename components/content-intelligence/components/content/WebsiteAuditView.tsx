import React, { useState } from 'react';
import { ArrowRight, Globe, Loader2, ShieldCheck } from 'lucide-react';
import { crawlWebsiteAuditApi } from '../../lib/api/contentClient';
import type {
  CrawledPageExtract,
  CrawlMode,
  WebsiteAuditReport,
} from '../../types/contentIntelligence';

interface WebsiteAuditViewProps {
  onLoadPageIntoWorkbench: (page: CrawledPageExtract) => void;
  auditReport: WebsiteAuditReport | null;
  onChangeAuditReport: (report: WebsiteAuditReport) => void;
}

export const WebsiteAuditView: React.FC<WebsiteAuditViewProps> = ({
  onLoadPageIntoWorkbench,
  auditReport,
  onChangeAuditReport,
}) => {
  const [url, setUrl] = useState(auditReport?.rootUrl ?? '');
  const [crawlMode, setCrawlMode] = useState<CrawlMode>('single_page');
  const [selectedUrlsRaw, setSelectedUrlsRaw] = useState('');
  const [maxPages, setMaxPages] = useState(5);
  const [maxDepth, setMaxDepth] = useState(2);
  const [isCrawling, setIsCrawling] = useState(false);
  const [crawlError, setCrawlError] = useState<string | null>(null);
  const [expandedPageUrl, setExpandedPageUrl] = useState<string | null>(null);

  const handleRunCrawl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setCrawlError(null);
    setIsCrawling(true);
    try {
      const selectedUrls =
        crawlMode === 'selected_pages'
          ? selectedUrlsRaw
              .split(/\r?\n|,/)
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined;

      const report = await crawlWebsiteAuditApi({
        url: url.trim(),
        crawlMode,
        selectedUrls,
        maxPages: crawlMode === 'single_page' ? 1 : maxPages,
        maxDepth,
      });
      onChangeAuditReport(report);
      setExpandedPageUrl(report.pages[0]?.url ?? null);
    } catch (err) {
      setCrawlError(err instanceof Error ? err.message : 'Website crawl failed.');
    } finally {
      setIsCrawling(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Crawl Configuration Form */}
      <form
        onSubmit={handleRunCrawl}
        className="bg-white border border-slate-200 rounded-xl p-5 space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-slate-700" />
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Website URL Content Audit
              </h2>
              <p className="text-xs text-slate-500">
                Extracts visible main article/page copy while stripping nav, cookie banners, and footers.
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 text-xs text-slate-600">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            Respects robots.txt &amp; public URL safety checks
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-6">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Target Website or Page URL
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/blog/guide"
              className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:border-slate-400"
            />
          </div>

          <div className="lg:col-span-3">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Crawl Scope
            </label>
            <select
              value={crawlMode}
              onChange={(e) => setCrawlMode(e.target.value as CrawlMode)}
              className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-900"
            >
              <option value="single_page">Analyze Specific Page</option>
              <option value="selected_pages">Analyze Selected Pages</option>
              <option value="site_crawl">Crawl Site Within Limits</option>
            </select>
          </div>

          <div className="lg:col-span-3 flex items-end gap-2">
            {crawlMode !== 'single_page' && (
              <>
                <div className="w-20">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Max Pages
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={maxPages}
                    onChange={(e) => setMaxPages(Number(e.target.value) || 5)}
                    className="w-full h-10 rounded-lg border border-slate-200 px-2.5 text-xs font-mono tabular-nums"
                  />
                </div>
                {crawlMode === 'site_crawl' && (
                  <div className="w-20">
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Depth
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={3}
                      value={maxDepth}
                      onChange={(e) => setMaxDepth(Number(e.target.value) || 1)}
                      className="w-full h-10 rounded-lg border border-slate-200 px-2.5 text-xs font-mono tabular-nums"
                    />
                  </div>
                )}
              </>
            )}

            <button
              type="submit"
              disabled={isCrawling || !url.trim()}
              className="h-10 px-4 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 inline-flex items-center gap-2 whitespace-nowrap shrink-0 ml-auto"
            >
              {isCrawling && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isCrawling ? 'Auditing Site...' : 'Run Site Audit'}
            </button>
          </div>
        </div>

        {crawlMode === 'selected_pages' && (
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Selected Page URLs (one per line, same domain as target URL)
            </label>
            <textarea
              rows={3}
              value={selectedUrlsRaw}
              onChange={(e) => setSelectedUrlsRaw(e.target.value)}
              placeholder={'https://example.com/\nhttps://example.com/services\nhttps://example.com/about'}
              className="w-full rounded-lg border border-slate-200 p-2.5 text-xs font-mono text-slate-900"
            />
          </div>
        )}

        {crawlError && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
            {crawlError}
          </div>
        )}
      </form>

      {/* Audit Results */}
      {auditReport && (
        <div className="space-y-5">
          {/* Summary Strip */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Website Content Audit Report · {auditReport.rootUrl}
                </h3>
                <p className="text-xs text-slate-500 font-mono tabular-nums">
                  {auditReport.crawlLimits.pagesAnalyzed} pages analyzed ·{' '}
                  {auditReport.crawlLimits.pagesDiscovered} discovered · robots.txt{' '}
                  {auditReport.robotsTxtFound ? 'verified' : 'not present (allowed)'}
                  {auditReport.robotsBlockedUrls.length > 0
                    ? ` · ${auditReport.robotsBlockedUrls.length} skipped by robots.txt`
                    : ''}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              {auditReport.siteEditorialSummary}
            </p>

            {/* Cross-page findings */}
            {auditReport.crossPageFindings.length > 0 && (
              <div className="pt-2 space-y-2">
                <div className="text-xs font-semibold text-slate-800">
                  Cross-Page Findings
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {auditReport.crossPageFindings.map((finding) => (
                    <div
                      key={finding.id}
                      className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-slate-900">
                          {finding.category}
                        </span>
                        <span
                          className={
                            finding.severity === 'High'
                              ? 'text-red-700 font-medium'
                              : 'text-amber-700 font-medium'
                          }
                        >
                          {finding.severity} priority
                        </span>
                      </div>
                      <p className="text-slate-700">{finding.summary}</p>
                      <p className="text-slate-900 font-medium">{finding.recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Page-by-Page Extracted Table & Inspector */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/70">
              <h3 className="text-sm font-semibold text-slate-900">
                Extracted Pages ({auditReport.pages.length})
              </h3>
            </div>

            <div className="divide-y divide-slate-200">
              {auditReport.pages.map((page) => {
                const isExpanded = expandedPageUrl === page.url;
                return (
                  <div key={page.url} className="p-5 space-y-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="text-sm font-semibold text-slate-900 truncate">
                          {page.title}
                        </div>
                        <div className="text-xs font-mono text-slate-500 truncate">
                          {page.url}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 font-mono tabular-nums">
                          <span>{page.wordCount} words</span>
                          <span aria-hidden="true">·</span>
                          <span>{page.headings.length} headings</span>
                          <span aria-hidden="true">·</span>
                          <span>{page.paragraphs.length} paragraphs</span>
                          <span aria-hidden="true">·</span>
                          <span>Flesch {page.objectiveMetrics.fleschReadingEase}</span>
                          {page.duplicateSimilarityPercent >= 25 && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-amber-700">
                                {page.duplicateSimilarityPercent}% overlap
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedPageUrl(isExpanded ? null : page.url)
                          }
                          className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 whitespace-nowrap"
                        >
                          {isExpanded ? 'Hide Details' : 'View Extracted Copy'}
                        </button>
                        <button
                          type="button"
                          onClick={() => onLoadPageIntoWorkbench(page)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 whitespace-nowrap"
                        >
                          Analyze &amp; Rewrite
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {(page.issues.length > 0 || page.recommendations.length > 0) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                        {page.issues.length > 0 && (
                          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                            <div className="font-semibold text-slate-800 mb-1">
                              Detected Page Issues
                            </div>
                            <ul className="list-disc pl-4 space-y-1 text-slate-700">
                              {page.issues.map((iss, idx) => (
                                <li key={idx}>{iss}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {page.recommendations.length > 0 && (
                          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                            <div className="font-semibold text-slate-800 mb-1">
                              Page Recommendations
                            </div>
                            <ul className="list-disc pl-4 space-y-1 text-slate-700">
                              {page.recommendations.map((rec, idx) => (
                                <li key={idx}>{rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {isExpanded && (
                      <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3 text-xs">
                        <div>
                          <span className="font-semibold text-slate-800">Meta Description: </span>
                          <span className="text-slate-700">
                            {page.metaDescription || 'None detected'}
                          </span>
                        </div>
                        {page.headings.length > 0 && (
                          <div>
                            <div className="font-semibold text-slate-800 mb-1">
                              Heading Hierarchy
                            </div>
                            <div className="space-y-0.5 font-mono text-slate-700">
                              {page.headings.slice(0, 12).map((h, i) => (
                                <div key={i}>
                                  H{h.level}: {h.text}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-slate-800 mb-1">
                            Extracted Main Content Preview
                          </div>
                          <div className="max-h-60 overflow-y-auto whitespace-pre-wrap text-slate-800 leading-relaxed bg-white p-3 rounded border border-slate-200">
                            {page.mainContent}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
