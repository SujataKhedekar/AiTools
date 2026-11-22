import React, { useMemo, useState } from 'react';
import { ArrowUpRight, Download, Search, Trash2 } from 'lucide-react';
import type { SavedSectionEntry } from '../types/shopify';

interface SectionLibraryViewProps {
  entries: SavedSectionEntry[];
  onLoadEntry: (entry: SavedSectionEntry) => void;
  onDeleteEntry: (id: string) => void;
  onDownloadEntry: (entry: SavedSectionEntry) => void;
}

export const SectionLibraryView: React.FC<SectionLibraryViewProps> = ({
  entries,
  onLoadEntry,
  onDeleteEntry,
  onDownloadEntry,
}) => {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (item) =>
        item.result.sectionName.toLowerCase().includes(q) ||
        item.result.sectionSlug.toLowerCase().includes(q) ||
        item.result.detectedSectionType.toLowerCase().includes(q)
    );
  }, [entries, query]);

  if (entries.length === 0) {
    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-10 text-center">
        <h2 className="text-base font-semibold text-slate-900">
          No Generated Sections Saved Yet
        </h2>
        <p className="mt-1.5 text-sm text-slate-600">
          Every Liquid section you generate in Aivora is saved automatically here so you can reopen, preview, refine, or download it later.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Section Library</h2>
          <p className="text-xs text-slate-500 tabular-nums">
            {entries.length} generated Shopify Online Store 2.0 sections
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by name or section type..."
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
              <tr>
                <th className="px-5 py-3">Section</th>
                <th className="px-5 py-3">File Slug</th>
                <th className="px-5 py-3">Pattern</th>
                <th className="px-5 py-3">Validation</th>
                <th className="px-5 py-3">Created</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50/70">
                  <td className="px-5 py-3.5 font-medium text-slate-900">
                    {entry.result.sectionName}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs text-slate-600">
                    sections/{entry.result.sectionSlug}.liquid
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-600">
                    {entry.result.detectedSectionType}
                  </td>
                  <td className="px-5 py-3.5 text-xs">
                    {entry.validation.isValid ? (
                      <span className="font-medium text-emerald-700">Valid OS 2.0</span>
                    ) : (
                      <span className="font-medium text-red-700">
                        {entry.validation.errors.length} errors
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-500 tabular-nums">
                    {new Date(entry.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onLoadEntry(entry)}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
                      >
                        Open
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDownloadEntry(entry)}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
                        title="Download .liquid file"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteEntry(entry.id)}
                        className="inline-flex items-center justify-center rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        aria-label={`Delete ${entry.result.sectionName}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
