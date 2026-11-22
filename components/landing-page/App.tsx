import React, { useCallback, useEffect, useState } from 'react';
import { BriefBuilder } from './components/BriefBuilder';
import { CodeExportSuite } from './components/CodeExportSuite';
import { PageEditor } from './components/PageEditor';
import { SeoCroWorkbench } from './components/SeoCroWorkbench';
import { StrategyView } from './components/StrategyView';
import { TopNav } from './components/TopNav';
import {
  buildDesignConfigFromBrief,
  INDUSTRY_PRESETS,
  createEmptyBrief,
} from './data/presets';
import type {
  BusinessBrief,
  BusinessUrlAnalysis,
  CroReport,
  CtaSuite,
  DesignConfig,
  GeneratedLandingPage,
  LandingPageStrategy,
  PageSection,
  SeoPackage,
  TokenUsageStats,
  WorkspaceTab,
} from './types/aivora';
import { buildCompleteProjectZip, triggerBlobDownload } from './utils/zipExporter';

interface EditorSnapshot {
  sections: PageSection[];
  design: DesignConfig;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('brief');
  const [brief, setBrief] = useState<BusinessBrief>(() =>
    structuredClone(INDUSTRY_PRESETS[0].brief)
  );
  const [urlAnalysis, setUrlAnalysis] = useState<BusinessUrlAnalysis | null>(null);
  const [strategy, setStrategy] = useState<LandingPageStrategy | null>(null);
  const [generatedPage, setGeneratedPage] = useState<GeneratedLandingPage | null>(null);

  // Undo / Redo history for Editor
  const [history, setHistory] = useState<EditorSnapshot[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [isAnalyzingUrl, setIsAnalyzingUrl] = useState(false);
  const [isBuildingStrategy, setIsBuildingStrategy] = useState(false);
  const [isGeneratingPage, setIsGeneratingPage] = useState(false);
  const [regeneratingSectionId, setRegeneratingSectionId] = useState<string | null>(null);
  const [isReanalyzingSeoCro, setIsReanalyzingSeoCro] = useState(false);
  const [tokenUsage, setTokenUsage] = useState<TokenUsageStats | null>(null);

  function validateBrief(b: BusinessBrief): string[] {
    const missing: string[] = [];
    if (!b.businessName.trim()) missing.push('Business name is required.');
    if (!b.category.trim()) missing.push('Business category is required.');
    if (!b.productName.trim()) missing.push('Product or service name is required.');
    if (b.productDescription.trim().length < 10) {
      missing.push('Product or service description (at least 10 characters) is required.');
    }
    if (b.targetAudience.trim().length < 3) {
      missing.push('Target audience description is required.');
    }
    return missing;
  }

  async function handleAnalyzeUrl(url: string) {
    setErrorBanner(null);
    setIsAnalyzingUrl(true);
    try {
      const res = await fetch('/api/landing-page/analyze-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Website analysis failed.');
      }
      const analysis = data.analysis as BusinessUrlAnalysis;
      setUrlAnalysis(analysis);
      if (data.usage) setTokenUsage(data.usage);

      // Populate empty brief fields conservatively from verified extraction only
      setBrief((prev) => ({
        ...prev,
        category: prev.category || analysis.inferredCategory,
        productDescription: prev.productDescription || analysis.inferredOfferings,
        targetAudience: prev.targetAudience || analysis.inferredAudience,
        toneOfVoice: prev.toneOfVoice || analysis.inferredTone,
        usp: prev.usp || analysis.inferredUsp,
      }));
    } catch (err) {
      setErrorBanner(err instanceof Error ? err.message : 'Unable to analyze website URL.');
    } finally {
      setIsAnalyzingUrl(false);
    }
  }

  async function handleBuildStrategy() {
    const missing = validateBrief(brief);
    setValidationErrors(missing);
    if (missing.length > 0) {
      setActiveTab('brief');
      return;
    }

    setErrorBanner(null);
    setIsBuildingStrategy(true);
    try {
      const res = await fetch('/api/landing-page/generate-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brief),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Strategy generation failed.');
      }
      setStrategy(data.strategy as LandingPageStrategy);
      if (data.usage) setTokenUsage(data.usage);
      setActiveTab('strategy');
    } catch (err) {
      setErrorBanner(
        err instanceof Error ? err.message : 'Failed to build landing page strategy.'
      );
    } finally {
      setIsBuildingStrategy(false);
    }
  }

  async function handleGeneratePage() {
    if (!strategy) return;
    setErrorBanner(null);
    setIsGeneratingPage(true);
    try {
      const res = await fetch('/api/landing-page/generate-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief, strategy }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Landing page generation failed.');
      }

      const design = buildDesignConfigFromBrief(brief);
      const nextPage: GeneratedLandingPage = {
        brief: structuredClone(brief),
        strategy: structuredClone(strategy),
        sections: data.sections as PageSection[],
        ctaSuite: data.ctaSuite as CtaSuite,
        seo: data.seo as SeoPackage,
        cro: data.cro as CroReport,
        design,
        generatedAt: new Date().toISOString(),
      };

      setGeneratedPage(nextPage);
      setHistory([{ sections: nextPage.sections, design: nextPage.design }]);
      setHistoryIndex(0);
      if (data.usage) setTokenUsage(data.usage);
      setActiveTab('editor');
    } catch (err) {
      setErrorBanner(
        err instanceof Error ? err.message : 'Failed to generate landing page.'
      );
    } finally {
      setIsGeneratingPage(false);
    }
  }

  function pushSnapshot(nextSections: PageSection[], nextDesign: DesignConfig) {
    const truncated = history.slice(0, historyIndex + 1);
    const updated = [
      ...truncated,
      { sections: structuredClone(nextSections), design: structuredClone(nextDesign) },
    ].slice(-30);
    setHistory(updated);
    setHistoryIndex(updated.length - 1);
  }

  function handleUpdateSections(sections: PageSection[], record = true) {
    if (!generatedPage) return;
    const updatedPage = { ...generatedPage, sections };
    setGeneratedPage(updatedPage);
    if (record) pushSnapshot(sections, updatedPage.design);
  }

  function handleUpdateDesign(design: DesignConfig, record = true) {
    if (!generatedPage) return;
    const updatedPage = { ...generatedPage, design };
    setGeneratedPage(updatedPage);
    if (record) pushSnapshot(updatedPage.sections, design);
  }

  const handleUndo = useCallback(() => {
    if (!generatedPage || historyIndex <= 0) return;
    const prevIdx = historyIndex - 1;
    const snap = history[prevIdx];
    setGeneratedPage({
      ...generatedPage,
      sections: structuredClone(snap.sections),
      design: structuredClone(snap.design),
    });
    setHistoryIndex(prevIdx);
  }, [generatedPage, history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (!generatedPage || historyIndex >= history.length - 1) return;
    const nextIdx = historyIndex + 1;
    const snap = history[nextIdx];
    setGeneratedPage({
      ...generatedPage,
      sections: structuredClone(snap.sections),
      design: structuredClone(snap.design),
    });
    setHistoryIndex(nextIdx);
  }, [generatedPage, history, historyIndex]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (activeTab !== 'editor') return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeTab, handleUndo, handleRedo]);

  async function handleRegenerateSection(sectionId: string, direction?: string) {
    if (!generatedPage) return;
    const target = generatedPage.sections.find((s) => s.id === sectionId);
    if (!target) return;

    setErrorBanner(null);
    setRegeneratingSectionId(sectionId);
    try {
      const otherSummary = generatedPage.sections
        .filter((s) => s.id !== sectionId && s.enabled)
        .map((s) => `[${s.type}] ${s.headline} — ${s.description}`)
        .join('\n');

      const res = await fetch('/api/landing-page/regenerate-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brief: generatedPage.brief,
          strategy: generatedPage.strategy,
          targetSection: target,
          otherSectionsSummary: otherSummary,
          userDirection: direction,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Section regeneration failed.');
      }
      const nextSections = generatedPage.sections.map((s) =>
        s.id === sectionId ? (data.section as PageSection) : s
      );
      handleUpdateSections(nextSections, true);
      if (data.usage) setTokenUsage(data.usage);
    } catch (err) {
      setErrorBanner(err instanceof Error ? err.message : 'Section regeneration failed.');
    } finally {
      setRegeneratingSectionId(null);
    }
  }

  async function handleReanalyzeSeoCro() {
    if (!generatedPage) return;
    setErrorBanner(null);
    setIsReanalyzingSeoCro(true);
    try {
      const res = await fetch('/api/landing-page/reanalyze-seo-cro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brief: generatedPage.brief,
          strategy: generatedPage.strategy,
          sections: generatedPage.sections,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'SEO/CRO re-audit failed.');
      }
      setGeneratedPage({
        ...generatedPage,
        seo: data.seo as SeoPackage,
        cro: data.cro as CroReport,
      });
      if (data.usage) setTokenUsage(data.usage);
    } catch (err) {
      setErrorBanner(err instanceof Error ? err.message : 'SEO/CRO re-audit failed.');
    } finally {
      setIsReanalyzingSeoCro(false);
    }
  }

  async function handleTopPrimaryAction() {
    if (activeTab === 'brief') {
      await handleBuildStrategy();
    } else if (activeTab === 'strategy') {
      await handleGeneratePage();
    } else if (generatedPage) {
      const blob = await buildCompleteProjectZip(generatedPage);
      const slug =
        generatedPage.brief.businessName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '') || 'aivora-landing-page';
      triggerBlobDownload(blob, `${slug}-aivora-export.zip`);
    }
  }

  return (
    <div className="landing-page-generator-root min-h-screen bg-slate-50 text-slate-900">
      <TopNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        hasStrategy={Boolean(strategy)}
        hasPage={Boolean(generatedPage)}
        isBusy={isBuildingStrategy || isGeneratingPage}
        onPrimaryAction={handleTopPrimaryAction}
      />

      {errorBanner && (
        <div
          role="alert"
          className="mx-auto mt-4 max-w-[1220px] px-6"
        >
          <div className="flex items-center justify-between gap-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900">
            <span>{errorBanner}</span>
            <button
              type="button"
              onClick={() => setErrorBanner(null)}
              className="text-xs font-semibold underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <main>
        {activeTab === 'brief' && (
          <BriefBuilder
            brief={brief}
            onChange={(next) => {
              setBrief(next);
              if (validationErrors.length > 0) {
                setValidationErrors(validateBrief(next));
              }
            }}
            onAnalyzeUrl={handleAnalyzeUrl}
            urlAnalysis={urlAnalysis}
            isAnalyzingUrl={isAnalyzingUrl}
            validationErrors={validationErrors}
            onResetEmpty={() => {
              setBrief(createEmptyBrief());
              setUrlAnalysis(null);
              setValidationErrors([]);
            }}
          />
        )}

        {activeTab === 'strategy' && strategy && (
          <StrategyView
            strategy={strategy}
            onUpdateStrategy={setStrategy}
            onGeneratePage={handleGeneratePage}
            isGeneratingPage={isGeneratingPage}
          />
        )}

        {activeTab === 'editor' && generatedPage && (
          <PageEditor
            page={generatedPage}
            onUpdateSections={handleUpdateSections}
            onUpdateDesign={handleUpdateDesign}
            onRegenerateSection={handleRegenerateSection}
            regeneratingSectionId={regeneratingSectionId}
            canUndo={historyIndex > 0}
            canRedo={historyIndex < history.length - 1}
            onUndo={handleUndo}
            onRedo={handleRedo}
          />
        )}

        {activeTab === 'seo-cro' && generatedPage && (
          <SeoCroWorkbench
            page={generatedPage}
            onReanalyze={handleReanalyzeSeoCro}
            isReanalyzing={isReanalyzingSeoCro}
          />
        )}

        {activeTab === 'export' && generatedPage && (
          <CodeExportSuite page={generatedPage} tokenUsage={tokenUsage} />
        )}
      </main>
    </div>
  );
}
