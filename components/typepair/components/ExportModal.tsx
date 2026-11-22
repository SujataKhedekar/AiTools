import { useEffect, useState } from 'react';
import { Archive, Check, Copy, Download, X } from 'lucide-react';
import { PairingState } from '../types/typography';
import {
  generateCssCode,
  generateDesignTokensJson,
  generateHtmlLink,
  generateTailwindCode,
} from '../utils/colorContrast';
import { createZipBlob } from '../utils/zipBuilder';

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  state: PairingState;
}

type ExportFormat = 'css' | 'html' | 'tailwind' | 'json';

const EXPORT_TABS: Array<{ id: ExportFormat; label: string; filename: string; mime: string }> = [
  { id: 'css', label: 'CSS Variables', filename: 'typepair-tokens.css', mime: 'text/css' },
  { id: 'html', label: 'HTML Link', filename: 'google-fonts.html', mime: 'text/html' },
  { id: 'tailwind', label: 'Tailwind v4', filename: 'theme.css', mime: 'text/css' },
  { id: 'json', label: 'Design Tokens', filename: 'typography-tokens.json', mime: 'application/json' },
];

function buildPreviewHtml(state: PairingState): string {
  const links = generateHtmlLink(state);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${state.heading.family} + ${state.body.family} — Specimen</title>
  ${links}
  <link rel="stylesheet" href="./typepair-tokens.css" />
  <style>
    body { margin: 0; padding: 4rem 1.5rem; }
    main { max-width: 760px; margin: 0 auto; }
    .meta-label { font-size: 0.75rem; opacity: 0.75; margin-bottom: 1rem; }
  </style>
</head>
<body>
  <main>
    <div class="meta-label">${state.heading.family} (${state.heading.weight}) / ${state.body.family} (${state.body.weight})</div>
    <h1>Form follows daylight across silent concrete halls</h1>
    <p>Every enduring publication begins with proportion. When a characterful display face meets a calm, open-counter body typeface, the reader moves effortlessly from headline to narrative.</p>
  </main>
</body>
</html>
`;
}

export function ExportModal({ open, onClose, state }: ExportModalProps) {
  const [format, setFormat] = useState<ExportFormat>('css');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const code =
    format === 'html'
      ? generateHtmlLink(state)
      : format === 'css'
        ? generateCssCode(state)
        : format === 'tailwind'
          ? generateTailwindCode(state)
          : generateDesignTokensJson(state);

  const activeTabMeta = EXPORT_TABS.find((t) => t.id === format)!;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    }
  }

  function handleDownload() {
    const blob = new Blob([code], { type: activeTabMeta.mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeTabMeta.filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleDownloadZip() {
    const slug = `${state.heading.family}-${state.body.family}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const zipBlob = createZipBlob([
      { name: 'typepair-tokens.css', content: generateCssCode(state) },
      { name: 'google-fonts.html', content: generateHtmlLink(state) },
      { name: 'tailwind-v4-theme.css', content: generateTailwindCode(state) },
      { name: 'typography-tokens.json', content: generateDesignTokensJson(state) },
      { name: 'preview.html', content: buildPreviewHtml(state) },
    ]);

    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `typepair-${slug}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <div>
            <h2
              id="export-modal-title"
              className="font-[var(--font-ui-display)] text-base font-semibold text-zinc-950 dark:text-zinc-50"
            >
              Export Typography Setup
            </h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {state.heading.family} · {state.body.family} · {state.accent.family}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close export modal"
            className="cursor-pointer rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Format Tabs */}
        <div className="flex items-center justify-between gap-4 border-b border-zinc-200 bg-zinc-50/70 px-6 py-2.5 dark:border-zinc-800 dark:bg-zinc-950/50">
          <div className="flex items-center gap-1 overflow-x-auto">
            {EXPORT_TABS.map((tab) => {
              const active = format === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setFormat(tab.id);
                    setCopied(false);
                  }}
                  className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors duration-150 ${
                    active
                      ? 'bg-white text-zinc-950 shadow-xs ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-50 dark:ring-zinc-700'
                      : 'text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
          <span className="hidden font-[var(--font-ui-mono)] text-[11px] text-zinc-500 sm:inline dark:text-zinc-400">
            {activeTabMeta.filename}
          </span>
        </div>

        {/* Code Preview */}
        <div className="p-6">
          <pre className="max-h-80 overflow-auto rounded-lg border border-zinc-200 bg-zinc-950 p-4 font-[var(--font-ui-mono)] text-xs leading-relaxed text-zinc-100 dark:border-zinc-800">
            <code>{code}</code>
          </pre>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Loads only the exact families and weights configured in your workbench.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadZip}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3.5 py-2 text-xs font-medium text-zinc-800 whitespace-nowrap transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                <Archive className="h-3.5 w-3.5" />
                Download ZIP Kit
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3.5 py-2 text-xs font-medium text-zinc-800 whitespace-nowrap transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                <Download className="h-3.5 w-3.5" />
                Download File
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold text-white whitespace-nowrap transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:text-zinc-950 dark:hover:bg-blue-400"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied' : 'Copy Code'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
