import { Menu, Mic, X } from 'lucide-react';
import { useState } from 'react';

export type NavTab = 'studio' | 'library' | 'history' | 'settings';

interface HeaderProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenVoiceClone: () => void;
}

const NAV_ITEMS: { id: NavTab; label: string }[] = [
  { id: 'studio', label: 'Text to Speech' },
  { id: 'library', label: 'Voice Library' },
  { id: 'history', label: 'My Audio' },
  { id: 'settings', label: 'Settings' },
];

export function Header({ activeTab, onSelectTab, onOpenVoiceClone }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-[#111318]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1360px] items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Brand Wordmark */}
        <button
          type="button"
          onClick={() => onSelectTab('studio')}
          className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8065F5] rounded-md"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#8065F5] text-white">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 10v4" />
              <path d="M8 7v10" />
              <path d="M12 4v16" />
              <path d="M16 7v10" />
              <path d="M20 10v4" />
            </svg>
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            VoxAI
          </span>
        </button>

        {/* Zone 2: Clean Single-Line Navigation Links */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-7"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`relative py-1.5 text-sm font-medium whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8065F5] rounded-sm ${
                  isActive
                    ? 'text-slate-900 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-[#A1A1AA] dark:hover:text-white'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-[19px] h-[2px] bg-[#8065F5]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenVoiceClone}
            className="hidden sm:inline-flex items-center gap-2 rounded-lg bg-[#8065F5] px-4 py-2 text-sm font-medium text-white hover:bg-[#7053eb] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A78BFA]"
          >
            <Mic className="h-4 w-4" aria-hidden="true" />
            <span>Clone Voice</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            className="inline-flex md:hidden items-center justify-center rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-[#A1A1AA] dark:hover:bg-[#191C24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8065F5]"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-white/10 bg-white dark:bg-[#191C24] px-4 py-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectTab(item.id);
                  setMobileOpen(false);
                }}
                className={`block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#8065F5]/15 text-[#8065F5] dark:text-[#A78BFA]'
                    : 'text-slate-700 hover:bg-slate-100 dark:text-[#A1A1AA] dark:hover:bg-[#202430]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => {
              onOpenVoiceClone();
              setMobileOpen(false);
            }}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[#8065F5] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#7053eb]"
          >
            <Mic className="h-4 w-4" aria-hidden="true" />
            <span>Clone Voice</span>
          </button>
        </div>
      )}
    </header>
  );
}
