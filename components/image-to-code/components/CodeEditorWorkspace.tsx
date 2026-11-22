import { useEffect, useMemo, useRef, useState } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, undo, redo } from '@codemirror/commands';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';
import {
  BookOpen,
  Check,
  Copy,
  Download,
  FileCode2,
  Folder,
  FolderOpen,
  RefreshCw,
  RotateCcw,
  RotateCw,
  X,
} from 'lucide-react';
import type { CodeExplanationResponse } from '../lib/apiClient';
import { downloadSingleFile } from '../lib/exportProject';
import type { GeneratedFile } from '../shared/types';

interface CodeEditorWorkspaceProps {
  files: GeneratedFile[];
  activeFilePath: string;
  onSelectFile: (path: string) => void;
  onUpdateFileContent: (path: string, nextContent: string) => void;
  onRegenerateComponent: (path: string, instruction?: string) => void;
  onExplainComponent: (file: GeneratedFile) => Promise<CodeExplanationResponse>;
  isBusy: boolean;
}

function getLanguageExtension(filePath: string) {
  const lower = filePath.toLowerCase();
  if (lower.endsWith('.tsx')) return javascript({ typescript: true, jsx: true });
  if (lower.endsWith('.ts')) return javascript({ typescript: true, jsx: false });
  if (lower.endsWith('.jsx')) return javascript({ typescript: false, jsx: true });
  if (lower.endsWith('.js')) return javascript({ typescript: false, jsx: false });
  if (lower.endsWith('.css')) return css();
  if (lower.endsWith('.json')) return json();
  if (lower.endsWith('.html') || lower.endsWith('.vue')) return html();
  return [];
}

export function CodeEditorWorkspace({
  files,
  activeFilePath,
  onSelectFile,
  onUpdateFileContent,
  onRegenerateComponent,
  onExplainComponent,
  isBusy,
}: CodeEditorWorkspaceProps) {
  const editorHostRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const latestUpdateCallback = useRef(onUpdateFileContent);
  latestUpdateCallback.current = onUpdateFileContent;

  const [copied, setCopied] = useState(false);
  const [collapsedDirs, setCollapsedDirs] = useState<Set<string>>(new Set());
  const [explanation, setExplanation] = useState<CodeExplanationResponse | null>(null);
  const [explaining, setExplaining] = useState(false);
  const [regenModalOpen, setRegenModalOpen] = useState(false);
  const [regenInstruction, setRegenInstruction] = useState('');

  const activeFile = useMemo(
    () => files.find((f) => f.path === activeFilePath) ?? files[0] ?? null,
    [files, activeFilePath]
  );

  // Group files by folder for clean IDE file explorer
  const groupedTree = useMemo(() => {
    const groups = new Map<string, GeneratedFile[]>();
    const sorted = [...files].sort((a, b) => a.path.localeCompare(b.path));
    for (const f of sorted) {
      const idx = f.path.lastIndexOf('/');
      const dir = idx > 0 ? f.path.slice(0, idx) : '(root)';
      const list = groups.get(dir) ?? [];
      list.push(f);
      groups.set(dir, list);
    }
    return Array.from(groups.entries());
  }, [files]);

  // Mount/recreate CodeMirror EditorView whenever active file path changes
  useEffect(() => {
    if (!editorHostRef.current || !activeFile) return;

    if (viewRef.current) {
      viewRef.current.destroy();
      viewRef.current = null;
    }

    const filePath = activeFile.path;
    const state = EditorState.create({
      doc: activeFile.content,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        getLanguageExtension(filePath),
        oneDark,
        EditorView.theme({
          '&': { height: '100%', fontSize: '12.5px' },
          '.cm-scroller': {
            overflow: 'auto',
            fontFamily: '"JetBrains Mono", ui-monospace, monospace',
          },
        }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            latestUpdateCallback.current(filePath, update.state.doc.toString());
          }
        }),
      ],
    });

    viewRef.current = new EditorView({
      state,
      parent: editorHostRef.current,
    });

    return () => {
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
    };
  }, [activeFile?.path]);

  // Sync external AI edits into CodeMirror if active file content changed externally
  useEffect(() => {
    const view = viewRef.current;
    if (!view || !activeFile) return;
    const currentDoc = view.state.doc.toString();
    if (currentDoc !== activeFile.content) {
      view.dispatch({
        changes: { from: 0, to: currentDoc.length, insert: activeFile.content },
      });
    }
  }, [activeFile?.content]);

  async function handleExplainClick() {
    if (!activeFile) return;
    setExplaining(true);
    try {
      const res = await onExplainComponent(activeFile);
      setExplanation(res);
    } finally {
      setExplaining(false);
    }
  }

  function handleCopyCode() {
    if (!activeFile) return;
    navigator.clipboard.writeText(activeFile.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  if (!activeFile) {
    return (
      <div className="flex h-full min-h-[460px] items-center justify-center rounded-lg border border-slate-200 bg-white p-8 text-center">
        <div>
          <FileCode2 className="mx-auto h-8 w-8 text-slate-300" aria-hidden="true" />
          <p className="mt-2 text-sm font-medium text-slate-800">
            No Generated Source Files Yet
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Run Analyze &amp; Generate to populate the modular project workspace.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-[540px] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
      {/* Editor Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="truncate font-mono text-xs font-medium text-slate-800">
            {activeFile.path}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => viewRef.current && undo(viewRef.current)}
            title="Undo"
            className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" aria-hidden="true" />
            Undo
          </button>
          <button
            type="button"
            onClick={() => viewRef.current && redo(viewRef.current)}
            title="Redo"
            className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <RotateCw className="h-3 w-3" aria-hidden="true" />
            Redo
          </button>
          <button
            type="button"
            disabled={explaining || isBusy}
            onClick={handleExplainClick}
            className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
          >
            <BookOpen className="h-3 w-3" aria-hidden="true" />
            {explaining ? 'Explaining...' : 'Explain'}
          </button>
          <button
            type="button"
            disabled={isBusy}
            onClick={() => setRegenModalOpen(true)}
            className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
          >
            <RefreshCw className="h-3 w-3" aria-hidden="true" />
            Regenerate
          </button>
          <button
            type="button"
            onClick={handleCopyCode}
            className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer whitespace-nowrap shrink-0"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-emerald-600" aria-hidden="true" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" aria-hidden="true" />
                Copy
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => downloadSingleFile(activeFile)}
            title="Download active file"
            className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Download className="h-3 w-3" aria-hidden="true" />
            File
          </button>
        </div>
      </div>

      {/* File Explorer + CodeMirror Split */}
      <div className="flex min-h-0 flex-1">
        <aside
          aria-label="Project file explorer"
          className="w-52 shrink-0 overflow-y-auto border-r border-slate-200 bg-slate-50/70 p-2"
        >
          <p className="mb-1.5 px-2 text-[11px] font-semibold text-slate-500">
            Files ({files.length})
          </p>
          <div className="space-y-1">
            {groupedTree.map(([dir, dirFiles]) => {
              const isCollapsed = collapsedDirs.has(dir);
              return (
                <div key={dir}>
                  <button
                    type="button"
                    onClick={() => {
                      const next = new Set(collapsedDirs);
                      if (next.has(dir)) next.delete(dir);
                      else next.add(dir);
                      setCollapsedDirs(next);
                    }}
                    className="flex w-full items-center gap-1.5 rounded px-1.5 py-1 text-left text-[11px] font-medium text-slate-600 hover:bg-slate-200/60 cursor-pointer"
                  >
                    {isCollapsed ? (
                      <Folder className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                    ) : (
                      <FolderOpen className="h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden="true" />
                    )}
                    <span className="truncate font-mono">{dir}</span>
                  </button>

                  {!isCollapsed && (
                    <div className="mt-0.5 space-y-0.5 pl-3">
                      {dirFiles.map((file) => {
                        const fileName = file.path.split('/').pop() ?? file.path;
                        const selected = file.path === activeFile.path;
                        return (
                          <button
                            key={file.path}
                            type="button"
                            onClick={() => onSelectFile(file.path)}
                            className={`flex w-full items-center gap-1.5 rounded px-2 py-1 text-left font-mono text-xs transition-colors cursor-pointer ${
                              selected
                                ? 'bg-blue-600 text-white font-medium'
                                : 'text-slate-700 hover:bg-slate-200/70'
                            }`}
                          >
                            <span className="truncate">{fileName}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* CodeMirror Host */}
        <div ref={editorHostRef} className="min-h-[440px] flex-1 overflow-hidden bg-[#282c34]" />
      </div>

      {/* Inline Explanation Panel */}
      {explanation && (
        <div className="border-t border-slate-200 bg-slate-50 p-4 text-xs space-y-2.5 max-h-60 overflow-y-auto">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-slate-900">
              Component Explanation — {activeFile.path}
            </h4>
            <button
              type="button"
              onClick={() => setExplanation(null)}
              className="rounded p-1 text-slate-500 hover:bg-slate-200 cursor-pointer"
              aria-label="Close explanation"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
          <p className="text-slate-700 leading-relaxed">{explanation.overview}</p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <p className="font-semibold text-slate-800">Responsibilities</p>
              <ul className="mt-1 list-disc pl-4 space-y-0.5 text-slate-600">
                {explanation.responsibilities.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-semibold text-slate-800">Accessibility &amp; Styling</p>
              <p className="mt-1 text-slate-600">{explanation.stylingAndResponsiveness}</p>
              <ul className="mt-1 list-disc pl-4 space-y-0.5 text-slate-600">
                {explanation.accessibilityNotes.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Regenerate Component Modal */}
      {regenModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
          onClick={() => setRegenModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-semibold text-slate-900">
              Regenerate Component: {activeFile.path}
            </h3>
            <p className="text-xs text-slate-500">
              Optionally provide instructions for how this specific file should be refined. Exported component names and parent imports will be preserved.
            </p>
            <textarea
              rows={3}
              value={regenInstruction}
              onChange={(e) => setRegenInstruction(e.target.value)}
              placeholder="e.g., Add keyboard escape handling to the mobile drawer and improve spacing..."
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-blue-600 focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRegenModalOpen(false)}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const instr = regenInstruction.trim() || undefined;
                  setRegenModalOpen(false);
                  setRegenInstruction('');
                  onRegenerateComponent(activeFile.path, instr);
                }}
                className="rounded-md bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 cursor-pointer"
              >
                Regenerate File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
