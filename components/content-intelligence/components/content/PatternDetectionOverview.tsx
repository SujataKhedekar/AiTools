import React from 'react';
import { AlertCircle, CheckCircle2, Info, ShieldAlert } from 'lucide-react';
import type { ContentAnalysisResponse } from '../../types/contentIntelligence';

interface PatternDetectionOverviewProps {
  analysis: ContentAnalysisResponse;
  onOpenSentenceInspector: () => void;
  onOpenPhrasePanel: () => void;
  onOpenHumanizer: () => void;
}

export const PatternDetectionOverview: React.FC<PatternDetectionOverviewProps> = ({
  analysis,
  onOpenSentenceInspector,
  onOpenPhrasePanel,
  onOpenHumanizer,
}) => {
  const { objectiveMetrics: m, detectionAssessment: d, sentences, phraseSuggestions } = analysis;

  const countsBySeverity = {
    red: sentences.filter((s) => s.severity === 'red').length,
    orange: sentences.filter((s) => s.severity === 'orange').length,
    yellow: sentences.filter((s) => s.severity === 'yellow').length,
    green: sentences.filter((s) => s.severity === 'green').length,
  };

  const prevalenceBadgeStyle =
    d.patternPrevalence === 'High'
      ? 'text-red-700 bg-red-50 border-red-200'
      : d.patternPrevalence === 'Elevated'
      ? 'text-amber-700 bg-amber-50 border-amber-200'
      : d.patternPrevalence === 'Moderate'
      ? 'text-slate-700 bg-slate-100 border-slate-200'
      : 'text-emerald-700 bg-emerald-50 border-emerald-200';

  return (
    <div className="space-y-5">
      {/* Objective Measurements Strip */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900">
            Objective Linguistic &amp; Readability Measurements
          </h3>
          <span className="text-xs text-slate-500">
            Calculated deterministically before AI critique
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <div className="text-xs text-slate-500">Words / Reading Time</div>
            <div className="mt-1 text-lg font-semibold text-slate-900 font-mono tabular-nums">
              {m.wordCount.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 font-mono tabular-nums">
              {m.estimatedReadingTimeMinutes} min read
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-500">Avg Sentence Length</div>
            <div className="mt-1 text-lg font-semibold text-slate-900 font-mono tabular-nums">
              {m.avgSentenceLength} w
            </div>
            <div className="text-xs text-slate-500 font-mono tabular-nums">
              StdDev {m.sentenceLengthStdDev} ({m.minSentenceLength}–{m.maxSentenceLength})
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-500">Flesch Reading Ease</div>
            <div className="mt-1 text-lg font-semibold text-slate-900 font-mono tabular-nums">
              {m.fleschReadingEase}
            </div>
            <div className="text-xs text-slate-500 truncate" title={m.readabilityBand}>
              {m.readabilityBand}
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-500">Grade / Fog Index</div>
            <div className="mt-1 text-lg font-semibold text-slate-900 font-mono tabular-nums">
              G{m.fleschKincaidGrade}
            </div>
            <div className="text-xs text-slate-500 font-mono tabular-nums">
              Gunning Fog {m.gunningFogIndex}
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-500">Vocabulary Diversity</div>
            <div className="mt-1 text-lg font-semibold text-slate-900 font-mono tabular-nums">
              {(m.typeTokenRatio * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-slate-500 font-mono tabular-nums">
              {m.difficultWordRatioPercent}% complex words
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-500">Clichés &amp; Transitions</div>
            <div className="mt-1 text-lg font-semibold text-slate-900 font-mono tabular-nums">
              {m.clicheMatches.reduce((acc, c) => acc + c.count, 0)} /{' '}
              {m.transitionMatches.reduce((acc, t) => acc + t.count, 0)}
            </div>
            <div className="text-xs text-slate-500 font-mono tabular-nums">
              {phraseSuggestions.length} phrase reviews
            </div>
          </div>
        </div>
      </div>

      {/* Probabilistic Pattern Assessment */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h3 className="text-sm font-semibold text-slate-900">
                Writing-Pattern Prevalence Assessment
              </h3>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium border rounded-md ${prevalenceBadgeStyle}`}
              >
                {d.patternPrevalence} Pattern Prevalence · {d.confidence} Confidence
              </span>
            </div>
            <p className="mt-1.5 text-xs text-slate-600 max-w-3xl leading-relaxed">
              {d.methodologySummary}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onOpenSentenceInspector}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0"
            >
              Inspect {sentences.length} Sentences
            </button>
            <button
              type="button"
              onClick={onOpenPhrasePanel}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0"
            >
              Review {phraseSuggestions.length} Phrases
            </button>
            <button
              type="button"
              onClick={onOpenHumanizer}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
            >
              Humanize &amp; Rewrite
            </button>
          </div>
        </div>

        {/* Scientific Integrity & Limitations Notice */}
        <div className="mt-4 p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-900">Probabilistic Scope &amp; Limitations: </span>
              {d.limitationsDisclaimer}
            </div>
          </div>
          {d.falsePositiveRiskFactors.length > 0 && (
            <div className="pl-6 text-slate-600">
              <span className="font-medium text-slate-800">False-positive factors noted: </span>
              {d.falsePositiveRiskFactors.join(' · ')}
            </div>
          )}
        </div>

        {/* Sentence Severity Breakdown Bar */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg border border-red-200 bg-red-50/60">
            <div className="flex items-center justify-between text-xs font-medium text-red-800">
              <span>Red: Substantial Edit</span>
              <ShieldAlert className="w-3.5 h-3.5" />
            </div>
            <div className="mt-1 text-xl font-semibold text-red-900 font-mono tabular-nums">
              {countsBySeverity.red}
            </div>
          </div>

          <div className="p-3 rounded-lg border border-orange-200 bg-orange-50/60">
            <div className="flex items-center justify-between text-xs font-medium text-orange-800">
              <span>Orange: Could Improve</span>
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
            <div className="mt-1 text-xl font-semibold text-orange-900 font-mono tabular-nums">
              {countsBySeverity.orange}
            </div>
          </div>

          <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/60">
            <div className="flex items-center justify-between text-xs font-medium text-amber-800">
              <span>Yellow: Minor Polish</span>
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
            <div className="mt-1 text-xl font-semibold text-amber-900 font-mono tabular-nums">
              {countsBySeverity.yellow}
            </div>
          </div>

          <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/60">
            <div className="flex items-center justify-between text-xs font-medium text-emerald-800">
              <span>Green: Clear &amp; Natural</span>
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <div className="mt-1 text-xl font-semibold text-emerald-900 font-mono tabular-nums">
              {countsBySeverity.green}
            </div>
          </div>
        </div>

        {/* Detected Writing Pattern Dimensions */}
        {d.patternFindings.length > 0 && (
          <div className="mt-5">
            <h4 className="text-xs font-semibold text-slate-700 mb-2.5">
              Observed Writing-Pattern Signals
            </h4>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg">
              {d.patternFindings.map((finding) => (
                <div key={finding.id} className="p-3.5 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-semibold text-slate-900">{finding.dimension}</span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span
                        className={
                          finding.signalLevel === 'High'
                            ? 'text-red-700 font-medium'
                            : finding.signalLevel === 'Elevated'
                            ? 'text-amber-700 font-medium'
                            : 'text-slate-600 font-medium'
                        }
                      >
                        {finding.signalLevel} signal
                      </span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span className="text-slate-500">{finding.confidence} confidence</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">{finding.evidenceSummary}</p>
                    <p className="text-[11px] text-slate-500">{finding.limitationNote}</p>
                  </div>

                  {finding.affectedLocations.length > 0 && (
                    <div className="text-[11px] font-mono text-slate-500 shrink-0 sm:text-right">
                      {finding.affectedLocations.slice(0, 3).join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
