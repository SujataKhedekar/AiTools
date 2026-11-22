import React, { useCallback, useEffect, useRef, useState } from 'react';
import { TopBar } from './components/TopBar';
import { ToolRail } from './components/ToolRail';
import { CanvasStage } from './components/CanvasStage';
import { Filmstrip } from './components/Filmstrip';
import { InspectorPanel } from './components/InspectorPanel';
import { SAMPLE_PHOTOS } from './data/samples';
import {
  applyBrushStroke,
  applyMagicWand,
  compositeRealTimeMatte,
  computeSmartBorderMatte,
  createScratchBuffers,
  drawStudioComposition,
  MatteScratchBuffers,
} from './engine/mattingEngine';
import { computeNeuralAlphaMatte } from './engine/neuralEngine';
import {
  BackdropSettings,
  BrushSettings,
  CheckerStyle,
  DEFAULT_BACKDROP_SETTINGS,
  DEFAULT_BRUSH_SETTINGS,
  DEFAULT_MATTE_SETTINGS,
  EngineMode,
  ExportFormat,
  MatteSettings,
  NeuralStatus,
  PhotoItem,
  ToolMode,
} from './types/studio';

const MAX_WORK_EDGE = 1080;
const MAX_HISTORY = 25;

interface CachedNeuralMask {
  mask: Uint8ClampedArray;
  width: number;
  height: number;
  elapsedMs: number;
}

export default function App() {
  const [photos, setPhotos] = useState<PhotoItem[]>(SAMPLE_PHOTOS);
  const [activePhotoId, setActivePhotoId] = useState<string>(SAMPLE_PHOTOS[0].id);

  const [engineMode, setEngineMode] = useState<EngineMode>('neural');
  const [activeTool, setActiveTool] = useState<ToolMode>('compare');
  const [compareActive, setCompareActive] = useState<boolean>(false);
  const [peekOriginal, setPeekOriginal] = useState<boolean>(false);
  const [checkerStyle, setCheckerStyle] = useState<CheckerStyle>('dark');

  const [matte, setMatte] = useState<MatteSettings>(DEFAULT_MATTE_SETTINGS);
  const [brush, setBrush] = useState<BrushSettings>(DEFAULT_BRUSH_SETTINGS);
  const [backdrop, setBackdrop] = useState<BackdropSettings>(DEFAULT_BACKDROP_SETTINGS);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('png');

  const [workDims, setWorkDims] = useState<{ w: number; h: number }>({ w: 960, h: 720 });
  const [naturalDims, setNaturalDims] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const [isLoadingImage, setIsLoadingImage] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [notice, setNotice] = useState<string | null>(null);

  const [neuralStatus, setNeuralStatus] = useState<NeuralStatus>({
    state: 'idle',
    progress: 0,
    message: 'Preparing neural matte…',
  });

  const [historyMeta, setHistoryMeta] = useState<{
    canUndo: boolean;
    canRedo: boolean;
    hasManualEdits: boolean;
  }>({
    canUndo: false,
    canRedo: false,
    hasManualEdits: false,
  });

  // Visible canvas refs
  const outputCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Offscreen high-speed processing buffers
  const sourceCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fgCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const sourceRgbaRef = useRef<Uint8ClampedArray | null>(null);
  const outImageDataRef = useRef<ImageData | null>(null);
  const scratchRef = useRef<MatteScratchBuffers | null>(null);

  const smartMaskRef = useRef<Uint8ClampedArray | null>(null);
  const neuralMaskRef = useRef<Uint8ClampedArray | null>(null);
  const manualMaskRef = useRef<Int16Array | null>(null);

  const undoStackRef = useRef<Int16Array[]>([]);
  const redoStackRef = useRef<Int16Array[]>([]);

  const customBackdropImgRef = useRef<HTMLImageElement | null>(null);
  const neuralCacheRef = useRef<Map<string, CachedNeuralMask>>(new Map());
  const neuralTokenRef = useRef<number>(0);

  const lastBrushPosRef = useRef<{ x: number; y: number } | null>(null);
  const rafIdRef = useRef<number | null>(null);

  // Keep latest reactive settings in refs for 60fps RAF compositor
  const engineModeRef = useRef<EngineMode>(engineMode);
  const matteRef = useRef<MatteSettings>(matte);
  const backdropRef = useRef<BackdropSettings>(backdrop);
  const workDimsRef = useRef<{ w: number; h: number }>(workDims);

  engineModeRef.current = engineMode;
  matteRef.current = matte;
  backdropRef.current = backdrop;
  workDimsRef.current = workDims;

  const activePhoto = photos.find((p) => p.id === activePhotoId) ?? photos[0];

  const showNotice = useCallback((msg: string) => {
    setNotice(msg);
    window.setTimeout(() => {
      setNotice((curr) => (curr === msg ? null : curr));
    }, 2600);
  }, []);

  const syncHistoryMeta = useCallback(() => {
    const manual = manualMaskRef.current;
    let hasEdits = false;
    if (manual) {
      for (let i = 0; i < manual.length; i++) {
        if (manual[i] !== 0) {
          hasEdits = true;
          break;
        }
      }
    }
    setHistoryMeta({
      canUndo: undoStackRef.current.length > 0,
      canRedo: redoStackRef.current.length > 0,
      hasManualEdits: hasEdits,
    });
  }, []);

  // Core 60fps real-time render pass
  const renderFrameNow = useCallback(() => {
    rafIdRef.current = null;
    const outputCanvas = outputCanvasRef.current;
    const sourceCanvas = sourceCanvasRef.current;
    const fgCanvas = fgCanvasRef.current;
    const sourceRgba = sourceRgbaRef.current;
    const outImgData = outImageDataRef.current;
    const scratch = scratchRef.current;
    const manualMask = manualMaskRef.current;
    const { w, h } = workDimsRef.current;

    if (
      !outputCanvas ||
      !sourceCanvas ||
      !fgCanvas ||
      !sourceRgba ||
      !outImgData ||
      !scratch ||
      !manualMask ||
      w <= 0 ||
      h <= 0
    ) {
      return;
    }

    // Use neural matte if active and ready, otherwise instant smart matte
    const baseMask =
      engineModeRef.current === 'neural' && neuralMaskRef.current
        ? neuralMaskRef.current
        : smartMaskRef.current;

    if (!baseMask) return;

    compositeRealTimeMatte(
      sourceRgba,
      baseMask,
      manualMask,
      outImgData.data,
      scratch,
      w,
      h,
      matteRef.current
    );

    const fgCtx = fgCanvas.getContext('2d');
    const outCtx = outputCanvas.getContext('2d');
    if (!fgCtx || !outCtx) return;

    fgCtx.putImageData(outImgData, 0, 0);
    drawStudioComposition(
      outCtx,
      w,
      h,
      sourceCanvas,
      fgCanvas,
      backdropRef.current,
      customBackdropImgRef.current
    );
  }, []);

  const scheduleRender = useCallback(() => {
    if (rafIdRef.current !== null) return;
    rafIdRef.current = window.requestAnimationFrame(renderFrameNow);
  }, [renderFrameNow]);

  // Run or fetch cached Neural AI matte
  const runNeuralForActivePhoto = useCallback(
    async (photoId: string, width: number, height: number, forceFresh = false) => {
      const sourceCanvas = sourceCanvasRef.current;
      if (!sourceCanvas) return;

      if (!forceFresh) {
        const cached = neuralCacheRef.current.get(photoId);
        if (cached && cached.width === width && cached.height === height) {
          neuralMaskRef.current = cached.mask;
          setNeuralStatus({
            state: 'ready',
            progress: 100,
            message: 'AI Neural matte ready',
            elapsedMs: cached.elapsedMs,
          });
          scheduleRender();
          return;
        }
      }

      const token = ++neuralTokenRef.current;
      setNeuralStatus({
        state: 'loading',
        progress: 12,
        message: 'Detecting subject…',
      });

      try {
        const { mask, elapsedMs } = await computeNeuralAlphaMatte(
          sourceCanvas,
          width,
          height,
          (ev) => {
            if (neuralTokenRef.current !== token) return;
            setNeuralStatus({
              state: 'loading',
              progress: ev.progress,
              message: ev.message,
            });
          }
        );

        if (neuralTokenRef.current !== token) return;

        neuralCacheRef.current.set(photoId, { mask, width, height, elapsedMs });
        neuralMaskRef.current = mask;
        setNeuralStatus({
          state: 'ready',
          progress: 100,
          message: 'AI Neural matte ready',
          elapsedMs,
        });
        scheduleRender();
      } catch {
        if (neuralTokenRef.current !== token) return;
        neuralMaskRef.current = null;
        setNeuralStatus({
          state: 'error',
          progress: 0,
          message: 'Instant edge fallback active',
        });
        scheduleRender();
      }
    },
    [scheduleRender]
  );

  // Load photo into working canvas + compute instant Smart Matte + kick off Neural Matte
  useEffect(() => {
    if (!activePhoto) return;
    let cancelled = false;
    setIsLoadingImage(true);
    neuralMaskRef.current = null;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (cancelled) return;

      const natW = img.naturalWidth;
      const natH = img.naturalHeight;
      const scale = Math.min(1, MAX_WORK_EDGE / Math.max(natW, natH));
      const w = Math.max(1, Math.round(natW * scale));
      const h = Math.max(1, Math.round(natH * scale));

      // Offscreen source canvas
      const srcCanvas = document.createElement('canvas');
      srcCanvas.width = w;
      srcCanvas.height = h;
      const srcCtx = srcCanvas.getContext('2d', { willReadFrequently: true });
      if (!srcCtx) return;
      srcCtx.drawImage(img, 0, 0, w, h);
      const srcData = srcCtx.getImageData(0, 0, w, h);

      // Offscreen foreground canvas
      const fgCanvas = document.createElement('canvas');
      fgCanvas.width = w;
      fgCanvas.height = h;

      // Resize visible canvases
      if (outputCanvasRef.current) {
        outputCanvasRef.current.width = w;
        outputCanvasRef.current.height = h;
      }
      if (originalCanvasRef.current) {
        originalCanvasRef.current.width = w;
        originalCanvasRef.current.height = h;
        const origCtx = originalCanvasRef.current.getContext('2d');
        origCtx?.drawImage(srcCanvas, 0, 0);
      }

      sourceCanvasRef.current = srcCanvas;
      fgCanvasRef.current = fgCanvas;
      sourceRgbaRef.current = srcData.data;
      outImageDataRef.current = new ImageData(w, h);
      scratchRef.current = createScratchBuffers(w * h);
      manualMaskRef.current = new Int16Array(w * h);
      undoStackRef.current = [];
      redoStackRef.current = [];
      syncHistoryMeta();

      // Instant ~10ms edge-aware matte so photo cutout appears immediately!
      smartMaskRef.current = computeSmartBorderMatte(
        srcData.data,
        w,
        h,
        matteRef.current.smartTolerance,
        matteRef.current.smartEdgeStrength
      );

      workDimsRef.current = { w, h };
      setWorkDims({ w, h });
      setNaturalDims({ w: natW, h: natH });
      setIsLoadingImage(false);

      renderFrameNow();

      if (engineModeRef.current === 'neural') {
        void runNeuralForActivePhoto(activePhoto.id, w, h, false);
      }
    };

    img.onerror = () => {
      if (cancelled) return;
      setIsLoadingImage(false);
      showNotice('Could not load selected photo.');
    };

    img.src = activePhoto.src;

    return () => {
      cancelled = true;
    };
  }, [activePhoto?.id, activePhoto?.src, renderFrameNow, runNeuralForActivePhoto, showNotice, syncHistoryMeta]);

  // Recompute Smart Edge matte in real time when Smart tolerances change
  useEffect(() => {
    const srcRgba = sourceRgbaRef.current;
    const { w, h } = workDimsRef.current;
    if (!srcRgba || w <= 0 || h <= 0) return;

    smartMaskRef.current = computeSmartBorderMatte(
      srcRgba,
      w,
      h,
      matte.smartTolerance,
      matte.smartEdgeStrength
    );
    scheduleRender();
  }, [matte.smartTolerance, matte.smartEdgeStrength, scheduleRender]);

  // Trigger real-time recomposite whenever matte sliders, backdrop, or engine change
  useEffect(() => {
    if (engineMode === 'neural' && !neuralMaskRef.current && activePhoto && !isLoadingImage) {
      void runNeuralForActivePhoto(activePhoto.id, workDimsRef.current.w, workDimsRef.current.h, false);
    }
    scheduleRender();
  }, [
    engineMode,
    matte.threshold,
    matte.edgeShift,
    matte.feather,
    matte.decontaminate,
    matte.invertMask,
    backdrop,
    activePhoto,
    isLoadingImage,
    runNeuralForActivePhoto,
    scheduleRender,
  ]);

  // Load custom backdrop image when set
  useEffect(() => {
    if (!backdrop.customImageUrl) {
      customBackdropImgRef.current = null;
      scheduleRender();
      return;
    }
    const img = new Image();
    img.onload = () => {
      customBackdropImgRef.current = img;
      scheduleRender();
    };
    img.src = backdrop.customImageUrl;
  }, [backdrop.customImageUrl, scheduleRender]);

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        window.cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  // Push manual mask snapshot for Undo
  const pushUndoSnapshot = useCallback(() => {
    const manual = manualMaskRef.current;
    if (!manual) return;
    undoStackRef.current.push(new Int16Array(manual));
    if (undoStackRef.current.length > MAX_HISTORY) {
      undoStackRef.current.shift();
    }
    redoStackRef.current = [];
  }, []);

  const handleUndo = useCallback(() => {
    const prev = undoStackRef.current.pop();
    const curr = manualMaskRef.current;
    if (!prev || !curr) return;
    redoStackRef.current.push(new Int16Array(curr));
    curr.set(prev);
    syncHistoryMeta();
    scheduleRender();
  }, [scheduleRender, syncHistoryMeta]);

  const handleRedo = useCallback(() => {
    const next = redoStackRef.current.pop();
    const curr = manualMaskRef.current;
    if (!next || !curr) return;
    undoStackRef.current.push(new Int16Array(curr));
    curr.set(next);
    syncHistoryMeta();
    scheduleRender();
  }, [scheduleRender, syncHistoryMeta]);

  const handleClearManualEdits = useCallback(() => {
    const manual = manualMaskRef.current;
    if (!manual) return;
    pushUndoSnapshot();
    manual.fill(0);
    syncHistoryMeta();
    scheduleRender();
  }, [pushUndoSnapshot, scheduleRender, syncHistoryMeta]);

  // Real-time interactive brush painting handlers
  const handleStrokeStart = useCallback(
    (x: number, y: number) => {
      const manual = manualMaskRef.current;
      if (!manual) return;
      pushUndoSnapshot();
      lastBrushPosRef.current = { x, y };
      const mode = activeTool === 'restore' ? 'restore' : 'erase';
      applyBrushStroke(
        manual,
        workDimsRef.current.w,
        workDimsRef.current.h,
        x,
        y,
        x,
        y,
        brush.size * 0.5,
        brush.hardness,
        mode
      );
      scheduleRender();
    },
    [activeTool, brush.hardness, brush.size, pushUndoSnapshot, scheduleRender]
  );

  const handleStrokeMove = useCallback(
    (x: number, y: number) => {
      const manual = manualMaskRef.current;
      const last = lastBrushPosRef.current;
      if (!manual || !last) return;
      const mode = activeTool === 'restore' ? 'restore' : 'erase';
      applyBrushStroke(
        manual,
        workDimsRef.current.w,
        workDimsRef.current.h,
        last.x,
        last.y,
        x,
        y,
        brush.size * 0.5,
        brush.hardness,
        mode
      );
      lastBrushPosRef.current = { x, y };
      scheduleRender();
    },
    [activeTool, brush.hardness, brush.size, scheduleRender]
  );

  const handleStrokeEnd = useCallback(() => {
    lastBrushPosRef.current = null;
    syncHistoryMeta();
  }, [syncHistoryMeta]);

  const handleWandClick = useCallback(
    (x: number, y: number) => {
      const manual = manualMaskRef.current;
      const rgba = sourceRgbaRef.current;
      if (!manual || !rgba) return;
      pushUndoSnapshot();
      const affected = applyMagicWand(
        rgba,
        manual,
        workDimsRef.current.w,
        workDimsRef.current.h,
        x,
        y,
        brush.wandTolerance,
        brush.wandMode
      );
      if (affected > 0) {
        syncHistoryMeta();
        scheduleRender();
      }
    },
    [brush.wandMode, brush.wandTolerance, pushUndoSnapshot, scheduleRender, syncHistoryMeta]
  );

  // Add uploaded/dropped/pasted photos
  const addImageFiles = useCallback(
    (fileList: FileList | File[]) => {
      const validFiles = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
      if (validFiles.length === 0) {
        showNotice('Please choose a valid JPG, PNG, or WebP photo.');
        return;
      }

      const newItems: PhotoItem[] = validFiles.map((file, idx) => {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').slice(0, 26) || `Photo ${idx + 1}`;
        return {
          id: `upload-${Date.now()}-${idx}`,
          name: cleanName,
          category: 'Uploaded',
          src: URL.createObjectURL(file),
          isSample: false,
        };
      });

      setPhotos((prev) => [...newItems, ...prev]);
      setActivePhotoId(newItems[0].id);
      showNotice(
        newItems.length === 1
          ? `Loaded "${newItems[0].name}"`
          : `Added ${newItems.length} photos to queue`
      );
    },
    [showNotice]
  );

  const handleRemovePhoto = useCallback(
    (id: string) => {
      setPhotos((prev) => {
        const target = prev.find((p) => p.id === id);
        if (target && !target.isSample) {
          URL.revokeObjectURL(target.src);
          neuralCacheRef.current.delete(id);
        }
        const next = prev.filter((p) => p.id !== id);
        if (id === activePhotoId && next.length > 0) {
          setActivePhotoId(next[0].id);
        }
        return next;
      });
    },
    [activePhotoId]
  );

  const handlePasteFromClipboard = useCallback(async () => {
    try {
      if (!navigator.clipboard || !navigator.clipboard.read) {
        showNotice('Press Ctrl+V (or Cmd+V) to paste an image directly.');
        return;
      }
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imgType = item.types.find((t) => t.startsWith('image/'));
        if (imgType) {
          const blob = await item.getType(imgType);
          const file = new File([blob], 'Pasted Photo.png', { type: imgType });
          addImageFiles([file]);
          return;
        }
      }
      showNotice('No image found in clipboard.');
    } catch {
      showNotice('Press Ctrl+V (or Cmd+V) to paste an image directly.');
    }
  }, [addImageFiles, showNotice]);

  // Global keyboard shortcuts & Ctrl+V image paste
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const files: File[] = [];
      if (e.clipboardData?.items) {
        for (const item of Array.from(e.clipboardData.items)) {
          if (item.type.startsWith('image/')) {
            const file = item.getAsFile();
            if (file) files.push(file);
          }
        }
      }
      if (files.length > 0) {
        e.preventDefault();
        addImageFiles(files);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
        return;
      }

      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setPeekOriginal(true);
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'v':
          setActiveTool('compare');
          break;
        case 'e':
          setActiveTool('erase');
          break;
        case 'r':
          setActiveTool('restore');
          break;
        case 'w':
          setActiveTool('wand');
          break;
        case 'h':
          setActiveTool('pan');
          break;
        case 'i':
          setMatte((m) => ({ ...m, invertMask: !m.invertMask }));
          break;
        case '[':
          setBrush((b) => ({ ...b, size: Math.max(6, b.size - 8) }));
          break;
        case ']':
          setBrush((b) => ({ ...b, size: Math.min(160, b.size + 8) }));
          break;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setPeekOriginal(false);
      }
    };

    window.addEventListener('paste', onPaste);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('paste', onPaste);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [addImageFiles, handleRedo, handleUndo]);

  const buildExportBlob = useCallback(async (format: ExportFormat): Promise<Blob | null> => {
    const sourceCanvas = sourceCanvasRef.current;
    const fgCanvas = fgCanvasRef.current;
    const { w, h } = workDimsRef.current;
    if (!sourceCanvas || !fgCanvas || w <= 0 || h <= 0) return null;

    // Ensure foreground canvas is up to date
    renderFrameNow();

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = w;
    exportCanvas.height = h;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return null;

    drawStudioComposition(
      ctx,
      w,
      h,
      sourceCanvas,
      fgCanvas,
      backdropRef.current,
      customBackdropImgRef.current,
      format === 'jpeg' ? '#FFFFFF' : undefined
    );

    const mime =
      format === 'png' ? 'image/png' : format === 'webp' ? 'image/webp' : 'image/jpeg';
    const quality = format === 'png' ? 1 : 0.94;

    return new Promise<Blob | null>((resolve) => {
      exportCanvas.toBlob((blob) => resolve(blob), mime, quality);
    });
  }, [renderFrameNow]);

  const handleDownload = useCallback(async () => {
    setIsExporting(true);
    try {
      const blob = await buildExportBlob(exportFormat);
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const slug = (activePhoto?.name ?? 'photo')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      const ext = exportFormat === 'jpeg' ? 'jpg' : exportFormat;
      a.href = url;
      a.download = `mattecut-${slug}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showNotice(`Saved mattecut-${slug}.${ext}`);
    } finally {
      setIsExporting(false);
    }
  }, [activePhoto?.name, buildExportBlob, exportFormat, showNotice]);

  const handleCopyPng = useCallback(async () => {
    try {
      const blob = await buildExportBlob('png');
      if (!blob) return;
      if (navigator.clipboard && 'ClipboardItem' in window) {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        setCopied(true);
        showNotice('Copied transparent PNG to clipboard');
        window.setTimeout(() => setCopied(false), 1800);
      } else {
        showNotice('Clipboard image copy is unavailable in this browser.');
      }
    } catch {
      showNotice('Could not copy image to clipboard.');
    }
  }, [buildExportBlob, showNotice]);

  const handleResetAll = useCallback(() => {
    setMatte(DEFAULT_MATTE_SETTINGS);
    setBrush(DEFAULT_BRUSH_SETTINGS);
    setBackdrop(DEFAULT_BACKDROP_SETTINGS);
    setCompareActive(false);
    const manual = manualMaskRef.current;
    if (manual) {
      manual.fill(0);
      undoStackRef.current = [];
      redoStackRef.current = [];
      syncHistoryMeta();
    }
    showNotice('Reset matte and backdrop adjustments');
  }, [showNotice, syncHistoryMeta]);

  const handleBackdropImageSelect = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    setBackdrop((prev) => {
      if (prev.customImageUrl) URL.revokeObjectURL(prev.customImageUrl);
      return { ...prev, mode: 'image', customImageUrl: url };
    });
  }, []);

  return (
    <div className="instantbg-root h-screen w-full overflow-hidden flex flex-col bg-[#0C0D10] text-[#F1F3F5]">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            addImageFiles(e.target.files);
          }
          e.target.value = '';
        }}
      />

      <TopBar
        onUploadClick={() => fileInputRef.current?.click()}
        onPasteClick={() => void handlePasteFromClipboard()}
        compareActive={compareActive}
        onToggleCompare={() => setCompareActive((v) => !v)}
        onResetAll={handleResetAll}
        exportFormat={exportFormat}
        onExportClick={() => void handleDownload()}
        isExporting={isExporting}
        hasPhoto={Boolean(activePhoto)}
      />

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
        {/* Left + Center Studio Canvas Area */}
        <div className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden">
          <div className="flex-1 min-h-0 flex overflow-hidden">
            <ToolRail
              activeTool={activeTool}
              onSelectTool={(tool) => {
                setActiveTool(tool);
                if (tool === 'compare') {
                  setCompareActive((prev) => (activeTool === 'compare' ? !prev : prev));
                }
              }}
              canUndo={historyMeta.canUndo}
              canRedo={historyMeta.canRedo}
              onUndo={handleUndo}
              onRedo={handleRedo}
              invertMask={matte.invertMask}
              onToggleInvert={() => setMatte((m) => ({ ...m, invertMask: !m.invertMask }))}
              peekOriginal={peekOriginal}
              onPeekStart={() => setPeekOriginal(true)}
              onPeekEnd={() => setPeekOriginal(false)}
            />

            <CanvasStage
              outputCanvasRef={outputCanvasRef}
              originalCanvasRef={originalCanvasRef}
              imageWidth={workDims.w}
              imageHeight={workDims.h}
              naturalWidth={naturalDims.w}
              naturalHeight={naturalDims.h}
              isLoadingImage={isLoadingImage}
              activeTool={activeTool}
              brush={brush}
              compareActive={compareActive}
              peekOriginal={peekOriginal}
              backdropMode={backdrop.mode}
              checkerStyle={checkerStyle}
              onToggleChecker={() =>
                setCheckerStyle((prev) => (prev === 'dark' ? 'light' : 'dark'))
              }
              onStrokeStart={handleStrokeStart}
              onStrokeMove={handleStrokeMove}
              onStrokeEnd={handleStrokeEnd}
              onWandClick={handleWandClick}
              onFilesDropped={addImageFiles}
            />
          </div>

          <Filmstrip
            photos={photos}
            activePhotoId={activePhoto?.id ?? ''}
            onSelectPhoto={(id) => setActivePhotoId(id)}
            onRemovePhoto={handleRemovePhoto}
            onAddPhotoClick={() => fileInputRef.current?.click()}
          />
        </div>

        {/* Right Studio Inspector */}
        <InspectorPanel
          engineMode={engineMode}
          onEngineModeChange={(mode) => setEngineMode(mode)}
          neuralStatus={neuralStatus}
          onRerunNeural={() => {
            if (activePhoto) {
              void runNeuralForActivePhoto(
                activePhoto.id,
                workDimsRef.current.w,
                workDimsRef.current.h,
                true
              );
            }
          }}
          activeTool={activeTool}
          matte={matte}
          onMatteChange={(patch) => setMatte((prev) => ({ ...prev, ...patch }))}
          brush={brush}
          onBrushChange={(patch) => setBrush((prev) => ({ ...prev, ...patch }))}
          hasManualEdits={historyMeta.hasManualEdits}
          onClearManualEdits={handleClearManualEdits}
          backdrop={backdrop}
          onBackdropChange={(patch) => setBackdrop((prev) => ({ ...prev, ...patch }))}
          onBackdropImageSelect={handleBackdropImageSelect}
          exportFormat={exportFormat}
          onExportFormatChange={setExportFormat}
          onCopyImage={() => void handleCopyPng()}
          copied={copied}
          onDownloadImage={() => void handleDownload()}
          isExporting={isExporting}
        />
      </div>

      {/* Subtle transient feedback toast */}
      {notice && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg bg-[#1A1E28] border border-white/[0.12] text-[12px] font-medium text-[#F1F3F5] shadow-xl pointer-events-none"
        >
          {notice}
        </div>
      )}
    </div>
  );
}
