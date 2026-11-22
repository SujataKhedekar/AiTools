import React, { useState } from 'react';
import { Globe, Loader2, Plus, Trash2, Upload } from 'lucide-react';
import { DESIGN_STYLE_METADATA, INDUSTRY_PRESETS } from '../data/presets';
import type {
  BusinessBrief,
  BusinessUrlAnalysis,
  DesignStyleId,
  FormKind,
  LandingPageObjective,
} from '../types/aivora';

interface BriefBuilderProps {
  brief: BusinessBrief;
  onChange: (next: BusinessBrief) => void;
  onAnalyzeUrl: (url: string) => Promise<void>;
  urlAnalysis: BusinessUrlAnalysis | null;
  isAnalyzingUrl: boolean;
  validationErrors: string[];
  onResetEmpty: () => void;
}

const OBJECTIVES: LandingPageObjective[] = [
  'Generate leads',
  'Sell products',
  'Book appointments',
  'Get consultation requests',
  'Promote a service',
  'Launch a product',
  'Collect email subscribers',
  'Promote an event',
  'Download resources',
  'Generate enquiries',
];

export function BriefBuilder({
  brief,
  onChange,
  onAnalyzeUrl,
  urlAnalysis,
  isAnalyzingUrl,
  validationErrors,
  onResetEmpty,
}: BriefBuilderProps) {
  const [secondaryKwInput, setSecondaryKwInput] = useState(
    brief.secondaryKeywords.join(', ')
  );
  const [competitorInput, setCompetitorInput] = useState(
    brief.competitorUrls.join(', ')
  );
  const [logoInput, setLogoInput] = useState(brief.verifiedClientLogos.join(', '));
  const [refImageInput, setRefImageInput] = useState('');

  function handlePresetSelect(presetId: string) {
    const found = INDUSTRY_PRESETS.find((p) => p.id === presetId);
    if (!found) return;
    const cloned = structuredClone(found.brief);
    onChange(cloned);
    setSecondaryKwInput(cloned.secondaryKeywords.join(', '));
    setCompetitorInput(cloned.competitorUrls.join(', '));
    setLogoInput(cloned.verifiedClientLogos.join(', '));
  }

  function updateField<K extends keyof BusinessBrief>(key: K, value: BusinessBrief[K]) {
    onChange({ ...brief, [key]: value });
  }

  function handleImageUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'logo' | 'reference'
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result) return;
      if (target === 'logo') {
        updateField('brandLogoUrl', result);
      } else {
        updateField('referenceImageUrls', [...brief.referenceImageUrls, result]);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  function addTestimonial() {
    updateField('verifiedTestimonials', [
      ...brief.verifiedTestimonials,
      {
        id: `t-${Date.now()}`,
        quote: '',
        authorName: '',
        authorRole: '',
        company: '',
        rating: 5,
      },
    ]);
  }

  function addStat() {
    updateField('verifiedStats', [
      ...brief.verifiedStats,
      { id: `s-${Date.now()}`, value: '', label: '', context: '' },
    ]);
  }

  function addPricingPlan() {
    updateField('verifiedPricingPlans', [
      ...brief.verifiedPricingPlans,
      {
        id: `p-${Date.now()}`,
        name: '',
        targetAudience: '',
        price: '',
        billingCycle: 'per month',
        features: [''],
        ctaText: 'Get Started',
        isHighlighted: false,
      },
    ]);
  }

  return (
    <div className="mx-auto max-w-[1220px] px-6 py-8">
      {/* Page intro + 8 Industry Benchmark Presets */}
      <div className="mb-8 flex flex-col gap-5 border-b border-slate-200 pb-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">
              Landing Page Input &amp; Business Discovery
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Supply verified business details or analyze an existing URL. AIVORA never invents pricing, testimonials, or unconfirmed offers.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              onResetEmpty();
              setSecondaryKwInput('');
              setCompetitorInput('');
              setLogoInput('');
            }}
            className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap cursor-pointer"
          >
            Clear All Fields
          </button>
        </div>

        <div>
          <p className="mb-2.5 text-xs font-semibold text-slate-500">
            Load Industry Benchmark Preset (8 Test Scenarios)
          </p>
          <div className="flex flex-wrap gap-2">
            {INDUSTRY_PRESETS.map((preset) => {
              const isSelected = brief.businessName === preset.brief.businessName;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handlePresetSelect(preset.id)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? 'border-blue-700 bg-blue-50 text-blue-800'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Missing Critical Details / Validation Feedback */}
      {validationErrors.length > 0 && (
        <div
          role="alert"
          className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"
        >
          <p className="font-semibold">Missing critical business details</p>
          <p className="mt-1 text-xs text-amber-900">
            Please supply the items below before generating a strategy (AIVORA will not fabricate missing business facts):
          </p>
          <ul className="mt-2 list-disc pl-5 text-xs space-y-1">
            {validationErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Column: Business, Audience, SEO */}
        <div className="space-y-8 lg:col-span-7">
          {/* Website URL Auto-Analyzer */}
          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-base font-semibold text-slate-950">
              01. Automatic Website Analysis (Optional)
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Enter an existing site URL to extract factual positioning, offerings, and identify gaps.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Globe className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="url"
                  aria-label="Business website URL"
                  placeholder="https://yourcompany.com"
                  value={brief.websiteUrl}
                  onChange={(e) => updateField('websiteUrl', e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>
              <button
                type="button"
                disabled={!brief.websiteUrl.trim() || isAnalyzingUrl}
                onClick={() => onAnalyzeUrl(brief.websiteUrl.trim())}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-slate-900 px-4 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
              >
                {isAnalyzingUrl && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>{isAnalyzingUrl ? 'Analyzing...' : 'Analyze Website'}</span>
              </button>
            </div>

            {urlAnalysis && (
              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs space-y-2">
                <p className="font-semibold text-slate-900">
                  Analysis for {urlAnalysis.url}
                </p>
                <p className="text-slate-700">{urlAnalysis.extractedSummary}</p>
                {urlAnalysis.missingCriticalDetails.length > 0 && (
                  <div className="pt-1">
                    <p className="font-semibold text-amber-800">
                      Details not found on site (please confirm manually):
                    </p>
                    <ul className="mt-1 list-disc pl-4 text-slate-700 space-y-0.5">
                      {urlAnalysis.missingCriticalDetails.map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Business & Offer Core */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
            <h2 className="text-base font-semibold text-slate-950">
              02. Business &amp; Offer Details
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="b-name" className="block text-xs font-semibold text-slate-700 mb-1">
                  Business Name *
                </label>
                <input
                  id="b-name"
                  type="text"
                  value={brief.businessName}
                  onChange={(e) => updateField('businessName', e.target.value)}
                  placeholder="e.g., FlowLedger"
                  className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
                />
              </div>
              <div>
                <label htmlFor="b-cat" className="block text-xs font-semibold text-slate-700 mb-1">
                  Business Category *
                </label>
                <input
                  id="b-cat"
                  type="text"
                  value={brief.category}
                  onChange={(e) => updateField('category', e.target.value)}
                  placeholder="e.g., B2B SaaS / Physical Therapy Clinic"
                  className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="p-name" className="block text-xs font-semibold text-slate-700 mb-1">
                  Product or Service Name *
                </label>
                <input
                  id="p-name"
                  type="text"
                  value={brief.productName}
                  onChange={(e) => updateField('productName', e.target.value)}
                  placeholder="e.g., FlowLedger AP Suite"
                  className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
                />
              </div>
              <div>
                <label htmlFor="b-obj" className="block text-xs font-semibold text-slate-700 mb-1">
                  Primary Landing Page Objective *
                </label>
                <select
                  id="b-obj"
                  value={brief.objective}
                  onChange={(e) =>
                    updateField('objective', e.target.value as LandingPageObjective)
                  }
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
                >
                  {OBJECTIVES.map((obj) => (
                    <option key={obj} value={obj}>
                      {obj}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="p-desc" className="block text-xs font-semibold text-slate-700 mb-1">
                Product or Service Description *
              </label>
              <textarea
                id="p-desc"
                rows={3}
                value={brief.productDescription}
                onChange={(e) => updateField('productDescription', e.target.value)}
                placeholder="Describe concretely what your product or service does, who it serves, and how it works."
                className="w-full rounded-lg border border-slate-300 p-3 text-sm"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="b-aud" className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Audience *
                </label>
                <input
                  id="b-aud"
                  type="text"
                  value={brief.targetAudience}
                  onChange={(e) => updateField('targetAudience', e.target.value)}
                  placeholder="e.g., Controllers and VPs of Finance"
                  className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
                />
              </div>
              <div>
                <label htmlFor="b-loc" className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Country &amp; Location
                </label>
                <input
                  id="b-loc"
                  type="text"
                  value={brief.targetLocation}
                  onChange={(e) => updateField('targetLocation', e.target.value)}
                  placeholder="e.g., United States & Canada"
                  className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="b-usp" className="block text-xs font-semibold text-slate-700 mb-1">
                Unique Selling Proposition (USP)
              </label>
              <input
                id="b-usp"
                type="text"
                value={brief.usp}
                onChange={(e) => updateField('usp', e.target.value)}
                placeholder="What makes your offering verifiably different from alternatives?"
                className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
              />
            </div>
          </section>

          {/* SEO & Competitors */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
            <h2 className="text-base font-semibold text-slate-950">
              03. SEO Keywords &amp; Competitive Context
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="kw-1" className="block text-xs font-semibold text-slate-700 mb-1">
                  Primary Target Keyword
                </label>
                <input
                  id="kw-1"
                  type="text"
                  value={brief.primaryKeyword}
                  onChange={(e) => updateField('primaryKeyword', e.target.value)}
                  placeholder="e.g., accounts payable automation software"
                  className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
                />
              </div>
              <div>
                <label htmlFor="kw-2" className="block text-xs font-semibold text-slate-700 mb-1">
                  Secondary Keywords (comma-separated)
                </label>
                <input
                  id="kw-2"
                  type="text"
                  value={secondaryKwInput}
                  onChange={(e) => {
                    setSecondaryKwInput(e.target.value);
                    updateField(
                      'secondaryKeywords',
                      e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean)
                    );
                  }}
                  placeholder="three-way matching, ERP sync"
                  className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
                />
              </div>
            </div>
            <div>
              <label htmlFor="comp-urls" className="block text-xs font-semibold text-slate-700 mb-1">
                Competitor URLs (Optional, comma-separated)
              </label>
              <input
                id="comp-urls"
                type="text"
                value={competitorInput}
                onChange={(e) => {
                  setCompetitorInput(e.target.value);
                  updateField(
                    'competitorUrls',
                    e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean)
                  );
                }}
                placeholder="https://competitor1.com, https://competitor2.com"
                className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
              />
            </div>
          </section>

          {/* Verified Social Proof & Pricing */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 space-y-5">
            <div>
              <h2 className="text-base font-semibold text-slate-950">
                04. Verified Social Proof &amp; Pricing (Zero Fabrication)
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Social Proof and Pricing sections are only included when you provide verified testimonials, stats, client names, or real prices below.
              </p>
            </div>

            {/* Verified Testimonials */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">
                  Verified Testimonials ({brief.verifiedTestimonials.length})
                </span>
                <button
                  type="button"
                  onClick={addTestimonial}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Testimonial
                </button>
              </div>
              {brief.verifiedTestimonials.map((t, idx) => (
                <div
                  key={t.id}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2"
                >
                  <div className="flex items-start gap-2">
                    <textarea
                      rows={2}
                      placeholder="Verified customer quote"
                      value={t.quote}
                      onChange={(e) => {
                        const copy = [...brief.verifiedTestimonials];
                        copy[idx] = { ...t, quote: e.target.value };
                        updateField('verifiedTestimonials', copy);
                      }}
                      className="w-full rounded border border-slate-300 bg-white p-2 text-xs"
                    />
                    <button
                      type="button"
                      aria-label="Remove testimonial"
                      onClick={() =>
                        updateField(
                          'verifiedTestimonials',
                          brief.verifiedTestimonials.filter((_, i) => i !== idx)
                        )
                      }
                      className="p-1.5 text-slate-400 hover:text-red-600 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={t.authorName}
                      onChange={(e) => {
                        const copy = [...brief.verifiedTestimonials];
                        copy[idx] = { ...t, authorName: e.target.value };
                        updateField('verifiedTestimonials', copy);
                      }}
                      className="h-8 rounded border border-slate-300 bg-white px-2 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Role"
                      value={t.authorRole}
                      onChange={(e) => {
                        const copy = [...brief.verifiedTestimonials];
                        copy[idx] = { ...t, authorRole: e.target.value };
                        updateField('verifiedTestimonials', copy);
                      }}
                      className="h-8 rounded border border-slate-300 bg-white px-2 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Company"
                      value={t.company}
                      onChange={(e) => {
                        const copy = [...brief.verifiedTestimonials];
                        copy[idx] = { ...t, company: e.target.value };
                        updateField('verifiedTestimonials', copy);
                      }}
                      className="h-8 rounded border border-slate-300 bg-white px-2 text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Verified Stats */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">
                  Verified Outcome Metrics ({brief.verifiedStats.length})
                </span>
                <button
                  type="button"
                  onClick={addStat}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Metric
                </button>
              </div>
              {brief.verifiedStats.map((st, idx) => (
                <div
                  key={st.id}
                  className="grid gap-2 sm:grid-cols-12 items-center rounded-lg border border-slate-200 bg-slate-50 p-2.5"
                >
                  <input
                    type="text"
                    placeholder="Value (e.g., 48 hrs)"
                    value={st.value}
                    onChange={(e) => {
                      const copy = [...brief.verifiedStats];
                      copy[idx] = { ...st, value: e.target.value };
                      updateField('verifiedStats', copy);
                    }}
                    className="sm:col-span-3 h-8 rounded border border-slate-300 bg-white px-2 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Metric Label"
                    value={st.label}
                    onChange={(e) => {
                      const copy = [...brief.verifiedStats];
                      copy[idx] = { ...st, label: e.target.value };
                      updateField('verifiedStats', copy);
                    }}
                    className="sm:col-span-4 h-8 rounded border border-slate-300 bg-white px-2 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Sample/Timeframe context"
                    value={st.context}
                    onChange={(e) => {
                      const copy = [...brief.verifiedStats];
                      copy[idx] = { ...st, context: e.target.value };
                      updateField('verifiedStats', copy);
                    }}
                    className="sm:col-span-4 h-8 rounded border border-slate-300 bg-white px-2 text-xs"
                  />
                  <button
                    type="button"
                    aria-label="Remove metric"
                    onClick={() =>
                      updateField(
                        'verifiedStats',
                        brief.verifiedStats.filter((_, i) => i !== idx)
                      )
                    }
                    className="sm:col-span-1 justify-self-end p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Verified Client Logos */}
            <div>
              <label htmlFor="client-logos" className="block text-xs font-semibold text-slate-700 mb-1">
                Verified Client Names / Logos (comma-separated)
              </label>
              <input
                id="client-logos"
                type="text"
                value={logoInput}
                onChange={(e) => {
                  setLogoInput(e.target.value);
                  updateField(
                    'verifiedClientLogos',
                    e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean)
                  );
                }}
                placeholder="Company A, Company B"
                className="h-9 w-full rounded-lg border border-slate-300 px-3 text-xs"
              />
            </div>

            {/* Verified Pricing Plans */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">
                  Verified Pricing Plans ({brief.verifiedPricingPlans.length})
                </span>
                <button
                  type="button"
                  onClick={addPricingPlan}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Plan
                </button>
              </div>
              {brief.verifiedPricingPlans.map((plan, idx) => (
                <div
                  key={plan.id}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2"
                >
                  <div className="grid gap-2 sm:grid-cols-4">
                    <input
                      type="text"
                      placeholder="Plan Name"
                      value={plan.name}
                      onChange={(e) => {
                        const copy = [...brief.verifiedPricingPlans];
                        copy[idx] = { ...plan, name: e.target.value };
                        updateField('verifiedPricingPlans', copy);
                      }}
                      className="h-8 rounded border border-slate-300 bg-white px-2 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Price (e.g., $390)"
                      value={plan.price}
                      onChange={(e) => {
                        const copy = [...brief.verifiedPricingPlans];
                        copy[idx] = { ...plan, price: e.target.value };
                        updateField('verifiedPricingPlans', copy);
                      }}
                      className="h-8 rounded border border-slate-300 bg-white px-2 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Cycle (e.g., per month)"
                      value={plan.billingCycle}
                      onChange={(e) => {
                        const copy = [...brief.verifiedPricingPlans];
                        copy[idx] = { ...plan, billingCycle: e.target.value };
                        updateField('verifiedPricingPlans', copy);
                      }}
                      className="h-8 rounded border border-slate-300 bg-white px-2 text-xs"
                    />
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        placeholder="CTA Label"
                        value={plan.ctaText}
                        onChange={(e) => {
                          const copy = [...brief.verifiedPricingPlans];
                          copy[idx] = { ...plan, ctaText: e.target.value };
                          updateField('verifiedPricingPlans', copy);
                        }}
                        className="h-8 w-full rounded border border-slate-300 bg-white px-2 text-xs"
                      />
                      <button
                        type="button"
                        aria-label="Remove plan"
                        onClick={() =>
                          updateField(
                            'verifiedPricingPlans',
                            brief.verifiedPricingPlans.filter((_, i) => i !== idx)
                          )
                        }
                        className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder="Target audience (e.g., Teams processing up to 1,000 invoices)"
                    value={plan.targetAudience}
                    onChange={(e) => {
                      const copy = [...brief.verifiedPricingPlans];
                      copy[idx] = { ...plan, targetAudience: e.target.value };
                      updateField('verifiedPricingPlans', copy);
                    }}
                    className="h-8 w-full rounded border border-slate-300 bg-white px-2 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Included features (comma-separated)"
                    value={plan.features.join(', ')}
                    onChange={(e) => {
                      const copy = [...brief.verifiedPricingPlans];
                      copy[idx] = {
                        ...plan,
                        features: e.target.value
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean),
                      };
                      updateField('verifiedPricingPlans', copy);
                    }}
                    className="h-8 w-full rounded border border-slate-300 bg-white px-2 text-xs"
                  />
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Visual Brand, Offers, Form/CTA Destinations */}
        <div className="space-y-8 lg:col-span-5">
          <section className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
            <h2 className="text-base font-semibold text-slate-950">
              05. Design Direction &amp; Brand Assets
            </h2>

            <div>
              <label htmlFor="d-style" className="block text-xs font-semibold text-slate-700 mb-1">
                Preferred Design Style
              </label>
              <select
                id="d-style"
                value={brief.designStyle}
                onChange={(e) => {
                  const styleId = e.target.value as DesignStyleId;
                  const meta = DESIGN_STYLE_METADATA[styleId];
                  onChange({
                    ...brief,
                    designStyle: styleId,
                    brandColors: {
                      primary: meta.fallbackPalette.primary,
                      secondary: meta.fallbackPalette.secondary,
                      background: meta.fallbackPalette.background,
                    },
                  });
                }}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
              >
                {Object.entries(DESIGN_STYLE_METADATA).map(([id, meta]) => (
                  <option key={id} value={id}>
                    {meta.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-500">
                {DESIGN_STYLE_METADATA[brief.designStyle].summary}
              </p>
            </div>

            <div>
              <label htmlFor="b-tone" className="block text-xs font-semibold text-slate-700 mb-1">
                Preferred Tone of Voice
              </label>
              <input
                id="b-tone"
                type="text"
                value={brief.toneOfVoice}
                onChange={(e) => updateField('toneOfVoice', e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Primary Color
                </label>
                <div className="flex items-center gap-2 rounded-lg border border-slate-300 p-1.5">
                  <input
                    type="color"
                    value={brief.brandColors.primary}
                    onChange={(e) =>
                      updateField('brandColors', {
                        ...brief.brandColors,
                        primary: e.target.value,
                      })
                    }
                    className="h-6 w-7 cursor-pointer rounded border-0 bg-transparent p-0"
                  />
                  <span className="font-mono text-xs text-slate-700">
                    {brief.brandColors.primary}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Secondary
                </label>
                <div className="flex items-center gap-2 rounded-lg border border-slate-300 p-1.5">
                  <input
                    type="color"
                    value={brief.brandColors.secondary}
                    onChange={(e) =>
                      updateField('brandColors', {
                        ...brief.brandColors,
                        secondary: e.target.value,
                      })
                    }
                    className="h-6 w-7 cursor-pointer rounded border-0 bg-transparent p-0"
                  />
                  <span className="font-mono text-xs text-slate-700">
                    {brief.brandColors.secondary}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Canvas Bg
                </label>
                <div className="flex items-center gap-2 rounded-lg border border-slate-300 p-1.5">
                  <input
                    type="color"
                    value={brief.brandColors.background}
                    onChange={(e) =>
                      updateField('brandColors', {
                        ...brief.brandColors,
                        background: e.target.value,
                      })
                    }
                    className="h-6 w-7 cursor-pointer rounded border-0 bg-transparent p-0"
                  />
                  <span className="font-mono text-xs text-slate-700">
                    {brief.brandColors.background}
                  </span>
                </div>
              </div>
            </div>

            {/* Brand Logo */}
            <div>
              <span className="block text-xs font-semibold text-slate-700 mb-1.5">
                Brand Logo (Optional Upload or URL)
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="https://... or upload logo"
                  value={brief.brandLogoUrl.startsWith('data:') ? 'Uploaded image data' : brief.brandLogoUrl}
                  onChange={(e) => updateField('brandLogoUrl', e.target.value)}
                  className="h-9 flex-1 rounded-lg border border-slate-300 px-3 text-xs"
                />
                <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50">
                  <Upload className="h-3.5 w-3.5" />
                  <span>Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, 'logo')}
                  />
                </label>
              </div>
            </div>

            {/* Reference Images */}
            <div>
              <span className="block text-xs font-semibold text-slate-700 mb-1.5">
                Reference Images ({brief.referenceImageUrls.length})
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  placeholder="Add image URL..."
                  value={refImageInput}
                  onChange={(e) => setRefImageInput(e.target.value)}
                  className="h-9 flex-1 rounded-lg border border-slate-300 px-3 text-xs"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!refImageInput.trim()) return;
                    updateField('referenceImageUrls', [
                      ...brief.referenceImageUrls,
                      refImageInput.trim(),
                    ]);
                    setRefImageInput('');
                  }}
                  className="h-9 rounded-lg border border-slate-300 px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Add URL
                </button>
                <label className="inline-flex h-9 cursor-pointer items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50">
                  <Upload className="h-3.5 w-3.5" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, 'reference')}
                  />
                </label>
              </div>
              {brief.referenceImageUrls.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {brief.referenceImageUrls.map((url, idx) => (
                    <div
                      key={idx}
                      className="relative h-14 w-20 overflow-hidden rounded-md border border-slate-200 bg-slate-100"
                    >
                      <img
                        src={url}
                        alt={`Reference ${idx + 1}`}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        aria-label="Remove reference image"
                        onClick={() =>
                          updateField(
                            'referenceImageUrls',
                            brief.referenceImageUrls.filter((_, i) => i !== idx)
                          )
                        }
                        className="absolute right-1 top-1 rounded bg-slate-900/80 px-1 text-[10px] text-white cursor-pointer"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Confirmed Offers & Compliance */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 space-y-3">
            <h2 className="text-base font-semibold text-slate-950">
              06. Confirmed Offers &amp; Claims Guard
            </h2>
            <p className="text-xs text-slate-500">
              CTAs and copy will only reference discounts, free offers, or guarantees explicitly confirmed here.
            </p>
            <div className="flex flex-wrap gap-4 pt-1">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={brief.confirmedOffers.freeConsultation}
                  onChange={(e) =>
                    updateField('confirmedOffers', {
                      ...brief.confirmedOffers,
                      freeConsultation: e.target.checked,
                    })
                  }
                />
                Free consultation offered
              </label>
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={brief.confirmedOffers.freeTrial}
                  onChange={(e) =>
                    updateField('confirmedOffers', {
                      ...brief.confirmedOffers,
                      freeTrial: e.target.checked,
                    })
                  }
                />
                Free trial offered
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirmed Discount (if any)
                </label>
                <input
                  type="text"
                  placeholder="Leave blank if none"
                  value={brief.confirmedOffers.discountText}
                  onChange={(e) =>
                    updateField('confirmedOffers', {
                      ...brief.confirmedOffers,
                      discountText: e.target.value,
                    })
                  }
                  className="h-9 w-full rounded-lg border border-slate-300 px-3 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirmed Guarantee / Policy
                </label>
                <input
                  type="text"
                  placeholder="e.g., 30-day return window"
                  value={brief.confirmedOffers.guaranteeText}
                  onChange={(e) =>
                    updateField('confirmedOffers', {
                      ...brief.confirmedOffers,
                      guaranteeText: e.target.value,
                    })
                  }
                  className="h-9 w-full rounded-lg border border-slate-300 px-3 text-xs"
                />
              </div>
            </div>
          </section>

          {/* Functional Forms & CTA Destinations */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 space-y-3">
            <h2 className="text-base font-semibold text-slate-950">
              07. Functional Forms &amp; CTA Destinations
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="f-kind" className="block text-xs font-semibold text-slate-700 mb-1">
                  Form Mode
                </label>
                <select
                  id="f-kind"
                  value={brief.integrations.formKind}
                  onChange={(e) =>
                    updateField('integrations', {
                      ...brief.integrations,
                      formKind: e.target.value as FormKind,
                    })
                  }
                  className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs"
                >
                  <option value="lead-generation">Lead Generation Form</option>
                  <option value="contact">Contact / Enquiry Form</option>
                  <option value="newsletter">Newsletter Subscription</option>
                  <option value="none">No Form (Direct CTA Links Only)</option>
                </select>
              </div>
              <div>
                <label htmlFor="f-endpoint" className="block text-xs font-semibold text-slate-700 mb-1">
                  Form Webhook / Endpoint URL
                </label>
                <input
                  id="f-endpoint"
                  type="url"
                  placeholder="Optional (e.g., https://formspree.io/f/...)"
                  value={brief.integrations.formEndpointUrl}
                  onChange={(e) =>
                    updateField('integrations', {
                      ...brief.integrations,
                      formEndpointUrl: e.target.value,
                    })
                  }
                  className="h-9 w-full rounded-lg border border-slate-300 px-3 text-xs"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="url"
                placeholder="Booking Calendar URL"
                value={brief.integrations.bookingUrl}
                onChange={(e) =>
                  updateField('integrations', {
                    ...brief.integrations,
                    bookingUrl: e.target.value,
                  })
                }
                className="h-9 rounded-lg border border-slate-300 px-3 text-xs"
              />
              <input
                type="url"
                placeholder="Product Purchase / Checkout URL"
                value={brief.integrations.purchaseUrl}
                onChange={(e) =>
                  updateField('integrations', {
                    ...brief.integrations,
                    purchaseUrl: e.target.value,
                  })
                }
                className="h-9 rounded-lg border border-slate-300 px-3 text-xs"
              />
              <input
                type="tel"
                placeholder="Telephone (e.g., +1-312-555-0184)"
                value={brief.integrations.phoneNumber}
                onChange={(e) =>
                  updateField('integrations', {
                    ...brief.integrations,
                    phoneNumber: e.target.value,
                  })
                }
                className="h-9 rounded-lg border border-slate-300 px-3 text-xs"
              />
              <input
                type="text"
                placeholder="WhatsApp Number (digits & country code)"
                value={brief.integrations.whatsappNumber}
                onChange={(e) =>
                  updateField('integrations', {
                    ...brief.integrations,
                    whatsappNumber: e.target.value,
                  })
                }
                className="h-9 rounded-lg border border-slate-300 px-3 text-xs"
              />
              <input
                type="email"
                placeholder="Contact Email"
                value={brief.integrations.contactEmail}
                onChange={(e) =>
                  updateField('integrations', {
                    ...brief.integrations,
                    contactEmail: e.target.value,
                  })
                }
                className="h-9 rounded-lg border border-slate-300 px-3 text-xs sm:col-span-2"
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
