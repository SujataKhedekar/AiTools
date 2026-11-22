import { Download, FolderOpen, Trash2 } from 'lucide-react';
import { exportCatalogToCsv, exportCatalogToExcel } from '../services/exportEngine';
import type { CatalogDraft } from '../shared/types';

interface DraftsWorkspaceProps {
  drafts: CatalogDraft[];
  onLoadDraft: (draft: CatalogDraft) => void;
  onDeleteDraft: (draftId: string) => void;
}

export function DraftsWorkspace({ drafts, onLoadDraft, onDeleteDraft }: DraftsWorkspaceProps) {
  return (
    <div className="mx-auto max-w-[1440px] space-y-6 px-6 py-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white p-6">
        <div>
          <h1 className="font-display text-xl font-semibold text-zinc-900">Saved Product Drafts</h1>
          <p className="mt-1 text-xs text-zinc-600">
            Reopen edited product listings in the studio or export multiple saved items together.
          </p>
        </div>

        {drafts.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                exportCatalogToCsv(
                  drafts.map((d) => d.listing),
                  'aivora-saved-drafts'
                )
              }
              className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-800 hover:bg-zinc-50"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export All CSV</span>
            </button>
            <button
              type="button"
              onClick={() =>
                exportCatalogToExcel(
                  drafts.map((d) => d.listing),
                  'aivora-saved-drafts'
                )
              }
              className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-3 py-2 text-xs font-semibold text-white hover:bg-zinc-800"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export All Excel</span>
            </button>
          </div>
        )}
      </div>

      {drafts.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center">
          <p className="text-sm font-medium text-zinc-900">No saved drafts yet</p>
          <p className="mt-1 text-xs text-zinc-500">
            Generate a listing in Studio and click Save Draft to store it here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {drafts.map((draft) => (
            <div
              key={draft.draftId}
              className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-5"
            >
              <div>
                <div className="text-xs text-zinc-500">
                  {draft.listing.categoryLabel} · {draft.listing.subcategory} ·{' '}
                  <span className="font-mono">{draft.listing.sku}</span>
                </div>
                <h2 className="mt-1.5 font-display text-base font-semibold text-zinc-900">
                  {draft.listing.productName}
                </h2>
                <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-zinc-600">
                  {draft.listing.shortDescription}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-zinc-200 pt-3">
                <span className="font-mono text-[11px] text-zinc-400 tabular-nums">
                  {new Date(draft.updatedAt).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onDeleteDraft(draft.draftId)}
                    aria-label="Delete draft"
                    className="rounded p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onLoadDraft(draft)}
                    className="inline-flex items-center gap-1 rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-50"
                  >
                    <FolderOpen className="h-3.5 w-3.5" />
                    <span>Open</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
