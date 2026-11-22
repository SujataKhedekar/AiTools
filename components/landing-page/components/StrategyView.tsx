import React from 'react';
import { ArrowDown, ArrowUp, Loader2, Sparkles } from 'lucide-react';
import type { CopywritingFramework, LandingPageStrategy } from '../types/aivora';

interface StrategyViewProps {
  strategy: LandingPageStrategy;
  onUpdateStrategy: (next: LandingPageStrategy) => void;
  onGeneratePage: () => void;
  isGeneratingPage: boolean;
}

const FRAMEWORKS: CopywritingFramework[] = [
  'AIDA',
  'PAS',
  'FAB',
  'Before-After-Bridge',
  'Problem-Solution-Benefit',
];

export function StrategyView({
  strategy,
  onUpdateStrategy,
  onGeneratePage,
  isGeneratingPage,
}: StrategyViewProps) {
  function toggleSection(idx: number) {
    const updated = strategy.recommendedSections.map((s, i) =>
      i === idx ? { ...s, included: !s.included } : s
    );
    onUpdateStrategy({ ...strategy, recommendedSections: updated });
  }

  function moveSection(idx: number, dir: -1 | 1) {
    const target = idx + dir;
    if (target < 0 || target >= strategy.recommendedSections.length) return;
    const copy = [...strategy.recommendedSections];
    const [moved] = copy.splice(idx, 1);
    copy.splice(target, 0, moved);
    onUpdateStrategy({ ...strategy, recommendedSections: copy });
  }

  return (
    <div className="mx-auto max-w-[1220px] px-6 py-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            Conversion Strategy &amp; Narrative Blueprint
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Review positioning, customer objections, copywriting framework, and tailor the section architecture before generating copy.
          </p>
        </div>
        <button
          type="button"
          disabled={isGeneratingPage}
          onClick={onGeneratePage}
          className="inline-flex min-h-[42px] items-center gap-2 rounded-lg bg-blue-700 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
        >
          {isGeneratingPage ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          <span>
            {isGeneratingPage
              ? 'Generating Landing Page...'
              : 'Generate Landing Page & Audit'}
          </span>
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Strategy Analysis */}
        <div className="space-y-6 lg:col-span-7">
          <section className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-slate-950">
                Positioning &amp; Core Message
              </h2>
              <span className="text-xs font-medium text-slate-500">
                Search Intent: {strategy.searchIntent} · Objective: {strategy.conversionObjective}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Primary Message
              </label>
              <textarea
                rows={2}
                value={strategy.primaryMessage}
                onChange={(e) =>
                  onUpdateStrategy({ ...strategy, primaryMessage: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 p-2.5 text-sm font-medium text-slate-900"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 text-sm">
              <div>
                <h3 className="text-xs font-semibold text-slate-500 mb-1">
                  Business Positioning
                </h3>
                <p className="text-slate-700 leading-relaxed">{strategy.businessPositioning}</p>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-slate-500 mb-1">
                  Target Audience Profile
                </h3>
                <p className="text-slate-700 leading-relaxed">{strategy.targetAudienceProfile}</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 text-sm pt-2 border-t border-slate-100">
              <div>
                <h3 className="text-xs font-semibold text-slate-500 mb-1">
                  Unique Selling Proposition
                </h3>
                <p className="text-slate-800">{strategy.uniqueSellingProposition}</p>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-slate-500 mb-1">
                  Competitor Positioning
                </h3>
                <p className="text-slate-700">{strategy.competitorPositioning}</p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-base font-semibold text-slate-950 mb-4">
              Audience Psychology &amp; Value Drivers
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 text-sm">
              <div>
                <h3 className="text-xs font-semibold text-slate-500 mb-2">
                  Customer Pain Points
                </h3>
                <ul className="list-disc pl-4 space-y-1.5 text-slate-700">
                  {strategy.customerProblems.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-slate-500 mb-2">
                  Main Buyer Objections
                </h3>
                <ul className="list-disc pl-4 space-y-1.5 text-slate-700">
                  {strategy.mainObjections.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-slate-500 mb-2">
                  Buying Motivations
                </h3>
                <ul className="list-disc pl-4 space-y-1.5 text-slate-700">
                  {strategy.buyingMotivations.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-slate-500 mb-2">
                  Key Selling Points
                </h3>
                <ul className="list-disc pl-4 space-y-1.5 text-slate-700">
                  {strategy.keySellingPoints.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Framework & Interactive Page Architecture */}
        <div className="space-y-6 lg:col-span-5">
          <section className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
            <h2 className="text-base font-semibold text-slate-950">
              Copywriting &amp; CTA Strategy
            </h2>

            <div>
              <label htmlFor="fw-select" className="block text-xs font-semibold text-slate-600 mb-1">
                Selected Copywriting Framework
              </label>
              <select
                id="fw-select"
                value={strategy.recommendedFramework}
                onChange={(e) =>
                  onUpdateStrategy({
                    ...strategy,
                    recommendedFramework: e.target.value as CopywritingFramework,
                  })
                }
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium"
              >
                {FRAMEWORKS.map((fw) => (
                  <option key={fw} value={fw}>
                    {fw}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-slate-600">{strategy.frameworkRationale}</p>
            </div>

            <div className="border-t border-slate-100 pt-3 text-xs space-y-2">
              <div>
                <span className="font-semibold text-slate-700">CTA Strategy: </span>
                <span className="text-slate-600">{strategy.ctaStrategy}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-700">Recommended Tone: </span>
                <span className="text-slate-600">{strategy.recommendedTone}</span>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-base font-semibold text-slate-950">
              Recommended Page Structure
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Tailored to your business objective. Toggle or reorder sections before generating copy.
            </p>
            <div className="mt-4 divide-y divide-slate-100 border-t border-slate-100">
              {strategy.recommendedSections.map((sec, idx) => (
                <div key={`${sec.type}-${idx}`} className="flex items-start justify-between gap-3 py-3">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sec.included}
                      onChange={() => toggleSection(idx)}
                      className="mt-1"
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {sec.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        {sec.type} · {sec.purpose}
                      </p>
                    </div>
                  </label>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      aria-label={`Move ${sec.title} up`}
                      disabled={idx === 0}
                      onClick={() => moveSection(idx, -1)}
                      className="rounded border border-slate-200 p-1 text-slate-500 hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Move ${sec.title} down`}
                      disabled={idx === strategy.recommendedSections.length - 1}
                      onClick={() => moveSection(idx, 1)}
                      className="rounded border border-slate-200 p-1 text-slate-500 hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
