import { Code2, Layers } from 'lucide-react';
import type { ComponentPlanItem, GeneratedFile } from '../shared/types';

interface ComponentPlanViewProps {
  componentPlan: ComponentPlanItem[];
  files: GeneratedFile[];
  onOpenFileInWorkspace: (filePath: string) => void;
}

export function ComponentPlanView({
  componentPlan,
  files,
  onOpenFileInWorkspace,
}: ComponentPlanViewProps) {
  if (componentPlan.length === 0 && files.length === 0) {
    return (
      <div className="mx-auto max-w-4xl rounded-xl border border-slate-200 bg-white p-10 text-center">
        <Layers className="mx-auto h-8 w-8 text-slate-300" aria-hidden="true" />
        <h2 className="mt-2 text-base font-semibold text-slate-900">
          No Component Architecture Planned Yet
        </h2>
        <p className="mt-1.5 text-sm text-slate-500">
          Run Analyze Design in the Workspace to inspect the modular component hierarchy and shared patterns across your screenshots.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="mb-4 border-b border-slate-100 pb-3">
          <h2 className="text-base font-semibold text-slate-900">
            Modular Component Breakdown ({componentPlan.length})
          </h2>
          <p className="text-xs text-slate-500">
            Planned component architecture separating layout sections, reusable UI primitives, and interactive state.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {componentPlan.map((comp, idx) => {
            const matchingFile = files.find(
              (f) => f.path === comp.filePath || f.path.endsWith(`/${comp.name}.tsx`)
            );
            return (
              <div
                key={`${comp.name}-${idx}`}
                className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-4"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">
                        {comp.name}
                      </h3>
                      <p className="font-mono text-[11px] text-slate-500">
                        {comp.filePath}
                      </p>
                    </div>
                    {comp.reusedAcrossScreenshots && (
                      <span className="text-xs font-medium text-blue-600">
                        Shared Module
                      </span>
                    )}
                  </div>

                  <p className="text-xs leading-relaxed text-slate-700">
                    {comp.responsibility}
                  </p>

                  <div className="text-xs">
                    <span className="font-semibold text-slate-700">Props: </span>
                    <span className="text-slate-600">{comp.propsSummary}</span>
                  </div>

                  {comp.interactiveFeatures.length > 0 && (
                    <div className="text-xs">
                      <span className="font-semibold text-slate-700">
                        Interactive Behavior:{' '}
                      </span>
                      <span className="text-slate-600">
                        {comp.interactiveFeatures.join(' · ')}
                      </span>
                    </div>
                  )}
                </div>

                {matchingFile && (
                  <div className="mt-4 border-t border-slate-100 pt-3">
                    <button
                      type="button"
                      onClick={() => onOpenFileInWorkspace(matchingFile.path)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                    >
                      <Code2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Open {matchingFile.path} in Editor
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
