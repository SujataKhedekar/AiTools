import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  BookmarkPlus,
  Check,
  Copy,
  Lock,
  RotateCcw,
  Shuffle,
} from 'lucide-react';
import {
  ColourFormat,
  ShadeEntry,
  ShadeLevel,
} from '../types/palette';
import {
  formatColour,
  getReadableTextColor,
  getWcagGrade,
} from '../utils/colorScience';

interface ColourGraphProps {
  shades: ShadeEntry[];
  selectedLevel: ShadeLevel;
  onSelectLevel: (level: ShadeLevel) => void;
  onDragShadeLightness: (level: ShadeLevel, targetLightness: number) => void;
  onCopyText: (text: string, label: string) => void;
  onResetCurve: () => void;
  onRandomize: () => void;
  onSavePalette: () => void;
  colourFormat: ColourFormat;
  uppercaseHex: boolean;
  paletteName: string;
  hasCustomOffsets: boolean;
}

const GRAPH_HEIGHT = 236;
const PAD_TOP = 24;
const PAD_BOTTOM = 24;
const USABLE_H = GRAPH_HEIGHT - PAD_TOP - PAD_BOTTOM;

/** Maps OKLCH lightness (0.08..0.99) to SVG Y coordinate (top = bright, bottom = dark) */
function lightnessToY(l: number): number {
  const clamped = Math.max(0.08, Math.min(0.99, l));
  const norm = (clamped - 0.08) / (0.99 - 0.08);
  return PAD_TOP + (1 - norm) * USABLE_H;
}

/** Inverse mapping from pointer Y inside graph container to OKLCH lightness */
function yToLightness(y: number, height: number): number {
  const padT = (PAD_TOP / GRAPH_HEIGHT) * height;
  const padB = (PAD_BOTTOM / GRAPH_HEIGHT) * height;
  const usable = Math.max(1, height - padT - padB);
  const norm = 1 - (y - padT) / usable;
  const clampedNorm = Math.max(0, Math.min(1, norm));
  return 0.08 + clampedNorm * (0.99 - 0.08);
}

/** Builds a smooth SVG path through all 11 shade control points */
function buildSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

export const ColourGraph: React.FC<ColourGraphProps> = ({
  shades,
  selectedLevel,
  onSelectLevel,
  onDragShadeLightness,
  onCopyText,
  onResetCurve,
  onRandomize,
  onSavePalette,
  colourFormat,
  uppercaseHex,
  paletteName,
  hasCustomOffsets,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggingLevel, setDraggingLevel] = useState<ShadeLevel | null>(null);
  const [hoveredLevel, setHoveredLevel] = useState<ShadeLevel | null>(null);
  const [copiedLevel, setCopiedLevel] = useState<ShadeLevel | null>(null);

  const selectedShade =
    shades.find((s) => s.level === selectedLevel) ?? shades[5];

  const activeTooltipShade = useMemo(() => {
    const targetLevel = draggingLevel ?? hoveredLevel;
    if (!targetLevel) return null;
    return shades.find((s) => s.level === targetLevel) ?? null;
  }, [draggingLevel, hoveredLevel, shades]);

  const points = useMemo(
    () =>
      shades.map((shade, idx) => ({
        level: shade.level,
        x: idx * 100 + 50,
        y: lightnessToY(shade.oklch.l),
        shade,
      })),
    [shades]
  );

  const curvePath = useMemo(() => buildSmoothPath(points), [points]);

  const updateFromClientY = useCallback(
    (level: ShadeLevel, clientY: number) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const relY = clientY - rect.top;
      const targetL = yToLightness(relY, rect.height);
      onDragShadeLightness(level, targetL);
    },
    [onDragShadeLightness]
  );

  const handlePointerDown = (
    e: React.PointerEvent<HTMLButtonElement>,
    shade: ShadeEntry
  ) => {
    e.preventDefault();
    onSelectLevel(shade.level);
    if (shade.locked) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDraggingLevel(shade.level);
    updateFromClientY(shade.level, e.clientY);
  };

  const handlePointerMove = (
    e: React.PointerEvent<HTMLButtonElement>,
    shade: ShadeEntry
  ) => {
    if (draggingLevel !== shade.level || shade.locked) return;
    updateFromClientY(shade.level, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (draggingLevel !== null) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Already released
      }
      setDraggingLevel(null);
    }
  };

  const handleNodeKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    idx: number,
    shade: ShadeEntry
  ) => {
    if (e.key === 'ArrowUp' && !shade.locked) {
      e.preventDefault();
      onDragShadeLightness(shade.level, Math.min(0.985, shade.oklch.l + 0.025));
    } else if (e.key === 'ArrowDown' && !shade.locked) {
      e.preventDefault();
      onDragShadeLightness(shade.level, Math.max(0.085, shade.oklch.l - 0.025));
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      e.preventDefault();
      onSelectLevel(shades[idx - 1].level);
    } else if (e.key === 'ArrowRight' && idx < shades.length - 1) {
      e.preventDefault();
      onSelectLevel(shades[idx + 1].level);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCopyShade(shade);
    }
  };

  const handleCopyShade = (shade: ShadeEntry) => {
    const formatted = formatColour(shade, colourFormat, uppercaseHex);
    onCopyText(formatted, `Shade ${shade.level}`);
    setCopiedLevel(shade.level);
    setTimeout(() => {
      setCopiedLevel((curr) => (curr === shade.level ? null : curr));
    }, 1200);
  };

  const tooltipIndex = activeTooltipShade
    ? shades.findIndex((s) => s.level === activeTooltipShade.level)
    : -1;

  return (
    <section
      aria-label="Interactive colour scale graph"
      className="rounded-xl bg-[#FFFFFF] border border-[#E8E6DF] shadow-2xs overflow-hidden"
    >
      {/* Top Bar of Graph Section */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-3.5 border-b border-[#EFECE5]">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="h-5 w-5 rounded-md border border-black/10 shrink-0"
            style={{ backgroundColor: selectedShade.hex }}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs sm:text-[13px]">
              <span className="font-semibold text-[#171614] truncate">
                {paletteName || 'Custom Scale'}
              </span>
              <span className="text-[#C8C5BC]" aria-hidden="true">
                ·
              </span>
              <span className="font-mono font-semibold text-[#0F766E] tabular-nums">
                Shade {selectedShade.level}
              </span>
              <span className="hidden sm:inline text-[#C8C5BC]" aria-hidden="true">
                ·
              </span>
              <span className="hidden sm:inline font-mono text-[#62605A] tabular-nums">
                L {(selectedShade.oklch.l * 100).toFixed(0)}% / C{' '}
                {selectedShade.oklch.c.toFixed(3)} / H{' '}
                {Math.round(selectedShade.oklch.h)}°
              </span>
            </div>
            <p className="text-[11px] text-[#78756C]">
              Drag any circular node vertically to fine-tune shade lightness, or click HEX values to copy.
            </p>
          </div>
        </div>

        {/* Graph Quick Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {hasCustomOffsets && (
            <button
              type="button"
              onClick={onResetCurve}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#FFFFFF] hover:bg-[#F7F6F2] border border-[#E2E0D8] text-xs font-medium text-[#171614] transition-colors whitespace-nowrap shrink-0"
            >
              <RotateCcw className="h-3.5 w-3.5 text-[#62605A]" />
              Reset Curve
            </button>
          )}
          <button
            type="button"
            onClick={onRandomize}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#FFFFFF] hover:bg-[#F7F6F2] border border-[#E2E0D8] text-xs font-medium text-[#171614] transition-colors whitespace-nowrap shrink-0"
          >
            <Shuffle className="h-3.5 w-3.5 text-[#62605A]" />
            Random
          </button>
          <button
            type="button"
            onClick={onSavePalette}
            className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg bg-[#181816] hover:bg-[#2E2D29] text-xs font-semibold text-[#FFFFFF] transition-colors whitespace-nowrap shrink-0"
          >
            <BookmarkPlus className="h-3.5 w-3.5" />
            Save Palette
          </button>
        </div>
      </div>

      {/* Horizontal Interactive Graph Area */}
      <div className="overflow-x-auto">
        <div className="min-w-[680px]">
          <div
            ref={containerRef}
            className="relative select-none touch-none"
            style={{ height: `${GRAPH_HEIGHT}px` }}
            onMouseLeave={() => {
              if (!draggingLevel) setHoveredLevel(null);
            }}
          >
            {/* 11 Full-Height Colour Columns */}
            <div className="grid grid-cols-11 h-full w-full">
              {shades.map((shade) => {
                const isSelected = shade.level === selectedLevel;
                const textColor = getReadableTextColor(shade.hex);
                return (
                  <div
                    key={shade.level}
                    onClick={() => onSelectLevel(shade.level)}
                    onMouseEnter={() => {
                      if (!draggingLevel) setHoveredLevel(shade.level);
                    }}
                    className="relative h-full transition-colors duration-150 cursor-pointer"
                    style={{ backgroundColor: shade.hex }}
                  >
                    {/* Subtle Top Step Number inside colour block */}
                    <div
                      className="absolute top-2.5 inset-x-0 flex items-center justify-center gap-1 pointer-events-none"
                      style={{ color: textColor }}
                    >
                      <span
                        className={`font-mono text-[11px] tabular-nums ${
                          isSelected ? 'font-bold opacity-100' : 'font-medium opacity-75'
                        }`}
                      >
                        {shade.level}
                      </span>
                      {shade.locked && (
                        <Lock className="h-2.5 w-2.5 opacity-85" />
                      )}
                    </div>

                    {/* Active Column Framing */}
                    {isSelected && (
                      <div
                        className="pointer-events-none absolute inset-0 ring-2 ring-inset ring-white shadow-[inset_0_0_0_3px_rgba(24,24,22,0.55)]"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* SVG Lightness Curve & Horizontal Reference Guides */}
            <svg
              viewBox={`0 0 1100 ${GRAPH_HEIGHT}`}
              preserveAspectRatio="none"
              className="pointer-events-none absolute inset-0 h-full w-full"
              aria-hidden="true"
            >
              {[0.75, 0.5, 0.25].map((refL) => {
                const y = lightnessToY(refL);
                return (
                  <line
                    key={refL}
                    x1="0"
                    y1={y}
                    x2="1100"
                    y2={y}
                    stroke="rgba(255,255,255,0.28)"
                    strokeWidth="1"
                    strokeDasharray="4 6"
                  />
                );
              })}

              {/* White Halo Underlay for legibility on dark shades */}
              <path
                d={curvePath}
                fill="none"
                stroke="rgba(255, 255, 255, 0.88)"
                strokeWidth="4.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />

              {/* Crisp Ink Foreground Curve */}
              <path
                d={curvePath}
                fill="none"
                stroke="#181816"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>

            {/* Draggable Circular Points */}
            {points.map((pt, idx) => {
              const isSelected = pt.level === selectedLevel;
              const isDragging = draggingLevel === pt.level;
              const leftPct = ((idx + 0.5) / shades.length) * 100;
              const topPct = (pt.y / GRAPH_HEIGHT) * 100;

              return (
                <button
                  key={pt.level}
                  type="button"
                  role="slider"
                  aria-label={`Shade ${pt.level} lightness ${(pt.shade.oklch.l * 100).toFixed(0)} percent${pt.shade.locked ? ' (locked)' : ''}`}
                  aria-valuemin={8}
                  aria-valuemax={99}
                  aria-valuenow={Math.round(pt.shade.oklch.l * 100)}
                  onPointerDown={(e) => handlePointerDown(e, pt.shade)}
                  onPointerMove={(e) => handlePointerMove(e, pt.shade)}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  onKeyDown={(e) => handleNodeKeyDown(e, idx, pt.shade)}
                  onMouseEnter={() => {
                    if (!draggingLevel) setHoveredLevel(pt.level);
                  }}
                  style={{
                    left: `${leftPct}%`,
                    top: `${topPct}%`,
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full transition-transform duration-150 ${
                    pt.shade.locked
                      ? 'cursor-not-allowed'
                      : isDragging
                        ? 'cursor-grabbing scale-125 z-20'
                        : 'cursor-grab hover:scale-120 z-10'
                  } ${
                    isSelected || isDragging
                      ? 'h-5 w-5 bg-[#181816] ring-[3px] ring-white shadow-md'
                      : 'h-4 w-4 bg-white ring-[2.5px] ring-[#181816] hover:bg-[#F5F4F0]'
                  }`}
                >
                  {pt.shade.isEdited && !pt.shade.locked && (
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        isSelected || isDragging ? 'bg-white' : 'bg-[#0F766E]'
                      }`}
                    />
                  )}
                </button>
              );
            })}

            {/* Floating Hover / Drag Tooltip */}
            {activeTooltipShade && tooltipIndex >= 0 && (
              <div
                style={{
                  left: `${Math.min(
                    88,
                    Math.max(12, ((tooltipIndex + 0.5) / shades.length) * 100)
                  )}%`,
                }}
                className="pointer-events-none absolute top-3 -translate-x-1/2 z-30 rounded-lg bg-[#FFFFFF]/96 border border-[#E2E0D8] px-3 py-2 shadow-lg shadow-black/12 backdrop-blur-xs whitespace-nowrap"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-3.5 w-3.5 rounded-xs border border-black/10 shrink-0"
                    style={{ backgroundColor: activeTooltipShade.hex }}
                  />
                  <span className="font-mono text-xs font-semibold text-[#171614] tabular-nums">
                    {activeTooltipShade.level}
                  </span>
                  <span className="text-[#C8C5BC]">/</span>
                  <span className="font-mono text-xs font-semibold text-[#0F766E] tabular-nums">
                    {uppercaseHex
                      ? activeTooltipShade.hex.toUpperCase()
                      : activeTooltipShade.hex.toLowerCase()}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2.5 font-mono text-[10px] text-[#62605A] tabular-nums">
                  <span>L {(activeTooltipShade.oklch.l * 100).toFixed(1)}%</span>
                  <span>·</span>
                  <span>
                    White {activeTooltipShade.contrastWhite.toFixed(1)}:1 (
                    {getWcagGrade(activeTooltipShade.contrastWhite).label})
                  </span>
                  <span>·</span>
                  <span>
                    Dark {activeTooltipShade.contrastDark.toFixed(1)}:1
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Swatch Metadata Strip */}
          <div className="grid grid-cols-11 bg-[#FAF9F6] border-t border-[#E8E6DF]">
            {shades.map((shade) => {
              const isSelected = shade.level === selectedLevel;
              const isCopied = copiedLevel === shade.level;
              const hexLabel = uppercaseHex
                ? shade.hex.toUpperCase()
                : shade.hex.toLowerCase();

              return (
                <button
                  key={shade.level}
                  type="button"
                  onClick={() => {
                    onSelectLevel(shade.level);
                    handleCopyShade(shade);
                  }}
                  title={`Click to copy ${formatColour(shade, colourFormat, uppercaseHex)}`}
                  className={`group flex flex-col items-center justify-center py-2.5 px-1 border-r last:border-r-0 border-[#ECEAE2] transition-colors ${
                    isSelected
                      ? 'bg-[#FFFFFF]'
                      : 'hover:bg-[#F2F0EA]'
                  }`}
                >
                  <span
                    className={`font-mono text-[11px] font-semibold tabular-nums ${
                      isSelected ? 'text-[#171614]' : 'text-[#52504B]'
                    }`}
                  >
                    {shade.level}
                  </span>
                  <span className="mt-0.5 flex items-center gap-1 font-mono text-[10px] text-[#78756C] group-hover:text-[#171614] tabular-nums">
                    {isCopied ? (
                      <>
                        <Check className="h-2.5 w-2.5 text-[#0F766E]" />
                        <span className="text-[#0F766E] font-medium">Copied</span>
                      </>
                    ) : (
                      <>
                        <span>{hexLabel}</span>
                        <Copy className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
