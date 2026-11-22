import { useRef, useState } from 'react';
import {
  ImagePlus,
  Layers,
  Maximize2,
  Replace,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  SAMPLE_UI_PRESETS,
  fileToBrandAssetInput,
  fileToScreenshotInput,
  formatBytes,
  loadSamplePresetAsScreenshot,
  type SampleUiPreset,
} from '../lib/imageUtils';
import type {
  BrandAssetInput,
  MultiScreenshotRelation,
  ScreenshotInput,
} from '../shared/types';
import { MAX_ASSETS, MAX_SCREENSHOTS } from '../shared/validation';

interface ImageInputPanelProps {
  screenshots: ScreenshotInput[];
  assets: BrandAssetInput[];
  multiRelation: MultiScreenshotRelation;
  onChangeScreenshots: (next: ScreenshotInput[]) => void;
  onChangeAssets: (next: BrandAssetInput[]) => void;
  onChangeMultiRelation: (next: MultiScreenshotRelation) => void;
  onError: (message: string) => void;
}

export function ImageInputPanel({
  screenshots,
  assets,
  multiRelation,
  onChangeScreenshots,
  onChangeAssets,
  onChangeMultiRelation,
  onError,
}: ImageInputPanelProps) {
  const screenshotInputRef = useRef<HTMLInputElement | null>(null);
  const replaceInputRef = useRef<HTMLInputElement | null>(null);
  const assetInputRef = useRef<HTMLInputElement | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const [loadingSampleId, setLoadingSampleId] = useState<string | null>(null);
  const [inspectedShot, setInspectedShot] = useState<ScreenshotInput | null>(null);
  const [showAssetsTray, setShowAssetsTray] = useState(false);

  async function handleScreenshotFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    const remaining = MAX_SCREENSHOTS - screenshots.length;
    if (remaining <= 0) {
      onError(`Maximum ${MAX_SCREENSHOTS} screenshots allowed. Remove one before adding more.`);
      return;
    }

    const toProcess = files.slice(0, remaining);
    const added: ScreenshotInput[] = [];
    for (const f of toProcess) {
      try {
        added.push(await fileToScreenshotInput(f));
      } catch (err) {
        onError(err instanceof Error ? err.message : 'Failed to load image.');
      }
    }
    if (added.length > 0) {
      onChangeScreenshots([...screenshots, ...added]);
    }
  }

  async function handleReplaceFile(file: File | undefined) {
    if (!file || !replacingId) return;
    try {
      const existing = screenshots.find((s) => s.id === replacingId);
      const nextShot = await fileToScreenshotInput(file, existing?.roleLabel);
      onChangeScreenshots(
        screenshots.map((s) => (s.id === replacingId ? nextShot : s))
      );
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to replace screenshot.');
    } finally {
      setReplacingId(null);
    }
  }

  async function handleAssetFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    const remaining = MAX_ASSETS - assets.length;
    if (remaining <= 0) {
      onError(`Maximum ${MAX_ASSETS} brand assets allowed.`);
      return;
    }
    const added: BrandAssetInput[] = [];
    for (const f of files.slice(0, remaining)) {
      try {
        added.push(await fileToBrandAssetInput(f));
      } catch (err) {
        onError(err instanceof Error ? err.message : 'Failed to load brand asset.');
      }
    }
    if (added.length > 0) {
      onChangeAssets([...assets, ...added]);
    }
  }

  async function handleLoadSample(preset: SampleUiPreset) {
    setLoadingSampleId(preset.id);
    try {
      const shot = await loadSamplePresetAsScreenshot(preset);
      onChangeScreenshots([shot]);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Could not load sample screenshot.');
    } finally {
      setLoadingSampleId(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Hidden file inputs */}
      <input
        ref={screenshotInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleScreenshotFiles(e.target.files);
          e.target.value = '';
        }}
      />
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          handleReplaceFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      <input
        ref={assetInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleAssetFiles(e.target.files);
          e.target.value = '';
        }}
      />

      {/* Upload Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files?.length) {
            handleScreenshotFiles(e.dataTransfer.files);
          }
        }}
        className={`rounded-lg border border-dashed p-5 text-center transition-colors ${
          isDragging
            ? 'border-blue-600 bg-blue-50/70'
            : 'border-slate-300 bg-slate-50/60 hover:border-slate-400'
        }`}
      >
        <div className="mx-auto mb-2.5 flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700">
          <Upload className="h-4 w-4" aria-hidden="true" />
        </div>
        <p className="text-sm font-medium text-slate-900">
          Drop UI screenshots here, paste from clipboard, or browse
        </p>
        <p className="mt-1 text-xs text-slate-500">
          PNG · JPG/JPEG · WebP · Up to 10 MB per image · Ctrl+V / Cmd+V supported
        </p>
        <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => screenshotInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50 cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            <ImagePlus className="h-3.5 w-3.5" aria-hidden="true" />
            Upload Screenshot(s)
          </button>
          <button
            type="button"
            onClick={() => setShowAssetsTray((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            <Layers className="h-3.5 w-3.5" aria-hidden="true" />
            Brand Assets ({assets.length})
          </button>
        </div>

        {/* Sample reference loaders */}
        <div className="mt-4 border-t border-slate-200/80 pt-3">
          <p className="mb-2 text-xs font-medium text-slate-500">
            Load reference UI sample:
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {SAMPLE_UI_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                disabled={loadingSampleId !== null}
                onClick={() => handleLoadSample(preset)}
                className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:border-blue-300 hover:text-blue-700 disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
              >
                {loadingSampleId === preset.id ? 'Loading...' : preset.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Uploaded Screenshots List */}
      {screenshots.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">
              Reference Screenshots ({screenshots.length}/{MAX_SCREENSHOTS})
            </span>
            {screenshots.length > 1 && (
              <button
                type="button"
                onClick={() => onChangeScreenshots([])}
                className="text-xs text-slate-500 hover:text-red-600 cursor-pointer"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {screenshots.map((shot) => (
              <div
                key={shot.id}
                className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-2.5"
              >
                <button
                  type="button"
                  onClick={() => setInspectedShot(shot)}
                  title="Preview full screenshot"
                  className="group relative h-16 w-24 shrink-0 overflow-hidden rounded border border-slate-200 bg-slate-100 cursor-pointer"
                >
                  <img
                    src={`data:${shot.mimeType};base64,${shot.base64}`}
                    alt={shot.name}
                    className="h-full w-full object-cover object-top"
                  />
                  <span className="absolute inset-0 flex items-center justify-center bg-slate-900/0 text-white opacity-0 transition-opacity group-hover:bg-slate-900/40 group-hover:opacity-100">
                    <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                </button>

                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-medium text-slate-900">
                      {shot.name}
                    </p>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setReplacingId(shot.id);
                          replaceInputRef.current?.click();
                        }}
                        title="Replace image"
                        className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                      >
                        <Replace className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onChangeScreenshots(screenshots.filter((s) => s.id !== shot.id))
                        }
                        title="Remove screenshot"
                        className="rounded p-1 text-slate-500 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-500 tabular-nums">
                    {shot.width && shot.height && (
                      <>
                        <span>
                          {shot.width} × {shot.height}px
                        </span>
                        <span aria-hidden="true">·</span>
                      </>
                    )}
                    <span>{formatBytes(shot.sizeBytes)}</span>
                  </div>

                  <input
                    type="text"
                    value={shot.roleLabel}
                    onChange={(e) =>
                      onChangeScreenshots(
                        screenshots.map((s) =>
                          s.id === shot.id ? { ...s, roleLabel: e.target.value } : s
                        )
                      )
                    }
                    aria-label={`Role label for ${shot.name}`}
                    placeholder="Screen role (e.g., Desktop Homepage)"
                    className="w-full rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Multi-Screenshot Relationship Selector */}
          {screenshots.length > 1 && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <label
                htmlFor="multi-shot-relation"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Multi-Screenshot Relationship
              </label>
              <select
                id="multi-shot-relation"
                value={multiRelation}
                onChange={(e) =>
                  onChangeMultiRelation(e.target.value as MultiScreenshotRelation)
                }
                className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
              >
                <option value="different_pages">
                  Different Pages (extract shared Layout/Header/Footer)
                </option>
                <option value="responsive_breakpoints">
                  Responsive Breakpoints (Desktop / Tablet / Mobile views)
                </option>
                <option value="page_states">
                  Interactive States (default, modal open, dropdown, tabs)
                </option>
              </select>
            </div>
          )}
        </div>
      )}

      {/* Optional Brand Assets Tray */}
      {showAssetsTray && (
        <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-semibold text-slate-900">
                Supplementary Brand Assets
              </h3>
              <p className="text-[11px] text-slate-500">
                Upload logos, product photos, or icons to inject into generated code.
              </p>
            </div>
            <button
              type="button"
              onClick={() => assetInputRef.current?.click()}
              className="rounded-md border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer whitespace-nowrap shrink-0"
            >
              Add Asset
            </button>
          </div>

          {assets.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-1">
              No brand assets uploaded yet. Unmatched image slots will use safe SVG/CSS placeholders.
            </p>
          ) : (
            <div className="space-y-2">
              {assets.map((asset) => (
                <div
                  key={asset.id}
                  className="flex items-center gap-2.5 rounded border border-slate-200 bg-slate-50 p-2"
                >
                  <img
                    src={`data:${asset.mimeType};base64,${asset.base64}`}
                    alt={asset.label}
                    className="h-9 w-9 rounded border border-slate-200 bg-white object-contain p-0.5 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <input
                      type="text"
                      value={asset.label}
                      onChange={(e) =>
                        onChangeAssets(
                          assets.map((a) =>
                            a.id === asset.id
                              ? {
                                  ...a,
                                  label: e.target.value
                                    .toLowerCase()
                                    .replace(/[^a-z0-9_-]/g, '-'),
                                }
                              : a
                          )
                        )
                      }
                      aria-label="Asset reference label"
                      className="w-full rounded border border-slate-200 bg-white px-2 py-0.5 font-mono text-xs text-slate-800"
                    />
                    <p className="mt-0.5 truncate text-[11px] text-slate-500">
                      Referenced as /assets/{asset.label}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onChangeAssets(assets.filter((a) => a.id !== asset.id))}
                    className="rounded p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                    title="Remove asset"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Full Screenshot Lightbox Modal */}
      {inspectedShot && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-6"
          onClick={() => setInspectedShot(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-5xl overflow-auto rounded-xl border border-slate-700 bg-white p-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between gap-4 border-b border-slate-200 pb-2">
              <div className="text-xs font-medium text-slate-800">
                {inspectedShot.roleLabel} · {inspectedShot.name}
                {inspectedShot.width && inspectedShot.height
                  ? ` (${inspectedShot.width} × ${inspectedShot.height})`
                  : ''}
              </div>
              <button
                type="button"
                onClick={() => setInspectedShot(null)}
                className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                aria-label="Close screenshot preview"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <img
              src={`data:${inspectedShot.mimeType};base64,${inspectedShot.base64}`}
              alt={inspectedShot.name}
              className="max-h-[78vh] w-auto rounded border border-slate-200 object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
