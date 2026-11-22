import { useState } from 'react';
import {
  Copy,
  Download,
  FilePlus2,
  FileText,
  Pencil,
  Search,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import { RESUME_TEMPLATES } from '../data/templates';
import { ResumeDocument } from '../types/resume';
import { calculateCompleteness, formatShortDate } from '../utils/storage';
import { exportResumeToPdf } from '../utils/exportPdf';
import { exportResumeToDocx } from '../utils/exportDocx';

interface MyResumesViewProps {
  resumes: ResumeDocument[];
  activeResumeId: string;
  onSelectEdit: (id: string) => void;
  onCreateBlank: () => void;
  onOpenGenerator: (mode: 'form' | 'upload') => void;
  onDuplicate: (id: string) => void;
  onRename: (id: string, newTitle: string) => void;
  onDelete: (id: string) => void;
}

export default function MyResumesView({
  resumes,
  activeResumeId,
  onSelectEdit,
  onCreateBlank,
  onOpenGenerator,
  onDuplicate,
  onRename,
  onDelete,
}: MyResumesViewProps) {
  const [search, setSearch] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filtered = resumes.filter((r) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      r.title.toLowerCase().includes(q) ||
      r.personal.fullName.toLowerCase().includes(q) ||
      r.targetRole.toLowerCase().includes(q)
    );
  });

  const commitRename = (id: string) => {
    const clean = renameDraft.trim();
    if (clean) {
      onRename(id, clean);
    }
    setRenamingId(null);
  };

  return (
    <div className="mx-auto max-w-[1440px] space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      {/* Header & Quick Start Actions */}
      <div className="flex flex-col justify-between gap-6 border-b border-white/[0.08] pb-7 lg:flex-row lg:items-end">
        <div className="max-w-2xl space-y-2">
          <p className="text-xs font-medium text-[#D4A843]">Aivora Career Workspace</p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-white">
            My Resumes
          </h1>
          <p className="text-sm leading-relaxed text-[#98A2B3]">
            Build ATS-ready resumes from scratch, generate structured drafts with AI, or import an existing PDF or DOCX file. Your resumes stay stored locally in your browser workspace and can be deleted at any time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => onOpenGenerator('form')}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#D4A843] px-4 text-sm font-semibold text-[#0B0E14] whitespace-nowrap transition-colors hover:bg-[#E3BB5C]"
          >
            <Sparkles className="h-4 w-4" />
            <span>Generate with AI</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenGenerator('upload')}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/[0.12] bg-[#181D29] px-4 text-sm font-medium text-white whitespace-nowrap transition-colors hover:border-[#D4A843]/50"
          >
            <Upload className="h-4 w-4 text-[#D4A843]" />
            <span>Import PDF / DOCX</span>
          </button>
          <button
            type="button"
            onClick={onCreateBlank}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/[0.1] bg-[#12161F] px-4 text-sm font-medium text-[#CBD5E1] whitespace-nowrap transition-colors hover:bg-white/[0.05] hover:text-white"
          >
            <FilePlus2 className="h-4 w-4" />
            <span>New Blank Resume</span>
          </button>
        </div>
      </div>

      {/* Search & Summary Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search resumes by title, name, or target role..."
            className="h-10 w-full rounded-lg border border-white/[0.1] bg-[#12161F] pl-9 pr-3 text-sm text-white placeholder-[#64748B] focus:border-[#D4A843] focus:outline-none"
          />
        </div>
        <div className="font-mono-tabular text-xs text-[#98A2B3]">
          {filtered.length} of {resumes.length} {resumes.length === 1 ? 'resume' : 'resumes'}
        </div>
      </div>

      {/* Resumes Table */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/[0.12] bg-[#12161F] p-12 text-center">
          <p className="font-display text-base font-semibold text-white">No matching resumes</p>
          <p className="mt-1.5 text-sm text-[#98A2B3]">
            Create a blank resume, import an existing PDF/DOCX, or clear your search filter.
          </p>
          <button
            type="button"
            onClick={onCreateBlank}
            className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-[#D4A843] px-4 text-sm font-semibold text-[#0B0E14] hover:bg-[#E3BB5C]"
          >
            <FilePlus2 className="h-4 w-4" />
            <span>Create New Resume</span>
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/[0.08] bg-[#12161F]">
          <table className="w-full min-w-[820px] border-collapse text-left">
            <thead>
              <tr className="border-b border-white/[0.08] text-xs font-medium text-[#98A2B3]">
                <th className="px-5 py-3.5">Resume Title</th>
                <th className="px-4 py-3.5">Template</th>
                <th className="px-4 py-3.5 text-right">Completeness</th>
                <th className="px-4 py-3.5 text-right">Created</th>
                <th className="px-4 py-3.5 text-right">Last Modified</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-sm">
              {filtered.map((res) => {
                const tpl = RESUME_TEMPLATES.find((t) => t.id === res.design.templateId);
                const comp = calculateCompleteness(res);
                const isActive = res.id === activeResumeId;

                return (
                  <tr
                    key={res.id}
                    className={`transition-colors hover:bg-white/[0.025] ${
                      isActive ? 'bg-[#D4A843]/[0.04]' : ''
                    }`}
                  >
                    <td className="px-5 py-4">
                      {renamingId === res.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            autoFocus
                            value={renameDraft}
                            onChange={(e) => setRenameDraft(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') commitRename(res.id);
                              if (e.key === 'Escape') setRenamingId(null);
                            }}
                            onBlur={() => commitRename(res.id)}
                            className="h-8 w-56 rounded-md border border-[#D4A843] bg-[#0B0E14] px-2.5 text-sm text-white focus:outline-none"
                          />
                        </div>
                      ) : (
                        <div>
                          <button
                            type="button"
                            onClick={() => onSelectEdit(res.id)}
                            className="font-display text-left text-sm font-semibold text-white hover:text-[#D4A843]"
                          >
                            {res.title || 'Untitled Resume'}
                          </button>
                          <div className="mt-0.5 text-xs text-[#98A2B3]">
                            <span>{res.personal.fullName || 'Unnamed candidate'}</span>
                            {res.targetRole && (
                              <>
                                <span aria-hidden="true"> · </span>
                                <span>{res.targetRole}</span>
                              </>
                            )}
                            {isActive && (
                              <>
                                <span aria-hidden="true"> · </span>
                                <span className="text-[#D4A843]">Active</span>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-4 text-xs text-[#CBD5E1]">
                      <div>{tpl?.name || 'Modern Professional'}</div>
                      <div className="text-[#64748B]">{res.design.pageSize}</div>
                    </td>

                    <td className="px-4 py-4 text-right font-mono-tabular text-xs">
                      <span
                        className={
                          comp.score >= 80
                            ? 'text-emerald-400'
                            : comp.score >= 50
                              ? 'text-amber-400'
                              : 'text-[#98A2B3]'
                        }
                      >
                        {comp.score}%
                      </span>
                    </td>

                    <td className="px-4 py-4 text-right font-mono-tabular text-xs text-[#98A2B3]">
                      {formatShortDate(res.createdAt)}
                    </td>

                    <td className="px-4 py-4 text-right font-mono-tabular text-xs text-[#CBD5E1]">
                      {formatShortDate(res.updatedAt)}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSelectEdit(res.id)}
                          className="inline-flex h-8 items-center rounded-md bg-[#181D29] px-3 text-xs font-medium text-white whitespace-nowrap transition-colors hover:bg-[#D4A843] hover:text-[#0B0E14]"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          title="Rename resume"
                          onClick={() => {
                            setRenamingId(res.id);
                            setRenameDraft(res.title);
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-md border border-white/[0.08] text-[#98A2B3] hover:text-white"
                          aria-label={`Rename ${res.title}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          title="Duplicate resume"
                          onClick={() => onDuplicate(res.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-md border border-white/[0.08] text-[#98A2B3] hover:text-white"
                          aria-label={`Duplicate ${res.title}`}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          title="Download PDF"
                          onClick={() => exportResumeToPdf(res)}
                          className="flex h-8 w-8 items-center justify-center rounded-md border border-white/[0.08] text-[#98A2B3] hover:text-[#D4A843]"
                          aria-label={`Download PDF for ${res.title}`}
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          title="Download DOCX"
                          onClick={() => exportResumeToDocx(res)}
                          className="flex h-8 w-8 items-center justify-center rounded-md border border-white/[0.08] text-[#98A2B3] hover:text-[#D4A843]"
                          aria-label={`Download DOCX for ${res.title}`}
                        >
                          <FileText className="h-3.5 w-3.5" />
                        </button>
                        {confirmDeleteId === res.id ? (
                          <button
                            type="button"
                            onClick={() => {
                              onDelete(res.id);
                              setConfirmDeleteId(null);
                            }}
                            onBlur={() => setConfirmDeleteId(null)}
                            className="h-8 rounded-md bg-red-600 px-2.5 text-xs font-semibold text-white whitespace-nowrap hover:bg-red-500"
                          >
                            Confirm
                          </button>
                        ) : (
                          <button
                            type="button"
                            title="Delete resume"
                            disabled={resumes.length <= 1}
                            onClick={() => setConfirmDeleteId(res.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-md border border-white/[0.08] text-[#98A2B3] hover:text-red-400 disabled:opacity-30"
                            aria-label={`Delete ${res.title}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
