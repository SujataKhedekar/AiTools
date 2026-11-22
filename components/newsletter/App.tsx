import {
  Maximize2,
  Minimize2,
  Plus,
  Redo2,
  Undo2,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { BlockEditor } from './components/BlockEditor';
import { ExportModal } from './components/ExportModal';
import { GeneratorStudio } from './components/GeneratorStudio';
import { InspectorRail } from './components/InspectorRail';
import { IssuesArchiveView } from './components/IssuesArchiveView';
import { NewsletterPreview } from './components/NewsletterPreview';
import { OutlineRail } from './components/OutlineRail';
import { TemplatesView } from './components/TemplatesView';
import {
  createDefaultBlock,
  createId,
  INITIAL_ISSUES,
  THEME_PRESETS,
} from './data/presets';
import {
  BlockType,
  NewsletterBlock,
  NewsletterDesign,
  NewsletterIssue,
  NewsletterTemplate,
  StudioView,
  SubjectOption,
} from './types/newsletter';
import { computeIssueStats, runEditorialChecks } from './utils/newsletterExport';

const STORAGE_KEY = 'folio_press_issues_v1';

function loadStoredIssues(): NewsletterIssue[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_ISSUES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as NewsletterIssue[];
    }
  } catch {
    // Ignore corrupt storage and use starter issues
  }
  return INITIAL_ISSUES;
}

export default function App() {
  const [issues, setIssues] = useState<NewsletterIssue[]>(loadStoredIssues);
  const [activeIssueId, setActiveIssueId] = useState<string>(
    () => loadStoredIssues()[0].id
  );
  const [view, setView] = useState<StudioView>('generate');
  const [subjectOptions, setSubjectOptions] = useState<SubjectOption[]>(() => {
    const first = loadStoredIssues()[0];
    return [
      {
        subject: first.subject,
        preheader: first.preheader,
        angle: 'Editorial',
      },
    ];
  });
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  // Per-session undo/redo stacks for the active issue
  const [past, setPast] = useState<NewsletterIssue[]>([]);
  const [future, setFuture] = useState<NewsletterIssue[]>([]);

  const activeIssue = useMemo(
    () => issues.find((i) => i.id === activeIssueId) ?? issues[0],
    [issues, activeIssueId]
  );

  // Persist to localStorage automatically
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(issues));
    } catch {
      // Ignore storage quota errors
    }
  }, [issues]);

  const commitIssueChange = useCallback(
    (updater: (current: NewsletterIssue) => NewsletterIssue, recordHistory = true) => {
      setIssues((prev) => {
        const current = prev.find((i) => i.id === activeIssueId) ?? prev[0];
        if (!current) return prev;
        const updated: NewsletterIssue = {
          ...updater(current),
          updatedAt: new Date().toISOString(),
        };
        if (recordHistory) {
          setPast((p) => [...p.slice(-39), current]);
          setFuture([]);
        }
        return prev.map((item) => (item.id === current.id ? updated : item));
      });
    },
    [activeIssueId]
  );

  const handleUndo = useCallback(() => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    setPast((p) => p.slice(0, -1));
    setFuture((f) => [activeIssue, ...f.slice(0, 39)]);
    setIssues((prev) =>
      prev.map((item) => (item.id === previous.id ? previous : item))
    );
  }, [past, activeIssue]);

  const handleRedo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    setFuture((f) => f.slice(1));
    setPast((p) => [...p.slice(-39), activeIssue]);
    setIssues((prev) => prev.map((item) => (item.id === next.id ? next : item)));
  }, [future, activeIssue]);

  // Global keyboard shortcuts (Undo/Redo & Export)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;

      if (e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setExportOpen((v) => !v);
        return;
      }

      const tag = (e.target as HTMLElement | null)?.tagName;
      const inEditable = tag === 'INPUT' || tag === 'TEXTAREA';
      if (!inEditable && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleUndo, handleRedo]);

  const handleIssuePatch = useCallback(
    (patch: Partial<NewsletterIssue>) => {
      commitIssueChange((curr) => ({ ...curr, ...patch }));
    },
    [commitIssueChange]
  );

  const handleDesignPatch = useCallback(
    (patch: Partial<NewsletterDesign>) => {
      commitIssueChange((curr) => ({
        ...curr,
        design: { ...curr.design, ...patch },
      }));
    },
    [commitIssueChange]
  );

  const handleInsertBlock = useCallback(
    (type: BlockType) => {
      const newBlock = createDefaultBlock(type);
      commitIssueChange((curr) => {
        if (!selectedBlockId) {
          return { ...curr, blocks: [...curr.blocks, newBlock] };
        }
        const idx = curr.blocks.findIndex((b) => b.id === selectedBlockId);
        if (idx === -1) {
          return { ...curr, blocks: [...curr.blocks, newBlock] };
        }
        const nextBlocks = [...curr.blocks];
        nextBlocks.splice(idx + 1, 0, newBlock);
        return { ...curr, blocks: nextBlocks };
      });
      setSelectedBlockId(newBlock.id);
      requestAnimationFrame(() => {
        document
          .getElementById(`editor-block-${newBlock.id}`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    },
    [commitIssueChange, selectedBlockId]
  );

  const handleUpdateBlock = useCallback(
    (updated: NewsletterBlock) => {
      commitIssueChange((curr) => ({
        ...curr,
        blocks: curr.blocks.map((b) => (b.id === updated.id ? updated : b)),
      }));
    },
    [commitIssueChange]
  );

  const handleMoveBlock = useCallback(
    (blockId: string, direction: 'up' | 'down') => {
      commitIssueChange((curr) => {
        const idx = curr.blocks.findIndex((b) => b.id === blockId);
        if (idx === -1) return curr;
        const target = direction === 'up' ? idx - 1 : idx + 1;
        if (target < 0 || target >= curr.blocks.length) return curr;
        const copy = [...curr.blocks];
        const [item] = copy.splice(idx, 1);
        copy.splice(target, 0, item);
        return { ...curr, blocks: copy };
      });
    },
    [commitIssueChange]
  );

  const handleDuplicateBlock = useCallback(
    (blockId: string) => {
      let createdId = '';
      commitIssueChange((curr) => {
        const idx = curr.blocks.findIndex((b) => b.id === blockId);
        if (idx === -1) return curr;
        const clone = structuredClone(curr.blocks[idx]);
        clone.id = createId(clone.type);
        if (clone.type === 'links') {
          clone.items = clone.items.map((it) => ({ ...it, id: createId('lnk') }));
        }
        if (clone.type === 'metrics') {
          clone.items = clone.items.map((it) => ({ ...it, id: createId('met') }));
        }
        createdId = clone.id;
        const copy = [...curr.blocks];
        copy.splice(idx + 1, 0, clone);
        return { ...curr, blocks: copy };
      });
      if (createdId) setSelectedBlockId(createdId);
    },
    [commitIssueChange]
  );

  const handleDeleteBlock = useCallback(
    (blockId: string) => {
      commitIssueChange((curr) => ({
        ...curr,
        blocks: curr.blocks.filter((b) => b.id !== blockId),
      }));
      setSelectedBlockId((prev) => (prev === blockId ? null : prev));
    },
    [commitIssueChange]
  );

  const nextIssueNumber = useMemo(() => {
    const nums = issues
      .map((i) => parseInt(i.issueNumber, 10))
      .filter((n) => !Number.isNaN(n));
    return String((nums.length ? Math.max(...nums) : issues.length) + 1);
  }, [issues]);

  const handleCreateBlankIssue = useCallback(() => {
    const today = new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
    const fresh: NewsletterIssue = {
      id: createId('issue'),
      issueNumber: nextIssueNumber,
      publicationName: activeIssue.publicationName || 'The Margin Dispatch',
      subject: 'Untitled Issue',
      preheader: '',
      authorName: activeIssue.authorName || 'Editorial Desk',
      senderEmail: activeIssue.senderEmail || 'editor@publication.org',
      publishDate: today,
      status: 'draft',
      updatedAt: new Date().toISOString(),
      footerNote: activeIssue.footerNote,
      addressLine: activeIssue.addressLine,
      unsubscribeLabel: activeIssue.unsubscribeLabel,
      design: {
        ...THEME_PRESETS['gallery-stark'].design,
        typography: 'editorial-serif',
        headerLayout: 'masthead',
        maxWidth: 620,
      },
      blocks: [
        createDefaultBlock('paragraph'),
      ],
    };
    setIssues((prev) => [fresh, ...prev]);
    setActiveIssueId(fresh.id);
    setPast([]);
    setFuture([]);
    setSelectedBlockId(fresh.blocks[0].id);
    setView('write');
  }, [activeIssue, nextIssueNumber]);

  const handleUseTemplate = useCallback(
    (template: NewsletterTemplate) => {
      const fresh = template.createIssue(nextIssueNumber);
      setIssues((prev) => [fresh, ...prev]);
      setActiveIssueId(fresh.id);
      setPast([]);
      setFuture([]);
      setSelectedBlockId(fresh.blocks[0]?.id ?? null);
      setView('write');
    },
    [nextIssueNumber]
  );

  const handleGeneratedIssue = useCallback(
    (fresh: NewsletterIssue, options: SubjectOption[]) => {
      setIssues((prev) => [fresh, ...prev]);
      setActiveIssueId(fresh.id);
      setSubjectOptions(options);
      setPast([]);
      setFuture([]);
      setSelectedBlockId(fresh.blocks[0]?.id ?? null);
    },
    []
  );

  const handleApplySubjectOption = useCallback(
    (option: SubjectOption) => {
      handleIssuePatch({
        subject: option.subject,
        preheader: option.preheader,
      });
    },
    [handleIssuePatch]
  );

  const handleOpenIssue = useCallback(
    (id: string) => {
      setActiveIssueId(id);
      const found = issues.find((i) => i.id === id);
      if (found) {
        setSubjectOptions([
          { subject: found.subject, preheader: found.preheader, angle: 'Current' },
        ]);
      }
      setPast([]);
      setFuture([]);
      setSelectedBlockId(null);
      setView('write');
    },
    [issues]
  );

  const handleDuplicateIssue = useCallback(
    (id: string) => {
      const source = issues.find((i) => i.id === id);
      if (!source) return;
      const copy: NewsletterIssue = {
        ...structuredClone(source),
        id: createId('issue'),
        issueNumber: nextIssueNumber,
        subject: `${source.subject} (Copy)`,
        status: 'draft',
        updatedAt: new Date().toISOString(),
      };
      setIssues((prev) => [copy, ...prev]);
      setActiveIssueId(copy.id);
      setPast([]);
      setFuture([]);
      setView('write');
    },
    [issues, nextIssueNumber]
  );

  const handleToggleIssueStatus = useCallback((id: string) => {
    setIssues((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: item.status === 'ready' ? 'draft' : 'ready',
              updatedAt: new Date().toISOString(),
            }
          : item
      )
    );
  }, []);

  const handleDeleteIssue = useCallback(
    (id: string) => {
      setIssues((prev) => {
        if (prev.length <= 1) return prev;
        const remaining = prev.filter((item) => item.id !== id);
        if (activeIssueId === id && remaining[0]) {
          setActiveIssueId(remaining[0].id);
        }
        return remaining;
      });
    },
    [activeIssueId]
  );

  const stats = useMemo(() => computeIssueStats(activeIssue), [activeIssue]);
  const checks = useMemo(
    () => runEditorialChecks(activeIssue, stats),
    [activeIssue, stats]
  );

  const headingFontClass =
    activeIssue.design.typography === 'modern-sans' ? 'font-sans' : 'font-serif';
  const bodyFontClass =
    activeIssue.design.typography === 'book-monograph' ? 'font-serif' : 'font-sans';
  const headerCentered = activeIssue.design.headerLayout === 'masthead';

  return (
    <div className="newsletter-root min-h-screen flex flex-col bg-[#FAFAFA] text-[#171717]">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 h-[60px] bg-white border-b border-neutral-200 px-6 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() => setView('generate')}
          className="font-serif text-lg font-semibold tracking-tight text-neutral-950 whitespace-nowrap shrink-0 cursor-pointer"
        >
          Folio Press
        </button>

        {/* Zone 2: 5 Clean Single-Line Navigation Links */}
        <nav
          aria-label="Primary studio navigation"
          className="flex items-center gap-5 sm:gap-7 text-sm"
        >
          {(
            [
              { id: 'generate', label: 'Generate' },
              { id: 'write', label: 'Edit' },
              { id: 'preview', label: 'Preview' },
              { id: 'issues', label: 'Issues' },
              { id: 'templates', label: 'Templates' },
            ] as { id: StudioView; label: string }[]
          ).map((navItem) => {
            const active = view === navItem.id;
            return (
              <button
                key={navItem.id}
                type="button"
                onClick={() => setView(navItem.id)}
                className={`relative py-5 font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'text-neutral-950'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                {navItem.label}
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-[2px] bg-[#1D4ED8]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 Primary CTA */}
        <div className="shrink-0">
          <button
            type="button"
            onClick={() => setExportOpen(true)}
            className="px-4 py-2 rounded-md bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Export HTML
          </button>
        </div>
      </header>

      {/* Main Studio Content */}
      <main className="flex-1 flex flex-col">
        {view === 'generate' && (
          <GeneratorStudio
            activeIssue={activeIssue}
            subjectOptions={subjectOptions}
            nextIssueNumber={nextIssueNumber}
            onGeneratedIssue={handleGeneratedIssue}
            onUpdateSubjectOptions={setSubjectOptions}
            onApplySubjectOption={handleApplySubjectOption}
            onOpenEditor={() => setView('write')}
            onOpenPreview={() => setView('preview')}
            onOpenExport={() => setExportOpen(true)}
          />
        )}

        {view === 'write' && (
          <div className="flex-1 flex flex-col lg:flex-row min-h-[calc(100vh-60px)]">
            {/* Left Outline & Insert Rail */}
            {!focusMode && (
              <OutlineRail
                blocks={activeIssue.blocks}
                selectedBlockId={selectedBlockId}
                onSelectBlock={setSelectedBlockId}
                onInsertBlock={handleInsertBlock}
              />
            )}

            {/* Center Editorial Canvas */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#FAFAFA]">
              {/* Quiet Workspace Sub-Bar */}
              <div className="px-6 py-2.5 border-b border-neutral-200 bg-[#FAFAFA] flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-neutral-500">
                  <span className="font-medium text-neutral-800">
                    Issue {activeIssue.issueNumber}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">
                    {stats.wordCount} words
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">
                    {stats.readingMinutes} min read
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {activeIssue.status === 'ready' ? 'Ready to send' : 'Draft'}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>Saved locally</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={past.length === 0}
                    onClick={handleUndo}
                    title="Undo (Ctrl/Cmd+Z)"
                    aria-label="Undo"
                    className="p-1.5 rounded text-neutral-600 hover:text-neutral-950 hover:bg-neutral-200/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={future.length === 0}
                    onClick={handleRedo}
                    title="Redo (Ctrl/Cmd+Shift+Z)"
                    aria-label="Redo"
                    className="p-1.5 rounded text-neutral-600 hover:text-neutral-950 hover:bg-neutral-200/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <Redo2 className="w-3.5 h-3.5" />
                  </button>

                  <span aria-hidden="true" className="mx-1.5 text-neutral-300">
                    |
                  </span>

                  <button
                    type="button"
                    onClick={() => handleToggleIssueStatus(activeIssue.id)}
                    className="px-2.5 py-1.5 rounded text-xs font-medium text-neutral-700 hover:text-neutral-950 hover:bg-neutral-200/60 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    {activeIssue.status === 'ready' ? 'Move to Draft' : 'Mark Ready'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setFocusMode((f) => !f)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium text-neutral-700 hover:text-neutral-950 hover:bg-neutral-200/60 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    {focusMode ? (
                      <>
                        <Minimize2 className="w-3.5 h-3.5" />
                        <span>Show Panels</span>
                      </>
                    ) : (
                      <>
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>Focus</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Scrollable Paper Desk */}
              <div
                className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 sm:py-10"
                onClick={(e) => {
                  if (e.target === e.currentTarget) setSelectedBlockId(null);
                }}
              >
                <div
                  className="mx-auto rounded-md border px-6 sm:px-12 py-10 sm:py-12 transition-colors"
                  style={{
                    maxWidth: `${activeIssue.design.maxWidth + 96}px`,
                    backgroundColor: activeIssue.design.backgroundColor,
                    borderColor: activeIssue.design.borderColor,
                  }}
                >
                  {/* Editable Masthead */}
                  <div
                    className={`pb-7 mb-6 border-b ${
                      headerCentered ? 'text-center' : 'text-left'
                    }`}
                    style={{ borderColor: activeIssue.design.borderColor }}
                  >
                    <div
                      className={`flex flex-wrap items-center gap-2 text-xs uppercase tracking-wider mb-3 ${
                        headerCentered ? 'justify-center' : 'justify-start'
                      }`}
                      style={{ color: activeIssue.design.mutedColor }}
                    >
                      <input
                        type="text"
                        aria-label="Publication name"
                        value={activeIssue.publicationName}
                        onChange={(e) =>
                          handleIssuePatch({ publicationName: e.target.value })
                        }
                        className={`bg-transparent uppercase tracking-wider w-44 max-w-full ${
                          headerCentered ? 'text-center' : 'text-left'
                        }`}
                        style={{ color: activeIssue.design.mutedColor }}
                      />
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        Issue {activeIssue.issueNumber}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{activeIssue.publishDate}</span>
                    </div>

                    <input
                      type="text"
                      aria-label="Newsletter subject line"
                      value={activeIssue.subject}
                      onChange={(e) =>
                        handleIssuePatch({ subject: e.target.value })
                      }
                      placeholder="Write your newsletter subject..."
                      className={`w-full bg-transparent ${headingFontClass} text-3xl sm:text-4xl font-semibold tracking-tight leading-tight placeholder:text-neutral-300 ${
                        headerCentered ? 'text-center' : 'text-left'
                      }`}
                      style={{ color: activeIssue.design.textColor }}
                    />

                    {activeIssue.design.headerLayout !== 'minimal' && (
                      <>
                        <input
                          type="text"
                          aria-label="Newsletter preheader subtitle"
                          value={activeIssue.preheader}
                          onChange={(e) =>
                            handleIssuePatch({ preheader: e.target.value })
                          }
                          placeholder="Add a concise preheader / deck line..."
                          className={`w-full bg-transparent ${bodyFontClass} text-base mt-3 placeholder:text-neutral-300 ${
                            headerCentered ? 'text-center' : 'text-left'
                          }`}
                          style={{ color: activeIssue.design.mutedColor }}
                        />
                        <p
                          className="text-xs mt-4"
                          style={{ color: activeIssue.design.mutedColor }}
                        >
                          By {activeIssue.authorName}
                        </p>
                      </>
                    )}
                  </div>

                  {/* Editable Modular Blocks */}
                  <div className="space-y-2">
                    {activeIssue.blocks.map((block, index) => (
                      <BlockEditor
                        key={block.id}
                        block={block}
                        design={activeIssue.design}
                        issueSubject={activeIssue.subject}
                        index={index}
                        total={activeIssue.blocks.length}
                        isSelected={selectedBlockId === block.id}
                        onSelect={() => setSelectedBlockId(block.id)}
                        onUpdate={handleUpdateBlock}
                        onMove={(dir) => handleMoveBlock(block.id, dir)}
                        onDuplicate={() => handleDuplicateBlock(block.id)}
                        onDelete={() => handleDeleteBlock(block.id)}
                      />
                    ))}
                  </div>

                  {/* Quick Append Row */}
                  <div
                    className="mt-8 pt-6 border-t flex flex-wrap items-center gap-2"
                    style={{ borderColor: activeIssue.design.borderColor }}
                  >
                    <span className="text-xs text-neutral-400 mr-1">Append:</span>
                    {(
                      [
                        { type: 'paragraph', label: 'Paragraph' },
                        { type: 'heading', label: 'Heading' },
                        { type: 'image', label: 'Photograph' },
                        { type: 'quote', label: 'Pull Quote' },
                        { type: 'links', label: 'Curated Links' },
                        { type: 'button', label: 'Button' },
                      ] as { type: BlockType; label: string }[]
                    ).map((item) => (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => handleInsertBlock(item.type)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded text-xs text-neutral-600 hover:text-neutral-950 border border-neutral-200 hover:border-neutral-400 bg-white/80 transition-colors whitespace-nowrap cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Quiet Footer Preview */}
                  <div
                    className={`mt-10 pt-6 border-t text-xs leading-relaxed space-y-1 ${
                      headerCentered ? 'text-center' : 'text-left'
                    }`}
                    style={{
                      borderColor: activeIssue.design.borderColor,
                      color: activeIssue.design.mutedColor,
                    }}
                  >
                    <p>{activeIssue.footerNote}</p>
                    <p>{activeIssue.addressLine}</p>
                    <p className="underline underline-offset-2 opacity-80">
                      {activeIssue.unsubscribeLabel}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Inspector Rail */}
            {!focusMode && (
              <InspectorRail
                issue={activeIssue}
                stats={stats}
                checks={checks}
                onChangeIssue={handleIssuePatch}
                onChangeDesign={handleDesignPatch}
              />
            )}
          </div>
        )}

        {view === 'preview' && (
          <NewsletterPreview
            issue={activeIssue}
            onOpenExport={() => setExportOpen(true)}
          />
        )}

        {view === 'issues' && (
          <IssuesArchiveView
            issues={issues}
            activeIssueId={activeIssue.id}
            onOpenIssue={handleOpenIssue}
            onCreateBlank={handleCreateBlankIssue}
            onDuplicateIssue={handleDuplicateIssue}
            onToggleStatus={handleToggleIssueStatus}
            onDeleteIssue={handleDeleteIssue}
          />
        )}

        {view === 'templates' && (
          <TemplatesView onUseTemplate={handleUseTemplate} />
        )}
      </main>

      {/* Export Modal */}
      <ExportModal
        issue={activeIssue}
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
      />
    </div>
  );
}
