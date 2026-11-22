import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import type { ComponentPlanItem, DesignSystem } from '../shared/types';

interface DesignSystemViewProps {
  designSystem: DesignSystem | null;
  componentPlan: ComponentPlanItem[];
}

export function DesignSystemView({
  designSystem,
  componentPlan,
}: DesignSystemViewProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  function handleCopy(key: string, text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1600);
    });
  }

  if (!designSystem) {
    return (
      <div className="mx-auto max-w-4xl rounded-xl border border-slate-200 bg-white p-10 text-center">
        <h2 className="text-base font-semibold text-slate-900">
          No Design System Extracted Yet
        </h2>
        <p className="mt-1.5 text-sm text-slate-500">
          Upload a UI screenshot in the Workspace tab and run Analyze Design to extract color palettes, typography scale, spacing tokens, CSS variables, and Tailwind configuration.
        </p>
      </div>
    );
  }

  const coreColors = [
    { label: 'Primary', hex: designSystem.colors.primary },
    { label: 'Secondary', hex: designSystem.colors.secondary },
    { label: 'Accent', hex: designSystem.colors.accent },
    { label: 'Background', hex: designSystem.colors.background },
    { label: 'Surface', hex: designSystem.colors.surface },
    { label: 'Text Primary', hex: designSystem.colors.textPrimary },
    { label: 'Text Secondary', hex: designSystem.colors.textSecondary },
    { label: 'Border', hex: designSystem.colors.border },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Color Palette Section */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Extracted Color Palette
            </h2>
            <p className="text-xs text-slate-500">
              Click any hex token to copy to clipboard.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {coreColors.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => handleCopy(item.label, item.hex)}
              className="group rounded-lg border border-slate-200 bg-white p-2 text-left transition-colors hover:border-slate-300 cursor-pointer"
            >
              <div
                className="h-12 w-full rounded border border-slate-200/80"
                style={{ backgroundColor: item.hex }}
              />
              <p className="mt-2 truncate text-xs font-semibold text-slate-800">
                {item.label}
              </p>
              <p className="font-mono text-[11px] text-slate-500">
                {copiedKey === item.label ? 'Copied' : item.hex}
              </p>
            </button>
          ))}
        </div>

        {designSystem.colors.palette.length > 0 && (
          <div className="mt-5 border-t border-slate-100 pt-4">
            <h3 className="mb-2.5 text-xs font-semibold text-slate-700">
              Extended Semantic Tokens
            </h3>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {designSystem.colors.palette.map((tok, idx) => (
                <div
                  key={`${tok.name}-${idx}`}
                  className="flex items-center gap-3 rounded-md border border-slate-200 px-3 py-2"
                >
                  <span
                    className="h-6 w-6 shrink-0 rounded border border-slate-200"
                    style={{ backgroundColor: tok.hex }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-slate-800">
                      {tok.name}
                    </p>
                    <p className="truncate text-[11px] text-slate-500">{tok.usage}</p>
                  </div>
                  <span className="font-mono text-[11px] text-slate-600">
                    {tok.hex}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Typography & Spacing Scale */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-semibold text-slate-900">
              Typography Scale
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Display: {designSystem.typography.displayFont} · Body:{' '}
              {designSystem.typography.bodyFont} · Mono:{' '}
              {designSystem.typography.monoFont}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 text-[11px] font-semibold text-slate-500">
                <tr>
                  <th className="py-2 pr-3">Role</th>
                  <th className="py-2 pr-3">Size</th>
                  <th className="py-2 pr-3">Weight</th>
                  <th className="py-2 pr-3">Line Height</th>
                  <th className="py-2">Tracking</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                {designSystem.typography.scale.map((t, i) => (
                  <tr key={i}>
                    <td className="py-2 pr-3 font-sans font-medium text-slate-800">
                      {t.role}
                    </td>
                    <td className="py-2 pr-3 text-slate-600">{t.size}</td>
                    <td className="py-2 pr-3 text-slate-600">{t.weight}</td>
                    <td className="py-2 pr-3 text-slate-600">{t.lineHeight}</td>
                    <td className="py-2 text-slate-600">{t.letterSpacing}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-semibold text-slate-900">
              Layout, Spacing &amp; Surface Tokens
            </h2>
          </div>

          <dl className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <dt className="font-semibold text-slate-700">Container Max Width</dt>
              <dd className="mt-0.5 font-mono text-slate-600">
                {designSystem.spacing.containerMaxWidth}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-700">Section Padding</dt>
              <dd className="mt-0.5 font-mono text-slate-600">
                {designSystem.spacing.sectionPadding}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-700">Base Spacing Unit</dt>
              <dd className="mt-0.5 font-mono text-slate-600">
                {designSystem.spacing.baseUnit}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-700">Border Radii</dt>
              <dd className="mt-0.5 font-mono text-slate-600">
                sm {designSystem.radii.sm} / md {designSystem.radii.md} / lg{' '}
                {designSystem.radii.lg}
              </dd>
            </div>
          </dl>

          <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
            <div>
              <p className="font-semibold text-slate-700">Primary Button Style</p>
              <p className="mt-0.5 font-mono text-[11px] text-slate-600">
                {designSystem.buttonStyles.primary}
              </p>
            </div>
            <div>
              <p className="font-semibold text-slate-700">Card Surface Style</p>
              <p className="mt-0.5 font-mono text-[11px] text-slate-600">
                {designSystem.cardStyles.background} · {designSystem.cardStyles.border} ·
                radius {designSystem.cardStyles.radius} · padding{' '}
                {designSystem.cardStyles.padding}
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Exportable CSS Variables & Tailwind Config */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5">
            <h3 className="text-xs font-semibold text-slate-800">
              CSS Custom Properties (:root)
            </h3>
            <button
              type="button"
              onClick={() => handleCopy('cssVars', designSystem.cssVariables)}
              className="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              {copiedKey === 'cssVars' ? (
                <>
                  <Check className="h-3 w-3 text-emerald-600" aria-hidden="true" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" aria-hidden="true" />
                  Copy CSS
                </>
              )}
            </button>
          </div>
          <pre className="max-h-72 overflow-auto p-4 font-mono text-xs leading-relaxed text-slate-800">
            {designSystem.cssVariables}
          </pre>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5">
            <h3 className="text-xs font-semibold text-slate-800">
              Tailwind Theme Configuration
            </h3>
            <button
              type="button"
              onClick={() => handleCopy('twConfig', designSystem.tailwindConfig)}
              className="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              {copiedKey === 'twConfig' ? (
                <>
                  <Check className="h-3 w-3 text-emerald-600" aria-hidden="true" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" aria-hidden="true" />
                  Copy Config
                </>
              )}
            </button>
          </div>
          <pre className="max-h-72 overflow-auto p-4 font-mono text-xs leading-relaxed text-slate-800">
            {designSystem.tailwindConfig}
          </pre>
        </section>
      </div>

      {/* Component Plan Table */}
      {componentPlan.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-3 text-base font-semibold text-slate-900">
            Planned Component Architecture ({componentPlan.length})
          </h2>
          <div className="overflow-x-auto rounded border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
                <tr>
                  <th className="px-3 py-2">Component</th>
                  <th className="px-3 py-2">File Path</th>
                  <th className="px-3 py-2">Responsibility</th>
                  <th className="px-3 py-2">Interactive Behavior</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {componentPlan.map((comp, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70">
                    <td className="px-3 py-2 font-semibold text-slate-900">
                      {comp.name}
                      {comp.reusedAcrossScreenshots && (
                        <span className="ml-1.5 text-[11px] font-normal text-blue-600">
                          Shared
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 font-mono text-[11px] text-slate-600">
                      {comp.filePath}
                    </td>
                    <td className="px-3 py-2 text-slate-700">{comp.responsibility}</td>
                    <td className="px-3 py-2 text-slate-600">
                      {comp.interactiveFeatures.join(', ') || 'Static layout'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
