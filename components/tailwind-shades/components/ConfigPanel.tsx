import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Check,
  ChevronDown,
  Copy,
  Pipette,
  RotateCcw,
  Sliders,
} from 'lucide-react';
import {
  ColourAdjustments,
  GenerationMode,
  PresetColour,
} from '../types/palette';
import {
  GENERATION_MODES,
  PRESET_COLOURS,
  sanitizeSlug,
  validateHexInput,
} from '../utils/colorScience';

interface ConfigPanelProps {
  baseHex: string;
  onChangeBaseHex: (hex: string) => void;
  colourName: string;
  onChangeColourName: (name: string) => void;
  paletteName: string;
  onChangePaletteName: (name: string) => void;
  mode: GenerationMode;
  onChangeMode: (mode: GenerationMode) => void;
  adjustments: ColourAdjustments;
  onChangeAdjustments: (adj: ColourAdjustments) => void;
  onSelectPreset: (preset: PresetColour) => void;
  onCopyText: (text: string, label: string) => void;
  uppercaseHex: boolean;
}

interface EyeDropperResult {
  sRGBHex: string;
}

interface EyeDropperConstructor {
  new (): { open: () => Promise<EyeDropperResult> };
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({
  baseHex,
  onChangeBaseHex,
  colourName,
  onChangeColourName,
  paletteName,
  onChangePaletteName,
  mode,
  onChangeMode,
  adjustments,
  onChangeAdjustments,
  onSelectPreset,
  onCopyText,
  uppercaseHex,
}) => {
  const [hexDraft, setHexDraft] = useState(baseHex);
  const [hexError, setHexError] = useState<string | null>(null);
  const [copiedBase, setCopiedBase] = useState(false);
  const [eyedropperBusy, setEyedropperBusy] = useState(false);

  const [openSections, setOpenSections] = useState({
    base: true,
    modes: true,
    adjust: true,
    presets: true,
  });

  const supportsEyeDropper =
    typeof window !== 'undefined' && 'EyeDropper' in window;

  useEffect(() => {
    setHexDraft(uppercaseHex ? baseHex.toUpperCase() : baseHex.toLowerCase());
    setHexError(null);
  }, [baseHex, uppercaseHex]);

  const handleHexInputChange = (value: string) => {
    setHexDraft(value);
    const check = validateHexInput(value);
    if (check.valid && check.normalized) {
      setHexError(null);
      onChangeBaseHex(check.normalized);
    } else {
      setHexError(check.error);
    }
  };

  const handleHexBlur = () => {
    const check = validateHexInput(hexDraft);
    if (check.valid && check.normalized) {
      setHexDraft(
        uppercaseHex ? check.normalized.toUpperCase() : check.normalized.toLowerCase()
      );
      setHexError(null);
    } else {
      setHexDraft(uppercaseHex ? baseHex.toUpperCase() : baseHex.toLowerCase());
      setHexError(null);
    }
  };

  const handleEyeDropper = async () => {
    if (!supportsEyeDropper || eyedropperBusy) return;
    try {
      setEyedropperBusy(true);
      const EyeDropperCtor = (
        window as unknown as { EyeDropper: EyeDropperConstructor }
      ).EyeDropper;
      const dropper = new EyeDropperCtor();
      const result = await dropper.open();
      if (result?.sRGBHex) {
        onChangeBaseHex(result.sRGBHex.toUpperCase());
      }
    } catch {
      // User cancelled eyedropper
    } finally {
      setEyedropperBusy(false);
    }
  };

  const handleCopyBase = () => {
    const formatted = uppercaseHex
      ? baseHex.toUpperCase()
      : baseHex.toLowerCase();
    onCopyText(formatted, 'Base HEX');
    setCopiedBase(true);
    setTimeout(() => setCopiedBase(false), 1200);
  };

  const hasAdjustments =
    adjustments.temperature !== 0 ||
    adjustments.saturation !== 0 ||
    adjustments.brightness !== 0;

  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const tokenPreview = sanitizeSlug(colourName);

  return (
    <div className="space-y-4">
      {/* 1. Base Colour Configuration */}
      <section className="rounded-xl bg-[#FFFFFF] border border-[#E8E6DF] shadow-2xs">
        <button
          type="button"
          onClick={() => toggleSection('base')}
          className="w-full flex items-center justify-between px-4 py-3.5 text-left"
          aria-expanded={openSections.base}
        >
          <span className="text-[13px] font-semibold text-[#171614]">
            Base Colour Settings
          </span>
          <ChevronDown
            className={`h-4 w-4 text-[#8C8980] transition-transform duration-150 ${
              openSections.base ? 'rotate-180' : ''
            }`}
          />
        </button>

        {openSections.base && (
          <div className="px-4 pb-4 pt-1 space-y-4 border-t border-[#EFECE5]">
            {/* Large HEX Input + Native Picker + Eyedropper + Copy */}
            <div className="pt-3">
              <label
                htmlFor="base-hex-input"
                className="block text-[11px] font-medium text-[#62605A] mb-1.5"
              >
                Base HEX Colour
              </label>

              <div className="flex items-center gap-2">
                {/* Tactile Native Colour Picker Swatch */}
                <label
                  title="Pick colour visually"
                  className="relative h-11 w-12 rounded-lg border border-black/15 overflow-hidden cursor-pointer shrink-0 hover:ring-2 hover:ring-[#181816]/25 transition-all"
                  style={{ backgroundColor: baseHex }}
                >
                  <input
                    type="color"
                    value={baseHex}
                    onChange={(e) => onChangeBaseHex(e.target.value.toUpperCase())}
                    aria-label="Choose base colour with native picker"
                    className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
                  />
                </label>

                {/* Large HEX Text Input */}
                <div className="relative flex-1 min-w-0">
                  <input
                    id="base-hex-input"
                    type="text"
                    value={hexDraft}
                    onChange={(e) => handleHexInputChange(e.target.value)}
                    onBlur={handleHexBlur}
                    spellCheck={false}
                    maxLength={7}
                    placeholder="#3B82F6"
                    aria-invalid={Boolean(hexError)}
                    className={`w-full h-11 px-3 rounded-lg bg-[#FAF9F6] border font-mono text-base font-semibold tracking-wide tabular-nums text-[#171614] placeholder:text-[#A8A59C] focus:bg-white focus:outline-none transition-colors ${
                      hexError
                        ? 'border-red-500 focus:border-red-600'
                        : 'border-[#E2E0D8] focus:border-[#181816]'
                    }`}
                  />
                </div>

                {/* Eyedropper Button */}
                <button
                  type="button"
                  onClick={handleEyeDropper}
                  disabled={!supportsEyeDropper || eyedropperBusy}
                  title={
                    supportsEyeDropper
                      ? 'Sample colour from screen'
                      : 'Eyedropper API is supported in Chrome & Edge'
                  }
                  aria-label="Sample colour with eyedropper"
                  className={`flex h-11 w-10 items-center justify-center rounded-lg border transition-colors shrink-0 ${
                    supportsEyeDropper
                      ? 'bg-[#FFFFFF] border-[#E2E0D8] text-[#52504B] hover:border-[#181816] hover:text-[#171614] hover:bg-[#F7F6F2]'
                      : 'bg-[#F7F6F2] border-[#ECEAE2] text-[#B8B5AC] cursor-not-allowed'
                  }`}
                >
                  <Pipette className="h-4 w-4" />
                </button>

                {/* Copy HEX Button */}
                <button
                  type="button"
                  onClick={handleCopyBase}
                  title="Copy base HEX colour"
                  aria-label="Copy base HEX colour"
                  className="flex h-11 w-10 items-center justify-center rounded-lg bg-[#FFFFFF] border border-[#E2E0D8] text-[#52504B] hover:border-[#181816] hover:text-[#171614] hover:bg-[#F7F6F2] transition-colors shrink-0"
                >
                  {copiedBase ? (
                    <Check className="h-4 w-4 text-[#0F766E]" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>

              {hexError && (
                <p
                  role="alert"
                  className="mt-1.5 flex items-center gap-1.5 text-[11px] text-red-600"
                >
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{hexError}</span>
                </p>
              )}
            </div>

            {/* Colour Name & Palette Name Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="colour-name-input"
                  className="block text-[11px] font-medium text-[#62605A] mb-1.5"
                >
                  Colour Token Name
                </label>
                <input
                  id="colour-name-input"
                  type="text"
                  value={colourName}
                  onChange={(e) => onChangeColourName(e.target.value)}
                  placeholder="primary"
                  className="w-full h-9 px-3 rounded-lg bg-[#FAF9F6] border border-[#E2E0D8] text-xs font-mono text-[#171614] placeholder:text-[#A8A59C] focus:bg-white focus:border-[#181816] focus:outline-none transition-colors"
                />
                <span className="mt-1 block font-mono text-[10px] text-[#8C8980] truncate">
                  --{tokenPreview}-500
                </span>
              </div>

              <div>
                <label
                  htmlFor="palette-name-input"
                  className="block text-[11px] font-medium text-[#62605A] mb-1.5"
                >
                  Palette Name
                </label>
                <input
                  id="palette-name-input"
                  type="text"
                  value={paletteName}
                  onChange={(e) => onChangePaletteName(e.target.value)}
                  placeholder="Aivora Blue"
                  className="w-full h-9 px-3 rounded-lg bg-[#FAF9F6] border border-[#E2E0D8] text-xs text-[#171614] placeholder:text-[#A8A59C] focus:bg-white focus:border-[#181816] focus:outline-none transition-colors"
                />
                <span className="mt-1 block text-[10px] text-[#8C8980]">
                  Used in JSON & saved library
                </span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 2. Generation Modes */}
      <section className="rounded-xl bg-[#FFFFFF] border border-[#E8E6DF] shadow-2xs">
        <button
          type="button"
          onClick={() => toggleSection('modes')}
          className="w-full flex items-center justify-between px-4 py-3.5 text-left"
          aria-expanded={openSections.modes}
        >
          <span className="text-[13px] font-semibold text-[#171614]">
            Generation Mode
          </span>
          <ChevronDown
            className={`h-4 w-4 text-[#8C8980] transition-transform duration-150 ${
              openSections.modes ? 'rotate-180' : ''
            }`}
          />
        </button>

        {openSections.modes && (
          <div className="px-4 pb-4 pt-3 border-t border-[#EFECE5] space-y-1.5">
            {GENERATION_MODES.map((m) => {
              const active = mode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onChangeMode(m.id)}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors ${
                    active
                      ? 'bg-[#181816] border-[#181816] text-[#FFFFFF]'
                      : 'bg-[#FAF9F6] border-[#ECEAE2] text-[#52504B] hover:border-[#D4D1C7] hover:bg-[#F3F1EB] hover:text-[#171614]'
                  }`}
                >
                  <div className="min-w-0">
                    <span
                      className={`block text-xs font-semibold ${
                        active ? 'text-[#FFFFFF]' : 'text-[#171614]'
                      }`}
                    >
                      {m.label}
                    </span>
                    <span
                      className={`block text-[11px] truncate ${
                        active ? 'text-[#C9C6BE]' : 'text-[#78756C]'
                      }`}
                    >
                      {m.shortDesc}
                    </span>
                  </div>
                  <span
                    aria-hidden="true"
                    className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                      active
                        ? 'border-white bg-white'
                        : 'border-[#CCC9BF]'
                    }`}
                  >
                    {active && (
                      <span className="h-1.5 w-1.5 rounded-full bg-[#181816]" />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* 3. Colour Fine-Tuning Sliders */}
      <section className="rounded-xl bg-[#FFFFFF] border border-[#E8E6DF] shadow-2xs">
        <div className="flex items-center justify-between px-4 py-3.5">
          <button
            type="button"
            onClick={() => toggleSection('adjust')}
            className="flex items-center gap-2 text-left flex-1"
            aria-expanded={openSections.adjust}
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#EEF2FF] text-[#4F46E5]">
              <Sliders className="h-3.5 w-3.5" />
            </span>
            <span className="text-[13px] font-semibold text-[#171614]">
              Tone Adjustments
            </span>
          </button>

          <div className="flex items-center gap-2">
            {hasAdjustments && (
              <button
                type="button"
                onClick={() =>
                  onChangeAdjustments({
                    temperature: 0,
                    saturation: 0,
                    brightness: 0,
                  })
                }
                className="inline-flex items-center gap-1 text-[11px] font-medium text-[#0F766E] hover:text-[#115E59]"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </button>
            )}
            <button
              type="button"
              onClick={() => toggleSection('adjust')}
              aria-label="Toggle tone adjustments"
              className="text-[#8C8980] hover:text-[#171614]"
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-150 ${
                  openSections.adjust ? 'rotate-180' : ''
                }`}
              />
            </button>
          </div>
        </div>

        {openSections.adjust && (
          <div className="px-4 pb-4 pt-3 border-t border-[#EFECE5] space-y-4">
            {/* Temperature */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <label htmlFor="adj-temp" className="text-[#52504B] font-medium">
                  Temperature
                </label>
                <span className="font-mono text-[11px] font-semibold text-[#0F766E] tabular-nums">
                  {adjustments.temperature > 0
                    ? `+${adjustments.temperature} Warm`
                    : adjustments.temperature < 0
                      ? `${adjustments.temperature} Cool`
                      : '0 Neutral'}
                </span>
              </div>
              <input
                id="adj-temp"
                type="range"
                min={-30}
                max={30}
                step={1}
                value={adjustments.temperature}
                onChange={(e) =>
                  onChangeAdjustments({
                    ...adjustments,
                    temperature: Number(e.target.value),
                  })
                }
                className="w-full aivora-slider"
              />
            </div>

            {/* Saturation */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <label htmlFor="adj-sat" className="text-[#52504B] font-medium">
                  Saturation
                </label>
                <span className="font-mono text-[11px] font-semibold text-[#0F766E] tabular-nums">
                  {adjustments.saturation > 0
                    ? `+${adjustments.saturation}%`
                    : `${adjustments.saturation}%`}
                </span>
              </div>
              <input
                id="adj-sat"
                type="range"
                min={-50}
                max={50}
                step={1}
                value={adjustments.saturation}
                onChange={(e) =>
                  onChangeAdjustments({
                    ...adjustments,
                    saturation: Number(e.target.value),
                  })
                }
                className="w-full aivora-slider"
              />
            </div>

            {/* Brightness */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <label htmlFor="adj-bright" className="text-[#52504B] font-medium">
                  Brightness
                </label>
                <span className="font-mono text-[11px] font-semibold text-[#0F766E] tabular-nums">
                  {adjustments.brightness > 0
                    ? `+${adjustments.brightness}%`
                    : `${adjustments.brightness}%`}
                </span>
              </div>
              <input
                id="adj-bright"
                type="range"
                min={-15}
                max={15}
                step={1}
                value={adjustments.brightness}
                onChange={(e) =>
                  onChangeAdjustments({
                    ...adjustments,
                    brightness: Number(e.target.value),
                  })
                }
                className="w-full aivora-slider"
              />
            </div>
          </div>
        )}
      </section>

      {/* 4. Preset Colour Library (All 20 Tailwind Presets) */}
      <section className="rounded-xl bg-[#FFFFFF] border border-[#E8E6DF] shadow-2xs">
        <button
          type="button"
          onClick={() => toggleSection('presets')}
          className="w-full flex items-center justify-between px-4 py-3.5 text-left"
          aria-expanded={openSections.presets}
        >
          <span className="text-[13px] font-semibold text-[#171614]">
            Preset Colour Library
          </span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-[#8C8980] tabular-nums">
              {PRESET_COLOURS.length} presets
            </span>
            <ChevronDown
              className={`h-4 w-4 text-[#8C8980] transition-transform duration-150 ${
                openSections.presets ? 'rotate-180' : ''
              }`}
            />
          </div>
        </button>

        {openSections.presets && (
          <div className="px-4 pb-4 pt-3 border-t border-[#EFECE5]">
            <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-4 gap-1.5">
              {PRESET_COLOURS.map((preset) => {
                const isActive =
                  preset.hex.toUpperCase() === baseHex.toUpperCase();
                return (
                  <button
                    key={preset.slug}
                    type="button"
                    onClick={() => onSelectPreset(preset)}
                    title={`${preset.name} (${preset.hex})`}
                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-left transition-colors ${
                      isActive
                        ? 'bg-[#181816] border-[#181816] text-[#FFFFFF]'
                        : 'bg-[#FAF9F6] border-[#ECEAE2] text-[#4A4843] hover:border-[#D4D1C7] hover:bg-[#F3F1EB] hover:text-[#171614]'
                    }`}
                  >
                    <span
                      className="h-3.5 w-3.5 rounded-xs border border-black/15 shrink-0"
                      style={{ backgroundColor: preset.hex }}
                    />
                    <span className="text-[11px] font-medium truncate">
                      {preset.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
