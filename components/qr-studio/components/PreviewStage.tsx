import React from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ClipboardCopy,
  Download,
  FileCode2,
  Link2,
  Printer,
  RotateCcw,
  Shuffle,
  SlidersHorizontal,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { PreviewBackdrop, ReadabilityReport } from '../types/qr';

interface PreviewStageProps {
  title: string;
  payload: string;
  svgMarkup: string;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  backdrop: PreviewBackdrop;
  onBackdropChange: (backdrop: PreviewBackdrop) => void;
  readability: ReadabilityReport;
  onRandomPalette: () => void;
  onResetStyle: () => void;
  onQuickDownloadPNG: () => void;
  onQuickDownloadSVG: () => void;
  onCopyImage: () => void;
  onCopyPayload: () => void;
  onPrint: () => void;
  onOpenExport: () => void;
  copiedState: 'image' | 'payload' | null;
  isExporting: boolean;
}

const BACKDROP_OPTIONS: Array<{ id: PreviewBackdrop; label: string }> = [
  { id: 'grid', label: 'Studio' },
  { id: 'white', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'transparent', label: 'Alpha' },
];

export const PreviewStage: React.FC<PreviewStageProps> = ({
  title,
  payload,
  svgMarkup,
  zoom,
  onZoomChange,
  backdrop,
  onBackdropChange,
  readability,
  onRandomPalette,
  onResetStyle,
  onQuickDownloadPNG,
  onQuickDownloadSVG,
  onCopyImage,
  onCopyPayload,
  onPrint,
  onOpenExport,
  copiedState,
  isExporting,
}) => {
  const stageBgClass =
    backdrop === 'white'
      ? 'bg-white'
      : backdrop === 'dark'
      ? 'bg-slate-900'
      : backdrop === 'transparent'
      ? 'bg-checkerboard'
      : 'bg-studio-grid';

  const qrDisplayWidth = Math.round(310 * (zoom / 100));

  const statusColorClass =
    readability.status === 'optimal'
      ? 'text-emerald-700'
      : readability.status === 'caution'
      ? 'text-amber-700'
      : 'text-rose-700';

  return (
    <main className="flex h-full min-w-0 flex-col bg-slate-50">
      {/* Studio Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-2.5">
        {/* Background Preview Switcher */}
        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5">
          {BACKDROP_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onBackdropChange(opt.id)}
              className={`h-7 cursor-pointer rounded-md px-2.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                backdrop === opt.id
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Zoom & Quick Utilities */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-slate-200 bg-white">
            <button
              type="button"
              onClick={() => onZoomChange(Math.max(60, zoom - 15))}
              aria-label="Zoom out"
              className="flex h-7 w-7 cursor-pointer items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-l-lg"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onZoomChange(100)}
              title="Reset zoom to 100%"
              className="h-7 cursor-pointer border-x border-slate-200 px-2 font-mono text-[11px] font-medium text-slate-700 tabular-nums hover:bg-slate-50"
            >
              {zoom}%
            </button>
            <button
              type="button"
              onClick={() => onZoomChange(Math.min(145, zoom + 15))}
              aria-label="Zoom in"
              className="flex h-7 w-7 cursor-pointer items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-r-lg"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={onRandomPalette}
            title="Generate random harmonious color palette"
            className="inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
          >
            <Shuffle className="h-3.5 w-3.5 text-slate-500" />
            <span className="hidden sm:inline">Randomize</span>
          </button>

          <button
            type="button"
            onClick={onResetStyle}
            title="Reset all style customizations"
            className="inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
          >
            <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Main Live Canvas Viewport */}
      <div
        className={`relative flex flex-1 flex-col items-center justify-center overflow-auto p-6 sm:p-10 transition-colors duration-200 ${stageBgClass}`}
      >
        <div
          id="qr-print-area"
          className="flex flex-col items-center justify-center transition-transform duration-150"
        >
          <div
            className="rounded-xl transition-all duration-150"
            style={{
              width: `${qrDisplayWidth}px`,
              maxWidth: '100%',
              filter:
                backdrop === 'dark'
                  ? 'drop-shadow(0 20px 35px rgba(0, 0, 0, 0.45))'
                  : 'drop-shadow(0 14px 28px rgba(15, 23, 42, 0.08))',
            }}
          >
            <div
              className="w-full [&>svg]:h-auto [&>svg]:w-full [&>svg]:block"
              dangerouslySetInnerHTML={{ __html: svgMarkup }}
            />
          </div>
        </div>

        {/* Quiet Metadata Line below QR Preview (Zero-Pill Discipline) */}
        <div
          className={`mt-6 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-xs ${
            backdrop === 'dark' ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          <span className={`font-medium ${backdrop === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
            {title || 'Untitled QR Design'}
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums">
            {readability.moduleCount}×{readability.moduleCount} modules
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums">EC Level {readability.effectiveEC}</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums">
            {readability.contrastRatio.toFixed(1)}:1 contrast
          </span>
        </div>

        {!payload.trim() && (
          <p
            className={`mt-2 text-xs ${
              backdrop === 'dark' ? 'text-amber-300' : 'text-amber-700'
            }`}
          >
            Showing fallback preview URL — type your content in the left panel to update live.
          </p>
        )}
      </div>

      {/* Bottom Diagnostics & Quick Export Bar */}
      <div className="border-t border-slate-200 bg-white px-4 py-3.5 sm:px-6 space-y-3">
        {/* Readability Validation Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            {readability.status === 'optimal' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
            ) : (
              <AlertTriangle
                className={`h-4 w-4 shrink-0 ${
                  readability.status === 'caution' ? 'text-amber-600' : 'text-rose-600'
                }`}
                aria-hidden="true"
              />
            )}
            <span className={`font-semibold whitespace-nowrap ${statusColorClass}`}>
              {readability.label}
            </span>
            <span className="text-slate-300" aria-hidden="true">
              ·
            </span>
            <span className="truncate text-slate-600">{readability.tips[0]}</span>
          </div>

          <span className="font-mono text-[11px] text-slate-400 tabular-nums whitespace-nowrap shrink-0">
            v{readability.version} · {readability.payloadLength} chars
          </span>
        </div>

        {/* Action Shortcuts */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onQuickDownloadPNG}
              disabled={isExporting}
              className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="h-3.5 w-3.5" />
              <span>PNG (2x)</span>
            </button>

            <button
              type="button"
              onClick={onQuickDownloadSVG}
              className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-800 hover:border-slate-300 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
            >
              <FileCode2 className="h-3.5 w-3.5 text-slate-500" />
              <span>SVG Vector</span>
            </button>

            <button
              type="button"
              onClick={onCopyImage}
              className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
            >
              {copiedState === 'image' ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied PNG</span>
                </>
              ) : (
                <>
                  <ClipboardCopy className="h-3.5 w-3.5 text-slate-500" />
                  <span>Copy Image</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onCopyPayload}
              className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
            >
              {copiedState === 'payload' ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied</span>
                </>
              ) : (
                <>
                  <Link2 className="h-3.5 w-3.5 text-slate-500" />
                  <span>Copy URL</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onPrint}
              className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
            >
              <Printer className="h-3.5 w-3.5 text-slate-500" />
              <span>Print</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenExport}
            className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-800 hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" />
            <span>Export Options</span>
          </button>
        </div>
      </div>
    </main>
  );
};
