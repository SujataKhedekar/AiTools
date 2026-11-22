import { useState } from 'react';
import {
  AlertCircle,
  Maximize2,
  Minimize2,
  Monitor,
  RefreshCw,
  Smartphone,
  Tablet,
  Wrench,
} from 'lucide-react';

export type PreviewViewport = 'desktop' | 'tablet' | 'mobile';

interface LivePreviewPaneProps {
  previewHtml: string;
  previewErrors: string[];
  isCompiling: boolean;
  isBusy: boolean;
  onRefreshPreview: () => void;
  onFixErrorsWithAi: () => void;
}

const VIEWPORT_WIDTHS: Record<PreviewViewport, string> = {
  desktop: '100%',
  tablet: '768px',
  mobile: '390px',
};

export function LivePreviewPane({
  previewHtml,
  previewErrors,
  isCompiling,
  isBusy,
  onRefreshPreview,
  onFixErrorsWithAi,
}: LivePreviewPaneProps) {
  const [viewport, setViewport] = useState<PreviewViewport>('desktop');
  const [fullscreen, setFullscreen] = useState(false);

  const previewToolbar = (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2">
      <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-white p-0.5">
        <button
          type="button"
          onClick={() => setViewport('desktop')}
          className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
            viewport === 'desktop'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Monitor className="h-3.5 w-3.5" aria-hidden="true" />
          Desktop
        </button>
        <button
          type="button"
          onClick={() => setViewport('tablet')}
          className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
            viewport === 'tablet'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Tablet className="h-3.5 w-3.5" aria-hidden="true" />
          Tablet
        </button>
        <button
          type="button"
          onClick={() => setViewport('mobile')}
          className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
            viewport === 'mobile'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Smartphone className="h-3.5 w-3.5" aria-hidden="true" />
          Mobile
        </button>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={isCompiling || !previewHtml}
          onClick={onRefreshPreview}
          className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${isCompiling ? 'animate-spin' : ''}`}
            aria-hidden="true"
          />
          {isCompiling ? 'Compiling...' : 'Refresh'}
        </button>
        <button
          type="button"
          disabled={!previewHtml}
          onClick={() => setFullscreen((v) => !v)}
          className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
        >
          {fullscreen ? (
            <>
              <Minimize2 className="h-3.5 w-3.5" aria-hidden="true" />
              Exit Fullscreen
            </>
          ) : (
            <>
              <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
              Fullscreen
            </>
          )}
        </button>
      </div>
    </div>
  );

  const errorBanner = previewErrors.length > 0 && (
    <div className="border-b border-red-200 bg-red-50 px-4 py-2.5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2 text-xs text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
          <div>
            <p className="font-semibold">
              Compilation Issue Detected ({previewErrors.length})
            </p>
            <ul className="mt-1 space-y-0.5 font-mono text-[11px] text-red-700">
              {previewErrors.slice(0, 4).map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        </div>
        <button
          type="button"
          disabled={isBusy}
          onClick={onFixErrorsWithAi}
          className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
        >
          <Wrench className="h-3.5 w-3.5" aria-hidden="true" />
          Fix with AI
        </button>
      </div>
    </div>
  );

  const iframeSurface = !previewHtml ? (
    <div className="flex h-full min-h-[460px] items-center justify-center bg-slate-50 p-8 text-center">
      <div>
        <Monitor className="mx-auto h-8 w-8 text-slate-300" aria-hidden="true" />
        <p className="mt-2 text-sm font-medium text-slate-800">
          Sandboxed Live Preview Ready
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Generated code compiles into an isolated preview iframe with Desktop, Tablet, and Mobile switching.
        </p>
      </div>
    </div>
  ) : (
    <div className="flex flex-1 justify-center overflow-auto bg-slate-200/70 p-4">
      <div
        style={{ width: VIEWPORT_WIDTHS[viewport] }}
        className="h-full min-h-[500px] max-w-full overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm transition-[width] duration-200"
      >
        <iframe
          title="Isolated generated frontend preview"
          sandbox="allow-scripts allow-forms allow-modals"
          srcDoc={previewHtml}
          className="h-full min-h-[500px] w-full border-0 bg-white"
        />
      </div>
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-white">
        {previewToolbar}
        {errorBanner}
        {iframeSurface}
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-[540px] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
      {previewToolbar}
      {errorBanner}
      {iframeSurface}
    </div>
  );
}
