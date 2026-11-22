import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import type {
  CodeQualityReport,
  DesignAnalysis,
  TokenUsage,
} from '../shared/types';

interface DesignAnalysisPanelProps {
  analysis: DesignAnalysis | null;
  qualityReport: CodeQualityReport | null;
  tokenUsage: TokenUsage | null;
  isAnalyzing: boolean;
}

export function DesignAnalysisPanel({
  analysis,
  qualityReport,
  tokenUsage,
  isAnalyzing,
}: DesignAnalysisPanelProps) {
  if (isAnalyzing) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-3">
        <div className="h-4 w-48 animate-pulse rounded bg-slate-200" />
        <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
        <div className="h-3 w-5/6 animate-pulse rounded bg-slate-100" />
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="h-20 animate-pulse rounded bg-slate-100" />
          <div className="h-20 animate-pulse rounded bg-slate-100" />
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-5 text-center">
        <p className="text-sm font-medium text-slate-800">
          Design Analysis Ready
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Upload a UI screenshot or select a sample above, then click Analyze Design to inspect layout, typography, colors, components, and inferred breakpoints.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Executive Summary & Token Usage */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Design Analysis Summary
            </h3>
            <p className="text-xs text-slate-500">
              Page Type: {analysis.pageType}
            </p>
          </div>
          {tokenUsage && tokenUsage.totalTokens > 0 && (
            <div className="text-right font-mono text-[11px] text-slate-500 tabular-nums">
              <span>{tokenUsage.model}</span>
              <span className="mx-1.5" aria-hidden="true">·</span>
              <span>{tokenUsage.totalTokens.toLocaleString()} tokens</span>
            </div>
          )}
        </div>
        <p className="text-xs leading-relaxed text-slate-700">{analysis.summary}</p>
      </div>

      {/* Observed Properties */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3.5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h4 className="text-xs font-semibold text-slate-900">
            Observed Visual &amp; Structural Properties
          </h4>
          <span className="text-[11px] font-medium text-slate-500">
            Directly visible in screenshot
          </span>
        </div>

        <dl className="grid grid-cols-1 gap-2.5 text-xs">
          <div>
            <dt className="font-semibold text-slate-700">Page Structure</dt>
            <dd className="mt-0.5 text-slate-600">{analysis.observed.layout.structure}</dd>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <dt className="font-semibold text-slate-700">Header &amp; Nav</dt>
              <dd className="mt-0.5 text-slate-600">{analysis.observed.layout.headerNav}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-700">Columns &amp; Grids</dt>
              <dd className="mt-0.5 text-slate-600">{analysis.observed.layout.columnsAndGrids}</dd>
            </div>
          </div>
          <div>
            <dt className="font-semibold text-slate-700">Content Sections</dt>
            <dd className="mt-1 space-y-1 text-slate-600">
              {analysis.observed.layout.contentSections.map((sec, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                    {String(idx + 1).padStart(2, '0')}.
                  </span>
                  <span>{sec}</span>
                </div>
              ))}
            </dd>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <dt className="font-semibold text-slate-700">Containers &amp; Spacing</dt>
              <dd className="mt-0.5 text-slate-600">
                {analysis.observed.layout.containersAndSpacing}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-700">Typography &amp; Alignment</dt>
              <dd className="mt-0.5 text-slate-600">
                {analysis.observed.typography.bodyTypography} ·{' '}
                {analysis.observed.typography.textAlignment}
              </dd>
            </div>
          </div>
        </dl>

        {/* Detected UI Components Table */}
        <div className="pt-1">
          <p className="mb-1.5 text-xs font-semibold text-slate-700">
            Detected UI Components ({analysis.observed.components.length})
          </p>
          <div className="overflow-x-auto rounded border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600">
                <tr>
                  <th className="px-2.5 py-1.5">Component</th>
                  <th className="px-2.5 py-1.5 text-right">Count</th>
                  <th className="px-2.5 py-1.5">Interaction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {analysis.observed.components.map((comp, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70">
                    <td className="px-2.5 py-1.5 font-medium text-slate-800">
                      {comp.name}
                      <span className="ml-1.5 text-[11px] font-normal text-slate-500">
                        ({comp.type})
                      </span>
                    </td>
                    <td className="px-2.5 py-1.5 text-right font-mono text-slate-600 tabular-nums">
                      {comp.count}
                    </td>
                    <td className="px-2.5 py-1.5 text-slate-600">
                      {comp.interactiveBehavior}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Inferred Responsive Behavior & Asset Substitutions */}
      <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
          <h4 className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
            <Info className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
            Inferred Responsive Behavior &amp; Substitutions
          </h4>
          <span className="text-[11px] font-medium text-slate-500">
            Inferred where not shown
          </span>
        </div>

        <dl className="space-y-2 text-xs">
          <div>
            <dt className="font-semibold text-slate-700">Desktop Layout</dt>
            <dd className="text-slate-600">
              {analysis.inferred.responsiveBehavior.desktopLayout}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-700">Tablet Breakpoint (768px)</dt>
            <dd className="text-slate-600">
              {analysis.inferred.responsiveBehavior.tabletLayout}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-700">Mobile Breakpoint (390px)</dt>
            <dd className="text-slate-600">
              {analysis.inferred.responsiveBehavior.mobileLayout}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-700">Responsive Navigation</dt>
            <dd className="text-slate-600">
              {analysis.inferred.responsiveBehavior.responsiveNavigation}
            </dd>
          </div>
        </dl>

        {analysis.inferred.assetSubstitutions.length > 0 && (
          <div className="border-t border-slate-200/80 pt-2.5">
            <p className="mb-1 text-xs font-semibold text-slate-700">
              Asset &amp; Font Substitutions
            </p>
            <ul className="space-y-1 text-xs text-slate-600">
              {analysis.inferred.assetSubstitutions.map((sub, i) => (
                <li key={i}>
                  <span className="font-medium text-slate-800">{sub.originalElement}:</span>{' '}
                  {sub.substitutionNote}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Automated Code Quality Report */}
      {qualityReport && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="text-xs font-semibold text-slate-900">
              Code Quality &amp; Verification Report
            </h4>
            <span
              className={`text-xs font-semibold ${
                qualityReport.overallStatus === 'clean'
                  ? 'text-emerald-700'
                  : qualityReport.overallStatus === 'warnings'
                    ? 'text-amber-700'
                    : 'text-red-700'
              }`}
            >
              {qualityReport.overallStatus === 'clean'
                ? 'All Checks Passed'
                : qualityReport.overallStatus === 'warnings'
                  ? 'Passed with Notices'
                  : 'Errors Detected'}
            </span>
          </div>

          {qualityReport.issuesFixed.length > 0 && (
            <div className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
              {qualityReport.issuesFixed.map((fix, idx) => (
                <p key={idx}>{fix}</p>
              ))}
            </div>
          )}

          <ul className="space-y-2">
            {qualityReport.checks.map((chk, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs">
                {chk.status === 'pass' ? (
                  <CheckCircle2
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600"
                    aria-hidden="true"
                  />
                ) : chk.status === 'warning' ? (
                  <AlertTriangle
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600"
                    aria-hidden="true"
                  />
                ) : (
                  <XCircle
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-600"
                    aria-hidden="true"
                  />
                )}
                <div>
                  <span className="font-medium text-slate-800">{chk.name}:</span>{' '}
                  <span className="text-slate-600">{chk.detail}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
