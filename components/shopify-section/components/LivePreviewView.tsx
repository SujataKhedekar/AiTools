import React, { useEffect, useMemo, useState } from 'react';
import {
  Monitor,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Smartphone,
  Tablet,
  Trash2,
} from 'lucide-react';
import { STORE_CATALOG_PRESETS } from '../data/samples';
import {
  buildPreviewSrcDoc,
  type PreviewBlockInstance,
} from '../lib/liquidPreviewEngine';
import type { ShopifySectionSchema, ShopifySettingSchema } from '../types/shopify';

interface LivePreviewViewProps {
  liquidCode: string;
  schema: ShopifySectionSchema | null;
  uploadedPreviewImageUrl?: string;
}

type ViewportMode = 'desktop' | 'tablet' | 'mobile';

function buildInitialSettings(schema: ShopifySectionSchema | null): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  if (!schema?.settings) return values;
  for (const s of schema.settings) {
    if (s.id && s.default !== undefined) {
      values[s.id] = s.default;
    }
  }
  if (schema.presets?.[0]?.settings) {
    Object.assign(values, schema.presets[0].settings);
  }
  return values;
}

function buildInitialBlocks(schema: ShopifySectionSchema | null): PreviewBlockInstance[] {
  if (!schema?.blocks || schema.blocks.length === 0) return [];
  const presetBlocks = schema.presets?.[0]?.blocks;
  if (presetBlocks && presetBlocks.length > 0) {
    return presetBlocks.map((pb, idx) => {
      const def = schema.blocks?.find((b) => b.type === pb.type);
      const settings: Record<string, unknown> = {};
      def?.settings.forEach((s) => {
        if (s.id && s.default !== undefined) settings[s.id] = s.default;
      });
      if (pb.settings) Object.assign(settings, pb.settings);
      return {
        id: `block-${idx}-${pb.type}`,
        type: pb.type,
        settings,
      };
    });
  }
  // Create 2 default blocks from first block definition
  const firstDef = schema.blocks[0];
  return [0, 1].map((idx) => {
    const settings: Record<string, unknown> = {};
    firstDef.settings.forEach((s) => {
      if (s.id && s.default !== undefined) settings[s.id] = s.default;
    });
    return {
      id: `block-${idx}-${firstDef.type}`,
      type: firstDef.type,
      settings,
    };
  });
}

export const LivePreviewView: React.FC<LivePreviewViewProps> = ({
  liquidCode,
  schema,
  uploadedPreviewImageUrl,
}) => {
  const [viewport, setViewport] = useState<ViewportMode>('desktop');
  const [catalogId, setCatalogId] = useState(STORE_CATALOG_PRESETS[0].id);
  const [settingsState, setSettingsState] = useState<Record<string, unknown>>(() =>
    buildInitialSettings(schema)
  );
  const [blocksState, setBlocksState] = useState<PreviewBlockInstance[]>(() =>
    buildInitialBlocks(schema)
  );
  const [inspectorOpen, setInspectorOpen] = useState(true);

  useEffect(() => {
    setSettingsState(buildInitialSettings(schema));
    setBlocksState(buildInitialBlocks(schema));
  }, [schema, liquidCode]);

  const activeCatalog = useMemo(
    () =>
      STORE_CATALOG_PRESETS.find((c) => c.id === catalogId) || STORE_CATALOG_PRESETS[0],
    [catalogId]
  );

  const srcDoc = useMemo(
    () =>
      buildPreviewSrcDoc({
        liquidCode,
        schema,
        sectionSettings: settingsState,
        blocks: blocksState,
        catalog: activeCatalog,
        uploadedPreviewImageUrl,
      }),
    [liquidCode, schema, settingsState, blocksState, activeCatalog, uploadedPreviewImageUrl]
  );

  const handleReset = () => {
    setSettingsState(buildInitialSettings(schema));
    setBlocksState(buildInitialBlocks(schema));
  };

  const renderSettingControl = (
    setting: ShopifySettingSchema,
    value: unknown,
    onChange: (nextVal: unknown) => void,
    keyPrefix: string
  ) => {
    if (setting.type === 'header') {
      return (
        <div
          key={`${keyPrefix}-${setting.content}`}
          className="border-t border-slate-200 pt-3 first:border-t-0 first:pt-0"
        >
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {setting.content}
          </p>
        </div>
      );
    }
    if (setting.type === 'paragraph') {
      return (
        <p key={`${keyPrefix}-${setting.content}`} className="text-xs text-slate-500">
          {setting.content}
        </p>
      );
    }
    if (!setting.id) return null;

    const fieldId = `${keyPrefix}-${setting.id}`;

    if (setting.type === 'checkbox') {
      return (
        <label
          key={fieldId}
          htmlFor={fieldId}
          className="flex cursor-pointer items-center justify-between gap-2 py-1"
        >
          <span className="text-xs font-medium text-slate-700">{setting.label}</span>
          <input
            id={fieldId}
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-600"
          />
        </label>
      );
    }

    if (setting.type === 'color') {
      const hex = typeof value === 'string' && value.startsWith('#') ? value : '#0f172a';
      return (
        <div key={fieldId} className="flex items-center justify-between gap-2">
          <label htmlFor={fieldId} className="text-xs font-medium text-slate-700">
            {setting.label}
          </label>
          <div className="flex items-center gap-1.5">
            <input
              id={fieldId}
              type="color"
              value={hex}
              onChange={(e) => onChange(e.target.value)}
              className="h-7 w-8 cursor-pointer rounded border border-slate-300 bg-white p-0.5"
            />
            <span className="w-16 font-mono text-[11px] text-slate-500">{hex}</span>
          </div>
        </div>
      );
    }

    if (setting.type === 'range') {
      const numVal = Number(value ?? setting.default ?? setting.min ?? 0);
      return (
        <div key={fieldId} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <label htmlFor={fieldId} className="font-medium text-slate-700">
              {setting.label}
            </label>
            <span className="font-mono text-[11px] text-slate-500 tabular-nums">
              {numVal}
              {setting.unit || ''}
            </span>
          </div>
          <input
            id={fieldId}
            type="range"
            min={setting.min ?? 0}
            max={setting.max ?? 100}
            step={setting.step ?? 1}
            value={numVal}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full accent-teal-600"
          />
        </div>
      );
    }

    if (setting.type === 'select' || setting.type === 'radio') {
      return (
        <div key={fieldId} className="space-y-1">
          <label htmlFor={fieldId} className="block text-xs font-medium text-slate-700">
            {setting.label}
          </label>
          <select
            id={fieldId}
            value={String(value ?? setting.default ?? '')}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-teal-600 focus:outline-none"
          >
            {(setting.options || []).map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (setting.type === 'richtext' || setting.type === 'textarea') {
      return (
        <div key={fieldId} className="space-y-1">
          <label htmlFor={fieldId} className="block text-xs font-medium text-slate-700">
            {setting.label}
          </label>
          <textarea
            id={fieldId}
            rows={2}
            value={String(value ?? '')}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-teal-600 focus:outline-none"
          />
        </div>
      );
    }

    if (
      setting.type === 'text' ||
      setting.type === 'inline_richtext' ||
      setting.type === 'url'
    ) {
      return (
        <div key={fieldId} className="space-y-1">
          <label htmlFor={fieldId} className="block text-xs font-medium text-slate-700">
            {setting.label}
          </label>
          <input
            id={fieldId}
            type="text"
            value={String(value ?? '')}
            onChange={(e) => onChange(e.target.value)}
            placeholder={setting.placeholder || ''}
            className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-teal-600 focus:outline-none"
          />
        </div>
      );
    }

    return null;
  };

  const iframeMaxWidth =
    viewport === 'desktop' ? '100%' : viewport === 'tablet' ? '768px' : '375px';

  return (
    <div className="space-y-4">
      {/* Preview Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5">
        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setViewport('desktop')}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              viewport === 'desktop'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Monitor className="h-3.5 w-3.5" />
            Desktop
          </button>
          <button
            type="button"
            onClick={() => setViewport('tablet')}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              viewport === 'tablet'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Tablet className="h-3.5 w-3.5" />
            768px
          </button>
          <button
            type="button"
            onClick={() => setViewport('mobile')}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              viewport === 'mobile'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            375px
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="store-catalog-select" className="text-xs text-slate-500">
            Mock Store:
          </label>
          <select
            id="store-catalog-select"
            value={catalogId}
            onChange={(e) => setCatalogId(e.target.value)}
            className="h-8 rounded-md border border-slate-200 bg-slate-50 px-2.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600"
          >
            {STORE_CATALOG_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleReset}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>

          <button
            type="button"
            onClick={() => setInspectorOpen((v) => !v)}
            className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium whitespace-nowrap shrink-0 ${
              inspectorOpen
                ? 'border-teal-600 bg-teal-50 text-teal-800'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Theme Editor
          </button>
        </div>
      </div>

      {/* Preview Canvas + Live Theme Editor Sidebar */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div
          className={`flex justify-center overflow-auto rounded-xl border border-slate-200 bg-slate-100 p-4 ${
            inspectorOpen ? 'xl:col-span-8' : 'xl:col-span-12'
          }`}
        >
          <div
            style={{ width: iframeMaxWidth }}
            className="overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm transition-all duration-200"
          >
            <iframe
              title="Shopify Section Live Preview"
              sandbox="allow-scripts"
              srcDoc={srcDoc}
              className="h-[600px] w-full border-0 bg-white"
            />
          </div>
        </div>

        {inspectorOpen && (
          <aside className="max-h-[634px] overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 xl:col-span-4">
            <div className="mb-3 border-b border-slate-100 pb-2.5">
              <h3 className="text-xs font-semibold text-slate-900">
                Theme Editor Settings
              </h3>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Changes re-evaluate the Liquid template live.
              </p>
            </div>

            <div className="space-y-3">
              {schema?.settings.map((setting, idx) =>
                renderSettingControl(
                  setting,
                  setting.id ? settingsState[setting.id] : undefined,
                  (nextVal) => {
                    if (!setting.id) return;
                    setSettingsState((prev) => ({ ...prev, [setting.id!]: nextVal }));
                  },
                  `sec-${idx}`
                )
              )}
            </div>

            {/* Editable Blocks */}
            {schema?.blocks && schema.blocks.length > 0 && (
              <div className="mt-5 border-t border-slate-200 pt-4">
                <div className="mb-2.5 flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-900">
                    Section Blocks ({blocksState.length})
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      const def = schema.blocks![0];
                      if (def.limit && blocksState.length >= def.limit) return;
                      const nextSettings: Record<string, unknown> = {};
                      def.settings.forEach((s) => {
                        if (s.id && s.default !== undefined) nextSettings[s.id] = s.default;
                      });
                      setBlocksState((prev) => [
                        ...prev,
                        {
                          id: `block-${Date.now()}`,
                          type: def.type,
                          settings: nextSettings,
                        },
                      ]);
                    }}
                    className="inline-flex items-center gap-1 rounded border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Plus className="h-3 w-3" />
                    Add {schema.blocks[0].name}
                  </button>
                </div>

                <div className="space-y-3">
                  {blocksState.map((blk, blkIdx) => {
                    const def = schema.blocks?.find((b) => b.type === blk.type);
                    return (
                      <div
                        key={blk.id}
                        className="rounded-lg border border-slate-200 bg-slate-50/70 p-3"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-800">
                            {def?.name || blk.type} #{blkIdx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setBlocksState((prev) =>
                                prev.filter((item) => item.id !== blk.id)
                              )
                            }
                            className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                            aria-label="Remove block"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="space-y-2.5">
                          {def?.settings.map((s, sIdx) =>
                            renderSettingControl(
                              s,
                              s.id ? blk.settings[s.id] : undefined,
                              (nextVal) => {
                                if (!s.id) return;
                                setBlocksState((prev) =>
                                  prev.map((item) =>
                                    item.id === blk.id
                                      ? {
                                          ...item,
                                          settings: {
                                            ...item.settings,
                                            [s.id!]: nextVal,
                                          },
                                        }
                                      : item
                                  )
                                );
                              },
                              `${blk.id}-${sIdx}`
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
};
