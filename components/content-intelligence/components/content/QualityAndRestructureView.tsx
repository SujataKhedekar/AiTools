import React, { useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { WRITING_STYLES } from '../../config/contentConfig';
import type {
  ContentAnalysisResponse,
  DocumentSection,
  WritingStyle,
} from '../../types/contentIntelligence';

interface QualityAndRestructureViewProps {
  analysis: ContentAnalysisResponse;
  onRegenerateSection: (
    section: DocumentSection,
    style: WritingStyle
  ) => Promise<void>;
}

export const QualityAndRestructureView: React.FC<QualityAndRestructureViewProps> = ({
  analysis,
  onRegenerateSection,
}) => {
  const { objectiveMetrics: m, qualityReport: q, restructuringRecommendations, recommendedOutline, sections } = analysis;
  const [sectionStyle, setSectionStyle] = useState<WritingStyle>('Human editorial');
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [sectionError, setSectionError] = useState<string | null>(null);

  const handleRegenerate = async (sec: DocumentSection) => {
    setSectionError(null);
    setRegeneratingId(sec.id);
    try {
      await onRegenerateSection(sec, sectionStyle);
    } catch (err) {
      setSectionError(err instanceof Error ? err.message : 'Section regeneration failed.');
    } finally {
      setRegeneratingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* A & B: Readability and Writing Quality */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* A. Readability */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">
              A. Readability Breakdown
            </h3>
            <span className="text-xs text-slate-500">Objective + Editorial</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-slate-500">Objective Flesch Ease</div>
              <div className="mt-1 text-lg font-semibold font-mono tabular-nums text-slate-900">
                {m.fleschReadingEase} / 100
              </div>
              <div className="text-slate-600">{m.readabilityBand}</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-slate-500">Sentence &amp; Paragraph Avg</div>
              <div className="mt-1 text-lg font-semibold font-mono tabular-nums text-slate-900">
                {m.avgSentenceLength}w / {m.avgParagraphLengthWords}w
              </div>
              <div className="text-slate-600 font-mono tabular-nums">
                Range: {m.minSentenceLength}–{m.maxSentenceLength} words
              </div>
            </div>
          </div>

          {m.difficultWordsSample.length > 0 && (
            <div className="text-xs">
              <span className="font-semibold text-slate-800">
                Difficult Vocabulary ({m.difficultWordCount} occurrences · {m.difficultWordRatioPercent}%):{' '}
              </span>
              <span className="text-slate-600 font-mono">
                {m.difficultWordsSample.join(', ')}
              </span>
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
            <div>
              <span className="font-semibold text-slate-800">Editorial Judgment: </span>
              <span className="text-slate-700 leading-relaxed">
                {q.readabilityAssessment.editorialJudgment}
              </span>
            </div>
            <div>
              <span className="font-semibold text-slate-800">Audience Alignment: </span>
              <span className="text-slate-700 leading-relaxed">
                {q.readabilityAssessment.targetAlignment}
              </span>
            </div>
          </div>
        </div>

        {/* B. Writing Quality */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">
              B. Writing Quality &amp; Mechanics
            </h3>
            <span className="text-xs font-medium text-slate-700">
              Clarity: {q.writingQuality.sentenceClarityRating}
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div>
              <span className="font-semibold text-slate-800">Vocabulary Diversity (TTR {(m.typeTokenRatio * 100).toFixed(1)}%): </span>
              <span className="text-slate-700">{q.writingQuality.vocabularyDiversityAssessment}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-800">Repetition &amp; N-Grams: </span>
              <span className="text-slate-700">{q.writingQuality.repetitionAssessment}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-800">Transition Quality: </span>
              <span className="text-slate-700">{q.writingQuality.transitionQualityAssessment}</span>
            </div>
            {q.writingQuality.grammarAndMechanicsNotes.length > 0 && (
              <div>
                <div className="font-semibold text-slate-800 mb-1">
                  Grammar, Spelling &amp; Punctuation Notes:
                </div>
                <ul className="list-disc pl-4 space-y-1 text-slate-700">
                  {q.writingQuality.grammarAndMechanicsNotes.map((note, idx) => (
                    <li key={idx}>{note}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* C & D: Content Quality & SEO Content Quality */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* C. Content Quality */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">
              C. Content Depth &amp; Substance
            </h3>
            <span className="text-xs text-slate-500">AI Editorial Evaluation</span>
          </div>

          <div className="space-y-2.5 text-xs leading-relaxed">
            <div>
              <strong className="text-slate-900">Information Depth: </strong>
              <span className="text-slate-700">{q.contentQuality.informationDepthAssessment}</span>
            </div>
            <div>
              <strong className="text-slate-900">Specificity: </strong>
              <span className="text-slate-700">{q.contentQuality.specificityAssessment}</span>
            </div>
            <div>
              <strong className="text-slate-900">Contextual Relevance: </strong>
              <span className="text-slate-700">{q.contentQuality.contextualRelevanceAssessment}</span>
            </div>
            <div>
              <strong className="text-slate-900">Supporting Examples: </strong>
              <span className="text-slate-700">{q.contentQuality.supportingExamplesAssessment}</span>
            </div>
            <div>
              <strong className="text-slate-900">Factual Clarity: </strong>
              <span className="text-slate-700">{q.contentQuality.factualClarityAssessment}</span>
            </div>
            <div>
              <strong className="text-slate-900">Completeness: </strong>
              <span className="text-slate-700">{q.contentQuality.completenessAssessment}</span>
            </div>
          </div>
        </div>

        {/* D. SEO Content Quality */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">
              D. SEO Content Quality &amp; Metadata
            </h3>
            <span className="text-xs font-medium text-slate-700">
              Stuffing Risk: {q.seoQuality.keywordStuffingRisk}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
            <div>
              <span className="font-semibold text-slate-800">Recommended Meta Title: </span>
              <span className="text-slate-900">{q.seoQuality.recommendedMetaTitle}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-800">Recommended Meta Description: </span>
              <span className="text-slate-700">{q.seoQuality.recommendedMetaDescription}</span>
            </div>
          </div>

          {m.keywordStats.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-1.5 pr-3 font-medium">Keyword</th>
                    <th className="py-1.5 px-2 font-medium text-right">Count</th>
                    <th className="py-1.5 px-2 font-medium text-right">Density</th>
                    <th className="py-1.5 px-2 font-medium">Headings</th>
                    <th className="py-1.5 pl-2 font-medium">Intro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {m.keywordStats.map((k) => (
                    <tr key={k.keyword}>
                      <td className="py-1.5 pr-3 font-medium text-slate-900">
                        {k.keyword}
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono tabular-nums">{k.count}</td>
                      <td className="py-1.5 px-2 text-right font-mono tabular-nums">
                        {k.densityPercent}%
                      </td>
                      <td className="py-1.5 px-2 text-slate-700">
                        {k.inHeadings ? 'Yes' : 'No'}
                      </td>
                      <td className="py-1.5 pl-2 text-slate-700">
                        {k.inFirstParagraph ? 'Yes' : 'No'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="space-y-1.5 text-xs text-slate-700 leading-relaxed pt-1">
            <div>
              <strong className="text-slate-900">Heading Structure: </strong>
              {q.seoQuality.headingStructureAssessment}
            </div>
            <div>
              <strong className="text-slate-900">Search Intent Alignment: </strong>
              {q.seoQuality.searchIntentAlignment}
            </div>
            <div>
              <strong className="text-slate-900">Topic Coverage: </strong>
              {q.seoQuality.topicCoverageAssessment}
            </div>
          </div>
        </div>
      </div>

      {/* Content Restructuring & Per-Section Regeneration */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Content Restructuring &amp; Section Regeneration
            </h3>
            <p className="text-xs text-slate-500">
              Structural diagnostics and one-click section rewrites without overwriting the entire article.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-600">Section rewrite style:</span>
            <select
              value={sectionStyle}
              onChange={(e) => setSectionStyle(e.target.value as WritingStyle)}
              className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-900"
            >
              {WRITING_STYLES.map((st) => (
                <option key={st.value} value={st.value}>
                  {st.value}
                </option>
              ))}
            </select>
          </div>
        </div>

        {sectionError && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
            {sectionError}
          </div>
        )}

        {/* Structural Issues List */}
        {restructuringRecommendations.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {restructuringRecommendations.map((rec) => (
              <div key={rec.id} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/60 space-y-1 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-900">{rec.issueType}</span>
                  <span className="font-mono text-slate-500">{rec.locationLabel}</span>
                </div>
                <p className="text-slate-700 leading-relaxed">{rec.explanation}</p>
                <p className="text-slate-900 font-medium">Recommended fix: {rec.recommendedFix}</p>
              </div>
            ))}
          </div>
        )}

        {/* Recommended Outline */}
        {recommendedOutline.length > 0 && (
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs">
            <div className="font-semibold text-slate-900 mb-2">
              Recommended Section &amp; Paragraph Flow
            </div>
            <ol className="list-decimal pl-5 space-y-1 text-slate-700">
              {recommendedOutline.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>
        )}

        {/* Individual Sections with Regenerate Trigger */}
        <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg">
          {sections.map((sec) => (
            <div key={sec.id} className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="space-y-1 max-w-3xl">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-semibold text-slate-900">
                    {sec.headingLevel > 0 ? `H${sec.headingLevel} · ` : ''}
                    {sec.heading}
                  </span>
                  <span aria-hidden="true" className="text-slate-300">·</span>
                  <span className="font-mono tabular-nums text-slate-500">
                    {sec.wordCount} words · {sec.paragraphs.length} paragraphs
                  </span>
                </div>
                <p className="text-xs text-slate-600 line-clamp-2">
                  {sec.paragraphs[0] || '(Heading section)'}
                </p>
              </div>

              <button
                type="button"
                disabled={regeneratingId === sec.id || sec.paragraphs.length === 0}
                onClick={() => handleRegenerate(sec)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 whitespace-nowrap shrink-0"
              >
                {regeneratingId === sec.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                Regenerate Section
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
