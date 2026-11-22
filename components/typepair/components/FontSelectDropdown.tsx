import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { FONT_CATALOG } from '../data/fonts';
import { FontCategory, FontEntry } from '../types/typography';
import { getFontStack, loadGoogleFontsBatch } from '../utils/fontLoader';

interface FontSelectDropdownProps {
  id: string;
  label: string;
  value: string;
  onChange: (font: FontEntry) => void;
  preferredCategories?: FontCategory[];
}

const CATEGORY_TABS: Array<{ id: 'all' | FontCategory; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'serif', label: 'Serif' },
  { id: 'sans', label: 'Sans' },
  { id: 'display', label: 'Display' },
  { id: 'mono', label: 'Mono' },
];

export function FontSelectDropdown({
  id,
  label,
  value,
  onChange,
  preferredCategories,
}: FontSelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<'all' | FontCategory>('all');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedEntry = useMemo(
    () => FONT_CATALOG.find((f) => f.family === value) ?? FONT_CATALOG[0],
    [value]
  );

  const filteredFonts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FONT_CATALOG.filter((font) => {
      if (category !== 'all' && font.category !== category) return false;
      if (!q) return true;
      return (
        font.family.toLowerCase().includes(q) ||
        font.category.toLowerCase().includes(q) ||
        font.designer.toLowerCase().includes(q) ||
        font.character.toLowerCase().includes(q)
      );
    }).sort((a, b) => {
      if (preferredCategories && category === 'all' && !q) {
        const aPref = preferredCategories.includes(a.category) ? 0 : 1;
        const bPref = preferredCategories.includes(b.category) ? 0 : 1;
        if (aPref !== bPref) return aPref - bPref;
      }
      return a.family.localeCompare(b.family);
    });
  }, [category, query, preferredCategories]);

  useEffect(() => {
    if (!open) return;
    // Load visible filtered fonts so each row renders in its actual typeface
    loadGoogleFontsBatch(filteredFonts.slice(0, 16).map((f) => f.family));
    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 30);
    return () => window.clearTimeout(timer);
  }, [open, filteredFonts]);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${label}: ${selectedEntry.family}`}
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2.5 text-left transition-colors duration-150 hover:border-zinc-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
      >
        <div className="min-w-0 flex-1">
          <div
            className="truncate text-base font-medium text-zinc-950 dark:text-zinc-50"
            style={{ fontFamily: getFontStack(selectedEntry.family) }}
          >
            {selectedEntry.family}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="capitalize">{selectedEntry.category}</span>
            <span aria-hidden="true">·</span>
            <span className="truncate">{selectedEntry.designer}</span>
          </div>
        </div>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-150 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-40 mt-1.5 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
          {/* Search input */}
          <div className="border-b border-zinc-200 p-2 dark:border-zinc-800">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search font or style..."
                className="w-full rounded-md border border-zinc-200 bg-zinc-50 py-1.5 pl-8 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-blue-600 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-blue-500"
              />
            </div>

            {/* Category filter segmented tabs */}
            <div className="mt-2 flex items-center gap-1">
              {CATEGORY_TABS.map((tab) => {
                const active = category === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setCategory(tab.id)}
                    className={`flex-1 cursor-pointer rounded px-2 py-1 text-xs font-medium whitespace-nowrap transition-colors duration-150 ${
                      active
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950'
                        : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Font list */}
          <ul
            role="listbox"
            aria-label={`${label} font options`}
            className="max-h-64 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/80"
          >
            {filteredFonts.length === 0 ? (
              <li className="px-3 py-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
                No matching typefaces found.
              </li>
            ) : (
              filteredFonts.map((font) => {
                const isSelected = font.family === value;
                return (
                  <li key={font.family} role="option" aria-selected={isSelected}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(font);
                        setOpen(false);
                        setQuery('');
                      }}
                      className={`flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors duration-100 ${
                        isSelected
                          ? 'bg-blue-50/80 dark:bg-blue-950/40'
                          : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div
                          className="truncate text-sm font-medium text-zinc-950 dark:text-zinc-50"
                          style={{ fontFamily: getFontStack(font.family) }}
                        >
                          {font.family}
                        </div>
                        <div className="mt-0.5 truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                          <span className="capitalize">{font.category}</span>
                          <span aria-hidden="true"> · </span>
                          <span>{font.weights.length} weights</span>
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                      )}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
