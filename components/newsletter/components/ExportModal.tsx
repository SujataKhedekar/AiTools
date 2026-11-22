import { Check, Copy, Download, Mail, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { NewsletterIssue } from '../types/newsletter';
import {
  generateEmailHtml,
  generateMarkdown,
  generatePlainText,
} from '../utils/newsletterExport';

interface ExportModalProps {
  issue: NewsletterIssue;
  isOpen: boolean;
  onClose: () => void;
}

type ExportFormat = 'html' | 'markdown' | 'text';

export function ExportModal({ issue, isOpen, onClose }: ExportModalProps) {
  const [format, setFormat] = useState<ExportFormat>('html');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedRich, setCopiedRich] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const outputs = useMemo(
    () => ({
      html: generateEmailHtml(issue),
      markdown: generateMarkdown(issue),
      text: generatePlainText(issue),
    }),
    [issue]
  );

  if (!isOpen) return null;

  const activeContent = outputs[format];
  const htmlBytes = new TextEncoder().encode(outputs.html).length;
  const htmlKb = (htmlBytes / 1024).toFixed(1);

  const safeSlug = (issue.subject || 'newsletter-issue')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(activeContent);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // Fallback: select text if clipboard blocked
    }
  };

  const handleCopyRichEmail = async () => {
    try {
      if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
        const item = new ClipboardItem({
          'text/html': new Blob([outputs.html], { type: 'text/html' }),
          'text/plain': new Blob([outputs.text], { type: 'text/plain' }),
        });
        await navigator.clipboard.write([item]);
      } else {
        await navigator.clipboard.writeText(outputs.html);
      }
      setCopiedRich(true);
      setTimeout(() => setCopiedRich(false), 2200);
    } catch {
      await handleCopyCode();
    }
  };

  const handleDownload = () => {
    const ext = format === 'html' ? 'html' : format === 'markdown' ? 'md' : 'txt';
    const mime =
      format === 'html'
        ? 'text/html;charset=utf-8'
        : format === 'markdown'
        ? 'text/markdown;charset=utf-8'
        : 'text/plain;charset=utf-8';
    const blob = new Blob([activeContent], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `issue-${issue.issueNumber || '01'}-${safeSlug}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/45 backdrop-blur-[1px]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-white border border-neutral-200 rounded-lg shadow-xl flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-neutral-200 flex items-start justify-between gap-4">
          <div>
            <h2
              id="export-modal-title"
              className="font-serif text-xl font-semibold text-neutral-900"
            >
              Export Issue {issue.issueNumber}
            </h2>
            <p className="text-xs text-neutral-500 mt-1">
              Table-based inline CSS email HTML ({htmlKb} KB ·{' '}
              {htmlBytes / 1024 <= 102 ? 'Safe from Gmail clipping' : 'Exceeds Gmail 102 KB limit'}), Markdown, or plain-text fallback.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close export modal"
            className="p-1.5 rounded-md text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Format Tabs & Primary Actions */}
        <div className="px-6 py-3.5 border-b border-neutral-200 bg-[#FAFAFA] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-1 bg-neutral-200/70 rounded-md">
            {(
              [
                { id: 'html', label: 'Email HTML' },
                { id: 'markdown', label: 'Markdown' },
                { id: 'text', label: 'Plain Text' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFormat(tab.id)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  format === tab.id
                    ? 'bg-white text-neutral-900 shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyRichEmail}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-neutral-200 bg-white text-xs font-medium text-neutral-800 hover:bg-neutral-50 transition-colors whitespace-nowrap cursor-pointer"
            >
              {copiedRich ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Copied Rich Email</span>
                </>
              ) : (
                <>
                  <Mail className="w-3.5 h-3.5" />
                  <span>Copy for Gmail / Substack</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-neutral-200 bg-white text-xs font-medium text-neutral-800 hover:bg-neutral-50 transition-colors whitespace-nowrap cursor-pointer"
            >
              {copiedCode ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-[#1D4ED8] text-white text-xs font-medium hover:bg-[#1E40AF] transition-colors whitespace-nowrap cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .{format === 'html' ? 'html' : format === 'markdown' ? 'md' : 'txt'}</span>
            </button>
          </div>
        </div>

        {/* Code Output Viewer */}
        <div className="flex-1 overflow-auto p-6 bg-[#141416] text-neutral-200">
          <pre className="font-mono text-xs leading-relaxed whitespace-pre-wrap break-words select-all">
            {activeContent}
          </pre>
        </div>
      </div>
    </div>
  );
}
