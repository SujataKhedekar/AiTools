import React, { useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import type { ShopifySectionSchema } from '../types/shopify';

interface SchemaExplorerViewProps {
  schema: ShopifySectionSchema | null;
}

export const SchemaExplorerView: React.FC<SchemaExplorerViewProps> = ({ schema }) => {
  const [copiedJson, setCopiedJson] = useState(false);

  const formattedJson = useMemo(
    () => (schema ? JSON.stringify(schema, null, 2) : ''),
    [schema]
  );

  if (!schema) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-sm font-medium text-slate-800">
          No valid {'{% schema %}'} JSON block could be parsed from this section.
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Inspect the Liquid Code tab to review any JSON syntax errors.
        </p>
      </div>
    );
  }

  const handleCopyJson = () => {
    void navigator.clipboard.writeText(formattedJson);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 1800);
  };

  return (
    <div className="space-y-6">
      {/* Schema Metadata Summary */}
      <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-4">
        <div>
          <p className="text-xs text-slate-500">Section Name</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{schema.name}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">HTML Tag & Class</p>
          <p className="mt-1 font-mono text-xs text-slate-800">
            &lt;{schema.tag || 'section'}&gt; {schema.class ? `.${schema.class}` : ''}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Settings Count</p>
          <p className="mt-1 font-mono text-sm font-semibold text-slate-900 tabular-nums">
            {schema.settings?.filter((s) => s.type !== 'header' && s.type !== 'paragraph')
              .length ?? 0}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Repeatable Block Types</p>
          <p className="mt-1 font-mono text-sm font-semibold text-slate-900 tabular-nums">
            {schema.blocks?.length ?? 0}
          </p>
        </div>
      </div>

      {/* Section Settings Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-3.5">
          <h3 className="text-sm font-semibold text-slate-900">
            Theme Editor Settings ({schema.settings?.length ?? 0})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 font-medium text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Setting ID</th>
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5">Label / Heading</th>
                <th className="px-4 py-2.5">Default</th>
                <th className="px-4 py-2.5">Constraints / Options</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {schema.settings?.map((s, idx) => (
                <tr key={`${s.id || s.type}-${idx}`} className="hover:bg-slate-50/70">
                  <td className="px-4 py-2.5 font-mono text-slate-900">
                    {s.id || '—'}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-teal-700">{s.type}</td>
                  <td className="px-4 py-2.5 text-slate-700">
                    {s.label || s.content || '—'}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-slate-600">
                    {s.default !== undefined ? String(s.default) : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-slate-500">
                    {s.type === 'range'
                      ? `${s.min}–${s.max} (step ${s.step}${s.unit || ''})`
                      : s.options
                        ? s.options.map((o) => o.label).join(', ')
                        : s.info || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Block Definitions */}
      {schema.blocks && schema.blocks.length > 0 && (
        <div className="space-y-4">
          {schema.blocks.map((blk) => (
            <div
              key={blk.type}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white"
            >
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">
                    Block: {blk.name}
                  </h4>
                  <p className="font-mono text-xs text-slate-500">
                    type: &quot;{blk.type}&quot;
                    {blk.limit ? ` · limit: ${blk.limit}` : ''}
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50 font-medium text-slate-500">
                    <tr>
                      <th className="px-4 py-2">Setting ID</th>
                      <th className="px-4 py-2">Type</th>
                      <th className="px-4 py-2">Label</th>
                      <th className="px-4 py-2">Default</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {blk.settings.map((bs, idx) => (
                      <tr key={`${bs.id || bs.type}-${idx}`}>
                        <td className="px-4 py-2 font-mono text-slate-900">
                          {bs.id || '—'}
                        </td>
                        <td className="px-4 py-2 font-mono text-teal-700">{bs.type}</td>
                        <td className="px-4 py-2 text-slate-700">
                          {bs.label || bs.content || '—'}
                        </td>
                        <td className="px-4 py-2 font-mono text-slate-600">
                          {bs.default !== undefined ? String(bs.default) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Raw Schema JSON */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#0F172A] text-slate-100">
        <div className="flex items-center justify-between border-b border-slate-800 bg-[#131D33] px-4 py-2.5">
          <span className="font-mono text-xs text-slate-300">
            {'{% schema %}'} JSON Payload
          </span>
          <button
            type="button"
            onClick={handleCopyJson}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-medium text-slate-200 hover:bg-slate-700"
          >
            {copiedJson ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copy JSON
              </>
            )}
          </button>
        </div>
        <pre className="max-h-96 overflow-auto p-4 font-mono text-xs leading-relaxed text-slate-200">
          {formattedJson}
        </pre>
      </div>
    </div>
  );
};
