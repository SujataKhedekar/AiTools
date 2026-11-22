import React, { useEffect, useRef, useState } from 'react';
import {
  Menu,
  RotateCcw,
  Settings,
  Type,
} from 'lucide-react';
import {
  ColourFormat,
  GeneratorSettings,
  TypographySettings,
} from '../types/palette';

interface TopHeaderProps {
  title: string;
  description: string;
  colourFormat: ColourFormat;
  onChangeFormat: (fmt: ColourFormat) => void;
  typography: TypographySettings;
  onChangeTypography: (next: TypographySettings) => void;
  settings: GeneratorSettings;
  onChangeSettings: (next: GeneratorSettings) => void;
  onResetWorkspace: () => void;
  onOpenMobileMenu: () => void;
}

const FORMAT_OPTIONS: { id: ColourFormat; label: string }[] = [
  { id: 'hex', label: 'HEX' },
  { id: 'rgb', label: 'RGB' },
  { id: 'hsl', label: 'HSL' },
  { id: 'oklch', label: 'OKLCH' },
];

export const TopHeader: React.FC<TopHeaderProps> = ({
  title,
  description,
  colourFormat,
  onChangeFormat,
  typography,
  onChangeTypography,
  settings,
  onChangeSettings,
  onResetWorkspace,
  onOpenMobileMenu,
}) => {
  const [openMenu, setOpenMenu] = useState<'typography' | 'settings' | null>(null);
  const menuContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuContainerRef.current &&
        !menuContainerRef.current.contains(e.target as Node)
      ) {
        setOpenMenu(null);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenu(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#FFFFFF]/95 backdrop-blur-sm border-b border-[#EAE8E1] px-4 lg:px-6 flex items-center justify-between gap-4">
      {/* Left: Mobile Menu + Tool Title & Short Description */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Open navigation menu"
          className="lg:hidden flex h-9 w-9 items-center justify-center rounded-lg bg-[#F7F6F2] border border-[#E5E3DC] text-[#52504B] hover:text-[#171614] hover:border-[#D0CDC3] shrink-0"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="min-w-0">
          <h1 className="text-[15px] sm:text-base font-bold tracking-tight text-[#171614] truncate">
            {title}
          </h1>
          <p className="hidden sm:block text-xs text-[#78756C] truncate">
            {description}
          </p>
        </div>
      </div>

      {/* Right: Colour Mode Segmented Switch, Typography & Settings Popovers */}
      <div ref={menuContainerRef} className="relative flex items-center gap-2 shrink-0">
        {/* Format Mode Switch (HEX active by default) */}
        <div
          role="group"
          aria-label="Colour notation mode"
          className="flex items-center p-0.5 rounded-lg bg-[#F5F4F0] border border-[#E5E3DC]"
        >
          {FORMAT_OPTIONS.map((opt) => {
            const active = colourFormat === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChangeFormat(opt.id)}
                className={`px-2.5 py-1.5 rounded-md font-mono text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-[#181816] text-[#FFFFFF] font-semibold shadow-2xs'
                    : 'text-[#62605A] hover:text-[#171614]'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Typography Settings Button */}
        <button
          type="button"
          onClick={() =>
            setOpenMenu((prev) => (prev === 'typography' ? null : 'typography'))
          }
          aria-label="Typography display settings"
          aria-expanded={openMenu === 'typography'}
          className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors shrink-0 ${
            openMenu === 'typography'
              ? 'bg-[#181816] border-[#181816] text-[#FFFFFF]'
              : 'bg-[#FFFFFF] border-[#E5E3DC] text-[#52504B] hover:text-[#171614] hover:bg-[#F7F6F2]'
          }`}
        >
          <Type className="h-4 w-4" />
        </button>

        {/* Generator Settings Button */}
        <button
          type="button"
          onClick={() =>
            setOpenMenu((prev) => (prev === 'settings' ? null : 'settings'))
          }
          aria-label="Generator settings"
          aria-expanded={openMenu === 'settings'}
          className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors shrink-0 ${
            openMenu === 'settings'
              ? 'bg-[#181816] border-[#181816] text-[#FFFFFF]'
              : 'bg-[#FFFFFF] border-[#E5E3DC] text-[#52504B] hover:text-[#171614] hover:bg-[#F7F6F2]'
          }`}
        >
          <Settings className="h-4 w-4" />
        </button>

        {/* Typography Popover */}
        {openMenu === 'typography' && (
          <div className="absolute right-0 top-12 w-72 rounded-xl bg-[#FFFFFF] border border-[#E5E3DC] p-4 shadow-lg shadow-black/8 z-50">
            <h2 className="text-xs font-semibold text-[#171614] mb-3">
              Typography & Density
            </h2>

            <div className="space-y-3.5">
              <div>
                <span className="block text-[11px] text-[#62605A] mb-1.5">
                  Code & HEX Font Size
                </span>
                <div className="grid grid-cols-3 gap-1 p-0.5 rounded-lg bg-[#F5F4F0] border border-[#E5E3DC]">
                  {(['sm', 'md', 'lg'] as const).map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() =>
                        onChangeTypography({ ...typography, codeFontSize: sz })
                      }
                      className={`py-1.5 rounded-md text-xs font-medium transition-colors ${
                        typography.codeFontSize === sz
                          ? 'bg-[#181816] text-[#FFFFFF] font-semibold'
                          : 'text-[#62605A] hover:text-[#171614]'
                      }`}
                    >
                      {sz === 'sm' ? 'Small' : sz === 'md' ? 'Medium' : 'Large'}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center justify-between gap-3 cursor-pointer">
                <span className="text-xs text-[#2B2A26]">Uppercase HEX codes</span>
                <input
                  type="checkbox"
                  checked={typography.uppercaseHex}
                  onChange={(e) =>
                    onChangeTypography({
                      ...typography,
                      uppercaseHex: e.target.checked,
                    })
                  }
                  className="h-4 w-4 accent-[#181816] rounded"
                />
              </label>

              <label className="flex items-center justify-between gap-3 cursor-pointer">
                <span className="text-xs text-[#2B2A26]">Compact shade rows</span>
                <input
                  type="checkbox"
                  checked={typography.compactRows}
                  onChange={(e) =>
                    onChangeTypography({
                      ...typography,
                      compactRows: e.target.checked,
                    })
                  }
                  className="h-4 w-4 accent-[#181816] rounded"
                />
              </label>
            </div>
          </div>
        )}

        {/* Generator Settings Popover */}
        {openMenu === 'settings' && (
          <div className="absolute right-0 top-12 w-76 rounded-xl bg-[#FFFFFF] border border-[#E5E3DC] p-4 shadow-lg shadow-black/8 z-50">
            <h2 className="text-xs font-semibold text-[#171614] mb-3">
              Engine Preferences
            </h2>

            <div className="space-y-3.5">
              <label className="flex items-start justify-between gap-3 cursor-pointer">
                <span>
                  <span className="block text-xs font-medium text-[#171614]">
                    Anchor base colour at 500
                  </span>
                  <span className="block text-[11px] text-[#78756C]">
                    Keeps your exact input HEX on shade 500 in Classic mode
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={settings.anchorBaseAt500}
                  onChange={(e) =>
                    onChangeSettings({
                      ...settings,
                      anchorBaseAt500: e.target.checked,
                    })
                  }
                  className="mt-0.5 h-4 w-4 accent-[#181816] rounded shrink-0"
                />
              </label>

              <label className="flex items-start justify-between gap-3 cursor-pointer">
                <span>
                  <span className="block text-xs font-medium text-[#171614]">
                    sRGB gamut chroma clamping
                  </span>
                  <span className="block text-[11px] text-[#78756C]">
                    Prevents hue shift on bright highlights and deep tones
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={settings.gamutClamp}
                  onChange={(e) =>
                    onChangeSettings({
                      ...settings,
                      gamutClamp: e.target.checked,
                    })
                  }
                  className="mt-0.5 h-4 w-4 accent-[#181816] rounded shrink-0"
                />
              </label>

              <label className="flex items-start justify-between gap-3 cursor-pointer">
                <span>
                  <span className="block text-xs font-medium text-[#171614]">
                    Show WCAG contrast ratios
                  </span>
                  <span className="block text-[11px] text-[#78756C]">
                    Display contrast vs white and dark text on shade rows
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={settings.showContrastBadges}
                  onChange={(e) =>
                    onChangeSettings({
                      ...settings,
                      showContrastBadges: e.target.checked,
                    })
                  }
                  className="mt-0.5 h-4 w-4 accent-[#181816] rounded shrink-0"
                />
              </label>

              <div className="pt-2.5 border-t border-[#EFECE5]">
                <button
                  type="button"
                  onClick={() => {
                    onResetWorkspace();
                    setOpenMenu(null);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-[#F7F6F2] hover:bg-[#EFECE5] border border-[#E5E3DC] text-xs font-medium text-[#171614] transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-[#52504B]" />
                  Reset to Default (#3B82F6)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
