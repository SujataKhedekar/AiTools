import { ArrowRight } from 'lucide-react';
import { NEWSLETTER_TEMPLATES } from '../data/presets';
import { NewsletterTemplate } from '../types/newsletter';
import { ResilientImage } from './ResilientImage';

interface TemplatesViewProps {
  onUseTemplate: (template: NewsletterTemplate) => void;
}

export function TemplatesView({ onUseTemplate }: TemplatesViewProps) {
  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="pb-8 border-b border-neutral-200">
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-neutral-900 [text-wrap:balance]">
          Editorial Templates
        </h1>
        <p className="text-sm text-neutral-500 mt-1.5 max-w-2xl">
          Start a new issue from a proven newsletter structure. Each blueprint configures typography, measure, and starter blocks tailored to its publishing rhythm.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
        {NEWSLETTER_TEMPLATES.map((template) => (
          <article
            key={template.id}
            className="bg-white border border-neutral-200 rounded-lg overflow-hidden flex flex-col"
          >
            <div className="aspect-video bg-neutral-100 border-b border-neutral-200 overflow-hidden">
              <ResilientImage
                src={template.previewImage}
                alt={`${template.name} editorial preview`}
              />
            </div>

            <div className="p-6 flex flex-col flex-1">
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <span>{template.category}</span>
                <span aria-hidden="true">·</span>
                <span>{template.estimatedRead}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">{template.design.maxWidth}px</span>
              </div>

              <h2 className="font-serif text-2xl font-semibold text-neutral-900 tracking-tight mt-2">
                {template.name}
              </h2>

              <p className="text-sm text-neutral-600 leading-relaxed mt-2 flex-1">
                {template.summary}
              </p>

              <div className="pt-5 mt-5 border-t border-neutral-100 flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5" aria-hidden="true">
                  <span
                    className="w-4 h-4 rounded-sm border border-neutral-300"
                    style={{ backgroundColor: template.design.backgroundColor }}
                  />
                  <span
                    className="w-4 h-4 rounded-sm"
                    style={{ backgroundColor: template.design.accentColor }}
                  />
                  <span className="text-xs text-neutral-400 ml-1 capitalize">
                    {template.design.typography.replace('-', ' ')}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onUseTemplate(template)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-neutral-900 text-white text-xs font-medium hover:bg-[#1D4ED8] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Use Template</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
