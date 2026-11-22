import { useCallback, useEffect, useRef, useState } from 'react';
import { Code2, Columns2, Eye, X } from 'lucide-react';
import { CodeEditorWorkspace } from './components/CodeEditorWorkspace';
import { ComponentPlanView } from './components/ComponentPlanView';
import { DesignAnalysisPanel } from './components/DesignAnalysisPanel';
import { DesignSystemView } from './components/DesignSystemView';
import { DocumentationView } from './components/DocumentationView';
import { FrameworkControls } from './components/FrameworkControls';
import { ImageInputPanel } from './components/ImageInputPanel';
import { IterativeEditBar } from './components/IterativeEditBar';
import { LivePreviewPane } from './components/LivePreviewPane';
import { TopBar, type WorkspaceSection } from './components/TopBar';
import {
  analyzeDesignApi,
  compilePreviewApi,
  explainComponentApi,
  fixErrorsApi,
  generateCodeApi,
  iterativeEditApi,
  regenerateComponentApi,
} from './lib/apiClient';
import { exportProjectAsZip } from './lib/exportProject';
import { fileToScreenshotInput } from './lib/imageUtils';
import type {
  BrandAssetInput,
  CodeQualityReport,
  ComponentPlanItem,
  DesignAnalysis,
  DesignSystem,
  GeneratedFile,
  GenerationOptions,
  ScreenshotInput,
  TokenUsage,
  VersionSnapshot,
} from './shared/types';
import { MAX_SCREENSHOTS } from './shared/validation';

type RightPaneMode = 'split' | 'preview' | 'code';
type LeftTab = 'input' | 'analysis';

export function App() {
  const [activeSection, setActiveSection] = useState<WorkspaceSection>('workspace');
  const [leftTab, setLeftTab] = useState<LeftTab>('input');
  const [rightMode, setRightMode] = useState<RightPaneMode>('split');

  // Inputs & Configuration
  const [screenshots, setScreenshots] = useState<ScreenshotInput[]>([]);
  const [assets, setAssets] = useState<BrandAssetInput[]>([]);
  const [options, setOptions] = useState<GenerationOptions>({
    framework: 'react_tailwind',
    language: 'typescript',
    styling: 'tailwind',
    architecture: 'component_based',
    multiScreenshotRelation: 'different_pages',
  });

  // Analysis & Design System State
  const [analysis, setAnalysis] = useState<DesignAnalysis | null>(null);
  const [designSystem, setDesignSystem] = useState<DesignSystem | null>(null);
  const [componentPlan, setComponentPlan] = useState<ComponentPlanItem[]>([]);
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(null);

  // Code, Quality, Preview & Versions State
  const [files, setFiles] = useState<GeneratedFile[]>([]);
  const [activeFilePath, setActiveFilePath] = useState<string>('');
  const [qualityReport, setQualityReport] = useState<CodeQualityReport | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [previewErrors, setPreviewErrors] = useState<string[]>([]);
  const [versions, setVersions] = useState<VersionSnapshot[]>([]);

  // Async Status & Notifications
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const compileTimerRef = useRef<number | null>(null);

  // Global clipboard paste support for images (Ctrl+V / Cmd+V)
  useEffect(() => {
    function handlePaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items;
      if (!items) return;
      const imageFiles: File[] = [];
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const f = item.getAsFile();
          if (f) imageFiles.push(f);
        }
      }
      if (imageFiles.length === 0) return;

      e.preventDefault();
      (async () => {
        try {
          const converted: ScreenshotInput[] = [];
          for (const file of imageFiles) {
            converted.push(await fileToScreenshotInput(file, 'Pasted Screenshot'));
          }
          setScreenshots((prev) => {
            const combined = [...prev, ...converted].slice(0, MAX_SCREENSHOTS);
            return combined;
          });
          setStatusNotice(`Pasted ${converted.length} image(s) from clipboard.`);
        } catch (err) {
          setErrorBanner(
            err instanceof Error ? err.message : 'Failed to paste image from clipboard.'
          );
        }
      })();
    }

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const pickPreferredEntryPath = useCallback((nextFiles: GeneratedFile[]): string => {
    const preferred = [
      'src/App.tsx',
      'src/App.jsx',
      'src/app/page.tsx',
      'src/app/page.jsx',
      'src/App.vue',
      'index.html',
    ];
    for (const p of preferred) {
      if (nextFiles.some((f) => f.path === p)) return p;
    }
    return nextFiles[0]?.path ?? '';
  }, []);

  function addTokenUsage(nextUsage: TokenUsage) {
    setTokenUsage((prev) => {
      if (!prev) return nextUsage;
      return {
        promptTokens: prev.promptTokens + nextUsage.promptTokens,
        candidatesTokens: prev.candidatesTokens + nextUsage.candidatesTokens,
        totalTokens: prev.totalTokens + nextUsage.totalTokens,
        model: nextUsage.model,
      };
    });
  }

  function pushVersionSnapshot(
    instruction: string,
    summary: string,
    nextFiles: GeneratedFile[]
  ) {
    setVersions((prev) => [
      ...prev,
      {
        id: `ver-${Date.now()}`,
        timestamp: new Date().toISOString(),
        instruction,
        summary,
        files: nextFiles.map((f) => ({ ...f })),
      },
    ]);
  }

  async function handleAnalyzeOnly(): Promise<{
    analysis: DesignAnalysis;
    designSystem: DesignSystem;
    componentPlan: ComponentPlanItem[];
  } | null> {
    if (screenshots.length === 0) return null;
    setErrorBanner(null);
    setStatusNotice(null);
    setIsAnalyzing(true);
    try {
      const res = await analyzeDesignApi({ screenshots, assets, options });
      setAnalysis(res.analysis);
      setDesignSystem(res.designSystem);
      setComponentPlan(res.componentPlan);
      setTokenUsage(res.tokenUsage);
      setLeftTab('analysis');
      setStatusNotice('Design analysis and design tokens extracted.');
      return {
        analysis: res.analysis,
        designSystem: res.designSystem,
        componentPlan: res.componentPlan,
      };
    } catch (err) {
      setErrorBanner(err instanceof Error ? err.message : 'Design analysis failed.');
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleGenerateFull() {
    if (screenshots.length === 0) return;
    setErrorBanner(null);
    setStatusNotice(null);

    let currentAnalysis = analysis;
    let currentDs = designSystem;
    let currentPlan = componentPlan;

    if (!currentAnalysis || !currentDs) {
      const analyzed = await handleAnalyzeOnly();
      if (!analyzed) return;
      currentAnalysis = analyzed.analysis;
      currentDs = analyzed.designSystem;
      currentPlan = analyzed.componentPlan;
    }

    setIsGenerating(true);
    try {
      const res = await generateCodeApi({
        screenshots,
        assets,
        options,
        analysis: currentAnalysis,
        designSystem: currentDs,
        componentPlan: currentPlan,
      });

      setFiles(res.files);
      setActiveFilePath(pickPreferredEntryPath(res.files));
      setQualityReport(res.qualityReport);
      setPreviewHtml(res.previewHtml);
      setPreviewErrors(res.previewErrors);
      addTokenUsage(res.tokenUsage);
      setVersions([]);
      pushVersionSnapshot(
        `Initial ${options.framework} generation`,
        `Generated ${res.files.length} modular files from ${screenshots.length} screenshot(s).`,
        res.files
      );
      setStatusNotice(`Generated ${res.files.length} modular files and compiled live preview.`);
    } catch (err) {
      setErrorBanner(err instanceof Error ? err.message : 'Code generation failed.');
    } finally {
      setIsGenerating(false);
    }
  }

  const recompilePreview = useCallback(
    async (targetFiles: GeneratedFile[]) => {
      if (targetFiles.length === 0) return;
      setIsCompiling(true);
      try {
        const res = await compilePreviewApi({
          files: targetFiles,
          options,
          assets,
        });
        setPreviewHtml(res.previewHtml);
        setPreviewErrors(res.errors);
        setQualityReport(res.qualityReport);
      } catch (err) {
        setErrorBanner(err instanceof Error ? err.message : 'Preview compilation failed.');
      } finally {
        setIsCompiling(false);
      }
    },
    [options, assets]
  );

  function handleUpdateFileContent(path: string, nextContent: string) {
    setFiles((prev) => {
      const updated = prev.map((f) =>
        f.path === path ? { ...f, content: nextContent } : f
      );
      if (compileTimerRef.current) window.clearTimeout(compileTimerRef.current);
      compileTimerRef.current = window.setTimeout(() => {
        recompilePreview(updated);
      }, 650);
      return updated;
    });
  }

  async function handleIterativeEdit(instruction: string, targetFilePath?: string) {
    if (files.length === 0) return;
    setErrorBanner(null);
    setIsEditing(true);
    try {
      const res = await iterativeEditApi({
        instruction,
        targetFilePath,
        files,
        options,
        designSystem: designSystem ?? undefined,
        assets,
      });
      setFiles(res.files);
      if (res.modifiedPaths.length > 0) {
        setActiveFilePath(res.modifiedPaths[0]);
      }
      setQualityReport(res.qualityReport);
      setPreviewHtml(res.previewHtml);
      setPreviewErrors(res.previewErrors);
      addTokenUsage(res.tokenUsage);
      pushVersionSnapshot(instruction, res.summary, res.files);
      setStatusNotice(res.summary);
    } catch (err) {
      setErrorBanner(err instanceof Error ? err.message : 'Iterative edit failed.');
    } finally {
      setIsEditing(false);
    }
  }

  async function handleRegenerateComponent(filePath: string, instruction?: string) {
    if (files.length === 0) return;
    setErrorBanner(null);
    setIsEditing(true);
    try {
      const res = await regenerateComponentApi({
        filePath,
        instruction,
        files,
        options,
        designSystem: designSystem ?? undefined,
        assets,
      });
      setFiles(res.files);
      setQualityReport(res.qualityReport);
      setPreviewHtml(res.previewHtml);
      setPreviewErrors(res.previewErrors);
      addTokenUsage(res.tokenUsage);
      pushVersionSnapshot(
        instruction || `Regenerate ${filePath}`,
        res.summary,
        res.files
      );
      setStatusNotice(res.summary);
    } catch (err) {
      setErrorBanner(err instanceof Error ? err.message : 'Component regeneration failed.');
    } finally {
      setIsEditing(false);
    }
  }

  async function handleFixErrorsWithAi() {
    if (previewErrors.length === 0 || files.length === 0) return;
    setErrorBanner(null);
    setIsEditing(true);
    try {
      const res = await fixErrorsApi({
        errors: previewErrors,
        files,
        options,
        assets,
      });
      setFiles(res.files);
      setQualityReport(res.qualityReport);
      setPreviewHtml(res.previewHtml);
      setPreviewErrors(res.previewErrors);
      addTokenUsage(res.tokenUsage);
      pushVersionSnapshot('Auto-fix compilation errors', res.summary, res.files);
      setStatusNotice(res.summary);
    } catch (err) {
      setErrorBanner(err instanceof Error ? err.message : 'Auto-fix failed.');
    } finally {
      setIsEditing(false);
    }
  }

  async function handleRestoreVersion(snapshot: VersionSnapshot) {
    setFiles(snapshot.files);
    setActiveFilePath(pickPreferredEntryPath(snapshot.files));
    await recompilePreview(snapshot.files);
    setStatusNotice(`Restored snapshot: "${snapshot.instruction}".`);
  }

  const isBusy = isAnalyzing || isGenerating || isEditing;

  return (
    <div className="image-to-code-root flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <TopBar
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        hasGeneratedFiles={files.length > 0}
        onExportZip={() => exportProjectAsZip({ files, assets, options })}
      />

      {/* Error & Status Feedback Strip */}
      {(errorBanner || statusNotice) && (
        <div className="border-b border-slate-200 bg-white px-5 py-2">
          {errorBanner && (
            <div className="flex items-center justify-between gap-3 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-800">
              <span>{errorBanner}</span>
              <button
                type="button"
                onClick={() => setErrorBanner(null)}
                className="rounded p-0.5 hover:bg-red-100 cursor-pointer"
                aria-label="Dismiss error"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          )}
          {!errorBanner && statusNotice && (
            <div className="flex items-center justify-between gap-3 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs text-blue-900">
              <span>{statusNotice}</span>
              <button
                type="button"
                onClick={() => setStatusNotice(null)}
                className="rounded p-0.5 hover:bg-blue-100 cursor-pointer"
                aria-label="Dismiss notice"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-5">
        {activeSection === 'design-system' && (
          <DesignSystemView designSystem={designSystem} componentPlan={componentPlan} />
        )}

        {activeSection === 'components' && (
          <ComponentPlanView
            componentPlan={componentPlan}
            files={files}
            onOpenFileInWorkspace={(filePath) => {
              setActiveFilePath(filePath);
              setActiveSection('workspace');
              setRightMode((m) => (m === 'preview' ? 'split' : m));
            }}
          />
        )}

        {activeSection === 'documentation' && <DocumentationView />}

        {activeSection === 'workspace' && (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 items-start">
            {/* LEFT SIDE: Image Upload, Framework Controls & Design Analysis */}
            <section
              aria-label="Design input and analysis"
              className="lg:col-span-5 xl:col-span-4 space-y-4"
            >
              <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
                <button
                  type="button"
                  onClick={() => setLeftTab('input')}
                  className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    leftTab === 'input'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Images &amp; Stack
                </button>
                <button
                  type="button"
                  onClick={() => setLeftTab('analysis')}
                  className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    leftTab === 'analysis'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Design Analysis {analysis ? '(Ready)' : ''}
                </button>
              </div>

              {leftTab === 'input' ? (
                <>
                  <ImageInputPanel
                    screenshots={screenshots}
                    assets={assets}
                    multiRelation={options.multiScreenshotRelation}
                    onChangeScreenshots={(next) => {
                      setScreenshots(next);
                      setAnalysis(null);
                    }}
                    onChangeAssets={setAssets}
                    onChangeMultiRelation={(rel) =>
                      setOptions((prev) => ({ ...prev, multiScreenshotRelation: rel }))
                    }
                    onError={setErrorBanner}
                  />

                  <FrameworkControls
                    options={options}
                    onChangeOptions={setOptions}
                    hasScreenshots={screenshots.length > 0}
                    hasAnalysis={analysis !== null}
                    isAnalyzing={isAnalyzing}
                    isGenerating={isGenerating}
                    onAnalyzeOnly={handleAnalyzeOnly}
                    onGenerateFull={handleGenerateFull}
                  />
                </>
              ) : (
                <>
                  <FrameworkControls
                    options={options}
                    onChangeOptions={setOptions}
                    hasScreenshots={screenshots.length > 0}
                    hasAnalysis={analysis !== null}
                    isAnalyzing={isAnalyzing}
                    isGenerating={isGenerating}
                    onAnalyzeOnly={handleAnalyzeOnly}
                    onGenerateFull={handleGenerateFull}
                  />

                  <DesignAnalysisPanel
                    analysis={analysis}
                    qualityReport={qualityReport}
                    tokenUsage={tokenUsage}
                    isAnalyzing={isAnalyzing}
                  />
                </>
              )}
            </section>

            {/* RIGHT SIDE: Live Preview, Live Code Editor & Iterative AI Editing */}
            <section
              aria-label="Generated code and live preview"
              className="lg:col-span-7 xl:col-span-8 space-y-4"
            >
              {/* Right Pane View Mode Switcher */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3.5 py-2">
                <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 p-0.5">
                  <button
                    type="button"
                    onClick={() => setRightMode('split')}
                    className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      rightMode === 'split'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Columns2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Split
                  </button>
                  <button
                    type="button"
                    onClick={() => setRightMode('preview')}
                    className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      rightMode === 'preview'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                    Live Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => setRightMode('code')}
                    className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      rightMode === 'code'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Code2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Code Editor
                  </button>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500 tabular-nums">
                  {files.length > 0 ? (
                    <span>
                      {files.length} files · {versions.length} version
                      {versions.length === 1 ? '' : 's'}
                    </span>
                  ) : (
                    <span>Upload a screenshot to generate responsive code</span>
                  )}
                </div>
              </div>

              {/* Preview & Editor Viewport */}
              {rightMode === 'split' && (
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  <LivePreviewPane
                    previewHtml={previewHtml}
                    previewErrors={previewErrors}
                    isCompiling={isCompiling}
                    isBusy={isBusy}
                    onRefreshPreview={() => recompilePreview(files)}
                    onFixErrorsWithAi={handleFixErrorsWithAi}
                  />
                  <CodeEditorWorkspace
                    files={files}
                    activeFilePath={activeFilePath}
                    onSelectFile={setActiveFilePath}
                    onUpdateFileContent={handleUpdateFileContent}
                    onRegenerateComponent={handleRegenerateComponent}
                    onExplainComponent={(file) =>
                      explainComponentApi({ file, options })
                    }
                    isBusy={isBusy}
                  />
                </div>
              )}

              {rightMode === 'preview' && (
                <LivePreviewPane
                  previewHtml={previewHtml}
                  previewErrors={previewErrors}
                  isCompiling={isCompiling}
                  isBusy={isBusy}
                  onRefreshPreview={() => recompilePreview(files)}
                  onFixErrorsWithAi={handleFixErrorsWithAi}
                />
              )}

              {rightMode === 'code' && (
                <CodeEditorWorkspace
                  files={files}
                  activeFilePath={activeFilePath}
                  onSelectFile={setActiveFilePath}
                  onUpdateFileContent={handleUpdateFileContent}
                  onRegenerateComponent={handleRegenerateComponent}
                  onExplainComponent={(file) => explainComponentApi({ file, options })}
                  isBusy={isBusy}
                />
              )}

              {/* Iterative AI Refinement & Version Diff */}
              <IterativeEditBar
                files={files}
                versions={versions}
                isBusy={isBusy}
                onApplyEdit={handleIterativeEdit}
                onRestoreVersion={handleRestoreVersion}
              />
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
