import React, { useEffect, useState } from 'react';
import {
  Code2,
  Download,
  Eye,
  FileJson,
  Layers,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { DesignAnalysisView } from './components/DesignAnalysisView';
import { ImageUploadPanel } from './components/ImageUploadPanel';
import { LiquidCodeView } from './components/LiquidCodeView';
import { LivePreviewView } from './components/LivePreviewView';
import { SchemaExplorerView } from './components/SchemaExplorerView';
import { SectionLibraryView } from './components/SectionLibraryView';
import { SAMPLE_DESIGN_PRESETS, type SampleDesignPreset } from './data/samples';
import {
  SECTION_TYPES,
  type GeneratedSectionResult,
  type LiquidValidationResult,
  type SavedSectionEntry,
  type SectionTypeOption,
  type UploadedReferenceImage,
} from './types/shopify';

type TopView = 'builder' | 'preview' | 'schema' | 'library';
type WorkbenchTab = 'analysis' | 'code' | 'preview' | 'schema';

const LIBRARY_STORAGE_KEY = 'aivora_section_library_v1';

function downloadLiquidFile(slug: string, code: string) {
  const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${slug || 'aivora-section'}.liquid`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function App() {
  const [topView, setTopView] = useState<TopView>('builder');
  const [workbenchTab, setWorkbenchTab] = useState<WorkbenchTab>('analysis');

  const [images, setImages] = useState<UploadedReferenceImage[]>([]);
  const [sectionType, setSectionType] = useState<SectionTypeOption>('Auto-Detect from Design');
  const [cssPrefix, setCssPrefix] = useState('aivora');
  const [instructions, setInstructions] = useState('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [generationError, setGenerationError] = useState<string | null>(null);

  const [activeResult, setActiveResult] = useState<GeneratedSectionResult | null>(null);
  const [activeValidation, setActiveValidation] = useState<LiquidValidationResult | null>(null);

  const [isRefining, setIsRefining] = useState(false);
  const [refineError, setRefineError] = useState<string | null>(null);

  const [library, setLibrary] = useState<SavedSectionEntry[]>(() => {
    try {
      if (typeof window === 'undefined') return [];
      const raw = localStorage.getItem(LIBRARY_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as SavedSectionEntry[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(library.slice(0, 20)));
    } catch {
      // Ignore storage quota errors
    }
  }, [library]);

  const handleApplySamplePreset = (
    preset: SampleDesignPreset,
    loadedImage: UploadedReferenceImage
  ) => {
    setImages([loadedImage]);
    const matchedType = SECTION_TYPES.find((t) => t === preset.suggestedSectionType);
    setSectionType(matchedType || 'Auto-Detect from Design');
    setInstructions(preset.suggestedInstructions);
    setGenerationError(null);
  };

  const handleLoadQuickSampleFromEmpty = async (preset: SampleDesignPreset) => {
    try {
      const res = await fetch(preset.imageUrl);
      if (!res.ok) return;
      const blob = await res.blob();
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result || '');
        const commaIdx = dataUrl.indexOf(',');
        const dataBase64 = commaIdx !== -1 ? dataUrl.slice(commaIdx + 1) : '';
        const refImg: UploadedReferenceImage = {
          id: `${Date.now()}`,
          name: `${preset.id}.jpg`,
          mimeType: 'image/jpeg',
          dataBase64,
          previewUrl: dataUrl,
          role: 'Primary Desktop',
          sizeBytes: blob.size,
        };
        handleApplySamplePreset(preset, refImg);
      };
      reader.readAsDataURL(blob);
    } catch {
      // Ignore transient load errors
    }
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (images.length === 0 || isGenerating) return;

    setGenerationError(null);
    setRefineError(null);
    setIsGenerating(true);
    setGenerationStep('Analyzing layout, colors, and typography...');

    const stepTimer1 = setTimeout(() => {
      setGenerationStep('Mapping Shopify Liquid objects and schema blocks...');
    }, 2400);
    const stepTimer2 = setTimeout(() => {
      setGenerationStep('Compiling responsive CSS and validating OS 2.0 schema...');
    }, 5200);

    try {
      const response = await fetch('/api/shopify-section/generate-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: images.map((img) => ({
            name: img.name,
            mimeType: img.mimeType,
            dataBase64: img.dataBase64,
            role: img.role,
          })),
          sectionType,
          instructions,
          cssPrefix,
        }),
      });

      const payload = (await response.json()) as {
        result?: GeneratedSectionResult;
        validation?: LiquidValidationResult;
        error?: string;
      };

      if (!response.ok || !payload.result || !payload.validation) {
        throw new Error(payload.error || 'Failed to generate Shopify Liquid section.');
      }

      setActiveResult(payload.result);
      setActiveValidation(payload.validation);
      setWorkbenchTab('analysis');
      setTopView('builder');

      const entry: SavedSectionEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: new Date().toISOString(),
        result: payload.result,
        validation: payload.validation,
      };
      setLibrary((prev) => [entry, ...prev.slice(0, 19)]);
    } catch (err) {
      setGenerationError(
        err instanceof Error ? err.message : 'Unable to generate Liquid section.'
      );
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  const handleRefine = async (refinementInstruction: string) => {
    if (!activeResult) return;
    setRefineError(null);
    setIsRefining(true);

    try {
      const response = await fetch('/api/shopify-section/refine-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentLiquidCode: activeResult.liquidCode,
          currentSectionName: activeResult.sectionName,
          currentSectionSlug: activeResult.sectionSlug,
          refinementInstruction,
          images: images.slice(0, 3).map((img) => ({
            name: img.name,
            mimeType: img.mimeType,
            dataBase64: img.dataBase64,
            role: img.role,
          })),
        }),
      });

      const payload = (await response.json()) as {
        liquidCode?: string;
        merchantNotes?: string[];
        validation?: LiquidValidationResult;
        error?: string;
      };

      if (!response.ok || !payload.liquidCode || !payload.validation) {
        throw new Error(payload.error || 'Failed to refine section.');
      }

      const updatedResult: GeneratedSectionResult = {
        ...activeResult,
        liquidCode: payload.liquidCode,
        merchantNotes: payload.merchantNotes || activeResult.merchantNotes,
      };
      setActiveResult(updatedResult);
      setActiveValidation(payload.validation);
    } catch (err) {
      setRefineError(err instanceof Error ? err.message : 'Refinement request failed.');
    } finally {
      setIsRefining(false);
    }
  };

  const handleTopNavClick = (view: TopView) => {
    setTopView(view);
    if (view === 'preview') setWorkbenchTab('preview');
    else if (view === 'schema') setWorkbenchTab('schema');
    else if (view === 'builder' && (workbenchTab === 'preview' || workbenchTab === 'schema')) {
      setWorkbenchTab('code');
    }
  };

  const handlePrimaryHeaderAction = () => {
    if (activeResult) {
      downloadLiquidFile(activeResult.sectionSlug, activeResult.liquidCode);
    } else {
      void handleLoadQuickSampleFromEmpty(SAMPLE_DESIGN_PRESETS[0]);
      setTopView('builder');
    }
  };

  return (
    <div className="shopify-section-root min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-8 px-6 py-3.5">
          {/* Zone 1: Single-element brand wordmark */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setTopView('builder');
            }}
            className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            Aivora
          </a>

          {/* Zone 2: 4 single-line nav links */}
          <nav
            aria-label="Primary workspace navigation"
            className="hidden md:flex items-center gap-6 text-sm font-medium"
          >
            <button
              type="button"
              onClick={() => handleTopNavClick('builder')}
              className={`border-b-2 py-1 transition-colors whitespace-nowrap shrink-0 ${
                topView === 'builder'
                  ? 'border-teal-600 text-slate-900'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Builder
            </button>
            <button
              type="button"
              onClick={() => handleTopNavClick('preview')}
              className={`border-b-2 py-1 transition-colors whitespace-nowrap shrink-0 ${
                topView === 'preview'
                  ? 'border-teal-600 text-slate-900'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Live Preview
            </button>
            <button
              type="button"
              onClick={() => handleTopNavClick('schema')}
              className={`border-b-2 py-1 transition-colors whitespace-nowrap shrink-0 ${
                topView === 'schema'
                  ? 'border-teal-600 text-slate-900'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Schema
            </button>
            <button
              type="button"
              onClick={() => handleTopNavClick('library')}
              className={`border-b-2 py-1 transition-colors whitespace-nowrap shrink-0 ${
                topView === 'library'
                  ? 'border-teal-600 text-slate-900'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Library
            </button>
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={handlePrimaryHeaderAction}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-slate-800 whitespace-nowrap shrink-0"
            >
              {activeResult ? (
                <>
                  <Download className="h-3.5 w-3.5" />
                  Export .liquid
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  Try Sample
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Bar */}
      <div className="flex items-center justify-around border-b border-slate-200 bg-white px-4 py-2 md:hidden">
        {(['builder', 'preview', 'schema', 'library'] as TopView[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => handleTopNavClick(tab)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize whitespace-nowrap shrink-0 ${
              topView === tab
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab === 'preview' ? 'Preview' : tab}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6">
        {topView === 'library' ? (
          <SectionLibraryView
            entries={library}
            onLoadEntry={(entry) => {
              setActiveResult(entry.result);
              setActiveValidation(entry.validation);
              setTopView('builder');
              setWorkbenchTab('code');
            }}
            onDeleteEntry={(id) =>
              setLibrary((prev) => prev.filter((item) => item.id !== id))
            }
            onDownloadEntry={(entry) =>
              downloadLiquidFile(entry.result.sectionSlug, entry.result.liquidCode)
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
            {/* Left Studio Control Rail */}
            <aside className="rounded-xl border border-slate-200 bg-white p-5 lg:sticky lg:top-[76px] lg:col-span-4 xl:col-span-4">
              <form onSubmit={handleGenerate} className="space-y-5">
                <ImageUploadPanel
                  images={images}
                  onChangeImages={setImages}
                  onApplySamplePreset={handleApplySamplePreset}
                />

                <div className="space-y-4 border-t border-slate-200 pt-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="sm:col-span-2">
                      <label
                        htmlFor="section-type-select"
                        className="block text-xs font-semibold text-slate-800"
                      >
                        Section Pattern
                      </label>
                      <select
                        id="section-type-select"
                        value={sectionType}
                        onChange={(e) =>
                          setSectionType(e.target.value as SectionTypeOption)
                        }
                        className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                      >
                        {SECTION_TYPES.map((typeOption) => (
                          <option key={typeOption} value={typeOption}>
                            {typeOption}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="css-prefix-input"
                        className="block text-xs font-semibold text-slate-800"
                      >
                        CSS Prefix
                      </label>
                      <input
                        id="css-prefix-input"
                        type="text"
                        value={cssPrefix}
                        onChange={(e) => setCssPrefix(e.target.value)}
                        placeholder="aivora"
                        className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-800 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="additional-instructions"
                      className="block text-xs font-semibold text-slate-800"
                    >
                      Functionality & Theme Editor Instructions
                    </label>
                    <textarea
                      id="additional-instructions"
                      rows={4}
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      placeholder="Describe merchant settings, repeatable blocks, mobile layout, or interactive features (e.g., 4-column desktop grid collapsing to 2 columns on mobile, color swatches, quick-add button)..."
                      className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs leading-relaxed text-slate-800 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                    />
                  </div>
                </div>

                {generationError && (
                  <div
                    role="alert"
                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs leading-relaxed text-red-700"
                  >
                    {generationError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={images.length === 0 || isGenerating}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating Liquid Section...
                    </>
                  ) : (
                    <>
                      <Code2 className="h-4 w-4" />
                      Generate Liquid Section
                    </>
                  )}
                </button>

                {isGenerating && generationStep && (
                  <p className="text-center text-xs text-slate-500">{generationStep}</p>
                )}
              </form>
            </aside>

            {/* Right Main Output Workbench */}
            <section className="min-w-0 lg:col-span-8 xl:col-span-8">
              {isGenerating && !activeResult ? (
                <div className="rounded-xl border border-slate-200 bg-white p-10">
                  <div className="mx-auto max-w-md space-y-4 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-teal-700" />
                    <h2 className="text-base font-semibold text-slate-900">
                      Building Shopify Online Store 2.0 Section
                    </h2>
                    <p className="text-sm text-slate-600">
                      {generationStep || 'Analyzing reference design...'}
                    </p>
                  </div>
                </div>
              ) : !activeResult || !activeValidation ? (
                /* Crisp Studio Empty State */
                <div className="space-y-6">
                  <div className="rounded-xl border border-slate-200 bg-white p-8">
                    <h1 className="max-w-2xl text-2xl font-bold tracking-tight text-slate-900 [text-wrap:balance] sm:text-3xl">
                      Turn any ecommerce screenshot or Figma export into a Shopify Liquid section.
                    </h1>
                    <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
                      Upload a section screenshot on the left to inspect its observed typography, grid spacing, and colors, then generate a complete Online Store 2.0 `.liquid` file with dynamic Shopify objects, scoped responsive CSS, and a merchant-ready schema.
                    </p>

                    <div className="mt-6 grid grid-cols-1 gap-4 border-t border-slate-100 pt-6 sm:grid-cols-3">
                      <div>
                        <p className="text-xs font-semibold text-slate-900">
                          01. Visual Design Analysis
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-slate-600">
                          Separates observed layout, palette, and spacing from inferred Shopify responsive and accessibility decisions.
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-900">
                          02. Authentic Liquid & Schema
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-slate-600">
                          Uses real Liquid tags, dynamic collection/product objects, image filters, and validated Theme Editor JSON schemas.
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-900">
                          03. Live Theme Editor Preview
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-slate-600">
                          Test desktop, tablet, and mobile breakpoints while editing schema settings and repeatable blocks live.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Quick-Start Sample Cards */}
                  <div className="rounded-xl border border-slate-200 bg-white p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <h2 className="text-sm font-semibold text-slate-900">
                          Sample Section Blueprints
                        </h2>
                        <p className="text-xs text-slate-500">
                          Click any reference below to load it into the studio and generate its Liquid code.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      {SAMPLE_DESIGN_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => void handleLoadQuickSampleFromEmpty(preset)}
                          className="group overflow-hidden rounded-lg border border-slate-200 bg-white text-left transition-colors hover:border-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
                        >
                          <div className="aspect-video w-full overflow-hidden bg-slate-100">
                            <img
                              src={preset.imageUrl}
                              alt={preset.title}
                              referrerPolicy="no-referrer"
                              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                            />
                          </div>
                          <div className="p-3.5">
                            <p className="text-[11px] font-medium text-teal-700">
                              {preset.category}
                            </p>
                            <h3 className="mt-0.5 text-sm font-semibold text-slate-900">
                              {preset.title}
                            </h3>
                            <p className="mt-1 text-xs leading-relaxed text-slate-500">
                              {preset.description}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Populated Output Workbench */
                <div className="space-y-5">
                  {/* Workbench Header & Segmented View Tabs */}
                  <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-3.5">
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-semibold text-slate-900">
                        {activeResult.sectionName}
                      </h2>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="font-mono">
                          sections/{activeResult.sectionSlug}.liquid
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{activeResult.detectedSectionType}</span>
                        <span aria-hidden="true">·</span>
                        <span
                          className={
                            activeValidation.isValid
                              ? 'font-medium text-emerald-700'
                              : 'font-medium text-red-700'
                          }
                        >
                          {activeValidation.isValid
                            ? 'Schema Verified'
                            : `${activeValidation.errors.length} Issues`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
                      <button
                        type="button"
                        onClick={() => {
                          setWorkbenchTab('analysis');
                          setTopView('builder');
                        }}
                        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                          workbenchTab === 'analysis'
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Layers className="h-3.5 w-3.5" />
                        Analysis
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setWorkbenchTab('code');
                          setTopView('builder');
                        }}
                        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                          workbenchTab === 'code'
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Code2 className="h-3.5 w-3.5" />
                        Liquid Code
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setWorkbenchTab('preview');
                          setTopView('preview');
                        }}
                        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                          workbenchTab === 'preview'
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Live Preview
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setWorkbenchTab('schema');
                          setTopView('schema');
                        }}
                        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                          workbenchTab === 'schema'
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <FileJson className="h-3.5 w-3.5" />
                        Schema
                      </button>
                    </div>
                  </div>

                  {workbenchTab === 'analysis' && (
                    <DesignAnalysisView
                      analysis={activeResult.designAnalysis}
                      detectedType={activeResult.detectedSectionType}
                      sectionName={activeResult.sectionName}
                    />
                  )}

                  {workbenchTab === 'code' && (
                    <LiquidCodeView
                      sectionSlug={activeResult.sectionSlug}
                      liquidCode={activeResult.liquidCode}
                      merchantNotes={activeResult.merchantNotes}
                      validation={activeValidation}
                      isRefining={isRefining}
                      refineError={refineError}
                      onRefine={handleRefine}
                      onDownload={() =>
                        downloadLiquidFile(
                          activeResult.sectionSlug,
                          activeResult.liquidCode
                        )
                      }
                    />
                  )}

                  {workbenchTab === 'preview' && (
                    <LivePreviewView
                      liquidCode={activeResult.liquidCode}
                      schema={activeValidation.parsedSchema}
                      uploadedPreviewImageUrl={images[0]?.previewUrl}
                    />
                  )}

                  {workbenchTab === 'schema' && (
                    <SchemaExplorerView schema={activeValidation.parsedSchema} />
                  )}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
