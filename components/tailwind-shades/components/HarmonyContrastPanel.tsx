import React, { useMemo, useState } from 'react';
import {
  ArrowLeftRight,
  Check,
  CheckCircle2,
  Copy,
  Sparkles,
  XCircle,
} from 'lucide-react';
import {
  HarmonyKind,
  ShadeEntry,
} from '../types/palette';
import {
  contrastRatio,
  generateHarmony,
  getReadableTextColor,
  getWcagGrade,
} from '../utils/colorScience';

interface HarmonyContrastPanelProps {
  baseHex: string;
  shades: ShadeEntry[];
  onApplyBaseHex: (hex: string, label?: string) => void;
  onCopyText: (text: string, label: string) => void;
  uppercaseHex: boolean;
}

const HARMONY_OPTIONS: { id: HarmonyKind; label: string }[] = [
  { id: 'complementary', label: 'Complementary' },
  { id: 'analogous', label: 'Analogous' },
  { id: 'triadic', label: 'Triadic' },
  { id: 'split-complementary', label: 'Split Comp.' },
  { id: 'monochromatic', label: 'Monochromatic' },
];

type ContrastChoice = 'white' | 'dark' | string;

export const HarmonyContrastPanel: React.FC<HarmonyContrastPanelProps> = ({
  baseHex,
  shades,
  onApplyBaseHex,
  onCopyText,
  uppercaseHex,
}) => {
  const [harmonyKind, setHarmonyKind] = useState<HarmonyKind>('complementary');
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [fgChoice, setFgChoice] = useState<ContrastChoice>('50');
  const [bgChoice, setBgChoice] = useState<ContrastChoice>('700');

  const harmonyList = useMemo(
    () => generateHarmony(baseHex, harmonyKind),
    [baseHex, harmonyKind]
  );

  const resolveChoice = (choice: ContrastChoice): { label: string; hex: string } => {
    if (choice === 'white') return { label: 'White (#FFFFFF)', hex: '#FFFFFF' };
    if (choice === 'dark') return { label: 'Dark (#171614)', hex: '#171614' };
    const found = shades.find((s) => String(s.level) === choice);
    if (found) return { label: `Shade ${found.level}`, hex: found.hex };
    return { label: 'Shade 500', hex: baseHex };
  };

  const fg = resolveChoice(fgChoice);
  const bg = resolveChoice(bgChoice);
  const ratio = contrastRatio(fg.hex, bg.hex);
  const grade = getWcagGrade(ratio);

  const fmtHex = (hex: string) =>
    uppercaseHex ? hex.toUpperCase() : hex.toLowerCase();

  const handleCopyHex = (hex: string, label: string) => {
    const val = fmtHex(hex);
    onCopyText(val, label);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex((curr) => (curr === hex ? null : curr)), 1200);
  };

  return (
    <div className="space-y-4">
      {/* 1. Colour Harmonies Explorer */}
      <section
        aria-label="Colour harmony suggestions"
        className="rounded-xl bg-[#FFFFFF] border border-[#E8E6DF] shadow-2xs overflow-hidden"
      >
        <div className="px-4 py-3.5 border-b border-[#EFECE5] space-y-3">
          <div>
            <h2 className="text-[13px] font-semibold text-[#171614]">
              Colour Harmonies
            </h2>
            <p className="text-[11px] text-[#78756C]">
              Perceptually balanced OKLCH hue relationships derived from {fmtHex(baseHex)}
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Colour harmony types"
            className="flex items-center gap-1 overflow-x-auto pb-0.5"
          >
            {HARMONY_OPTIONS.map((opt) => {
              const active = harmonyKind === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setHarmonyKind(opt.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-[#181816] text-[#FFFFFF] font-semibold'
                      : 'text-[#62605A] hover:text-[#171614] hover:bg-[#F5F4F0]'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Harmony Colour Cards */}
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {harmonyList.map((item) => {
            const swatchText = getReadableTextColor(item.hex);
            const isCopied = copiedHex === item.hex;
            return (
              <div
                key={`${item.label}-${item.angle}`}
                className="rounded-lg bg-[#FAF9F6] border border-[#E8E6DF] overflow-hidden"
              >
                <div
                  className="h-20 px-3 py-2.5 flex items-end justify-between"
                  style={{ backgroundColor: item.hex, color: swatchText }}
                >
                  <span className="text-xs font-semibold">{item.label}</span>
                  <span className="font-mono text-[11px] tabular-nums opacity-85">
                    {item.angle}
                  </span>
                </div>
                <div className="p-3 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-[#171614] tabular-nums">
                      {fmtHex(item.hex)}
                    </span>
                    <span className="text-[11px] text-[#78756C] truncate">
                      {item.role}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleCopyHex(item.hex, item.label)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 h-8 px-2.5 rounded-md bg-[#FFFFFF] hover:bg-[#F2F0EA] border border-[#E2E0D8] text-[11px] font-medium text-[#171614] transition-colors"
                    >
                      {isCopied ? (
                        <>
                          <Check className="h-3 w-3 text-[#0F766E]" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 text-[#62605A]" />
                          Copy
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => onApplyBaseHex(item.hex, item.label)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 h-8 px-2.5 rounded-md bg-[#181816] hover:bg-[#2E2D29] text-[11px] font-medium text-[#FFFFFF] transition-colors whitespace-nowrap"
                    >
                      <Sparkles className="h-3 w-3" />
                      Use Base
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 2. WCAG 2.1 Contrast Checker */}
      <section
        aria-label="WCAG accessibility contrast checker"
        className="rounded-xl bg-[#FFFFFF] border border-[#E8E6DF] shadow-2xs overflow-hidden"
      >
        <div className="px-4 py-3.5 border-b border-[#EFECE5] flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-[13px] font-semibold text-[#171614]">
              WCAG 2.1 Contrast Checker
            </h2>
            <p className="text-[11px] text-[#78756C]">
              Verify text legibility across any two shades from your scale
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              const prevFg = fgChoice;
              setFgChoice(bgChoice);
              setBgChoice(prevFg);
            }}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#FFFFFF] hover:bg-[#F7F6F2] border border-[#E2E0D8] text-xs font-medium text-[#171614] transition-colors"
          >
            <ArrowLeftRight className="h-3.5 w-3.5 text-[#62605A]" />
            Swap Colours
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="wcag-fg-select"
                className="block text-[11px] font-medium text-[#62605A] mb-1.5"
              >
                Foreground (Text)
              </label>
              <div className="flex items-center gap-2">
                <span
                  className="h-9 w-9 rounded-lg border border-black/10 shrink-0"
                  style={{ backgroundColor: fg.hex }}
                />
                <select
                  id="wcag-fg-select"
                  value={fgChoice}
                  onChange={(e) => setFgChoice(e.target.value)}
                  className="flex-1 h-9 px-3 rounded-lg bg-[#FAF9F6] border border-[#E2E0D8] text-xs font-mono text-[#171614] focus:bg-white focus:border-[#181816] focus:outline-none"
                >
                  <option value="white">White — #FFFFFF</option>
                  <option value="dark">Dark — #171614</option>
                  {shades.map((s) => (
                    <option key={s.level} value={String(s.level)}>
                      Shade {s.level} — {fmtHex(s.hex)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="wcag-bg-select"
                className="block text-[11px] font-medium text-[#62605A] mb-1.5"
              >
                Background (Surface)
              </label>
              <div className="flex items-center gap-2">
                <span
                  className="h-9 w-9 rounded-lg border border-black/10 shrink-0"
                  style={{ backgroundColor: bg.hex }}
                />
                <select
                  id="wcag-bg-select"
                  value={bgChoice}
                  onChange={(e) => setBgChoice(e.target.value)}
                  className="flex-1 h-9 px-3 rounded-lg bg-[#FAF9F6] border border-[#E2E0D8] text-xs font-mono text-[#171614] focus:bg-white focus:border-[#181816] focus:outline-none"
                >
                  <option value="white">White — #FFFFFF</option>
                  <option value="dark">Dark — #171614</option>
                  {shades.map((s) => (
                    <option key={s.level} value={String(s.level)}>
                      Shade {s.level} — {fmtHex(s.hex)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Live Specimen & Ratio Readout */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-4 items-stretch">
            <div
              className="p-5 rounded-xl border border-black/10 flex flex-col justify-center"
              style={{ backgroundColor: bg.hex, color: fg.hex }}
            >
              <p className="text-lg font-bold tracking-tight">
                Accessible interface typography
              </p>
              <p className="mt-1.5 text-sm leading-relaxed opacity-95">
                Body text at 14px–16px requires at least a 4.5:1 ratio for WCAG AA compliance and 7.0:1 for AAA.
              </p>
              <p className="mt-3 font-mono text-xs tabular-nums opacity-85">
                {fg.label} on {bg.label}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E8E6DF] flex flex-col justify-between">
              <div>
                <span className="block text-[11px] text-[#78756C]">
                  Contrast Ratio
                </span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="font-mono text-3xl font-bold text-[#171614] tabular-nums">
                    {ratio.toFixed(2)}
                  </span>
                  <span className="font-mono text-xs text-[#78756C]">: 1</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-[#E8E6DF] space-y-1.5 text-xs">
                {[
                  { label: 'Normal AA (4.5:1)', pass: grade.normalAA },
                  { label: 'Normal AAA (7.0:1)', pass: grade.normalAAA },
                  { label: 'Large AA (3.0:1)', pass: grade.largeAA },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="text-[#52504B]">{row.label}</span>
                    <span
                      className={`inline-flex items-center gap-1 font-mono text-[11px] font-semibold ${
                        row.pass ? 'text-[#0F766E]' : 'text-[#DC2626]'
                      }`}
                    >
                      {row.pass ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Pass
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3.5 w-3.5" />
                          Fail
                        </>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Full Scale Accessibility Quick-Matrix */}
          <div className="pt-2">
            <h3 className="text-xs font-semibold text-[#171614] mb-2">
              Scale Accessibility Summary (Click to test pair)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-mono text-[11px] tabular-nums">
                <thead>
                  <tr className="border-b border-[#E8E6DF] text-[#8C8980]">
                    <th className="py-2 pr-3 font-medium">Shade</th>
                    <th className="py-2 px-3 font-medium">HEX</th>
                    <th className="py-2 px-3 font-medium text-right">vs White</th>
                    <th className="py-2 px-3 font-medium text-right">vs Dark</th>
                    <th className="py-2 pl-3 font-medium text-right">Best Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EFEA]">
                  {shades.map((s) => {
                    const gWhite = getWcagGrade(s.contrastWhite);
                    const gDark = getWcagGrade(s.contrastDark);
                    const best =
                      s.contrastWhite >= s.contrastDark
                        ? { target: 'White', grade: gWhite.label }
                        : { target: 'Dark', grade: gDark.label };
                    return (
                      <tr
                        key={s.level}
                        onClick={() => {
                          setBgChoice(String(s.level));
                          setFgChoice(
                            s.contrastWhite >= s.contrastDark ? 'white' : 'dark'
                          );
                        }}
                        className="hover:bg-[#FAF9F6] cursor-pointer transition-colors"
                      >
                        <td className="py-2 pr-3">
                          <span className="inline-flex items-center gap-2 text-[#171614] font-medium">
                            <span
                              className="h-3.5 w-3.5 rounded-xs border border-black/10 shrink-0"
                              style={{ backgroundColor: s.hex }}
                            />
                            {s.level}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-[#62605A]">
                          {fmtHex(s.hex)}
                        </td>
                        <td
                          className={`py-2 px-3 text-right ${
                            gWhite.normalAA
                              ? 'text-[#0F766E] font-medium'
                              : 'text-[#A09D94]'
                          }`}
                        >
                          {s.contrastWhite.toFixed(2)}:1
                        </td>
                        <td
                          className={`py-2 px-3 text-right ${
                            gDark.normalAA
                              ? 'text-[#0F766E] font-medium'
                              : 'text-[#A09D94]'
                          }`}
                        >
                          {s.contrastDark.toFixed(2)}:1
                        </td>
                        <td className="py-2 pl-3 text-right text-[#171614] font-medium">
                          {best.grade} on {best.target}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
