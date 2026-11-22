import React from 'react';
import { Download } from 'lucide-react';
import { ExportFormat } from '../types/studio';

interface TopBarProps {
  onUploadClick: () => void;
  onPasteClick: () => void;
  compareActive: boolean;
  onToggleCompare: () => void;
  onResetAll: () => void;
  exportFormat: ExportFormat;
  onExportClick: () => void;
  isExporting: boolean;
  hasPhoto: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  onUploadClick,
  onPasteClick,
  compareActive,
  onToggleCompare,
  onResetAll,
  exportFormat,
  onExportClick,
  isExporting,
  hasPhoto,
}) => {
  const formatLabel = exportFormat.toUpperCase();

  return (
    <header className="h-14 shrink-0 border-b border-white/[0.08] bg-[#111318] px-6 flex items-center justify-between gap-8 select-none">
      {/* Zone 1: Single-element brand wordmark */}
      <span className="text-[17px] font-bold tracking-[-0.02em] text-[#F4F6F8] whitespace-nowrap shrink-0">
        MatteCut
      </span>

      {/* Zone 2: 4 concise single-line text navigation actions */}
      <nav
        aria-label="Studio actions"
        className="hidden sm:flex items-center gap-7 text-[13px] font-medium text-[#9DA4B0]"
      >
        <button
          type="button"
          onClick={onUploadClick}
          className="hover:text-[#F4F6F8] transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer py-1 focus-visible:outline-none focus-visible:text-white"
        >
          Upload Photo
        </button>
        <button
          type="button"
          onClick={onPasteClick}
          className="hover:text-[#F4F6F8] transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer py-1 focus-visible:outline-none focus-visible:text-white"
        >
          Paste Image
        </button>
        <button
          type="button"
          onClick={onToggleCompare}
          aria-pressed={compareActive}
          className={`transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer py-1 focus-visible:outline-none ${
            compareActive
              ? 'text-white underline decoration-blue-500 decoration-2 underline-offset-8'
              : 'hover:text-[#F4F6F8]'
          }`}
        >
          Split Compare
        </button>
        <button
          type="button"
          onClick={onResetAll}
          className="hover:text-[#F4F6F8] transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer py-1 focus-visible:outline-none focus-visible:text-white"
        >
          Reset Edits
        </button>
      </nav>

      {/* Zone 3: Single primary CTA */}
      <div className="flex items-center shrink-0">
        <button
          type="button"
          onClick={onExportClick}
          disabled={!hasPhoto || isExporting}
          className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] disabled:opacity-45 disabled:pointer-events-none rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111318]"
        >
          <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{isExporting ? 'Exporting…' : `Export ${formatLabel}`}</span>
        </button>
      </div>
    </header>
  );
};
