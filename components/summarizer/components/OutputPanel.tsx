import { useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckSquare,
  Copy,
  Download,
  FileText,
  Printer,
  RefreshCw,
  Sparkles,
  Trash2,
} from 'lucide-react';
import type { OutputFeature, SummaryFormat, SummaryResult } from '../types/summarizer';
import {
  downloadAsDocx,
  downloadAsPdf,
  downloadAsTxt,
  formatSummaryAsPlainText,
  getKeyPointsSectionHeading,
  getSummarySectionHeading,
  getVisibleSections,
} from '../utils/exportSummary';

interface OutputPanelProps {
  result: SummaryResult | null;
  format: SummaryFormat;
  feature: OutputFeature;
  isGenerating: boolean;
  error: string | null;
  onRegenerate: () => void;
  onClearOutput: () => void;
}

export function OutputPanel({
  result,
  format,
  feature,
  isGenerating,
  error,
  onRegenerate,
  onClearOutput,
}: OutputPanelProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isExportingDocx, setIsExportingDocx] = useState(false);

  const showFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => {
      setFeedbackMessage((prev) => (prev === msg ? null : prev));
    }, 2600);
  };

  const copyText = async (content: string, id: string, label: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      showFeedback(label);
      setTimeout(() => {
        setCopiedId((prev) => (prev === id ? null : prev));
      }, 2000);
    } catch {
      showFeedback('Clipboard access unavailable in this browser');
    }
  };

  const handleCopyAll = () => {
    if (!result) return;
    const text = formatSummaryAsPlainText(result, { format, feature });
    void copyText(text, 'all', 'Full summary copied to clipboard');
  };

  const handleDownloadTxt = () => {
    if (!result) return;
    const filename = downloadAsTxt(result, { format, feature });
    showFeedback(`Downloaded ${filename}`);
  };

  const handleDownloadPdf = () => {
    if (!result) return;
    const filename = downloadAsPdf(result, { format, feature });
    showFeedback(`Downloaded ${filename}`);
  };

  const handleDownloadDocx = async () => {
    if (!result || isExportingDocx) return;
    setIsExportingDocx(true);
    try {
      const filename = await downloadAsDocx(result, { format, feature });
      showFeedback(`Downloaded ${filename}`);
    } catch {
      showFeedback('Failed to generate DOCX file');
    } finally {
      setIsExportingDocx(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const vis = result ? getVisibleSections(result, { format, feature }) : null;
  const isNumbered = format === 'Numbered List' || format === 'Key Takeaways';

  return (
    <section
      id="output-panel"
      aria-labelledby="output-heading"
      className="print-only-full flex min-h-[540px] flex-col rounded-2xl border border-[#E8E4DC] bg-white p-5 shadow-[0_1px_3px_rgba(24,24,27,0.04),0_8px_24px_rgba(24,24,27,0.03)] sm:p-6"
    >
      {/* Card Header + Export Actions */}
      <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[#F1EDE4] pb-3.5">
        <div className="flex items-center gap-2.5">
          <h2
            id="output-heading"
            className="font-display text-xs font-bold tracking-[0.08em] text-[#52525B]"
          >
            OUTPUT
          </h2>
          {feedbackMessage && (
            <span
              role="status"
              className="inline-flex items-center gap-1 text-xs font-medium text-[#15803D]"
            >
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              {feedbackMessage}
            </span>
          )}
        </div>

        {result && !isGenerating && (
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={handleCopyAll}
              title="Copy full summary"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2DDD3] bg-white px-2.5 py-1.5 text-xs font-medium text-[#18181B] transition-colors hover:bg-[#FAF9F6] whitespace-nowrap shrink-0 cursor-pointer"
            >
              {copiedId === 'all' ? (
                <Check className="h-3.5 w-3.5 text-[#15803D]" aria-hidden="true" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-[#52525B]" aria-hidden="true" />
              )}
              <span>{copiedId === 'all' ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadTxt}
              title="Download as TXT"
              className="inline-flex items-center gap-1 rounded-lg border border-[#E2DDD3] bg-white px-2.5 py-1.5 text-xs font-medium text-[#3F3F46] transition-colors hover:bg-[#FAF9F6] hover:text-[#18181B] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-[#52525B]" aria-hidden="true" />
              <span>TXT</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              title="Download as PDF"
              className="inline-flex items-center gap-1 rounded-lg border border-[#E2DDD3] bg-white px-2.5 py-1.5 text-xs font-medium text-[#3F3F46] transition-colors hover:bg-[#FAF9F6] hover:text-[#18181B] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <FileText className="h-3.5 w-3.5 text-[#52525B]" aria-hidden="true" />
              <span>PDF</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadDocx}
              disabled={isExportingDocx}
              title="Download as DOCX"
              className="inline-flex items-center gap-1 rounded-lg border border-[#E2DDD3] bg-white px-2.5 py-1.5 text-xs font-medium text-[#3F3F46] transition-colors hover:bg-[#FAF9F6] hover:text-[#18181B] disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <FileText className="h-3.5 w-3.5 text-[#4F46E5]" aria-hidden="true" />
              <span>DOCX</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              title="Print summary"
              aria-label="Print summary"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2DDD3] bg-white text-[#52525B] transition-colors hover:bg-[#FAF9F6] hover:text-[#18181B] cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={onRegenerate}
              title="Regenerate summary"
              aria-label="Regenerate summary"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2DDD3] bg-white text-[#52525B] transition-colors hover:bg-[#FAF9F6] hover:text-[#18181B] cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={onClearOutput}
              title="Clear output"
              aria-label="Clear output"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2DDD3] bg-white text-[#52525B] transition-colors hover:bg-[#FEF2F2] hover:text-[#DC2626] cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Error State */}
      {error && !isGenerating && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-3 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3.5 text-sm text-[#991B1B]"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#DC2626]" aria-hidden="true" />
          <div className="space-y-1">
            <p className="font-semibold">Unable to generate summary</p>
            <p className="text-xs leading-relaxed text-[#B91C1C]">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isGenerating && (
        <div className="flex flex-1 flex-col justify-center py-8" aria-live="polite">
          <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#DDD6FE] bg-[#EEF2FF] text-[#4F46E5]">
            <Sparkles className="h-5 w-5 animate-pulse" aria-hidden="true" />
          </div>
          <p className="text-center font-display text-sm font-semibold text-[#18181B]">
            Synthesizing your summary...
          </p>
          <p className="mt-1 text-center text-xs text-[#71717A]">
            Analyzing structure, preserving exact facts, and formatting output.
          </p>
          <div className="mx-auto mt-8 w-full max-w-md space-y-3">
            <div className="h-4 w-3/4 animate-pulse rounded bg-[#F1EDE4]" />
            <div className="h-3 w-full animate-pulse rounded bg-[#F6F3EC]" />
            <div className="h-3 w-11/12 animate-pulse rounded bg-[#F6F3EC]" />
            <div className="h-3 w-4/5 animate-pulse rounded bg-[#F6F3EC]" />
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isGenerating && !result && (
        <div className="flex flex-1 flex-col items-center justify-center py-14 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#E0E7FF] bg-[#EEF2FF]/80 text-[#6366F1]">
            <Sparkles className="h-6 w-6" aria-hidden="true" />
          </div>
          <p className="font-display text-base font-semibold text-[#18181B]">
            Your result will appear here.
          </p>
          <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-[#71717A]">
            Paste text or upload a PDF, DOCX, TXT, or MD document on the left, then click Generate.
          </p>
        </div>
      )}

      {/* Populated Output */}
      {!isGenerating && result && vis && (
        <div className="space-y-6">
          {/* Heading + Clean Unboxed Metadata */}
          <div className="border-b border-[#F1EDE4] pb-4">
            <h3 className="font-display text-lg font-bold leading-snug text-[#18181B] sm:text-xl">
              {result.title}
            </h3>
            <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-xs tabular-nums text-[#71717A]">
              <span>{result.wordCount.toLocaleString()} words</span>
              <span aria-hidden="true">·</span>
              <span>{result.readingTimeMinutes} min read</span>
              <span aria-hidden="true">·</span>
              <span>{result.compressionPercent}% condensed</span>
              <span aria-hidden="true">·</span>
              <span className="font-sans">{result.detectedLanguage}</span>
            </div>
          </div>

          {/* Summary Section */}
          {vis.showSummary && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-display text-[11px] font-bold tracking-[0.08em] text-[#4F46E5]">
                  {getSummarySectionHeading(feature)}
                </h4>
                <button
                  type="button"
                  onClick={() => void copyText(result.summary, 'summary', 'Summary copied')}
                  className="no-print inline-flex items-center gap-1 text-[11px] font-medium text-[#71717A] hover:text-[#18181B] transition-colors cursor-pointer"
                >
                  {copiedId === 'summary' ? (
                    <Check className="h-3 w-3 text-[#15803D]" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  <span>{copiedId === 'summary' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="space-y-3 text-[15px] leading-[1.68] text-[#27272A]">
                {result.summary.split(/\n+/).map((para, index) => (
                  <p key={index}>{para}</p>
                ))}
              </div>
            </div>
          )}

          {/* Key Takeaways / Key Points */}
          {vis.showKeyPoints && (
            <div className="space-y-2.5 border-t border-[#F1EDE4] pt-5">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-display text-[11px] font-bold tracking-[0.08em] text-[#4F46E5]">
                  {getKeyPointsSectionHeading(format)}
                </h4>
                <button
                  type="button"
                  onClick={() =>
                    void copyText(
                      result.keyPoints
                        .map((p, i) => (isNumbered ? `${i + 1}. ${p}` : `• ${p}`))
                        .join('\n'),
                      'keypoints',
                      'Key points copied'
                    )
                  }
                  className="no-print inline-flex items-center gap-1 text-[11px] font-medium text-[#71717A] hover:text-[#18181B] transition-colors cursor-pointer"
                >
                  {copiedId === 'keypoints' ? (
                    <Check className="h-3 w-3 text-[#15803D]" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  <span>{copiedId === 'keypoints' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {isNumbered ? (
                <ol className="space-y-2.5 text-[14.5px] leading-relaxed text-[#27272A]">
                  {result.keyPoints.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="mt-0.5 font-mono text-xs font-semibold tabular-nums text-[#4F46E5]">
                        {idx + 1}.
                      </span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <ul className="space-y-2 text-[14.5px] leading-relaxed text-[#27272A]">
                  {result.keyPoints.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span
                        className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#6366F1]"
                        aria-hidden="true"
                      />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Important Information */}
          {vis.showImportantInfo && (
            <div className="space-y-2.5 border-t border-[#F1EDE4] pt-5">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-display text-[11px] font-bold tracking-[0.08em] text-[#4F46E5]">
                  IMPORTANT INFORMATION
                </h4>
                <button
                  type="button"
                  onClick={() =>
                    void copyText(
                      result.importantInfo.map((item) => `• ${item}`).join('\n'),
                      'importantInfo',
                      'Important facts copied'
                    )
                  }
                  className="no-print inline-flex items-center gap-1 text-[11px] font-medium text-[#71717A] hover:text-[#18181B] transition-colors cursor-pointer"
                >
                  {copiedId === 'importantInfo' ? (
                    <Check className="h-3 w-3 text-[#15803D]" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  <span>{copiedId === 'importantInfo' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <ul className="space-y-2 text-[14.5px] leading-relaxed text-[#27272A]">
                {result.importantInfo.map((info, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#A1A1AA]"
                      aria-hidden="true"
                    />
                    <span>{info}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Items */}
          {vis.showActionItems && (
            <div className="space-y-2.5 border-t border-[#F1EDE4] pt-5">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-display text-[11px] font-bold tracking-[0.08em] text-[#4F46E5]">
                  ACTION ITEMS
                </h4>
                <button
                  type="button"
                  onClick={() =>
                    void copyText(
                      result.actionItems.map((item, i) => `${i + 1}. [ ] ${item}`).join('\n'),
                      'actionItems',
                      'Action items copied'
                    )
                  }
                  className="no-print inline-flex items-center gap-1 text-[11px] font-medium text-[#71717A] hover:text-[#18181B] transition-colors cursor-pointer"
                >
                  {copiedId === 'actionItems' ? (
                    <Check className="h-3 w-3 text-[#15803D]" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  <span>{copiedId === 'actionItems' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <ul className="space-y-2 text-[14.5px] leading-relaxed text-[#27272A]">
                {result.actionItems.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <CheckSquare
                      className="mt-1 h-4 w-4 shrink-0 text-[#4F46E5]"
                      aria-hidden="true"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Pros & Cons */}
          {vis.showProsAndCons && (
            <div className="space-y-3 border-t border-[#F1EDE4] pt-5">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-display text-[11px] font-bold tracking-[0.08em] text-[#4F46E5]">
                  PROS & CONS
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    const text = [
                      'Pros:',
                      ...result.prosAndCons.pros.map((p) => `+ ${p}`),
                      '',
                      'Cons:',
                      ...result.prosAndCons.cons.map((c) => `- ${c}`),
                    ].join('\n');
                    void copyText(text, 'prosCons', 'Pros & cons copied');
                  }}
                  className="no-print inline-flex items-center gap-1 text-[11px] font-medium text-[#71717A] hover:text-[#18181B] transition-colors cursor-pointer"
                >
                  {copiedId === 'prosCons' ? (
                    <Check className="h-3 w-3 text-[#15803D]" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  <span>{copiedId === 'prosCons' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-[#15803D]">Pros</p>
                  <ul className="space-y-1.5 text-sm leading-relaxed text-[#27272A]">
                    {result.prosAndCons.pros.map((pro, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="font-mono text-xs font-bold text-[#15803D]">+</span>
                        <span>{pro}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-[#B91C1C]">Cons</p>
                  <ul className="space-y-1.5 text-sm leading-relaxed text-[#27272A]">
                    {result.prosAndCons.cons.map((con, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="font-mono text-xs font-bold text-[#DC2626]">-</span>
                        <span>{con}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Questions & Answers */}
          {vis.showQaPairs && (
            <div className="space-y-3 border-t border-[#F1EDE4] pt-5">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-display text-[11px] font-bold tracking-[0.08em] text-[#4F46E5]">
                  QUESTIONS & ANSWERS
                </h4>
                <button
                  type="button"
                  onClick={() =>
                    void copyText(
                      result.qaPairs
                        .map((qa, i) => `Q${i + 1}: ${qa.question}\nA${i + 1}: ${qa.answer}`)
                        .join('\n\n'),
                      'qaPairs',
                      'Q&A copied'
                    )
                  }
                  className="no-print inline-flex items-center gap-1 text-[11px] font-medium text-[#71717A] hover:text-[#18181B] transition-colors cursor-pointer"
                >
                  {copiedId === 'qaPairs' ? (
                    <Check className="h-3 w-3 text-[#15803D]" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  <span>{copiedId === 'qaPairs' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="space-y-3.5">
                {result.qaPairs.map((qa, idx) => (
                  <div key={idx} className="space-y-1">
                    <p className="text-sm font-semibold text-[#18181B]">
                      Q{idx + 1}. {qa.question}
                    </p>
                    <p className="text-sm leading-relaxed text-[#3F3F46]">{qa.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Important Keywords */}
          {vis.showKeywords && (
            <div className="space-y-2 border-t border-[#F1EDE4] pt-5">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-display text-[11px] font-bold tracking-[0.08em] text-[#4F46E5]">
                  IMPORTANT KEYWORDS
                </h4>
                <button
                  type="button"
                  onClick={() =>
                    void copyText(result.keywords.join(', '), 'keywords', 'Keywords copied')
                  }
                  className="no-print inline-flex items-center gap-1 text-[11px] font-medium text-[#71717A] hover:text-[#18181B] transition-colors cursor-pointer"
                >
                  {copiedId === 'keywords' ? (
                    <Check className="h-3 w-3 text-[#15803D]" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  <span>{copiedId === 'keywords' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <p className="text-sm leading-relaxed text-[#3F3F46]">
                {result.keywords.map((kw, idx) => (
                  <span key={idx}>
                    <span className="font-medium text-[#18181B]">{kw}</span>
                    {idx < result.keywords.length - 1 && (
                      <span className="mx-2 text-[#A1A1AA]" aria-hidden="true">
                        ·
                      </span>
                    )}
                  </span>
                ))}
              </p>
            </div>
          )}

          {/* Conclusion */}
          {vis.showConclusion && (
            <div className="space-y-2 border-t border-[#F1EDE4] pt-5">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-display text-[11px] font-bold tracking-[0.08em] text-[#4F46E5]">
                  CONCLUSION
                </h4>
                <button
                  type="button"
                  onClick={() =>
                    void copyText(result.conclusion, 'conclusion', 'Conclusion copied')
                  }
                  className="no-print inline-flex items-center gap-1 text-[11px] font-medium text-[#71717A] hover:text-[#18181B] transition-colors cursor-pointer"
                >
                  {copiedId === 'conclusion' ? (
                    <Check className="h-3 w-3 text-[#15803D]" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  <span>{copiedId === 'conclusion' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <p className="text-[15px] leading-[1.68] text-[#27272A]">{result.conclusion}</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
