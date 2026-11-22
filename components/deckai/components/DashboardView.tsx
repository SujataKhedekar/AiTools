import React, { useMemo, useState } from 'react';
import {
  Copy,
  Download,
  Edit3,
  FolderOpen,
  Grid,
  List,
  MoreVertical,
  Plus,
  Search,
  Star,
  Trash2,
  User as UserIcon,
  Wand2,
} from 'lucide-react';
import { PRESENTATION_TEMPLATES, TEMPLATE_CATEGORIES } from '../lib/templates';
import type { Presentation, PresentationTemplate, UserProfile } from '../types/deck';
import { SlideCanvasRenderer } from './SlideCanvasRenderer';

interface DashboardViewProps {
  user: UserProfile;
  presentations: Presentation[];
  loading: boolean;
  onCreateNew: () => void;
  onCreateBlank: () => void;
  onOpenPresentation: (deck: Presentation) => void;
  onRenamePresentation: (publicId: string, newTitle: string) => Promise<void>;
  onDuplicatePresentation: (publicId: string) => Promise<void>;
  onDeletePresentation: (publicId: string) => Promise<void>;
  onToggleFavorite: (publicId: string, current: boolean) => Promise<void>;
  onExportPresentation: (deck: Presentation) => void;
  onUseTemplate: (template: PresentationTemplate) => void;
  onOpenAccount: () => void;
  onGoHome: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  presentations,
  loading,
  onCreateNew,
  onCreateBlank,
  onOpenPresentation,
  onRenamePresentation,
  onDuplicatePresentation,
  onDeletePresentation,
  onToggleFavorite,
  onExportPresentation,
  onUseTemplate,
  onOpenAccount,
  onGoHome,
}) => {
  const [tab, setTab] = useState<'all' | 'recent' | 'favorites' | 'templates'>('all');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [templateCat, setTemplateCat] = useState<string>('All');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filteredDecks = useMemo(() => {
    let list = [...presentations];
    if (tab === 'favorites') {
      list = list.filter((p) => p.isFavorite);
    } else if (tab === 'recent') {
      list = list.slice(0, 8);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.presentationType.toLowerCase().includes(q)
      );
    }
    return list;
  }, [presentations, tab, search]);

  const filteredTemplates = useMemo(() => {
    let list = PRESENTATION_TEMPLATES;
    if (templateCat !== 'All') {
      list = list.filter((t) => t.category === templateCat);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [templateCat, search]);

  const formatDate = (iso?: string) => {
    if (!iso) return 'Just now';
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          <button
            type="button"
            onClick={onGoHome}
            className="text-xl font-extrabold tracking-tight text-slate-900 font-display whitespace-nowrap shrink-0"
          >
            DeckAI
          </button>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              type="button"
              onClick={() => setTab('all')}
              className={`whitespace-nowrap shrink-0 transition-colors ${
                tab === 'all' ? 'text-slate-900 font-semibold' : 'hover:text-slate-900'
              }`}
            >
              My Presentations
            </button>
            <button
              type="button"
              onClick={() => setTab('recent')}
              className={`whitespace-nowrap shrink-0 transition-colors ${
                tab === 'recent' ? 'text-slate-900 font-semibold' : 'hover:text-slate-900'
              }`}
            >
              Recent
            </button>
            <button
              type="button"
              onClick={() => setTab('favorites')}
              className={`whitespace-nowrap shrink-0 transition-colors ${
                tab === 'favorites' ? 'text-slate-900 font-semibold' : 'hover:text-slate-900'
              }`}
            >
              Favorites
            </button>
            <button
              type="button"
              onClick={() => setTab('templates')}
              className={`whitespace-nowrap shrink-0 transition-colors ${
                tab === 'templates' ? 'text-slate-900 font-semibold' : 'hover:text-slate-900'
              }`}
            >
              Templates
            </button>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onOpenAccount}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-700 whitespace-nowrap shrink-0"
            >
              <UserIcon className="w-3.5 h-3.5 text-slate-500" />
              <span className="max-w-[120px] truncate">{user.displayName}</span>
            </button>
            <button
              type="button"
              onClick={onCreateNew}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Wand2 className="w-3.5 h-3.5" />
              New Presentation
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {/* Welcome & Quick Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 font-display">
              Welcome back, {user.displayName}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {presentations.length} saved deck{presentations.length === 1 ? '' : 's'} ·{' '}
              {user.plan.toUpperCase()} Plan ·{' '}
              <span className="font-mono tabular-nums">{user.generationsUsed}</span> AI
              generations used
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onCreateBlank}
              className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              Blank Deck
            </button>
            <button
              type="button"
              onClick={onCreateNew}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <Wand2 className="w-4 h-4" />
              Create with AI
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-xl w-fit">
            {(
              [
                { id: 'all', label: 'My Presentations' },
                { id: 'recent', label: 'Recent' },
                { id: 'favorites', label: 'Favorites' },
                { id: 'templates', label: 'Templates' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  tab === item.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2.5">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search presentations..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {tab !== 'templates' && (
              <div className="flex items-center p-1 bg-white border border-slate-200 rounded-xl">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg ${
                    viewMode === 'grid' ? 'bg-slate-100 text-slate-900' : 'text-slate-400'
                  }`}
                  aria-label="Grid view"
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg ${
                    viewMode === 'list' ? 'bg-slate-100 text-slate-900' : 'text-slate-400'
                  }`}
                  aria-label="List view"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Templates View */}
        {tab === 'templates' ? (
          <div>
            <div className="flex flex-wrap items-center gap-1.5 mb-6">
              {TEMPLATE_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setTemplateCat(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    templateCat === cat
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col hover:border-indigo-300 transition-colors"
                >
                  <div className="aspect-video border-b border-slate-200 bg-slate-50">
                    <SlideCanvasRenderer slide={tpl.slides[0]} />
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-xs text-slate-500 mb-1">
                        {tpl.category} · {tpl.colorTheme} · {tpl.slideCount} slides
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">{tpl.name}</h3>
                      <p className="text-xs text-slate-600 mt-1">{tpl.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onUseTemplate(tpl)}
                      className="mt-4 w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                      Use Template
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden animate-pulse"
              >
                <div className="aspect-video bg-slate-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-2/3" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredDecks.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              {search ? 'No matching presentations found' : 'Create your first presentation'}
            </h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
              {search
                ? 'Try another search term or browse our ready-to-use templates.'
                : 'Generate a complete pitch deck from a prompt or start from a curated template.'}
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={onCreateNew}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors"
              >
                Generate with AI
              </button>
              <button
                type="button"
                onClick={() => setTab('templates')}
                className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
              >
                Browse Templates
              </button>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDecks.map((deck) => (
              <div
                key={deck.publicId}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-indigo-300 transition-colors flex flex-col relative"
              >
                <button
                  type="button"
                  onClick={() => onOpenPresentation(deck)}
                  className="aspect-video w-full border-b border-slate-200 bg-slate-50 text-left overflow-hidden block"
                >
                  {deck.slides[0] && <SlideCanvasRenderer slide={deck.slides[0]} />}
                </button>

                <div className="p-4 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {renamingId === deck.publicId ? (
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          if (renameValue.trim()) {
                            await onRenamePresentation(deck.publicId, renameValue.trim());
                          }
                          setRenamingId(null);
                        }}
                      >
                        <input
                          autoFocus
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onBlur={() => setRenamingId(null)}
                          className="w-full px-2 py-1 text-sm font-bold border border-indigo-400 rounded focus:outline-none"
                        />
                      </form>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onOpenPresentation(deck)}
                        className="text-sm font-bold text-slate-900 hover:text-indigo-600 truncate block max-w-full text-left"
                      >
                        {deck.title}
                      </button>
                    )}
                    <div className="text-xs text-slate-500 mt-1 truncate">
                      <span className="font-mono tabular-nums">{deck.slides.length}</span> slides ·{' '}
                      {deck.presentationType} · {formatDate(deck.updatedAt)}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 relative">
                    <button
                      type="button"
                      onClick={() => onToggleFavorite(deck.publicId, deck.isFavorite)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        deck.isFavorite
                          ? 'text-amber-500 hover:bg-amber-50'
                          : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                      }`}
                      aria-label="Toggle favorite"
                    >
                      <Star
                        className="w-4 h-4"
                        fill={deck.isFavorite ? 'currentColor' : 'none'}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setOpenMenuId(openMenuId === deck.publicId ? null : deck.publicId)
                      }
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                      aria-label="More options"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {openMenuId === deck.publicId && (
                      <div className="absolute right-0 bottom-9 w-44 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-20">
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuId(null);
                            onOpenPresentation(deck);
                          }}
                          className="w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Open in Editor
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuId(null);
                            setRenamingId(deck.publicId);
                            setRenameValue(deck.title);
                          }}
                          className="w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Rename
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuId(null);
                            onDuplicatePresentation(deck.publicId);
                          }}
                          className="w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <Copy className="w-3.5 h-3.5" /> Duplicate
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuId(null);
                            onExportPresentation(deck);
                          }}
                          className="w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <Download className="w-3.5 h-3.5" /> Export
                        </button>
                        <div className="my-1 border-t border-slate-100" />
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuId(null);
                            setConfirmDeleteId(deck.publicId);
                          }}
                          className="w-full px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden">
            {filteredDecks.map((deck) => (
              <div
                key={deck.publicId}
                className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => onOpenPresentation(deck)}
                    className="w-24 aspect-video rounded-md overflow-hidden border border-slate-200 shrink-0"
                  >
                    {deck.slides[0] && <SlideCanvasRenderer slide={deck.slides[0]} />}
                  </button>
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => onOpenPresentation(deck)}
                      className="text-sm font-bold text-slate-900 hover:text-indigo-600 truncate block text-left"
                    >
                      {deck.title}
                    </button>
                    <div className="text-xs text-slate-500 mt-0.5">
                      <span className="font-mono tabular-nums">{deck.slides.length}</span> slides ·{' '}
                      {deck.presentationType} · Updated {formatDate(deck.updatedAt)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onToggleFavorite(deck.publicId, deck.isFavorite)}
                    className={`p-2 rounded-lg ${
                      deck.isFavorite ? 'text-amber-500' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <Star className="w-4 h-4" fill={deck.isFavorite ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDuplicatePresentation(deck.publicId)}
                    className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"
                    title="Duplicate"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onExportPresentation(deck)}
                    className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"
                    title="Export"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(deck.publicId)}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">Delete presentation?</h3>
            <p className="text-xs text-slate-600 mt-1.5">
              This will permanently delete the presentation and all of its slides.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const id = confirmDeleteId;
                  setConfirmDeleteId(null);
                  await onDeletePresentation(id);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg"
              >
                Delete Presentation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
