import { useState } from 'react';
import { Moon, RotateCcw, Sun } from 'lucide-react';
import { FONT_CATALOG, SPECIMEN_COPY_PRESETS, SPECIMEN_IMAGES } from '../data/fonts';
import { PairingState, PreviewTemplate, SpecimenCopy } from '../types/typography';
import { getFontStack } from '../utils/fontLoader';

interface SpecimenCanvasProps {
  state: PairingState;
  template: PreviewTemplate;
  onChangeTemplate: (t: PreviewTemplate) => void;
  copy: SpecimenCopy;
  onUpdateCopyField: (field: keyof SpecimenCopy, value: string) => void;
  onSelectCopyPreset: (presetId: string) => void;
  onResetCopy: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

const TEMPLATES: Array<{ id: PreviewTemplate; label: string }> = [
  { id: 'editorial', label: 'Editorial' },
  { id: 'landing', label: 'Landing' },
  { id: 'specimen', label: 'Specimen' },
  { id: 'ui', label: 'UI Cards' },
];

export function SpecimenCanvas({
  state,
  template,
  onChangeTemplate,
  copy,
  onUpdateCopyField,
  onSelectCopyPreset,
  onResetCopy,
  darkMode,
  onToggleDarkMode,
}: SpecimenCanvasProps) {
  const [archImageFailed, setArchImageFailed] = useState(false);
  const [objectImageFailed, setObjectImageFailed] = useState(false);

  const headingStyle: React.CSSProperties = {
    fontFamily: getFontStack(state.heading.family),
    fontWeight: state.heading.weight,
    fontStyle: state.heading.italic ? 'italic' : 'normal',
    lineHeight: state.heading.lineHeight,
    letterSpacing: `${state.heading.letterSpacing}em`,
    color: state.palette.headingColor,
  };

  const bodyStyle: React.CSSProperties = {
    fontFamily: getFontStack(state.body.family),
    fontWeight: state.body.weight,
    fontSize: `${state.body.size}px`,
    lineHeight: state.body.lineHeight,
    letterSpacing: `${state.body.letterSpacing}em`,
    color: state.palette.bodyColor,
  };

  const accentStyle: React.CSSProperties = {
    fontFamily: getFontStack(state.accent.family),
    fontWeight: state.accent.weight,
    letterSpacing: `${state.accent.letterSpacing}em`,
    color: state.palette.mutedColor,
  };

  const scaleRatio = (state.heading.size / state.body.size).toFixed(2);
  const headingEntry = FONT_CATALOG.find((f) => f.family === state.heading.family);
  const bodyEntry = FONT_CATALOG.find((f) => f.family === state.body.family);

  return (
    <div className="flex min-w-0 flex-1 flex-col bg-zinc-100/70 dark:bg-zinc-950">
      {/* Workspace Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 bg-white px-4 py-2.5 sm:px-6 dark:border-zinc-800 dark:bg-zinc-950">
        {/* Template Switcher */}
        <div
          role="tablist"
          aria-label="Specimen layout templates"
          className="flex items-center gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900"
        >
          {TEMPLATES.map((t) => {
            const active = template === t.id;
            return (
              <button
                key={t.id}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => onChangeTemplate(t.id)}
                className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors duration-150 ${
                  active
                    ? 'bg-white text-zinc-950 shadow-xs dark:bg-zinc-800 dark:text-zinc-50'
                    : 'text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Right Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <label className="sr-only" htmlFor="copy-preset-select">
            Sample copy preset
          </label>
          <select
            id="copy-preset-select"
            value={copy.id}
            onChange={(e) => onSelectCopyPreset(e.target.value)}
            className="cursor-pointer rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 focus:border-blue-600 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
          >
            {SPECIMEN_COPY_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                Copy: {preset.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={onResetCopy}
            title="Reset edited specimen text"
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-600 whitespace-nowrap transition-colors hover:bg-zinc-50 hover:text-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Text
          </button>

          <button
            type="button"
            onClick={onToggleDarkMode}
            aria-label={darkMode ? 'Switch interface to light mode' : 'Switch interface to dark mode'}
            title={darkMode ? 'Light interface' : 'Dark interface'}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-600 whitespace-nowrap transition-colors hover:bg-zinc-50 hover:text-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            {darkMode ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            {darkMode ? 'Light UI' : 'Dark UI'}
          </button>
        </div>
      </div>

      {/* Specimen Canvas Viewport */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-10">
        {/* Quiet Specimen Summary Bar (unboxed metadata) */}
        <div className="mx-auto mb-4 flex max-w-5xl flex-wrap items-center justify-between gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {state.heading.family}
            </span>
            <span aria-hidden="true">/</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {state.body.family}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-[var(--font-ui-mono)] tabular-nums">
              {scaleRatio}× display-to-body ratio
            </span>
          </div>
          <span>Click any specimen text to edit directly · Press Space to shuffle</span>
        </div>

        {/* Main Specimen Surface */}
        <article
          className="mx-auto max-w-5xl overflow-hidden rounded-xl border transition-colors duration-200"
          style={{
            backgroundColor: state.palette.background,
            borderColor: state.palette.border,
          }}
        >
          {/* TEMPLATE 1: EDITORIAL */}
          {template === 'editorial' && (
            <div className="px-6 py-10 sm:px-12 sm:py-14 lg:px-16 lg:py-16">
              <div
                data-editable="true"
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => onUpdateCopyField('kicker', e.currentTarget.textContent || '')}
                className="mb-4 text-xs"
                style={accentStyle}
              >
                {copy.kicker}
              </div>

              <h1
                data-editable="true"
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => onUpdateCopyField('headline', e.currentTarget.textContent || '')}
                className="max-w-3xl text-balance"
                style={{
                  ...headingStyle,
                  fontSize: `clamp(${Math.max(28, Math.round(state.heading.size * 0.62))}px, 4.5vw, ${state.heading.size}px)`,
                }}
              >
                {copy.headline}
              </h1>

              <p
                data-editable="true"
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => onUpdateCopyField('deck', e.currentTarget.textContent || '')}
                className="mt-5 max-w-2xl"
                style={{
                  ...bodyStyle,
                  fontSize: `${Math.round(state.body.size * 1.18)}px`,
                  lineHeight: Math.max(1.35, state.body.lineHeight - 0.1),
                  color: state.palette.mutedColor,
                }}
              >
                {copy.deck}
              </p>

              <div
                data-editable="true"
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => onUpdateCopyField('byline', e.currentTarget.textContent || '')}
                className="mt-6 border-t pt-4 text-xs"
                style={{
                  ...accentStyle,
                  borderColor: state.palette.border,
                }}
              >
                {copy.byline}
              </div>

              {/* Editorial Specimen Photograph */}
              <figure className="my-9 overflow-hidden rounded-lg border" style={{ borderColor: state.palette.border }}>
                {archImageFailed ? (
                  <div
                    className="flex aspect-video items-center justify-center p-8 text-center"
                    style={{ backgroundColor: state.palette.surface }}
                  >
                    <span className="text-xs" style={accentStyle}>
                      Architectural daylight gallery study — 16:9 editorial specimen
                    </span>
                  </div>
                ) : (
                  <img
                    src={SPECIMEN_IMAGES.architecture}
                    alt="Minimalist Swiss concrete and glass museum gallery interior bathed in northern daylight"
                    referrerPolicy="no-referrer"
                    onError={() => setArchImageFailed(true)}
                    className="aspect-video w-full object-cover"
                  />
                )}
              </figure>

              {/* Editorial Body & Pull Quote */}
              <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
                <div className="space-y-5 lg:col-span-8">
                  <p
                    data-editable="true"
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => onUpdateCopyField('bodyOne', e.currentTarget.textContent || '')}
                    style={{
                      ...bodyStyle,
                      maxWidth: `${state.body.measure}ch`,
                    }}
                  >
                    {copy.bodyOne}
                  </p>
                  <p
                    data-editable="true"
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => onUpdateCopyField('bodyTwo', e.currentTarget.textContent || '')}
                    style={{
                      ...bodyStyle,
                      maxWidth: `${state.body.measure}ch`,
                    }}
                  >
                    {copy.bodyTwo}
                  </p>
                </div>

                <aside
                  className="flex flex-col justify-between border-t pt-6 lg:col-span-4 lg:border-t-0 lg:border-l lg:pl-8 lg:pt-0"
                  style={{ borderColor: state.palette.border }}
                >
                  <blockquote
                    data-editable="true"
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => onUpdateCopyField('pullQuote', e.currentTarget.textContent || '')}
                    className="text-balance"
                    style={{
                      ...headingStyle,
                      fontSize: `${Math.max(20, Math.round(state.heading.size * 0.44))}px`,
                      lineHeight: Math.min(1.4, state.heading.lineHeight + 0.14),
                    }}
                  >
                    {copy.pullQuote}
                  </blockquote>

                  <div className="mt-8 space-y-1 text-xs" style={accentStyle}>
                    <div>Display: {state.heading.family} ({state.heading.weight})</div>
                    <div>Prose: {state.body.family} ({state.body.weight})</div>
                    <div className="tabular-nums">
                      Measure: {state.body.measure}ch · Leading: {state.body.lineHeight}
                    </div>
                  </div>
                </aside>
              </div>
            </div>
          )}

          {/* TEMPLATE 2: LANDING HERO & FEATURES */}
          {template === 'landing' && (
            <div className="px-6 py-10 sm:px-12 sm:py-14 lg:px-14">
              {/* Mock Minimal Product Nav inside Specimen */}
              <div
                className="mb-12 flex items-center justify-between border-b pb-5"
                style={{ borderColor: state.palette.border }}
              >
                <span
                  className="text-lg"
                  style={{
                    ...headingStyle,
                    fontSize: '20px',
                  }}
                >
                  Monolith
                </span>
                <div className="hidden items-center gap-6 text-xs sm:flex" style={bodyStyle}>
                  <span style={{ fontSize: '13px', color: state.palette.mutedColor }}>Instruments</span>
                  <span style={{ fontSize: '13px', color: state.palette.mutedColor }}>Specifications</span>
                  <span style={{ fontSize: '13px', color: state.palette.mutedColor }}>Journal</span>
                </div>
                <span
                  className="rounded-md px-3.5 py-1.5 text-xs font-medium text-white"
                  style={{
                    backgroundColor: state.palette.accentColor,
                    fontFamily: getFontStack(state.body.family),
                  }}
                >
                  {copy.ctaPrimary}
                </span>
              </div>

              {/* 2-Column Split Hero */}
              <div className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-12">
                <div className="flex flex-col justify-center lg:col-span-7">
                  <div
                    data-editable="true"
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => onUpdateCopyField('kicker', e.currentTarget.textContent || '')}
                    className="mb-3 text-xs"
                    style={accentStyle}
                  >
                    {copy.kicker}
                  </div>
                  <h1
                    data-editable="true"
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => onUpdateCopyField('headline', e.currentTarget.textContent || '')}
                    className="text-balance"
                    style={{
                      ...headingStyle,
                      fontSize: `clamp(${Math.max(28, Math.round(state.heading.size * 0.62))}px, 4vw, ${state.heading.size}px)`,
                    }}
                  >
                    {copy.headline}
                  </h1>
                  <p
                    data-editable="true"
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => onUpdateCopyField('deck', e.currentTarget.textContent || '')}
                    className="mt-5"
                    style={{
                      ...bodyStyle,
                      maxWidth: `${Math.min(54, state.body.measure)}ch`,
                    }}
                  >
                    {copy.deck}
                  </p>
                  <div className="mt-8 flex flex-wrap items-center gap-3">
                    <span
                      data-editable="true"
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => onUpdateCopyField('ctaPrimary', e.currentTarget.textContent || '')}
                      className="rounded-md px-5 py-2.5 text-sm font-medium text-white"
                      style={{
                        backgroundColor: state.palette.accentColor,
                        fontFamily: getFontStack(state.body.family),
                      }}
                    >
                      {copy.ctaPrimary}
                    </span>
                    <span
                      data-editable="true"
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => onUpdateCopyField('ctaSecondary', e.currentTarget.textContent || '')}
                      className="rounded-md border px-5 py-2.5 text-sm font-medium"
                      style={{
                        borderColor: state.palette.border,
                        color: state.palette.headingColor,
                        fontFamily: getFontStack(state.body.family),
                      }}
                    >
                      {copy.ctaSecondary}
                    </span>
                  </div>
                </div>

                <div
                  className="overflow-hidden rounded-lg border lg:col-span-5"
                  style={{ borderColor: state.palette.border }}
                >
                  {objectImageFailed ? (
                    <div
                      className="flex h-full min-h-[260px] items-center justify-center p-6 text-center"
                      style={{ backgroundColor: state.palette.surface }}
                    >
                      <span className="text-xs" style={accentStyle}>
                        Industrial rotary instrument specimen
                      </span>
                    </div>
                  ) : (
                    <img
                      src={SPECIMEN_IMAGES.studioObject}
                      alt="Matte black anodized aluminum rotary studio controller beside an open linen sketchbook"
                      referrerPolicy="no-referrer"
                      onError={() => setObjectImageFailed(true)}
                      className="aspect-4/3 h-full w-full object-cover"
                    />
                  )}
                </div>
              </div>

              {/* Full-width 3-Column Feature Row below Hero */}
              <div
                className="mt-12 grid grid-cols-1 gap-8 border-t pt-10 sm:grid-cols-3"
                style={{ borderColor: state.palette.border }}
              >
                {[
                  {
                    index: '01',
                    title: 'Optical Hierarchy',
                    text: 'Verify how display weights hold authority over compact supporting descriptions.',
                  },
                  {
                    index: '02',
                    title: 'Balanced Measure',
                    text: 'Evaluate scannability across narrow multi-column cards and wide hero paragraphs.',
                  },
                  {
                    index: '03',
                    title: 'Action Contrast',
                    text: 'Check button legibility and metadata rhythm before exporting CSS tokens.',
                  },
                ].map((feature) => (
                  <div key={feature.index} className="space-y-2">
                    <div className="text-xs tabular-nums" style={accentStyle}>
                      {feature.index}
                    </div>
                    <h3
                      style={{
                        ...headingStyle,
                        fontSize: `${Math.max(18, Math.round(state.heading.size * 0.4))}px`,
                        lineHeight: 1.25,
                      }}
                    >
                      {feature.title}
                    </h3>
                    <p
                      style={{
                        ...bodyStyle,
                        fontSize: `${Math.max(13, state.body.size - 1)}px`,
                      }}
                    >
                      {feature.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TEMPLATE 3: FOUNDRY TYPE SPECIMEN SHEET */}
          {template === 'specimen' && (
            <div className="divide-y px-6 py-10 sm:px-12 sm:py-12" style={{ borderColor: state.palette.border }}>
              {/* Side-by-side Aa Comparison */}
              <div className="grid grid-cols-1 gap-8 pb-10 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="text-xs" style={accentStyle}>
                    Heading · {state.heading.family} · {headingEntry?.category ?? 'serif'}
                  </div>
                  <div
                    className="leading-none"
                    style={{
                      ...headingStyle,
                      fontSize: '88px',
                    }}
                  >
                    Aa Bb Gg
                  </div>
                  <p className="text-xs" style={accentStyle}>
                    {headingEntry?.designer} — {headingEntry?.character}
                  </p>
                </div>

                <div
                  className="space-y-3 border-t pt-8 md:border-t-0 md:border-l md:pl-8 md:pt-0"
                  style={{ borderColor: state.palette.border }}
                >
                  <div className="text-xs" style={accentStyle}>
                    Body · {state.body.family} · {bodyEntry?.category ?? 'sans'}
                  </div>
                  <div
                    className="leading-none"
                    style={{
                      ...bodyStyle,
                      fontSize: '88px',
                      lineHeight: 1,
                      color: state.palette.headingColor,
                    }}
                  >
                    Aa Bb Gg
                  </div>
                  <p className="text-xs" style={accentStyle}>
                    {bodyEntry?.designer} — {bodyEntry?.character}
                  </p>
                </div>
              </div>

              {/* Character Set Waterfall */}
              <div className="grid grid-cols-1 gap-8 py-10 md:grid-cols-2" style={{ borderColor: state.palette.border }}>
                <div className="space-y-3">
                  <div className="text-xs" style={accentStyle}>
                    Heading Character Set ({state.heading.weight})
                  </div>
                  <div
                    className="break-words text-2xl leading-relaxed"
                    style={{
                      ...headingStyle,
                      fontSize: '24px',
                      lineHeight: 1.45,
                    }}
                  >
                    ABCDEFGHIJKLMNOPQRSTUVWXYZ
                    <br />
                    abcdefghijklmnopqrstuvwxyz
                    <br />
                    0123456789 &amp; % $ € £ — “ ” ‘ ’ ! ?
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-xs" style={accentStyle}>
                    Body Character Set ({state.body.weight})
                  </div>
                  <div
                    className="break-words leading-relaxed"
                    style={{
                      ...bodyStyle,
                      fontSize: '20px',
                      lineHeight: 1.55,
                    }}
                  >
                    ABCDEFGHIJKLMNOPQRSTUVWXYZ
                    <br />
                    abcdefghijklmnopqrstuvwxyz
                    <br />
                    0123456789 &amp; % $ € £ — “ ” ‘ ’ ! ?
                  </div>
                </div>
              </div>

              {/* Weight & Size Ramp */}
              <div className="space-y-5 pt-10" style={{ borderColor: state.palette.border }}>
                <div className="text-xs" style={accentStyle}>
                  Size & Weight Proof Waterfall
                </div>
                {[
                  { label: 'Display 48px', size: 48, isHeading: true },
                  { label: 'Title 32px', size: 32, isHeading: true },
                  { label: 'Subhead 22px', size: 22, isHeading: true },
                  { label: `Body ${state.body.size}px`, size: state.body.size, isHeading: false },
                  { label: 'Small 13px', size: 13, isHeading: false },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="grid grid-cols-1 items-baseline gap-2 sm:grid-cols-12"
                  >
                    <div className="text-xs tabular-nums sm:col-span-3" style={accentStyle}>
                      {row.label}
                    </div>
                    <div
                      className="truncate sm:col-span-9"
                      style={{
                        ...(row.isHeading ? headingStyle : bodyStyle),
                        fontSize: `${row.size}px`,
                        lineHeight: row.isHeading ? 1.15 : 1.5,
                      }}
                    >
                      The quick brown fox jumps over 14 lazy dogs.
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TEMPLATE 4: INTERFACE & DATA CARDS */}
          {template === 'ui' && (
            <div className="space-y-8 px-6 py-10 sm:px-12 sm:py-12">
              <div className="flex flex-wrap items-end justify-between gap-4 border-b pb-6" style={{ borderColor: state.palette.border }}>
                <div>
                  <div className="text-xs" style={accentStyle}>
                    Interface Legibility Test · Q4 Studio Ledger
                  </div>
                  <h2
                    className="mt-1.5"
                    style={{
                      ...headingStyle,
                      fontSize: `${Math.max(26, Math.round(state.heading.size * 0.65))}px`,
                    }}
                  >
                    Typography in Product Components
                  </h2>
                </div>
                <span
                  className="rounded-md px-4 py-2 text-xs font-medium text-white"
                  style={{
                    backgroundColor: state.palette.accentColor,
                    fontFamily: getFontStack(state.body.family),
                  }}
                >
                  New Specification
                </span>
              </div>

              {/* 3 Metric Summary Cells */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[
                  { label: 'Annual Licensing', value: '$48,200', note: '+14.2% vs prior quarter' },
                  { label: 'Active Publications', value: '126', note: '18 print · 108 web editions' },
                  { label: 'Avg. Reading Time', value: '6m 42s', note: 'Across 64ch editorial layouts' },
                ].map((metric) => (
                  <div
                    key={metric.label}
                    className="rounded-lg border p-5"
                    style={{
                      backgroundColor: state.palette.surface,
                      borderColor: state.palette.border,
                    }}
                  >
                    <div className="text-xs" style={accentStyle}>
                      {metric.label}
                    </div>
                    <div
                      className="mt-2 tabular-nums"
                      style={{
                        ...headingStyle,
                        fontSize: '30px',
                        lineHeight: 1.1,
                      }}
                    >
                      {metric.value}
                    </div>
                    <div
                      className="mt-1.5 text-xs"
                      style={{
                        ...bodyStyle,
                        fontSize: '13px',
                        color: state.palette.mutedColor,
                      }}
                    >
                      {metric.note}
                    </div>
                  </div>
                ))}
              </div>

              {/* Two UI Panels: Pricing & Settings Form */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div
                  className="flex flex-col justify-between rounded-lg border p-6"
                  style={{
                    backgroundColor: state.palette.surface,
                    borderColor: state.palette.border,
                  }}
                >
                  <div>
                    <div className="text-xs" style={accentStyle}>
                      For Independent Studios
                    </div>
                    <h3
                      className="mt-2"
                      style={{
                        ...headingStyle,
                        fontSize: '26px',
                        lineHeight: 1.2,
                      }}
                    >
                      Foundry All-Access
                    </h3>
                    <p
                      className="mt-2"
                      style={{
                        ...bodyStyle,
                        fontSize: `${Math.max(13, state.body.size - 1)}px`,
                      }}
                    >
                      Complete desktop, webfont, and variable axis licensing for teams publishing across print and digital surfaces.
                    </p>
                    <div className="mt-5 flex items-baseline gap-1.5">
                      <span
                        className="tabular-nums"
                        style={{ ...headingStyle, fontSize: '36px' }}
                      >
                        $240
                      </span>
                      <span className="text-xs" style={accentStyle}>
                        / year · up to 10 seats
                      </span>
                    </div>
                  </div>
                  <div className="mt-6">
                    <span
                      className="inline-block w-full rounded-md py-2.5 text-center text-sm font-medium text-white"
                      style={{
                        backgroundColor: state.palette.accentColor,
                        fontFamily: getFontStack(state.body.family),
                      }}
                    >
                      Select Foundry License
                    </span>
                  </div>
                </div>

                <div
                  className="rounded-lg border p-6"
                  style={{
                    backgroundColor: state.palette.surface,
                    borderColor: state.palette.border,
                  }}
                >
                  <div className="text-xs" style={accentStyle}>
                    Form & Input Hierarchy
                  </div>
                  <h3
                    className="mt-2"
                    style={{
                      ...headingStyle,
                      fontSize: '24px',
                      lineHeight: 1.2,
                    }}
                  >
                    Project Type Brief
                  </h3>
                  <div className="mt-4 space-y-3.5">
                    <div>
                      <div className="mb-1 text-xs" style={accentStyle}>
                        Publication Title
                      </div>
                      <div
                        className="rounded-md border px-3 py-2"
                        style={{
                          backgroundColor: state.palette.background,
                          borderColor: state.palette.border,
                          ...bodyStyle,
                          fontSize: '14px',
                        }}
                      >
                        Nordic Architecture Quarterly — Autumn Issue
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 text-xs" style={accentStyle}>
                        Primary Audience Notes
                      </div>
                      <div
                        className="rounded-md border px-3 py-2"
                        style={{
                          backgroundColor: state.palette.background,
                          borderColor: state.palette.border,
                          ...bodyStyle,
                          fontSize: '14px',
                        }}
                      >
                        Long-form essays paired with crisp architectural floorplans and metric dimensions.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </article>
      </div>
    </div>
  );
}
