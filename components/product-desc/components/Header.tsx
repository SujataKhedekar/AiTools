export type AppView = 'studio' | 'bulk' | 'drafts' | 'docs';

interface HeaderProps {
  activeView: AppView;
  onNavigate: (view: AppView) => void;
  hasActiveListing: boolean;
  onOpenExport: () => void;
  onResetWorkspace: () => void;
}

export function Header({
  activeView,
  onNavigate,
  hasActiveListing,
  onOpenExport,
  onResetWorkspace,
}: HeaderProps) {
  const navItems: Array<{ id: AppView; label: string }> = [
    { id: 'studio', label: 'Studio' },
    { id: 'bulk', label: 'Bulk Catalog' },
    { id: 'drafts', label: 'Saved Drafts' },
    { id: 'docs', label: 'Docs & Specs' },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-8 px-6 py-3.5">
        <button
          type="button"
          onClick={() => onNavigate('studio')}
          className="font-display text-lg font-bold tracking-tight text-zinc-900 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 rounded"
        >
          Aivora
        </button>

        <nav
          aria-label="Primary Workspace Navigation"
          className="flex items-center gap-6 overflow-x-auto"
        >
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`py-1.5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 border-b-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 ${
                  isActive
                    ? 'border-zinc-900 text-zinc-900'
                    : 'border-transparent text-zinc-500 hover:text-zinc-900 hover:border-zinc-300'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center shrink-0">
          {hasActiveListing ? (
            <button
              type="button"
              onClick={onOpenExport}
              className="rounded-md bg-zinc-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-zinc-800 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
            >
              Export Listing
            </button>
          ) : (
            <button
              type="button"
              onClick={onResetWorkspace}
              className="rounded-md bg-zinc-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-zinc-800 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
            >
              New Product
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
