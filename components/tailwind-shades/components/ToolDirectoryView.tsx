import React from 'react';
import {
  ArrowRight,
  Contrast,
  Eye,
  Layers,
  Palette,
  Sliders,
} from 'lucide-react';
import { SidebarSection, WorkspaceTab } from '../types/palette';

interface ToolDirectoryViewProps {
  section: SidebarSection;
  onLaunchShadeGenerator: (tab?: WorkspaceTab) => void;
}

interface ToolCardItem {
  title: string;
  category: SidebarSection[];
  description: string;
  actionLabel: string;
  targetTab: WorkspaceTab;
  icon: React.ComponentType<{ className?: string }>;
  tileBg: string;
  tileText: string;
  featured?: boolean;
}

const SUITE_ITEMS: ToolCardItem[] = [
  {
    title: 'Tailwind Shade Generator',
    category: ['home', 'all-tools', 'colour-tools', 'design-tools'],
    description:
      'Generate perceptually uniform 50–950 Tailwind scales with an interactive curve editor, 5 colour science modes, and instant CSS, Tailwind v4/v3, SCSS, and JSON exports.',
    actionLabel: 'Open',
    targetTab: 'shades',
    icon: Layers,
    tileBg: 'bg-[#EEF2FF]',
    tileText: 'text-[#4F46E5]',
    featured: true,
  },
  {
    title: 'WCAG Contrast & Harmonies',
    category: ['home', 'all-tools', 'colour-tools', 'design-tools'],
    description:
      'Check WCAG 2.1 AA/AAA text contrast across every shade step and explore Complementary, Analogous, Triadic, and Split-Complementary colour schemes.',
    actionLabel: 'Open',
    targetTab: 'harmony',
    icon: Contrast,
    tileBg: 'bg-[#ECFEFF]',
    tileText: 'text-[#0891B2]',
  },
  {
    title: 'Live UI Component Preview',
    category: ['home', 'all-tools', 'design-tools', 'image-tools'],
    description:
      'Preview your active colour scale on navigation bars, cards, buttons, and form inputs across both Light and Dark surfaces in real time.',
    actionLabel: 'Open',
    targetTab: 'preview',
    icon: Eye,
    tileBg: 'bg-[#ECFDF5]',
    tileText: 'text-[#059669]',
  },
  {
    title: 'Tone & Curve Calibration',
    category: ['all-tools', 'colour-tools', 'image-tools', 'ai-tools'],
    description:
      'Adjust colour temperature, chroma saturation, and lightness balance locally in OKLCH space without leaving the browser.',
    actionLabel: 'Open',
    targetTab: 'shades',
    icon: Sliders,
    tileBg: 'bg-[#FFFBEB]',
    tileText: 'text-[#D97706]',
  },
  {
    title: 'Saved Palette Library',
    category: ['home', 'all-tools', 'colour-tools', 'ai-tools'],
    description:
      'Manage your saved brand palettes locally in browser storage, reload previous scales, and copy production CSS tokens instantly.',
    actionLabel: 'Open',
    targetTab: 'saved',
    icon: Palette,
    tileBg: 'bg-[#FFF1F2]',
    tileText: 'text-[#E11D48]',
  },
];

const SECTION_HEADINGS: Record<
  Exclude<SidebarSection, 'tailwind-shade-generator'>,
  { title: string; subtitle: string }
> = {
  home: {
    title: 'Aivora Workspace',
    subtitle: 'Focused local-first developer utilities for design systems and colour engineering.',
  },
  'all-tools': {
    title: 'All Aivora Tools',
    subtitle: 'Explore every active module inside the Aivora Colour & Design suite.',
  },
  'design-tools': {
    title: 'Design Tools',
    subtitle: 'Token scales, live UI surface previews, and accessibility verification.',
  },
  'colour-tools': {
    title: 'Colour Tools',
    subtitle: 'OKLCH shade generation, colour harmonies, and WCAG contrast inspection.',
  },
  'image-tools': {
    title: 'Image & Surface Tools',
    subtitle: 'Visual colour sampling, surface previews, and tonal calibration.',
  },
  'ai-tools': {
    title: 'Workflow & Smart Utilities',
    subtitle: 'Algorithmic palette generation and local design-token management.',
  },
};

export const ToolDirectoryView: React.FC<ToolDirectoryViewProps> = ({
  section,
  onLaunchShadeGenerator,
}) => {
  const meta =
    section === 'tailwind-shade-generator'
      ? SECTION_HEADINGS.home
      : SECTION_HEADINGS[section];

  const visibleItems = SUITE_ITEMS.filter(
    (item) => section === 'all-tools' || item.category.includes(section)
  );

  return (
    <div className="space-y-6">
      {/* Hero Card matching reference screenshot aesthetic */}
      <div className="rounded-2xl bg-[#FFFFFF] border border-[#E8E6DF] shadow-2xs p-6 sm:p-8">
        <p className="text-[11px] font-medium text-[#8C8980] tracking-wide">
          Aivora Workspace
        </p>
        <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-[#171614] text-balance">
          {meta.title}
        </h2>
        <p className="mt-2 text-sm text-[#62605A] max-w-2xl leading-relaxed">
          {meta.subtitle}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => onLaunchShadeGenerator('shades')}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-[#181816] hover:bg-[#2E2D29] text-xs font-semibold text-[#FFFFFF] transition-colors whitespace-nowrap shrink-0"
          >
            Open Tailwind Shade Generator
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onLaunchShadeGenerator('preview')}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-[#FFFFFF] hover:bg-[#F7F6F2] border border-[#E2E0D8] text-xs font-semibold text-[#171614] transition-colors whitespace-nowrap shrink-0"
          >
            Try Live UI Preview
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-[#EFECE5] flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#78756C]">
          <span>5 OKLCH algorithms</span>
          <span aria-hidden="true">·</span>
          <span>6 export formats</span>
          <span aria-hidden="true">·</span>
          <span>Runs locally in your browser</span>
        </div>
      </div>

      {/* Tool Cards Grid matching screenshot "Fresh tools" cards */}
      <div>
        <h3 className="text-sm font-bold text-[#171614] mb-3">
          Studio Modules
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                onClick={() => onLaunchShadeGenerator(item.targetTab)}
                className="rounded-xl bg-[#FFFFFF] border border-[#E8E6DF] hover:border-[#D4D1C7] shadow-2xs p-5 flex flex-col justify-between gap-4 transition-colors cursor-pointer group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-lg ${item.tileBg} ${item.tileText}`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    {item.featured && (
                      <span className="text-[11px] font-medium text-[#0F766E]">
                        Active Tool
                      </span>
                    )}
                  </div>

                  <h4 className="mt-3.5 text-sm font-semibold text-[#171614]">
                    {item.title}
                  </h4>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#62605A]">
                    {item.description}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onLaunchShadeGenerator(item.targetTab);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F766E] group-hover:text-[#115E59] transition-colors self-start"
                >
                  <span>{item.actionLabel}</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
