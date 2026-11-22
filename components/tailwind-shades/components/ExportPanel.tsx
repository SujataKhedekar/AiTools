import React, { useMemo, useState } from 'react';
import { Check, Copy, Download } from 'lucide-react';
import {
  ExportFormat,
  GenerationMode,
  ShadeEntry,
  TypographySettings,
} from '../types/palette';
import { downloadTextFile, getExportCode } from '../utils/exporters';

interface ExportPanelProps {
  paletteName: string;
  colourName: string;
  baseHex: string;
  mode: GenerationMode;
  shades: ShadeEntry[];
  typography: TypographySettings;
  onCopyText: (text: string, label: string) => void;
}

const EXPORT_TABS: { id: ExportFormat; label: string }[] = [
  { id: 'css', label: 'CSS Variables' },
  { id: 'tailwind-v4', label: 'Tailwind v4' },
  { id: 'tailwind-v3', label: 'Tailwind v3' },
  { id: 'json', label: 'JSON' },
  { id: 'scss', label: 'SCSS' },
  { id: 'hex', label: 'HEX List' },
];

export const ExportPanel: React.FC<ExportPanelProps> = ({
  paletteName,
  colourName,
  baseHex,
  mode,
  shades,
  typography,
  onCopyText,
}) => {
  const [activeFormat, setActiveFormat] = useState<ExportFormat>('css');
  const [copied, setCopied] = useState(false);

  const exportPayload = useMemo(
    () =>
      getExportCode(activeFormat, {
        paletteName,
        colourName,
        baseHex,
        mode,
        shades,
        uppercaseHex: typography.uppercaseHex,
      }),
    [activeFormat, paletteName, colourName, baseHex, mode, shades, typography.uppercaseHex]
  );

  const handleCopy = () => {
    const tabLabel =
      EXPORT_TABS.find((t) => t.id === activeFormat)?.label ?? 'Export';
    onCopyText(exportPayload.code, tabLabel);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const handleDownload = () => {
    downloadTextFile(
      exportPayload.code,
      exportPayload.filename,
      exportPayload.mime
    );
  };

  const codeFontSize =
    typography.codeFontSize === 'sm'
      ? 'text-[11px]'
      : typography.codeFontSize === 'lg'
        ? 'text-[13px]'
        : 'text-xs';

  return (
    <section
      aria-label="Export palette code"
      className="rounded-xl bg-[#FFFFFF] border border-[#E8E6DF] shadow-2xs overflow-hidden"
    >
      {/* Header + Format Tabs */}
      <div className="px-4 pt-3.5 pb-3 border-b border-[#EFECE5] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-[13px] font-semibold text-[#171614]">
              Export Code & Tokens
            </h2>
            <p className="text-[11px] text-[#78756C]">
              Ready for CSS, Tailwind CSS, JSON, SCSS, or raw HEX lists
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#FFFFFF] hover:bg-[#F7F6F2] border border-[#E2E0D8] text-xs font-medium text-[#171614] transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="h-3.5 w-3.5 text-[#62605A]" />
              Download
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#181816] hover:bg-[#2E2D29] text-xs font-semibold text-[#FFFFFF] transition-colors whitespace-nowrap shrink-0"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy Code
                </>
              )}
            </button>
          </div>
        </div>

        {/* Format Selector */}
        <div
          role="tablist"
          aria-label="Export formats"
          className="flex items-center gap-1 overflow-x-auto pb-0.5"
        >
          {EXPORT_TABS.map((tab) => {
            const active = activeFormat === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveFormat(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-[#181816] text-[#FFFFFF] font-semibold'
                    : 'text-[#62605A] hover:text-[#171614] hover:bg-[#F5F4F0]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filename bar + Code View */}
      <div className="bg-[#FAF9F6]">
        <div className="flex items-center justify-between px-4 py-2 border-b border-[#ECEAE2] font-mono text-[11px] text-[#78756C]">
          <span>{exportPayload.filename}</span>
          <span className="tabular-nums">
            {exportPayload.code.split('\n').length} lines
          </span>
        </div>
        <pre
          className={`p-4 overflow-x-auto font-mono ${codeFontSize} leading-relaxed text-[#1E1D1A] tabular-nums max-h-[340px]`}
        >
          <code>{exportPayload.code}</code>
        </pre>
      </div>
    </section>
  );
};
