import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  ClipboardCopy,
  Download,
  FileCode2,
  Image as ImageIcon,
  Link2,
  Printer,
  X,
} from 'lucide-react';
import { ExportSettings, QRStyleConfig } from '../types/qr';
import { renderQRToPNGBlob, renderQRToSVG, triggerFileDownload } from '../utils/qrRenderer';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  payload: string;
  style: QRStyleConfig;
  onPrint: () => void;
}

const SCALE_PRESETS: Array<{
  id: ExportSettings['scalePreset'];
  label: string;
  px: number;
  desc: string;
}> = [
  { id: '1x', label: 'Standard (1x)', px: 512, desc: '512 px · Web' },
  { id: '2x', label: 'High-DPI (2x)', px: 1024, desc: '1024 px · Retina' },
  { id: '4x', label: 'Print Ultra (4x)', px: 2048, desc: '2048 px · Print' },
  { id: 'custom', label: 'Custom Size', px: 1500, desc: '256–4096 px' },
];

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  title,
  payload,
  style,
  onPrint,
}) => {
  const [settings, setSettings] = useState<ExportSettings>({
    format: 'png',
    scalePreset: '2x',
    customWidth: 1600,
    transparentBg: style.bgTransparent,
    includeFrame: style.framePreset !== 'none',
  });
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<'image' | 'payload' | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSettings((prev) => ({
        ...prev,
        transparentBg: style.bgTransparent,
        includeFrame: style.framePreset !== 'none',
      }));
    }
  }, [isOpen, style.bgTransparent, style.framePreset]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const previewRender = useMemo(() => {
    return renderQRToSVG(payload, style, {
      includeFrame: settings.includeFrame,
      transparentOverride: settings.transparentBg,
      baseSize: 512,
    });
  }, [payload, style, settings.includeFrame, settings.transparentBg]);

  if (!isOpen) return null;

  const targetWidth =
    settings.scalePreset === '1x'
      ? 512
      : settings.scalePreset === '2x'
      ? 1024
      : settings.scalePreset === '4x'
      ? 2048
      : Math.max(256, Math.min(4096, settings.customWidth || 1024));

  const targetHeight = Math.round((targetWidth * previewRender.height) / previewRender.width);

  const safeFileBase = (title || 'aivora-qr-code')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'aivora-qr-code';

  const handleDownload = async () => {
    setBusy(true);
    try {
      if (settings.format === 'svg') {
        const sizedSvg = previewRender.svgMarkup
          .replace(/width="[^"]+"/, `width="${targetWidth}"`)
          .replace(/height="[^"]+"/, `height="${targetHeight}"`);
        const blob = new Blob([sizedSvg], { type: 'image/svg+xml;charset=utf-8' });
        triggerFileDownload(blob, `${safeFileBase}.svg`);
      } else {
        const { blob } = await renderQRToPNGBlob(payload, style, {
          targetWidth,
          includeFrame: settings.includeFrame,
          transparentBg: settings.transparentBg,
        });
        triggerFileDownload(blob, `${safeFileBase}-${targetWidth}px.png`);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleCopyImage = async () => {
    setBusy(true);
    try {
      const { blob } = await renderQRToPNGBlob(payload, style, {
        targetWidth: 1024,
        includeFrame: settings.includeFrame,
        transparentBg: settings.transparentBg,
      });
      if (navigator.clipboard && 'ClipboardItem' in window) {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        setCopied('image');
        setTimeout(() => setCopied(null), 2000);
      }
    } catch {
      // Fallback gracefully if browser blocks image clipboard
    } finally {
      setBusy(false);
    }
  };

  const handleCopyPayload = async () => {
    try {
      await navigator.clipboard.writeText(payload || 'https://aivora.studio');
      setCopied('payload');
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[2px]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 id="export-modal-title" className="font-display text-base font-bold text-slate-900">
              Export QR Code
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Download print-ready PNG or infinite-scale vector SVG
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close export modal"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
          {/* Left: Live Download Preview */}
          <div className="flex flex-col items-center justify-center bg-slate-50 p-6">
            <div
              className={`flex w-full max-w-[240px] items-center justify-center rounded-xl border border-slate-200 p-4 ${
                settings.transparentBg ? 'bg-checkerboard' : 'bg-white'
              }`}
            >
              <div
                className="w-full [&>svg]:h-auto [&>svg]:w-full [&>svg]:block"
                dangerouslySetInnerHTML={{ __html: previewRender.svgMarkup }}
              />
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
              <span className="font-mono font-medium text-slate-800 uppercase">
                {settings.format}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                {settings.format === 'svg'
                  ? 'Vector (Scalable)'
                  : `${targetWidth} × ${targetHeight} px`}
              </span>
            </div>
            <p className="mt-1 max-w-[240px] truncate font-mono text-[11px] text-slate-400">
              {safeFileBase}.{settings.format}
            </p>
          </div>

          {/* Right: Export Settings */}
          <div className="p-6 space-y-5">
            {/* Format Selector */}
            <div className="space-y-2">
              <span className="block text-xs font-semibold text-slate-800">File Format</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSettings((s) => ({ ...s, format: 'png' }))}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                    settings.format === 'png'
                      ? 'border-blue-600 bg-blue-50/70 text-blue-700'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <ImageIcon className="h-4 w-4 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold">PNG</div>
                    <div className="text-[11px] opacity-75">High-res raster</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setSettings((s) => ({ ...s, format: 'svg' }))}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                    settings.format === 'svg'
                      ? 'border-blue-600 bg-blue-50/70 text-blue-700'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <FileCode2 className="h-4 w-4 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold">SVG</div>
                    <div className="text-[11px] opacity-75">Crisp vector</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Resolution Selector (for PNG or SVG viewBox sizing) */}
            <div className="space-y-2">
              <span className="block text-xs font-semibold text-slate-800">
                {settings.format === 'png' ? 'Export Resolution' : 'Base Canvas Dimension'}
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {SCALE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSettings((s) => ({ ...s, scalePreset: preset.id }))}
                    className={`cursor-pointer rounded-lg border px-2.5 py-2 text-left transition-colors ${
                      settings.scalePreset === preset.id
                        ? 'border-blue-600 bg-blue-50/70 text-blue-700'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-semibold">{preset.label}</div>
                    <div className="font-mono text-[10px] opacity-75 tabular-nums">
                      {preset.desc}
                    </div>
                  </button>
                ))}
              </div>

              {settings.scalePreset === 'custom' && (
                <div className="pt-1">
                  <label
                    htmlFor="custom-export-px"
                    className="mb-1 block text-xs font-medium text-slate-700"
                  >
                    Custom Width (px)
                  </label>
                  <input
                    id="custom-export-px"
                    type="number"
                    min={256}
                    max={4096}
                    step={64}
                    value={settings.customWidth}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        customWidth: Number(e.target.value),
                      }))
                    }
                    className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 font-mono text-xs text-slate-900 tabular-nums focus:border-blue-600 focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Export Toggles */}
            <div className="space-y-2.5 border-t border-slate-100 pt-3">
              <label className="flex cursor-pointer items-center justify-between">
                <span className="text-xs font-medium text-slate-700">
                  Transparent Background
                </span>
                <input
                  type="checkbox"
                  checked={settings.transparentBg}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, transparentBg: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                />
              </label>

              <label
                className={`flex items-center justify-between ${
                  style.framePreset === 'none'
                    ? 'opacity-45 pointer-events-none'
                    : 'cursor-pointer'
                }`}
              >
                <span className="text-xs font-medium text-slate-700">
                  Include Branding Frame
                </span>
                <input
                  type="checkbox"
                  disabled={style.framePreset === 'none'}
                  checked={settings.includeFrame && style.framePreset !== 'none'}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, includeFrame: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                />
              </label>
            </div>

            {/* Primary Download CTA */}
            <button
              type="button"
              disabled={busy}
              onClick={handleDownload}
              className="flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-60 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>
                {busy
                  ? 'Rendering...'
                  : `Download ${settings.format.toUpperCase()} (${
                      settings.format === 'svg' ? 'Vector' : `${targetWidth}px`
                    })`}
              </span>
            </button>

            {/* Secondary Utilities */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleCopyImage}
                className="flex h-8 cursor-pointer items-center justify-center gap-1 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                {copied === 'image' ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <ClipboardCopy className="h-3.5 w-3.5 text-slate-500" />
                )}
                <span>{copied === 'image' ? 'Copied' : 'Copy PNG'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopyPayload}
                className="flex h-8 cursor-pointer items-center justify-center gap-1 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                {copied === 'payload' ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <Link2 className="h-3.5 w-3.5 text-slate-500" />
                )}
                <span>{copied === 'payload' ? 'Copied' : 'Copy URL'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  setTimeout(onPrint, 120);
                }}
                className="flex h-8 cursor-pointer items-center justify-center gap-1 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Printer className="h-3.5 w-3.5 text-slate-500" />
                <span>Print</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
