import { useState } from 'react';
import { CheckCircle2, Download, FileCode2, FileText, Loader2, Printer, X } from 'lucide-react';
import { PageSize, ResumeDocument } from '../types/resume';
import { exportResumeToPdf } from '../utils/exportPdf';
import { exportResumeToDocx } from '../utils/exportDocx';
import ResumePreview from './ResumePreview';

interface ExportModalProps {
  resume: ResumeDocument;
  onChangePageSize: (size: PageSize) => void;
  onClose: () => void;
}

export default function ExportModal({ resume, onChangePageSize, onClose }: ExportModalProps) {
  const [busy, setBusy] = useState<'pdf' | 'docx' | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleDownloadPdf = () => {
    setBusy('pdf');
    setStatusMessage(null);
    try {
      exportResumeToPdf(resume);
      setStatusMessage(`Vector PDF (${resume.design.pageSize}) downloaded with selectable text.`);
    } finally {
      setBusy(null);
    }
  };

  const handleDownloadDocx = async () => {
    setBusy('docx');
    setStatusMessage(null);
    try {
      await exportResumeToDocx(resume);
      setStatusMessage(`Editable Word document (.docx, ${resume.design.pageSize}) downloaded.`);
    } finally {
      setBusy(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJson = () => {
    const blob = new Blob([JSON.stringify(resume, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(resume.title || 'aivora-resume').replace(/[^a-z0-9-_]/gi, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatusMessage('Resume JSON backup saved.');
  };

  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
    >
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-white/[0.1] bg-[#12161F]">
        <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-4">
          <div>
            <h2 id="export-modal-title" className="font-display text-lg font-semibold text-white">
              Preview & Export Resume
            </h2>
            <p className="mt-0.5 text-xs text-[#98A2B3]">
              {resume.title} · {resume.design.pageSize} format · Selectable text & clean page breaks
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] text-[#98A2B3] transition-colors hover:bg-white/[0.06] hover:text-white"
            aria-label="Close export modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-12">
          {/* Left: Scaled Preview */}
          <div className="flex flex-col items-center overflow-auto bg-[#0B0E14] p-6 lg:col-span-7">
            <div className="overflow-hidden rounded-sm shadow-2xl">
              <ResumePreview resume={resume} scale={0.56} showPageGuides={true} />
            </div>
          </div>

          {/* Right: Export Controls */}
          <div className="flex flex-col justify-between gap-6 border-t border-white/[0.08] p-6 lg:col-span-5 lg:border-l lg:border-t-0">
            <div className="space-y-6">
              {/* Page Size */}
              <div>
                <label className="mb-2 block text-xs font-medium text-[#98A2B3]">Paper Format</label>
                <div className="grid grid-cols-2 gap-2 rounded-lg bg-[#0B0E14] p-1">
                  {(['A4', 'Letter'] as PageSize[]).map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => onChangePageSize(size)}
                      className={`h-9 rounded-md text-xs font-semibold transition-colors ${
                        resume.design.pageSize === size
                          ? 'bg-[#D4A843] text-[#0B0E14]'
                          : 'text-[#98A2B3] hover:text-white'
                      }`}
                    >
                      {size === 'A4' ? 'A4 (210 × 297 mm)' : 'US Letter (8.5 × 11 in)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Export Buttons */}
              <div className="space-y-3">
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={handleDownloadPdf}
                  className="flex w-full items-center justify-between rounded-lg bg-[#D4A843] px-4 py-3.5 text-left text-[#0B0E14] transition-colors hover:bg-[#E3BB5C] disabled:opacity-60"
                >
                  <div>
                    <div className="text-sm font-bold">Download PDF</div>
                    <div className="text-xs text-[#0B0E14]/80">
                      Selectable vector text, ATS-readable, clean page breaks
                    </div>
                  </div>
                  {busy === 'pdf' ? (
                    <Loader2 className="h-5 w-5 animate-spin shrink-0" />
                  ) : (
                    <Download className="h-5 w-5 shrink-0" />
                  )}
                </button>

                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={handleDownloadDocx}
                  className="flex w-full items-center justify-between rounded-lg border border-white/[0.12] bg-[#181D29] px-4 py-3.5 text-left text-white transition-colors hover:border-[#D4A843]/50 hover:bg-[#1E2433] disabled:opacity-60"
                >
                  <div>
                    <div className="text-sm font-semibold">Download DOCX (Word)</div>
                    <div className="text-xs text-[#98A2B3]">
                      Editable Microsoft Word document preserving section order
                    </div>
                  </div>
                  {busy === 'docx' ? (
                    <Loader2 className="h-5 w-5 animate-spin shrink-0 text-[#D4A843]" />
                  ) : (
                    <FileText className="h-5 w-5 shrink-0 text-[#D4A843]" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex w-full items-center justify-between rounded-lg border border-white/[0.1] bg-[#12161F] px-4 py-3 text-left text-[#ECEFF4] transition-colors hover:bg-white/[0.04]"
                >
                  <div>
                    <div className="text-sm font-medium">Print / Save Styled PDF</div>
                    <div className="text-xs text-[#98A2B3]">
                      Uses your browser print dialog to preserve exact CSS template layout
                    </div>
                  </div>
                  <Printer className="h-4 w-4 shrink-0 text-[#98A2B3]" />
                </button>

                <button
                  type="button"
                  onClick={handleDownloadJson}
                  className="flex w-full items-center justify-between rounded-lg border border-white/[0.08] bg-transparent px-4 py-2.5 text-left text-[#CBD5E1] transition-colors hover:bg-white/[0.04]"
                >
                  <span className="text-xs font-medium">Export JSON Data Backup</span>
                  <FileCode2 className="h-4 w-4 shrink-0 text-[#98A2B3]" />
                </button>
              </div>

              {statusMessage && (
                <div className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-200">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  <span>{statusMessage}</span>
                </div>
              )}
            </div>

            <p className="text-xs leading-relaxed text-[#64748B]">
              Tip: For strict corporate ATS portals, select the ATS-Friendly Classic template or download the vector PDF / DOCX above for clean machine text parsing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
