import React from 'react';
import { Download } from 'lucide-react';

interface TopBarProps {
  activeSection: 'workspace' | 'templates' | 'recent';
  recentCount: number;
  onSelectWorkspace: () => void;
  onSelectTemplates: () => void;
  onOpenRecent: () => void;
  onOpenExport: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeSection,
  recentCount,
  onSelectWorkspace,
  onSelectTemplates,
  onOpenRecent,
  onOpenExport,
}) => {
  return (
    <header className="sticky top-0 z-30 h-14 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-full max-w-[1600px] items-center justify-between gap-8 px-4 sm:px-6">
        {/* Zone 1: Single-element brand wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            onSelectWorkspace();
          }}
          className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
        >
          Aivora
        </a>

        {/* Zone 2: Clean single-line navigation links */}
        <nav aria-label="Primary" className="hidden md:flex items-center gap-7 text-sm font-medium">
          <button
            type="button"
            onClick={onSelectWorkspace}
            className={`cursor-pointer whitespace-nowrap shrink-0 border-b-2 py-4 transition-colors ${
              activeSection === 'workspace'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            QR Generator
          </button>
          <button
            type="button"
            onClick={onSelectTemplates}
            className={`cursor-pointer whitespace-nowrap shrink-0 border-b-2 py-4 transition-colors ${
              activeSection === 'templates'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Templates
          </button>
          <button
            type="button"
            onClick={onOpenRecent}
            className={`cursor-pointer whitespace-nowrap shrink-0 border-b-2 py-4 transition-colors ${
              activeSection === 'recent'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Recent Designs{recentCount > 0 ? ` (${recentCount})` : ''}
          </button>
          <button
            type="button"
            onClick={onOpenExport}
            className="cursor-pointer whitespace-nowrap shrink-0 border-b-2 border-transparent py-4 text-slate-600 hover:text-slate-900 transition-colors"
          >
            Export Studio
          </button>
        </nav>

        {/* Zone 3: Single primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onOpenExport}
            className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-slate-900 px-4 text-xs font-semibold text-white hover:bg-blue-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Download QR</span>
          </button>
        </div>
      </div>
    </header>
  );
};
