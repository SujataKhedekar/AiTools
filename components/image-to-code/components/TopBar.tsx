import { Download } from 'lucide-react';

export type WorkspaceSection = 'workspace' | 'design-system' | 'components' | 'documentation';

interface TopBarProps {
  activeSection: WorkspaceSection;
  onSelectSection: (section: WorkspaceSection) => void;
  hasGeneratedFiles: boolean;
  onExportZip: () => void;
}

const NAV_ITEMS: Array<{ id: WorkspaceSection; label: string }> = [
  { id: 'workspace', label: 'Workspace' },
  { id: 'design-system', label: 'Design System' },
  { id: 'components', label: 'Component Plan' },
  { id: 'documentation', label: 'Documentation' },
];

export function TopBar({
  activeSection,
  onSelectSection,
  hasGeneratedFiles,
  onExportZip,
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-8 border-b border-slate-200 bg-white px-5">
      <a
        href="#workspace"
        onClick={(e) => {
          e.preventDefault();
          onSelectSection('workspace');
        }}
        className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-blue-600 rounded"
      >
        AIVORA
      </a>

      <nav aria-label="Workspace sections" className="hidden md:flex items-center gap-6">
        {NAV_ITEMS.map((item) => {
          const active = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectSection(item.id)}
              className={`relative py-4 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-600 ${
                active ? 'text-slate-900' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {item.label}
              {active && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-blue-600" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          disabled={!hasGeneratedFiles}
          onClick={onExportZip}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
          Export ZIP
        </button>
      </div>
    </header>
  );
}
