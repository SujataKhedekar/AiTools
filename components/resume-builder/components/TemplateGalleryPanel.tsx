import { useState } from 'react';
import { Check } from 'lucide-react';
import { RESUME_TEMPLATES } from '../data/templates';
import { ResumeDocument, TemplateDefinition, TemplateId } from '../types/resume';
import ResumePreview from './ResumePreview';

interface TemplateGalleryPanelProps {
  resume: ResumeDocument;
  onSelectTemplate: (template: TemplateDefinition) => void;
}

const CATEGORIES = [
  'All',
  'ATS',
  'Modern',
  'Executive',
  'Technical',
  'Creative',
  'Minimal',
  'Academic',
  'Entry-Level',
] as const;

export default function TemplateGalleryPanel({
  resume,
  onSelectTemplate,
}: TemplateGalleryPanelProps) {
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('All');

  const filtered =
    category === 'All'
      ? RESUME_TEMPLATES
      : category === 'ATS'
        ? RESUME_TEMPLATES.filter((t) => t.atsFriendly)
        : RESUME_TEMPLATES.filter((t) => t.category === category);

  const selectedId: TemplateId = resume.design.templateId;

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={`rounded-md px-2.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
              category === cat
                ? 'bg-[#D4A843] font-semibold text-[#0B0E14]'
                : 'bg-[#181D29] text-[#98A2B3] hover:text-white'
            }`}
          >
            {cat === 'ATS' ? 'ATS-Friendly' : cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {filtered.map((tpl) => {
          const isActive = tpl.id === selectedId;
          return (
            <button
              key={tpl.id}
              type="button"
              onClick={() => onSelectTemplate(tpl)}
              className={`group flex flex-col overflow-hidden rounded-lg border text-left transition-colors ${
                isActive
                  ? 'border-[#D4A843] bg-[#161B26]'
                  : 'border-white/[0.08] bg-[#10141D] hover:border-white/[0.2]'
              }`}
            >
              {/* Live Scaled Thumbnail Preview */}
              <div className="relative h-56 w-full overflow-hidden border-b border-white/[0.06] bg-[#1C2230] p-2">
                <div className="pointer-events-none mx-auto w-[198px] overflow-hidden rounded-[2px] shadow-md">
                  <ResumePreview
                    resume={resume}
                    templateOverride={tpl.id}
                    scale={0.25}
                    showPageGuides={false}
                  />
                </div>
                {isActive && (
                  <div className="absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#D4A843] text-[#0B0E14] shadow">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>

              {/* Clean Unboxed Metadata */}
              <div className="p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-sm font-semibold text-white">{tpl.name}</span>
                </div>
                <div className="mt-0.5 text-[11px] text-[#98A2B3]">
                  <span>{tpl.category}</span>
                  <span aria-hidden="true"> · </span>
                  <span className={tpl.atsFriendly ? 'text-emerald-400' : 'text-[#98A2B3]'}>
                    {tpl.atsFriendly ? 'ATS-Friendly' : 'Two-Column Visual'}
                  </span>
                </div>
                <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-[#7E8A9E]">
                  {tpl.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
