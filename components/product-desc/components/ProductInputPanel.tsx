import { ImagePlus, Link2, Loader2, Sparkles, Trash2, Upload } from 'lucide-react';
import { useState, type ChangeEvent } from 'react';
import { BENCHMARK_PRESETS, type ProductPreset } from '../data/presets';
import {
  getCategoryById,
  MARKETPLACES,
  PRODUCT_CATEGORIES,
  WRITING_STYLES,
  type CategoryId,
  type MarketplaceId,
  type WritingStyle,
} from '../shared/catalogTaxonomy';
import type {
  CategoryDetectionResult,
  ImageAnalysisResult,
  InputMode,
  ProductInput,
  UploadedProductImage,
  UrlAnalysisResult,
} from '../shared/types';

interface ProductInputPanelProps {
  input: ProductInput;
  onChangeInput: (patch: Partial<ProductInput>) => void;
  inputMode: InputMode;
  onChangeInputMode: (mode: InputMode) => void;
  images: UploadedProductImage[];
  onAddImages: (newImages: UploadedProductImage[]) => void;
  onRemoveImage: (id: string) => void;
  imageAnalysis: ImageAnalysisResult | null;
  urlAnalysis: UrlAnalysisResult | null;
  detectedCategory: CategoryDetectionResult | null;
  isAnalyzingImage: boolean;
  isAnalyzingUrl: boolean;
  isDetectingCategory: boolean;
  isGenerating: boolean;
  onAnalyzeImages: () => void;
  onAnalyzeUrl: (url: string) => void;
  onDetectCategory: () => void;
  onGenerateListing: () => void;
  onLoadPreset: (preset: ProductPreset) => void;
}

export function ProductInputPanel({
  input,
  onChangeInput,
  inputMode,
  onChangeInputMode,
  images,
  onAddImages,
  onRemoveImage,
  imageAnalysis,
  urlAnalysis,
  detectedCategory,
  isAnalyzingImage,
  isAnalyzingUrl,
  isDetectingCategory,
  isGenerating,
  onAnalyzeImages,
  onAnalyzeUrl,
  onDetectCategory,
  onGenerateListing,
  onLoadPreset,
}: ProductInputPanelProps) {
  const [urlField, setUrlField] = useState(input.competitorUrl || '');
  const [selectedPresetId, setSelectedPresetId] = useState('');
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const selectedCategoryObj =
    input.categoryId === 'auto' ? null : getCategoryById(input.categoryId);

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const loaded: UploadedProductImage[] = [];
    for (const file of files.slice(0, 5 - images.length)) {
      if (!file.type.startsWith('image/')) continue;
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Failed to read image file'));
        reader.readAsDataURL(file);
      });
      loaded.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: file.name,
        mimeType: file.type,
        dataUrl,
        source: 'upload',
      });
    }
    if (loaded.length) {
      onAddImages(loaded);
    }
    e.target.value = '';
  };

  const handlePresetChange = (presetId: string) => {
    setSelectedPresetId(presetId);
    const found = BENCHMARK_PRESETS.find((p) => p.id === presetId);
    if (found) {
      onLoadPreset(found);
      if (found.input.competitorUrl) setUrlField(found.input.competitorUrl);
    }
  };

  return (
    <aside className="flex flex-col gap-6 rounded-xl border border-zinc-200 bg-white p-5">
      <div className="flex flex-col gap-3 border-b border-zinc-200 pb-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-base font-semibold text-zinc-900">Product Intake</h2>
          <select
            aria-label="Load benchmark test product"
            value={selectedPresetId}
            onChange={(e) => handlePresetChange(e.target.value)}
            className="max-w-[205px] rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs font-medium text-zinc-700 focus:border-zinc-900 focus:outline-none"
          >
            <option value="">Load Test Preset (10)...</option>
            {BENCHMARK_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.label}
              </option>
            ))}
          </select>
        </div>

        <div
          className="grid grid-cols-3 gap-1 rounded-lg bg-zinc-100 p-1"
          role="tablist"
          aria-label="Input mode"
        >
          {(
            [
              { id: 'manual', label: 'Manual' },
              { id: 'image', label: 'Image AI' },
              { id: 'url', label: 'URL Fetch' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={inputMode === tab.id}
              onClick={() => onChangeInputMode(tab.id)}
              className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                inputMode === tab.id
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {inputMode === 'image' && (
        <div className="flex flex-col gap-3 border-b border-zinc-200 pb-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-800">
              Product Images ({images.length}/5)
            </span>
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50">
              <Upload className="h-3.5 w-3.5" />
              <span>Upload</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleFileUpload}
                className="sr-only"
              />
            </label>
          </div>

          {images.length === 0 ? (
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-center hover:border-zinc-500">
              <ImagePlus className="h-6 w-6 text-zinc-400" />
              <span className="mt-2 text-xs font-medium text-zinc-700">
                Drop or select product photos (JPEG, PNG, WebP)
              </span>
              <span className="mt-1 text-[11px] text-zinc-500">
                Visual traits are separated from unverified technical specifications.
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleFileUpload}
                className="sr-only"
              />
            </label>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="group relative aspect-[4/3] overflow-hidden rounded-md border border-zinc-200 bg-zinc-100"
                >
                  {failedImages[img.id] ? (
                    <div className="flex h-full w-full items-center justify-center p-2 text-center text-[11px] text-zinc-500">
                      {img.name}
                    </div>
                  ) : (
                    <img
                      src={img.dataUrl}
                      alt={img.name}
                      referrerPolicy="no-referrer"
                      onError={() => setFailedImages((prev) => ({ ...prev, [img.id]: true }))}
                      className="h-full w-full object-cover"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => onRemoveImage(img.id)}
                    aria-label={`Remove ${img.name}`}
                    className="absolute right-1 top-1 rounded bg-white/90 p-1 text-zinc-700 shadow-sm hover:text-red-600"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            disabled={images.length === 0 || isAnalyzingImage}
            onClick={onAnalyzeImages}
            className="flex items-center justify-center gap-2 rounded-md border border-zinc-900 bg-white px-3 py-2 text-xs font-semibold text-zinc-900 transition-colors hover:bg-zinc-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isAnalyzingImage ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Analyzing Product Images...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                <span>Analyze Images with Multimodal AI</span>
              </>
            )}
          </button>

          {imageAnalysis && (
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs">
              <div className="font-semibold text-zinc-900">
                Visual Observations · {imageAnalysis.detectedProductType}
              </div>
              <p className="mt-1 text-zinc-600">
                Colors: {imageAnalysis.visibleColors.join(', ')} · Surface:{' '}
                {imageAnalysis.visibleMaterialAppearance}
              </p>
              <p className="mt-1 text-[11px] text-amber-800">
                {imageAnalysis.verificationBoundaryNote}
              </p>
            </div>
          )}
        </div>
      )}

      {inputMode === 'url' && (
        <div className="flex flex-col gap-3 border-b border-zinc-200 pb-5">
          <label className="text-xs font-semibold text-zinc-800" htmlFor="url-extract-input">
            Public Product or Competitor URL
          </label>
          <div className="flex gap-2">
            <input
              id="url-extract-input"
              type="url"
              value={urlField}
              onChange={(e) => {
                setUrlField(e.target.value);
                onChangeInput({ competitorUrl: e.target.value });
              }}
              placeholder="https://example.com/products/cotton-kurta"
              className="w-full rounded-md border border-zinc-200 px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none"
            />
            <button
              type="button"
              disabled={!urlField.trim() || isAnalyzingUrl}
              onClick={() => onAnalyzeUrl(urlField)}
              className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-3 py-2 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              {isAnalyzingUrl ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Link2 className="h-3.5 w-3.5" />
              )}
              <span>Extract</span>
            </button>
          </div>
          {urlAnalysis && (
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-700">
              <div className="font-semibold text-zinc-900">Extracted: {urlAnalysis.extractedTitle}</div>
              <p className="mt-1 text-[11px] text-zinc-600">{urlAnalysis.extractionNote}</p>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3.5">
        <div>
          <label htmlFor="product-name" className="block text-xs font-medium text-zinc-700">
            Product Name
          </label>
          <input
            id="product-name"
            type="text"
            value={input.productName}
            onChange={(e) => onChangeInput({ productName: e.target.value })}
            placeholder="e.g. Indigo Block-Printed Straight Cotton Kurta"
            className="mt-1 w-full rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="brand-name" className="block text-xs font-medium text-zinc-700">
              Brand Name
            </label>
            <input
              id="brand-name"
              type="text"
              value={input.brandName}
              onChange={(e) => onChangeInput({ brandName: e.target.value })}
              placeholder="e.g. Aanya Looms"
              className="mt-1 w-full rounded-md border border-zinc-200 px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="sku-input" className="block text-xs font-medium text-zinc-700">
              SKU
            </label>
            <input
              id="sku-input"
              type="text"
              value={input.sku}
              onChange={(e) => onChangeInput({ sku: e.target.value })}
              placeholder="e.g. AL-KRT-101"
              className="mt-1 w-full rounded-md border border-zinc-200 px-3 py-2 font-mono text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none"
            />
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-zinc-800">Category &amp; Subcategory</span>
            <button
              type="button"
              disabled={isDetectingCategory || (!input.productName && !input.rawNotes)}
              onClick={onDetectCategory}
              className="text-xs font-medium text-blue-700 hover:underline disabled:opacity-40"
            >
              {isDetectingCategory ? 'Detecting...' : 'Auto-detect'}
            </button>
          </div>
          <div className="mt-2 grid grid-cols-1 gap-2">
            <select
              aria-label="Product category"
              value={input.categoryId}
              onChange={(e) => {
                const val = e.target.value as CategoryId | 'auto';
                const cat = val === 'auto' ? null : getCategoryById(val);
                onChangeInput({
                  categoryId: val,
                  subcategory: cat ? cat.subcategories[0] : '',
                });
              }}
              className="w-full rounded-md border border-zinc-200 bg-white px-2.5 py-2 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
            >
              <option value="auto">Auto-Detect Category via AI</option>
              {PRODUCT_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>

            {selectedCategoryObj ? (
              <select
                aria-label="Product subcategory"
                value={input.subcategory}
                onChange={(e) => onChangeInput({ subcategory: e.target.value })}
                className="w-full rounded-md border border-zinc-200 bg-white px-2.5 py-2 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
              >
                {selectedCategoryObj.subcategories.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                aria-label="Subcategory hint"
                value={input.subcategory}
                onChange={(e) => onChangeInput({ subcategory: e.target.value })}
                placeholder="Subcategory (optional — e.g. Kurtas, Sneakers)"
                className="w-full rounded-md border border-zinc-200 bg-white px-2.5 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none"
              />
            )}
          </div>
          {detectedCategory && (
            <p className="mt-2 text-[11px] text-zinc-600">
              Detected: <span className="font-medium text-zinc-900">{detectedCategory.categoryLabel}</span> ·{' '}
              {detectedCategory.subcategory}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="material-input" className="block text-xs font-medium text-zinc-700">
              Material / Fabric
            </label>
            <input
              id="material-input"
              type="text"
              value={input.materialOrFabric}
              onChange={(e) => onChangeInput({ materialOrFabric: e.target.value })}
              placeholder="e.g. 100% Cotton"
              className="mt-1 w-full rounded-md border border-zinc-200 px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="color-input" className="block text-xs font-medium text-zinc-700">
              Color
            </label>
            <input
              id="color-input"
              type="text"
              value={input.color}
              onChange={(e) => onChangeInput({ color: e.target.value })}
              placeholder="e.g. Ivory & Indigo"
              className="mt-1 w-full rounded-md border border-zinc-200 px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="size-input" className="block text-xs font-medium text-zinc-700">
              Size / Dimensions
            </label>
            <input
              id="size-input"
              type="text"
              value={input.sizeOrDimensions}
              onChange={(e) => onChangeInput({ sizeOrDimensions: e.target.value })}
              placeholder="e.g. S–XL, 44 in length"
              className="mt-1 w-full rounded-md border border-zinc-200 px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="price-input" className="block text-xs font-medium text-zinc-700">
              Price (Optional)
            </label>
            <input
              id="price-input"
              type="text"
              value={input.price}
              onChange={(e) => onChangeInput({ price: e.target.value })}
              placeholder="e.g. $54"
              className="mt-1 w-full rounded-md border border-zinc-200 px-3 py-2 font-mono text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="audience-input" className="block text-xs font-medium text-zinc-700">
              Target Audience
            </label>
            <input
              id="audience-input"
              type="text"
              value={input.targetAudience}
              onChange={(e) => onChangeInput({ targetAudience: e.target.value })}
              placeholder="e.g. Everyday workwear"
              className="mt-1 w-full rounded-md border border-zinc-200 px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="market-input" className="block text-xs font-medium text-zinc-700">
              Country / Market
            </label>
            <input
              id="market-input"
              type="text"
              value={input.countryAndMarket}
              onChange={(e) => onChangeInput({ countryAndMarket: e.target.value })}
              placeholder="e.g. US / India"
              className="mt-1 w-full rounded-md border border-zinc-200 px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label htmlFor="features-input" className="block text-xs font-medium text-zinc-700">
            Product Features
          </label>
          <textarea
            id="features-input"
            rows={2}
            value={input.features}
            onChange={(e) => onChangeInput({ features: e.target.value })}
            placeholder="Key construction details, ports, closures, compartments..."
            className="mt-1 w-full rounded-md border border-zinc-200 px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="benefits-input" className="block text-xs font-medium text-zinc-700">
            Product Benefits
          </label>
          <textarea
            id="benefits-input"
            rows={2}
            value={input.benefits}
            onChange={(e) => onChangeInput({ benefits: e.target.value })}
            placeholder="How this product helps the customer..."
            className="mt-1 w-full rounded-md border border-zinc-200 px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="care-label-input" className="block text-xs font-medium text-zinc-700">
            Manufacturer Care Label (Optional)
          </label>
          <input
            id="care-label-input"
            type="text"
            value={input.careLabelProvided}
            onChange={(e) => onChangeInput({ careLabelProvided: e.target.value })}
            placeholder="Leave blank if unverified; general guidance will be marked"
            className="mt-1 w-full rounded-md border border-zinc-200 px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="ingredients-input" className="block text-xs font-medium text-zinc-700">
            Ingredients / Nutrition / Technical Sheet (Optional)
          </label>
          <textarea
            id="ingredients-input"
            rows={2}
            value={input.nutritionalOrIngredientInfo}
            onChange={(e) => onChangeInput({ nutritionalOrIngredientInfo: e.target.value })}
            placeholder="Exact INCI ingredients, food allergens, or verified electronics specs..."
            className="mt-1 w-full rounded-md border border-zinc-200 px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="keywords-input" className="block text-xs font-medium text-zinc-700">
            Target SEO Keywords
          </label>
          <input
            id="keywords-input"
            type="text"
            value={input.targetKeywords}
            onChange={(e) => onChangeInput({ targetKeywords: e.target.value })}
            placeholder="Comma-separated primary & secondary keywords"
            className="mt-1 w-full rounded-md border border-zinc-200 px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="raw-notes-input" className="block text-xs font-medium text-zinc-700">
            Raw Merchandising Notes
          </label>
          <textarea
            id="raw-notes-input"
            rows={2}
            value={input.rawNotes}
            onChange={(e) => onChangeInput({ rawNotes: e.target.value })}
            placeholder="Any additional supplier facts, model height, origin, or packaging notes..."
            className="mt-1 w-full rounded-md border border-zinc-200 px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-zinc-200 pt-3">
          <div>
            <label htmlFor="style-select" className="block text-xs font-medium text-zinc-700">
              Writing Style
            </label>
            <select
              id="style-select"
              value={input.writingStyle}
              onChange={(e) => onChangeInput({ writingStyle: e.target.value as WritingStyle })}
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-2.5 py-2 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
            >
              {WRITING_STYLES.map((style) => (
                <option key={style} value={style}>
                  {style}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="marketplace-select" className="block text-xs font-medium text-zinc-700">
              Marketplace
            </label>
            <select
              id="marketplace-select"
              value={input.marketplace}
              onChange={(e) => onChangeInput({ marketplace: e.target.value as MarketplaceId })}
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-2.5 py-2 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
            >
              {MARKETPLACES.map((mp) => (
                <option key={mp.id} value={mp.id}>
                  {mp.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <label className="flex items-center gap-2 text-xs text-zinc-700">
          <input
            type="checkbox"
            checked={input.generateVariations}
            onChange={(e) => onChangeInput({ generateVariations: e.target.checked })}
            className="h-3.5 w-3.5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
          />
          <span>Generate 2 alternate writing style variations</span>
        </label>

        <button
          type="button"
          disabled={isGenerating}
          onClick={onGenerateListing}
          className="mt-1 flex w-full items-center justify-center gap-2 rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Generating Catalog Listing...</span>
            </>
          ) : (
            <span>Generate Product Catalog</span>
          )}
        </button>
      </div>
    </aside>
  );
}
