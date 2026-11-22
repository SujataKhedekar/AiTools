import { useEffect, useState } from 'react';
import { ArrowUpRight, Check, Copy, Trash2 } from 'lucide-react';
import { SavedPairing } from '../types/typography';
import { generateCssCode } from '../utils/colorContrast';
import { getFontStack, loadGoogleFontsBatch } from '../utils/fontLoader';

interface SavedPairsViewProps {
  savedPairs: SavedPairing[];
  onOpenSaved: (saved: SavedPairing) => void;
  onDeleteSaved: (id: string) => void;
  onRenameSaved: (id: string, name: string) => void;
  onBrowseCurated: () => void;
}

export function SavedPairsView({
  savedPairs,
  onOpenSaved,
  onDeleteSaved,
  onRenameSaved,
  onBrowseCurated,
}: SavedPairsViewProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const families = savedPairs.flatMap((item) => [
      item.state.heading.family,
      item.state.body.family,
      item.state.accent.family,
    ]);
    loadGoogleFontsBatch(families);
  }, [savedPairs]);

  async function handleCopyCss(saved: SavedPairing) {
    const css = generateCssCode(saved.state);
    try {
      await navigator.clipboard.writeText(css);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = css;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopiedId(saved.id);
    window.setTimeout(() => {
      setCopiedId((prev) => (prev === saved.id ? null : prev));
    }, 1600);
  }

  return (
    <main className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-zinc-200 pb-6 dark:border-zinc-800">
        <div>
          <h1 className="font-[var(--font-ui-display)] text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl dark:text-zinc-50">
            Saved Pairings
          </h1>
          <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400">
            Your saved combinations are stored locally in this browser with their exact weights, sizes, tracking, and ink palettes.
          </p>
        </div>
        <span className="font-[var(--font-ui-mono)] text-xs text-zinc-500 tabular-nums dark:text-zinc-400">
          {savedPairs.length} saved
        </span>
      </div>

      {savedPairs.length === 0 ? (
        <div className="mt-12 flex flex-col items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50/60 px-6 py-16 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
          <h2 className="font-[var(--font-ui-display)] text-base font-semibold text-zinc-950 dark:text-zinc-50">
            No saved pairings yet
          </h2>
          <p className="mt-1.5 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
            Use the Save button in the Workbench or bookmark a combination from Curated Pairs to build your personal reference collection.
          </p>
          <button
            type="button"
            onClick={onBrowseCurated}
            className="mt-6 cursor-pointer rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:text-zinc-950 dark:hover:bg-blue-400"
          >
            Browse Curated Pairs
          </button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {savedPairs.map((item) => {
            const { heading, body, accent, palette } = item.state;
            const isCopied = copiedId === item.id;
            const dateLabel = new Date(item.savedAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });

            return (
              <article
                key={item.id}
                className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/70"
              >
                <div
                  className="border-b p-6"
                  style={{
                    backgroundColor: palette.background,
                    borderColor: palette.border,
                  }}
                >
                  <div
                    className="text-[11px]"
                    style={{
                      fontFamily: getFontStack(accent.family),
                      color: palette.mutedColor,
                    }}
                  >
                    {heading.family} ({heading.weight}) · {body.family} ({body.weight})
                  </div>
                  <h2
                    className="mt-3 text-2xl leading-tight"
                    style={{
                      fontFamily: getFontStack(heading.family),
                      fontWeight: heading.weight,
                      letterSpacing: `${heading.letterSpacing}em`,
                      fontStyle: heading.italic ? 'italic' : 'normal',
                      color: palette.headingColor,
                    }}
                  >
                    Clarity through balanced typographic craft
                  </h2>
                  <p
                    className="mt-2.5 text-sm leading-relaxed"
                    style={{
                      fontFamily: getFontStack(body.family),
                      fontWeight: body.weight,
                      color: palette.bodyColor,
                    }}
                  >
                    Saved at {heading.size}px display / {body.size}px body with {body.measure}ch measure.
                  </p>
                </div>

                <div className="flex flex-1 flex-col justify-between p-5">
                  <div>
                    <label className="sr-only" htmlFor={`rename-${item.id}`}>
                      Pairing name
                    </label>
                    <input
                      id={`rename-${item.id}`}
                      type="text"
                      value={item.name}
                      onChange={(e) => onRenameSaved(item.id, e.target.value)}
                      className="w-full rounded border border-transparent bg-transparent px-1 py-0.5 font-[var(--font-ui-display)] text-sm font-semibold text-zinc-950 transition-colors hover:border-zinc-200 focus:border-blue-600 focus:bg-white focus:outline-none dark:text-zinc-50 dark:hover:border-zinc-700 dark:focus:bg-zinc-950"
                    />
                    <div className="mt-1 px-1 text-xs text-zinc-500 dark:text-zinc-400">
                      Saved {dateLabel} · {palette.name}
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleCopyCss(item)}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 whitespace-nowrap transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        {isCopied ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                        {isCopied ? 'Copied' : 'CSS'}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteSaved(item.id)}
                        aria-label={`Delete ${item.name}`}
                        className="inline-flex cursor-pointer items-center rounded-md border border-zinc-200 bg-white p-1.5 text-zinc-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-red-900/60 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenSaved(item)}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-zinc-950 px-3.5 py-1.5 text-xs font-medium text-white whitespace-nowrap transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
                    >
                      Open
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
