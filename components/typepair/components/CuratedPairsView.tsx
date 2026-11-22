import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Bookmark, Check, Search } from 'lucide-react';
import { CURATED_PAIRINGS, SPECIMEN_PALETTES } from '../data/fonts';
import { CuratedMood, CuratedPairing } from '../types/typography';
import { getFontStack, loadGoogleFontsBatch } from '../utils/fontLoader';

interface CuratedPairsViewProps {
  onLoadCurated: (pair: CuratedPairing) => void;
  onSaveCurated: (pair: CuratedPairing) => void;
}

const MOODS: CuratedMood[] = [
  'All',
  'Editorial',
  'Modern SaaS',
  'Luxury',
  'Technical',
  'Bold Display',
];

export function CuratedPairsView({
  onLoadCurated,
  onSaveCurated,
}: CuratedPairsViewProps) {
  const [mood, setMood] = useState<CuratedMood>('All');
  const [query, setQuery] = useState('');
  const [savedFeedbackId, setSavedFeedbackId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CURATED_PAIRINGS.filter((pair) => {
      if (mood !== 'All' && pair.mood !== mood) return false;
      if (!q) return true;
      return (
        pair.name.toLowerCase().includes(q) ||
        pair.headingFamily.toLowerCase().includes(q) ||
        pair.bodyFamily.toLowerCase().includes(q) ||
        pair.mood.toLowerCase().includes(q) ||
        pair.rationale.toLowerCase().includes(q)
      );
    });
  }, [mood, query]);

  useEffect(() => {
    const families = filtered.flatMap((p) => [
      p.headingFamily,
      p.bodyFamily,
      p.accentFamily,
    ]);
    loadGoogleFontsBatch(families);
  }, [filtered]);

  function handleSave(pair: CuratedPairing) {
    onSaveCurated(pair);
    setSavedFeedbackId(pair.id);
    window.setTimeout(() => {
      setSavedFeedbackId((prev) => (prev === pair.id ? null : prev));
    }, 1500);
  }

  return (
    <main className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:py-10">
      {/* Page Header & Filters */}
      <div className="flex flex-col justify-between gap-6 border-b border-zinc-200 pb-6 lg:flex-row lg:items-end dark:border-zinc-800">
        <div>
          <h1 className="font-[var(--font-ui-display)] text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl dark:text-zinc-50">
            Curated Font Pairings
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
            Eighteen field-tested Google Font combinations with typographic notes. Load any pairing straight into the workbench to customize scale, tracking, and ink contrast.
          </p>
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by typeface or mood..."
            className="w-full rounded-md border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-600 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-blue-500"
          />
        </div>
      </div>

      {/* Mood Filter Bar */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
        <div
          role="tablist"
          aria-label="Filter pairings by style"
          className="flex flex-wrap items-center gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900"
        >
          {MOODS.map((m) => {
            const active = mood === m;
            return (
              <button
                key={m}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => setMood(m)}
                className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors duration-150 ${
                  active
                    ? 'bg-white text-zinc-950 shadow-xs dark:bg-zinc-800 dark:text-zinc-50'
                    : 'text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100'
                }`}
              >
                {m}
              </button>
            );
          })}
        </div>

        <div className="font-[var(--font-ui-mono)] text-xs text-zinc-500 tabular-nums dark:text-zinc-400">
          {filtered.length} {filtered.length === 1 ? 'pairing' : 'pairings'}
        </div>
      </div>

      {/* Pairings Grid */}
      {filtered.length === 0 ? (
        <div className="mt-12 rounded-xl border border-zinc-200 bg-zinc-50/50 p-12 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            No curated pairings match “{query}”.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setMood('All');
            }}
            className="mt-4 cursor-pointer rounded-md border border-zinc-300 bg-white px-4 py-2 text-xs font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((pair) => {
            const palette =
              SPECIMEN_PALETTES.find((p) => p.id === pair.paletteId) ??
              SPECIMEN_PALETTES[0];
            const isJustSaved = savedFeedbackId === pair.id;

            return (
              <article
                key={pair.id}
                className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white transition-colors duration-150 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/70 dark:hover:border-zinc-700"
              >
                {/* Live Type Specimen Window */}
                <div
                  className="flex min-h-[210px] flex-col justify-between border-b p-6"
                  style={{
                    backgroundColor: palette.background,
                    borderColor: palette.border,
                  }}
                >
                  <div
                    className="text-[11px]"
                    style={{
                      fontFamily: getFontStack(pair.accentFamily),
                      color: palette.mutedColor,
                    }}
                  >
                    {pair.mood} · {pair.headingFamily} + {pair.bodyFamily}
                  </div>

                  <div className="mt-4 space-y-2.5">
                    <h2
                      className="text-balance text-2xl leading-tight"
                      style={{
                        fontFamily: getFontStack(pair.headingFamily),
                        fontWeight: pair.headingWeight,
                        letterSpacing: `${pair.headingTracking}em`,
                        color: palette.headingColor,
                      }}
                    >
                      {pair.sampleHeadline}
                    </h2>
                    <p
                      className="text-sm leading-relaxed"
                      style={{
                        fontFamily: getFontStack(pair.bodyFamily),
                        fontWeight: pair.bodyWeight,
                        color: palette.bodyColor,
                      }}
                    >
                      {pair.sampleBody}
                    </p>
                  </div>
                </div>

                {/* Card Footer: Quiet Metadata, Rationale & Actions */}
                <div className="flex flex-1 flex-col justify-between p-5">
                  <div>
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="font-[var(--font-ui-display)] text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                        {pair.name}
                      </h3>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        {pair.mood}
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                      {pair.rationale}
                    </p>
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                    <button
                      type="button"
                      onClick={() => handleSave(pair)}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 whitespace-nowrap transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      {isJustSaved ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Bookmark className="h-3.5 w-3.5" />
                      )}
                      {isJustSaved ? 'Saved' : 'Save'}
                    </button>

                    <button
                      type="button"
                      onClick={() => onLoadCurated(pair)}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-zinc-950 px-3.5 py-1.5 text-xs font-medium text-white whitespace-nowrap transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
                    >
                      Load in Workbench
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
