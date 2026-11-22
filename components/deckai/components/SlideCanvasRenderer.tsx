import React, { useEffect, useRef, useState } from 'react';
import {
  Award,
  BarChart3,
  CheckCircle2,
  Cpu,
  Globe,
  Image as ImageIcon,
  Layers,
  Rocket,
  Shield,
  Target,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import type {
  ChartElement,
  IconElement,
  ImageElement,
  ShapeElement,
  Slide,
  SlideElement,
  TextElement,
} from '../types/deck';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Zap,
  Target,
  TrendingUp,
  Shield,
  Layers,
  Users,
  Globe,
  Award,
  BarChart3,
  Rocket,
  CheckCircle2,
  Cpu,
};

export function SlideChartSvg({ chart }: { chart: ChartElement }) {
  const data = chart.data.length > 0 ? chart.data : [{ label: 'Q1', value: 10 }];
  const maxVal = Math.max(1, ...data.map((d) => d.value));

  if (chart.chartType === 'pie') {
    const total = Math.max(1, data.reduce((acc, d) => acc + Math.max(0, d.value), 0));
    const palette = [chart.primaryColor, chart.secondaryColor, '#0EA5E9', '#10B981', '#F59E0B'];
    let cumulative = 0;

    return (
      <div className="w-full h-full flex flex-col justify-between p-5 rounded-xl bg-white/80 border border-slate-200/70">
        <div className="text-[18px] font-semibold truncate" style={{ color: chart.textColor }}>
          {chart.title}
        </div>
        <div className="flex items-center justify-center gap-8 flex-1 min-h-0">
          <svg viewBox="0 0 120 120" className="w-44 h-44 shrink-0">
            {data.map((d, idx) => {
              const frac = Math.max(0, d.value) / total;
              const startAngle = cumulative * 2 * Math.PI - Math.PI / 2;
              cumulative += frac;
              const endAngle = cumulative * 2 * Math.PI - Math.PI / 2;
              const x1 = 60 + 48 * Math.cos(startAngle);
              const y1 = 60 + 48 * Math.sin(startAngle);
              const x2 = 60 + 48 * Math.cos(endAngle);
              const y2 = 60 + 48 * Math.sin(endAngle);
              const largeArc = frac > 0.5 ? 1 : 0;
              const path = `M 60 60 L ${x1} ${y1} A 48 48 0 ${largeArc} 1 ${x2} ${y2} Z`;
              return (
                <path
                  key={`${d.label}_${idx}`}
                  d={path}
                  fill={palette[idx % palette.length]}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
              );
            })}
          </svg>
          <div className="flex flex-col gap-2 min-w-0">
            {data.map((d, idx) => (
              <div key={`${d.label}_lg_${idx}`} className="flex items-center gap-2.5 text-[14px]">
                <span
                  className="w-3 h-3 rounded-sm shrink-0"
                  style={{ backgroundColor: palette[idx % palette.length] }}
                />
                <span className="truncate font-medium" style={{ color: chart.textColor }}>
                  {d.label}
                </span>
                <span className="font-mono tabular-nums opacity-75" style={{ color: chart.textColor }}>
                  {d.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const width = 560;
  const height = 280;
  const padL = 44;
  const padR = 20;
  const padT = 20;
  const padB = 34;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  return (
    <div
      className="w-full h-full flex flex-col justify-between p-5 rounded-xl border"
      style={{
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderColor: 'rgba(148,163,184,0.28)',
      }}
    >
      <div className="text-[18px] font-semibold truncate mb-2" style={{ color: chart.textColor }}>
        {chart.title}
      </div>
      <div className="flex-1 min-h-0 flex items-center justify-center">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          {chart.showGrid !== false &&
            [0.25, 0.5, 0.75, 1].map((step) => {
              const y = padT + chartH * (1 - step);
              return (
                <g key={step}>
                  <line
                    x1={padL}
                    x2={width - padR}
                    y1={y}
                    y2={y}
                    stroke={chart.textColor}
                    strokeOpacity={0.12}
                    strokeDasharray="3 3"
                  />
                  <text
                    x={padL - 8}
                    y={y + 4}
                    textAnchor="end"
                    fontSize="11"
                    fill={chart.textColor}
                    fillOpacity={0.55}
                  >
                    {Math.round(maxVal * step)}
                  </text>
                </g>
              );
            })}

          {chart.chartType === 'bar' &&
            data.map((d, idx) => {
              const slotW = chartW / data.length;
              const barW = Math.min(54, slotW * 0.56);
              const barH = Math.max(4, (d.value / maxVal) * chartH);
              const x = padL + idx * slotW + (slotW - barW) / 2;
              const y = padT + chartH - barH;
              return (
                <g key={`${d.label}_${idx}`}>
                  <rect
                    x={x}
                    y={y}
                    width={barW}
                    height={barH}
                    rx={6}
                    fill={idx === data.length - 1 ? chart.primaryColor : chart.secondaryColor}
                    fillOpacity={idx === data.length - 1 ? 1 : 0.75}
                  />
                  <text
                    x={x + barW / 2}
                    y={y - 7}
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="600"
                    fill={chart.textColor}
                  >
                    {d.value}
                  </text>
                  <text
                    x={x + barW / 2}
                    y={height - 10}
                    textAnchor="middle"
                    fontSize="12"
                    fill={chart.textColor}
                    fillOpacity={0.72}
                  >
                    {d.label}
                  </text>
                </g>
              );
            })}

          {(chart.chartType === 'line' || chart.chartType === 'area') && (() => {
            const pts = data.map((d, idx) => {
              const x =
                data.length === 1
                  ? padL + chartW / 2
                  : padL + (idx / (data.length - 1)) * chartW;
              const y = padT + chartH - (d.value / maxVal) * chartH;
              return { x, y, label: d.label, value: d.value };
            });
            const polyLine = pts.map((p) => `${p.x},${p.y}`).join(' ');
            const areaPath = `M ${pts[0].x} ${padT + chartH} L ${pts
              .map((p) => `${p.x} ${p.y}`)
              .join(' L ')} L ${pts[pts.length - 1].x} ${padT + chartH} Z`;
            return (
              <>
                {chart.chartType === 'area' && (
                  <path d={areaPath} fill={chart.primaryColor} fillOpacity={0.18} />
                )}
                <polyline
                  fill="none"
                  stroke={chart.primaryColor}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={polyLine}
                />
                {pts.map((p, idx) => (
                  <g key={`${p.label}_${idx}`}>
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="5"
                      fill="#ffffff"
                      stroke={chart.primaryColor}
                      strokeWidth="3"
                    />
                    <text
                      x={p.x}
                      y={p.y - 12}
                      textAnchor="middle"
                      fontSize="12"
                      fontWeight="600"
                      fill={chart.textColor}
                    >
                      {p.value}
                    </text>
                    <text
                      x={p.x}
                      y={height - 10}
                      textAnchor="middle"
                      fontSize="12"
                      fill={chart.textColor}
                      fillOpacity={0.72}
                    >
                      {p.label}
                    </text>
                  </g>
                ))}
              </>
            );
          })()}
        </svg>
      </div>
    </div>
  );
}

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  objectFit: 'cover' | 'contain';
  borderRadius?: number;
}

function SlideImageBox({ src, alt, objectFit, borderRadius }: ImageWithFallbackProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (failed || !src) {
    return (
      <div
        className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-indigo-50 text-slate-500 border border-slate-200"
        style={{ borderRadius: `${borderRadius ?? 12}px` }}
      >
        <ImageIcon className="w-8 h-8 mb-2 opacity-60" />
        <span className="text-xs font-medium px-3 text-center truncate max-w-full">
          {alt || 'Visual Asset'}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || 'Slide visual'}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="w-full h-full block select-none pointer-events-none"
      style={{
        objectFit,
        borderRadius: `${borderRadius ?? 12}px`,
      }}
    />
  );
}

interface SlideCanvasRendererProps {
  slide: Slide;
  editable?: boolean;
  selectedElementId?: string | null;
  onSelectElement?: (id: string | null) => void;
  onUpdateElement?: (id: string, patch: Partial<SlideElement>) => void;
  fixedScale?: number;
  className?: string;
}

export const SlideCanvasRenderer: React.FC<SlideCanvasRendererProps> = ({
  slide,
  editable = false,
  selectedElementId = null,
  onSelectElement,
  onUpdateElement,
  fixedScale,
  className = '',
}) => {
  const outerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(fixedScale ?? 0.5);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  useEffect(() => {
    if (fixedScale !== undefined) {
      setScale(fixedScale);
      return;
    }
    const el = outerRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      if (w > 0) setScale(w / 1280);
    };
    update();
    const obs = new ResizeObserver(update);
    obs.observe(el);
    return () => obs.disconnect();
  }, [fixedScale]);

  const startDrag = (e: React.PointerEvent, el: SlideElement) => {
    if (!editable || editingTextId === el.id) return;
    e.stopPropagation();
    onSelectElement?.(el.id);

    const container = outerRef.current;
    if (!container || !onUpdateElement) return;
    const rect = container.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const origX = el.x;
    const origY = el.y;

    const handleMove = (ev: PointerEvent) => {
      const dxPct = ((ev.clientX - startX) / rect.width) * 100;
      const dyPct = ((ev.clientY - startY) / rect.height) * 100;
      const nextX = Math.max(-5, Math.min(100 - el.w + 5, origX + dxPct));
      const nextY = Math.max(-5, Math.min(100 - el.h + 5, origY + dyPct));
      onUpdateElement(el.id, {
        x: Math.round(nextX * 10) / 10,
        y: Math.round(nextY * 10) / 10,
      });
    };

    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  };

  const startResize = (
    e: React.PointerEvent,
    el: SlideElement,
    corner: 'se' | 'sw' | 'ne' | 'nw'
  ) => {
    if (!editable || !onUpdateElement) return;
    e.stopPropagation();
    const container = outerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const { x: ox, y: oy, w: ow, h: oh } = el;

    const handleMove = (ev: PointerEvent) => {
      const dxPct = ((ev.clientX - startX) / rect.width) * 100;
      const dyPct = ((ev.clientY - startY) / rect.height) * 100;

      let nx = ox;
      let ny = oy;
      let nw = ow;
      let nh = oh;

      if (corner.includes('e')) {
        nw = Math.max(4, ow + dxPct);
      }
      if (corner.includes('s')) {
        nh = Math.max(3, oh + dyPct);
      }
      if (corner.includes('w')) {
        const proposedW = Math.max(4, ow - dxPct);
        nx = ox + (ow - proposedW);
        nw = proposedW;
      }
      if (corner.includes('n')) {
        const proposedH = Math.max(3, oh - dyPct);
        ny = oy + (oh - proposedH);
        nh = proposedH;
      }

      onUpdateElement(el.id, {
        x: Math.round(nx * 10) / 10,
        y: Math.round(ny * 10) / 10,
        w: Math.round(nw * 10) / 10,
        h: Math.round(nh * 10) / 10,
      });
    };

    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  };

  return (
    <div
      ref={outerRef}
      onClick={() => {
        if (editable) {
          onSelectElement?.(null);
          setEditingTextId(null);
        }
      }}
      className={`relative w-full aspect-video overflow-hidden select-none ${className}`}
      style={{
        backgroundColor: slide.backgroundColor || '#ffffff',
        backgroundImage: slide.backgroundGradient,
      }}
    >
      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{
          width: '1280px',
          height: '720px',
          transform: `scale(${scale})`,
          backgroundColor: slide.backgroundColor || '#ffffff',
          backgroundImage: slide.backgroundGradient,
        }}
      >
        {slide.elements.map((el) => {
          const isSelected = editable && selectedElementId === el.id;
          const isEditingText = editable && editingTextId === el.id && el.type === 'text';

          return (
            <div
              key={el.id}
              onPointerDown={(e) => startDrag(e, el)}
              onClick={(e) => {
                if (editable) {
                  e.stopPropagation();
                  onSelectElement?.(el.id);
                }
              }}
              onDoubleClick={(e) => {
                if (editable && el.type === 'text') {
                  e.stopPropagation();
                  setEditingTextId(el.id);
                }
              }}
              className={`absolute group ${editable ? 'cursor-move' : ''} ${
                isSelected ? 'ring-2 ring-indigo-500 ring-offset-1' : editable ? 'hover:ring-1 hover:ring-indigo-300' : ''
              }`}
              style={{
                left: `${el.x}%`,
                top: `${el.y}%`,
                width: `${el.w}%`,
                height: `${el.h}%`,
                opacity: el.opacity ?? 1,
                zIndex: el.zIndex ?? 1,
              }}
            >
              {el.type === 'shape' && (() => {
                const s = el as ShapeElement;
                return (
                  <div
                    className="w-full h-full flex items-center justify-center text-center px-4"
                    style={{
                      backgroundColor: s.fillColor,
                      borderColor: s.strokeColor,
                      borderWidth: s.strokeColor ? `${s.strokeWidth || 1}px` : 0,
                      borderStyle: s.strokeColor ? 'solid' : 'none',
                      borderRadius:
                        s.shapeKind === 'ellipse'
                          ? '9999px'
                          : `${s.borderRadius ?? 12}px`,
                      color: s.textColor || '#ffffff',
                      fontSize: `${s.fontSize || 16}px`,
                      fontWeight: 600,
                    }}
                  >
                    {s.text || ''}
                  </div>
                );
              })()}

              {el.type === 'text' && (() => {
                const t = el as TextElement;
                const weightMap = {
                  normal: 400,
                  medium: 500,
                  semibold: 600,
                  bold: 700,
                  extrabold: 800,
                };
                if (isEditingText) {
                  return (
                    <textarea
                      autoFocus
                      value={t.content}
                      onChange={(e) => onUpdateElement?.(t.id, { content: e.target.value })}
                      onBlur={() => setEditingTextId(null)}
                      onPointerDown={(e) => e.stopPropagation()}
                      className="w-full h-full bg-white/90 text-slate-900 resize-none outline-none p-2 rounded border border-indigo-400"
                      style={{
                        fontSize: `${t.fontSize}px`,
                        fontFamily: t.fontFamily || 'DM Sans',
                        fontWeight: weightMap[t.fontWeight] || 400,
                        fontStyle: t.fontStyle,
                        textDecoration: t.textDecoration,
                        textAlign: t.textAlign,
                        color: t.color,
                        lineHeight: t.lineHeight || 1.4,
                      }}
                    />
                  );
                }
                return (
                  <div
                    className="w-full h-full whitespace-pre-wrap break-words overflow-hidden"
                    style={{
                      fontSize: `${t.fontSize}px`,
                      fontFamily: t.fontFamily || 'DM Sans',
                      fontWeight: weightMap[t.fontWeight] || 400,
                      fontStyle: t.fontStyle,
                      textDecoration: t.textDecoration,
                      textAlign: t.textAlign,
                      color: t.color,
                      backgroundColor: t.backgroundColor,
                      borderRadius: t.borderRadius ? `${t.borderRadius}px` : undefined,
                      padding: t.padding ? `${t.padding}px` : undefined,
                      lineHeight: t.lineHeight || 1.4,
                    }}
                  >
                    {t.content}
                  </div>
                );
              })()}

              {el.type === 'image' && (() => {
                const img = el as ImageElement;
                return (
                  <SlideImageBox
                    src={img.src}
                    alt={img.alt}
                    objectFit={img.objectFit}
                    borderRadius={img.borderRadius}
                  />
                );
              })()}

              {el.type === 'icon' && (() => {
                const ic = el as IconElement;
                const IconComp = ICON_MAP[ic.iconName] || Zap;
                return (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{
                      backgroundColor: ic.backgroundColor || '#EEF2FF',
                      borderRadius: `${ic.borderRadius ?? 10}px`,
                    }}
                  >
                    <IconComp className="w-3/5 h-3/5" style={{ color: ic.color }} />
                  </div>
                );
              })()}

              {el.type === 'chart' && <SlideChartSvg chart={el as ChartElement} />}

              {isSelected && !isEditingText && (
                <>
                  {(['nw', 'ne', 'sw', 'se'] as const).map((corner) => (
                    <div
                      key={corner}
                      onPointerDown={(e) => startResize(e, el, corner)}
                      className={`absolute w-3.5 h-3.5 bg-white border-2 border-indigo-600 rounded-sm z-20 ${
                        corner === 'nw'
                          ? '-top-1.5 -left-1.5 cursor-nwse-resize'
                          : corner === 'ne'
                            ? '-top-1.5 -right-1.5 cursor-nesw-resize'
                            : corner === 'sw'
                              ? '-bottom-1.5 -left-1.5 cursor-nesw-resize'
                              : '-bottom-1.5 -right-1.5 cursor-nwse-resize'
                      }`}
                    />
                  ))}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
