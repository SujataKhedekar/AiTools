import React, { useState } from 'react';
import { Check, Copy, Eye, Layers } from 'lucide-react';
import type { DesignAnalysis } from '../types/shopify';

interface DesignAnalysisViewProps {
  analysis: DesignAnalysis;
  detectedType: string;
  sectionName: string;
}

export const DesignAnalysisView: React.FC<DesignAnalysisViewProps> = ({
  analysis,
  detectedType,
  sectionName,
}) => {
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const handleCopyHex = (hex: string) => {
    void navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 1500);
  };

  return (
    <div className="space-y-6">
      {/* Architecture Overview */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">{sectionName}</h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Detected Pattern: {detectedType}
            </p>
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-slate-700">
          {analysis.layoutSummary}
        </p>
      </div>

      {/* Observed vs Inferred Comparison */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Observed Visual Properties */}
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Eye className="h-4 w-4 text-teal-700" />
            <h4 className="text-sm font-semibold text-slate-900">
              Observed Visual Properties
            </h4>
          </div>

          <dl className="space-y-3.5 text-sm">
            <div>
              <dt className="text-xs font-medium text-slate-500">Layout & Alignment</dt>
              <dd className="mt-1 text-slate-800">{analysis.observed.layoutStructure}</dd>
            </div>

            <div>
              <dt className="text-xs font-medium text-slate-500">Container Width</dt>
              <dd className="mt-1 font-mono text-xs text-slate-800">
                {analysis.observed.containerWidth}
              </dd>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium text-slate-500">Background Palette</dt>
                <dd className="mt-1.5 flex flex-wrap gap-2">
                  {analysis.observed.backgroundColors.map((hex, i) => (
                    <button
                      key={`${hex}-${i}`}
                      type="button"
                      onClick={() => handleCopyHex(hex)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-xs text-slate-700 hover:border-slate-300"
                      title="Copy color hex"
                    >
                      <span
                        className="h-3 w-3 rounded-sm border border-slate-300"
                        style={{ backgroundColor: hex }}
                      />
                      <span>{hex}</span>
                      {copiedHex === hex ? (
                        <Check className="h-3 w-3 text-teal-600" />
                      ) : (
                        <Copy className="h-3 w-3 text-slate-400" />
                      )}
                    </button>
                  ))}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-medium text-slate-500">Text & Accent Palette</dt>
                <dd className="mt-1.5 flex flex-wrap gap-2">
                  {analysis.observed.textColors.map((hex, i) => (
                    <button
                      key={`${hex}-${i}`}
                      type="button"
                      onClick={() => handleCopyHex(hex)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-xs text-slate-700 hover:border-slate-300"
                      title="Copy color hex"
                    >
                      <span
                        className="h-3 w-3 rounded-sm border border-slate-300"
                        style={{ backgroundColor: hex }}
                      />
                      <span>{hex}</span>
                      {copiedHex === hex ? (
                        <Check className="h-3 w-3 text-teal-600" />
                      ) : (
                        <Copy className="h-3 w-3 text-slate-400" />
                      )}
                    </button>
                  ))}
                </dd>
              </div>
            </div>

            <div>
              <dt className="text-xs font-medium text-slate-500">Typography Scale & Weights</dt>
              <dd className="mt-1 text-slate-800">{analysis.observed.typography}</dd>
            </div>

            <div>
              <dt className="text-xs font-medium text-slate-500">Spacing, Margins & Grid</dt>
              <dd className="mt-1 text-slate-800">{analysis.observed.spacingAndGrid}</dd>
            </div>

            <div>
              <dt className="text-xs font-medium text-slate-500">
                Media Positions, Buttons, Radii & Shadows
              </dt>
              <dd className="mt-1 text-slate-800">{analysis.observed.mediaAndButtons}</dd>
            </div>
          </dl>
        </section>

        {/* Inferred Design & Shopify Decisions */}
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Layers className="h-4 w-4 text-slate-700" />
            <h4 className="text-sm font-semibold text-slate-900">
              Inferred Design & Shopify Decisions
            </h4>
          </div>

          <dl className="space-y-4 text-sm">
            <div>
              <dt className="text-xs font-medium text-slate-500">
                Responsive Breakpoint Behavior
              </dt>
              <dd className="mt-1 leading-relaxed text-slate-800">
                {analysis.inferred.responsiveBehavior}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-medium text-slate-500">
                Shopify Liquid Object Mapping
              </dt>
              <dd className="mt-1 leading-relaxed text-slate-800">
                {analysis.inferred.shopifyMapping}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-medium text-slate-500">
                Theme Editor Schema & Block Strategy
              </dt>
              <dd className="mt-1 leading-relaxed text-slate-800">
                {analysis.inferred.schemaStrategy}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-medium text-slate-500">
                Accessibility & Contrast Handling
              </dt>
              <dd className="mt-1 leading-relaxed text-slate-800">
                {analysis.inferred.accessibilityDecisions}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      {/* Element Hierarchy & Relationships Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-3.5">
          <h4 className="text-sm font-semibold text-slate-900">
            Detected Elements & Structural Relationships
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
              <tr>
                <th className="px-5 py-2.5">Element</th>
                <th className="px-5 py-2.5">Functional Role</th>
                <th className="px-5 py-2.5">Spatial & Shopify Relationship</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {analysis.observed.elements.map((el, idx) => (
                <tr key={`${el.name}-${idx}`} className="hover:bg-slate-50/70">
                  <td className="px-5 py-3 font-medium text-slate-900 whitespace-nowrap">
                    {el.name}
                  </td>
                  <td className="px-5 py-3 text-slate-600">{el.role}</td>
                  <td className="px-5 py-3 text-slate-700">{el.relationship}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
