import React, { useEffect, useRef, useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Upload,
  Grid,
  MoveHorizontal,
} from 'lucide-react';
import {
  BackdropMode,
  BrushSettings,
  CheckerStyle,
  ToolMode,
} from '../types/studio';

interface CanvasStageProps {
  outputCanvasRef: React.RefObject<HTMLCanvasElement>;
  originalCanvasRef: React.RefObject<HTMLCanvasElement>;
  imageWidth: number;
  imageHeight: number;
  naturalWidth: number;
  naturalHeight: number;
  isLoadingImage: boolean;
  activeTool: ToolMode;
  brush: BrushSettings;
  compareActive: boolean;
  peekOriginal: boolean;
  backdropMode: BackdropMode;
  checkerStyle: CheckerStyle;
  onToggleChecker: () => void;
  onStrokeStart: (x: number, y: number) => void;
  onStrokeMove: (x: number, y: number) => void;
  onStrokeEnd: () => void;
  onWandClick: (x: number, y: number) => void;
  onFilesDropped: (files: FileList) => void;
}

export const CanvasStage: React.FC<CanvasStageProps> = ({
  outputCanvasRef,
  originalCanvasRef,
  imageWidth,
  imageHeight,
  naturalWidth,
  naturalHeight,
  isLoadingImage,
  activeTool,
  brush,
  compareActive,
  peekOriginal,
  backdropMode,
  checkerStyle,
  onToggleChecker,
  onStrokeStart,
  onStrokeMove,
  onStrokeEnd,
  onWandClick,
  onFilesDropped,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  const [zoom, setZoom] = useState<number>(1);
  const [fitScale, setFitScale] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [splitPct, setSplitPct] = useState<number>(50);
  const [isDraggingSplit, setIsDraggingSplit] = useState<boolean>(false);
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);

  const [cursorPos, setCursorPos] = useState<{ x: number; y: number; visible: boolean }>({
    x: 0,
    y: 0,
    visible: false,
  });

  const isPaintingRef = useRef<boolean>(false);
  const isPanningRef = useRef<boolean>(false);
  const panStartRef = useRef<{ x: number; y: number; panX: number; panY: number }>({
    x: 0,
    y: 0,
    panX: 0,
    panY: 0,
  });
  const dragCounterRef = useRef<number>(0);

  // Recalculate fit scale when container or image changes
  useEffect(() => {
    const updateFit = () => {
      const el = containerRef.current;
      if (!el || !imageWidth || !imageHeight) return;
      const padX = 56;
      const padY = 88;
      const availW = Math.max(160, el.clientWidth - padX);
      const availH = Math.max(160, el.clientHeight - padY);
      const scale = Math.min(availW / imageWidth, availH / imageHeight, 1.35);
      setFitScale(scale);
    };
    updateFit();
    const ro = new ResizeObserver(updateFit);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [imageWidth, imageHeight]);

  // Reset zoom/pan when switching to a differently sized image
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [imageWidth, imageHeight]);

  const effectiveScale = fitScale * zoom;
  const displayW = Math.max(1, Math.round(imageWidth * effectiveScale));
  const displayH = Math.max(1, Math.round(imageHeight * effectiveScale));

  const clientToImageCoords = (clientX: number, clientY: number): { x: number; y: number } | null => {
    const frame = frameRef.current;
    if (!frame || !imageWidth || !imageHeight) return null;
    const rect = frame.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * imageWidth;
    const y = ((clientY - rect.top) / rect.height) * imageHeight;
    return { x, y };
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    setZoom((z) => Math.min(4, Math.max(0.35, Number((z * delta).toFixed(3)))));
  };

  const handleStagePointerDown = (e: React.PointerEvent) => {
    if (isDraggingSplit) return;

    // Middle-click or Hand tool starts panning
    if (activeTool === 'pan' || e.button === 1) {
      e.preventDefault();
      isPanningRef.current = true;
      panStartRef.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      return;
    }

    if (e.button !== 0) return;

    const coords = clientToImageCoords(e.clientX, e.clientY);
    if (!coords) return;

    if (activeTool === 'wand') {
      if (coords.x >= 0 && coords.x <= imageWidth && coords.y >= 0 && coords.y <= imageHeight) {
        onWandClick(coords.x, coords.y);
      }
      return;
    }

    if (activeTool === 'erase' || activeTool === 'restore') {
      e.preventDefault();
      isPaintingRef.current = true;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      onStrokeStart(coords.x, coords.y);
    }
  };

  const handleStagePointerMove = (e: React.PointerEvent) => {
    const container = containerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      setCursorPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        visible: true,
      });
    }

    if (isDraggingSplit && frameRef.current) {
      const rect = frameRef.current.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setSplitPct(Math.max(0, Math.min(100, pct)));
      return;
    }

    if (isPanningRef.current) {
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      setPan({ x: panStartRef.current.panX + dx, y: panStartRef.current.panY + dy });
      return;
    }

    if (isPaintingRef.current) {
      const coords = clientToImageCoords(e.clientX, e.clientY);
      if (coords) onStrokeMove(coords.x, coords.y);
    }
  };

  const handleStagePointerUp = (e: React.PointerEvent) => {
    if (isDraggingSplit) {
      setIsDraggingSplit(false);
    }
    if (isPanningRef.current) {
      isPanningRef.current = false;
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
    if (isPaintingRef.current) {
      isPaintingRef.current = false;
      onStrokeEnd();
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDraggingFile(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDraggingFile(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current = 0;
    setIsDraggingFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesDropped(e.dataTransfer.files);
    }
  };

  const isBrushTool = activeTool === 'erase' || activeTool === 'restore';
  const scaledBrushDiameter = Math.max(8, brush.size * effectiveScale);

  const stageCursorClass =
    activeTool === 'pan'
      ? isPanningRef.current
        ? 'cursor-grabbing'
        : 'cursor-grab'
      : isBrushTool
      ? 'cursor-none'
      : activeTool === 'wand'
      ? 'cursor-crosshair'
      : 'cursor-default';

  const zoomPercent = Math.round(effectiveScale * 100);

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onPointerDown={handleStagePointerDown}
      onPointerMove={handleStagePointerMove}
      onPointerUp={handleStagePointerUp}
      onPointerLeave={() => {
        setCursorPos((prev) => ({ ...prev, visible: false }));
      }}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`relative flex-1 min-h-0 overflow-hidden bg-[#0C0D10] flex items-center justify-center select-none touch-none ${stageCursorClass}`}
    >
      {/* Subtle darkroom radial vignette */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 45%, rgba(36, 41, 54, 0.24) 0%, rgba(12, 13, 16, 0) 70%)',
        }}
      />

      {/* Interactive Photo Frame */}
      <div
        ref={frameRef}
        style={{
          width: `${displayW}px`,
          height: `${displayH}px`,
          transform: `translate3d(${pan.x}px, ${pan.y}px, 0)`,
        }}
        className={`relative shrink-0 rounded-lg overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.65)] ring-1 ring-white/[0.1] ${
          backdropMode === 'transparent'
            ? checkerStyle === 'dark'
              ? 'checker-dark'
              : 'checker-light'
            : 'bg-[#16181E]'
        }`}
      >
        {/* Real-time composited cutout canvas */}
        <canvas
          ref={outputCanvasRef}
          className="block w-full h-full pointer-events-none"
        />

        {/* Original photo overlay for Split Compare or Hold-to-Peek */}
        <canvas
          ref={originalCanvasRef}
          className="absolute inset-0 block w-full h-full pointer-events-none"
          style={{
            opacity: peekOriginal || compareActive ? 1 : 0,
            clipPath: peekOriginal
              ? 'inset(0 0 0 0)'
              : compareActive
              ? `inset(0 ${100 - splitPct}% 0 0)`
              : 'inset(0 100% 0 0)',
          }}
        />

        {/* Split Compare Curtain Handle */}
        {compareActive && !peekOriginal && (
          <div
            role="slider"
            aria-label="Before and after split comparison"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(splitPct)}
            tabIndex={0}
            onPointerDown={(e) => {
              e.stopPropagation();
              setIsDraggingSplit(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft') setSplitPct((p) => Math.max(0, p - 4));
              if (e.key === 'ArrowRight') setSplitPct((p) => Math.min(100, p + 4));
            }}
            style={{ left: `${splitPct}%` }}
            className="absolute inset-y-0 -translate-x-1/2 w-8 flex items-center justify-center cursor-ew-resize z-20 focus-visible:outline-none"
          >
            <div className="w-[1.5px] h-full bg-white/85 shadow-[0_0_8px_rgba(0,0,0,0.8)]" />
            <div className="absolute w-8 h-8 rounded-full bg-[#111318]/90 border border-white/75 shadow-lg flex items-center justify-center text-white">
              <MoveHorizontal className="w-4 h-4" />
            </div>
          </div>
        )}

        {/* Quiet corner labels during compare or peek */}
        {(compareActive || peekOriginal) && (
          <>
            <span className="pointer-events-none absolute top-3 left-3 px-2 py-0.5 rounded bg-black/65 text-[11px] font-medium text-white/90">
              Original
            </span>
            {!peekOriginal && (
              <span className="pointer-events-none absolute top-3 right-3 px-2 py-0.5 rounded bg-black/65 text-[11px] font-medium text-white/90">
                Cutout
              </span>
            )}
          </>
        )}

        {isLoadingImage && (
          <div className="absolute inset-0 bg-[#0C0D10]/70 flex items-center justify-center">
            <span className="text-[13px] font-medium text-[#D1D6E0]">Loading photo…</span>
          </div>
        )}
      </div>

      {/* Live Scaled Brush Cursor Ring */}
      {isBrushTool && cursorPos.visible && !isDraggingFile && (
        <div
          aria-hidden="true"
          style={{
            width: `${scaledBrushDiameter}px`,
            height: `${scaledBrushDiameter}px`,
            transform: `translate3d(${cursorPos.x - scaledBrushDiameter / 2}px, ${
              cursorPos.y - scaledBrushDiameter / 2
            }px, 0)`,
          }}
          className={`pointer-events-none absolute top-0 left-0 rounded-full border-[1.5px] z-30 ${
            activeTool === 'erase'
              ? 'border-rose-400 bg-rose-500/15 shadow-[0_0_0_1px_rgba(0,0,0,0.65)]'
              : 'border-emerald-400 bg-emerald-500/15 shadow-[0_0_0_1px_rgba(0,0,0,0.65)]'
          }`}
        />
      )}

      {/* Drag & Drop File Overlay */}
      {isDraggingFile && (
        <div className="absolute inset-4 rounded-xl border-2 border-dashed border-[#3B82F6] bg-[#0C0D10]/90 z-40 flex flex-col items-center justify-center gap-3 pointer-events-none">
          <div className="w-12 h-12 rounded-xl bg-[#2563EB]/20 border border-[#3B82F6]/40 flex items-center justify-center text-[#60A5FA]">
            <Upload className="w-6 h-6" />
          </div>
          <p className="text-[15px] font-semibold text-white">Drop photo to remove background</p>
          <p className="text-[12px] text-[#9DA4B0]">Supports JPG, PNG, and WebP</p>
        </div>
      )}

      {/* Floating Bottom Canvas Controls Bar */}
      <div
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 px-3.5 py-1.5 rounded-lg bg-[#14171E]/92 border border-white/[0.09] backdrop-blur-md text-[12px] text-[#C5CBD6]"
      >
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.35, Number((z / 1.2).toFixed(2))))}
            aria-label="Zoom out"
            className="p-1 rounded hover:bg-white/[0.08] hover:text-white transition-colors cursor-pointer"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            title="Reset zoom to fit"
            className="px-1.5 py-0.5 rounded hover:bg-white/[0.08] hover:text-white font-mono tabular-nums text-[11px] min-w-[46px] text-center transition-colors cursor-pointer"
          >
            {zoomPercent}%
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(4, Number((z * 1.2).toFixed(2))))}
            aria-label="Zoom in"
            className="p-1 rounded hover:bg-white/[0.08] hover:text-white transition-colors cursor-pointer"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            aria-label="Fit to viewport"
            title="Fit to viewport"
            className="p-1 rounded hover:bg-white/[0.08] hover:text-white transition-colors cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="w-px h-3.5 bg-white/[0.12]" aria-hidden="true" />

        <button
          type="button"
          onClick={onToggleChecker}
          title="Switch transparency inspection grid"
          className="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded hover:bg-white/[0.08] hover:text-white text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer"
        >
          <Grid className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{checkerStyle === 'dark' ? 'Dark Grid' : 'Light Grid'}</span>
        </button>

        {naturalWidth > 0 && (
          <>
            <div className="hidden sm:block w-px h-3.5 bg-white/[0.12]" aria-hidden="true" />
            <span className="hidden sm:inline font-mono tabular-nums text-[11px] text-[#8F98A8] whitespace-nowrap">
              {naturalWidth} × {naturalHeight}
            </span>
          </>
        )}
      </div>
    </div>
  );
};
