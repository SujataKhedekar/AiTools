import React from 'react';
import {
  BookmarkPlus,
  Copy,
  FolderOpen,
  Trash2,
} from 'lucide-react';
import { SHADE_LEVELS, SavedPalette } from '../types/palette';
import { sanitizeSlug } from '../utils/colorScience';

interface SavedPalettesPanelProps {
  savedPalettes: SavedPalette[];
  onLoadPalette: (palette: SavedPalette) => void;
  onDeletePalette: (id: string) => void;
  onSaveCurrent: () => void;
  onCopyText: (text: string, label: string) => void;
}

export const SavedPalettesPanel: React.FC<SavedPalettesPanelProps> = ({
  savedPalettes,
  onLoadPalette,
  onDeletePalette,
  onSaveCurrent,
  onCopyText,
}) => {
  const handleCopySavedCss = (palette: SavedPalette) => {
    const key = sanitizeSlug(palette.colourName);
    const lines = SHADE_LEVELS.map(
      (lvl) => `  --${key}-${lvl}: ${palette.shades[lvl]};`
    );
    const css = `:root {\n${lines.join('\n')}\n}`;
    onCopyText(css, `${palette.paletteName} CSS`);
  };

  return (
    <section
      aria-label="Saved colour palettes"
      className="rounded-xl bg-[#FFFFFF] border border-[#E8E6DF] shadow-2xs overflow-hidden"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 border-b border-[#EFECE5]">
        <div>
          <h2 className="text-[13px] font-semibold text-[#171614]">
            Saved Palette Library
          </h2>
          <p className="text-[11px] text-[#78756C]">
            Stored locally in your browser · {savedPalettes.length} saved{' '}
            {savedPalettes.length === 1 ? 'palette' : 'palettes'}
          </p>
        </div>

        <button
          type="button"
          onClick={onSaveCurrent}
          className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg bg-[#181816] hover:bg-[#2E2D29] text-xs font-semibold text-[#FFFFFF] transition-colors whitespace-nowrap shrink-0"
        >
          <BookmarkPlus className="h-3.5 w-3.5" />
          Save Current Scale
        </button>
      </div>

      {savedPalettes.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="text-sm font-semibold text-[#171614]">
            No palettes saved yet
          </p>
          <p className="mt-1 text-xs text-[#78756C] max-w-sm mx-auto leading-relaxed">
            Save your active 50–950 Tailwind scale to revisit it anytime, compare variations, or copy CSS variables with one click.
          </p>
          <button
            type="button"
            onClick={onSaveCurrent}
            className="mt-4 inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-[#181816] hover:bg-[#2E2D29] text-xs font-semibold text-[#FFFFFF] transition-colors"
          >
            <BookmarkPlus className="h-4 w-4" />
            Save Current Palette
          </button>
        </div>
      ) : (
        <div className="divide-y divide-[#F0EFEA]">
          {savedPalettes.map((palette) => (
            <div
              key={palette.id}
              className="p-4 hover:bg-[#FAF9F6] transition-colors space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="h-9 w-9 rounded-lg border border-black/10 shrink-0"
                    style={{ backgroundColor: palette.baseHex }}
                  />
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-[#171614] truncate">
                      {palette.paletteName}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#78756C]">
                      <span className="font-mono font-medium tabular-nums text-[#0F766E]">
                        {palette.baseHex}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">--{sanitizeSlug(palette.colourName)}</span>
                      <span aria-hidden="true">·</span>
                      <span className="capitalize">{palette.mode.replace('-', ' ')}</span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {new Date(palette.savedAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onLoadPalette(palette)}
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#FFFFFF] hover:bg-[#F2F0EA] border border-[#E2E0D8] text-xs font-medium text-[#171614] transition-colors"
                  >
                    <FolderOpen className="h-3.5 w-3.5 text-[#0F766E]" />
                    Load
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopySavedCss(palette)}
                    title="Copy CSS variables"
                    aria-label={`Copy CSS variables for ${palette.paletteName}`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFFFFF] hover:bg-[#F2F0EA] border border-[#E2E0D8] text-[#62605A] hover:text-[#171614] transition-colors"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeletePalette(palette.id)}
                    title="Delete saved palette"
                    aria-label={`Delete ${palette.paletteName}`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFFFFF] hover:bg-red-50 border border-[#E2E0D8] hover:border-red-200 text-[#62605A] hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* 11-Shade Mini Strip */}
              <div className="grid grid-cols-11 gap-1">
                {SHADE_LEVELS.map((lvl) => (
                  <div
                    key={lvl}
                    title={`${lvl}: ${palette.shades[lvl]}`}
                    className="h-5 rounded-xs border border-black/10"
                    style={{ backgroundColor: palette.shades[lvl] }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
