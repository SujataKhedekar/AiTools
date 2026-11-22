import React, { useEffect, useRef, useState } from 'react';
import {
  ImagePlus,
  RefreshCw,
  Trash2,
  Upload,
  X,
  ZoomIn,
  Clipboard,
} from 'lucide-react';
import { SAMPLE_DESIGN_PRESETS, type SampleDesignPreset } from '../data/samples';
import type { UploadedReferenceImage } from '../types/shopify';

interface ImageUploadPanelProps {
  images: UploadedReferenceImage[];
  onChangeImages: (next: UploadedReferenceImage[]) => void;
  onApplySamplePreset: (preset: SampleDesignPreset, image: UploadedReferenceImage) => void;
}

const ACCEPTED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const IMAGE_ROLES: UploadedReferenceImage['role'][] = [
  'Primary Desktop',
  'Mobile Reference',
  'Interaction State',
  'Detail Reference',
];

function fileToReferenceImage(
  file: File,
  role: UploadedReferenceImage['role']
): Promise<UploadedReferenceImage> {
  return new Promise((resolve, reject) => {
    const mimeType = file.type as UploadedReferenceImage['mimeType'];
    if (!ACCEPTED_TYPES.has(mimeType)) {
      reject(new Error(`"${file.name}" is not a PNG, JPG, JPEG, or WebP image.`));
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      reject(new Error(`"${file.name}" exceeds the 6MB per-image limit.`));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      const commaIdx = dataUrl.indexOf(',');
      const dataBase64 = commaIdx !== -1 ? dataUrl.slice(commaIdx + 1) : '';
      resolve({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: file.name || 'pasted-screenshot.png',
        mimeType,
        dataBase64,
        previewUrl: dataUrl,
        role,
        sizeBytes: file.size,
      });
    };
    reader.onerror = () => reject(new Error(`Failed to read "${file.name}".`));
    reader.readAsDataURL(file);
  });
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const ImageUploadPanel: React.FC<ImageUploadPanelProps> = ({
  images,
  onChangeImages,
  onApplySamplePreset,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [replaceTargetId, setReplaceTargetId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<UploadedReferenceImage | null>(null);
  const [loadingSampleId, setLoadingSampleId] = useState<string | null>(null);

  const handleFiles = async (fileList: FileList | File[]) => {
    setUploadError(null);
    const files = Array.from(fileList);
    if (files.length === 0) return;

    const remaining = 6 - images.length;
    if (remaining <= 0) {
      setUploadError('Maximum 6 reference images allowed. Remove an image to add another.');
      return;
    }

    const toProcess = files.slice(0, remaining);
    const converted: UploadedReferenceImage[] = [];
    for (let i = 0; i < toProcess.length; i++) {
      try {
        const defaultRole: UploadedReferenceImage['role'] =
          images.length === 0 && i === 0 ? 'Primary Desktop' : 'Detail Reference';
        const refImg = await fileToReferenceImage(toProcess[i], defaultRole);
        converted.push(refImg);
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : 'Failed to process image.');
      }
    }
    if (converted.length > 0) {
      onChangeImages([...images, ...converted]);
    }
  };

  // Global clipboard paste support
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const imageFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file' && ACCEPTED_TYPES.has(item.type)) {
          const file = item.getAsFile();
          if (file) imageFiles.push(file);
        }
      }
      if (imageFiles.length > 0) {
        e.preventDefault();
        void handleFiles(imageFiles);
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  });

  const handleReplaceFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !replaceTargetId) return;
    setUploadError(null);
    try {
      const target = images.find((img) => img.id === replaceTargetId);
      const nextImg = await fileToReferenceImage(file, target?.role || 'Primary Desktop');
      onChangeImages(images.map((img) => (img.id === replaceTargetId ? nextImg : img)));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to replace image.');
    } finally {
      setReplaceTargetId(null);
    }
  };

  const handleSampleSelect = async (preset: SampleDesignPreset) => {
    setUploadError(null);
    setLoadingSampleId(preset.id);
    try {
      const res = await fetch(preset.imageUrl);
      if (!res.ok) throw new Error('Could not load sample screenshot.');
      const blob = await res.blob();
      const file = new File([blob], `${preset.id}.jpg`, { type: 'image/jpeg' });
      const refImg = await fileToReferenceImage(file, 'Primary Desktop');
      onApplySamplePreset(preset, refImg);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to load sample design.');
    } finally {
      setLoadingSampleId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Reference Design</h2>
        <span className="text-xs text-slate-500 tabular-nums">{images.length} / 6 images</span>
      </div>

      {/* Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files) {
            void handleFiles(e.dataTransfer.files);
          }
        }}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        aria-label="Upload design screenshots"
        className={`group cursor-pointer rounded-xl border border-dashed p-5 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 ${
          isDragging
            ? 'border-teal-600 bg-teal-50/60'
            : 'border-slate-300 bg-slate-50/70 hover:border-slate-400 hover:bg-slate-100/70'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) void handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
        <input
          ref={replaceInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={handleReplaceFile}
        />

        <div className="mx-auto mb-2.5 flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700">
          <Upload className="h-4 w-4" />
        </div>
        <p className="text-sm font-medium text-slate-800">
          Drop screenshots or click to upload
        </p>
        <p className="mt-1 flex items-center justify-center gap-1.5 text-xs text-slate-500">
          <span>PNG, JPG, WebP</span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1">
            <Clipboard className="h-3 w-3" />
            Paste with Ctrl+V
          </span>
        </p>
      </div>

      {uploadError && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
        >
          {uploadError}
        </div>
      )}

      {/* Uploaded thumbnails list */}
      {images.length > 0 && (
        <div className="space-y-2.5">
          {images.map((img, idx) => (
            <div
              key={img.id}
              className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-2.5"
            >
              <button
                type="button"
                onClick={() => setLightboxImage(img)}
                className="group relative h-16 w-24 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
                title="Preview full screenshot"
              >
                <img
                  src={img.previewUrl}
                  alt={img.name}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
                <span className="absolute inset-0 flex items-center justify-center bg-slate-900/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <ZoomIn className="h-4 w-4 text-white" />
                </span>
              </button>

              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-xs font-medium text-slate-800" title={img.name}>
                    {idx + 1}. {img.name}
                  </p>
                  <span className="shrink-0 text-[11px] text-slate-400 tabular-nums">
                    {formatBytes(img.sizeBytes)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <select
                    value={img.role}
                    onChange={(e) => {
                      const nextRole = e.target.value as UploadedReferenceImage['role'];
                      onChangeImages(
                        images.map((item) =>
                          item.id === img.id ? { ...item, role: nextRole } : item
                        )
                      );
                    }}
                    aria-label={`Role for ${img.name}`}
                    className="h-7 rounded border border-slate-200 bg-slate-50 px-2 text-[11px] font-medium text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
                  >
                    {IMAGE_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setReplaceTargetId(img.id);
                        replaceInputRef.current?.click();
                      }}
                      className="inline-flex h-7 items-center gap-1 rounded px-2 text-[11px] font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      title="Replace image"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Replace
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onChangeImages(images.filter((item) => item.id !== img.id))
                      }
                      className="inline-flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:bg-red-50 hover:text-red-600"
                      title="Remove image"
                      aria-label={`Remove ${img.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {images.length < 6 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <ImagePlus className="h-3.5 w-3.5" />
              Add another reference view (mobile, hover, variant)
            </button>
          )}
        </div>
      )}

      {/* Quick-start sample screenshots */}
      <div className="border-t border-slate-200 pt-3.5">
        <p className="mb-2 text-xs font-medium text-slate-600">
          Or load a sample section reference
        </p>
        <div className="grid grid-cols-3 gap-2">
          {SAMPLE_DESIGN_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              disabled={loadingSampleId === preset.id}
              onClick={() => void handleSampleSelect(preset)}
              className="group overflow-hidden rounded-lg border border-slate-200 bg-white text-left transition-colors hover:border-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 disabled:opacity-50"
            >
              <div className="aspect-video w-full overflow-hidden bg-slate-100">
                <img
                  src={preset.imageUrl}
                  alt={preset.title}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                />
              </div>
              <div className="p-1.5">
                <p className="truncate text-[11px] font-medium text-slate-800">
                  {preset.category}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-6"
          onClick={() => setLightboxImage(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Reference image preview"
        >
          <div
            className="relative max-h-[90vh] max-w-5xl overflow-hidden rounded-xl border border-slate-700 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2.5">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <span className="font-semibold text-slate-900">{lightboxImage.name}</span>
                <span aria-hidden="true">·</span>
                <span>{lightboxImage.role}</span>
              </div>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                aria-label="Close preview"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[80vh] overflow-auto bg-slate-100 p-4">
              <img
                src={lightboxImage.previewUrl}
                alt={lightboxImage.name}
                referrerPolicy="no-referrer"
                className="mx-auto max-h-[72vh] w-auto rounded border border-slate-200 object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
