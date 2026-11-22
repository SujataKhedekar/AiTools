import { useEffect, useState } from 'react';
import { BulkWorkspace } from './components/BulkWorkspace';
import { ContentWorkspace } from './components/ContentWorkspace';
import { DocsWorkspace } from './components/DocsWorkspace';
import { DraftsWorkspace } from './components/DraftsWorkspace';
import { ExportModal } from './components/ExportModal';
import { Header, type AppView } from './components/Header';
import { ProductInputPanel } from './components/ProductInputPanel';
import type { ProductPreset } from './data/presets';
import {
  analyzeProductImages,
  analyzeProductUrl,
  detectCategory,
  fetchHealthAndUsage,
  generateCatalogListing,
  regenerateListingSection,
} from './services/apiClient';
import type {
  CatalogDraft,
  CategoryDetectionResult,
  GeneratedCatalogListing,
  ImageAnalysisResult,
  InputMode,
  PendingSuggestion,
  ProductInput,
  TokenUsageSummary,
  UploadedProductImage,
  UrlAnalysisResult,
} from './shared/types';

const DRAFTS_STORAGE_KEY = 'aivora_catalog_drafts_v1';

function createEmptyInput(): ProductInput {
  return {
    productName: '',
    categoryId: 'auto',
    subcategory: '',
    brandName: '',
    sku: '',
    materialOrFabric: '',
    color: '',
    sizeOrDimensions: '',
    targetAudience: '',
    features: '',
    benefits: '',
    price: '',
    countryAndMarket: '',
    targetKeywords: '',
    competitorUrl: '',
    rawNotes: '',
    careLabelProvided: '',
    nutritionalOrIngredientInfo: '',
    writingStyle: 'Modern ecommerce',
    marketplace: 'shopify',
    generateVariations: true,
  };
}

async function imageUrlToDataUrl(url: string): Promise<{ mimeType: string; dataUrl: string }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Unable to load preset image.');
  const blob = await res.blob();
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Failed to read preset image.'));
    reader.readAsDataURL(blob);
  });
  return { mimeType: blob.type || 'image/jpeg', dataUrl };
}

function splitDataUrl(dataUrl: string): { mimeType: string; base64Data: string } | null {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
  if (!match) return null;
  return { mimeType: match[1], base64Data: match[2] };
}

export default function App() {
  const [activeView, setActiveView] = useState<AppView>('studio');
  const [inputMode, setInputMode] = useState<InputMode>('manual');
  const [input, setInput] = useState<ProductInput>(createEmptyInput);
  const [images, setImages] = useState<UploadedProductImage[]>([]);
  const [imageAnalysis, setImageAnalysis] = useState<ImageAnalysisResult | null>(null);
  const [urlAnalysis, setUrlAnalysis] = useState<UrlAnalysisResult | null>(null);
  const [detectedCategory, setDetectedCategory] = useState<CategoryDetectionResult | null>(null);
  const [listing, setListing] = useState<GeneratedCatalogListing | null>(null);
  const [pendingSuggestion, setPendingSuggestion] = useState<PendingSuggestion | null>(null);

  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [isAnalyzingUrl, setIsAnalyzingUrl] = useState(false);
  const [isDetectingCategory, setIsDetectingCategory] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [regeneratingSection, setRegeneratingSection] = useState<string | null>(null);

  const [errorBanner, setErrorBanner] = useState<string>('');
  const [draftSavedNotice, setDraftSavedNotice] = useState<string>('');
  const [isExportOpen, setIsExportOpen] = useState(false);

  const [usage, setUsage] = useState<TokenUsageSummary>({
    promptTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    requestsCount: 0,
  });
  const [geminiReady, setGeminiReady] = useState<boolean>(true);

  const [drafts, setDrafts] = useState<CatalogDraft[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(DRAFTS_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as CatalogDraft[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    fetchHealthAndUsage()
      .then((res) => {
        setGeminiReady(res.health.geminiConfigured);
        setUsage(res.usage);
      })
      .catch(() => {
        // Ignore initial health check network glitches
      });
  }, []);

  const persistDrafts = (next: CatalogDraft[]) => {
    setDrafts(next);
    try {
      localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Storage quota full
    }
  };

  const handlePatchInput = (patch: Partial<ProductInput>) => {
    setInput((prev) => ({ ...prev, ...patch }));
  };

  const handleResetWorkspace = () => {
    setInput(createEmptyInput());
    setImages([]);
    setImageAnalysis(null);
    setUrlAnalysis(null);
    setDetectedCategory(null);
    setListing(null);
    setPendingSuggestion(null);
    setErrorBanner('');
    setActiveView('studio');
  };

  const handleLoadPreset = async (preset: ProductPreset) => {
    setErrorBanner('');
    setImageAnalysis(null);
    setUrlAnalysis(null);
    setDetectedCategory(null);
    setPendingSuggestion(null);
    setInput({ ...createEmptyInput(), ...preset.input });

    if (preset.imagePath) {
      setInputMode('image');
      try {
        const { mimeType, dataUrl } = await imageUrlToDataUrl(preset.imagePath);
        setImages([
          {
            id: `preset-${preset.id}`,
            name: `${preset.id}.jpg`,
            mimeType,
            dataUrl,
            source: 'preset',
          },
        ]);
      } catch {
        setImages([]);
      }
    } else {
      setImages([]);
      setInputMode('manual');
    }
  };

  const handleAnalyzeImages = async () => {
    if (!images.length) return;
    setIsAnalyzingImage(true);
    setErrorBanner('');
    try {
      const payload = images
        .map((img) => splitDataUrl(img.dataUrl))
        .filter((p): p is { mimeType: string; base64Data: string } => p !== null);

      const res = await analyzeProductImages(payload, input.rawNotes);
      setImageAnalysis(res.analysis);
      setUsage(res.usage);

      setInput((prev) => ({
        ...prev,
        productName: prev.productName || res.analysis.detectedProductType,
        categoryId: prev.categoryId === 'auto' ? res.analysis.suggestedCategoryId : prev.categoryId,
        subcategory: prev.subcategory || res.analysis.suggestedSubcategory,
        color: prev.color || res.analysis.visibleColors.join(', '),
      }));
    } catch (err) {
      setErrorBanner(err instanceof Error ? err.message : 'Image analysis failed.');
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  const handleAnalyzeUrl = async (url: string) => {
    setIsAnalyzingUrl(true);
    setErrorBanner('');
    try {
      const res = await analyzeProductUrl(url);
      setUrlAnalysis(res.result);
      setUsage(res.usage);

      const specsNote = res.result.extractedSpecs
        .map((s) => `${s.key}: ${s.value}`)
        .join('; ');

      setInput((prev) => ({
        ...prev,
        competitorUrl: url,
        productName: res.result.extractedTitle || prev.productName,
        brandName: res.result.extractedBrand || prev.brandName,
        price: res.result.extractedPrice || prev.price,
        categoryId:
          prev.categoryId === 'auto' ? res.result.suggestedCategoryId : prev.categoryId,
        subcategory: res.result.suggestedSubcategory || prev.subcategory,
        rawNotes: [res.result.extractedDescription, specsNote, prev.rawNotes]
          .filter(Boolean)
          .join('\n'),
      }));
    } catch (err) {
      setErrorBanner(err instanceof Error ? err.message : 'URL extraction failed.');
    } finally {
      setIsAnalyzingUrl(false);
    }
  };

  const handleDetectCategory = async () => {
    setIsDetectingCategory(true);
    setErrorBanner('');
    try {
      const res = await detectCategory(input);
      setDetectedCategory(res.result);
      setUsage(res.usage);
      setInput((prev) => ({
        ...prev,
        categoryId: res.result.categoryId,
        subcategory: res.result.subcategory,
      }));
    } catch (err) {
      setErrorBanner(err instanceof Error ? err.message : 'Category detection failed.');
    } finally {
      setIsDetectingCategory(false);
    }
  };

  const handleGenerateListing = async () => {
    setIsGenerating(true);
    setErrorBanner('');
    setPendingSuggestion(null);
    try {
      const res = await generateCatalogListing({
        input,
        imageAnalysis,
        imageDataUrls: images.slice(0, 3).map((i) => i.dataUrl),
      });
      setListing(res.listing);
      setUsage(res.usage);
      setInput((prev) => ({
        ...prev,
        categoryId: res.listing.categoryId,
        subcategory: res.listing.subcategory,
      }));
    } catch (err) {
      setErrorBanner(err instanceof Error ? err.message : 'Catalog generation failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateSection = async (
    section:
      | 'shortDescription'
      | 'longDescription'
      | 'bulletHighlights'
      | 'washCare'
      | 'seo'
      | 'marketplaceListing'
  ) => {
    if (!listing) return;
    setRegeneratingSection(section);
    setErrorBanner('');
    try {
      const res = await regenerateListingSection({
        section,
        input,
        currentListing: listing,
      });
      setUsage(res.usage);
      const labels: Record<string, string> = {
        shortDescription: 'Short Description',
        longDescription: 'Long Description',
        bulletHighlights: 'Bullet Point Highlights',
        washCare: 'Wash Care & Maintenance',
        seo: 'SEO & FAQs',
        marketplaceListing: 'Marketplace Format',
      };
      setPendingSuggestion({
        section,
        label: labels[section] ?? section,
        proposedValue: res.proposedValue,
      });
    } catch (err) {
      setErrorBanner(err instanceof Error ? err.message : 'Section regeneration failed.');
    } finally {
      setRegeneratingSection(null);
    }
  };

  const handleAcceptSuggestion = () => {
    if (!pendingSuggestion || !listing) return;
    setListing((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [pendingSuggestion.section]: pendingSuggestion.proposedValue,
      };
    });
    setPendingSuggestion(null);
  };

  const handleSaveDraft = () => {
    if (!listing) return;
    const draftId = listing.id;
    const nextDraft: CatalogDraft = {
      draftId,
      updatedAt: new Date().toISOString(),
      input,
      images,
      listing,
    };
    const filtered = drafts.filter((d) => d.draftId !== draftId);
    persistDrafts([nextDraft, ...filtered]);
    setDraftSavedNotice('Saved');
    setTimeout(() => setDraftSavedNotice(''), 2000);
  };

  return (
    <div className="product-description-root min-h-screen flex flex-col bg-[#F8F8F6] text-zinc-900">
      <Header
        activeView={activeView}
        onNavigate={setActiveView}
        hasActiveListing={Boolean(listing)}
        onOpenExport={() => setIsExportOpen(true)}
        onResetWorkspace={handleResetWorkspace}
      />

      {!geminiReady && (
        <div className="border-b border-amber-200 bg-amber-50 px-6 py-2.5 text-center text-xs text-amber-900">
          Server-side <span className="font-mono">GEMINI_API_KEY</span> is not configured yet. Set
          it in Settings &gt; Secrets to enable AI generation.
        </div>
      )}

      {errorBanner && (
        <div className="mx-auto mt-4 w-full max-w-[1440px] px-6">
          <div className="flex items-center justify-between gap-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-900">
            <span>{errorBanner}</span>
            <button
              type="button"
              onClick={() => setErrorBanner('')}
              className="font-semibold underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <main className="flex-1">
        {activeView === 'studio' && (
          <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-12 lg:items-start">
            <div className="lg:col-span-4">
              <ProductInputPanel
                input={input}
                onChangeInput={handlePatchInput}
                inputMode={inputMode}
                onChangeInputMode={setInputMode}
                images={images}
                onAddImages={(added) => setImages((prev) => [...prev, ...added].slice(0, 5))}
                onRemoveImage={(id) => setImages((prev) => prev.filter((img) => img.id !== id))}
                imageAnalysis={imageAnalysis}
                urlAnalysis={urlAnalysis}
                detectedCategory={detectedCategory}
                isAnalyzingImage={isAnalyzingImage}
                isAnalyzingUrl={isAnalyzingUrl}
                isDetectingCategory={isDetectingCategory}
                isGenerating={isGenerating}
                onAnalyzeImages={handleAnalyzeImages}
                onAnalyzeUrl={handleAnalyzeUrl}
                onDetectCategory={handleDetectCategory}
                onGenerateListing={handleGenerateListing}
                onLoadPreset={handleLoadPreset}
              />
            </div>

            <div className="lg:col-span-8">
              <ContentWorkspace
                listing={listing}
                images={images}
                isGenerating={isGenerating}
                regeneratingSection={regeneratingSection}
                pendingSuggestion={pendingSuggestion}
                onUpdateListing={(updater) =>
                  setListing((prev) => (prev ? updater(prev) : prev))
                }
                onRegenerateSection={handleRegenerateSection}
                onAcceptSuggestion={handleAcceptSuggestion}
                onRejectSuggestion={() => setPendingSuggestion(null)}
                onSaveDraft={handleSaveDraft}
                onOpenExport={() => setIsExportOpen(true)}
                draftSavedNotice={draftSavedNotice}
              />
            </div>
          </div>
        )}

        {activeView === 'bulk' && (
          <BulkWorkspace
            onUsageUpdate={setUsage}
            onOpenListingInStudio={(selectedListing) => {
              setListing(selectedListing);
              setInput((prev) => ({
                ...prev,
                productName: selectedListing.productName,
                brandName: selectedListing.brandName,
                sku: selectedListing.sku,
                categoryId: selectedListing.categoryId,
                subcategory: selectedListing.subcategory,
                price: selectedListing.price,
              }));
              setActiveView('studio');
            }}
          />
        )}

        {activeView === 'drafts' && (
          <DraftsWorkspace
            drafts={drafts}
            onLoadDraft={(draft) => {
              setInput(draft.input);
              setImages(draft.images);
              setListing(draft.listing);
              setPendingSuggestion(null);
              setActiveView('studio');
            }}
            onDeleteDraft={(id) => persistDrafts(drafts.filter((d) => d.draftId !== id))}
          />
        )}

        {activeView === 'docs' && <DocsWorkspace />}
      </main>

      <footer className="mt-12 border-t border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-6 py-4 text-xs text-zinc-500">
          <div>Aivora · Standalone Ecommerce Product Catalog Studio</div>
          <div className="font-mono tabular-nums">
            Session AI Usage: {usage.requestsCount} requests · {usage.totalTokens.toLocaleString()}{' '}
            tokens ({usage.promptTokens.toLocaleString()} in /{' '}
            {usage.outputTokens.toLocaleString()} out)
          </div>
        </div>
      </footer>

      <ExportModal
        listing={listing}
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />
    </div>
  );
}
