import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Bell,
  Check,
  Mail,
  Moon,
  Search,
  Sun,
} from 'lucide-react';
import { ShadeEntry, ShadeLevel } from '../types/palette';
import { getReadableTextColor } from '../utils/colorScience';

interface LivePreviewProps {
  shades: ShadeEntry[];
  colourName: string;
  paletteName: string;
}

export const LivePreview: React.FC<LivePreviewProps> = ({
  shades,
  colourName,
  paletteName,
}) => {
  const [previewTheme, setPreviewTheme] = useState<'light' | 'dark'>('light');
  const [emailInput, setEmailInput] = useState('design@aivora.dev');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'studio'>('studio');
  const [submittedNotice, setSubmittedNotice] = useState(false);

  const map = useMemo(() => {
    const rec = {} as Record<ShadeLevel, string>;
    for (const s of shades) rec[s.level] = s.hex;
    return rec;
  }, [shades]);

  const isLight = previewTheme === 'light';
  const primaryTextOn500 = getReadableTextColor(map[500]);
  const primaryTextOn600 = getReadableTextColor(map[600]);

  const canvasBg = isLight ? '#F7F6F2' : '#121210';
  const cardBg = isLight ? '#FFFFFF' : '#1A1A17';
  const subtleBg = isLight ? map[50] : map[950];
  const borderCol = isLight ? map[200] : map[800];
  const headingCol = isLight ? map[950] : map[50];
  const bodyCol = isLight ? '#4A4944' : '#B5B2AA';
  const mutedCol = isLight ? '#78756C' : '#85827A';

  const handleSampleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedNotice(true);
    setTimeout(() => setSubmittedNotice(false), 2000);
  };

  return (
    <section
      aria-label="Live UI component preview"
      className="rounded-xl bg-[#FFFFFF] border border-[#E8E6DF] shadow-2xs overflow-hidden"
    >
      {/* Preview Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 border-b border-[#EFECE5]">
        <div>
          <h2 className="text-[13px] font-semibold text-[#171614]">
            Live UI Component Preview
          </h2>
          <p className="text-[11px] text-[#78756C]">
            Real-time components rendered directly with your {colourName || 'primary'} 50–950 scale
          </p>
        </div>

        <div
          role="group"
          aria-label="Preview surface mode"
          className="flex items-center p-0.5 rounded-lg bg-[#F5F4F0] border border-[#E5E3DC]"
        >
          <button
            type="button"
            onClick={() => setPreviewTheme('light')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              isLight
                ? 'bg-[#181816] text-[#FFFFFF] font-semibold'
                : 'text-[#62605A] hover:text-[#171614]'
            }`}
          >
            <Sun className="h-3.5 w-3.5" />
            Light
          </button>
          <button
            type="button"
            onClick={() => setPreviewTheme('dark')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              !isLight
                ? 'bg-[#181816] text-[#FFFFFF] font-semibold'
                : 'text-[#62605A] hover:text-[#171614]'
            }`}
          >
            <Moon className="h-3.5 w-3.5" />
            Dark
          </button>
        </div>
      </div>

      {/* Preview Stage */}
      <div
        className="p-4 sm:p-6 space-y-5 transition-colors duration-200"
        style={{ backgroundColor: canvasBg }}
      >
        {/* 1. Navigation Bar Preview */}
        <div
          className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 rounded-xl border"
          style={{
            backgroundColor: cardBg,
            borderColor: borderCol,
          }}
        >
          <div className="flex items-center gap-2.5">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-lg font-bold text-xs"
              style={{
                backgroundColor: map[600],
                color: primaryTextOn600,
              }}
            >
              {(paletteName || 'A').charAt(0).toUpperCase()}
            </span>
            <span
              className="text-sm font-bold tracking-tight"
              style={{ color: headingCol }}
            >
              {paletteName || 'Aivora UI'}
            </span>
          </div>

          <div
            className="hidden sm:flex items-center gap-5 text-xs font-medium"
            style={{ color: bodyCol }}
          >
            <span style={{ color: isLight ? map[700] : map[300], fontWeight: 600 }}>
              Overview
            </span>
            <span>Components</span>
            <span>Tokens</span>
            <span>Billing</span>
          </div>

          <button
            type="button"
            onClick={() => setSelectedPlan((p) => (p === 'studio' ? 'starter' : 'studio'))}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-90"
            style={{
              backgroundColor: map[600],
              color: primaryTextOn600,
            }}
          >
            Get Started
          </button>
        </div>

        {/* 2. Buttons & Interactive States */}
        <div
          className="p-4 rounded-xl border space-y-3"
          style={{ backgroundColor: cardBg, borderColor: borderCol }}
        >
          <div className="flex items-center justify-between">
            <span
              className="text-xs font-semibold"
              style={{ color: headingCol }}
            >
              Button Hierarchy
            </span>
            <span
              className="font-mono text-[11px] tabular-nums"
              style={{ color: mutedCol }}
            >
              500 · 600 · 100 · 900
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setSubmittedNotice(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-opacity hover:opacity-90"
              style={{
                backgroundColor: map[600],
                color: primaryTextOn600,
              }}
            >
              Primary Action
              <ArrowRight className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              className="px-4 py-2 rounded-lg text-xs font-semibold transition-opacity hover:opacity-90"
              style={{
                backgroundColor: map[500],
                color: primaryTextOn500,
              }}
            >
              Accent 500
            </button>

            <button
              type="button"
              className="px-4 py-2 rounded-lg text-xs font-semibold"
              style={{
                backgroundColor: isLight ? map[100] : map[900],
                color: isLight ? map[800] : map[200],
              }}
            >
              Subtle Fill
            </button>

            <button
              type="button"
              className="px-4 py-2 rounded-lg text-xs font-semibold border"
              style={{
                backgroundColor: 'transparent',
                borderColor: isLight ? map[300] : map[700],
                color: isLight ? map[700] : map[300],
              }}
            >
              Outline
            </button>
          </div>
        </div>

        {/* 3. Cards & Form Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            className="p-4 rounded-xl border flex flex-col justify-between gap-4"
            style={{ backgroundColor: cardBg, borderColor: borderCol }}
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span
                  className="text-xs font-semibold"
                  style={{ color: isLight ? map[700] : map[300] }}
                >
                  Workspace Plan
                </span>
                <span
                  className="font-mono text-xs font-semibold tabular-nums"
                  style={{ color: headingCol }}
                >
                  {selectedPlan === 'studio' ? '$48 / mo' : '$19 / mo'}
                </span>
              </div>
              <h3
                className="mt-1.5 text-base font-bold tracking-tight"
                style={{ color: headingCol }}
              >
                {selectedPlan === 'studio'
                  ? 'Studio Design System'
                  : 'Starter Token Kit'}
              </h3>
              <p className="mt-1 text-xs leading-relaxed" style={{ color: bodyCol }}>
                Synchronize generated CSS custom properties and Tailwind scales across every repository automatically.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {(['starter', 'studio'] as const).map((tier) => {
                const active = selectedPlan === tier;
                return (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => setSelectedPlan(tier)}
                    className="p-2.5 rounded-lg border text-left transition-colors"
                    style={{
                      backgroundColor: active
                        ? subtleBg
                        : 'transparent',
                      borderColor: active
                        ? map[500]
                        : borderCol,
                    }}
                  >
                    <span
                      className="block text-xs font-semibold capitalize"
                      style={{ color: headingCol }}
                    >
                      {tier}
                    </span>
                    <span
                      className="block font-mono text-[11px] tabular-nums mt-0.5"
                      style={{ color: mutedCol }}
                    >
                      {tier === 'studio' ? 'Unlimited palettes' : 'Up to 10 scales'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <form
            onSubmit={handleSampleSubmit}
            className="p-4 rounded-xl border space-y-3.5"
            style={{ backgroundColor: cardBg, borderColor: borderCol }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold" style={{ color: headingCol }}>
                Input & Surface States
              </span>
              <Bell
                className="h-4 w-4"
                style={{ color: isLight ? map[600] : map[400] }}
              />
            </div>

            <div>
              <label
                htmlFor="preview-email"
                className="block text-[11px] font-medium mb-1"
                style={{ color: bodyCol }}
              >
                Team notification email
              </label>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5"
                  style={{ color: mutedCol }}
                />
                <input
                  id="preview-email"
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full h-9 pl-8.5 pr-3 rounded-lg border text-xs focus:outline-none"
                  style={{
                    backgroundColor: isLight ? '#FFFFFF' : '#121210',
                    borderColor: isLight ? map[300] : map[700],
                    color: headingCol,
                  }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-xs" style={{ color: bodyCol }}>
                Publish contrast reports on push
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={notificationsEnabled}
                onClick={() => setNotificationsEnabled((v) => !v)}
                className="relative h-5 w-9 rounded-full transition-colors shrink-0"
                style={{
                  backgroundColor: notificationsEnabled
                    ? map[600]
                    : isLight
                      ? map[200]
                      : map[800],
                }}
              >
                <span
                  className={`block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                    notificationsEnabled ? 'translate-x-4.5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div
              className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-xs"
              style={{
                backgroundColor: subtleBg,
                borderColor: isLight ? map[200] : map[800],
                color: isLight ? map[900] : map[100],
              }}
            >
              <span className="flex items-center gap-1.5">
                {submittedNotice ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Preferences updated in preview
                  </>
                ) : (
                  <>
                    <Search className="h-3.5 w-3.5" />
                    Using shades {isLight ? '50 / 200 / 900' : '950 / 800 / 100'}
                  </>
                )}
              </span>
              <button
                type="submit"
                className="font-semibold underline underline-offset-2 shrink-0"
                style={{ color: isLight ? map[700] : map[300] }}
              >
                Save
              </button>
            </div>
          </form>
        </div>

        {/* 4. Full Scale Strip Reference */}
        <div
          className="p-3.5 rounded-xl border"
          style={{ backgroundColor: cardBg, borderColor: borderCol }}
        >
          <div className="grid grid-cols-11 gap-1">
            {shades.map((s) => (
              <div key={s.level} className="text-center">
                <div
                  className="h-7 rounded-md border border-black/10"
                  style={{ backgroundColor: s.hex }}
                />
                <span
                  className="mt-1 block font-mono text-[10px] tabular-nums"
                  style={{ color: mutedCol }}
                >
                  {s.level}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
