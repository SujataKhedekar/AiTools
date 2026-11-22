import React, { useState } from 'react';
import { Check, Copy, Loader2, RefreshCw } from 'lucide-react';
import type { GeneratedLandingPage } from '../types/aivora';
import { calculateQualityScore } from '../utils/qualityScore';

interface SeoCroWorkbenchProps {
  page: GeneratedLandingPage;
  onReanalyze: () => Promise<void>;
  isReanalyzing: boolean;
}

export function SeoCroWorkbench({
  page,
  onReanalyze,
  isReanalyzing,
}: SeoCroWorkbenchProps) {
  const [copiedSchema, setCopiedSchema] = useState<string | null>(null);
  const [expandedScoreId, setExpandedScoreId] = useState<string | null>('copywriting');
  const quality = calculateQualityScore(page);

  function copyText(id: string, content: string) {
    navigator.clipboard.writeText(content);
    setCopiedSchema(id);
    setTimeout(() => setCopiedSchema(null), 1500);
  }

  return (
    <div className="mx-auto max-w-[1220px] px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            SEO, Schema.org &amp; Conversion Rate Optimization
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Transparent Aivora quality scoring, validated JSON-LD structured data, CRO weaknesses, and A/B test hypotheses.
          </p>
        </div>
        <button
          type="button"
          disabled={isReanalyzing}
          onClick={onReanalyze}
          className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-50 disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
        >
          {isReanalyzing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          <span>{isReanalyzing ? 'Auditing...' : 'Re-audit After Edits'}</span>
        </button>
      </div>

      {/* Aivora Landing Page Quality Score */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-950">
              Aivora Landing Page Quality Score
            </h2>
            <p className="mt-1 text-xs text-slate-500 max-w-2xl">{quality.disclaimer}</p>
          </div>
          <div className="text-right">
            <span className="font-mono text-3xl font-bold text-slate-950 tabular-nums">
              {quality.overallScore}/100
            </span>
            <p className="text-xs font-medium text-slate-600">{quality.gradeLabel}</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quality.components.map((comp) => {
            const isExpanded = expandedScoreId === comp.id;
            return (
              <div
                key={comp.id}
                className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 space-y-2"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-800">{comp.label}</span>
                  <span className="font-mono text-sm font-bold text-slate-950 tabular-nums">
                    {comp.score}/{comp.maxScore}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full bg-blue-700"
                    style={{ width: `${comp.score}%` }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setExpandedScoreId(isExpanded ? null : comp.id)}
                  className="text-[11px] font-medium text-blue-700 hover:underline cursor-pointer"
                >
                  {isExpanded ? 'Hide formula' : 'How calculated'}
                </button>
                {isExpanded && (
                  <div className="space-y-1.5 pt-1 text-[11px] text-slate-600 border-t border-slate-200">
                    <p>{comp.formulaExplanation}</p>
                    <ul className="list-disc pl-4 space-y-0.5">
                      {comp.evidence.map((ev, i) => (
                        <li key={i}>{ev}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* SEO Strategy, Metadata, Heading Structure */}
      <div className="grid gap-8 lg:grid-cols-12">
        <section className="rounded-xl border border-slate-200 bg-white p-6 space-y-5 lg:col-span-6">
          <h2 className="text-base font-semibold text-slate-950">
            SEO Metadata &amp; Search Preview
          </h2>

          {/* SERP Preview */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-1">
            <p className="text-xs text-slate-500 truncate">{page.seo.metadata.canonicalUrl}</p>
            <p className="text-base font-semibold text-blue-800">
              {page.seo.metadata.seoTitle}
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              {page.seo.metadata.metaDescription}
            </p>
          </div>

          <div className="grid gap-3 text-xs">
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="font-semibold text-slate-700">Title Length</span>
              <span className="font-mono tabular-nums text-slate-600">
                {page.seo.metadata.seoTitle.length} chars
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="font-semibold text-slate-700">Meta Description Length</span>
              <span className="font-mono tabular-nums text-slate-600">
                {page.seo.metadata.metaDescription.length} chars
              </span>
            </div>
            <div>
              <span className="font-semibold text-slate-700">Primary Keyword: </span>
              <span className="text-slate-900">{page.seo.keywordStrategy.primaryKeyword}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-700">Secondary &amp; Semantic Keywords: </span>
              <span className="text-slate-600">
                {[
                  ...page.seo.keywordStrategy.secondaryKeywords,
                  ...page.seo.keywordStrategy.semanticKeywords,
                ].join(', ')}
              </span>
            </div>
            <div>
              <span className="font-semibold text-slate-700">Open Graph Image Recommendation: </span>
              <span className="text-slate-600">{page.seo.metadata.ogImageRecommendation}</span>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 space-y-4 lg:col-span-6">
          <h2 className="text-base font-semibold text-slate-950">
            Heading Hierarchy &amp; Technical SEO
          </h2>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs space-y-2">
            <p className="font-semibold text-slate-900">
              H1 ({page.seo.headingStructure.h1Count}): {page.seo.headingStructure.h1Text}
            </p>
            <div className="pl-3 space-y-1 text-slate-700">
              {page.seo.headingStructure.h2List.map((h2, i) => (
                <p key={i}>H2 · {h2}</p>
              ))}
            </div>
            {page.seo.headingStructure.h3List.length > 0 && (
              <div className="pl-6 space-y-0.5 text-slate-500">
                {page.seo.headingStructure.h3List.slice(0, 8).map((h3, i) => (
                  <p key={i}>H3 · {h3}</p>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2 text-xs">
            {page.seo.technicalSeo.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2"
              >
                <div>
                  <p className="font-semibold text-slate-800">{item.check}</p>
                  <p className="text-slate-500">{item.detail}</p>
                </div>
                <span
                  className={`font-semibold shrink-0 ${
                    item.status === 'pass' ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                >
                  {item.status === 'pass' ? 'Pass' : 'Review'}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* JSON-LD Structured Data */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-slate-950">
            Validated JSON-LD Structured Data
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Only schemas directly supported by visible page content are emitted. Search rankings or rich results are never guaranteed.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {page.seo.jsonLdSchemas.map((schema) => (
            <div
              key={schema.schemaType}
              className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-semibold text-slate-900">{schema.schemaType}</span>
                  <span aria-hidden="true">·</span>
                  <span
                    className={
                      schema.eligible && schema.isValidJson
                        ? 'font-medium text-emerald-700'
                        : 'font-medium text-slate-500'
                    }
                  >
                    {schema.eligible
                      ? schema.isValidJson
                        ? 'Eligible & Valid JSON'
                        : 'Validation Errors'
                      : 'Omitted'}
                  </span>
                </div>
                {schema.eligible && schema.jsonString && (
                  <button
                    type="button"
                    onClick={() => copyText(schema.schemaType, schema.jsonString)}
                    className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    {copiedSchema === schema.schemaType ? (
                      <Check className="h-3 w-3 text-emerald-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                    <span>{copiedSchema === schema.schemaType ? 'Copied' : 'Copy'}</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-600">{schema.eligibilityReason}</p>
              {schema.eligible && schema.jsonString && (
                <pre className="max-h-48 overflow-auto rounded border border-slate-200 bg-slate-950 p-3 text-[11px] text-slate-100">
                  {schema.jsonString}
                </pre>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CRO Weaknesses & A/B Tests */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 space-y-6">
        <div>
          <h2 className="text-base font-semibold text-slate-950">
            Conversion Rate Optimization (CRO) Audit &amp; A/B Test Plan
          </h2>
          <p className="mt-1 text-sm text-slate-700">{page.cro.executiveSummary}</p>
          <p className="mt-1 text-xs text-slate-500">{page.cro.disclaimer}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-500">
              Identified Weaknesses &amp; Actionable Fixes
            </h3>
            {page.cro.weaknesses.map((w, idx) => (
              <div key={idx} className="rounded-lg border border-slate-200 p-4 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">{w.area}</span>
                  <span
                    className={`font-semibold ${
                      w.severity === 'High'
                        ? 'text-red-700'
                        : w.severity === 'Medium'
                          ? 'text-amber-700'
                          : 'text-slate-600'
                    }`}
                  >
                    {w.severity} Priority
                  </span>
                </div>
                <p className="text-slate-600">{w.finding}</p>
                <p className="font-medium text-slate-900">Recommendation: {w.recommendation}</p>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-500">
              A/B Testing Hypotheses
            </h3>
            {page.cro.abTestingSuggestions.map((ab, idx) => (
              <div key={idx} className="rounded-lg border border-slate-200 p-4 text-xs space-y-1.5">
                <p className="font-semibold text-slate-900">{ab.element}</p>
                <p className="text-slate-600">{ab.hypothesis}</p>
                <div className="grid gap-2 sm:grid-cols-2 pt-1">
                  <div className="rounded bg-slate-50 p-2">
                    <span className="font-semibold text-slate-500">Variant A: </span>
                    <span className="text-slate-800">{ab.variantA}</span>
                  </div>
                  <div className="rounded bg-slate-50 p-2">
                    <span className="font-semibold text-slate-500">Variant B: </span>
                    <span className="text-slate-800">{ab.variantB}</span>
                  </div>
                </div>
                <p className="text-slate-500">
                  Observe: {ab.primaryMetricToObserve}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
