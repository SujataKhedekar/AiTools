import React, { useEffect, useState } from 'react';
import { Archive, Download, Loader2, X } from 'lucide-react';
import {
  downloadExportApi,
  downloadProjectSourceZipApi,
  fetchUsageSnapshotApi,
} from '../../lib/api/contentClient';
import type {
  ContentAnalysisResponse,
  UsageSnapshot,
} from '../../types/contentIntelligence';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalText: string;
  improvedText: string;
  analysis: ContentAnalysisResponse | null;
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  isOpen,
  onClose,
  originalText,
  improvedText,
  analysis,
}) => {
  const [documentTitle, setDocumentTitle] = useState('editorial-analysis');
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [usage, setUsage] = useState<UsageSnapshot | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    fetchUsageSnapshotApi()
      .then(setUsage)
      .catch(() => {});
  }, [isOpen]);

  if (!isOpen) return null;

  const triggerSourceZipDownload = async () => {
    setExportError(null);
    setDownloadingKey('source-zip');
    try {
      await downloadProjectSourceZipApi();
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Source archive download failed.');
    } finally {
      setDownloadingKey(null);
    }
  };

  const triggerDownload = async (
    kind: 'original' | 'improved' | 'full_report',
    format: 'txt' | 'docx' | 'pdf'
  ) => {
    const key = `${kind}-${format}`;
    setExportError(null);
    setDownloadingKey(key);
    try {
      await downloadExportApi({
        kind,
        format,
        originalText,
        improvedText,
        analysis,
        documentTitle,
      });
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Export failed.');
    } finally {
      setDownloadingKey(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[1px] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
    >
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 id="export-modal-title" className="text-base font-semibold text-slate-900">
              Export Documents &amp; Editorial Reports
            </h2>
            <p className="text-xs text-slate-500">
              Download clean drafts or the complete 8-section analysis report.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            aria-label="Close export modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Export File Base Name
            </label>
            <input
              type="text"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs font-mono text-slate-900"
            />
          </div>

          {exportError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              {exportError}
            </div>
          )}

          <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg">
            {/* Full 8-section Analysis Report */}
            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-slate-900">
                  Complete 8-Section Content Improvement Report
                </div>
                <div className="text-[11px] text-slate-500">
                  Overview, writing patterns, flagged sentences, phrases, readability, SEO, rewritten text &amp; editorial plan.
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {(['pdf', 'docx', 'txt'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    disabled={Boolean(downloadingKey) || !originalText.trim()}
                    onClick={() => triggerDownload('full_report', fmt)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 disabled:opacity-50 uppercase"
                  >
                    {downloadingKey === `full_report-${fmt}` ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Download className="w-3 h-3" />
                    )}
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            {/* Improved Content */}
            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-slate-900">
                  Improved / Final Content Only
                </div>
                <div className="text-[11px] text-slate-500">
                  Clean document containing your accepted edits and humanized prose.
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {(['docx', 'txt'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    disabled={Boolean(downloadingKey) || !(improvedText || originalText).trim()}
                    onClick={() => triggerDownload('improved', fmt)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-50 uppercase"
                  >
                    {downloadingKey === `improved-${fmt}` ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Download className="w-3 h-3" />
                    )}
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            {/* Original Content */}
            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-slate-900">
                  Original Source Content
                </div>
                <div className="text-[11px] text-slate-500">
                  Unmodified baseline copy for archive or audit trail.
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {(['docx', 'txt'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    disabled={Boolean(downloadingKey) || !originalText.trim()}
                    onClick={() => triggerDownload('original', fmt)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-50 uppercase"
                  >
                    {downloadingKey === `original-${fmt}` ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Download className="w-3 h-3" />
                    )}
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
              <div>
                <div className="text-xs font-semibold text-slate-900">Complete Application Source Bundle (.zip)</div>
                <div className="text-[11px] text-slate-500">Project source, package configuration, and server routes; secrets and dependencies excluded.</div>
              </div>
              <button
                type="button"
                disabled={Boolean(downloadingKey)}
                onClick={() => void triggerSourceZipDownload()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-md hover:bg-slate-100 disabled:opacity-50 whitespace-nowrap"
              >
                {downloadingKey === 'source-zip' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Archive className="w-3.5 h-3.5" />}
                ZIP
              </button>
            </div>

          </div>

          {/* Server Token & Cache Monitoring Snapshot */}
          {usage && (
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex flex-wrap items-center justify-between gap-2 font-mono tabular-nums">
              <span>
                Session AI calls: {usage.geminiCalls} · Tokens: {usage.totalTokens.toLocaleString()}
              </span>
              <span>
                Cache hits: {usage.cacheHits}/{usage.cacheHits + usage.cacheMisses} · Est. ${usage.estimatedCostUsd.toFixed(4)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
