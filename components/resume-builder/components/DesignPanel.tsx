import { AlertTriangle, Check } from 'lucide-react';
import { COLOR_PRESETS, FONT_OPTIONS, RESUME_TEMPLATES } from '../data/templates';
import {
  BulletStyle,
  DesignConfig,
  DividerStyle,
  FontFamilyOption,
  HeaderAlignment,
  LayoutOverride,
  MarginOption,
  PageSize,
  SpacingOption,
} from '../types/resume';

interface DesignPanelProps {
  design: DesignConfig;
  onChange: (patch: Partial<DesignConfig>) => void;
}

export default function DesignPanel({ design, onChange }: DesignPanelProps) {
  const currentTemplate = RESUME_TEMPLATES.find((t) => t.id === design.templateId);
  const isATSClassic = design.templateId === 'ats-classic';
  const effectiveLayout = isATSClassic
    ? 'single'
    : design.layoutOverride === 'template'
      ? currentTemplate?.defaultLayout || 'single'
      : design.layoutOverride;

  const isATSSafeConfig = effectiveLayout === 'single' && !design.showPhoto;

  return (
    <div className="space-y-6 p-4">
      {/* ATS Formatting Guidance */}
      <div className="rounded-lg border border-white/[0.08] bg-[#10141D] p-3.5 text-xs">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-white">ATS Parsing Profile</span>
          <span
            className={`font-medium ${
              isATSSafeConfig ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {isATSSafeConfig ? 'Parser-Friendly' : 'Visual Layout'}
          </span>
        </div>
        <p className="mt-1.5 leading-relaxed text-[#98A2B3]">
          {isATSClassic
            ? 'ATS-Friendly Classic enforces a pure single-column text flow without icons or profile photos.'
            : isATSSafeConfig
              ? 'Single-column layout with no profile image offers strong compatibility across automated parsers.'
              : 'Two-column layouts or profile images are great for human review; switch to Single Column or ATS-Friendly Classic for strict online portals.'}
        </p>
        {!isATSSafeConfig && (
          <button
            type="button"
            onClick={() =>
              onChange({
                templateId: 'ats-classic',
                layoutOverride: 'single',
                showPhoto: false,
                showIcons: false,
              })
            }
            className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-medium text-[#D4A843] hover:underline"
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Switch to ATS-Friendly Classic</span>
          </button>
        )}
      </div>

      {/* Color Accent */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-white">Accent Colour</h3>
          <span className="font-mono-tabular text-xs text-[#98A2B3]">{design.accentColor.toUpperCase()}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {COLOR_PRESETS.map((preset) => {
            const selected = design.accentColor.toLowerCase() === preset.hex.toLowerCase();
            return (
              <button
                key={preset.hex}
                type="button"
                title={preset.name}
                onClick={() => onChange({ accentColor: preset.hex })}
                className={`flex h-8 w-8 items-center justify-center rounded-md border transition-transform hover:scale-105 ${
                  selected ? 'border-[#D4A843] ring-2 ring-[#D4A843]/40' : 'border-white/20'
                }`}
                style={{ backgroundColor: preset.hex }}
              >
                {selected && <Check className="h-4 w-4 text-white" />}
              </button>
            );
          })}
          <label className="flex h-8 cursor-pointer items-center gap-2 rounded-md border border-white/[0.12] bg-[#181D29] px-2.5 text-xs text-[#CBD5E1] hover:border-white/25">
            <span>Custom</span>
            <input
              type="color"
              value={design.accentColor}
              onChange={(e) => onChange({ accentColor: e.target.value })}
              className="h-4 w-5 cursor-pointer border-0 bg-transparent p-0"
              aria-label="Custom accent hex color"
            />
          </label>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={design.accentColor}
            onChange={(e) => {
              const val = e.target.value;
              if (/^#[0-9a-fA-F]{0,6}$/.test(val)) {
                onChange({ accentColor: val });
              }
            }}
            placeholder="#1E3A5F"
            aria-label="Accent hex code"
            className="h-9 w-32 rounded-md border border-white/[0.1] bg-[#0B0E14] px-2.5 font-mono-tabular text-xs text-white focus:border-[#D4A843] focus:outline-none"
          />
          <span className="text-xs text-[#64748B]">Enter custom HEX</span>
        </div>
      </div>

      {/* Typography */}
      <div className="space-y-3 border-t border-white/[0.08] pt-5">
        <h3 className="text-xs font-semibold text-white">Typography</h3>
        <div>
          <label className="mb-1.5 block text-xs text-[#98A2B3]">Font Family</label>
          <select
            value={design.fontFamily}
            onChange={(e) => onChange({ fontFamily: e.target.value as FontFamilyOption })}
            className="h-9 w-full rounded-md border border-white/[0.1] bg-[#0B0E14] px-3 text-xs text-white focus:border-[#D4A843] focus:outline-none"
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label} — {f.style}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="mb-1 flex justify-between text-xs text-[#98A2B3]">
              <span>Body Size</span>
              <span className="font-mono-tabular text-white">{design.baseFontSize} pt</span>
            </div>
            <input
              type="range"
              min={8.5}
              max={11.5}
              step={0.5}
              value={design.baseFontSize}
              onChange={(e) => onChange({ baseFontSize: Number(e.target.value) })}
              className="w-full accent-[#D4A843]"
            />
          </div>

          <div>
            <div className="mb-1 flex justify-between text-xs text-[#98A2B3]">
              <span>Heading Scale</span>
              <span className="font-mono-tabular text-white">{design.headingScale.toFixed(1)}×</span>
            </div>
            <input
              type="range"
              min={1.1}
              max={1.6}
              step={0.1}
              value={design.headingScale}
              onChange={(e) => onChange({ headingScale: Number(e.target.value) })}
              className="w-full accent-[#D4A843]"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="mb-1 flex justify-between text-xs text-[#98A2B3]">
              <span>Line Spacing</span>
              <span className="font-mono-tabular text-white">{design.lineHeight.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={1.25}
              max={1.7}
              step={0.05}
              value={design.lineHeight}
              onChange={(e) => onChange({ lineHeight: Number(e.target.value) })}
              className="w-full accent-[#D4A843]"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-[#98A2B3]">Body Weight</label>
            <div className="grid grid-cols-2 gap-1 rounded-md bg-[#0B0E14] p-0.5">
              {(['400', '500'] as const).map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => onChange({ fontWeight: w })}
                  className={`h-7 rounded text-xs font-medium transition-colors ${
                    design.fontWeight === w
                      ? 'bg-[#232A3B] text-white'
                      : 'text-[#98A2B3] hover:text-white'
                  }`}
                >
                  {w === '400' ? 'Regular' : 'Medium'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Layout & Spacing */}
      <div className="space-y-3 border-t border-white/[0.08] pt-5">
        <h3 className="text-xs font-semibold text-white">Layout & Page Geometry</h3>

        <div>
          <label className="mb-1.5 block text-xs text-[#98A2B3]">Column Structure</label>
          <div className="grid grid-cols-3 gap-1 rounded-md bg-[#0B0E14] p-1">
            {(
              [
                ['template', 'Template'],
                ['single', 'Single'],
                ['two-column', 'Two-Col'],
              ] as Array<[LayoutOverride, string]>
            ).map(([val, label]) => (
              <button
                key={val}
                type="button"
                disabled={isATSClassic && val === 'two-column'}
                onClick={() => onChange({ layoutOverride: val })}
                className={`h-8 rounded text-xs font-medium whitespace-nowrap transition-colors disabled:opacity-40 ${
                  design.layoutOverride === val
                    ? 'bg-[#D4A843] text-[#0B0E14] font-semibold'
                    : 'text-[#98A2B3] hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs text-[#98A2B3]">Section Spacing</label>
            <select
              value={design.sectionSpacing}
              onChange={(e) => onChange({ sectionSpacing: e.target.value as SpacingOption })}
              className="h-9 w-full rounded-md border border-white/[0.1] bg-[#0B0E14] px-2.5 text-xs text-white focus:border-[#D4A843] focus:outline-none"
            >
              <option value="compact">Compact</option>
              <option value="balanced">Balanced</option>
              <option value="airy">Airy</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs text-[#98A2B3]">Page Margins</label>
            <select
              value={design.pageMargins}
              onChange={(e) => onChange({ pageMargins: e.target.value as MarginOption })}
              className="h-9 w-full rounded-md border border-white/[0.1] bg-[#0B0E14] px-2.5 text-xs text-white focus:border-[#D4A843] focus:outline-none"
            >
              <option value="narrow">Narrow</option>
              <option value="normal">Normal</option>
              <option value="wide">Wide</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs text-[#98A2B3]">Header Alignment</label>
            <select
              value={design.headerAlignment}
              onChange={(e) => onChange({ headerAlignment: e.target.value as HeaderAlignment })}
              className="h-9 w-full rounded-md border border-white/[0.1] bg-[#0B0E14] px-2.5 text-xs text-white focus:border-[#D4A843] focus:outline-none"
            >
              <option value="left">Left</option>
              <option value="center">Centered</option>
              <option value="split">Split Contact</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs text-[#98A2B3]">Page Size</label>
            <div className="grid grid-cols-2 gap-1 rounded-md bg-[#0B0E14] p-0.5">
              {(['A4', 'Letter'] as PageSize[]).map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => onChange({ pageSize: sz })}
                  className={`h-8 rounded text-xs font-medium transition-colors ${
                    design.pageSize === sz
                      ? 'bg-[#232A3B] text-white'
                      : 'text-[#98A2B3] hover:text-white'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs text-[#98A2B3]">Divider Style</label>
            <select
              value={design.dividerStyle}
              onChange={(e) => onChange({ dividerStyle: e.target.value as DividerStyle })}
              className="h-9 w-full rounded-md border border-white/[0.1] bg-[#0B0E14] px-2.5 text-xs text-white focus:border-[#D4A843] focus:outline-none"
            >
              <option value="hairline">Hairline Rule</option>
              <option value="bold">Bold Accent Rule</option>
              <option value="dotted">Dotted Rule</option>
              <option value="none">None</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs text-[#98A2B3]">Bullet Style</label>
            <select
              value={design.bulletStyle}
              onChange={(e) => onChange({ bulletStyle: e.target.value as BulletStyle })}
              className="h-9 w-full rounded-md border border-white/[0.1] bg-[#0B0E14] px-2.5 text-xs text-white focus:border-[#D4A843] focus:outline-none"
            >
              <option value="disc">Round Dot (•)</option>
              <option value="square">Square (▪)</option>
              <option value="dash">En Dash (–)</option>
              <option value="arrow">Chevron (›)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Display Toggles */}
      <div className="space-y-2.5 border-t border-white/[0.08] pt-5">
        <h3 className="text-xs font-semibold text-white">Optional Elements</h3>
        <label className="flex cursor-pointer items-center justify-between rounded-md border border-white/[0.08] bg-[#10141D] px-3 py-2.5">
          <div>
            <div className="text-xs font-medium text-white">Show Profile Photo</div>
            <div className="text-[11px] text-[#98A2B3]">Hidden automatically in ATS-Friendly Classic</div>
          </div>
          <input
            type="checkbox"
            disabled={isATSClassic}
            checked={!isATSClassic && design.showPhoto}
            onChange={(e) => onChange({ showPhoto: e.target.checked })}
            className="h-4 w-4 accent-[#D4A843]"
          />
        </label>

        <label className="flex cursor-pointer items-center justify-between rounded-md border border-white/[0.08] bg-[#10141D] px-3 py-2.5">
          <div>
            <div className="text-xs font-medium text-white">Show Contact Icons</div>
            <div className="text-[11px] text-[#98A2B3]">Clean line icons next to email, phone & links</div>
          </div>
          <input
            type="checkbox"
            disabled={isATSClassic}
            checked={!isATSClassic && design.showIcons}
            onChange={(e) => onChange({ showIcons: e.target.checked })}
            className="h-4 w-4 accent-[#D4A843]"
          />
        </label>
      </div>
    </div>
  );
}
