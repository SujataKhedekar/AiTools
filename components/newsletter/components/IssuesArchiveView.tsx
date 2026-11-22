import { Copy, Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { IssueStatus, NewsletterIssue } from '../types/newsletter';
import { computeIssueStats } from '../utils/newsletterExport';
import { ResilientImage } from './ResilientImage';

interface IssuesArchiveViewProps {
  issues: NewsletterIssue[];
  activeIssueId: string;
  onOpenIssue: (id: string) => void;
  onCreateBlank: () => void;
  onDuplicateIssue: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onDeleteIssue: (id: string) => void;
}

export function IssuesArchiveView({
  issues,
  activeIssueId,
  onOpenIssue,
  onCreateBlank,
  onDuplicateIssue,
  onToggleStatus,
  onDeleteIssue,
}: IssuesArchiveViewProps) {
  const [filter, setFilter] = useState<'all' | IssueStatus>('all');
  const [query, setQuery] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filtered = issues.filter((issue) => {
    if (filter !== 'all' && issue.status !== filter) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      issue.subject.toLowerCase().includes(q) ||
      issue.preheader.toLowerCase().includes(q) ||
      issue.publicationName.toLowerCase().includes(q) ||
      issue.issueNumber.toLowerCase().includes(q)
    );
  });

  const formatUpdated = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-8 border-b border-neutral-200">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-neutral-900 [text-wrap:balance]">
            Issues & Drafts
          </h1>
          <p className="text-sm text-neutral-500 mt-1.5">
            Every issue saves automatically in your browser. Open any draft to continue writing or duplicate a past edition.
          </p>
        </div>

        <button
          type="button"
          onClick={onCreateBlank}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-neutral-900 text-white text-xs font-medium hover:bg-neutral-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Blank Issue</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-md w-fit">
          {(
            [
              { id: 'all', label: `All (${issues.length})` },
              {
                id: 'draft',
                label: `Drafts (${issues.filter((i) => i.status === 'draft').length})`,
              },
              {
                id: 'ready',
                label: `Ready (${issues.filter((i) => i.status === 'ready').length})`,
              },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
                filter === tab.id
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search subject or publication..."
            aria-label="Search issues"
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-neutral-200 rounded-md text-neutral-900 focus:border-[#1D4ED8]"
          />
        </div>
      </div>

      {/* Issues List */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center border border-neutral-200 rounded-lg bg-white">
          <p className="font-serif text-lg text-neutral-900">No matching issues</p>
          <p className="text-xs text-neutral-500 mt-1">
            Adjust your search filter or start a new blank issue.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-neutral-200 border-y border-neutral-200 bg-white">
          {filtered.map((issue) => {
            const stats = computeIssueStats(issue);
            const coverBlock = issue.blocks.find((b) => b.type === 'image');
            const isActive = issue.id === activeIssueId;
            const isDeleting = confirmDeleteId === issue.id;

            return (
              <div
                key={issue.id}
                className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5 hover:bg-[#FAFAFA] transition-colors"
              >
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  {coverBlock && coverBlock.type === 'image' && (
                    <div className="hidden sm:block w-28 aspect-video rounded overflow-hidden border border-neutral-200 shrink-0 bg-neutral-100">
                      <ResilientImage src={coverBlock.src} alt={coverBlock.alt} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-neutral-500">
                      <span>{issue.publicationName}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">Issue {issue.issueNumber}</span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={
                          issue.status === 'ready'
                            ? 'text-emerald-700 font-medium'
                            : 'text-neutral-600'
                        }
                      >
                        {issue.status === 'ready' ? 'Ready to send' : 'Draft'}
                      </span>
                      {isActive && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-[#1D4ED8] font-medium">Currently open</span>
                        </>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenIssue(issue.id)}
                      className="text-left block mt-1.5 group cursor-pointer"
                    >
                      <h2 className="font-serif text-xl font-semibold text-neutral-900 group-hover:text-[#1D4ED8] transition-colors leading-snug">
                        {issue.subject || 'Untitled newsletter issue'}
                      </h2>
                    </button>

                    {issue.preheader.trim() && (
                      <p className="text-xs text-neutral-500 mt-1 line-clamp-1">
                        {issue.preheader}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-neutral-400 mt-2.5 font-mono tabular-nums">
                      <span>{stats.wordCount} words</span>
                      <span aria-hidden="true">·</span>
                      <span>{stats.readingMinutes} min read</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-sans">Edited {formatUpdated(issue.updatedAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Row Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {isDeleting ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-rose-700">Delete issue?</span>
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteIssue(issue.id);
                          setConfirmDeleteId(null);
                        }}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-rose-700 hover:bg-rose-800 rounded-md cursor-pointer whitespace-nowrap"
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2.5 py-1.5 text-xs text-neutral-600 hover:text-neutral-900 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => onOpenIssue(issue.id)}
                        className="px-3.5 py-2 text-xs font-medium text-neutral-900 bg-white border border-neutral-200 hover:border-neutral-400 rounded-md transition-colors whitespace-nowrap cursor-pointer"
                      >
                        Open
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleStatus(issue.id)}
                        className="px-3 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors whitespace-nowrap cursor-pointer"
                      >
                        {issue.status === 'ready' ? 'Mark Draft' : 'Mark Ready'}
                      </button>
                      <button
                        type="button"
                        title="Duplicate issue"
                        aria-label={`Duplicate ${issue.subject}`}
                        onClick={() => onDuplicateIssue(issue.id)}
                        className="p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      {issues.length > 1 && (
                        <button
                          type="button"
                          title="Delete issue"
                          aria-label={`Delete ${issue.subject}`}
                          onClick={() => setConfirmDeleteId(issue.id)}
                          className="p-2 text-neutral-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
