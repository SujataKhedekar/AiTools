import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Columns2,
  Eye,
  EyeOff,
  Loader2,
  Maximize2,
  Monitor,
  Plus,
  Redo2,
  RefreshCw,
  Smartphone,
  Tablet,
  Trash2,
  Undo2,
  Upload,
  X,
} from 'lucide-react';
import { DESIGN_STYLE_METADATA } from '../data/presets';
import type {
  CtaSuite,
  DesignConfig,
  DesignStyleId,
  GeneratedLandingPage,
  PageSection,
  SectionType,
} from '../types/aivora';
import { LandingPagePreview } from './LandingPagePreview';

interface PageEditorProps {
  page: GeneratedLandingPage;
  onUpdateSections: (sections: PageSection[], pushHistory?: boolean) => void;
  onUpdateDesign: (design: DesignConfig, pushHistory?: boolean) => void;
  onRegenerateSection: (sectionId: string, direction?: string) => Promise<void>;
  regeneratingSectionId: string | null;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

const ALL_SECTION_TYPES: { type: SectionType; label: string }[] = [
  { type: 'hero', label: 'Hero Section' },
  { type: 'problem', label: 'Problem Section' },
  { type: 'solution', label: 'Solution Section' },
  { type: 'features', label: 'Features & Benefits' },
  { type: 'how_it_works', label: 'How It Works' },
  { type: 'why_choose_us', label: 'Why Choose Us' },
  { type: 'social_proof', label: 'Social Proof (Verified Only)' },
  { type: 'pricing', label: 'Pricing (Verified Only)' },
  { type: 'faq', label: 'FAQ Section' },
  { type: 'final_cta', label: 'Final CTA Section' },
  { type: 'footer', label: 'Footer' },
];

export function PageEditor({
  page,
  onUpdateSections,
  onUpdateDesign,
  onRegenerateSection,
  regeneratingSectionId,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: PageEditorProps) {
  const [leftTab, setLeftTab] = useState<'sections' | 'design' | 'ctas'>('sections');
  const [selectedSectionId, setSelectedSectionId] = useState<string>(
    page.sections[0]?.id || ''
  );
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [sectionOnlyMode, setSectionOnlyMode] = useState(false);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [compareStyleId, setCompareStyleId] = useState<DesignStyleId>('premium-luxury');
  const [regenDirection, setRegenDirection] = useState('');
  const [addSectionType, setAddSectionType] = useState<SectionType>('why_choose_us');

  const selectedSection =
    page.sections.find((s) => s.id === selectedSectionId) || page.sections[0] || null;

  function patchSection(id: string, patch: Partial<PageSection>) {
    const next = page.sections.map((s) =>
      s.id === id ? { ...s, ...patch, userEdited: true } : s
    );
    onUpdateSections(next);
  }

  function moveSection(index: number, delta: -1 | 1) {
    const target = index + delta;
    if (target < 0 || target >= page.sections.length) return;
    const copy = [...page.sections];
    const [moved] = copy.splice(index, 1);
    copy.splice(target, 0, moved);
    onUpdateSections(copy);
  }

  function addSection() {
    const newId = `sec-${addSectionType}-${Date.now()}`;
    const label =
      ALL_SECTION_TYPES.find((t) => t.type === addSectionType)?.label || addSectionType;
    const created: PageSection = {
      id: newId,
      type: addSectionType,
      enabled: true,
      navLabel: label.replace(' Section', ''),
      headline: `${label} for ${page.brief.businessName}`,
      description: `Explain how ${page.brief.productName} addresses this area for ${page.brief.targetAudience}.`,
      items:
        addSectionType === 'features' ||
        addSectionType === 'how_it_works' ||
        addSectionType === 'why_choose_us'
          ? [
              {
                id: `${newId}-1`,
                title: 'First Key Point',
                description: 'Describe the specific capability or step here.',
                stepNumber: addSectionType === 'how_it_works' ? '01' : undefined,
              },
            ]
          : undefined,
      faqs:
        addSectionType === 'faq'
          ? [
              {
                id: `${newId}-faq-1`,
                question: 'What should customers know before starting?',
                answer: 'Provide a clear, factual answer based on your actual process.',
              },
            ]
          : undefined,
      testimonials:
        addSectionType === 'social_proof' ? page.brief.verifiedTestimonials : undefined,
      stats: addSectionType === 'social_proof' ? page.brief.verifiedStats : undefined,
      clientLogos:
        addSectionType === 'social_proof' ? page.brief.verifiedClientLogos : undefined,
      pricingPlans:
        addSectionType === 'pricing' ? page.brief.verifiedPricingPlans : undefined,
      userEdited: true,
    };
    const footerIdx = page.sections.findIndex((s) => s.type === 'footer');
    const copy = [...page.sections];
    if (footerIdx >= 0 && addSectionType !== 'footer') {
      copy.splice(footerIdx, 0, created);
    } else {
      copy.push(created);
    }
    onUpdateSections(copy);
    setSelectedSectionId(newId);
  }

  function removeSection(id: string) {
    if (page.sections.length <= 1) return;
    const filtered = page.sections.filter((s) => s.id !== id);
    onUpdateSections(filtered);
    if (selectedSectionId === id && filtered[0]) {
      setSelectedSectionId(filtered[0].id);
    }
  }

  function handleSectionImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!selectedSection) return;
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        patchSection(selectedSection.id, { imageUrl: reader.result });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  function applyDesignPreset(styleId: DesignStyleId) {
    const meta = DESIGN_STYLE_METADATA[styleId];
    onUpdateDesign({
      ...page.design,
      styleId,
      ...meta.defaults,
      primaryColor: meta.fallbackPalette.primary,
      secondaryColor: meta.fallbackPalette.secondary,
    });
  }

  function buildCompareDesign(styleId: DesignStyleId): DesignConfig {
    const meta = DESIGN_STYLE_METADATA[styleId];
    return {
      ...page.design,
      styleId,
      ...meta.defaults,
      primaryColor: meta.fallbackPalette.primary,
      secondaryColor: meta.fallbackPalette.secondary,
    };
  }

  function applyCtaToHeroOrFinal(
    target: 'hero' | 'final_cta',
    text: string,
    destination: string
  ) {
    const targetSec = page.sections.find((s) => s.type === target);
    if (!targetSec) return;
    patchSection(targetSec.id, {
      primaryCtaText: text,
      primaryCtaDestination: destination,
    });
  }

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-5">
      {/* Workspace Toolbar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-2.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!canUndo}
            onClick={onUndo}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
          >
            <Undo2 className="h-3.5 w-3.5" /> Undo
          </button>
          <button
            type="button"
            disabled={!canRedo}
            onClick={onRedo}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
          >
            <Redo2 className="h-3.5 w-3.5" /> Redo
          </button>
          <span className="hidden sm:inline text-xs text-slate-400 pl-2">
            Edits in one section are preserved when regenerating another
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Responsive Viewport Controls */}
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setViewport('desktop')}
              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium cursor-pointer ${
                viewport === 'desktop' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600'
              }`}
            >
              <Monitor className="h-3.5 w-3.5" /> Desktop
            </button>
            <button
              type="button"
              onClick={() => setViewport('tablet')}
              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium cursor-pointer ${
                viewport === 'tablet' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600'
              }`}
            >
              <Tablet className="h-3.5 w-3.5" /> Tablet
            </button>
            <button
              type="button"
              onClick={() => setViewport('mobile')}
              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium cursor-pointer ${
                viewport === 'mobile' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600'
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" /> Mobile
            </button>
          </div>

          <button
            type="button"
            onClick={() => setSectionOnlyMode((v) => !v)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium cursor-pointer ${
              sectionOnlyMode
                ? 'border-blue-700 bg-blue-50 text-blue-800'
                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {sectionOnlyMode ? 'Single Section View' : 'Full Page View'}
          </button>

          <button
            type="button"
            onClick={() => setCompareMode((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium cursor-pointer ${
              compareMode
                ? 'border-blue-700 bg-blue-50 text-blue-800'
                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Columns2 className="h-3.5 w-3.5" /> Compare Styles
          </button>

          <button
            type="button"
            onClick={() => setFullscreenOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <Maximize2 className="h-3.5 w-3.5" /> Fullscreen
          </button>
        </div>
      </div>

      {/* Main Split Editor + Live Preview */}
      <div className="grid gap-5 lg:grid-cols-12">
        {/* Left Sidebar Editor */}
        <aside className="rounded-xl border border-slate-200 bg-white lg:col-span-4 flex flex-col max-h-[82vh]">
          <div className="grid grid-cols-3 gap-1 border-b border-slate-200 p-2 bg-slate-50 rounded-t-xl">
            <button
              type="button"
              onClick={() => setLeftTab('sections')}
              className={`rounded-md py-1.5 text-xs font-semibold cursor-pointer ${
                leftTab === 'sections' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600'
              }`}
            >
              Sections
            </button>
            <button
              type="button"
              onClick={() => setLeftTab('design')}
              className={`rounded-md py-1.5 text-xs font-semibold cursor-pointer ${
                leftTab === 'design' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600'
              }`}
            >
              Design UI
            </button>
            <button
              type="button"
              onClick={() => setLeftTab('ctas')}
              className={`rounded-md py-1.5 text-xs font-semibold cursor-pointer ${
                leftTab === 'ctas' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600'
              }`}
            >
              CTA Studio
            </button>
          </div>

          <div className="overflow-y-auto p-4 space-y-5 flex-1">
            {leftTab === 'sections' && (
              <>
                {/* Section Order List */}
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-slate-500">Page Sections</p>
                  {page.sections.map((sec, idx) => (
                    <div
                      key={sec.id}
                      className={`flex items-center justify-between gap-2 rounded-lg border px-2.5 py-2 text-xs ${
                        selectedSection?.id === sec.id
                          ? 'border-blue-600 bg-blue-50/50'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedSectionId(sec.id)}
                        className="flex-1 text-left font-medium text-slate-900 truncate cursor-pointer"
                      >
                        {sec.navLabel}
                        {sec.userEdited ? ' · Edited' : ''}
                      </button>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          aria-label="Toggle section visibility"
                          onClick={() => patchSection(sec.id, { enabled: !sec.enabled })}
                          className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
                        >
                          {sec.enabled ? (
                            <Eye className="h-3.5 w-3.5" />
                          ) : (
                            <EyeOff className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          aria-label="Move up"
                          disabled={idx === 0}
                          onClick={() => moveSection(idx, -1)}
                          className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label="Move down"
                          disabled={idx === page.sections.length - 1}
                          onClick={() => moveSection(idx, 1)}
                          className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label="Remove section"
                          onClick={() => removeSection(sec.id)}
                          className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Add Section */}
                  <div className="flex items-center gap-2 pt-2">
                    <select
                      value={addSectionType}
                      onChange={(e) => setAddSectionType(e.target.value as SectionType)}
                      className="h-8 flex-1 rounded-lg border border-slate-300 bg-white px-2 text-xs"
                    >
                      {ALL_SECTION_TYPES.map((t) => (
                        <option key={t.type} value={t.type}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={addSection}
                      className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-300 bg-slate-900 px-3 text-xs font-medium text-white hover:bg-slate-800 cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add
                    </button>
                  </div>
                </div>

                {/* Selected Section Inspector */}
                {selectedSection && (
                  <div className="border-t border-slate-200 pt-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-slate-950">
                        Edit: {selectedSection.navLabel}
                      </h3>
                      <button
                        type="button"
                        disabled={regeneratingSectionId === selectedSection.id}
                        onClick={() =>
                          onRegenerateSection(selectedSection.id, regenDirection.trim() || undefined)
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800 hover:bg-blue-100 disabled:opacity-50 cursor-pointer"
                      >
                        {regeneratingSectionId === selectedSection.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3.5 w-3.5" />
                        )}
                        <span>Regenerate</span>
                      </button>
                    </div>

                    <input
                      type="text"
                      placeholder="Optional direction for AI regeneration..."
                      value={regenDirection}
                      onChange={(e) => setRegenDirection(e.target.value)}
                      className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs"
                    />

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Navigation Label
                      </label>
                      <input
                        type="text"
                        value={selectedSection.navLabel}
                        onChange={(e) =>
                          patchSection(selectedSection.id, { navLabel: e.target.value })
                        }
                        className="h-9 w-full rounded-lg border border-slate-300 px-2.5 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Headline
                      </label>
                      <textarea
                        rows={2}
                        value={selectedSection.headline}
                        onChange={(e) =>
                          patchSection(selectedSection.id, { headline: e.target.value })
                        }
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs font-medium"
                      />
                    </div>

                    {selectedSection.type === 'hero' && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          Supporting Subheadline
                        </label>
                        <input
                          type="text"
                          value={selectedSection.subheadline || ''}
                          onChange={(e) =>
                            patchSection(selectedSection.id, { subheadline: e.target.value })
                          }
                          className="h-9 w-full rounded-lg border border-slate-300 px-2.5 text-xs"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Description
                      </label>
                      <textarea
                        rows={3}
                        value={selectedSection.description}
                        onChange={(e) =>
                          patchSection(selectedSection.id, { description: e.target.value })
                        }
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs"
                      />
                    </div>

                    {(selectedSection.type === 'hero' || selectedSection.type === 'final_cta') && (
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">
                            CTA Text
                          </label>
                          <input
                            type="text"
                            value={selectedSection.primaryCtaText || ''}
                            onChange={(e) =>
                              patchSection(selectedSection.id, {
                                primaryCtaText: e.target.value,
                              })
                            }
                            className="h-8 w-full rounded-lg border border-slate-300 px-2 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">
                            CTA Destination
                          </label>
                          <input
                            type="text"
                            value={selectedSection.primaryCtaDestination || ''}
                            onChange={(e) =>
                              patchSection(selectedSection.id, {
                                primaryCtaDestination: e.target.value,
                              })
                            }
                            className="h-8 w-full rounded-lg border border-slate-300 px-2 text-xs"
                          />
                        </div>
                      </div>
                    )}

                    {selectedSection.type === 'hero' && (
                      <div className="space-y-2 border-t border-slate-100 pt-3">
                        <label className="block text-xs font-semibold text-slate-600">
                          Section Image &amp; Alt Text
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={
                              selectedSection.imageUrl?.startsWith('data:')
                                ? 'Uploaded custom image'
                                : selectedSection.imageUrl || ''
                            }
                            onChange={(e) =>
                              patchSection(selectedSection.id, { imageUrl: e.target.value })
                            }
                            placeholder="Image URL"
                            className="h-8 flex-1 rounded-lg border border-slate-300 px-2 text-xs"
                          />
                          <label className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-lg border border-slate-300 px-2.5 text-xs font-medium hover:bg-slate-50">
                            <Upload className="h-3.5 w-3.5" />
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleSectionImageUpload}
                            />
                          </label>
                        </div>
                        <input
                          type="text"
                          value={selectedSection.imageAlt || ''}
                          onChange={(e) =>
                            patchSection(selectedSection.id, { imageAlt: e.target.value })
                          }
                          placeholder="Descriptive image alt text"
                          className="h-8 w-full rounded-lg border border-slate-300 px-2 text-xs"
                        />
                      </div>
                    )}

                    {/* Items Editor */}
                    {selectedSection.items && selectedSection.items.length > 0 && (
                      <div className="space-y-2 border-t border-slate-100 pt-3">
                        <p className="text-xs font-semibold text-slate-600">Section Items</p>
                        {selectedSection.items.map((item, itemIdx) => (
                          <div
                            key={item.id}
                            className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 space-y-1.5"
                          >
                            <input
                              type="text"
                              value={item.title}
                              onChange={(e) => {
                                const updated = selectedSection.items!.map((it, i) =>
                                  i === itemIdx ? { ...it, title: e.target.value } : it
                                );
                                patchSection(selectedSection.id, { items: updated });
                              }}
                              className="h-7 w-full rounded border border-slate-300 bg-white px-2 text-xs font-semibold"
                            />
                            <textarea
                              rows={2}
                              value={item.description}
                              onChange={(e) => {
                                const updated = selectedSection.items!.map((it, i) =>
                                  i === itemIdx ? { ...it, description: e.target.value } : it
                                );
                                patchSection(selectedSection.id, { items: updated });
                              }}
                              className="w-full rounded border border-slate-300 bg-white p-1.5 text-xs"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* FAQs Editor */}
                    {selectedSection.faqs && selectedSection.faqs.length > 0 && (
                      <div className="space-y-2 border-t border-slate-100 pt-3">
                        <p className="text-xs font-semibold text-slate-600">FAQ Items</p>
                        {selectedSection.faqs.map((faq, fIdx) => (
                          <div
                            key={faq.id}
                            className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 space-y-1.5"
                          >
                            <input
                              type="text"
                              value={faq.question}
                              onChange={(e) => {
                                const updated = selectedSection.faqs!.map((f, i) =>
                                  i === fIdx ? { ...f, question: e.target.value } : f
                                );
                                patchSection(selectedSection.id, { faqs: updated });
                              }}
                              className="h-7 w-full rounded border border-slate-300 bg-white px-2 text-xs font-semibold"
                            />
                            <textarea
                              rows={2}
                              value={faq.answer}
                              onChange={(e) => {
                                const updated = selectedSection.faqs!.map((f, i) =>
                                  i === fIdx ? { ...f, answer: e.target.value } : f
                                );
                                patchSection(selectedSection.id, { faqs: updated });
                              }}
                              className="w-full rounded border border-slate-300 bg-white p-1.5 text-xs"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {leftTab === 'design' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Design Style Preset
                  </label>
                  <select
                    value={page.design.styleId}
                    onChange={(e) => applyDesignPreset(e.target.value as DesignStyleId)}
                    className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-medium"
                  >
                    {Object.entries(DESIGN_STYLE_METADATA).map(([id, meta]) => (
                      <option key={id} value={id}>
                        {meta.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Primary Accent
                    </label>
                    <input
                      type="color"
                      value={page.design.primaryColor}
                      onChange={(e) =>
                        onUpdateDesign({ ...page.design, primaryColor: e.target.value })
                      }
                      className="h-9 w-full cursor-pointer rounded border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Page Background
                    </label>
                    <input
                      type="color"
                      value={page.design.backgroundColor}
                      onChange={(e) =>
                        onUpdateDesign({ ...page.design, backgroundColor: e.target.value })
                      }
                      className="h-9 w-full cursor-pointer rounded border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Surface Band
                    </label>
                    <input
                      type="color"
                      value={page.design.surfaceColor}
                      onChange={(e) =>
                        onUpdateDesign({ ...page.design, surfaceColor: e.target.value })
                      }
                      className="h-9 w-full cursor-pointer rounded border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Text Color
                    </label>
                    <input
                      type="color"
                      value={page.design.textColor}
                      onChange={(e) =>
                        onUpdateDesign({ ...page.design, textColor: e.target.value })
                      }
                      className="h-9 w-full cursor-pointer rounded border border-slate-300"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Heading Font
                    </label>
                    <select
                      value={page.design.headingFont}
                      onChange={(e) =>
                        onUpdateDesign({
                          ...page.design,
                          headingFont: e.target.value as DesignConfig['headingFont'],
                        })
                      }
                      className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2 text-xs"
                    >
                      <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
                      <option value="Outfit">Outfit</option>
                      <option value="Playfair Display">Playfair Display</option>
                      <option value="Fraunces">Fraunces</option>
                      <option value="Manrope">Manrope</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Body Font
                    </label>
                    <select
                      value={page.design.bodyFont}
                      onChange={(e) =>
                        onUpdateDesign({
                          ...page.design,
                          bodyFont: e.target.value as DesignConfig['bodyFont'],
                        })
                      }
                      className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2 text-xs"
                    >
                      <option value="DM Sans">DM Sans</option>
                      <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
                      <option value="Public Sans">Public Sans</option>
                      <option value="Manrope">Manrope</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Buttons
                    </label>
                    <select
                      value={page.design.buttonStyle}
                      onChange={(e) =>
                        onUpdateDesign({
                          ...page.design,
                          buttonStyle: e.target.value as DesignConfig['buttonStyle'],
                        })
                      }
                      className="h-8 w-full rounded border border-slate-300 bg-white px-1.5 text-xs"
                    >
                      <option value="sharp">Sharp</option>
                      <option value="rounded">Rounded</option>
                      <option value="pill">Pill</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Radius
                    </label>
                    <select
                      value={page.design.borderRadius}
                      onChange={(e) =>
                        onUpdateDesign({
                          ...page.design,
                          borderRadius: e.target.value as DesignConfig['borderRadius'],
                        })
                      }
                      className="h-8 w-full rounded border border-slate-300 bg-white px-1.5 text-xs"
                    >
                      <option value="none">None</option>
                      <option value="sm">Small</option>
                      <option value="md">Medium</option>
                      <option value="lg">Large</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Spacing
                    </label>
                    <select
                      value={page.design.spacingScale}
                      onChange={(e) =>
                        onUpdateDesign({
                          ...page.design,
                          spacingScale: e.target.value as DesignConfig['spacingScale'],
                        })
                      }
                      className="h-8 w-full rounded border border-slate-300 bg-white px-1.5 text-xs"
                    >
                      <option value="compact">Compact</option>
                      <option value="balanced">Balanced</option>
                      <option value="airy">Airy</option>
                    </select>
                  </div>
                </div>

                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={page.design.stickyMobileCta}
                    onChange={(e) =>
                      onUpdateDesign({
                        ...page.design,
                        stickyMobileCta: e.target.checked,
                      })
                    }
                  />
                  Show sticky mobile CTA bar on mobile preview
                </label>
              </div>
            )}

            {leftTab === 'ctas' && <CtaDrawer ctaSuite={page.ctaSuite} onApply={applyCtaToHeroOrFinal} />}
          </div>
        </aside>

        {/* Right Live Responsive Preview Canvas */}
        <div className="lg:col-span-8">
          {compareMode ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5">
                <span className="text-xs font-semibold text-slate-700">
                  Side-by-Side Variation Comparison: {DESIGN_STYLE_METADATA[page.design.styleId].label} vs.
                </span>
                <select
                  value={compareStyleId}
                  onChange={(e) => setCompareStyleId(e.target.value as DesignStyleId)}
                  className="h-8 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-medium"
                >
                  {Object.entries(DESIGN_STYLE_METADATA).map(([id, meta]) => (
                    <option key={id} value={id}>
                      {meta.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="h-[74vh] overflow-y-auto rounded-xl border border-slate-300 bg-white shadow-sm">
                  <LandingPagePreview
                    brief={page.brief}
                    sections={page.sections}
                    design={page.design}
                    viewport="tablet"
                    selectedSectionId={selectedSection?.id}
                    onSelectSection={(id) => setSelectedSectionId(id)}
                  />
                </div>
                <div className="h-[74vh] overflow-y-auto rounded-xl border border-slate-300 bg-white shadow-sm">
                  <LandingPagePreview
                    brief={page.brief}
                    sections={page.sections}
                    design={buildCompareDesign(compareStyleId)}
                    viewport="tablet"
                    selectedSectionId={selectedSection?.id}
                    onSelectSection={(id) => setSelectedSectionId(id)}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center rounded-xl border border-slate-200 bg-slate-200/70 p-4 min-h-[82vh] max-h-[82vh] overflow-y-auto">
              <div
                style={{
                  width:
                    viewport === 'desktop'
                      ? '100%'
                      : viewport === 'tablet'
                        ? '768px'
                        : '375px',
                }}
                className="overflow-y-auto rounded-lg border border-slate-300 bg-white shadow-sm transition-all duration-200"
              >
                <LandingPagePreview
                  brief={page.brief}
                  sections={page.sections}
                  design={page.design}
                  viewport={viewport}
                  selectedSectionId={selectedSection?.id}
                  sectionOnlyMode={sectionOnlyMode}
                  onSelectSection={(id) => setSelectedSectionId(id)}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Preview Modal */}
      {fullscreenOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/75 p-4">
          <div className="mb-3 flex items-center justify-between rounded-xl bg-white px-4 py-2.5">
            <span className="text-sm font-semibold text-slate-950">
              Full-Page Preview — {page.brief.businessName} ({viewport})
            </span>
            <button
              type="button"
              onClick={() => setFullscreenOpen(false)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <X className="h-4 w-4" /> Close
            </button>
          </div>
          <div className="flex-1 overflow-y-auto rounded-xl bg-white">
            <LandingPagePreview
              brief={page.brief}
              sections={page.sections}
              design={page.design}
              viewport={viewport}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function CtaDrawer({
  ctaSuite,
  onApply,
}: {
  ctaSuite: CtaSuite;
  onApply: (target: 'hero' | 'final_cta', text: string, destination: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs space-y-1">
        <p className="font-semibold text-slate-900">Objective Alignment</p>
        <p className="text-slate-600">{ctaSuite.objectiveAlignment}</p>
        <p className="text-slate-500 pt-1">{ctaSuite.complianceNote}</p>
      </div>

      {ctaSuite.slots.map((slot) => (
        <div key={slot.slot} className="rounded-lg border border-slate-200 p-3 space-y-2">
          <p className="text-xs font-bold text-slate-900">{slot.slot}</p>
          <div className="rounded-md bg-slate-50 p-2.5 text-xs space-y-1">
            <p className="font-semibold text-blue-800">{slot.recommended.text}</p>
            <p className="text-slate-600">
              Placement: {slot.recommended.placement} · Action: {slot.recommended.intendedAction}
            </p>
            <p className="text-slate-500">{slot.recommended.supportingMessage}</p>
            <div className="flex gap-2 pt-1.5">
              <button
                type="button"
                onClick={() =>
                  onApply('hero', slot.recommended.text, slot.recommended.destination)
                }
                className="rounded border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium hover:bg-slate-100 cursor-pointer"
              >
                Apply to Hero
              </button>
              <button
                type="button"
                onClick={() =>
                  onApply('final_cta', slot.recommended.text, slot.recommended.destination)
                }
                className="rounded border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium hover:bg-slate-100 cursor-pointer"
              >
                Apply to Final CTA
              </button>
            </div>
          </div>

          {slot.variations.length > 0 && (
            <div className="space-y-1 pt-1">
              <p className="text-[11px] font-semibold text-slate-500">Variations</p>
              {slot.variations.map((v, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-2 text-xs border-t border-slate-100 pt-1.5"
                >
                  <span className="font-medium text-slate-800 truncate">{v.text}</span>
                  <button
                    type="button"
                    onClick={() => onApply('hero', v.text, v.destination)}
                    className="text-[11px] font-semibold text-blue-700 hover:underline shrink-0 cursor-pointer"
                  >
                    Use in Hero
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
