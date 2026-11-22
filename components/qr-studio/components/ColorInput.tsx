import React, { useEffect, useState } from 'react';
import { hexToRgb, isValidHex, normalizeHex, rgbToHex } from '../utils/colorUtils';

interface ColorInputProps {
  label: string;
  value: string;
  onChange: (hex: string) => void;
  disabled?: boolean;
  showRgbDefault?: boolean;
}

export const ColorInput: React.FC<ColorInputProps> = ({
  label,
  value,
  onChange,
  disabled = false,
  showRgbDefault = false,
}) => {
  const [hexDraft, setHexDraft] = useState(value.toUpperCase());
  const [showRgb, setShowRgb] = useState(showRgbDefault);
  const rgb = hexToRgb(value);

  useEffect(() => {
    setHexDraft(value.toUpperCase());
  }, [value]);

  const handleHexChange = (raw: string) => {
    setHexDraft(raw);
    if (isValidHex(raw)) {
      onChange(normalizeHex(raw, value));
    }
  };

  const handleHexBlur = () => {
    const normalized = normalizeHex(hexDraft, value);
    setHexDraft(normalized);
    if (normalized !== value) {
      onChange(normalized);
    }
  };

  const handleRgbPart = (channel: 'r' | 'g' | 'b', raw: string) => {
    const num = Math.max(0, Math.min(255, parseInt(raw || '0', 10) || 0));
    const next = { ...rgb, [channel]: num };
    onChange(rgbToHex(next.r, next.g, next.b));
  };

  return (
    <div className={`space-y-2 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-700">{label}</span>
        <button
          type="button"
          onClick={() => setShowRgb((v) => !v)}
          className="text-[11px] font-medium text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
        >
          {showRgb ? 'Hide RGB' : 'RGB'}
        </button>
      </div>

      <div className="flex items-center gap-2">
        <label className="relative flex h-9 w-10 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xs">
          <input
            type="color"
            value={normalizeHex(value)}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            disabled={disabled}
            aria-label={`${label} color picker`}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
          <span
            className="h-6 w-7 rounded-sm border border-black/10"
            style={{ backgroundColor: normalizeHex(value) }}
          />
        </label>

        <div className="relative flex-1">
          <input
            type="text"
            value={hexDraft}
            onChange={(e) => handleHexChange(e.target.value)}
            onBlur={handleHexBlur}
            disabled={disabled}
            aria-label={`${label} HEX value`}
            maxLength={7}
            spellCheck={false}
            className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 font-mono text-xs text-slate-900 tabular-nums focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15 transition-colors"
          />
        </div>
      </div>

      {showRgb && (
        <div className="grid grid-cols-3 gap-2 pt-0.5">
          {(['r', 'g', 'b'] as const).map((ch) => (
            <label key={ch} className="flex items-center rounded-md border border-slate-200 bg-slate-50/70 px-2 py-1">
              <span className="mr-1.5 font-mono text-[10px] font-semibold uppercase text-slate-400">
                {ch}
              </span>
              <input
                type="number"
                min={0}
                max={255}
                value={rgb[ch]}
                onChange={(e) => handleRgbPart(ch, e.target.value)}
                disabled={disabled}
                aria-label={`${label} ${ch.toUpperCase()} channel`}
                className="w-full bg-transparent font-mono text-xs text-slate-800 tabular-nums focus:outline-none"
              />
            </label>
          ))}
        </div>
      )}
    </div>
  );
};
