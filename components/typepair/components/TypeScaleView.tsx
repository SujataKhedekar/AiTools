import { useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { PairingState } from '../types/typography';
import { getFontStack } from '../utils/fontLoader';

interface TypeScaleViewProps {
  state: PairingState;
}

const SCALE_RATIOS = [
  { value: 1.125, label: '1.125 · Major Second' },
  { value: 1.2, label: '1.200 · Minor Third' },
  { value: 1.25, label: '1.250 · Major Third' },
  { value: 1.333, label: '1.333 · Perfect Fourth' },
  { value: 1.414, label: '1.414 · Augmented Fourth' },
  { value: 1.5, label: '1.500 · Perfect Fifth' },
  { value: 1.618, label: '1.618 · Golden Ratio' },
];

interface ScaleRow {
  token: string;
  label: string;
  step: number;
  role: 'heading' | 'body' | 'accent';
  lineHeight: number;
  letterSpacing: number;
}

const SCALE_ROWS: ScaleRow[] = [
  { token: '--text-display', label: 'Display', step: 5, role: 'heading', lineHeight: 1.05, letterSpacing: -0.03 },
  { token: '--text-h1', label: 'Heading 1', step: 4, role: 'heading', lineHeight: 1.1, letterSpacing: -0.025 },
  { token: '--text-h2', label: 'Heading 2', step: 3, role: 'heading', lineHeight: 1.16, letterSpacing: -0.02 },
  { token: '--text-h3', label: 'Heading 3', step: 2, role: 'heading', lineHeight: 1.24, letterSpacing: -0.015 },
  { token: '--text-h4', label: 'Heading 4', step: 1, role: 'heading', lineHeight: 1.32, letterSpacing: -0.01 },
  { token: '--text-body', label: 'Body Base', step: 0, role: 'body', lineHeight: 1.6, letterSpacing: 0 },
  { token: '--text-sm', label: 'Small UI', step: -1, role: 'body', lineHeight: 1.5, letterSpacing: 0.005 },
  { token: '--text-caption', label: 'Caption / Meta', step: -2, role: 'accent', lineHeight: 1.4, letterSpacing: 0.02 },
];

export function TypeScaleView({ state }: TypeScaleViewProps) {
  const [baseSize, setBaseSize] = useState<number>(state.body.size);
  const [ratio, setRatio] = useState<number>(1.25);
  const [sampleText, setSampleText] = useState<string>(
    'Harmonious proportions establish effortless visual rhythm.'
  );
  const [copied, setCopied] = useState(false);

  const computedSteps = useMemo(() => {
    return SCALE_ROWS.map((row) => {
      const px = Math.max(11, Math.round(baseSize * Math.pow(ratio, row.step) * 10) / 10);
      const rem = (px / 16).toFixed(3);
      return {
        ...row,
        px,
        rem,
      };
    });
  }, [baseSize, ratio]);

  async function handleCopyScaleCss() {
    const lines = [
      ':root {',
      `  --font-heading: ${getFontStack(state.heading.family)};`,
      `  --font-body: ${getFontStack(state.body.family)};`,
      `  --font-accent: ${getFontStack(state.accent.family)};`,
      '',
      ...computedSteps.map(
        (s) => `  ${s.token}: ${s.rem}rem; /* ${s.px}px */`
      ),
      '}',
    ].join('\n');

    try {
      await navigator.clipboard.writeText(lines);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = lines;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <main className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:py-10">
      <div className="flex flex-col justify-between gap-6 border-b border-zinc-200 pb-6 lg:flex-row lg:items-end dark:border-zinc-800">
        <div>
          <h1 className="font-[var(--font-ui-display)] text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl dark:text-zinc-50">
            Modular Type Scale
          </h1>
          <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400">
            Evaluating <span className="font-medium text-zinc-900 dark:text-zinc-100">{state.heading.family}</span> paired with{' '}
            <span className="font-medium text-zinc-900 dark:text-zinc-100">{state.body.family}</span> across a musical scale ramp.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCopyScaleCss}
          className="inline-flex cursor-pointer items-center gap-1.5 self-start rounded-md bg-zinc-950 px-4 py-2 text-xs font-semibold text-white whitespace-nowrap transition-colors hover:bg-zinc-800 lg:self-auto dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copied CSS Variables' : 'Copy Scale CSS'}
        </button>
      </div>

      {/* Controls Strip */}
      <div className="mt-6 grid grid-cols-1 gap-4 rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 md:grid-cols-12 dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="md:col-span-3">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <label htmlFor="scale-base-size" className="font-medium text-zinc-700 dark:text-zinc-300">
              Base Body Size
            </label>
            <span className="font-[var(--font-ui-mono)] text-zinc-900 tabular-nums dark:text-zinc-100">
              {baseSize}px
            </span>
          </div>
          <input
            id="scale-base-size"
            type="range"
            min={14}
            max={20}
            step={1}
            value={baseSize}
            onChange={(e) => setBaseSize(Number(e.target.value))}
            className="studio-slider"
          />
        </div>

        <div className="md:col-span-4">
          <label
            htmlFor="scale-ratio-select"
            className="mb-1.5 block text-xs font-medium text-zinc-700 dark:text-zinc-300"
          >
            Scale Ratio
          </label>
          <select
            id="scale-ratio-select"
            value={ratio}
            onChange={(e) => setRatio(Number(e.target.value))}
            className="w-full cursor-pointer rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-900 focus:border-blue-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          >
            {SCALE_RATIOS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-5">
          <label
            htmlFor="scale-preview-text"
            className="mb-1.5 block text-xs font-medium text-zinc-700 dark:text-zinc-300"
          >
            Preview Sentence
          </label>
          <input
            id="scale-preview-text"
            type="text"
            value={sampleText}
            onChange={(e) => setSampleText(e.target.value)}
            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:border-blue-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>
      </div>

      {/* Live Specimen Scale Waterfall */}
      <div
        className="mt-6 divide-y overflow-hidden rounded-xl border"
        style={{
          backgroundColor: state.palette.background,
          borderColor: state.palette.border,
        }}
      >
        {computedSteps.map((step) => {
          const family =
            step.role === 'heading'
              ? state.heading.family
              : step.role === 'body'
                ? state.body.family
                : state.accent.family;
          const weight =
            step.role === 'heading'
              ? state.heading.weight
              : step.role === 'body'
                ? state.body.weight
                : state.accent.weight;
          const color =
            step.role === 'heading'
              ? state.palette.headingColor
              : step.role === 'body'
                ? state.palette.bodyColor
                : state.palette.mutedColor;

          return (
            <div
              key={step.token}
              className="grid grid-cols-1 items-baseline gap-4 px-6 py-6 lg:grid-cols-12"
              style={{ borderColor: state.palette.border }}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 lg:col-span-3 lg:flex-col lg:items-start">
                <div
                  className="text-xs font-medium"
                  style={{ color: state.palette.headingColor }}
                >
                  {step.label}
                </div>
                <div
                  className="font-[var(--font-ui-mono)] text-[11px] tabular-nums"
                  style={{ color: state.palette.mutedColor }}
                >
                  {step.px}px · {step.rem}rem · lh {step.lineHeight}
                </div>
                <div
                  className="text-[11px]"
                  style={{ color: state.palette.mutedColor }}
                >
                  {family} ({weight})
                </div>
              </div>

              <div className="min-w-0 lg:col-span-9">
                <div
                  className="truncate"
                  style={{
                    fontFamily: getFontStack(family),
                    fontWeight: weight,
                    fontSize: `${step.px}px`,
                    lineHeight: step.lineHeight,
                    letterSpacing: `${step.letterSpacing}em`,
                    color,
                  }}
                >
                  {sampleText || 'Type a custom preview phrase above'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
