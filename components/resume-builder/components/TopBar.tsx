import { Download } from 'lucide-react';
import { ActiveAppView } from '../types/resume';

interface TopBarProps {
  activeView: ActiveAppView;
  onNavigate: (view: ActiveAppView) => void;
  onOpenExport: () => void;
}

const NAV_ITEMS: Array<{ id: ActiveAppView; label: string }> = [
  { id: 'resumes', label: 'My Resumes' },
  { id: 'editor', label: 'Editor' },
  { id: 'generator', label: 'AI Generator' },
  { id: 'ats', label: 'ATS Checker' },
  { id: 'cover-letter', label: 'Cover Letter' },
];

export default function TopBar({ activeView, onNavigate, onOpenExport }: TopBarProps) {
  return (
    <header className="no-print sticky top-0 z-30 h-15 border-b border-white/[0.08] bg-[#0B0E14]/95 backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-[1680px] items-center justify-between gap-8 px-4 sm:px-6">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() => onNavigate('resumes')}
          className="font-display flex shrink-0 items-center gap-2.5 text-lg font-bold tracking-tight text-white whitespace-nowrap transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A843]"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#D4A843] text-sm font-extrabold text-[#0B0E14]">
            A
          </span>
          <span>Aivora</span>
        </button>

        {/* Zone 2: Clean single-line navigation links */}
        <nav
          aria-label="Primary navigation"
          className="flex items-center gap-5 overflow-x-auto sm:gap-7"
        >
          {NAV_ITEMS.map((item) => {
            const active = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`relative py-2 text-sm font-medium whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A843] ${
                  active ? 'text-white' : 'text-[#98A2B3] hover:text-[#ECEFF4]'
                }`}
              >
                {item.label}
                {active && (
                  <span className="absolute inset-x-0 -bottom-[11px] h-[2px] bg-[#D4A843]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single Primary Action */}
        <div className="flex shrink-0 items-center">
          <button
            type="button"
            onClick={onOpenExport}
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-[#D4A843] px-4 text-sm font-semibold text-[#0B0E14] whitespace-nowrap transition-colors hover:bg-[#E3BB5C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A843] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0E14]"
          >
            <Download className="h-4 w-4" />
            <span>Export Resume</span>
          </button>
        </div>
      </div>
    </header>
  );
}
