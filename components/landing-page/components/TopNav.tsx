import React from 'react';
import { ArrowRight, Download, Loader2 } from 'lucide-react';
import type { WorkspaceTab } from '../types/aivora';

interface TopNavProps {
  activeTab: WorkspaceTab;
  onSelectTab: (tab: WorkspaceTab) => void;
  hasStrategy: boolean;
  hasPage: boolean;
  isBusy: boolean;
  onPrimaryAction: () => void;
}

const TABS: { id: WorkspaceTab; label: string; requiresStrategy?: boolean; requiresPage?: boolean }[] = [
  { id: 'brief', label: 'Brief' },
  { id: 'strategy', label: 'Strategy', requiresStrategy: true },
  { id: 'editor', label: 'Editor & Preview', requiresPage: true },
  { id: 'seo-cro', label: 'SEO & CRO', requiresPage: true },
  { id: 'export', label: 'Code & Export', requiresPage: true },
];

export function TopNav({
  activeTab,
  onSelectTab,
  hasStrategy,
  hasPage,
  isBusy,
  onPrimaryAction,
}: TopNavProps) {
  const actionLabel =
    activeTab === 'brief'
      ? 'Build Strategy'
      : activeTab === 'strategy'
        ? 'Generate Page'
        : 'Export ZIP';

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-8 px-6">
        {/* Zone 1: Single text wordmark */}
        <button
          type="button"
          onClick={() => onSelectTab('brief')}
          className="text-lg font-bold tracking-tight text-slate-950 whitespace-nowrap shrink-0 cursor-pointer"
        >
          AIVORA
        </button>

        {/* Zone 2: Concise single-line navigation tabs */}
        <nav aria-label="Workspace stages" className="hidden md:flex items-center gap-6">
          {TABS.map((tab) => {
            const disabled =
              (tab.requiresStrategy && !hasStrategy) || (tab.requiresPage && !hasPage);
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                disabled={disabled}
                onClick={() => onSelectTab(tab.id)}
                className={`relative py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 ${
                  active
                    ? 'text-slate-950'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {tab.label}
                {active && (
                  <span className="absolute inset-x-0 -bottom-[17px] h-0.5 bg-blue-700" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single primary action button */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            disabled={isBusy || (activeTab !== 'brief' && !hasStrategy)}
            onClick={onPrimaryAction}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isBusy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : activeTab === 'editor' || activeTab === 'seo-cro' || activeTab === 'export' ? (
              <Download className="h-4 w-4" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
            <span>{isBusy ? 'Working...' : actionLabel}</span>
          </button>
        </div>
      </div>

      {/* Mobile stage switcher */}
      <div className="flex md:hidden items-center gap-2 overflow-x-auto border-t border-slate-100 px-4 py-2">
        {TABS.map((tab) => {
          const disabled =
            (tab.requiresStrategy && !hasStrategy) || (tab.requiresPage && !hasPage);
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelectTab(tab.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 ${
                active
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100 disabled:opacity-40'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </header>
  );
}
