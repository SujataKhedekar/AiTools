import React, { useCallback, useState } from 'react';
import {
  DEFAULT_CONTEXT_PROFILE,
  SAMPLE_PRESETS,
} from './config/contentConfig';
import {
  analyzeContentApi,
  rewriteContentApi,
} from './lib/api/contentClient';
import {
  replacePhraseInText,
  replaceSentenceInText,
} from './lib/text/diffUtils';
import type {
  ContentAnalysisResponse,
  ContextualRewriteProfile,
  CrawledPageExtract,
  DocumentSection,
  PhraseSuggestion,
  RewriteResponse,
  RewriteScope,
  SentenceAnalysisItem,
  WebsiteAuditReport,
  WritingStyle,
} from './types/contentIntelligence';
import { ExportReportModal } from './components/content/ExportReportModal';
import { HumanizerAndDiffView } from './components/content/HumanizerAndDiffView';
import { InputAndContextPanel } from './components/content/InputAndContextPanel';
import { PatternDetectionOverview } from './components/content/PatternDetectionOverview';
import { PhraseReplacementPanel } from './components/content/PhraseReplacementPanel';
import { QualityAndRestructureView } from './components/content/QualityAndRestructureView';
import { SentenceInspectorView } from './components/content/SentenceInspectorView';
import { WebsiteAuditView } from './components/content/WebsiteAuditView';

type WorkspaceTab =
  | 'workbench'
  | 'sentences_phrases'
  | 'humanizer_diff'
  | 'quality_seo'
  | 'site_audit';

export function App() {
  const initialSample = SAMPLE_PRESETS[0];

  const [activeTab, setActiveTab] = useState<WorkspaceTab>('workbench');
  const [originalText, setOriginalText] = useState<string>(initialSample.text);
  const [improvedText, setImprovedText] = useState<string>(initialSample.text);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);

  const [profile, setProfile] = useState<ContextualRewriteProfile>({
    ...DEFAULT_CONTEXT_PROFILE,
    ...initialSample.profile,
    secondaryKeywords:
      initialSample.profile.secondaryKeywords ?? DEFAULT_CONTEXT_PROFILE.secondaryKeywords,
  });

  const [analysis, setAnalysis] = useState<ContentAnalysisResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState('');
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const [appliedSentenceIds, setAppliedSentenceIds] = useState<Set<string>>(new Set());
  const [lastRewriteMeta, setLastRewriteMeta] = useState<RewriteResponse | null>(null);
  const [siteAuditReport, setSiteAuditReport] = useState<WebsiteAuditReport | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [subPanelTab, setSubPanelTab] = useState<'sentences' | 'phrases'>('sentences');

  const handleChangeOriginalText = (next: string) => {
    const wasUntouched = improvedText === originalText;
    setOriginalText(next);
    if (wasUntouched || !improvedText.trim()) {
      setImprovedText(next);
      setUndoStack([]);
      setRedoStack([]);
    }
  };

  const updateImprovedText = useCallback(
    (nextText: string, recordHistory = true) => {
      if (nextText === improvedText) return;
      if (recordHistory) {
        setUndoStack((prev) => [...prev.slice(-24), improvedText]);
        setRedoStack([]);
      }
      setImprovedText(nextText);
    },
    [improvedText]
  );

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, improvedText]);
    setImprovedText(previous);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    setUndoStack((prev) => [...prev, improvedText]);
    setImprovedText(next);
  };

  const handleRestoreOriginal = () => {
    updateImprovedText(originalText, true);
    setAppliedSentenceIds(new Set());
    if (analysis) {
      setAnalysis({
        ...analysis,
        phraseSuggestions: analysis.phraseSuggestions.map((p) => ({
          ...p,
          status: 'pending',
        })),
      });
    }
  };

  const runAnalysisForText = async (targetText: string, targetProfile: ContextualRewriteProfile) => {
    setAnalysisError(null);
    setIsAnalyzing(true);
    setAnalysisStep('Computing programmatic readability & lexical metrics...');
    const stepTimer = setTimeout(() => {
      setAnalysisStep('Evaluating sentence-level patterns, phrases, and SEO alignment...');
    }, 1100);

    try {
      const result = await analyzeContentApi(targetText, targetProfile);
      setAnalysis(result);
      setAppliedSentenceIds(new Set());
      if (!improvedText.trim() || improvedText === originalText) {
        setImprovedText(targetText);
      }
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : 'Content analysis failed.');
    } finally {
      clearTimeout(stepTimer);
      setIsAnalyzing(false);
      setAnalysisStep('');
    }
  };

  const handleRunAnalysis = () => {
    void runAnalysisForText(originalText, profile);
  };

  const handleApplySentenceImprovement = (
    sentence: SentenceAnalysisItem,
    customText?: string
  ) => {
    const replacement = (customText ?? sentence.improvedSentence).trim();
    if (!replacement) return;
    const base = improvedText || originalText;
    const updated = replaceSentenceInText(base, sentence.originalSentence, replacement);
    updateImprovedText(updated, true);
    setAppliedSentenceIds((prev) => new Set(prev).add(sentence.id));
  };

  const handleRewriteSingleSentence = async (
    sentence: SentenceAnalysisItem,
    style: WritingStyle
  ): Promise<string> => {
    const res = await rewriteContentApi({
      originalText,
      targetText: sentence.originalSentence,
      scope: 'sentence',
      style,
      profile,
      preserveKeywords: true,
      preserveEntities: true,
      sentenceIndex: sentence.index,
    });
    return res.rewrittenText;
  };

  const handleAcceptPhrase = (phrase: PhraseSuggestion, chosenReplacement: string) => {
    const base = improvedText || originalText;
    const updated = replacePhraseInText(
      base,
      phrase.contextSnippet,
      phrase.originalPhrase,
      chosenReplacement
    );
    updateImprovedText(updated, true);
    if (analysis) {
      setAnalysis({
        ...analysis,
        phraseSuggestions: analysis.phraseSuggestions.map((item) =>
          item.id === phrase.id
            ? { ...item, recommendedReplacement: chosenReplacement, status: 'accepted' }
            : item
        ),
      });
    }
  };

  const handleRejectPhrase = (phraseId: string) => {
    if (!analysis) return;
    setAnalysis({
      ...analysis,
      phraseSuggestions: analysis.phraseSuggestions.map((item) =>
        item.id === phraseId ? { ...item, status: 'rejected' } : item
      ),
    });
  };

  const handleResetPhraseDecision = (phraseId: string) => {
    if (!analysis) return;
    setAnalysis({
      ...analysis,
      phraseSuggestions: analysis.phraseSuggestions.map((item) =>
        item.id === phraseId ? { ...item, status: 'pending' } : item
      ),
    });
  };

  const handleRunRewrite = async (options: {
    scope: RewriteScope;
    style: WritingStyle;
    targetText: string;
    preserveKeywords: boolean;
    preserveEntities: boolean;
    customInstruction?: string;
    paragraphIndex?: number;
  }): Promise<RewriteResponse> => {
    const res = await rewriteContentApi({
      originalText,
      targetText: options.targetText,
      scope: options.scope,
      style: options.style,
      profile,
      preserveKeywords: options.preserveKeywords,
      preserveEntities: options.preserveEntities,
      customInstruction: options.customInstruction,
      paragraphIndex: options.paragraphIndex,
    });
    setLastRewriteMeta(res);
    return res;
  };

  const handleRegenerateSection = async (
    section: DocumentSection,
    style: WritingStyle
  ) => {
    const sectionText = section.paragraphs.join('\n\n');
    if (!sectionText.trim()) return;
    const res = await rewriteContentApi({
      originalText,
      targetText: sectionText,
      scope: 'selection',
      style,
      profile,
      preserveKeywords: true,
      preserveEntities: true,
      customInstruction: `Rewrite only this section ("${section.heading}") clearly and cohesively without repeating neighboring sections.`,
    });
    const base = improvedText || originalText;
    const next = base.includes(sectionText)
      ? base.replace(sectionText, res.rewrittenText.trim())
      : base;
    updateImprovedText(next, true);
    setLastRewriteMeta(res);
    setActiveTab('humanizer_diff');
  };

  const handleLoadCrawledPage = (page: CrawledPageExtract) => {
    const nextProfile: ContextualRewriteProfile = {
      ...profile,
      documentType: 'website',
    };
    setOriginalText(page.mainContent);
    setImprovedText(page.mainContent);
    setUndoStack([]);
    setRedoStack([]);
    setProfile(nextProfile);
    setActiveTab('workbench');
    void runAnalysisForText(page.mainContent, nextProfile);
  };

  return (
    <div className="content-intelligence-root min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('workbench');
            }}
            className="text-base font-bold tracking-tight text-slate-900 font-display whitespace-nowrap shrink-0"
          >
            AI Content Intelligence
          </a>

          {/* Zone 2: Concise Single-Line Nav Links */}
          <nav
            aria-label="Primary workspace navigation"
            className="hidden md:flex items-center gap-6 text-xs font-medium"
          >
            {(
              [
                ['workbench', 'Workbench'],
                ['sentences_phrases', 'Sentences & Phrases'],
                ['humanizer_diff', 'Side-by-Side Diff'],
                ['quality_seo', 'Quality & SEO'],
                ['site_audit', 'Site Audit'],
              ] as const
            ).map(([tabId, label]) => {
              const isActive = activeTab === tabId;
              return (
                <button
                  key={tabId}
                  type="button"
                  onClick={() => setActiveTab(tabId)}
                  className={`py-4 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'border-slate-900 text-slate-900 font-semibold'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Primary CTA */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsExportOpen(true)}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
            >
              Export Report
            </button>
          </div>
        </div>

        {/* Mobile Nav Strip */}
        <div className="md:hidden border-t border-slate-100 px-4 py-2 flex items-center gap-2 overflow-x-auto text-xs">
          {(
            [
              ['workbench', 'Workbench'],
              ['sentences_phrases', 'Sentences & Phrases'],
              ['humanizer_diff', 'Diff Editor'],
              ['quality_seo', 'Quality & SEO'],
              ['site_audit', 'Site Audit'],
            ] as const
          ).map(([tabId, label]) => (
            <button
              key={tabId}
              type="button"
              onClick={() => setActiveTab(tabId)}
              className={`px-3 py-1.5 rounded-md whitespace-nowrap shrink-0 ${
                activeTab === tabId
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content Container */}
      <main id="top" className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Global Error Banner */}
        {analysisError && (
          <div
            role="alert"
            className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center justify-between gap-4"
          >
            <div>
              <span className="font-semibold">Analysis notice: </span>
              {analysisError}
            </div>
            <button
              type="button"
              onClick={() => setAnalysisError(null)}
              className="text-red-700 font-medium underline shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* TAB 1: WORKBENCH */}
        {activeTab === 'workbench' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display text-balance">
                  Editorial Pattern Detector &amp; Intelligent Humanizer
                </h1>
                <p className="mt-1 text-sm text-slate-600 max-w-3xl">
                  Inspect sentence-level clichés, evaluate contextual phrase replacements, preserve SEO keywords, and refine drafts side by side.
                </p>
              </div>
            </div>

            <InputAndContextPanel
              originalText={originalText}
              onChangeOriginalText={handleChangeOriginalText}
              profile={profile}
              onChangeProfile={setProfile}
              onRunAnalysis={handleRunAnalysis}
              isAnalyzing={isAnalyzing}
              analysisProgressStep={analysisStep}
              onSwitchToSiteAudit={() => setActiveTab('site_audit')}
            />

            {analysis ? (
              <PatternDetectionOverview
                analysis={analysis}
                onOpenSentenceInspector={() => {
                  setSubPanelTab('sentences');
                  setActiveTab('sentences_phrases');
                }}
                onOpenPhrasePanel={() => {
                  setSubPanelTab('phrases');
                  setActiveTab('sentences_phrases');
                }}
                onOpenHumanizer={() => setActiveTab('humanizer_diff')}
              />
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl p-6 text-center space-y-2">
                <h3 className="text-sm font-semibold text-slate-900">
                  Ready for Content Analysis
                </h3>
                <p className="text-xs text-slate-600 max-w-xl mx-auto">
                  Select a test sample, upload a TXT/DOCX file, or paste your own article above and click <strong>Analyze Content</strong> to inspect sentence-level highlights, phrase replacements, readability, and SEO alignment.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SENTENCES & PHRASES */}
        {activeTab === 'sentences_phrases' && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-slate-900 font-display">
                  Sentence-Level Diagnostics &amp; Phrase Replacement
                </h1>
                <p className="text-xs text-slate-600">
                  Inspect individual sentences and accept or reject contextual phrase improvements without altering original copy prematurely.
                </p>
              </div>

              <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setSubPanelTab('sentences')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
                    subPanelTab === 'sentences'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sentence Inspector ({analysis?.sentences.length ?? 0})
                </button>
                <button
                  type="button"
                  onClick={() => setSubPanelTab('phrases')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
                    subPanelTab === 'phrases'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Phrase Replacements ({analysis?.phraseSuggestions.length ?? 0})
                </button>
              </div>
            </div>

            {!analysis ? (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-3">
                <p className="text-sm text-slate-700">
                  Run content analysis from the Workbench to generate sentence-level highlights and phrase suggestions.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('workbench');
                    handleRunAnalysis();
                  }}
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800"
                >
                  Analyze Current Draft Now
                </button>
              </div>
            ) : subPanelTab === 'sentences' ? (
              <SentenceInspectorView
                sentences={analysis.sentences}
                onApplySentenceImprovement={handleApplySentenceImprovement}
                onRewriteSingleSentence={handleRewriteSingleSentence}
                appliedSentenceIds={appliedSentenceIds}
              />
            ) : (
              <PhraseReplacementPanel
                phrases={analysis.phraseSuggestions}
                onAcceptPhrase={handleAcceptPhrase}
                onRejectPhrase={handleRejectPhrase}
                onResetPhraseDecision={handleResetPhraseDecision}
              />
            )}
          </div>
        )}

        {/* TAB 3: HUMANIZER & SIDE-BY-SIDE DIFF */}
        {activeTab === 'humanizer_diff' && (
          <div className="space-y-5">
            <div>
              <h1 className="text-xl font-bold text-slate-900 font-display">
                Humanizer &amp; Original vs. Improved Comparison
              </h1>
              <p className="text-xs text-slate-600">
                Rewrite by sentence, paragraph, selection, or complete article across 11 editorial styles with word-level diffing and SEO keyword tracking.
              </p>
            </div>

            <HumanizerAndDiffView
              originalText={originalText}
              improvedText={improvedText}
              onUpdateImprovedText={updateImprovedText}
              onUndo={handleUndo}
              onRedo={handleRedo}
              canUndo={undoStack.length > 0}
              canRedo={redoStack.length > 0}
              onRestoreOriginal={handleRestoreOriginal}
              onRunRewrite={handleRunRewrite}
              profile={profile}
              sections={analysis?.sections ?? []}
              lastRewriteMeta={lastRewriteMeta}
            />
          </div>
        )}

        {/* TAB 4: QUALITY, SEO & RESTRUCTURING */}
        {activeTab === 'quality_seo' && (
          <div className="space-y-5">
            <div>
              <h1 className="text-xl font-bold text-slate-900 font-display">
                Content Quality, SEO &amp; Structural Audit
              </h1>
              <p className="text-xs text-slate-600">
                Programmatic readability and keyword metrics paired with editorial substance and section-level restructuring.
              </p>
            </div>

            {!analysis ? (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-3">
                <p className="text-sm text-slate-700">
                  Analyze your draft to inspect readability, content depth, SEO alignment, and section restructuring.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('workbench');
                    handleRunAnalysis();
                  }}
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800"
                >
                  Analyze Current Draft Now
                </button>
              </div>
            ) : (
              <QualityAndRestructureView
                analysis={analysis}
                onRegenerateSection={handleRegenerateSection}
              />
            )}
          </div>
        )}

        {/* TAB 5: WEBSITE URL AUDIT */}
        {activeTab === 'site_audit' && (
          <div className="space-y-5">
            <div>
              <h1 className="text-xl font-bold text-slate-900 font-display">
                Website URL Crawler &amp; Cross-Page Content Audit
              </h1>
              <p className="text-xs text-slate-600">
                Extract clean main content from single pages, selected URLs, or full websites while respecting robots.txt and crawl limits.
              </p>
            </div>

            <WebsiteAuditView
              onLoadPageIntoWorkbench={handleLoadCrawledPage}
              auditReport={siteAuditReport}
              onChangeAuditReport={setSiteAuditReport}
            />
          </div>
        )}
      </main>

      {/* Clean Quiet Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-4 sm:px-6 text-xs text-slate-500">
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-2">
          <span>
            AI Content Intelligence – AI Detector &amp; Humanizer
          </span>
          <span>
            Writing-pattern diagnostics are probabilistic and do not establish authorship certainty.
          </span>
        </div>
      </footer>

      <ExportReportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        originalText={originalText}
        improvedText={improvedText}
        analysis={analysis}
      />
    </div>
  );
}

export default App;
