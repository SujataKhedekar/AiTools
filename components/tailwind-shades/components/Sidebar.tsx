import React, { useMemo, useState } from 'react';
import {
  Bookmark,
  Cpu,
  Home,
  Image as ImageIcon,
  Layers,
  LayoutGrid,
  Palette,
  PenTool,
  Search,
  X,
} from 'lucide-react';
import { SavedPalette, SidebarSection, WorkspaceTab } from '../types/palette';

interface SidebarProps {
  activeSection: SidebarSection;
  onSelectSection: (section: SidebarSection) => void;
  onJumpToTab: (tab: WorkspaceTab) => void;
  savedPalettes: SavedPalette[];
  onLoadPalette: (palette: SavedPalette) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  id: SidebarSection;
  label: string;
  category: 'Navigation' | 'Categories' | 'Active Tool';
  icon: React.ComponentType<{ className?: string }>;
  tileBg: string;
  tileText: string;
  keywords: string[];
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'home',
    label: 'Home',
    category: 'Navigation',
    icon: Home,
    tileBg: 'bg-[#F5F4F0]',
    tileText: 'text-[#5E5D57]',
    keywords: ['dashboard', 'overview', 'start', 'aivora'],
  },
  {
    id: 'all-tools',
    label: 'All Tools',
    category: 'Navigation',
    icon: LayoutGrid,
    tileBg: 'bg-[#F5F4F0]',
    tileText: 'text-[#5E5D57]',
    keywords: ['suite', 'directory', 'catalog', 'tools'],
  },
  {
    id: 'design-tools',
    label: 'Design Tools',
    category: 'Categories',
    icon: PenTool,
    tileBg: 'bg-[#FFFBEB]',
    tileText: 'text-[#D97706]',
    keywords: ['ui', 'ux', 'layout', 'typography', 'tokens'],
  },
  {
    id: 'colour-tools',
    label: 'Colour Tools',
    category: 'Categories',
    icon: Palette,
    tileBg: 'bg-[#ECFEFF]',
    tileText: 'text-[#0891B2]',
    keywords: ['color', 'palette', 'contrast', 'wcag', 'harmony', 'hex'],
  },
  {
    id: 'image-tools',
    label: 'Image Tools',
    category: 'Categories',
    icon: ImageIcon,
    tileBg: 'bg-[#FFF1F2]',
    tileText: 'text-[#E11D48]',
    keywords: ['raster', 'svg', 'compress', 'crop', 'optimize'],
  },
  {
    id: 'ai-tools',
    label: 'AI Tools',
    category: 'Categories',
    icon: Cpu,
    tileBg: 'bg-[#EEF2FF]',
    tileText: 'text-[#4F46E5]',
    keywords: ['automation', 'workflow', 'assist'],
  },
  {
    id: 'tailwind-shade-generator',
    label: 'Tailwind Shade Generator',
    category: 'Active Tool',
    icon: Layers,
    tileBg: 'bg-[#ECFDF5]',
    tileText: 'text-[#059669]',
    keywords: ['tailwind', 'shade', 'scale', '50', '950', 'css', 'generator', 'color'],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSelectSection,
  onJumpToTab,
  savedPalettes,
  onLoadPalette,
  mobileOpen,
  onCloseMobile,
}) => {
  const [query, setQuery] = useState('');

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return NAV_ITEMS;
    return NAV_ITEMS.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.keywords.some((kw) => kw.includes(q))
    );
  }, [query]);

  const navGroup = filteredItems.filter((i) => i.category === 'Navigation');
  const catGroup = filteredItems.filter((i) => i.category === 'Categories');
  const toolGroup = filteredItems.filter((i) => i.category === 'Active Tool');

  const handleNavClick = (section: SidebarSection) => {
    onSelectSection(section);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-[#FFFFFF] border-r border-[#EAE8E1]">
      {/* Brand Lockup */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-[#EAE8E1] shrink-0">
        <button
          type="button"
          onClick={() => handleNavClick('tailwind-shade-generator')}
          className="flex items-center gap-2.5 text-left group"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#181816] text-white group-hover:bg-[#2C2B28] transition-colors">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M12 3L20.5 19H16.2L12 10.9L7.8 19H3.5L12 3Z"
                fill="#FFFFFF"
              />
              <path
                d="M8.8 15.6H15.2L16.7 19H7.3L8.8 15.6Z"
                fill="#A7F3D0"
                fillOpacity="0.95"
              />
            </svg>
          </div>
          <div className="leading-none">
            <span className="block text-[15px] font-bold tracking-tight text-[#171614]">
              Aivora
            </span>
            <span className="block text-[10px] tracking-wide text-[#8C8980] mt-0.5">
              Creative Workspace
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-md text-[#62605A] hover:text-[#171614] hover:bg-[#F5F4F0]"
          aria-label="Close navigation menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Search Tools Input */}
      <div className="px-3.5 pt-3.5 pb-2 shrink-0">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8C8980]"
            aria-hidden="true"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tools..."
            aria-label="Search Aivora tools"
            className="w-full h-9 pl-8.5 pr-8 rounded-lg bg-[#F7F6F2] border border-[#E8E6DF] text-xs text-[#171614] placeholder:text-[#8C8980] focus:bg-white focus:border-[#181816] focus:outline-none transition-colors"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8C8980] hover:text-[#171614]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation Lists */}
      <nav
        aria-label="Aivora tools navigation"
        className="flex-1 overflow-y-auto px-3 py-2 space-y-5"
      >
        {toolGroup.length > 0 && (
          <div>
            <p className="px-2.5 mb-1.5 text-[11px] font-medium text-[#8C8980]">
              Active Tool
            </p>
            <ul className="space-y-1">
              {toolGroup.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg text-[13px] font-semibold transition-colors ${
                        isActive
                          ? 'bg-[#181816] text-[#FFFFFF] shadow-xs'
                          : 'text-[#171614] bg-[#F7F6F2] hover:bg-[#EFECE5] border border-[#E8E6DF]'
                      }`}
                    >
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-md shrink-0 ${
                          isActive
                            ? 'bg-white/15 text-white'
                            : `${item.tileBg} ${item.tileText}`
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="truncate">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {navGroup.length > 0 && (
          <div>
            <p className="px-2.5 mb-1.5 text-[11px] font-medium text-[#8C8980]">
              Workspace
            </p>
            <ul className="space-y-0.5">
              {navGroup.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                        isActive
                          ? 'bg-[#181816] text-[#FFFFFF]'
                          : 'text-[#52504B] hover:text-[#171614] hover:bg-[#F5F4F0]'
                      }`}
                    >
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-md shrink-0 ${
                          isActive
                            ? 'bg-white/15 text-white'
                            : `${item.tileBg} ${item.tileText}`
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="truncate">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {catGroup.length > 0 && (
          <div>
            <p className="px-2.5 mb-1.5 text-[11px] font-medium text-[#8C8980]">
              Categories
            </p>
            <ul className="space-y-0.5">
              {catGroup.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                        isActive
                          ? 'bg-[#181816] text-[#FFFFFF]'
                          : 'text-[#52504B] hover:text-[#171614] hover:bg-[#F5F4F0]'
                      }`}
                    >
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-md shrink-0 ${
                          isActive
                            ? 'bg-white/15 text-white'
                            : `${item.tileBg} ${item.tileText}`
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="truncate">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {filteredItems.length === 0 && (
          <div className="px-3 py-6 text-center text-xs text-[#8C8980]">
            No matching tools for &ldquo;{query}&rdquo;
          </div>
        )}

        {/* Saved Palettes Quick Access */}
        <div className="pt-3 border-t border-[#EFECE5]">
          <div className="flex items-center justify-between px-2.5 mb-2">
            <span className="text-[11px] font-medium text-[#8C8980]">
              Recent Saved ({savedPalettes.length})
            </span>
            {savedPalettes.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  onSelectSection('tailwind-shade-generator');
                  onJumpToTab('saved');
                  onCloseMobile();
                }}
                className="text-[11px] font-medium text-[#0F766E] hover:text-[#115E59]"
              >
                View all
              </button>
            )}
          </div>

          {savedPalettes.length === 0 ? (
            <p className="px-2.5 text-[11px] text-[#8C8980] leading-relaxed">
              Save any generated scale to recall it from local storage.
            </p>
          ) : (
            <ul className="space-y-1">
              {savedPalettes.slice(0, 4).map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onLoadPalette(p);
                      onSelectSection('tailwind-shade-generator');
                      onCloseMobile();
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left hover:bg-[#F5F4F0] transition-colors group"
                  >
                    <span
                      className="h-4 w-4 rounded shrink-0 border border-black/10"
                      style={{ backgroundColor: p.baseHex }}
                    />
                    <span className="flex-1 min-w-0">
                      <span className="block text-xs font-medium text-[#2B2A26] group-hover:text-[#171614] truncate">
                        {p.paletteName}
                      </span>
                      <span className="block font-mono text-[10px] text-[#8C8980] tabular-nums">
                        {p.baseHex}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </nav>

      {/* Quiet Studio Footer Card matching screenshot bottom-left */}
      <div className="p-3 border-t border-[#EAE8E1] shrink-0">
        <div className="px-3 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#EAE8E1] flex items-center justify-between text-[11px]">
          <div className="min-w-0">
            <span className="block font-semibold text-[#171614] truncate">
              Local OKLCH Engine
            </span>
            <span className="block text-[10px] text-[#8C8980] flex items-center gap-1 mt-0.5">
              <Bookmark className="h-2.5 w-2.5 inline" />
              Runs in browser
            </span>
          </div>
          <span className="font-mono text-[11px] font-medium tabular-nums text-[#62605A] shrink-0">
            50–950
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:block w-[248px] shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-[#171614]/35 backdrop-blur-xs"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 w-[264px] max-w-[85vw] h-full shadow-xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
