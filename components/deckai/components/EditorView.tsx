import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BarChart3,
  Bold,
  Check,
  Copy,
  Download,
  Image as ImageIcon,
  Italic,
  LayoutTemplate,
  Loader2,
  Play,
  Plus,
  Redo2,
  Share2,
  Shapes,
  Sparkles,
  Trash2,
  Type as TypeIcon,
  Underline,
  Undo2,
  Wand2,
} from 'lucide-react';
import { createBlankSlide } from '../lib/templates';
import { CURATED_VISUAL_ASSETS, DECK_THEMES } from '../lib/themes';
import type {
  ChartElement,
  IconElement,
  ImageElement,
  Presentation,
  ShapeElement,
  Slide,
  SlideElement,
  SlideLayout,
  TextElement,
} from '../types/deck';
import { SlideCanvasRenderer } from './SlideCanvasRenderer';

interface EditorViewProps {
  presentation: Presentation;
  token: string | null;
  onBack: () => void;
  onSavePresentation: (updated: Presentation) => Promise<void>;
  onOpenExport: (deck: Presentation) => void;
  onOpenPreview: (deck: Presentation, slideIndex: number) => void;
  onRequireAuth: () => void;
}

const AI_QUICK_COMMANDS = [
  'Make this slide more professional',
  'Shorten the text',
  'Make the content more persuasive',
  'Rewrite this slide for investors',
  'Change the design to minimalist',
  'Add a relevant chart',
  'Generate a better headline',
  'Add visual storytelling',
];

const ICON_OPTIONS = [
  'Zap',
  'Target',
  'TrendingUp',
  'Shield',
  'Layers',
  'Users',
  'Globe',
  'Award',
  'BarChart3',
  'Rocket',
  'CheckCircle2',
  'Cpu',
];

export const EditorView: React.FC<EditorViewProps> = ({
  presentation: initialPresentation,
  token,
  onBack,
  onSavePresentation,
  onOpenExport,
  onOpenPreview,
  onRequireAuth,
}) => {
  const [deck, setDeck] = useState<Presentation>(initialPresentation);
  const [history, setHistory] = useState<Slide[][]>([initialPresentation.slides]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [rightTab, setRightTab] = useState<'inspector' | 'ai'>('inspector');

  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [showSharePopover, setShowSharePopover] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);
  const [showAddSlideMenu, setShowAddSlideMenu] = useState(false);
  const [dragSlideIdx, setDragSlideIdx] = useState<number | null>(null);

  // AI Assistant state
  const [aiInstruction, setAiInstruction] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [altLayouts, setAltLayouts] = useState<Slide[]>([]);
  const [loadingAlts, setLoadingAlts] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeSlide = deck.slides[Math.min(activeSlideIdx, Math.max(0, deck.slides.length - 1))];
  const selectedElement =
    activeSlide?.elements.find((el) => el.id === selectedElementId) || null;
  const activeTheme =
    DECK_THEMES.find((t) => t.id === deck.themeId) || DECK_THEMES[0];

  const scheduleAutoSave = useCallback(
    (nextDeck: Presentation) => {
      if (!token) {
        setSaveState('unsaved');
        return;
      }
      setSaveState('saving');
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(async () => {
        try {
          await onSavePresentation(nextDeck);
          setSaveState('saved');
        } catch {
          setSaveState('unsaved');
        }
      }, 700);
    },
    [onSavePresentation, token]
  );

  const commitSlides = useCallback(
    (nextSlides: Slide[], recordHistory = true) => {
      setDeck((prev) => {
        const nextDeck = { ...prev, slides: nextSlides };
        scheduleAutoSave(nextDeck);
        return nextDeck;
      });

      if (recordHistory) {
        setHistory((prev) => {
          const sliced = prev.slice(0, historyIndex + 1);
          const updated = [...sliced, nextSlides].slice(-30);
          setHistoryIndex(updated.length - 1);
          return updated;
        });
      }
    },
    [historyIndex, scheduleAutoSave]
  );

  const handleUndo = useCallback(() => {
    if (historyIndex <= 0) return;
    const prevIdx = historyIndex - 1;
    const prevSlides = history[prevIdx];
    setHistoryIndex(prevIdx);
    setDeck((d) => {
      const next = { ...d, slides: prevSlides };
      scheduleAutoSave(next);
      return next;
    });
    setSelectedElementId(null);
  }, [history, historyIndex, scheduleAutoSave]);

  const handleRedo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const nextIdx = historyIndex + 1;
    const nextSlides = history[nextIdx];
    setHistoryIndex(nextIdx);
    setDeck((d) => {
      const next = { ...d, slides: nextSlides };
      scheduleAutoSave(next);
      return next;
    });
    setSelectedElementId(null);
  }, [history, historyIndex, scheduleAutoSave]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleUndo, handleRedo]);

  const updateCurrentSlide = (patch: Partial<Slide>, recordHistory = true) => {
    const nextSlides = deck.slides.map((s, idx) =>
      idx === activeSlideIdx ? { ...s, ...patch } : s
    );
    commitSlides(nextSlides, recordHistory);
  };

  const updateElement = (id: string, patch: Partial<SlideElement>) => {
    if (!activeSlide) return;
    const nextElements = activeSlide.elements.map((el) =>
      el.id === id ? ({ ...el, ...patch } as SlideElement) : el
    );
    updateCurrentSlide({ elements: nextElements });
  };

  const deleteElement = (id: string) => {
    if (!activeSlide) return;
    updateCurrentSlide({
      elements: activeSlide.elements.filter((el) => el.id !== id),
    });
    setSelectedElementId(null);
  };

  const addElement = (kind: 'text' | 'shape' | 'image' | 'icon' | 'chart') => {
    if (!activeSlide) return;
    const uid = `${kind}_${Math.random().toString(36).slice(2, 8)}`;
    let newEl: SlideElement;

    if (kind === 'text') {
      newEl = {
        id: uid,
        type: 'text',
        x: 15,
        y: 25,
        w: 45,
        h: 16,
        content: 'Double-click to edit text',
        fontSize: 22,
        fontFamily: activeTheme.fontDisplay,
        fontWeight: 'semibold',
        fontStyle: 'normal',
        textDecoration: 'none',
        textAlign: 'left',
        color: activeTheme.textColor,
        lineHeight: 1.35,
      } satisfies TextElement;
    } else if (kind === 'shape') {
      newEl = {
        id: uid,
        type: 'shape',
        shapeKind: 'roundRect',
        x: 20,
        y: 30,
        w: 28,
        h: 24,
        fillColor: activeTheme.surfaceColor,
        strokeColor: activeTheme.accentColor,
        strokeWidth: 1,
        borderRadius: 14,
      } satisfies ShapeElement;
    } else if (kind === 'image') {
      newEl = {
        id: uid,
        type: 'image',
        x: 52,
        y: 18,
        w: 38,
        h: 56,
        src: CURATED_VISUAL_ASSETS[0].src,
        alt: 'Visual graphic',
        objectFit: 'cover',
        borderRadius: 12,
      } satisfies ImageElement;
    } else if (kind === 'icon') {
      newEl = {
        id: uid,
        type: 'icon',
        x: 12,
        y: 22,
        w: 5.5,
        h: 9.5,
        iconName: 'Zap',
        color: activeTheme.accentColor,
        backgroundColor: activeTheme.surfaceColor,
        borderRadius: 12,
      } satisfies IconElement;
    } else {
      newEl = {
        id: uid,
        type: 'chart',
        chartType: 'bar',
        title: 'Quarterly Growth Metrics',
        x: 10,
        y: 26,
        w: 50,
        h: 56,
        data: [
          { label: 'Q1', value: 22 },
          { label: 'Q2', value: 38 },
          { label: 'Q3', value: 57 },
          { label: 'Q4', value: 84 },
        ],
        primaryColor: activeTheme.accentColor,
        secondaryColor: activeTheme.secondaryAccent,
        textColor: activeTheme.textColor,
        showGrid: true,
      } satisfies ChartElement;
    }

    updateCurrentSlide({ elements: [...activeSlide.elements, newEl] });
    setSelectedElementId(uid);
    setRightTab('inspector');
  };

  const handleAddSlide = (layout: SlideLayout) => {
    const newSlide = createBlankSlide(activeTheme, layout);
    const nextSlides = [...deck.slides];
    nextSlides.splice(activeSlideIdx + 1, 0, newSlide);
    commitSlides(nextSlides);
    setActiveSlideIdx(activeSlideIdx + 1);
    setSelectedElementId(null);
    setShowAddSlideMenu(false);
  };

  const handleDuplicateSlide = (idx: number) => {
    const src = deck.slides[idx];
    if (!src) return;
    const clone: Slide = {
      ...JSON.parse(JSON.stringify(src)),
      id: `sld_${Math.random().toString(36).slice(2, 9)}`,
      title: `${src.title} (Copy)`,
    };
    const nextSlides = [...deck.slides];
    nextSlides.splice(idx + 1, 0, clone);
    commitSlides(nextSlides);
    setActiveSlideIdx(idx + 1);
  };

  const handleDeleteSlide = (idx: number) => {
    if (deck.slides.length <= 1) return;
    const nextSlides = deck.slides.filter((_, i) => i !== idx);
    commitSlides(nextSlides);
    setActiveSlideIdx(Math.max(0, Math.min(idx, nextSlides.length - 1)));
    setSelectedElementId(null);
  };

  const reorderSlides = (fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx || toIdx < 0 || toIdx >= deck.slides.length) return;
    const next = [...deck.slides];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    commitSlides(next);
    setActiveSlideIdx(toIdx);
  };

  const applyThemeToDeck = (themeId: string) => {
    const theme = DECK_THEMES.find((t) => t.id === themeId);
    if (!theme) return;
    const nextSlides = deck.slides.map((s) => ({
      ...s,
      backgroundColor: theme.backgroundColor,
      accentColor: theme.accentColor,
      elements: s.elements.map((el) => {
        if (el.type === 'text') {
          return {
            ...el,
            color: el.fontSize >= 26 ? theme.textColor : el.color,
          };
        }
        if (el.type === 'chart') {
          return {
            ...el,
            primaryColor: theme.accentColor,
            secondaryColor: theme.secondaryAccent,
            textColor: theme.textColor,
          };
        }
        return el;
      }),
    }));
    setDeck((prev) => {
      const nextDeck = { ...prev, themeId, slides: nextSlides };
      scheduleAutoSave(nextDeck);
      return nextDeck;
    });
  };

  const runAiEditSlide = async (instructionText: string) => {
    if (!activeSlide || !instructionText.trim()) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch('/api/ai/edit-slide', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          slide: activeSlide,
          instruction: instructionText.trim(),
          presentationContext: {
            title: deck.title,
            presentationType: deck.presentationType,
            themeId: deck.themeId,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI slide edit failed.');
      const nextSlides = deck.slides.map((s, idx) =>
        idx === activeSlideIdx ? data.slide : s
      );
      commitSlides(nextSlides);
      setAiInstruction('');
      setSelectedElementId(null);
    } catch (err: unknown) {
      setAiError(err instanceof Error ? err.message : 'Unable to update slide.');
    } finally {
      setAiLoading(false);
    }
  };

  const runGenerateAlternativeLayouts = async () => {
    if (!activeSlide) return;
    setLoadingAlts(true);
    setAiError(null);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch('/api/ai/alternative-layouts', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          slide: activeSlide,
          presentationContext: {
            title: deck.title,
            presentationType: deck.presentationType,
            themeId: deck.themeId,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate alternative layouts.');
      setAltLayouts(data.variations || []);
    } catch (err: unknown) {
      setAiError(err instanceof Error ? err.message : 'Unable to generate layouts.');
    } finally {
      setLoadingAlts(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedElement || selectedElement.type !== 'image') return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        updateElement(selectedElement.id, { src: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleToggleShare = async () => {
    if (!token) {
      onRequireAuth();
      return;
    }
    const nextPublic = !deck.isPublic;
    const nextDeck = { ...deck, isPublic: nextPublic };
    setDeck(nextDeck);
    await onSavePresentation(nextDeck);
  };

  const shareUrl = `${window.location.origin}/?deck=${deck.publicId}`;

  return (
    <div className="h-screen flex flex-col bg-slate-100 overflow-hidden">
      {/* TOP TOOLBAR */}
      <header className="h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between gap-4 shrink-0 z-30">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0"
            title="Back to Workspace"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={deck.title}
            onChange={(e) => {
              const title = e.target.value;
              setDeck((prev) => {
                const next = { ...prev, title };
                scheduleAutoSave(next);
                return next;
              });
            }}
            className="text-sm font-bold text-slate-900 bg-transparent border border-transparent hover:border-slate-200 focus:border-indigo-500 focus:bg-white rounded-lg px-2.5 py-1 focus:outline-none min-w-[160px] max-w-xs truncate"
          />

          <span className="text-xs text-slate-400 hidden sm:inline whitespace-nowrap">
            {saveState === 'saving'
              ? 'Saving...'
              : saveState === 'saved'
                ? 'Saved'
                : token
                  ? 'Unsaved'
                  : 'Sign in to save'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            disabled={historyIndex <= 0}
            onClick={handleUndo}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-35"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={historyIndex >= history.length - 1}
            onClick={handleRedo}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-35"
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-slate-200 mx-1" />

          <button
            type="button"
            onClick={() => onOpenPreview(deck, activeSlideIdx)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Play className="w-3.5 h-3.5" />
            Preview
          </button>

          <button
            type="button"
            onClick={() => setRightTab(rightTab === 'ai' ? 'inspector' : 'ai')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors ${
              rightTab === 'ai'
                ? 'bg-indigo-600 text-white'
                : 'border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            AI Assistant
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSharePopover((v) => !v)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Share2 className="w-3.5 h-3.5" />
              Share
            </button>

            {showSharePopover && (
              <div className="absolute right-0 top-11 w-72 bg-white border border-slate-200 rounded-xl shadow-xl p-4 z-40">
                <div className="text-xs font-bold text-slate-900 mb-1">Share Presentation</div>
                <p className="text-[11px] text-slate-500 mb-3">
                  Allow anyone with the link to view this presentation in read-only mode.
                </p>
                <label className="flex items-center justify-between text-xs font-medium text-slate-700 mb-3 cursor-pointer">
                  <span>Public read-only link</span>
                  <input
                    type="checkbox"
                    checked={deck.isPublic}
                    onChange={handleToggleShare}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </label>
                {deck.isPublic && (
                  <div className="flex items-center gap-1.5">
                    <input
                      readOnly
                      value={shareUrl}
                      className="flex-1 px-2.5 py-1.5 text-[11px] font-mono bg-slate-50 border border-slate-200 rounded-lg truncate"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(shareUrl);
                        setCopiedShareLink(true);
                        setTimeout(() => setCopiedShareLink(false), 1800);
                      }}
                      className="px-2.5 py-1.5 bg-slate-900 text-white text-[11px] font-semibold rounded-lg"
                    >
                      {copiedShareLink ? <Check className="w-3.5 h-3.5" /> : 'Copy'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => onOpenExport(deck)}
            className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
        </div>
      </header>

      {/* THREE-PANEL EDITOR WORKSPACE */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* LEFT SIDEBAR: Slide Thumbnails & Management */}
        <aside className="w-56 lg:w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
          <div className="p-3 border-b border-slate-200 flex items-center justify-between gap-2 relative">
            <span className="text-xs font-bold text-slate-700">
              Slides ({deck.slides.length})
            </span>
            <button
              type="button"
              onClick={() => setShowAddSlideMenu((v) => !v)}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Slide
            </button>

            {showAddSlideMenu && (
              <div className="absolute left-3 right-3 top-12 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 z-30">
                {(
                  [
                    { layout: 'content-split', label: 'Split Content & Image' },
                    { layout: 'title', label: 'Title Cover Slide' },
                    { layout: 'market', label: 'Market Chart & KPI' },
                    { layout: 'financials', label: 'Financial Trajectory' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.layout}
                    type="button"
                    onClick={() => handleAddSlide(opt.layout)}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {deck.slides.map((slide, idx) => {
              const isActive = idx === activeSlideIdx;
              return (
                <div
                  key={slide.id}
                  draggable
                  onDragStart={() => setDragSlideIdx(idx)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (dragSlideIdx !== null) {
                      reorderSlides(dragSlideIdx, idx);
                      setDragSlideIdx(null);
                    }
                  }}
                  className={`group rounded-xl p-1.5 border transition-colors ${
                    isActive
                      ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between px-1 mb-1">
                    <span className="text-[11px] font-mono tabular-nums font-semibold text-slate-500">
                      {idx + 1}
                    </span>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => reorderSlides(idx, idx - 1)}
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                        title="Move up"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === deck.slides.length - 1}
                        onClick={() => reorderSlides(idx, idx + 1)}
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                        title="Move down"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDuplicateSlide(idx)}
                        className="p-1 text-slate-400 hover:text-slate-700"
                        title="Duplicate slide"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      {deck.slides.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteSlide(idx)}
                          className="p-1 text-slate-400 hover:text-red-600"
                          title="Delete slide"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSlideIdx(idx);
                      setSelectedElementId(null);
                      setAltLayouts([]);
                    }}
                    className="w-full aspect-video rounded-lg overflow-hidden border border-slate-200 block"
                  >
                    <SlideCanvasRenderer slide={slide} />
                  </button>
                </div>
              );
            })}
          </div>
        </aside>

        {/* CENTER CANVAS: Insert Bar + 16:9 Stage + Speaker Notes */}
        <main className="flex-1 flex flex-col min-w-0 bg-slate-100">
          {/* Quick Insert Bar */}
          <div className="h-11 bg-white/80 border-b border-slate-200 px-4 flex items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <span className="text-[11px] font-semibold text-slate-400 mr-1">Insert:</span>
              <button
                type="button"
                onClick={() => addElement('text')}
                className="px-2.5 py-1 rounded-md hover:bg-slate-100 text-xs font-medium text-slate-700 flex items-center gap-1.5 whitespace-nowrap"
              >
                <TypeIcon className="w-3.5 h-3.5" /> Text
              </button>
              <button
                type="button"
                onClick={() => addElement('image')}
                className="px-2.5 py-1 rounded-md hover:bg-slate-100 text-xs font-medium text-slate-700 flex items-center gap-1.5 whitespace-nowrap"
              >
                <ImageIcon className="w-3.5 h-3.5" /> Image
              </button>
              <button
                type="button"
                onClick={() => addElement('shape')}
                className="px-2.5 py-1 rounded-md hover:bg-slate-100 text-xs font-medium text-slate-700 flex items-center gap-1.5 whitespace-nowrap"
              >
                <Shapes className="w-3.5 h-3.5" /> Shape
              </button>
              <button
                type="button"
                onClick={() => addElement('icon')}
                className="px-2.5 py-1 rounded-md hover:bg-slate-100 text-xs font-medium text-slate-700 flex items-center gap-1.5 whitespace-nowrap"
              >
                <Sparkles className="w-3.5 h-3.5" /> Icon
              </button>
              <button
                type="button"
                onClick={() => addElement('chart')}
                className="px-2.5 py-1 rounded-md hover:bg-slate-100 text-xs font-medium text-slate-700 flex items-center gap-1.5 whitespace-nowrap"
              >
                <BarChart3 className="w-3.5 h-3.5" /> Chart
              </button>
            </div>
            <div className="text-[11px] text-slate-400 hidden lg:block">
              Double-click text to edit · Drag corners to resize
            </div>
          </div>

          {/* 16:9 Canvas Stage */}
          <div className="flex-1 p-6 md:p-10 flex items-center justify-center overflow-auto">
            {activeSlide && (
              <div className="w-full max-w-5xl rounded-xl overflow-hidden shadow-lg border border-slate-200 bg-white">
                <SlideCanvasRenderer
                  slide={activeSlide}
                  editable={true}
                  selectedElementId={selectedElementId}
                  onSelectElement={setSelectedElementId}
                  onUpdateElement={updateElement}
                />
              </div>
            )}
          </div>

          {/* Speaker Notes Bar */}
          {activeSlide && (
            <div className="bg-white border-t border-slate-200 px-5 py-2.5 shrink-0">
              <div className="max-w-5xl mx-auto flex items-center gap-3">
                <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap">
                  Speaker Notes
                </span>
                <input
                  type="text"
                  value={activeSlide.notes || ''}
                  onChange={(e) => updateCurrentSlide({ notes: e.target.value }, false)}
                  placeholder="Add presenter talking points for this slide..."
                  className="flex-1 text-xs text-slate-700 bg-transparent focus:outline-none"
                />
              </div>
            </div>
          )}
        </main>

        {/* RIGHT SIDEBAR: Properties Inspector + AI Slide Assistant */}
        <aside className="w-72 lg:w-80 bg-white border-l border-slate-200 flex flex-col shrink-0">
          <div className="p-2 border-b border-slate-200 grid grid-cols-2 gap-1 bg-slate-50">
            <button
              type="button"
              onClick={() => setRightTab('inspector')}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors ${
                rightTab === 'inspector'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Properties
            </button>
            <button
              type="button"
              onClick={() => setRightTab('ai')}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                rightTab === 'ai'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5" />
              AI Assistant
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {rightTab === 'ai' ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">AI Slide Assistant</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Rewrite, restyle, or add charts to Slide {activeSlideIdx + 1} without changing
                    the rest of your deck.
                  </p>
                </div>

                {aiError && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                    {aiError}
                  </div>
                )}

                <div className="space-y-2">
                  <textarea
                    rows={3}
                    value={aiInstruction}
                    onChange={(e) => setAiInstruction(e.target.value)}
                    placeholder="Ask AI to edit this slide..."
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                  <button
                    type="button"
                    disabled={aiLoading || !aiInstruction.trim()}
                    onClick={() => runAiEditSlide(aiInstruction)}
                    className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {aiLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Updating Slide...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-3.5 h-3.5" />
                        Apply AI Edit
                      </>
                    )}
                  </button>
                </div>

                <div>
                  <div className="text-[11px] font-semibold text-slate-500 mb-2">
                    Quick AI Commands
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {AI_QUICK_COMMANDS.map((cmd) => (
                      <button
                        key={cmd}
                        type="button"
                        disabled={aiLoading}
                        onClick={() => runAiEditSlide(cmd)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-[11px] font-medium text-slate-700 text-left transition-colors"
                      >
                        {cmd}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    disabled={loadingAlts}
                    onClick={runGenerateAlternativeLayouts}
                    className="w-full py-2 px-3 border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-xl flex items-center justify-center gap-2"
                  >
                    {loadingAlts ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Generating 3 Layouts...
                      </>
                    ) : (
                      <>
                        <LayoutTemplate className="w-3.5 h-3.5" />
                        Generate 3 Alternative Layouts
                      </>
                    )}
                  </button>

                  {altLayouts.length > 0 && (
                    <div className="mt-3 space-y-2.5">
                      <div className="text-[11px] font-semibold text-slate-500">
                        Click a variation to apply:
                      </div>
                      {altLayouts.map((variant, vi) => (
                        <button
                          key={`var_${vi}`}
                          type="button"
                          onClick={() => {
                            const nextSlides = deck.slides.map((s, idx) =>
                              idx === activeSlideIdx ? variant : s
                            );
                            commitSlides(nextSlides);
                            setAltLayouts([]);
                          }}
                          className="w-full aspect-video rounded-lg overflow-hidden border border-slate-200 hover:border-indigo-500 hover:ring-2 hover:ring-indigo-500 transition-all block"
                        >
                          <SlideCanvasRenderer slide={variant} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : !selectedElement ? (
              /* SLIDE & DECK DESIGN SETTINGS */
              <div className="space-y-5">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 mb-3">Slide Background</h3>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={activeSlide?.backgroundColor || '#FFFFFF'}
                      onChange={(e) =>
                        updateCurrentSlide({ backgroundColor: e.target.value })
                      }
                      className="w-9 h-9 rounded-lg border border-slate-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={activeSlide?.backgroundColor || '#FFFFFF'}
                      onChange={(e) =>
                        updateCurrentSlide({ backgroundColor: e.target.value })
                      }
                      className="flex-1 px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-900 mb-2">Deck Theme</h3>
                  <div className="space-y-2">
                    {DECK_THEMES.map((theme) => (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => applyThemeToDeck(theme.id)}
                        className={`w-full p-2.5 rounded-xl border text-left transition-colors ${
                          deck.themeId === theme.id
                            ? 'border-indigo-600 bg-indigo-50/40'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-900">
                            {theme.name}
                          </span>
                          <div className="flex items-center gap-1">
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-slate-200"
                              style={{ backgroundColor: theme.backgroundColor }}
                            />
                            <span
                              className="w-3.5 h-3.5 rounded-full"
                              style={{ backgroundColor: theme.accentColor }}
                            />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* ELEMENT INSPECTOR */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 capitalize">
                    {selectedElement.type} Settings
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteElement(selectedElement.id)}
                    className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 text-xs flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>

                {selectedElement.type === 'text' && (() => {
                  const t = selectedElement as TextElement;
                  return (
                    <div className="space-y-3.5">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">
                          Content
                        </label>
                        <textarea
                          rows={3}
                          value={t.content}
                          onChange={(e) =>
                            updateElement(t.id, { content: e.target.value })
                          }
                          className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">
                            Font Family
                          </label>
                          <select
                            value={t.fontFamily}
                            onChange={(e) =>
                              updateElement(t.id, { fontFamily: e.target.value })
                            }
                            className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                          >
                            <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
                            <option value="DM Sans">DM Sans</option>
                            <option value="JetBrains Mono">JetBrains Mono</option>
                            <option value="Georgia">Georgia Serif</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">
                            Size (px)
                          </label>
                          <input
                            type="number"
                            min={10}
                            max={96}
                            value={t.fontSize}
                            onChange={(e) =>
                              updateElement(t.id, { fontSize: Number(e.target.value) || 16 })
                            }
                            className="w-full px-2 py-1.5 text-xs font-mono border border-slate-200 rounded-lg"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              updateElement(t.id, {
                                fontWeight:
                                  t.fontWeight === 'bold' || t.fontWeight === 'extrabold'
                                    ? 'normal'
                                    : 'bold',
                              })
                            }
                            className={`p-1.5 rounded border ${
                              t.fontWeight === 'bold' || t.fontWeight === 'extrabold'
                                ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                                : 'border-slate-200 text-slate-600'
                            }`}
                          >
                            <Bold className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updateElement(t.id, {
                                fontStyle: t.fontStyle === 'italic' ? 'normal' : 'italic',
                              })
                            }
                            className={`p-1.5 rounded border ${
                              t.fontStyle === 'italic'
                                ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                                : 'border-slate-200 text-slate-600'
                            }`}
                          >
                            <Italic className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updateElement(t.id, {
                                textDecoration:
                                  t.textDecoration === 'underline' ? 'none' : 'underline',
                              })
                            }
                            className={`p-1.5 rounded border ${
                              t.textDecoration === 'underline'
                                ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                                : 'border-slate-200 text-slate-600'
                            }`}
                          >
                            <Underline className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center gap-1">
                          {(
                            [
                              { align: 'left', Icon: AlignLeft },
                              { align: 'center', Icon: AlignCenter },
                              { align: 'right', Icon: AlignRight },
                            ] as const
                          ).map(({ align, Icon }) => (
                            <button
                              key={align}
                              type="button"
                              onClick={() => updateElement(t.id, { textAlign: align })}
                              className={`p-1.5 rounded border ${
                                t.textAlign === align
                                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                                  : 'border-slate-200 text-slate-600'
                              }`}
                            >
                              <Icon className="w-3.5 h-3.5" />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">
                            Text Color
                          </label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="color"
                              value={t.color}
                              onChange={(e) => updateElement(t.id, { color: e.target.value })}
                              className="w-7 h-7 rounded border border-slate-200"
                            />
                            <span className="text-[11px] font-mono text-slate-500">{t.color}</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">
                            Highlight Fill
                          </label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="color"
                              value={t.backgroundColor || '#FFFFFF'}
                              onChange={(e) =>
                                updateElement(t.id, { backgroundColor: e.target.value })
                              }
                              className="w-7 h-7 rounded border border-slate-200"
                            />
                            {t.backgroundColor && (
                              <button
                                type="button"
                                onClick={() =>
                                  updateElement(t.id, { backgroundColor: undefined })
                                }
                                className="text-[10px] text-slate-500 hover:underline"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {selectedElement.type === 'shape' && (() => {
                  const s = selectedElement as ShapeElement;
                  return (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">
                          Shape Style
                        </label>
                        <select
                          value={s.shapeKind}
                          onChange={(e) =>
                            updateElement(s.id, {
                              shapeKind: e.target.value as ShapeElement['shapeKind'],
                            })
                          }
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                        >
                          <option value="roundRect">Rounded Card</option>
                          <option value="rect">Rectangle</option>
                          <option value="ellipse">Circle / Pill</option>
                          <option value="line">Divider Line</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">
                          Fill Color
                        </label>
                        <input
                          type="color"
                          value={s.fillColor}
                          onChange={(e) => updateElement(s.id, { fillColor: e.target.value })}
                          className="w-9 h-9 rounded border border-slate-200"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">
                          Corner Radius ({s.borderRadius ?? 12}px)
                        </label>
                        <input
                          type="range"
                          min={0}
                          max={40}
                          value={s.borderRadius ?? 12}
                          onChange={(e) =>
                            updateElement(s.id, { borderRadius: Number(e.target.value) })
                          }
                          className="w-full accent-indigo-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">
                          Label Text (Optional)
                        </label>
                        <input
                          type="text"
                          value={s.text || ''}
                          onChange={(e) => updateElement(s.id, { text: e.target.value })}
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
                        />
                      </div>
                    </div>
                  );
                })()}

                {selectedElement.type === 'image' && (() => {
                  const img = selectedElement as ImageElement;
                  return (
                    <div className="space-y-3">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg border border-indigo-200"
                      >
                        Upload Custom Image
                      </button>

                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1.5">
                          Curated Studio Visuals
                        </label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {CURATED_VISUAL_ASSETS.map((asset) => (
                            <button
                              key={asset.id}
                              type="button"
                              onClick={() =>
                                updateElement(img.id, { src: asset.src, alt: asset.label })
                              }
                              className="aspect-video rounded-md overflow-hidden border border-slate-200 hover:border-indigo-500"
                            >
                              <img
                                src={asset.src}
                                alt={asset.label}
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">
                          Image Fit
                        </label>
                        <select
                          value={img.objectFit}
                          onChange={(e) =>
                            updateElement(img.id, {
                              objectFit: e.target.value as 'cover' | 'contain',
                            })
                          }
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                        >
                          <option value="cover">Cover (Fill Frame)</option>
                          <option value="contain">Contain (Fit Full Image)</option>
                        </select>
                      </div>
                    </div>
                  );
                })()}

                {selectedElement.type === 'icon' && (() => {
                  const ic = selectedElement as IconElement;
                  return (
                    <div className="space-y-3">
                      <label className="block text-[11px] font-medium text-slate-600">
                        Choose Icon
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {ICON_OPTIONS.map((name) => (
                          <button
                            key={name}
                            type="button"
                            onClick={() => updateElement(ic.id, { iconName: name })}
                            className={`px-2 py-1.5 rounded-lg text-[11px] border ${
                              ic.iconName === name
                                ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-semibold'
                                : 'border-slate-200 text-slate-600'
                            }`}
                          >
                            {name}
                          </button>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">
                            Icon Color
                          </label>
                          <input
                            type="color"
                            value={ic.color}
                            onChange={(e) => updateElement(ic.id, { color: e.target.value })}
                            className="w-8 h-8 rounded border border-slate-200"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">
                            Tile Color
                          </label>
                          <input
                            type="color"
                            value={ic.backgroundColor || '#EEF2FF'}
                            onChange={(e) =>
                              updateElement(ic.id, { backgroundColor: e.target.value })
                            }
                            className="w-8 h-8 rounded border border-slate-200"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {selectedElement.type === 'chart' && (() => {
                  const c = selectedElement as ChartElement;
                  return (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">
                          Chart Title
                        </label>
                        <input
                          type="text"
                          value={c.title}
                          onChange={(e) => updateElement(c.id, { title: e.target.value })}
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">
                          Chart Type
                        </label>
                        <select
                          value={c.chartType}
                          onChange={(e) =>
                            updateElement(c.id, {
                              chartType: e.target.value as ChartElement['chartType'],
                            })
                          }
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                        >
                          <option value="bar">Bar Chart</option>
                          <option value="line">Line Chart</option>
                          <option value="area">Area Chart</option>
                          <option value="pie">Pie Chart</option>
                        </select>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-[11px] font-medium text-slate-600">
                            Data Points
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              updateElement(c.id, {
                                data: [...c.data, { label: `Item ${c.data.length + 1}`, value: 50 }],
                              })
                            }
                            className="text-[11px] font-semibold text-indigo-600 hover:underline"
                          >
                            + Add Row
                          </button>
                        </div>
                        <div className="space-y-1.5">
                          {c.data.map((pt, di) => (
                            <div key={di} className="flex items-center gap-1.5">
                              <input
                                type="text"
                                value={pt.label}
                                onChange={(e) => {
                                  const next = c.data.map((row, idx) =>
                                    idx === di ? { ...row, label: e.target.value } : row
                                  );
                                  updateElement(c.id, { data: next });
                                }}
                                className="flex-1 px-2 py-1 text-xs border border-slate-200 rounded"
                              />
                              <input
                                type="number"
                                value={pt.value}
                                onChange={(e) => {
                                  const next = c.data.map((row, idx) =>
                                    idx === di
                                      ? { ...row, value: Number(e.target.value) || 0 }
                                      : row
                                  );
                                  updateElement(c.id, { data: next });
                                }}
                                className="w-16 px-2 py-1 text-xs font-mono border border-slate-200 rounded"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Spacing & Positioning */}
                <div className="pt-3 border-t border-slate-200 space-y-2">
                  <div className="text-[11px] font-semibold text-slate-500">
                    Position & Size (%)
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(
                      [
                        { key: 'x', label: 'X' },
                        { key: 'y', label: 'Y' },
                        { key: 'w', label: 'W' },
                        { key: 'h', label: 'H' },
                      ] as const
                    ).map(({ key, label }) => (
                      <div key={key}>
                        <label className="block text-[10px] text-slate-400">{label}</label>
                        <input
                          type="number"
                          value={Math.round(selectedElement[key])}
                          onChange={(e) =>
                            updateElement(selectedElement.id, {
                              [key]: Number(e.target.value) || 0,
                            })
                          }
                          className="w-full px-1.5 py-1 text-xs font-mono border border-slate-200 rounded"
                        />
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Opacity ({Math.round((selectedElement.opacity ?? 1) * 100)}%)
                    </label>
                    <input
                      type="range"
                      min={10}
                      max={100}
                      value={Math.round((selectedElement.opacity ?? 1) * 100)}
                      onChange={(e) =>
                        updateElement(selectedElement.id, {
                          opacity: Number(e.target.value) / 100,
                        })
                      }
                      className="w-full accent-indigo-600"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
