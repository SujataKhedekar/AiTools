"use client";

import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  ExternalLink,
  Info,
  Loader2,
  SearchCheck,
  Check,
} from "lucide-react";
import { jsPDF } from "jspdf";
import type { SeoCheck, SeoReport, TaskStatus } from "@/lib/seoReport";

const STATUS_STYLES = {
  good: {
    label: "Good",
    icon: CheckCircle2,
    color: "text-emerald-700",
    background: "bg-emerald-50",
  },
  warning: {
    label: "Improve",
    icon: AlertCircle,
    color: "text-amber-700",
    background: "bg-amber-50",
  },
  issue: {
    label: "Issue",
    icon: AlertCircle,
    color: "text-rose-700",
    background: "bg-rose-50",
  },
  info: {
    label: "Info",
    icon: Info,
    color: "text-slate-600",
    background: "bg-slate-50",
  },
} satisfies Record<
  SeoCheck["status"],
  { label: string; icon: typeof Info; color: string; background: string }
>;

const CHECK_DEFINITIONS: Record<string, string> = {
  "Page response": "Whether the page is reachable and returns a successful HTTP status.",
  "Meta title": "The title shown in browser tabs and often used as the clickable search result headline.",
  "Meta description": "A short page summary that search engines may show below the result title.",
  "Robots directives": "Page-level instructions that can tell search engines whether to index or follow this page.",
  "Open Graph tags": "Title, description, and image metadata used to create social sharing previews.",
  "Canonical URL": "The preferred URL for this content, used to consolidate duplicate or similar page versions.",
  "Heading structure": "The page’s H1, H2, and H3 outline, which helps readers and crawlers understand its topics.",
  "Image alt text": "Text alternatives that describe images for screen readers and when images cannot load.",
  "Internal links": "Links to other pages on the same website that help visitors and crawlers discover content.",
  "Broken links": "Checks a bounded sample of links and reports destinations that returned an HTTP error.",
  "Main content length": "Counts words in the main content area only; short pages may need more context, but there is no universal word-count target.",
  "HTTPS encryption": "Confirms whether the final page URL is served over an encrypted HTTPS connection.",
  "Mobile viewport": "Checks whether the page tells mobile browsers to size the layout to the device width.",
  "Document language": "Checks whether the root HTML element identifies the document language.",
  "PageSpeed mobile": "Google Lighthouse performance score and metrics measured with its mobile strategy.",
  Sitemap: "An XML list of pages that helps search engines discover URLs. The draft here only uses links found on the submitted page.",
  "Robots.txt": "A site-root file that gives crawlers crawl guidance and may point them to a sitemap.",
  "Schema validator (JSON-LD syntax)": "Checks whether JSON-LD structured data blocks contain valid JSON; it does not verify every Schema.org rule.",
};

function escapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export default function SeoReportRunner() {
  const [url, setUrl] = useState("");
  const [report, setReport] = useState<SeoReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedSitemap, setCopiedSitemap] = useState(false);
  const [altDrafts, setAltDrafts] = useState<Record<number, string>>({});
  const [copiedAltId, setCopiedAltId] = useState<number | null>(null);
  const [actionStatuses, setActionStatuses] = useState<Record<string, TaskStatus>>({});

  async function scan() {
    setError("");
    setReport(null);
    setLoading(true);
    try {
      const response = await fetch("/api/seo-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "The page could not be scanned.");
        return;
      }
      const nextReport = data as SeoReport;
      setReport(nextReport);
      setAltDrafts(
        Object.fromEntries(
          nextReport.imageAltSuggestions.map((item) => [item.id, item.suggestion]),
        ),
      );
      setActionStatuses(
        Object.fromEntries(nextReport.actions.map((action) => [action.id, "pending"])),
      );
    } catch {
      setError("Could not reach the SEO report service. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function copySitemap() {
    if (!report) return;
    try {
      await navigator.clipboard.writeText(report.generatedSitemap);
      setCopiedSitemap(true);
      window.setTimeout(() => setCopiedSitemap(false), 1500);
    } catch {
      setError("Could not copy the sitemap. Select and copy the XML preview instead.");
    }
  }

  async function copyAltText(id: number) {
    try {
      await navigator.clipboard.writeText(altDrafts[id] ?? "");
      setCopiedAltId(id);
      window.setTimeout(() => setCopiedAltId(null), 1500);
    } catch {
      setError("Could not copy the alt text. Select and copy the text instead.");
    }
  }

  function downloadCsv() {
    if (!report) return;
    const findings = report.checks.filter(
      (item) => item.status === "issue" || item.status === "warning",
    );
    const rows = [
      ["Issue", "Category", "Priority", "Affected URL", "What is wrong", "Why it matters", "Recommended fix", "Code example", "Effort", "Status"],
      ...findings.map((item) => [
        item.title,
        item.category,
        item.priority ?? "Low",
        item.affectedUrls?.join("; ") || report.url,
        item.detail,
        item.whyItMatters ?? "",
        item.recommendation ?? "",
        item.codeExample ?? "",
        item.effort ?? "",
        actionStatuses[item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")] ?? "pending",
      ]),
    ];
    const csv = rows
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      )
      .join("\r\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "seo-audit-issues.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  async function downloadExcel() {
    if (!report) return;
    try {
      const response = await fetch("/api/seo-report/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report, actionStatuses, altDrafts }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error || "Could not generate the Excel report.");
        return;
      }
      const blob = await response.blob();
      const href = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = href;
      link.download = "seo-audit-report.xlsx";
      link.click();
      URL.revokeObjectURL(href);
    } catch {
      setError("Could not generate the Excel report. Please try again.");
    }
  }

  function downloadPdf() {
    if (!report) return;
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 16;
    let y = margin;
    const addText = (text: string, size = 10, bold = false) => {
      pdf.setFont("helvetica", bold ? "bold" : "normal");
      pdf.setFontSize(size);
      const lines = pdf.splitTextToSize(text, pageWidth - margin * 2);
      const height = lines.length * (size * 0.45) + 2;
      if (y + height > pageHeight - margin) {
        pdf.addPage();
        y = margin;
      }
      pdf.text(lines, margin, y);
      y += height;
    };

    addText("SEO Audit Report", 20, true);
    addText(report.url, 9);
    addText(`Scanned ${new Date(report.scannedAt).toLocaleString()}`);
    addText(`Overall SEO score: ${report.score}/100`, 14, true);
    Object.entries(report.categoryScores).forEach(([category, score]) => {
      addText(`${category}: ${score === null ? "Not available" : `${score}/100`}`);
    });
    addText(
      `Issues: ${report.actions.length} · Fixed: ${Object.values(actionStatuses).filter((status) => status === "fixed").length} · Pending: ${Object.values(actionStatuses).filter((status) => status !== "fixed").length}`,
    );
    y += 3;
    addText("Findings and recommendations", 14, true);
    report.checks
      .filter((item) => item.status !== "good" && item.status !== "info")
      .forEach((item) => {
        addText(`${item.priority ?? "Low"} priority · ${item.title} (${item.category})`, 11, true);
        addText(`What is wrong: ${item.detail}`);
        if (item.whyItMatters) addText(`Why it matters: ${item.whyItMatters}`);
        if (item.recommendation) addText(`Recommended fix: ${item.recommendation}`);
        if (item.affectedUrls?.length) addText(`Affected URLs: ${item.affectedUrls.join(", ")}`);
        if (item.codeExample) addText(`Example:\n${item.codeExample}`);
        addText(`Estimated effort: ${item.effort ?? "Not estimated"}`);
        y += 2;
      });
    addText("PageSpeed", 14, true);
    report.pageSpeed.forEach((item) => {
      addText(
        `${item.strategy}: Performance ${item.scores.performance === null ? "unavailable" : `${item.scores.performance}/100`}; SEO ${item.scores.seo === null ? "unavailable" : `${item.scores.seo}/100`}.`,
      );
      item.opportunities.forEach((opportunity) =>
        addText(`- ${opportunity.title}${opportunity.savingsMs === null ? "" : ` (est. ${opportunity.savingsMs} ms savings)`}: ${opportunity.description}`),
      );
    });
    pdf.save("seo-audit-report.pdf");
  }

  return (
    <div className="space-y-6">
      <form
        className="card p-5 sm:p-6"
        onSubmit={(event) => {
          event.preventDefault();
          void scan();
        }}
      >
        <label
          htmlFor="seo-page-url"
          className="mb-2 block text-sm font-medium text-[var(--ink)]"
        >
          Website page URL
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id="seo-page-url"
            type="url"
            inputMode="url"
            autoComplete="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://example.com/page"
            required
            maxLength={2048}
            className="field min-w-0 flex-1 px-4 py-3 text-sm"
          />
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="btn-ink inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Scanning page…
              </>
            ) : (
              <>
                <SearchCheck className="h-4 w-4" />
                Generate SEO report
              </>
            )}
          </button>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-[var(--faint)]">
          Scans the page’s public HTML and checks its metadata, headings,
          images, links, sitemap, robots.txt, and JSON-LD.
        </p>
        {error && (
          <p
            role="alert"
            className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-100"
          >
            {error}
          </p>
        )}
      </form>

      {report ? (
        <section aria-live="polite" className="space-y-5">
          <div className="card flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
            <div>
              <p className="eyebrow mb-1">Download this audit</p>
              <p className="text-sm text-[var(--muted)]">
                Export the findings, affected URLs, and current action statuses.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={downloadPdf} className="rounded-lg border border-[var(--border-strong)] px-3 py-2 text-xs font-medium text-[var(--ink)] hover:bg-black/[0.03]">
                Download PDF
              </button>
              <button onClick={downloadExcel} className="rounded-lg border border-[var(--border-strong)] px-3 py-2 text-xs font-medium text-[var(--ink)] hover:bg-black/[0.03]">
                Download Excel
              </button>
              <button onClick={downloadCsv} className="rounded-lg border border-[var(--border-strong)] px-3 py-2 text-xs font-medium text-[var(--ink)] hover:bg-black/[0.03]">
                Download CSV
              </button>
            </div>
          </div>

          <div className="card p-5 sm:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full border-[6px] border-[var(--accent)]/15">
                <span className="text-2xl font-semibold text-[var(--accent)]">
                  {report.score}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="eyebrow mb-1">Overall SEO score</p>
                <h2 className="truncate text-lg font-semibold text-[var(--ink)]">
                  {report.title}
                </h2>
                <a
                  href={report.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex max-w-full items-center gap-1 truncate text-sm text-[var(--accent)] hover:underline"
                >
                  <span className="truncate">{report.url}</span>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                </a>
                <p className="mt-1 text-xs text-[var(--faint)]">
                  HTTP {report.pageStatus} · Scanned{" "}
                  {new Date(report.scannedAt).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {Object.entries(report.categoryScores).map(([category, score]) => (
                <div key={category} className="rounded-xl bg-[var(--paper)] p-3">
                  <p className="text-xs text-[var(--muted)]">{category}</p>
                  <p className="mt-1 text-lg font-semibold text-[var(--ink)]">
                    {score === null ? "N/A" : `${score}/100`}
                  </p>
                  {category === "Performance" && score === null && (
                    <p className="text-[10px] text-[var(--faint)]">PageSpeed unavailable</p>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-[var(--muted)]">
              <span>Total issues: <strong>{report.actions.length}</strong></span>
              <span>Fixed: <strong>{Object.values(actionStatuses).filter((status) => status === "fixed").length}</strong></span>
              <span>Pending: <strong>{report.actions.length - Object.values(actionStatuses).filter((status) => status === "fixed").length}</strong></span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-[var(--faint)]">
              Scores use the checks and PageSpeed data available for this scan. Unavailable PageSpeed results are shown as N/A, not estimated.
            </p>
          </div>

          <section className="card p-5 sm:p-6">
            <p className="eyebrow mb-1">Action plan</p>
            <h2 className="text-lg font-semibold text-[var(--ink)]">
              What to improve
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">
              Prioritized findings with fixes based on this scan. Mark a task fixed as you complete it.
            </p>
            {report.actions.length ? (
              <div className="mt-4 space-y-3">
                {report.actions.map((action, index) => {
                  const fixed = actionStatuses[action.id] === "fixed";
                  return (
                    <article key={action.id} className="rounded-xl bg-[var(--paper)] p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white text-xs font-semibold text-[var(--muted)] ring-1 ring-[var(--border)]">
                            {index + 1}
                          </span>
                          <div className="min-w-0">
                            <h3 className={`text-sm font-semibold ${fixed ? "text-[var(--muted)] line-through" : "text-[var(--ink)]"}`}>
                              {action.issue}
                            </h3>
                            <p className="mt-1 whitespace-pre-line break-all text-xs text-[var(--faint)]">
                              Affected URL: {action.affectedUrl}
                            </p>
                            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                              <strong>What is wrong: </strong>{action.whatIsWrong}
                            </p>
                            <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">
                              <strong>Why it matters: </strong>{action.whyItMatters}
                            </p>
                            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                              {action.recommendedFix}
                            </p>
                            <p className="mt-2 text-xs text-[var(--faint)]">
                              Priority: <strong>{action.priority}</strong> · Effort: <strong>{action.effort}</strong>
                            </p>
                            {action.codeExample && (
                              <pre className="mt-2 overflow-auto rounded-lg bg-white p-3 text-xs text-[var(--ink)]">
                                {action.codeExample}
                              </pre>
                            )}
                          </div>
                        </div>
                        <label className="inline-flex shrink-0 items-center gap-2 text-xs font-medium text-[var(--muted)]">
                          <input
                            type="checkbox"
                            checked={fixed}
                            onChange={(event) =>
                              setActionStatuses((previous) => ({
                                ...previous,
                                [action.id]: event.target.checked ? "fixed" : "pending",
                              }))
                            }
                            aria-label={`Mark ${action.issue} as fixed`}
                            className="h-4 w-4 accent-[var(--accent)]"
                          />
                          {fixed ? "Fixed" : "Pending"}
                        </label>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
                No issues were flagged by the completed checks.
              </p>
            )}
          </section>

          <section className="card p-5 sm:p-6">
            <p className="eyebrow mb-1">PageSpeed Insights</p>
            <h2 className="text-lg font-semibold text-[var(--ink)]">
              Mobile performance
            </h2>
            <div className="mt-4 grid gap-3">
              {report.pageSpeed.map((result) => (
                <article key={result.strategy} className="rounded-xl bg-[var(--paper)] p-4">
                  <h3 className="text-sm font-semibold capitalize text-[var(--ink)]">{result.strategy}</h3>
                  {result.error ? (
                    <p className="mt-2 text-sm text-[var(--muted)]">{result.error}</p>
                  ) : (
                    <>
                      <p className="mt-2 text-sm text-[var(--muted)]">
                        Performance {result.scores.performance === null ? "N/A" : `${result.scores.performance}/100`} · SEO {result.scores.seo === null ? "N/A" : `${result.scores.seo}/100`}
                      </p>
                      <p className="mt-1 text-xs text-[var(--faint)]">
                        LCP {result.metrics.lcpMs === null ? "N/A" : `${result.metrics.lcpMs} ms`} · CLS {result.metrics.cls ?? "N/A"} · INP {result.metrics.inpMs === null ? "N/A" : `${result.metrics.inpMs} ms`}
                      </p>
                      {result.opportunities.length > 0 && (
                        <ul className="mt-3 space-y-2 border-t border-[var(--border)] pt-3">
                          {result.opportunities.map((item) => (
                            <li key={item.title} className="text-xs leading-relaxed text-[var(--muted)]">
                              <strong>{item.title}</strong>
                              {item.savingsMs !== null && ` · estimated ${item.savingsMs} ms savings`}
                              <p className="mt-0.5">{item.description}</p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  )}
                </article>
              ))}
            </div>
          </section>

          <div className="grid gap-3 sm:grid-cols-2">
            {report.checks.map((item) => {
              const style = STATUS_STYLES[item.status];
              const Icon = style.icon;
              return (
                <article key={item.title} className="card p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <span
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${style.background} ${style.color}`}
                    >
                      <Icon className="h-[18px] w-[18px]" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-[var(--ink)]">
                          {item.title}
                        </h3>
                        <span className={`text-xs font-medium ${style.color}`}>
                          {style.label}
                        </span>
                      </div>
                      <p className="mt-1.5 break-words text-sm leading-relaxed text-[var(--muted)]">
                        <span className="font-semibold text-[var(--ink)]">
                          Scan result:{" "}
                        </span>
                        {item.detail}
                      </p>
                      {item.priority && (
                        <p className="mt-1 text-xs font-medium text-[var(--muted)]">
                          Priority: {item.priority}
                        </p>
                      )}
                      <p className="mt-2 text-xs leading-relaxed text-[var(--faint)]">
                        <span className="font-semibold text-[var(--muted)]">
                          Definition:{" "}
                        </span>
                        {CHECK_DEFINITIONS[item.title] ??
                          "A technical check of this page’s SEO signals."}
                      </p>
                      {item.recommendation && (
                        <p className="mt-2 rounded-lg bg-[var(--paper)] px-3 py-2 text-xs leading-relaxed text-[var(--ink)]">
                          <span className="font-semibold">What to change: </span>
                          {item.recommendation}
                        </p>
                      )}
                      {item.codeExample && (
                        <div className="mt-2">
                          <p className="mb-1 text-xs font-semibold text-[var(--muted)]">
                            Example code to add:
                          </p>
                          <pre className="overflow-auto rounded-lg bg-[var(--paper)] p-3 text-xs leading-relaxed text-[var(--ink)]">
                            {item.codeExample}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          {report.imageAltSuggestions.length > 0 && (
            <section className="card p-5 sm:p-6">
              <p className="eyebrow mb-1">Accessibility &amp; image SEO</p>
              <h2 className="text-lg font-semibold text-[var(--ink)]">
                Alt text suggestions
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">
                {report.imageAltSuggestions.length} image
                {report.imageAltSuggestions.length === 1 ? " needs" : "s need"}{" "}
                an alt attribute. Review each draft against the actual image;
                filenames and captions cannot tell us exactly what a picture
                shows.
              </p>
              <div className="mt-4 space-y-4">
                {report.imageAltSuggestions.map((item, index) => (
                  <article
                    key={item.id}
                    className="rounded-xl border border-[var(--border)] p-4"
                  >
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-[var(--ink)]">
                        Image {index + 1}
                      </p>
                      <span className="text-xs text-[var(--faint)]">
                        {item.needsVisualReview
                          ? "No descriptive clue found"
                          : `Draft based on ${item.source}`}
                      </span>
                    </div>
                    {item.imageUrl && (
                      <a
                        href={item.imageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mb-3 block truncate text-xs text-[var(--accent)] hover:underline"
                      >
                        View image: {item.imageUrl}
                      </a>
                    )}
                    <label
                      htmlFor={`alt-draft-${item.id}`}
                      className="mb-1.5 block text-xs font-medium text-[var(--muted)]"
                    >
                      {item.needsVisualReview
                        ? "Write a description after viewing the image"
                        : "Suggested alt text (edit to match the image)"}
                    </label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <input
                        id={`alt-draft-${item.id}`}
                        value={altDrafts[item.id] ?? ""}
                        onChange={(event) =>
                          setAltDrafts((previous) => ({
                            ...previous,
                            [item.id]: event.target.value,
                          }))
                        }
                        placeholder="Describe the visible subject and purpose of the image"
                        maxLength={250}
                        className="field min-w-0 flex-1 px-3 py-2 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => void copyAltText(item.id)}
                        disabled={!altDrafts[item.id]?.trim()}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--border-strong)] px-3 py-2 text-xs font-medium text-[var(--muted)] transition-colors hover:bg-black/[0.03] hover:text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {copiedAltId === item.id ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-[var(--faint)]">
                      Add the reviewed description to this image’s <code>alt</code> attribute in your page template:
                    </p>
                    <pre className="mt-1 overflow-auto rounded-lg bg-[var(--paper)] p-3 text-xs leading-relaxed text-[var(--ink)]">
                      {`<img src="/path/to/image.jpg" alt="${escapeHtmlAttribute(
                        altDrafts[item.id]?.trim() ||
                          (item.needsVisualReview
                            ? "Write an accurate description after viewing the image"
                            : item.suggestion),
                      )}" />`}
                    </pre>
                  </article>
                ))}
              </div>
              {report.missingAltImageCount > report.imageAltSuggestions.length && (
                <p className="mt-3 text-xs text-[var(--faint)]">
                  Showing {report.imageAltSuggestions.length} of{" "}
                  {report.missingAltImageCount} images without alt text.
                </p>
              )}
            </section>
          )}
          <section className="card p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="eyebrow mb-1">Sitemap generator</p>
                <h3 className="text-sm font-semibold text-[var(--ink)]">
                  Draft XML sitemap
                </h3>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Built from the submitted page and up to 49 same-site links
                  found in its HTML. Review URLs before publishing.
                </p>
              </div>
              <button
                type="button"
                onClick={copySitemap}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-strong)] px-3 py-2 text-xs font-medium text-[var(--muted)] transition-colors hover:bg-black/[0.03] hover:text-[var(--ink)]"
              >
                {copiedSitemap ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" /> Copy XML
                  </>
                )}
              </button>
            </div>
            <details className="mt-4">
              <summary className="cursor-pointer text-xs font-medium text-[var(--accent)]">
                Preview XML
              </summary>
              <pre className="mt-3 max-h-72 overflow-auto rounded-xl bg-[var(--paper)] p-4 text-xs leading-relaxed text-[var(--ink)]">
                {report.generatedSitemap}
              </pre>
            </details>
          </section>
          <p className="text-xs leading-relaxed text-[var(--faint)]">
            This report checks publicly accessible page HTML and is a technical
            guide, not a guarantee of search ranking.
          </p>
        </section>
      ) : (
        <div className="card flex min-h-56 flex-col items-center justify-center p-8 text-center">
          <span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-[var(--paper)] ring-1 ring-[var(--border)]">
            <SearchCheck className="h-5 w-5 text-[var(--faint)]" />
          </span>
          <p className="text-sm text-[var(--muted)]">
            {loading
              ? "Checking the page’s SEO signals…"
              : "Enter a public page URL to generate its SEO report."}
          </p>
        </div>
      )}
    </div>
  );
}
