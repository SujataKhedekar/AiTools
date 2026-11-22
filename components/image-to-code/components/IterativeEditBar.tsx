import { useState } from 'react';
import { diffLines } from 'diff';
import { History, Send, X } from 'lucide-react';
import type { GeneratedFile, VersionSnapshot } from '../shared/types';

interface IterativeEditBarProps {
  files: GeneratedFile[];
  versions: VersionSnapshot[];
  isBusy: boolean;
  onApplyEdit: (instruction: string, targetFilePath?: string) => void;
  onRestoreVersion: (snapshot: VersionSnapshot) => void;
}

const QUICK_REFINEMENTS = [
  'Make the hero section more modern',
  'Change the primary color to blue',
  'Make cards equal height',
  'Improve mobile navigation and spacing',
  'Add subtle hover transitions on buttons and cards',
];

export function IterativeEditBar({
  files,
  versions,
  isBusy,
  onApplyEdit,
  onRestoreVersion,
}: IterativeEditBarProps) {
  const [instruction, setInstruction] = useState('');
  const [targetFile, setTargetFile] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number>(Math.max(0, versions.length - 1));
  const [diffFile, setDiffFile] = useState<string>('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!instruction.trim() || isBusy) return;
    onApplyEdit(instruction.trim(), targetFile || undefined);
    setInstruction('');
  }

  const currentSnapshot = versions[selectedIdx];
  const previousSnapshot = selectedIdx > 0 ? versions[selectedIdx - 1] : null;

  const comparableFiles = currentSnapshot?.files ?? [];
  const activeDiffPath =
    diffFile && comparableFiles.some((f) => f.path === diffFile)
      ? diffFile
      : comparableFiles[0]?.path ?? '';

  const prevContent =
    previousSnapshot?.files.find((f) => f.path === activeDiffPath)?.content ?? '';
  const nextContent =
    currentSnapshot?.files.find((f) => f.path === activeDiffPath)?.content ?? '';

  const lineDiffs = historyOpen ? diffLines(prevContent, nextContent) : [];

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3.5 space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-800">
          Iterative AI Refinement
        </span>
        <div className="flex items-center gap-2">
          <select
            value={targetFile}
            onChange={(e) => setTargetFile(e.target.value)}
            aria-label="Target file for refinement"
            className="max-w-[200px] rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 focus:border-blue-500 focus:outline-none"
          >
            <option value="">Auto-detect relevant files</option>
            {files.map((f) => (
              <option key={f.path} value={f.path}>
                {f.path}
              </option>
            ))}
          </select>

          <button
            type="button"
            disabled={versions.length === 0}
            onClick={() => {
              setSelectedIdx(Math.max(0, versions.length - 1));
              setHistoryOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
          >
            <History className="h-3.5 w-3.5" aria-hidden="true" />
            Versions &amp; Diff ({versions.length})
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={instruction}
          disabled={files.length === 0 || isBusy}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder={
            files.length === 0
              ? 'Generate code first to enable natural language edits...'
              : 'Describe a refinement (e.g., "Reduce section padding and make the navbar sticky")'
          }
          className="min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 disabled:bg-slate-50 focus:border-blue-600 focus:outline-none"
        />
        <button
          type="submit"
          disabled={files.length === 0 || !instruction.trim() || isBusy}
          className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
        >
          <Send className="h-3.5 w-3.5" aria-hidden="true" />
          {isBusy ? 'Updating...' : 'Apply Edit'}
        </button>
      </form>

      {files.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {QUICK_REFINEMENTS.map((preset) => (
            <button
              key={preset}
              type="button"
              disabled={isBusy}
              onClick={() => onApplyEdit(preset, targetFile || undefined)}
              className="rounded border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
            >
              {preset}
            </button>
          ))}
        </div>
      )}

      {/* Version Comparison & Diff Modal */}
      {historyOpen && currentSnapshot && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4"
          onClick={() => setHistoryOpen(false)}
        >
          <div
            className="flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Version History &amp; Code Comparison
                </h3>
                <p className="text-xs text-slate-500">
                  Compare previous and updated snapshots line by line, or restore an earlier version.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHistoryOpen(false)}
                className="rounded p-1 text-slate-500 hover:bg-slate-100 cursor-pointer"
                aria-label="Close version diff modal"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="flex min-h-0 flex-1">
              {/* Snapshot Timeline */}
              <aside className="w-64 shrink-0 overflow-y-auto border-r border-slate-200 bg-slate-50 p-3 space-y-2">
                {versions.map((v, idx) => (
                  <div
                    key={v.id}
                    className={`rounded-lg border p-2.5 text-xs transition-colors ${
                      idx === selectedIdx
                        ? 'border-blue-600 bg-white'
                        : 'border-slate-200 bg-white/70 hover:border-slate-300'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedIdx(idx)}
                      className="w-full text-left cursor-pointer"
                    >
                      <div className="flex items-center justify-between font-mono text-[11px] text-slate-500 tabular-nums">
                        <span>v{idx + 1}</span>
                        <span>{new Date(v.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="mt-1 font-medium text-slate-900 line-clamp-2">
                        {v.instruction}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500 line-clamp-2">
                        {v.summary}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onRestoreVersion(v);
                        setHistoryOpen(false);
                      }}
                      className="mt-2 w-full rounded border border-slate-200 bg-slate-50 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
                    >
                      Restore v{idx + 1}
                    </button>
                  </div>
                ))}
              </aside>

              {/* Diff Viewer */}
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2">
                  <select
                    value={activeDiffPath}
                    onChange={(e) => setDiffFile(e.target.value)}
                    className="rounded border border-slate-300 bg-white px-2.5 py-1 font-mono text-xs text-slate-800"
                  >
                    {comparableFiles.map((f) => (
                      <option key={f.path} value={f.path}>
                        {f.path}
                      </option>
                    ))}
                  </select>
                  <span className="text-xs text-slate-500">
                    {previousSnapshot
                      ? `Comparing v${selectedIdx} → v${selectedIdx + 1}`
                      : 'Initial Generated Version'}
                  </span>
                </div>

                <pre className="flex-1 overflow-auto bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-100">
                  {lineDiffs.map((part, i) => {
                    const colorClass = part.added
                      ? 'bg-emerald-950/70 text-emerald-300 block'
                      : part.removed
                        ? 'bg-red-950/70 text-red-300 block'
                        : 'text-slate-300 block';
                    const prefix = part.added ? '+ ' : part.removed ? '- ' : '  ';
                    return (
                      <span key={i} className={colorClass}>
                        {part.value
                          .split('\n')
                          .filter((line, idx, arr) => idx < arr.length - 1 || line !== '')
                          .map((line) => `${prefix}${line}`)
                          .join('\n')}
                        {'\n'}
                      </span>
                    );
                  })}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
