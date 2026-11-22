import React, { useMemo, useState } from 'react';
import { Check, Loader2, Sparkles } from 'lucide-react';
import type {
  SentenceAnalysisItem,
  SentenceSeverity,
  WritingStyle,
} from '../../types/contentIntelligence';
import { WRITING_STYLES } from '../../config/contentConfig';

interface SentenceInspectorViewProps {
  sentences: SentenceAnalysisItem[];
  onApplySentenceImprovement: (sentence: SentenceAnalysisItem, customText?: string) => void;
  onRewriteSingleSentence: (
    sentence: SentenceAnalysisItem,
    style: WritingStyle
  ) => Promise<string>;
  appliedSentenceIds: Set<string>;
}

const SEVERITY_STYLE_MAP: Record<
  SentenceSeverity,
  {
    inline: string;
    activeRing: string;
    labelText: string;
    badge: string;
  }
> = {
  red: {
    inline: 'bg-red-100/80 hover:bg-red-200/80 text-slate-900 border-b-2 border-red-500',
    activeRing: 'ring-2 ring-red-600',
    labelText: 'Red — Needs substantial editing',
    badge: 'bg-red-50 text-red-800 border-red-200',
  },
  orange: {
    inline: 'bg-orange-100/80 hover:bg-orange-200/80 text-slate-900 border-b-2 border-orange-500',
    activeRing: 'ring-2 ring-orange-600',
    labelText: 'Orange — Could be improved',
    badge: 'bg-orange-50 text-orange-800 border-orange-200',
  },
  yellow: {
    inline: 'bg-amber-100/70 hover:bg-amber-200/70 text-slate-900 border-b-2 border-amber-400',
    activeRing: 'ring-2 ring-amber-500',
    labelText: 'Yellow — Minor writing improvement',
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  green: {
    inline: 'bg-emerald-50/70 hover:bg-emerald-100/80 text-slate-900 border-b border-emerald-400',
    activeRing: 'ring-2 ring-emerald-600',
    labelText: 'Green — Clear and natural writing',
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
};

export const SentenceInspectorView: React.FC<SentenceInspectorViewProps> = ({
  sentences,
  onApplySentenceImprovement,
  onRewriteSingleSentence,
  appliedSentenceIds,
}) => {
  const [filter, setFilter] = useState<'all' | SentenceSeverity>('all');
  const [selectedId, setSelectedId] = useState<string>(sentences[0]?.id ?? '');
  const [rewriteStyle, setRewriteStyle] = useState<WritingStyle>('Human editorial');
  const [customDraft, setCustomDraft] = useState<string>('');
  const [isRewriting, setIsRewriting] = useState(false);
  const [rewriteError, setRewriteError] = useState<string | null>(null);

  const filteredSentences = useMemo(() => {
    if (filter === 'all') return sentences;
    return sentences.filter((s) => s.severity === filter);
  }, [sentences, filter]);

  const selectedSentence = useMemo(() => {
    return (
      sentences.find((s) => s.id === selectedId) ??
      filteredSentences[0] ??
      sentences[0] ??
      null
    );
  }, [sentences, filteredSentences, selectedId]);

  const handleSelectSentence = (s: SentenceAnalysisItem) => {
    setSelectedId(s.id);
    setCustomDraft(s.improvedSentence || s.originalSentence);
    setRewriteError(null);
  };

  const handleRunSentenceRewrite = async () => {
    if (!selectedSentence) return;
    setIsRewriting(true);
    setRewriteError(null);
    try {
      const updated = await onRewriteSingleSentence(selectedSentence, rewriteStyle);
      setCustomDraft(updated);
    } catch (err) {
      setRewriteError(err instanceof Error ? err.message : 'Sentence rewrite failed.');
    } finally {
      setIsRewriting(false);
    }
  };

  if (sentences.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-600">
        Run content analysis first to inspect sentence-level diagnostics.
      </div>
    );
  }

  // Group sentences by paragraphIndex for natural reading layout
  const paragraphsMap = new Map<number, SentenceAnalysisItem[]>();
  for (const s of sentences) {
    const arr = paragraphsMap.get(s.paragraphIndex) ?? [];
    arr.push(s);
    paragraphsMap.set(s.paragraphIndex, arr);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* Left Panel: Highlighted Prose */}
      <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Sentence-Level Highlighting
            </h3>
            <p className="text-xs text-slate-500">
              Click any sentence to inspect patterns, alternatives, and caveats.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs">
            {(
              [
                ['all', `All (${sentences.length})`],
                ['red', `Red (${sentences.filter((s) => s.severity === 'red').length})`],
                ['orange', `Orange (${sentences.filter((s) => s.severity === 'orange').length})`],
                ['yellow', `Yellow (${sentences.filter((s) => s.severity === 'yellow').length})`],
                ['green', `Green (${sentences.filter((s) => s.severity === 'green').length})`],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors whitespace-nowrap shrink-0 ${
                  filter === key
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Accessible Legend */}
        <div className="px-5 py-2.5 border-b border-slate-100 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-2 rounded-xs bg-red-200 border border-red-500" />
            Red: Needs substantial editing
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-2 rounded-xs bg-orange-200 border border-orange-500" />
            Orange: Could be improved
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-2 rounded-xs bg-amber-200 border border-amber-400" />
            Yellow: Minor improvement
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-2 rounded-xs bg-emerald-100 border border-emerald-400" />
            Green: Clear and natural
          </span>
        </div>

        <div className="p-5 space-y-4 max-h-[680px] overflow-y-auto text-[15px] leading-relaxed">
          {Array.from(paragraphsMap.entries()).map(([pIdx, paraSentences]) => (
            <p key={pIdx} className="leading-8 text-slate-900">
              {paraSentences.map((s) => {
                const isSelected = selectedSentence?.id === s.id;
                const isDimmed = filter !== 'all' && s.severity !== filter;
                const style = SEVERITY_STYLE_MAP[s.severity];
                return (
                  <React.Fragment key={s.id}>
                    <button
                      type="button"
                      onClick={() => handleSelectSentence(s)}
                      className={`text-left inline rounded px-1 py-0.5 transition-colors cursor-pointer ${
                        style.inline
                      } ${isSelected ? style.activeRing : ''} ${
                        isDimmed ? 'opacity-30' : ''
                      }`}
                    >
                      {s.originalSentence}
                    </button>{' '}
                  </React.Fragment>
                );
              })}
            </p>
          ))}
        </div>
      </div>

      {/* Right Panel: Selected Sentence Detail & Editorial Actions */}
      <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl overflow-hidden lg:sticky lg:top-20">
        {selectedSentence && (
          <div className="p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <span className="text-xs font-mono text-slate-500">
                Sentence {selectedSentence.index + 1} · Paragraph {selectedSentence.paragraphIndex + 1} · {selectedSentence.wordCount} words
              </span>
              <span
                className={`px-2.5 py-0.5 text-xs font-medium border rounded-md ${
                  SEVERITY_STYLE_MAP[selectedSentence.severity].badge
                }`}
              >
                {SEVERITY_STYLE_MAP[selectedSentence.severity].labelText}
              </span>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-700 mb-1">Original Sentence</div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-900 leading-relaxed">
                {selectedSentence.originalSentence}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 text-xs">
              <div>
                <div className="font-semibold text-slate-700">Writing Pattern Identified</div>
                <div className="mt-0.5 text-slate-900">{selectedSentence.patternIdentified}</div>
              </div>

              <div>
                <div className="font-semibold text-slate-700">
                  Why It May Sound Generic or Unnatural
                </div>
                <div className="mt-0.5 text-slate-700 leading-relaxed">
                  {selectedSentence.whyGenericOrUnnatural}
                </div>
              </div>

              {selectedSentence.repetitiveOrVaguePhrases.length > 0 && (
                <div>
                  <div className="font-semibold text-slate-700">Repetitive or Vague Phrases</div>
                  <div className="mt-1 text-slate-800 font-mono">
                    {selectedSentence.repetitiveOrVaguePhrases.join(' · ')}
                  </div>
                </div>
              )}

              {selectedSentence.suggestedImprovements.length > 0 && (
                <div>
                  <div className="font-semibold text-slate-700">Suggested Improvements</div>
                  <ul className="mt-1 list-disc pl-4 space-y-1 text-slate-700">
                    {selectedSentence.suggestedImprovements.map((tip, i) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedSentence.alternativeWordings.length > 0 && (
                <div>
                  <div className="font-semibold text-slate-700">Alternative Wordings</div>
                  <div className="mt-1.5 space-y-1.5">
                    {selectedSentence.alternativeWordings.map((alt, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setCustomDraft(alt)}
                        className="w-full text-left p-2 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs text-slate-800 transition-colors"
                      >
                        {alt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Improved Sentence Editor + Style Rewriter */}
            <div className="pt-3 border-t border-slate-100 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-semibold text-slate-800">
                  Improved Sentence Draft
                </label>
                <span className="text-[11px] text-slate-500">
                  Confidence: {selectedSentence.confidence}
                </span>
              </div>

              <textarea
                rows={3}
                value={
                  customDraft || selectedSentence.improvedSentence || selectedSentence.originalSentence
                }
                onChange={(e) => setCustomDraft(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm text-slate-900 focus:outline-none focus:border-slate-400"
              />

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={rewriteStyle}
                  onChange={(e) => setRewriteStyle(e.target.value as WritingStyle)}
                  className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-800"
                >
                  {WRITING_STYLES.map((st) => (
                    <option key={st.value} value={st.value}>
                      {st.value}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  disabled={isRewriting}
                  onClick={handleRunSentenceRewrite}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50 whitespace-nowrap shrink-0"
                >
                  {isRewriting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  Regenerate
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onApplySentenceImprovement(
                      selectedSentence,
                      customDraft || selectedSentence.improvedSentence
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors ml-auto whitespace-nowrap shrink-0"
                >
                  <Check className="w-3.5 h-3.5" />
                  {appliedSentenceIds.has(selectedSentence.id)
                    ? 'Applied to Improved Draft'
                    : 'Apply to Draft'}
                </button>
              </div>

              {rewriteError && (
                <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md p-2">
                  {rewriteError}
                </div>
              )}

              <div className="text-[11px] text-slate-500 leading-relaxed pt-1">
                <strong className="text-slate-700">Caveat: </strong>
                {selectedSentence.falsePositiveNote}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
