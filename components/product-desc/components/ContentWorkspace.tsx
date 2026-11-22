import {
  AlertCircle,
  BookmarkCheck,
  Check,
  Copy,
  Download,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react';
import { useState } from 'react';
import type {
  AttributeEntry,
  GeneratedCatalogListing,
  PendingSuggestion,
  SeoMetadata,
  UploadedProductImage,
  WashCareDetails,
} from '../shared/types';
import { StorefrontPreview } from './StorefrontPreview';

type WorkspaceTab =
  | 'descriptions'
  | 'attributes'
  | 'care'
  | 'size_guide'
  | 'seo'
  | 'marketplace'
  | 'preview';

interface ContentWorkspaceProps {
  listing: GeneratedCatalogListing | null;
  images: UploadedProductImage[];
  isGenerating: boolean;
  regeneratingSection: string | null;
  pendingSuggestion: PendingSuggestion | null;
  onUpdateListing: (updater: (prev: GeneratedCatalogListing) => GeneratedCatalogListing) => void;
  onRegenerateSection: (
    section:
      | 'shortDescription'
      | 'longDescription'
      | 'bulletHighlights'
      | 'washCare'
      | 'seo'
      | 'marketplaceListing'
  ) => void;
  onAcceptSuggestion: () => void;
  onRejectSuggestion: () => void;
  onSaveDraft: () => void;
  onOpenExport: () => void;
  draftSavedNotice: string;
}

export function ContentWorkspace({
  listing,
  images,
  isGenerating,
  regeneratingSection,
  pendingSuggestion,
  onUpdateListing,
  onRegenerateSection,
  onAcceptSuggestion,
  onRejectSuggestion,
  onSaveDraft,
  onOpenExport,
  draftSavedNotice,
}: ContentWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('descriptions');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1600);
    } catch {
      // Clipboard API unavailable
    }
  };

  if (isGenerating && !listing) {
    return (
      <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-8">
        <div className="h-6 w-2/5 animate-pulse rounded bg-zinc-200" />
        <div className="h-4 w-3/5 animate-pulse rounded bg-zinc-100" />
        <div className="mt-4 space-y-3">
          <div className="h-24 w-full animate-pulse rounded-lg bg-zinc-100" />
          <div className="h-44 w-full animate-pulse rounded-lg bg-zinc-100" />
          <div className="h-32 w-full animate-pulse rounded-lg bg-zinc-100" />
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="flex min-h-[540px] flex-col items-center justify-center rounded-xl border border-zinc-200 bg-white p-10 text-center">
        <div className="max-w-lg">
          <p className="text-xs font-medium text-zinc-500">
            Category-Aware Catalog Studio · Non-Fabricating Verification Engine
          </p>
          <h1 className="mt-3 font-display text-2xl font-semibold tracking-tight text-zinc-900 text-balance">
            Generate accurate, marketplace-ready product listings from text, photos, or URLs
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-zinc-600">
            Select one of the 10 benchmark product presets on the left—such as a cotton kurta with
            studio photography, skincare serum, wireless headphones, or leather tote—or enter your
            own product specifications to begin.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3 text-left text-xs text-zinc-600 sm:grid-cols-3">
            <div className="rounded-lg border border-zinc-200 p-3">
              <div className="font-semibold text-zinc-900">10 Retail Categories</div>
              <div className="mt-1">Apparel, footwear, jewellery, beauty, electronics, food &amp; more.</div>
            </div>
            <div className="rounded-lg border border-zinc-200 p-3">
              <div className="font-semibold text-zinc-900">Wash Care Engine</div>
              <div className="mt-1">Separates verified care labels from general material guidance.</div>
            </div>
            <div className="rounded-lg border border-zinc-200 p-3 col-span-2 sm:col-span-1">
              <div className="font-semibold text-zinc-900">6 Export Formats</div>
              <div className="mt-1">Export DOCX, PDF, Excel, CSV, TXT, and structured JSON.</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tabs: Array<{ id: WorkspaceTab; label: string }> = [
    { id: 'descriptions', label: 'Descriptions' },
    { id: 'attributes', label: 'Attributes & Specs' },
    { id: 'care', label: 'Wash & Care' },
    { id: 'size_guide', label: 'Size Guide' },
    { id: 'seo', label: 'SEO & FAQs' },
    { id: 'marketplace', label: 'Marketplace' },
    { id: 'preview', label: 'Storefront Preview' },
  ];

  const updateAttribute = (index: number, patch: Partial<AttributeEntry>) => {
    onUpdateListing((prev) => {
      const nextAttrs = [...prev.categoryAttributes];
      nextAttrs[index] = { ...nextAttrs[index], ...patch };
      return { ...prev, categoryAttributes: nextAttrs };
    });
  };

  const updateWashCare = (patch: Partial<WashCareDetails>) => {
    onUpdateListing((prev) => ({
      ...prev,
      washCare: { ...prev.washCare, ...patch },
    }));
  };

  const updateSeo = (patch: Partial<SeoMetadata>) => {
    onUpdateListing((prev) => ({
      ...prev,
      seo: { ...prev.seo, ...patch },
    }));
  };

  return (
    <section className="flex flex-col gap-5">
      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-200 pb-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
              <span>{listing.categoryLabel}</span>
              <span aria-hidden="true">·</span>
              <span>{listing.subcategory}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">{listing.sku}</span>
              <span aria-hidden="true">·</span>
              <span>{listing.writingStyle}</span>
            </div>
            <input
              type="text"
              aria-label="Editable product title"
              value={listing.productName}
              onChange={(e) =>
                onUpdateListing((prev) => ({ ...prev, productName: e.target.value }))
              }
              className="mt-2 w-full rounded border border-transparent bg-transparent font-display text-xl font-semibold text-zinc-900 hover:border-zinc-200 focus:border-zinc-900 focus:bg-white focus:px-2 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onSaveDraft}
              className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 whitespace-nowrap"
            >
              <BookmarkCheck className="h-3.5 w-3.5" />
              <span>{draftSavedNotice || 'Save Draft'}</span>
            </button>
            <button
              type="button"
              onClick={onOpenExport}
              className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-3 py-2 text-xs font-semibold text-white hover:bg-zinc-800 whitespace-nowrap"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {listing.missingInformation.length > 0 && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/70 p-3.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-900">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>
                Missing Specifications Not Fabricated ({listing.missingInformation.length})
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-amber-800">
              Supply or verify these before publishing:{' '}
              {listing.missingInformation.join(' · ')}
            </p>
          </div>
        )}

        <div
          className="mt-4 flex gap-1 overflow-x-auto border-b border-zinc-200"
          role="tablist"
          aria-label="Listing editor sections"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`border-b-2 px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                activeTab === tab.id
                  ? 'border-zinc-900 text-zinc-900'
                  : 'border-transparent text-zinc-500 hover:text-zinc-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {pendingSuggestion && (
          <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50/70 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-semibold text-blue-950">
                Proposed Regeneration · {pendingSuggestion.label}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onAcceptSuggestion}
                  className="inline-flex items-center gap-1 rounded bg-zinc-900 px-2.5 py-1 text-xs font-semibold text-white hover:bg-zinc-800"
                >
                  <Check className="h-3 w-3" />
                  <span>Accept</span>
                </button>
                <button
                  type="button"
                  onClick={onRejectSuggestion}
                  className="inline-flex items-center gap-1 rounded border border-zinc-300 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  <X className="h-3 w-3" />
                  <span>Reject</span>
                </button>
              </div>
            </div>
            <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded border border-blue-200 bg-white p-3 font-sans text-xs text-zinc-800">
              {typeof pendingSuggestion.proposedValue === 'string'
                ? pendingSuggestion.proposedValue
                : JSON.stringify(pendingSuggestion.proposedValue, null, 2)}
            </pre>
          </div>
        )}

        {activeTab === 'descriptions' && (
          <div className="mt-5 space-y-6">
            <div>
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="short-desc-editor"
                  className="text-xs font-semibold text-zinc-900"
                >
                  Short Description
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={regeneratingSection !== null}
                    onClick={() => onRegenerateSection('shortDescription')}
                    className="inline-flex items-center gap-1 text-xs font-medium text-zinc-600 hover:text-zinc-900 disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`h-3 w-3 ${
                        regeneratingSection === 'shortDescription' ? 'animate-spin' : ''
                      }`}
                    />
                    <span>Regenerate</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy('shortDesc', listing.shortDescription)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-zinc-600 hover:text-zinc-900"
                  >
                    {copiedKey === 'shortDesc' ? (
                      <Check className="h-3 w-3 text-emerald-700" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                    <span>{copiedKey === 'shortDesc' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
              <textarea
                id="short-desc-editor"
                rows={3}
                value={listing.shortDescription}
                onChange={(e) =>
                  onUpdateListing((prev) => ({ ...prev, shortDescription: e.target.value }))
                }
                className="mt-2 w-full rounded-lg border border-zinc-200 p-3 text-sm leading-relaxed text-zinc-800 focus:border-zinc-900 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="long-desc-editor"
                  className="text-xs font-semibold text-zinc-900"
                >
                  Long Description
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={regeneratingSection !== null}
                    onClick={() => onRegenerateSection('longDescription')}
                    className="inline-flex items-center gap-1 text-xs font-medium text-zinc-600 hover:text-zinc-900 disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`h-3 w-3 ${
                        regeneratingSection === 'longDescription' ? 'animate-spin' : ''
                      }`}
                    />
                    <span>Regenerate</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy('longDesc', listing.longDescription)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-zinc-600 hover:text-zinc-900"
                  >
                    {copiedKey === 'longDesc' ? (
                      <Check className="h-3 w-3 text-emerald-700" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                    <span>{copiedKey === 'longDesc' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
              <textarea
                id="long-desc-editor"
                rows={7}
                value={listing.longDescription}
                onChange={(e) =>
                  onUpdateListing((prev) => ({ ...prev, longDescription: e.target.value }))
                }
                className="mt-2 w-full rounded-lg border border-zinc-200 p-3 text-sm leading-relaxed text-zinc-800 focus:border-zinc-900 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-zinc-900">
                  Bullet Point Highlights ({listing.bulletHighlights.length})
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={regeneratingSection !== null}
                    onClick={() => onRegenerateSection('bulletHighlights')}
                    className="inline-flex items-center gap-1 text-xs font-medium text-zinc-600 hover:text-zinc-900"
                  >
                    <RefreshCw
                      className={`h-3 w-3 ${
                        regeneratingSection === 'bulletHighlights' ? 'animate-spin' : ''
                      }`}
                    />
                    <span>Regenerate</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateListing((prev) => ({
                        ...prev,
                        bulletHighlights: [...prev.bulletHighlights, 'New product highlight'],
                      }))
                    }
                    className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:underline"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add Bullet</span>
                  </button>
                </div>
              </div>
              <div className="mt-2 space-y-2">
                {listing.bulletHighlights.map((bullet, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={bullet}
                      onChange={(e) =>
                        onUpdateListing((prev) => {
                          const next = [...prev.bulletHighlights];
                          next[idx] = e.target.value;
                          return { ...prev, bulletHighlights: next };
                        })
                      }
                      className="w-full rounded-md border border-zinc-200 px-3 py-2 text-xs text-zinc-800 focus:border-zinc-900 focus:outline-none"
                    />
                    <button
                      type="button"
                      aria-label="Remove bullet"
                      onClick={() =>
                        onUpdateListing((prev) => ({
                          ...prev,
                          bulletHighlights: prev.bulletHighlights.filter((_, i) => i !== idx),
                        }))
                      }
                      className="rounded p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 border-t border-zinc-200 pt-5 md:grid-cols-2">
              <div>
                <div className="text-xs font-semibold text-zinc-900">Product Highlights</div>
                <textarea
                  rows={4}
                  value={listing.productHighlights.join('\n')}
                  onChange={(e) =>
                    onUpdateListing((prev) => ({
                      ...prev,
                      productHighlights: e.target.value.split('\n'),
                    }))
                  }
                  className="mt-2 w-full rounded-lg border border-zinc-200 p-3 text-xs leading-relaxed text-zinc-800 focus:border-zinc-900 focus:outline-none"
                />
              </div>
              <div>
                <div className="text-xs font-semibold text-zinc-900">Product Benefits</div>
                <textarea
                  rows={4}
                  value={listing.productBenefits.join('\n')}
                  onChange={(e) =>
                    onUpdateListing((prev) => ({
                      ...prev,
                      productBenefits: e.target.value.split('\n'),
                    }))
                  }
                  className="mt-2 w-full rounded-lg border border-zinc-200 p-3 text-xs leading-relaxed text-zinc-800 focus:border-zinc-900 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-zinc-900">Usage Instructions</div>
              <textarea
                rows={3}
                value={listing.usageInstructions.join('\n')}
                onChange={(e) =>
                  onUpdateListing((prev) => ({
                    ...prev,
                    usageInstructions: e.target.value.split('\n'),
                  }))
                }
                className="mt-2 w-full rounded-lg border border-zinc-200 p-3 text-xs leading-relaxed text-zinc-800 focus:border-zinc-900 focus:outline-none"
              />
            </div>

            {listing.variations.length > 0 && (
              <div className="border-t border-zinc-200 pt-5">
                <div className="text-xs font-semibold text-zinc-900">
                  Alternate Writing Style Variations
                </div>
                <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                  {listing.variations.map((v, idx) => (
                    <div key={idx} className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-zinc-900">{v.style}</span>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateListing((prev) => ({
                              ...prev,
                              writingStyle: v.style as GeneratedCatalogListing['writingStyle'],
                              shortDescription: v.shortDescription,
                              longDescription: v.longDescription,
                            }))
                          }
                          className="text-xs font-medium text-blue-700 hover:underline"
                        >
                          Use This Variation
                        </button>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-zinc-700">
                        {v.shortDescription}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'attributes' && (
          <div className="mt-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-900">
                {listing.categoryLabel} Specifications ({listing.categoryAttributes.length})
              </span>
              <button
                type="button"
                onClick={() =>
                  handleCopy(
                    'attrs',
                    listing.categoryAttributes.map((a) => `${a.key}: ${a.value}`).join('\n')
                  )
                }
                className="inline-flex items-center gap-1 text-xs font-medium text-zinc-600 hover:text-zinc-900"
              >
                <Copy className="h-3 w-3" />
                <span>{copiedKey === 'attrs' ? 'Copied' : 'Copy Table'}</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-zinc-200">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-600">
                  <tr>
                    <th className="px-3 py-2.5 font-semibold">Attribute</th>
                    <th className="px-3 py-2.5 font-semibold">Value</th>
                    <th className="px-3 py-2.5 font-semibold">Verification Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {listing.categoryAttributes.map((attr, idx) => (
                    <tr key={`${attr.key}-${idx}`} className="hover:bg-zinc-50/60">
                      <td className="px-3 py-2 font-medium text-zinc-800 whitespace-nowrap">
                        {attr.key}
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={attr.value}
                          onChange={(e) =>
                            updateAttribute(idx, {
                              value: e.target.value,
                              verified:
                                e.target.value.trim() !== '' &&
                                !e.target.value.toLowerCase().includes('not provided'),
                              source: 'user_supplied',
                            })
                          }
                          className="w-full rounded border border-transparent bg-transparent px-1.5 py-1 text-xs text-zinc-900 hover:border-zinc-200 focus:border-zinc-900 focus:bg-white focus:outline-none"
                        />
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-zinc-600">
                        {attr.verified ? (
                          <span className="font-medium text-emerald-700">Verified · User supplied</span>
                        ) : attr.source === 'visual_observation' ? (
                          <span className="font-medium text-blue-700">Visual observation</span>
                        ) : (
                          <span className="font-medium text-amber-700">Missing · Verify</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'care' && (
          <div className="mt-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3.5">
              <div>
                <div className="text-xs font-semibold text-zinc-900">
                  {listing.washCare.verificationStatus === 'verified_care_label'
                    ? 'Verified Manufacturer Care Label'
                    : 'General Material Guidance (Verify Care Label)'}
                </div>
                <p className="mt-0.5 text-xs text-zinc-600">{listing.washCare.disclaimer}</p>
              </div>
              <button
                type="button"
                disabled={regeneratingSection !== null}
                onClick={() => onRegenerateSection('washCare')}
                className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
              >
                <RefreshCw
                  className={`h-3 w-3 ${
                    regeneratingSection === 'washCare' ? 'animate-spin' : ''
                  }`}
                />
                <span>Regenerate Care</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(
                [
                  ['washMethod', 'Wash Method'],
                  ['waterTemperature', 'Water Temperature'],
                  ['washWithSimilarColors', 'Wash With Similar Colors'],
                  ['detergentGuidance', 'Detergent Guidance'],
                  ['bleachGuidance', 'Bleach Guidance'],
                  ['tumbleDry', 'Tumble Dry'],
                  ['lineDry', 'Line Dry'],
                  ['ironingTemperature', 'Ironing Temperature'],
                  ['dryClean', 'Dry Clean'],
                  ['storageRecommendations', 'Storage Recommendations'],
                ] as const
              ).map(([field, label]) => (
                <div key={field}>
                  <label className="block text-xs font-medium text-zinc-700">{label}</label>
                  <input
                    type="text"
                    value={listing.washCare[field]}
                    onChange={(e) => updateWashCare({ [field]: e.target.value })}
                    className="mt-1 w-full rounded-md border border-zinc-200 px-3 py-2 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-900">
                Category-Specific Maintenance Instructions
              </label>
              <textarea
                rows={4}
                value={listing.washCare.categoryMaintenanceInstructions.join('\n')}
                onChange={(e) =>
                  updateWashCare({
                    categoryMaintenanceInstructions: e.target.value.split('\n'),
                  })
                }
                className="mt-1.5 w-full rounded-lg border border-zinc-200 p-3 text-xs leading-relaxed text-zinc-800 focus:border-zinc-900 focus:outline-none"
              />
            </div>
          </div>
        )}

        {activeTab === 'size_guide' && (
          <div className="mt-5 space-y-4">
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-700">
              <span className="font-semibold text-zinc-900">{listing.sizeGuide.unitNote}</span> ·{' '}
              {listing.sizeGuide.dataNotice}
            </div>

            <div className="overflow-x-auto rounded-lg border border-zinc-200">
              <table className="w-full text-left text-xs tabular-nums">
                <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-600">
                  <tr>
                    {listing.sizeGuide.columns.map((col) => (
                      <th key={col} className="px-3 py-2.5 font-semibold whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 font-mono">
                  {listing.sizeGuide.rows.map((row, rowIdx) => (
                    <tr key={rowIdx}>
                      {listing.sizeGuide.columns.map((col) => (
                        <td key={col} className="px-2 py-1.5">
                          <input
                            type="text"
                            value={row[col] ?? '—'}
                            onChange={(e) =>
                              onUpdateListing((prev) => {
                                const nextRows = [...prev.sizeGuide.rows];
                                nextRows[rowIdx] = { ...nextRows[rowIdx], [col]: e.target.value };
                                return {
                                  ...prev,
                                  sizeGuide: { ...prev.sizeGuide, rows: nextRows },
                                };
                              })
                            }
                            className="w-full min-w-[85px] rounded border border-transparent px-1.5 py-1 text-xs text-zinc-900 hover:border-zinc-200 focus:border-zinc-900 focus:bg-white focus:outline-none"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'seo' && (
          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-900">
                Search Engine Optimization &amp; Structured FAQs
              </span>
              <button
                type="button"
                disabled={regeneratingSection !== null}
                onClick={() => onRegenerateSection('seo')}
                className="inline-flex items-center gap-1 text-xs font-medium text-zinc-600 hover:text-zinc-900"
              >
                <RefreshCw
                  className={`h-3 w-3 ${regeneratingSection === 'seo' ? 'animate-spin' : ''}`}
                />
                <span>Regenerate SEO</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-zinc-700">SEO Product Title</label>
                <input
                  type="text"
                  value={listing.seo.seoTitle}
                  onChange={(e) => updateSeo({ seoTitle: e.target.value })}
                  className="mt-1 w-full rounded-md border border-zinc-200 px-3 py-2 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs">
                  <label className="font-medium text-zinc-700">Meta Title</label>
                  <span className="font-mono text-zinc-500 tabular-nums">
                    {listing.seo.metaTitle.length} chars
                  </span>
                </div>
                <input
                  type="text"
                  value={listing.seo.metaTitle}
                  onChange={(e) => updateSeo({ metaTitle: e.target.value })}
                  className="mt-1 w-full rounded-md border border-zinc-200 px-3 py-2 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs">
                <label className="font-medium text-zinc-700">Meta Description</label>
                <span className="font-mono text-zinc-500 tabular-nums">
                  {listing.seo.metaDescription.length} chars
                </span>
              </div>
              <textarea
                rows={2}
                value={listing.seo.metaDescription}
                onChange={(e) => updateSeo({ metaDescription: e.target.value })}
                className="mt-1 w-full rounded-md border border-zinc-200 px-3 py-2 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-zinc-700">URL Slug</label>
                <input
                  type="text"
                  value={listing.seo.urlSlug}
                  onChange={(e) => updateSeo({ urlSlug: e.target.value })}
                  className="mt-1 w-full rounded-md border border-zinc-200 px-3 py-2 font-mono text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700">Primary Keyword</label>
                <input
                  type="text"
                  value={listing.seo.primaryKeyword}
                  onChange={(e) => updateSeo({ primaryKeyword: e.target.value })}
                  className="mt-1 w-full rounded-md border border-zinc-200 px-3 py-2 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-zinc-700">
                  Secondary Keywords (comma-separated)
                </label>
                <input
                  type="text"
                  value={listing.seo.secondaryKeywords.join(', ')}
                  onChange={(e) =>
                    updateSeo({
                      secondaryKeywords: e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  className="mt-1 w-full rounded-md border border-zinc-200 px-3 py-2 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700">
                  Semantic Keywords (comma-separated)
                </label>
                <input
                  type="text"
                  value={listing.seo.semanticKeywords.join(', ')}
                  onChange={(e) =>
                    updateSeo({
                      semanticKeywords: e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  className="mt-1 w-full rounded-md border border-zinc-200 px-3 py-2 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700">
                Image Alt Text Suggestions
              </label>
              <textarea
                rows={2}
                value={listing.seo.imageAltTexts.join('\n')}
                onChange={(e) => updateSeo({ imageAltTexts: e.target.value.split('\n') })}
                className="mt-1 w-full rounded-md border border-zinc-200 px-3 py-2 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700">
                SEO Product Copy
              </label>
              <textarea
                rows={4}
                value={listing.seo.seoDescription}
                onChange={(e) => updateSeo({ seoDescription: e.target.value })}
                className="mt-1 w-full rounded-md border border-zinc-200 px-3 py-2 text-xs leading-relaxed text-zinc-900 focus:border-zinc-900 focus:outline-none"
              />
            </div>

            <div className="border-t border-zinc-200 pt-4">
              <div className="text-xs font-semibold text-zinc-900">
                Product FAQs ({listing.seo.faqs.length})
              </div>
              <div className="mt-2 space-y-3">
                {listing.seo.faqs.map((faq, idx) => (
                  <div key={idx} className="rounded-lg border border-zinc-200 p-3">
                    <input
                      type="text"
                      value={faq.question}
                      onChange={(e) =>
                        onUpdateListing((prev) => {
                          const nextFaqs = [...prev.seo.faqs];
                          nextFaqs[idx] = { ...nextFaqs[idx], question: e.target.value };
                          return { ...prev, seo: { ...prev.seo, faqs: nextFaqs } };
                        })
                      }
                      className="w-full text-xs font-semibold text-zinc-900 focus:outline-none"
                    />
                    <textarea
                      rows={2}
                      value={faq.answer}
                      onChange={(e) =>
                        onUpdateListing((prev) => {
                          const nextFaqs = [...prev.seo.faqs];
                          nextFaqs[idx] = { ...nextFaqs[idx], answer: e.target.value };
                          return { ...prev, seo: { ...prev.seo, faqs: nextFaqs } };
                        })
                      }
                      className="mt-1 w-full text-xs text-zinc-600 focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'marketplace' && (
          <div className="mt-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3.5">
              <div>
                <div className="text-xs font-semibold text-zinc-900">
                  {listing.marketplaceListing.marketplaceLabel} Format
                </div>
                <p className="mt-0.5 text-xs text-zinc-600">
                  {listing.marketplaceListing.policyNotice}
                </p>
              </div>
              <button
                type="button"
                disabled={regeneratingSection !== null}
                onClick={() => onRegenerateSection('marketplaceListing')}
                className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
              >
                <RefreshCw
                  className={`h-3 w-3 ${
                    regeneratingSection === 'marketplaceListing' ? 'animate-spin' : ''
                  }`}
                />
                <span>Regenerate Format</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700">Marketplace Title</label>
              <input
                type="text"
                value={listing.marketplaceListing.title}
                onChange={(e) =>
                  onUpdateListing((prev) => ({
                    ...prev,
                    marketplaceListing: {
                      ...prev.marketplaceListing,
                      title: e.target.value,
                    },
                  }))
                }
                className="mt-1 w-full rounded-md border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-900 focus:border-zinc-900 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-zinc-700">Category Path</label>
                <input
                  type="text"
                  value={listing.marketplaceListing.categoryPath}
                  onChange={(e) =>
                    onUpdateListing((prev) => ({
                      ...prev,
                      marketplaceListing: {
                        ...prev.marketplaceListing,
                        categoryPath: e.target.value,
                      },
                    }))
                  }
                  className="mt-1 w-full rounded-md border border-zinc-200 px-3 py-2 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700">
                  Search Keywords / Backend Tags
                </label>
                <input
                  type="text"
                  value={listing.marketplaceListing.searchKeywords.join(', ')}
                  onChange={(e) =>
                    onUpdateListing((prev) => ({
                      ...prev,
                      marketplaceListing: {
                        ...prev.marketplaceListing,
                        searchKeywords: e.target.value
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean),
                      },
                    }))
                  }
                  className="mt-1 w-full rounded-md border border-zinc-200 px-3 py-2 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700">
                Marketplace Bullets
              </label>
              <textarea
                rows={5}
                value={listing.marketplaceListing.bulletPoints.join('\n')}
                onChange={(e) =>
                  onUpdateListing((prev) => ({
                    ...prev,
                    marketplaceListing: {
                      ...prev.marketplaceListing,
                      bulletPoints: e.target.value.split('\n'),
                    },
                  }))
                }
                className="mt-1 w-full rounded-md border border-zinc-200 px-3 py-2 text-xs leading-relaxed text-zinc-900 focus:border-zinc-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700">
                Marketplace Long Description
              </label>
              <textarea
                rows={5}
                value={listing.marketplaceListing.longDescription}
                onChange={(e) =>
                  onUpdateListing((prev) => ({
                    ...prev,
                    marketplaceListing: {
                      ...prev.marketplaceListing,
                      longDescription: e.target.value,
                    },
                  }))
                }
                className="mt-1 w-full rounded-md border border-zinc-200 px-3 py-2 text-xs leading-relaxed text-zinc-900 focus:border-zinc-900 focus:outline-none"
              />
            </div>
          </div>
        )}

        {activeTab === 'preview' && <StorefrontPreview listing={listing} images={images} />}
      </div>
    </section>
  );
}
