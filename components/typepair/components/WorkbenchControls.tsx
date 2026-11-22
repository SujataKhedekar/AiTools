import { ArrowUpDown, Bookmark, Check, Lock, Shuffle, Unlock } from 'lucide-react';
import { FONT_CATALOG, SPECIMEN_PALETTES } from '../data/fonts';
import { FontEntry, PairingState, SpecimenPalette } from '../types/typography';
import { getWcagAssessment } from '../utils/colorContrast';
import { FontSelectDropdown } from './FontSelectDropdown';

interface WorkbenchControlsProps {
  state: PairingState;
  onChangeState: (updater: (prev: PairingState) => PairingState) => void;
  onShuffle: () => void;
  onSwap: () => void;
  onSave: () => void;
  justSaved: boolean;
}

function closestWeight(available: number[], target: number): number {
  return available.reduce((best, curr) =>
    Math.abs(curr - target) < Math.abs(best - target) ? curr : best
  );
}

export function WorkbenchControls({
  state,
  onChangeState,
  onShuffle,
  onSwap,
  onSave,
  justSaved,
}: WorkbenchControlsProps) {
  const headingFont =
    FONT_CATALOG.find((f) => f.family === state.heading.family) ?? FONT_CATALOG[0];
  const bodyFont =
    FONT_CATALOG.find((f) => f.family === state.body.family) ?? FONT_CATALOG[12];
  const accentFont =
    FONT_CATALOG.find((f) => f.family === state.accent.family) ?? FONT_CATALOG[32];

  const headingContrast = getWcagAssessment(
    state.palette.headingColor,
    state.palette.background
  );
  const bodyContrast = getWcagAssessment(
    state.palette.bodyColor,
    state.palette.background
  );

  function handleSelectHeadingFont(font: FontEntry) {
    onChangeState((prev) => ({
      ...prev,
      heading: {
        ...prev.heading,
        family: font.family,
        weight: closestWeight(font.weights, prev.heading.weight),
        italic: font.hasItalic ? prev.heading.italic : false,
      },
    }));
  }

  function handleSelectBodyFont(font: FontEntry) {
    onChangeState((prev) => ({
      ...prev,
      body: {
        ...prev.body,
        family: font.family,
        weight: closestWeight(font.weights, prev.body.weight),
        italic: font.hasItalic ? prev.body.italic : false,
      },
    }));
  }

  function handleSelectAccentFont(font: FontEntry) {
    onChangeState((prev) => ({
      ...prev,
      accent: {
        ...prev.accent,
        family: font.family,
        weight: closestWeight(font.weights, prev.accent.weight),
      },
    }));
  }

  function handleSelectPalette(palette: SpecimenPalette) {
    onChangeState((prev) => ({
      ...prev,
      palette: { ...palette },
    }));
  }

  return (
    <aside
      aria-label="Typography controls"
      className="flex flex-col border-b border-zinc-200 bg-zinc-50/70 lg:h-[calc(100vh-3.5rem)] lg:w-[340px] lg:shrink-0 lg:overflow-y-auto lg:border-b-0 lg:border-r dark:border-zinc-800 dark:bg-zinc-900/40"
    >
      {/* Quick Action Bar */}
      <div className="grid grid-cols-3 gap-2 border-b border-zinc-200 p-4 dark:border-zinc-800">
        <button
          type="button"
          onClick={onShuffle}
          title="Shuffle unlocked fonts (Spacebar)"
          className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-900 whitespace-nowrap transition-colors duration-150 hover:border-zinc-300 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          <Shuffle className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
          Shuffle
        </button>
        <button
          type="button"
          onClick={onSwap}
          title="Swap heading and body fonts"
          className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-900 whitespace-nowrap transition-colors duration-150 hover:border-zinc-300 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          <ArrowUpDown className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
          Swap
        </button>
        <button
          type="button"
          onClick={onSave}
          className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-900 whitespace-nowrap transition-colors duration-150 hover:border-zinc-300 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          {justSaved ? (
            <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <Bookmark className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
          )}
          {justSaved ? 'Saved' : 'Save'}
        </button>
      </div>

      {/* Heading Font Section */}
      <section className="space-y-4 border-b border-zinc-200 p-4 dark:border-zinc-800">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="font-[var(--font-ui-display)] text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              Heading Typeface
            </h2>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Display titles & section headings
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              onChangeState((prev) => ({
                ...prev,
                locked: { ...prev.locked, heading: !prev.locked.heading },
              }))
            }
            aria-pressed={state.locked.heading}
            title={state.locked.heading ? 'Unlock heading font' : 'Lock heading font during shuffle'}
            className={`inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
              state.locked.heading
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950'
                : 'text-zinc-500 hover:bg-zinc-200/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
            }`}
          >
            {state.locked.heading ? (
              <Lock className="h-3 w-3" />
            ) : (
              <Unlock className="h-3 w-3" />
            )}
            {state.locked.heading ? 'Locked' : 'Lock'}
          </button>
        </div>

        <FontSelectDropdown
          id="heading-font-select"
          label="Heading font"
          value={state.heading.family}
          onChange={handleSelectHeadingFont}
          preferredCategories={['serif', 'display', 'sans']}
        />

        {/* Weight & Italic */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-600 dark:text-zinc-400">Weight</span>
            {headingFont.hasItalic && (
              <button
                type="button"
                onClick={() =>
                  onChangeState((prev) => ({
                    ...prev,
                    heading: { ...prev.heading, italic: !prev.heading.italic },
                  }))
                }
                aria-pressed={!!state.heading.italic}
                className={`cursor-pointer rounded px-2 py-0.5 text-[11px] font-medium italic transition-colors ${
                  state.heading.italic
                    ? 'bg-blue-600 text-white dark:bg-blue-500 dark:text-zinc-950'
                    : 'text-zinc-500 hover:bg-zinc-200/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800'
                }`}
              >
                Italic
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1">
            {headingFont.weights.map((w) => {
              const active = state.heading.weight === w;
              return (
                <button
                  key={w}
                  type="button"
                  onClick={() =>
                    onChangeState((prev) => ({
                      ...prev,
                      heading: { ...prev.heading, weight: w },
                    }))
                  }
                  className={`cursor-pointer rounded px-2.5 py-1 font-[var(--font-ui-mono)] text-xs tabular-nums transition-colors ${
                    active
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950'
                      : 'border border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300'
                  }`}
                >
                  {w}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sliders */}
        <div className="space-y-3 pt-1">
          <div>
            <div className="mb-1 flex items-center justify-between text-xs">
              <label htmlFor="heading-size" className="text-zinc-600 dark:text-zinc-400">
                Size
              </label>
              <span className="font-[var(--font-ui-mono)] text-[11px] text-zinc-900 tabular-nums dark:text-zinc-100">
                {state.heading.size}px
              </span>
            </div>
            <input
              id="heading-size"
              type="range"
              min={28}
              max={92}
              step={1}
              value={state.heading.size}
              onChange={(e) =>
                onChangeState((prev) => ({
                  ...prev,
                  heading: { ...prev.heading, size: Number(e.target.value) },
                }))
              }
              className="studio-slider"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="mb-1 flex items-center justify-between text-xs">
                <label htmlFor="heading-lh" className="text-zinc-600 dark:text-zinc-400">
                  Leading
                </label>
                <span className="font-[var(--font-ui-mono)] text-[11px] text-zinc-900 tabular-nums dark:text-zinc-100">
                  {state.heading.lineHeight.toFixed(2)}
                </span>
              </div>
              <input
                id="heading-lh"
                type="range"
                min={0.92}
                max={1.45}
                step={0.02}
                value={state.heading.lineHeight}
                onChange={(e) =>
                  onChangeState((prev) => ({
                    ...prev,
                    heading: { ...prev.heading, lineHeight: Number(e.target.value) },
                  }))
                }
                className="studio-slider"
              />
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between text-xs">
                <label htmlFor="heading-ls" className="text-zinc-600 dark:text-zinc-400">
                  Tracking
                </label>
                <span className="font-[var(--font-ui-mono)] text-[11px] text-zinc-900 tabular-nums dark:text-zinc-100">
                  {state.heading.letterSpacing >= 0 ? '+' : ''}
                  {state.heading.letterSpacing.toFixed(3)}em
                </span>
              </div>
              <input
                id="heading-ls"
                type="range"
                min={-0.06}
                max={0.12}
                step={0.005}
                value={state.heading.letterSpacing}
                onChange={(e) =>
                  onChangeState((prev) => ({
                    ...prev,
                    heading: { ...prev.heading, letterSpacing: Number(e.target.value) },
                  }))
                }
                className="studio-slider"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Body Font Section */}
      <section className="space-y-4 border-b border-zinc-200 p-4 dark:border-zinc-800">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="font-[var(--font-ui-display)] text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              Body Typeface
            </h2>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Paragraph prose & UI copy
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              onChangeState((prev) => ({
                ...prev,
                locked: { ...prev.locked, body: !prev.locked.body },
              }))
            }
            aria-pressed={state.locked.body}
            title={state.locked.body ? 'Unlock body font' : 'Lock body font during shuffle'}
            className={`inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
              state.locked.body
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950'
                : 'text-zinc-500 hover:bg-zinc-200/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
            }`}
          >
            {state.locked.body ? (
              <Lock className="h-3 w-3" />
            ) : (
              <Unlock className="h-3 w-3" />
            )}
            {state.locked.body ? 'Locked' : 'Lock'}
          </button>
        </div>

        <FontSelectDropdown
          id="body-font-select"
          label="Body font"
          value={state.body.family}
          onChange={handleSelectBodyFont}
          preferredCategories={['sans', 'serif']}
        />

        {/* Weight */}
        <div className="space-y-1.5">
          <span className="text-xs text-zinc-600 dark:text-zinc-400">Weight</span>
          <div className="flex flex-wrap gap-1">
            {bodyFont.weights.map((w) => {
              const active = state.body.weight === w;
              return (
                <button
                  key={w}
                  type="button"
                  onClick={() =>
                    onChangeState((prev) => ({
                      ...prev,
                      body: { ...prev.body, weight: w },
                    }))
                  }
                  className={`cursor-pointer rounded px-2.5 py-1 font-[var(--font-ui-mono)] text-xs tabular-nums transition-colors ${
                    active
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950'
                      : 'border border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300'
                  }`}
                >
                  {w}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sliders */}
        <div className="space-y-3 pt-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="mb-1 flex items-center justify-between text-xs">
                <label htmlFor="body-size" className="text-zinc-600 dark:text-zinc-400">
                  Size
                </label>
                <span className="font-[var(--font-ui-mono)] text-[11px] text-zinc-900 tabular-nums dark:text-zinc-100">
                  {state.body.size}px
                </span>
              </div>
              <input
                id="body-size"
                type="range"
                min={13}
                max={22}
                step={1}
                value={state.body.size}
                onChange={(e) =>
                  onChangeState((prev) => ({
                    ...prev,
                    body: { ...prev.body, size: Number(e.target.value) },
                  }))
                }
                className="studio-slider"
              />
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between text-xs">
                <label htmlFor="body-lh" className="text-zinc-600 dark:text-zinc-400">
                  Leading
                </label>
                <span className="font-[var(--font-ui-mono)] text-[11px] text-zinc-900 tabular-nums dark:text-zinc-100">
                  {state.body.lineHeight.toFixed(2)}
                </span>
              </div>
              <input
                id="body-lh"
                type="range"
                min={1.25}
                max={2.0}
                step={0.05}
                value={state.body.lineHeight}
                onChange={(e) =>
                  onChangeState((prev) => ({
                    ...prev,
                    body: { ...prev.body, lineHeight: Number(e.target.value) },
                  }))
                }
                className="studio-slider"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="mb-1 flex items-center justify-between text-xs">
                <label htmlFor="body-ls" className="text-zinc-600 dark:text-zinc-400">
                  Tracking
                </label>
                <span className="font-[var(--font-ui-mono)] text-[11px] text-zinc-900 tabular-nums dark:text-zinc-100">
                  {state.body.letterSpacing >= 0 ? '+' : ''}
                  {state.body.letterSpacing.toFixed(3)}em
                </span>
              </div>
              <input
                id="body-ls"
                type="range"
                min={-0.03}
                max={0.06}
                step={0.005}
                value={state.body.letterSpacing}
                onChange={(e) =>
                  onChangeState((prev) => ({
                    ...prev,
                    body: { ...prev.body, letterSpacing: Number(e.target.value) },
                  }))
                }
                className="studio-slider"
              />
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between text-xs">
                <label htmlFor="body-measure" className="text-zinc-600 dark:text-zinc-400">
                  Measure
                </label>
                <span className="font-[var(--font-ui-mono)] text-[11px] text-zinc-900 tabular-nums dark:text-zinc-100">
                  {state.body.measure}ch
                </span>
              </div>
              <input
                id="body-measure"
                type="range"
                min={45}
                max={80}
                step={1}
                value={state.body.measure}
                onChange={(e) =>
                  onChangeState((prev) => ({
                    ...prev,
                    body: { ...prev.body, measure: Number(e.target.value) },
                  }))
                }
                className="studio-slider"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Accent / Metadata Font Section */}
      <section className="space-y-3 border-b border-zinc-200 p-4 dark:border-zinc-800">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="font-[var(--font-ui-display)] text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              Accent & Metadata
            </h2>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Kickers, figures & captions
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              onChangeState((prev) => ({
                ...prev,
                locked: { ...prev.locked, accent: !prev.locked.accent },
              }))
            }
            aria-pressed={state.locked.accent}
            className={`inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
              state.locked.accent
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950'
                : 'text-zinc-500 hover:bg-zinc-200/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
            }`}
          >
            {state.locked.accent ? (
              <Lock className="h-3 w-3" />
            ) : (
              <Unlock className="h-3 w-3" />
            )}
            {state.locked.accent ? 'Locked' : 'Lock'}
          </button>
        </div>

        <FontSelectDropdown
          id="accent-font-select"
          label="Accent font"
          value={state.accent.family}
          onChange={handleSelectAccentFont}
          preferredCategories={['mono', 'sans']}
        />

        <div className="flex flex-wrap gap-1">
          {accentFont.weights.map((w) => {
            const active = state.accent.weight === w;
            return (
              <button
                key={w}
                type="button"
                onClick={() =>
                  onChangeState((prev) => ({
                    ...prev,
                    accent: { ...prev.accent, weight: w },
                  }))
                }
                className={`cursor-pointer rounded px-2.5 py-1 font-[var(--font-ui-mono)] text-xs tabular-nums transition-colors ${
                  active
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950'
                    : 'border border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300'
                }`}
              >
                {w}
              </button>
            );
          })}
        </div>
      </section>

      {/* Specimen Colors & Real WCAG Contrast Audit */}
      <section className="space-y-4 p-4">
        <div>
          <h2 className="font-[var(--font-ui-display)] text-xs font-semibold text-zinc-900 dark:text-zinc-100">
            Surface & Ink Palette
          </h2>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Test legibility under light or dark press conditions
          </p>
        </div>

        {/* Preset Swatches */}
        <div className="grid grid-cols-3 gap-1.5">
          {SPECIMEN_PALETTES.map((pal) => {
            const active = state.palette.id === pal.id;
            return (
              <button
                key={pal.id}
                type="button"
                onClick={() => handleSelectPalette(pal)}
                className={`flex cursor-pointer items-center gap-2 rounded-md border px-2 py-1.5 text-left transition-colors ${
                  active
                    ? 'border-blue-600 bg-white dark:border-blue-500 dark:bg-zinc-900'
                    : 'border-zinc-200 bg-white/60 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-zinc-700'
                }`}
              >
                <span
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 rounded-sm border border-black/15"
                  style={{
                    background: `linear-gradient(135deg, ${pal.background} 55%, ${pal.headingColor} 55%)`,
                  }}
                />
                <span className="truncate text-[11px] font-medium text-zinc-800 dark:text-zinc-200">
                  {pal.name.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Custom Color Pickers */}
        <div className="grid grid-cols-2 gap-2.5">
          {(
            [
              { key: 'background', label: 'Canvas' },
              { key: 'headingColor', label: 'Heading' },
              { key: 'bodyColor', label: 'Body' },
              { key: 'accentColor', label: 'Accent' },
            ] as const
          ).map(({ key, label }) => (
            <label
              key={key}
              className="flex cursor-pointer items-center justify-between gap-2 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs dark:border-zinc-800 dark:bg-zinc-900"
            >
              <span className="text-zinc-600 dark:text-zinc-400">{label}</span>
              <span className="flex items-center gap-1.5">
                <span className="font-[var(--font-ui-mono)] text-[11px] text-zinc-700 uppercase tabular-nums dark:text-zinc-300">
                  {state.palette[key]}
                </span>
                <input
                  type="color"
                  value={state.palette[key]}
                  onChange={(e) =>
                    onChangeState((prev) => ({
                      ...prev,
                      palette: {
                        ...prev.palette,
                        id: 'custom',
                        name: 'Custom',
                        [key]: e.target.value,
                      },
                    }))
                  }
                  className="h-4 w-4 cursor-pointer rounded border-0 bg-transparent p-0"
                />
              </span>
            </label>
          ))}
        </div>

        {/* Live Mathematical WCAG 2.1 Contrast Readout */}
        <div className="space-y-1.5 border-t border-zinc-200 pt-3 dark:border-zinc-800">
          <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
            WCAG 2.1 Contrast Check
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-600 dark:text-zinc-400">Heading on Canvas</span>
            <span className="font-[var(--font-ui-mono)] text-xs tabular-nums text-zinc-900 dark:text-zinc-100">
              {headingContrast.ratio.toFixed(2)}:1
              <span className="mx-1.5 text-zinc-400">·</span>
              <span
                className={
                  headingContrast.passesLarge
                    ? 'font-semibold text-emerald-700 dark:text-emerald-400'
                    : 'font-semibold text-red-700 dark:text-red-400'
                }
              >
                {headingContrast.label}
              </span>
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-600 dark:text-zinc-400">Body on Canvas</span>
            <span className="font-[var(--font-ui-mono)] text-xs tabular-nums text-zinc-900 dark:text-zinc-100">
              {bodyContrast.ratio.toFixed(2)}:1
              <span className="mx-1.5 text-zinc-400">·</span>
              <span
                className={
                  bodyContrast.passesNormal
                    ? 'font-semibold text-emerald-700 dark:text-emerald-400'
                    : 'font-semibold text-red-700 dark:text-red-400'
                }
              >
                {bodyContrast.label}
              </span>
            </span>
          </div>
        </div>
      </section>
    </aside>
  );
}
