import React from 'react';
import { RefreshCw, Upload, Copy, Check, Download, Trash2 } from 'lucide-react';
import {
  BackdropMode,
  BackdropSettings,
  BrushSettings,
  EngineMode,
  ExportFormat,
  MatteSettings,
  NeuralStatus,
  ToolMode,
} from '../types/studio';
import { STUDIO_COLORS, STUDIO_GRADIENTS } from '../data/samples';

interface InspectorPanelProps {
  engineMode: EngineMode;
  onEngineModeChange: (mode: EngineMode) => void;
  neuralStatus: NeuralStatus;
  onRerunNeural: () => void;
  activeTool: ToolMode;
  matte: MatteSettings;
  onMatteChange: (patch: Partial<MatteSettings>) => void;
  brush: BrushSettings;
  onBrushChange: (patch: Partial<BrushSettings>) => void;
  hasManualEdits: boolean;
  onClearManualEdits: () => void;
  backdrop: BackdropSettings;
  onBackdropChange: (patch: Partial<BackdropSettings>) => void;
  onBackdropImageSelect: (file: File) => void;
  exportFormat: ExportFormat;
  onExportFormatChange: (fmt: ExportFormat) => void;
  onCopyImage: () => void;
  copied: boolean;
  onDownloadImage: () => void;
  isExporting: boolean;
}

interface SliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  signed?: boolean;
  onChange: (value: number) => void;
}

const SliderRow: React.FC<SliderRowProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  signed = false,
  onChange,
}) => {
  const formatted = `${signed && value > 0 ? '+' : ''}${value}${unit}`;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[12px]">
        <span className="text-[#C5CBD6] font-medium">{label}</span>
        <span className="font-mono tabular-nums text-[#8F98A8] text-[11px]">{formatted}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        className="studio-slider"
      />
    </div>
  );
};

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  engineMode,
  onEngineModeChange,
  neuralStatus,
  onRerunNeural,
  activeTool,
  matte,
  onMatteChange,
  brush,
  onBrushChange,
  hasManualEdits,
  onClearManualEdits,
  backdrop,
  onBackdropChange,
  onBackdropImageSelect,
  exportFormat,
  onExportFormatChange,
  onCopyImage,
  copied,
  onDownloadImage,
  isExporting,
}) => {
  const backdropFileRef = React.useRef<HTMLInputElement>(null);

  return (
    <aside
      aria-label="Matte and backdrop controls"
      className="w-full lg:w-[320px] shrink-0 border-t lg:border-t-0 lg:border-l border-white/[0.08] bg-[#111318] flex flex-col overflow-hidden"
    >
      <div className="flex-1 overflow-y-auto studio-scroll divide-y divide-white/[0.08]">
        {/* Section 1: Segmentation Engine */}
        <section className="p-5 space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-semibold text-[#F1F3F5]">Cutout Engine</h2>
            {engineMode === 'neural' && (
              <button
                type="button"
                onClick={onRerunNeural}
                disabled={neuralStatus.state === 'loading'}
                className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#8F98A8] hover:text-white disabled:opacity-40 transition-colors cursor-pointer whitespace-nowrap"
              >
                <RefreshCw
                  className={`w-3 h-3 ${neuralStatus.state === 'loading' ? 'animate-spin' : ''}`}
                  aria-hidden="true"
                />
                <span>Re-detect</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-[#0C0D10] border border-white/[0.07]">
            <button
              type="button"
              onClick={() => onEngineModeChange('neural')}
              className={`py-1.5 px-2.5 text-[12px] font-medium rounded-md transition-colors duration-150 whitespace-nowrap cursor-pointer ${
                engineMode === 'neural'
                  ? 'bg-[#2563EB] text-white'
                  : 'text-[#9DA4B0] hover:text-white'
              }`}
            >
              AI Neural
            </button>
            <button
              type="button"
              onClick={() => onEngineModeChange('smart')}
              className={`py-1.5 px-2.5 text-[12px] font-medium rounded-md transition-colors duration-150 whitespace-nowrap cursor-pointer ${
                engineMode === 'smart'
                  ? 'bg-[#2563EB] text-white'
                  : 'text-[#9DA4B0] hover:text-white'
              }`}
            >
              Smart Edge
            </button>
          </div>

          {engineMode === 'neural' ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[12px] text-[#8F98A8]">
                <span className="truncate">{neuralStatus.message}</span>
                {neuralStatus.state === 'ready' && neuralStatus.elapsedMs != null && (
                  <span className="font-mono tabular-nums text-[11px] text-[#6E7787] shrink-0 ml-2">
                    {(neuralStatus.elapsedMs / 1000).toFixed(1)}s
                  </span>
                )}
              </div>
              {neuralStatus.state === 'loading' && (
                <div className="h-1 w-full rounded-full bg-[#1F232C] overflow-hidden">
                  <div
                    className="h-full bg-[#2563EB] transition-all duration-200"
                    style={{ width: `${Math.max(8, neuralStatus.progress)}%` }}
                  />
                </div>
              )}
              {neuralStatus.state === 'error' && (
                <p className="text-[11px] text-amber-400 leading-relaxed">
                  Using instant edge matte fallback. Drag sliders or paint edges to refine in real
                  time.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              <SliderRow
                label="Color Tolerance"
                value={matte.smartTolerance}
                min={6}
                max={80}
                onChange={(smartTolerance) => onMatteChange({ smartTolerance })}
              />
              <SliderRow
                label="Edge Protection"
                value={matte.smartEdgeStrength}
                min={0}
                max={100}
                unit="%"
                onChange={(smartEdgeStrength) => onMatteChange({ smartEdgeStrength })}
              />
            </div>
          )}
        </section>

        {/* Contextual Brush / Wand Controls */}
        {(activeTool === 'erase' || activeTool === 'restore' || activeTool === 'wand') && (
          <section className="p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-[13px] font-semibold text-[#F1F3F5]">
                {activeTool === 'erase'
                  ? 'Erase Brush'
                  : activeTool === 'restore'
                  ? 'Restore Brush'
                  : 'Magic Wand'}
              </h2>
              {hasManualEdits && (
                <button
                  type="button"
                  onClick={onClearManualEdits}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-[#8F98A8] hover:text-white transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Trash2 className="w-3 h-3" aria-hidden="true" />
                  <span>Clear strokes</span>
                </button>
              )}
            </div>

            {activeTool === 'wand' ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-[#0C0D10] border border-white/[0.07]">
                  <button
                    type="button"
                    onClick={() => onBrushChange({ wandMode: 'erase' })}
                    className={`py-1.5 text-[12px] font-medium rounded-md transition-colors cursor-pointer ${
                      brush.wandMode === 'erase'
                        ? 'bg-[#242834] text-white'
                        : 'text-[#9DA4B0] hover:text-white'
                    }`}
                  >
                    Remove Region
                  </button>
                  <button
                    type="button"
                    onClick={() => onBrushChange({ wandMode: 'restore' })}
                    className={`py-1.5 text-[12px] font-medium rounded-md transition-colors cursor-pointer ${
                      brush.wandMode === 'restore'
                        ? 'bg-[#242834] text-white'
                        : 'text-[#9DA4B0] hover:text-white'
                    }`}
                  >
                    Restore Region
                  </button>
                </div>
                <SliderRow
                  label="Wand Tolerance"
                  value={brush.wandTolerance}
                  min={5}
                  max={75}
                  onChange={(wandTolerance) => onBrushChange({ wandTolerance })}
                />
                <p className="text-[11px] text-[#7E8696] leading-relaxed">
                  Click any contiguous color area on the photo to{' '}
                  {brush.wandMode === 'erase' ? 'remove' : 'restore'} it immediately.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <SliderRow
                  label="Brush Size"
                  value={brush.size}
                  min={6}
                  max={160}
                  unit="px"
                  onChange={(size) => onBrushChange({ size })}
                />
                <SliderRow
                  label="Hardness"
                  value={brush.hardness}
                  min={10}
                  max={100}
                  unit="%"
                  onChange={(hardness) => onBrushChange({ hardness })}
                />
              </div>
            )}
          </section>
        )}

        {/* Section 2: Real-Time Matte Refinement */}
        <section className="p-5 space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-semibold text-[#F1F3F5]">Matte Refinement</h2>
            {hasManualEdits && activeTool !== 'erase' && activeTool !== 'restore' && activeTool !== 'wand' && (
              <button
                type="button"
                onClick={onClearManualEdits}
                className="text-[11px] font-medium text-[#8F98A8] hover:text-white transition-colors cursor-pointer whitespace-nowrap"
              >
                Clear brush edits
              </button>
            )}
          </div>

          <div className="space-y-3.5">
            <SliderRow
              label="Edge Threshold"
              value={matte.threshold}
              min={-50}
              max={50}
              signed
              onChange={(threshold) => onMatteChange({ threshold })}
            />
            <SliderRow
              label="Edge Shift"
              value={matte.edgeShift}
              min={-8}
              max={8}
              unit="px"
              signed
              onChange={(edgeShift) => onMatteChange({ edgeShift })}
            />
            <SliderRow
              label="Edge Feather"
              value={matte.feather}
              min={0}
              max={10}
              unit="px"
              onChange={(feather) => onMatteChange({ feather })}
            />
            <SliderRow
              label="Color Decontaminate"
              value={matte.decontaminate}
              min={0}
              max={100}
              unit="%"
              onChange={(decontaminate) => onMatteChange({ decontaminate })}
            />
          </div>
        </section>

        {/* Section 3: Backdrop Studio */}
        <section className="p-5 space-y-4">
          <h2 className="text-[13px] font-semibold text-[#F1F3F5]">Backdrop</h2>

          <div className="grid grid-cols-5 gap-1 p-1 rounded-lg bg-[#0C0D10] border border-white/[0.07]">
            {(
              [
                { id: 'transparent', label: 'None' },
                { id: 'color', label: 'Color' },
                { id: 'gradient', label: 'Grad' },
                { id: 'blur', label: 'Bokeh' },
                { id: 'image', label: 'Photo' },
              ] as { id: BackdropMode; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => onBackdropChange({ mode: tab.id })}
                className={`py-1.5 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  backdrop.mode === tab.id
                    ? 'bg-[#242834] text-white'
                    : 'text-[#8F98A8] hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {backdrop.mode === 'color' && (
            <div className="space-y-3">
              <div className="grid grid-cols-5 gap-2">
                {STUDIO_COLORS.map((swatch) => {
                  const active = backdrop.color.toLowerCase() === swatch.hex.toLowerCase();
                  return (
                    <button
                      key={swatch.hex}
                      type="button"
                      title={swatch.label}
                      aria-label={swatch.label}
                      onClick={() => onBackdropChange({ color: swatch.hex })}
                      className={`h-8 rounded-md border transition-transform duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                        active
                          ? 'border-[#3B82F6] ring-2 ring-[#3B82F6]/40 scale-[1.03]'
                          : 'border-white/[0.14] hover:border-white/[0.35]'
                      }`}
                      style={{ backgroundColor: swatch.hex }}
                    />
                  );
                })}
              </div>
              <label className="flex items-center justify-between text-[12px] text-[#C5CBD6] pt-1">
                <span>Custom Hex</span>
                <span className="inline-flex items-center gap-2">
                  <span className="font-mono tabular-nums text-[11px] text-[#8F98A8] uppercase">
                    {backdrop.color}
                  </span>
                  <input
                    type="color"
                    value={backdrop.color}
                    onChange={(e) => onBackdropChange({ color: e.target.value })}
                    className="w-7 h-7 rounded cursor-pointer bg-transparent border border-white/[0.14]"
                  />
                </span>
              </label>
            </div>
          )}

          {backdrop.mode === 'gradient' && (
            <div className="grid grid-cols-3 gap-2">
              {STUDIO_GRADIENTS.map((grad) => {
                const active = backdrop.gradientId === grad.id;
                return (
                  <button
                    key={grad.id}
                    type="button"
                    title={grad.name}
                    aria-label={grad.name}
                    onClick={() => onBackdropChange({ gradientId: grad.id })}
                    className={`h-11 rounded-md border transition-transform duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                      active
                        ? 'border-[#3B82F6] ring-2 ring-[#3B82F6]/40'
                        : 'border-white/[0.12] hover:border-white/[0.3]'
                    }`}
                    style={{ background: grad.css }}
                  />
                );
              })}
            </div>
          )}

          {backdrop.mode === 'blur' && (
            <div className="space-y-2.5">
              <SliderRow
                label="Lens Blur Radius"
                value={backdrop.blurRadius}
                min={2}
                max={40}
                unit="px"
                onChange={(blurRadius) => onBackdropChange({ blurRadius })}
              />
              <p className="text-[11px] text-[#7E8696] leading-relaxed">
                Keeps the original scene softly defocused behind your sharp cutout subject.
              </p>
            </div>
          )}

          {backdrop.mode === 'image' && (
            <div className="space-y-2.5">
              <input
                ref={backdropFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onBackdropImageSelect(file);
                  e.target.value = '';
                }}
              />
              <button
                type="button"
                onClick={() => backdropFileRef.current?.click()}
                className="w-full py-2.5 px-3 rounded-lg border border-dashed border-white/[0.18] hover:border-[#3B82F6] hover:bg-[#171C28] text-[12px] font-medium text-[#D1D6E0] inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                <span>
                  {backdrop.customImageUrl ? 'Replace Backdrop Photo' : 'Choose Backdrop Photo'}
                </span>
              </button>
            </div>
          )}

          {/* Studio Drop Shadow */}
          <div className="pt-2 border-t border-white/[0.06] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-[#C5CBD6]">Studio Drop Shadow</span>
              <button
                type="button"
                role="switch"
                aria-checked={backdrop.shadowEnabled}
                onClick={() => onBackdropChange({ shadowEnabled: !backdrop.shadowEnabled })}
                className={`w-9 h-5 rounded-full transition-colors duration-150 relative cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  backdrop.shadowEnabled ? 'bg-[#2563EB]' : 'bg-[#262A34]'
                }`}
              >
                <span
                  className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform duration-150 ${
                    backdrop.shadowEnabled ? 'translate-x-[18px]' : 'translate-x-[3px]'
                  }`}
                />
              </button>
            </div>

            {backdrop.shadowEnabled && (
              <div className="space-y-3">
                <SliderRow
                  label="Shadow Opacity"
                  value={backdrop.shadowOpacity}
                  min={5}
                  max={85}
                  unit="%"
                  onChange={(shadowOpacity) => onBackdropChange({ shadowOpacity })}
                />
                <SliderRow
                  label="Shadow Blur"
                  value={backdrop.shadowBlur}
                  min={0}
                  max={60}
                  unit="px"
                  onChange={(shadowBlur) => onBackdropChange({ shadowBlur })}
                />
                <SliderRow
                  label="Vertical Offset"
                  value={backdrop.shadowOffsetY}
                  min={-20}
                  max={48}
                  unit="px"
                  signed
                  onChange={(shadowOffsetY) => onBackdropChange({ shadowOffsetY })}
                />
              </div>
            )}
          </div>
        </section>

        {/* Section 4: Export */}
        <section className="p-5 space-y-3.5">
          <h2 className="text-[13px] font-semibold text-[#F1F3F5]">Export Output</h2>

          <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-[#0C0D10] border border-white/[0.07]">
            {(['png', 'webp', 'jpeg'] as ExportFormat[]).map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => onExportFormatChange(fmt)}
                className={`py-1.5 text-[11px] font-semibold uppercase rounded-md transition-colors cursor-pointer ${
                  exportFormat === fmt
                    ? 'bg-[#242834] text-white'
                    : 'text-[#8F98A8] hover:text-white'
                }`}
              >
                {fmt === 'jpeg' ? 'JPG' : fmt}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onCopyImage}
              className="py-2 px-3 rounded-lg border border-white/[0.12] bg-[#181B22] hover:bg-[#20242E] text-[12px] font-medium text-[#E5E8EE] inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Copy PNG</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onDownloadImage}
              disabled={isExporting}
              className="py-2 px-3 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-[12px] font-semibold text-white inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer disabled:opacity-45"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Download</span>
            </button>
          </div>
        </section>
      </div>
    </aside>
  );
};
