import React, { useState } from 'react';
import {
  Check,
  Copy,
  Lock,
  Pencil,
  RotateCcw,
  Unlock,
} from 'lucide-react';
import {
  ColourFormat,
  ShadeEntry,
  ShadeLevel,
  TypographySettings,
} from '../types/palette';
import {
  formatColour,
  getReadableTextColor,
  getWcagGrade,
} from '../utils/colorScience';

interface ShadesPanelProps {
  shades: ShadeEntry[];
  selectedLevel: ShadeLevel;
  onSelectLevel: (level: ShadeLevel) => void;
  onEditShadeHex: (level: ShadeLevel, hex: string) => void;
  onToggleLock: (level: ShadeLevel) => void;
  onResetShade: (level: ShadeLevel) => void;
  onResetAllEdits: () => void;
  onUnlockAll: () => void;
  onCopyText: (text: string, label: string) => void;
  onCopyFullPalette: () => void;
  colourFormat: ColourFormat;
  typography: TypographySettings;
  showContrastBadges: boolean;
}

export const ShadesPanel: React.FC<ShadesPanelProps> = ({
  shades,
  selectedLevel,
  onSelectLevel,
  onEditShadeHex,
  onToggleLock,
  onResetShade,
  onResetAllEdits,
  onUnlockAll,
  onCopyText,
  onCopyFullPalette,
  colourFormat,
  typography,
  showContrastBadges,
}) => {
  const [copiedLevel, setCopiedLevel] = useState<ShadeLevel | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const hasEdited = shades.some((s) => s.isEdited);
  const lockedCount = shades.filter((s) => s.locked).length;

  const codeSizeClass =
    typography.codeFontSize === 'sm'
      ? 'text-[11px]'
      : typography.codeFontSize === 'lg'
        ? 'text-[13px]'
        : 'text-xs';

  const rowPadClass = typography.compactRows ? 'py-1.5 px-3' : 'py-2.5 px-3.5';

  const handleCopyOne = (shade: ShadeEntry) => {
    const val = formatColour(shade, colourFormat, typography.uppercaseHex);
    onCopyText(val, `Shade ${shade.level}`);
    setCopiedLevel(shade.level);
    setTimeout(() => {
      setCopiedLevel((curr) => (curr === shade.level ? null : curr));
    }, 1200);
  };

  const handleCopyPalette = () => {
    onCopyFullPalette();
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 1400);
  };

  return (
    <section
      aria-label="Generated colour shades"
      className="rounded-xl bg-[#FFFFFF] border border-[#E8E6DF] shadow-2xs overflow-hidden"
    >
      {/* Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3.5 border-b border-[#EFECE5]">
        <div>
          <h2 className="text-[13px] font-semibold text-[#171614]">
            Generated Colour Palette
          </h2>
          <p className="text-[11px] text-[#78756C]">
            11 scale steps (50–950) · Click any swatch to edit, lock, or copy
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {lockedCount > 0 && (
            <button
              type="button"
              onClick={onUnlockAll}
              className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-[#FFFFFF] hover:bg-[#F7F6F2] border border-[#E2E0D8] text-xs font-medium text-[#171614] transition-colors whitespace-nowrap shrink-0"
            >
              <Unlock className="h-3.5 w-3.5 text-[#62605A]" />
              Unlock ({lockedCount})
            </button>
          )}

          {hasEdited && (
            <button
              type="button"
              onClick={onResetAllEdits}
              className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-[#FFFFFF] hover:bg-[#F7F6F2] border border-[#E2E0D8] text-xs font-medium text-[#171614] transition-colors whitespace-nowrap shrink-0"
            >
              <RotateCcw className="h-3.5 w-3.5 text-[#62605A]" />
              Reset Edits
            </button>
          )}

          <button
            type="button"
            onClick={handleCopyPalette}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#181816] hover:bg-[#2E2D29] text-xs font-semibold text-[#FFFFFF] transition-colors whitespace-nowrap shrink-0"
          >
            {copiedAll ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Copied Palette
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copy Complete Palette
              </>
            )}
          </button>
        </div>
      </div>

      {/* Column Headers */}
      <div className="hidden sm:grid grid-cols-[64px_1fr_auto_auto] items-center gap-3 px-4 py-2 bg-[#FAF9F6] border-b border-[#EFECE5] text-[11px] font-medium text-[#8C8980]">
        <span>Shade</span>
        <span>Value ({colourFormat.toUpperCase()})</span>
        {showContrastBadges ? (
          <span className="text-right pr-2">Contrast (W / D)</span>
        ) : (
          <span />
        )}
        <span className="text-right">Actions</span>
      </div>

      {/* 11 Shade Rows */}
      <div className="divide-y divide-[#F0EFEA]">
        {shades.map((shade) => {
          const isSelected = shade.level === selectedLevel;
          const isCopied = copiedLevel === shade.level;
          const formatted = formatColour(
            shade,
            colourFormat,
            typography.uppercaseHex
          );
          const hexFormatted = typography.uppercaseHex
            ? shade.hex.toUpperCase()
            : shade.hex.toLowerCase();
          const swatchText = getReadableTextColor(shade.hex);
          const whiteGrade = getWcagGrade(shade.contrastWhite);
          const darkGrade = getWcagGrade(shade.contrastDark);

          return (
            <div
              key={shade.level}
              onClick={() => onSelectLevel(shade.level)}
              className={`grid grid-cols-[auto_1fr_auto] sm:grid-cols-[64px_1fr_auto_auto] items-center gap-3 ${rowPadClass} transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-[#F5F4F0]'
                  : 'hover:bg-[#FAF9F6]'
              }`}
            >
              {/* Shade Level & Swatch Preview */}
              <div className="flex items-center gap-2.5">
                <span
                  className="flex h-8 w-11 items-center justify-center rounded-md border border-black/10 font-mono text-[11px] font-semibold tabular-nums shrink-0"
                  style={{
                    backgroundColor: shade.hex,
                    color: swatchText,
                  }}
                >
                  {shade.level}
                </span>
              </div>

              {/* Colour Value + Status Metadata */}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-mono font-medium tabular-nums truncate ${codeSizeClass} ${
                      isSelected ? 'text-[#171614] font-semibold' : 'text-[#2B2A26]'
                    }`}
                  >
                    {formatted}
                  </span>
                  {colourFormat !== 'hex' && (
                    <span className="hidden md:inline font-mono text-[11px] text-[#8C8980] tabular-nums">
                      {hexFormatted}
                    </span>
                  )}
                </div>
                {(shade.isEdited || shade.locked) && (
                  <div className="flex items-center gap-1.5 text-[10px] text-[#78756C] mt-0.5">
                    {shade.isEdited && (
                      <span className="text-[#0F766E] font-medium">Edited</span>
                    )}
                    {shade.isEdited && shade.locked && (
                      <span aria-hidden="true">·</span>
                    )}
                    {shade.locked && <span>Locked</span>}
                  </div>
                )}
              </div>

              {/* Contrast Readouts */}
              {showContrastBadges ? (
                <div className="hidden sm:flex items-center gap-3 pr-2 font-mono text-[11px] tabular-nums">
                  <span
                    title={`Contrast against white (#FFFFFF): ${shade.contrastWhite.toFixed(2)}:1 (${whiteGrade.label})`}
                    className={
                      whiteGrade.normalAA
                        ? 'text-[#0F766E] font-medium'
                        : whiteGrade.largeAA
                          ? 'text-[#B45309]'
                          : 'text-[#A09D94]'
                    }
                  >
                    W {shade.contrastWhite.toFixed(1)}
                  </span>
                  <span className="text-[#DCD9D0]" aria-hidden="true">
                    /
                  </span>
                  <span
                    title={`Contrast against dark (#08100C): ${shade.contrastDark.toFixed(2)}:1 (${darkGrade.label})`}
                    className={
                      darkGrade.normalAA
                        ? 'text-[#0F766E] font-medium'
                        : darkGrade.largeAA
                          ? 'text-[#B45309]'
                          : 'text-[#A09D94]'
                    }
                  >
                    D {shade.contrastDark.toFixed(1)}
                  </span>
                </div>
              ) : (
                <div className="hidden sm:block" />
              )}

              {/* Row Actions */}
              <div
                className="flex items-center justify-end gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <label
                  title={`Edit shade ${shade.level} colour`}
                  className="relative flex h-8 w-8 items-center justify-center rounded-md text-[#78756C] hover:text-[#171614] hover:bg-[#ECEAE2] transition-colors cursor-pointer"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <input
                    type="color"
                    value={shade.hex}
                    onChange={(e) =>
                      onEditShadeHex(shade.level, e.target.value.toUpperCase())
                    }
                    aria-label={`Edit colour for shade ${shade.level}`}
                    className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
                  />
                </label>

                {shade.isEdited && (
                  <button
                    type="button"
                    onClick={() => onResetShade(shade.level)}
                    title={`Reset shade ${shade.level} to generated value`}
                    aria-label={`Reset shade ${shade.level}`}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-[#0F766E] hover:bg-[#ECEAE2] transition-colors"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onToggleLock(shade.level)}
                  title={
                    shade.locked
                      ? `Unlock shade ${shade.level}`
                      : `Lock shade ${shade.level} from regeneration`
                  }
                  aria-label={
                    shade.locked
                      ? `Unlock shade ${shade.level}`
                      : `Lock shade ${shade.level}`
                  }
                  aria-pressed={shade.locked}
                  className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
                    shade.locked
                      ? 'text-[#181816] bg-[#EAE8E1] hover:bg-[#DFDDD4]'
                      : 'text-[#78756C] hover:text-[#171614] hover:bg-[#ECEAE2]'
                  }`}
                >
                  {shade.locked ? (
                    <Lock className="h-3.5 w-3.5" />
                  ) : (
                    <Unlock className="h-3.5 w-3.5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleCopyOne(shade)}
                  title={`Copy ${formatted}`}
                  aria-label={`Copy shade ${shade.level} value`}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-[#78756C] hover:text-[#171614] hover:bg-[#ECEAE2] transition-colors"
                >
                  {isCopied ? (
                    <Check className="h-3.5 w-3.5 text-[#0F766E]" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
