import React, { useState } from 'react';
import { Check, RotateCcw, X } from 'lucide-react';
import type { PhraseSuggestion } from '../../types/contentIntelligence';

interface PhraseReplacementPanelProps {
  phrases: PhraseSuggestion[];
  onAcceptPhrase: (phrase: PhraseSuggestion, chosenReplacement: string) => void;
  onRejectPhrase: (phraseId: string) => void;
  onResetPhraseDecision: (phraseId: string) => void;
}

export const PhraseReplacementPanel: React.FC<PhraseReplacementPanelProps> = ({
  phrases,
  onAcceptPhrase,
  onRejectPhrase,
  onResetPhraseDecision,
}) => {
  const [selectedAlternatives, setSelectedAlternatives] = useState<Record<string, string>>({});

  if (phrases.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
        <h3 className="text-sm font-semibold text-slate-900">
          No Overused Phrases Flagged
        </h3>
        <p className="mt-1 text-xs text-slate-600 max-w-md mx-auto">
          Your draft avoids common boilerplate expressions and hollow transition clichés in the current context.
        </p>
      </div>
    );
  }

  const pendingCount = phrases.filter((p) => p.status === 'pending').length;
  const acceptedCount = phrases.filter((p) => p.status === 'accepted').length;

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Context-Aware Phrase Replacement Engine
          </h3>
          <p className="text-xs text-slate-500">
            Original text stays untouched until you accept individual suggestions.
          </p>
        </div>

        <div className="text-xs font-mono tabular-nums text-slate-600">
          {pendingCount} pending · {acceptedCount} accepted · {phrases.length} total
        </div>
      </div>

      <div className="divide-y divide-slate-200">
        {phrases.map((item) => {
          const chosen = selectedAlternatives[item.id] ?? item.recommendedReplacement;
          const escaped = item.originalPhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const cleanChosen = chosen.startsWith('(') ? '' : chosen;
          const livePreview = item.contextSnippet
            ? cleanChosen
              ? item.contextSnippet.replace(new RegExp(escaped, 'i'), cleanChosen)
              : item.contextSnippet
                  .replace(new RegExp(escaped, 'i'), '')
                  .replace(/\s{2,}/g, ' ')
                  .trim()
            : item.updatedSentencePreview;

          return (
            <div key={item.id} className="p-5 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-mono font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                      “{item.originalPhrase}”
                    </span>
                    <span aria-hidden="true" className="text-slate-300">→</span>
                    <span className="font-mono font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      {chosen}
                    </span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span className="text-slate-500">{item.category}</span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span className="text-slate-500 font-mono tabular-nums">
                      Sentence {item.sentenceIndex + 1}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {item.status === 'pending' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => onAcceptPhrase(item, chosen)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => onRejectPhrase(item.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap"
                      >
                        <X className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-md border ${
                          item.status === 'accepted'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {item.status === 'accepted' ? 'Accepted' : 'Rejected'}
                      </span>
                      <button
                        type="button"
                        onClick={() => onResetPhraseDecision(item.id)}
                        title="Reset suggestion state"
                        className="p-1.5 text-slate-500 hover:text-slate-900 border border-slate-200 rounded-md hover:bg-slate-50"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed">
                <strong className="text-slate-900">Why improve: </strong>
                {item.whyImprove}
              </p>

              {/* Suggested alternatives selector */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-slate-600">Alternatives:</span>
                {Array.from(
                  new Set([item.recommendedReplacement, ...item.suggestedAlternatives])
                ).map((alt) => {
                  const isActive = chosen === alt;
                  return (
                    <button
                      key={alt}
                      type="button"
                      disabled={item.status !== 'pending'}
                      onClick={() =>
                        setSelectedAlternatives((prev) => ({ ...prev, [item.id]: alt }))
                      }
                      className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                        isActive
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      } disabled:opacity-60`}
                    >
                      {alt}
                      {alt === item.recommendedReplacement ? ' (Recommended)' : ''}
                    </button>
                  );
                })}
              </div>

              {/* Updated Sentence Preview */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="font-semibold text-slate-700">Updated Sentence Preview</div>
                <div className="text-slate-900 leading-relaxed">{livePreview}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
