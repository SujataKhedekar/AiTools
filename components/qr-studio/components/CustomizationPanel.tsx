import React, { useRef, useState } from 'react';
import {
  ChevronDown,
  Frame,
  Grid2x2,
  ImagePlus,
  LayoutTemplate,
  Palette,
  RotateCcw,
  ScanLine,
  ShieldCheck,
  Shuffle,
  X,
} from 'lucide-react';
import {
  CornerDotStyle,
  CornerSquareStyle,
  DesignTemplate,
  ErrorCorrectionLevel,
  FrameFontWeight,
  FramePosition,
  FramePresetId,
  FrameVisualStyle,
  LogoContainerShape,
  ModuleStyle,
  QRStyleConfig,
} from '../types/qr';
import {
  CORNER_PRESETS,
  DESIGN_TEMPLATES,
  FRAME_PRESETS,
} from '../data/templates';
import { PRESET_BRAND_PALETTES } from '../utils/colorUtils';
import { ColorInput } from './ColorInput';

interface CustomizationPanelProps {
  activeTab: 'style' | 'templates';
  onTabChange: (tab: 'style' | 'templates') => void;
  style: QRStyleConfig;
  activeTemplateId: string | null;
  onUpdateStyle: (patch: Partial<QRStyleConfig>) => void;
  onApplyTemplate: (template: DesignTemplate) => void;
  onLogoUpload: (dataUrl: string, fileName: string) => void;
  onLogoRemove: () => void;
  onRandomPalette: () => void;
  onResetStyle: () => void;
}

type SectionKey = 'colors' | 'modules' | 'corners' | 'logo' | 'frame' | 'advanced';

const MODULE_OPTIONS: Array<{ id: ModuleStyle; label: string }> = [
  { id: 'square', label: 'Square' },
  { id: 'rounded', label: 'Rounded' },
  { id: 'dots', label: 'Dots' },
  { id: 'extra-rounded', label: 'Extra Round' },
  { id: 'classy', label: 'Classy' },
  { id: 'classy-rounded', label: 'Classy Round' },
  { id: 'vertical-bars', label: 'Vertical Bars' },
  { id: 'horizontal-bars', label: 'Horizontal Bars' },
];

const CORNER_SQUARE_OPTIONS: Array<{ id: CornerSquareStyle; label: string }> = [
  { id: 'square', label: 'Square' },
  { id: 'rounded', label: 'Rounded' },
  { id: 'extra-rounded', label: 'Extra Round' },
  { id: 'dot', label: 'Circle' },
  { id: 'classy', label: 'Classy' },
  { id: 'leaf', label: 'Leaf' },
];

const CORNER_DOT_OPTIONS: Array<{ id: CornerDotStyle; label: string }> = [
  { id: 'square', label: 'Square' },
  { id: 'rounded', label: 'Rounded' },
  { id: 'dot', label: 'Dot' },
  { id: 'diamond', label: 'Diamond' },
  { id: 'classy', label: 'Classy' },
];

const EC_OPTIONS: Array<{ level: ErrorCorrectionLevel; recovery: string; note: string }> = [
  { level: 'L', recovery: '7%', note: 'Compact' },
  { level: 'M', recovery: '15%', note: 'Standard' },
  { level: 'Q', recovery: '25%', note: 'High' },
  { level: 'H', recovery: '30%', note: 'Best for Logo' },
];

const ModuleMiniIcon: React.FC<{ type: ModuleStyle; active: boolean }> = ({ type, active }) => {
  const fill = active ? '#2563EB' : '#334155';
  if (type === 'dots') {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <circle cx="6" cy="6" r="3" fill={fill} />
        <circle cx="18" cy="6" r="3" fill={fill} />
        <circle cx="6" cy="18" r="3" fill={fill} />
        <circle cx="12" cy="12" r="3" fill={fill} />
        <circle cx="18" cy="18" r="3" fill={fill} />
      </svg>
    );
  }
  if (type === 'vertical-bars') {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <rect x="4" y="3" width="4" height="18" rx="2" fill={fill} />
        <rect x="10" y="6" width="4" height="11" rx="2" fill={fill} />
        <rect x="16" y="3" width="4" height="8" rx="2" fill={fill} />
        <rect x="16" y="14" width="4" height="7" rx="2" fill={fill} />
      </svg>
    );
  }
  if (type === 'horizontal-bars') {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <rect x="3" y="4" width="18" height="4" rx="2" fill={fill} />
        <rect x="6" y="10" width="11" height="4" rx="2" fill={fill} />
        <rect x="3" y="16" width="8" height="4" rx="2" fill={fill} />
        <rect x="14" y="16" width="7" height="4" rx="2" fill={fill} />
      </svg>
    );
  }
  if (type === 'rounded') {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" rx="2" fill={fill} />
        <rect x="14" y="3" width="7" height="7" rx="2" fill={fill} />
        <rect x="3" y="14" width="7" height="7" rx="2" fill={fill} />
        <rect x="14" y="14" width="7" height="7" rx="2" fill={fill} />
      </svg>
    );
  }
  if (type === 'extra-rounded') {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <rect x="3" y="3" width="18" height="7" rx="3.5" fill={fill} />
        <rect x="3" y="14" width="7" height="7" rx="3.5" fill={fill} />
        <rect x="14" y="14" width="7" height="7" rx="3.5" fill={fill} />
      </svg>
    );
  }
  if (type === 'classy' || type === 'classy-rounded') {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path d="M8 3H11V11H3V8C3 5.2 5.2 3 8 3Z" fill={fill} />
        <path d="M13 3H21V8C21 10.8 18.8 13 16 13H13V3Z" fill={fill} />
        <path d="M3 13H11V16C11 18.8 8.8 21 6 21H3V13Z" fill={fill} />
        <path d="M16 13H21V21H13V16C13 14.3 14.3 13 16 13Z" fill={fill} />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" fill={fill} />
      <rect x="14" y="3" width="7" height="7" fill={fill} />
      <rect x="3" y="14" width="7" height="7" fill={fill} />
      <rect x="14" y="14" width="7" height="7" fill={fill} />
    </svg>
  );
};

interface AccordionSectionProps {
  id: SectionKey;
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  isOpen: boolean;
  onToggle: (id: SectionKey) => void;
  children: React.ReactNode;
}

const AccordionSection: React.FC<AccordionSectionProps> = ({
  id,
  title,
  subtitle,
  icon: Icon,
  isOpen,
  onToggle,
  children,
}) => (
  <div className="border-b border-slate-200 last:border-b-0">
    <button
      type="button"
      onClick={() => onToggle(id)}
      aria-expanded={isOpen}
      className="flex w-full cursor-pointer items-center justify-between gap-2 px-4 py-3.5 text-left hover:bg-slate-50/80 transition-colors"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <Icon className="h-4 w-4 shrink-0 text-slate-500" />
        <span className="font-display text-xs font-semibold text-slate-900 truncate">
          {title}
        </span>
        {subtitle && (
          <span className="text-[11px] text-slate-400 truncate">· {subtitle}</span>
        )}
      </div>
      <ChevronDown
        className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-150 ${
          isOpen ? 'rotate-180' : ''
        }`}
      />
    </button>
    {isOpen && <div className="px-4 pb-5 pt-1 space-y-4">{children}</div>}
  </div>
);

export const CustomizationPanel: React.FC<CustomizationPanelProps> = ({
  activeTab,
  onTabChange,
  style,
  activeTemplateId,
  onUpdateStyle,
  onApplyTemplate,
  onLogoUpload,
  onLogoRemove,
  onRandomPalette,
  onResetStyle,
}) => {
  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
    colors: true,
    modules: true,
    corners: false,
    logo: false,
    frame: false,
    advanced: false,
  });

  const [templateFilter, setTemplateFilter] = useState<string>('All');
  const logoFileRef = useRef<HTMLInputElement | null>(null);

  const toggleSection = (key: SectionKey) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/image\/(png|jpeg|jpg|svg\+xml|webp)/i.test(file.type)) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onLogoUpload(reader.result, file.name);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const categories = ['All', 'Minimal', 'Digital', 'Hospitality', 'Enterprise', 'Creative', 'Retail'];
  const filteredTemplates =
    templateFilter === 'All'
      ? DESIGN_TEMPLATES
      : DESIGN_TEMPLATES.filter((t) => {
          if (templateFilter === 'Digital') {
            return ['Digital', 'Social', 'Nightlife', 'Product'].includes(t.category);
          }
          if (templateFilter === 'Enterprise') {
            return ['Enterprise', 'Professional', 'Property', 'Events'].includes(t.category);
          }
          return t.category === templateFilter;
        });

  return (
    <aside className="flex h-full flex-col border-l border-slate-200 bg-white">
      {/* Top Panel Mode Switcher */}
      <div className="border-b border-slate-200 p-3">
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => onTabChange('style')}
            className={`flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'style'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Palette className="h-3.5 w-3.5" />
            <span>Customize</span>
          </button>
          <button
            type="button"
            onClick={() => onTabChange('templates')}
            className={`flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'templates'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutTemplate className="h-3.5 w-3.5" />
            <span>Templates (14)</span>
          </button>
        </div>
      </div>

      {/* Panel Body */}
      <div className="studio-scroll flex-1 overflow-y-auto">
        {activeTab === 'style' ? (
          <div>
            {/* 1. COLORS */}
            <AccordionSection
              id="colors"
              title="Colors & Gradient"
              subtitle={style.fgMode === 'gradient' ? 'Gradient' : style.fgColor}
              icon={Palette}
              isOpen={openSections.colors}
              onToggle={toggleSection}
            >
              {/* Solid / Gradient toggle */}
              <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => onUpdateStyle({ fgMode: 'solid' })}
                  className={`h-7 cursor-pointer rounded-md text-xs font-medium transition-colors ${
                    style.fgMode === 'solid'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Solid Color
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateStyle({ fgMode: 'gradient' })}
                  className={`h-7 cursor-pointer rounded-md text-xs font-medium transition-colors ${
                    style.fgMode === 'gradient'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Gradient
                </button>
              </div>

              {style.fgMode === 'solid' ? (
                <ColorInput
                  label="Foreground Color"
                  value={style.fgColor}
                  onChange={(hex) => onUpdateStyle({ fgColor: hex })}
                />
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-1 rounded-lg border border-slate-200 p-0.5">
                    <button
                      type="button"
                      onClick={() => onUpdateStyle({ gradientType: 'linear' })}
                      className={`h-7 cursor-pointer rounded-md text-xs font-medium transition-colors ${
                        style.gradientType === 'linear'
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Linear
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateStyle({ gradientType: 'radial' })}
                      className={`h-7 cursor-pointer rounded-md text-xs font-medium transition-colors ${
                        style.gradientType === 'radial'
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Radial
                    </button>
                  </div>

                  <ColorInput
                    label="Gradient Start"
                    value={style.gradientStart}
                    onChange={(hex) => onUpdateStyle({ gradientStart: hex })}
                  />
                  <ColorInput
                    label="Gradient End"
                    value={style.gradientEnd}
                    onChange={(hex) => onUpdateStyle({ gradientEnd: hex })}
                  />

                  {style.gradientType === 'linear' && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-700">Gradient Angle</span>
                        <span className="font-mono text-slate-500 tabular-nums">
                          {style.gradientRotation}°
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={360}
                        step={5}
                        value={style.gradientRotation}
                        onChange={(e) =>
                          onUpdateStyle({ gradientRotation: Number(e.target.value) })
                        }
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
              )}

              <hr className="border-slate-100" />

              {/* Background Color + Transparent */}
              <div className="space-y-3">
                <label className="flex cursor-pointer items-center justify-between">
                  <span className="text-xs font-medium text-slate-700">
                    Transparent Background
                  </span>
                  <input
                    type="checkbox"
                    checked={style.bgTransparent}
                    onChange={(e) => onUpdateStyle({ bgTransparent: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                  />
                </label>

                <ColorInput
                  label="Background Color"
                  value={style.bgColor}
                  disabled={style.bgTransparent}
                  onChange={(hex) => onUpdateStyle({ bgColor: hex })}
                />
              </div>

              <hr className="border-slate-100" />

              {/* Preset Brand Palettes */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-700">Brand Palettes</span>
                  <button
                    type="button"
                    onClick={onRandomPalette}
                    className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                  >
                    <Shuffle className="h-3 w-3" />
                    <span>Random</span>
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {PRESET_BRAND_PALETTES.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      title={p.name}
                      onClick={() =>
                        onUpdateStyle({
                          fgMode: p.fgMode,
                          fgColor: p.fgColor,
                          gradientStart: p.gradientStart,
                          gradientEnd: p.gradientEnd,
                          gradientRotation: p.gradientRotation,
                          bgColor: p.bgColor,
                          bgTransparent: false,
                          cornerSquareColor: p.cornerSquareColor,
                          cornerDotColor: p.cornerDotColor,
                          useCustomCornerColors: p.useCustomCornerColors,
                        })
                      }
                      className="group flex cursor-pointer flex-col items-center gap-1 rounded-lg border border-slate-200 p-1.5 hover:border-slate-400 transition-colors"
                    >
                      <div
                        className="h-6 w-full rounded-sm border border-black/10"
                        style={{
                          background:
                            p.fgMode === 'gradient'
                              ? `linear-gradient(${p.gradientRotation}deg, ${p.gradientStart}, ${p.gradientEnd})`
                              : p.fgColor,
                        }}
                      />
                      <span className="w-full truncate text-center text-[10px] font-medium text-slate-600">
                        {p.name.split(' ')[0]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </AccordionSection>

            {/* 2. MODULE STYLE */}
            <AccordionSection
              id="modules"
              title="QR Pattern Style"
              subtitle={MODULE_OPTIONS.find((m) => m.id === style.moduleStyle)?.label}
              icon={Grid2x2}
              isOpen={openSections.modules}
              onToggle={toggleSection}
            >
              <div className="grid grid-cols-2 gap-2">
                {MODULE_OPTIONS.map((opt) => {
                  const active = style.moduleStyle === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => onUpdateStyle({ moduleStyle: opt.id })}
                      className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left transition-colors ${
                        active
                          ? 'border-blue-600 bg-blue-50/70 text-blue-700'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <ModuleMiniIcon type={opt.id} active={active} />
                      <span className="text-xs font-medium truncate">{opt.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">Quiet Zone Margin</span>
                  <span className="font-mono text-slate-500 tabular-nums">
                    {style.quietZone} modules
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={8}
                  step={1}
                  value={style.quietZone}
                  onChange={(e) => onUpdateStyle({ quietZone: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
            </AccordionSection>

            {/* 3. CORNER CUSTOMIZATION */}
            <AccordionSection
              id="corners"
              title="Corner Eyes"
              subtitle={
                CORNER_SQUARE_OPTIONS.find((c) => c.id === style.cornerSquareStyle)?.label
              }
              icon={ScanLine}
              isOpen={openSections.corners}
              onToggle={toggleSection}
            >
              {/* Corner Presets */}
              <div className="space-y-2">
                <span className="block text-xs font-medium text-slate-700">Corner Presets</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {CORNER_PRESETS.map((preset) => {
                    const matched =
                      style.cornerSquareStyle === preset.cornerSquareStyle &&
                      style.cornerDotStyle === preset.cornerDotStyle;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() =>
                          onUpdateStyle({
                            cornerSquareStyle: preset.cornerSquareStyle,
                            cornerDotStyle: preset.cornerDotStyle,
                          })
                        }
                        className={`h-8 cursor-pointer rounded-lg border px-2 text-xs font-medium transition-colors truncate ${
                          matched
                            ? 'border-blue-600 bg-blue-50/70 text-blue-700'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {preset.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Corner Square Style */}
              <div className="space-y-2">
                <span className="block text-xs font-medium text-slate-700">
                  Outer Corner Frame
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {CORNER_SQUARE_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => onUpdateStyle({ cornerSquareStyle: opt.id })}
                      className={`h-8 cursor-pointer rounded-lg border px-2 text-xs font-medium transition-colors ${
                        style.cornerSquareStyle === opt.id
                          ? 'border-blue-600 bg-blue-50/70 text-blue-700'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Corner Dot Style */}
              <div className="space-y-2">
                <span className="block text-xs font-medium text-slate-700">Inner Corner Dot</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {CORNER_DOT_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => onUpdateStyle({ cornerDotStyle: opt.id })}
                      className={`h-8 cursor-pointer rounded-lg border px-2 text-xs font-medium transition-colors ${
                        style.cornerDotStyle === opt.id
                          ? 'border-blue-600 bg-blue-50/70 text-blue-700'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Independent Corner Colors */}
              <label className="flex cursor-pointer items-center justify-between">
                <span className="text-xs font-medium text-slate-700">
                  Custom Corner Colors
                </span>
                <input
                  type="checkbox"
                  checked={style.useCustomCornerColors}
                  onChange={(e) =>
                    onUpdateStyle({ useCustomCornerColors: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                />
              </label>

              {style.useCustomCornerColors && (
                <div className="space-y-3 pt-1">
                  <ColorInput
                    label="Corner Frame Color"
                    value={style.cornerSquareColor}
                    onChange={(hex) => onUpdateStyle({ cornerSquareColor: hex })}
                  />
                  <ColorInput
                    label="Corner Dot Color"
                    value={style.cornerDotColor}
                    onChange={(hex) => onUpdateStyle({ cornerDotColor: hex })}
                  />
                </div>
              )}
            </AccordionSection>

            {/* 4. LOGO & BRANDING */}
            <AccordionSection
              id="logo"
              title="Logo & Branding"
              subtitle={style.logoDataUrl ? `${style.logoSize}%` : 'None'}
              icon={ImagePlus}
              isOpen={openSections.logo}
              onToggle={toggleSection}
            >
              <input
                ref={logoFileRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                onChange={handleLogoFile}
                className="hidden"
              />

              {!style.logoDataUrl ? (
                <button
                  type="button"
                  onClick={() => logoFileRef.current?.click()}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50/60 py-3 text-xs font-medium text-slate-700 hover:border-blue-500 hover:bg-blue-50/30 transition-colors"
                >
                  <ImagePlus className="h-4 w-4 text-slate-400" />
                  <span>Upload PNG, JPG, or SVG Logo</span>
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50/70 p-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={style.logoDataUrl}
                        alt="Logo preview"
                        className="h-8 w-8 rounded border border-slate-200 bg-white object-contain p-0.5"
                      />
                      <span className="truncate text-xs font-medium text-slate-700">
                        {style.logoFileName || 'Logo'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => logoFileRef.current?.click()}
                        className="h-7 cursor-pointer rounded-md border border-slate-200 bg-white px-2 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        onClick={onLogoRemove}
                        aria-label="Remove logo"
                        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Logo Size */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700">Logo Size</span>
                      <span className="font-mono text-slate-500 tabular-nums">
                        {style.logoSize}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={12}
                      max={34}
                      step={1}
                      value={style.logoSize}
                      onChange={(e) => onUpdateStyle({ logoSize: Number(e.target.value) })}
                      className="w-full"
                    />
                  </div>

                  {/* Logo Padding */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700">Logo Padding</span>
                      <span className="font-mono text-slate-500 tabular-nums">
                        {style.logoPadding}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={24}
                      step={1}
                      value={style.logoPadding}
                      onChange={(e) => onUpdateStyle({ logoPadding: Number(e.target.value) })}
                      className="w-full"
                    />
                  </div>

                  {/* Container Shape */}
                  <div className="space-y-1.5">
                    <span className="block text-xs font-medium text-slate-700">
                      Container Shape
                    </span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['square', 'rounded', 'circle'] as LogoContainerShape[]).map((shape) => (
                        <button
                          key={shape}
                          type="button"
                          onClick={() => onUpdateStyle({ logoShape: shape })}
                          className={`h-8 cursor-pointer rounded-lg border text-xs font-medium capitalize transition-colors ${
                            style.logoShape === shape
                              ? 'border-blue-600 bg-blue-50/70 text-blue-700'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {shape}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Logo Background Toggle + Color */}
                  <label className="flex cursor-pointer items-center justify-between">
                    <span className="text-xs font-medium text-slate-700">Logo Background</span>
                    <input
                      type="checkbox"
                      checked={style.logoBgEnabled}
                      onChange={(e) => onUpdateStyle({ logoBgEnabled: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                    />
                  </label>

                  {style.logoBgEnabled && (
                    <ColorInput
                      label="Logo Backdrop Color"
                      value={style.logoBgColor}
                      onChange={(hex) => onUpdateStyle({ logoBgColor: hex })}
                    />
                  )}

                  {/* Excavate Modules */}
                  <label className="flex cursor-pointer items-center justify-between">
                    <span className="text-xs font-medium text-slate-700">
                      Clear QR Dots Behind Logo
                    </span>
                    <input
                      type="checkbox"
                      checked={style.logoExcavate}
                      onChange={(e) => onUpdateStyle({ logoExcavate: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                    />
                  </label>

                  {/* Positioning Controls */}
                  <div className="space-y-2.5 border-t border-slate-100 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-700">Logo Position</span>
                      {(style.logoOffsetX !== 0 || style.logoOffsetY !== 0) && (
                        <button
                          type="button"
                          onClick={() => onUpdateStyle({ logoOffsetX: 0, logoOffsetY: 0 })}
                          className="cursor-pointer text-[11px] font-medium text-blue-600 hover:text-blue-700"
                        >
                          Recenter
                        </button>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>Horizontal X</span>
                        <span className="font-mono tabular-nums">{style.logoOffsetX}%</span>
                      </div>
                      <input
                        type="range"
                        min={-12}
                        max={12}
                        step={1}
                        value={style.logoOffsetX}
                        onChange={(e) => onUpdateStyle({ logoOffsetX: Number(e.target.value) })}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>Vertical Y</span>
                        <span className="font-mono tabular-nums">{style.logoOffsetY}%</span>
                      </div>
                      <input
                        type="range"
                        min={-12}
                        max={12}
                        step={1}
                        value={style.logoOffsetY}
                        onChange={(e) => onUpdateStyle({ logoOffsetY: Number(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              )}
            </AccordionSection>

            {/* 5. FRAME & LABEL */}
            <AccordionSection
              id="frame"
              title="Frame & Callout Label"
              subtitle={style.framePreset === 'none' ? 'Off' : style.frameText || 'Active'}
              icon={Frame}
              isOpen={openSections.frame}
              onToggle={toggleSection}
            >
              {/* Frame Preset */}
              <div className="space-y-2">
                <span className="block text-xs font-medium text-slate-700">Label Preset</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {FRAME_PRESETS.map((fp) => {
                    const active = style.framePreset === fp.id;
                    return (
                      <button
                        key={fp.id}
                        type="button"
                        onClick={() =>
                          onUpdateStyle({
                            framePreset: fp.id as FramePresetId,
                            frameText:
                              fp.id === 'none'
                                ? style.frameText
                                : fp.id === 'custom'
                                ? style.frameText || fp.defaultText
                                : fp.defaultText,
                          })
                        }
                        className={`h-8 cursor-pointer rounded-lg border px-2.5 text-left text-xs font-medium transition-colors truncate ${
                          active
                            ? 'border-blue-600 bg-blue-50/70 text-blue-700'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {fp.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {style.framePreset !== 'none' && (
                <div className="space-y-3.5 pt-1">
                  {/* Label text */}
                  <div>
                    <label
                      htmlFor="frame-label-input"
                      className="mb-1.5 block text-xs font-medium text-slate-700"
                    >
                      Frame Text
                    </label>
                    <input
                      id="frame-label-input"
                      type="text"
                      maxLength={32}
                      value={style.frameText}
                      onChange={(e) => onUpdateStyle({ frameText: e.target.value })}
                      placeholder="SCAN ME"
                      className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15"
                    />
                  </div>

                  {/* Frame Visual Style */}
                  <div className="space-y-1.5">
                    <span className="block text-xs font-medium text-slate-700">Frame Style</span>
                    <div className="grid grid-cols-4 gap-1.5">
                      {(
                        [
                          { id: 'banner', label: 'Banner' },
                          { id: 'card', label: 'Card' },
                          { id: 'outline', label: 'Outline' },
                          { id: 'pill', label: 'Badge' },
                        ] as Array<{ id: FrameVisualStyle; label: string }>
                      ).map((fs) => (
                        <button
                          key={fs.id}
                          type="button"
                          onClick={() => onUpdateStyle({ frameStyle: fs.id })}
                          className={`h-8 cursor-pointer rounded-lg border text-xs font-medium transition-colors ${
                            style.frameStyle === fs.id
                              ? 'border-blue-600 bg-blue-50/70 text-blue-700'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {fs.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Frame Position */}
                  <div className="space-y-1.5">
                    <span className="block text-xs font-medium text-slate-700">
                      Label Position
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(['bottom', 'top'] as FramePosition[]).map((pos) => (
                        <button
                          key={pos}
                          type="button"
                          onClick={() => onUpdateStyle({ framePosition: pos })}
                          className={`h-8 cursor-pointer rounded-lg border text-xs font-medium capitalize transition-colors ${
                            style.framePosition === pos
                              ? 'border-blue-600 bg-blue-50/70 text-blue-700'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {pos}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Frame & Text Colors */}
                  <ColorInput
                    label="Frame Color"
                    value={style.frameColor}
                    onChange={(hex) => onUpdateStyle({ frameColor: hex })}
                  />
                  <ColorInput
                    label="Text Color"
                    value={style.frameTextColor}
                    onChange={(hex) => onUpdateStyle({ frameTextColor: hex })}
                  />

                  {/* Font Size & Weight */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-700">Font Size</span>
                      <span className="font-mono text-slate-500 tabular-nums">
                        {style.frameFontSize}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={14}
                      max={32}
                      step={1}
                      value={style.frameFontSize}
                      onChange={(e) =>
                        onUpdateStyle({ frameFontSize: Number(e.target.value) })
                      }
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <span className="block text-xs font-medium text-slate-700">Font Weight</span>
                    <div className="grid grid-cols-4 gap-1.5">
                      {(
                        [
                          { w: 500, label: 'Med' },
                          { w: 600, label: 'Semi' },
                          { w: 700, label: 'Bold' },
                          { w: 800, label: 'Extra' },
                        ] as Array<{ w: FrameFontWeight; label: string }>
                      ).map((opt) => (
                        <button
                          key={opt.w}
                          type="button"
                          onClick={() => onUpdateStyle({ frameFontWeight: opt.w })}
                          className={`h-8 cursor-pointer rounded-lg border text-xs font-medium transition-colors ${
                            style.frameFontWeight === opt.w
                              ? 'border-blue-600 bg-blue-50/70 text-blue-700'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Border Radius */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-700">Border Radius</span>
                      <span className="font-mono text-slate-500 tabular-nums">
                        {style.frameRadius}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={32}
                      step={2}
                      value={style.frameRadius}
                      onChange={(e) => onUpdateStyle({ frameRadius: Number(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </AccordionSection>

            {/* 6. ERROR CORRECTION */}
            <AccordionSection
              id="advanced"
              title="Error Correction"
              subtitle={`Level ${
                style.autoErrorCorrection && style.logoDataUrl ? 'H (Auto)' : style.errorCorrection
              }`}
              icon={ShieldCheck}
              isOpen={openSections.advanced}
              onToggle={toggleSection}
            >
              <label className="flex cursor-pointer items-center justify-between gap-3">
                <span className="text-xs font-medium text-slate-700">
                  Auto-upgrade to Level H with logo
                </span>
                <input
                  type="checkbox"
                  checked={style.autoErrorCorrection}
                  onChange={(e) => onUpdateStyle({ autoErrorCorrection: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                />
              </label>

              <div className="grid grid-cols-2 gap-1.5">
                {EC_OPTIONS.map((opt) => {
                  const effective =
                    style.autoErrorCorrection && style.logoDataUrl
                      ? 'H'
                      : style.errorCorrection;
                  const active = effective === opt.level;
                  const lockedByAuto = style.autoErrorCorrection && Boolean(style.logoDataUrl);
                  return (
                    <button
                      key={opt.level}
                      type="button"
                      onClick={() =>
                        onUpdateStyle({
                          errorCorrection: opt.level,
                          autoErrorCorrection: false,
                        })
                      }
                      className={`flex cursor-pointer flex-col items-start rounded-lg border px-2.5 py-2 text-left transition-colors ${
                        active
                          ? 'border-blue-600 bg-blue-50/70 text-blue-700'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex w-full items-center justify-between">
                        <span className="font-display text-xs font-bold">Level {opt.level}</span>
                        <span className="font-mono text-[11px] tabular-nums">{opt.recovery}</span>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        {lockedByAuto && opt.level === 'H' ? 'Active (Auto)' : opt.note}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onResetStyle}
                  className="flex h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
                  <span>Reset All Style Customizations</span>
                </button>
              </div>
            </AccordionSection>
          </div>
        ) : (
          /* TEMPLATES GALLERY TAB */
          <div className="p-4 space-y-4">
            {/* Category Filter */}
            <div className="flex flex-wrap gap-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setTemplateFilter(cat)}
                  className={`h-7 cursor-pointer rounded-md px-2.5 text-xs font-medium transition-colors whitespace-nowrap ${
                    templateFilter === cat
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* 14 Template Cards */}
            <div className="grid grid-cols-1 gap-2.5">
              {filteredTemplates.map((tpl) => {
                const isSelected = activeTemplateId === tpl.id;
                const [sw1, sw2, sw3] = tpl.previewSwatches;
                const isGradient = tpl.stylePatch.fgMode === 'gradient';
                const previewBg = tpl.stylePatch.bgColor || '#FFFFFF';

                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => onApplyTemplate(tpl)}
                    className={`group flex w-full cursor-pointer items-center gap-3 rounded-xl border p-2.5 text-left transition-colors ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/40'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70'
                    }`}
                  >
                    {/* Visual Mini QR Swatch */}
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-black/10 p-1.5"
                      style={{ backgroundColor: previewBg }}
                    >
                      <div className="grid h-full w-full grid-cols-3 grid-rows-3 gap-0.5">
                        <span
                          className="rounded-[2px]"
                          style={{
                            background: isGradient
                              ? `linear-gradient(135deg, ${sw1}, ${sw3})`
                              : sw1,
                          }}
                        />
                        <span
                          className="rounded-full opacity-75"
                          style={{ backgroundColor: sw1 }}
                        />
                        <span
                          className="rounded-[2px]"
                          style={{
                            background: isGradient
                              ? `linear-gradient(135deg, ${sw1}, ${sw3})`
                              : sw1,
                          }}
                        />
                        <span className="rounded-full" style={{ backgroundColor: sw3 }} />
                        <span
                          className="rounded-[2px]"
                          style={{
                            background: isGradient
                              ? `linear-gradient(135deg, ${sw1}, ${sw3})`
                              : sw1,
                          }}
                        />
                        <span className="rounded-full opacity-60" style={{ backgroundColor: sw1 }} />
                        <span
                          className="rounded-[2px]"
                          style={{
                            background: isGradient
                              ? `linear-gradient(135deg, ${sw1}, ${sw3})`
                              : sw1,
                          }}
                        />
                        <span className="rounded-[2px] opacity-80" style={{ backgroundColor: sw3 }} />
                        <span className="rounded-full" style={{ backgroundColor: sw1 }} />
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-display text-xs font-semibold text-slate-900 truncate">
                          {tpl.name}
                        </span>
                        <span className="text-[11px] text-slate-400 shrink-0">
                          {tpl.category}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] leading-snug text-slate-500 line-clamp-2">
                        {tpl.description}
                      </p>
                      <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-slate-400">
                        <span
                          className="h-2.5 w-2.5 rounded-full border border-black/15"
                          style={{ backgroundColor: sw1 }}
                        />
                        <span
                          className="h-2.5 w-2.5 rounded-full border border-black/15"
                          style={{ backgroundColor: sw2 }}
                        />
                        <span
                          className="h-2.5 w-2.5 rounded-full border border-black/15"
                          style={{ backgroundColor: sw3 }}
                        />
                        <span className="ml-1 capitalize">
                          {tpl.stylePatch.moduleStyle?.replace('-', ' ')}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
