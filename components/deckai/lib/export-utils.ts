import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import type {
  ChartElement,
  ImageElement,
  ShapeElement,
  Slide,
  TextElement,
} from '../types/deck';

function sanitizeFileName(title: string): string {
  return (title || 'DeckAI-Presentation')
    .replace(/[^a-z0-9\-_\s]/gi, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 64) || 'DeckAI-Presentation';
}

function cleanHex(color: string | undefined, fallback = '0F172A'): string {
  if (!color) return fallback;
  const hex = color.replace('#', '').trim();
  if (hex.length === 3) {
    return hex
      .split('')
      .map((c) => c + c)
      .join('')
      .toUpperCase();
  }
  if (/^[0-9a-fA-F]{6}$/.test(hex)) {
    return hex.toUpperCase();
  }
  return fallback;
}

async function resolveImageAsDataUrl(src: string): Promise<string | null> {
  if (!src) return null;
  if (src.startsWith('data:')) return src;
  try {
    const res = await fetch(src);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function exportToPptx(
  title: string,
  slides: Slide[],
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  const PptxGenJS = await loadBrowserPptx();
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9'; // 10 x 5.625 inches
  pptx.title = title;
  pptx.author = 'DeckAI';

  const SLIDE_W = 10;
  const SLIDE_H = 5.625;

  for (let i = 0; i < slides.length; i++) {
    onProgress?.(i + 1, slides.length);
    const slideData = slides[i];
    const pptxSlide = pptx.addSlide();

    pptxSlide.background = { color: cleanHex(slideData.backgroundColor, 'FFFFFF') };
    if (slideData.notes) {
      pptxSlide.addNotes(slideData.notes);
    }

    for (const el of slideData.elements) {
      const x = (el.x / 100) * SLIDE_W;
      const y = (el.y / 100) * SLIDE_H;
      const w = Math.max(0.2, (el.w / 100) * SLIDE_W);
      const h = Math.max(0.1, (el.h / 100) * SLIDE_H);

      if (el.type === 'shape') {
        const s = el as ShapeElement;
        const shapeType =
          s.shapeKind === 'ellipse'
            ? pptx.ShapeType.ellipse
            : s.shapeKind === 'roundRect' || s.shapeKind === 'badge'
              ? pptx.ShapeType.roundRect
              : pptx.ShapeType.rect;

        pptxSlide.addShape(shapeType, {
          x,
          y,
          w,
          h,
          fill: {
            color: cleanHex(s.fillColor, 'F1F5F9'),
            transparency: s.opacity !== undefined ? Math.round((1 - s.opacity) * 100) : 0,
          },
          line: s.strokeColor
            ? { color: cleanHex(s.strokeColor, 'CBD5E1'), width: s.strokeWidth || 1 }
            : { type: 'none' },
          rectRadius: s.shapeKind === 'roundRect' ? 0.14 : undefined,
        });

        if (s.text) {
          pptxSlide.addText(s.text, {
            x,
            y,
            w,
            h,
            color: cleanHex(s.textColor, 'FFFFFF'),
            fontSize: Math.max(10, Math.round((s.fontSize || 15) * 0.72)),
            bold: true,
            align: 'center',
            valign: 'middle',
          });
        }
      } else if (el.type === 'text') {
        const t = el as TextElement;
        if (!t.content.trim()) continue;
        pptxSlide.addText(t.content, {
          x,
          y,
          w,
          h,
          fontFace: t.fontFamily || 'DM Sans',
          fontSize: Math.max(9, Math.round(t.fontSize * 0.72)),
          bold:
            t.fontWeight === 'bold' ||
            t.fontWeight === 'extrabold' ||
            t.fontWeight === 'semibold',
          italic: t.fontStyle === 'italic',
          underline: t.textDecoration === 'underline' ? { style: 'sng' } : undefined,
          align: t.textAlign || 'left',
          valign: 'top',
          color: cleanHex(t.color, '0F172A'),
          fill: t.backgroundColor
            ? { color: cleanHex(t.backgroundColor, 'FFFFFF') }
            : undefined,
        });
      } else if (el.type === 'image') {
        const img = el as ImageElement;
        const dataUrl = await resolveImageAsDataUrl(img.src);
        if (dataUrl) {
          pptxSlide.addImage({
            data: dataUrl,
            x,
            y,
            w,
            h,
            sizing: {
              type: img.objectFit === 'contain' ? 'contain' : 'cover',
              w,
              h,
            },
          });
        }
      } else if (el.type === 'icon') {
        pptxSlide.addShape(pptx.ShapeType.roundRect, {
          x,
          y,
          w,
          h,
          fill: { color: cleanHex(el.backgroundColor, 'EEF2FF') },
          line: { color: cleanHex(el.color, '4F46E5'), width: 1 },
          rectRadius: 0.12,
        });
        pptxSlide.addText(el.iconName.slice(0, 2).toUpperCase(), {
          x,
          y,
          w,
          h,
          fontSize: 10,
          bold: true,
          color: cleanHex(el.color, '4F46E5'),
          align: 'center',
          valign: 'middle',
        });
      } else if (el.type === 'chart') {
        const c = el as ChartElement;
        const labels = c.data.map((d) => d.label);
        const values = c.data.map((d) => d.value);
        const pptxChartType =
          c.chartType === 'line'
            ? pptx.ChartType.line
            : c.chartType === 'area'
              ? pptx.ChartType.area
              : c.chartType === 'pie'
                ? pptx.ChartType.pie
                : pptx.ChartType.bar;

        pptxSlide.addChart(
          pptxChartType,
          [
            {
              name: c.title,
              labels,
              values,
            },
          ],
          {
            x,
            y,
            w,
            h,
            showTitle: true,
            title: c.title,
            titleFontSize: 12,
            titleColor: cleanHex(c.textColor, '0F172A'),
            chartColors: [
              cleanHex(c.primaryColor, '3B5BDB'),
              cleanHex(c.secondaryColor, '6366F1'),
              '0EA5E9',
              '10B981',
            ],
            showValue: false,
            catAxisLabelColor: cleanHex(c.textColor, '475569'),
            valAxisLabelColor: cleanHex(c.textColor, '475569'),
            showLegend: c.chartType === 'pie',
          }
        );
      }
    }
  }

  await pptx.writeFile({ fileName: `${sanitizeFileName(title)}.pptx` });
}

export async function exportToPdf(
  title: string,
  slideDomElements: HTMLElement[],
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  if (slideDomElements.length === 0) {
    throw new Error('No slides selected for PDF export.');
  }

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: [1280, 720],
    hotfixes: ['px_scaling'],
  });

  for (let i = 0; i < slideDomElements.length; i++) {
    onProgress?.(i + 1, slideDomElements.length);
    const node = slideDomElements[i];
    const dataUrl = await toPng(node, {
      width: 1280,
      height: 720,
      pixelRatio: 2,
      cacheBust: true,
    });

    if (i > 0) {
      pdf.addPage([1280, 720], 'landscape');
    }
    pdf.addImage(dataUrl, 'PNG', 0, 0, 1280, 720);
  }

  pdf.save(`${sanitizeFileName(title)}.pdf`);
}

export function exportToHtmlDeck(title: string, slides: Slide[]): void {
  const safeTitle = title.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const slidesJson = JSON.stringify(slides).replace(/</g, '\\u003c');

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1.0" />
<title>${safeTitle}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0f172a; color: #f8fafc; font-family: system-ui, -apple-system, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 24px; }
  .stage { width: min(1120px, 95vw); aspect-ratio: 16/9; position: relative; border-radius: 12px; overflow: hidden; box-shadow: 0 25px 60px rgba(0,0,0,0.45); }
  .slide { position: absolute; inset: 0; display: none; }
  .slide.active { display: block; }
  .el { position: absolute; }
  .controls { margin-top: 16px; display: flex; gap: 12px; align-items: center; font-size: 14px; }
  button { background: #1e293b; color: #f8fafc; border: 1px solid #334155; padding: 8px 16px; border-radius: 8px; cursor: pointer; }
  button:hover { background: #334155; }
</style>
</head>
<body>
  <div class="stage" id="stage"></div>
  <div class="controls">
    <button onclick="prev()">Previous</button>
    <span id="counter">1 / ${slides.length}</span>
    <button onclick="next()">Next</button>
  </div>
<script>
const slides = ${slidesJson};
let idx = 0;
function render() {
  const stage = document.getElementById('stage');
  const s = slides[idx];
  stage.style.background = s.backgroundColor || '#ffffff';
  stage.innerHTML = '';
  for (const el of s.elements) {
    const div = document.createElement('div');
    div.className = 'el';
    div.style.left = el.x + '%';
    div.style.top = el.y + '%';
    div.style.width = el.w + '%';
    div.style.height = el.h + '%';
    if (el.type === 'shape') {
      div.style.background = el.fillColor || '#f1f5f9';
      div.style.borderRadius = (el.shapeKind === 'ellipse' ? '999px' : (el.borderRadius || 12) + 'px');
      if (el.text) {
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.justifyContent = 'center';
        div.style.color = el.textColor || '#fff';
        div.style.fontWeight = '600';
        div.textContent = el.text;
      }
    } else if (el.type === 'text') {
      div.style.color = el.color || '#0f172a';
      div.style.fontSize = 'clamp(10px, ' + (el.fontSize / 12.8) + 'vw, ' + el.fontSize + 'px)';
      div.style.fontWeight = el.fontWeight === 'extrabold' ? '800' : el.fontWeight === 'bold' ? '700' : el.fontWeight === 'semibold' ? '600' : '400';
      div.style.textAlign = el.textAlign || 'left';
      div.style.whiteSpace = 'pre-wrap';
      div.style.lineHeight = String(el.lineHeight || 1.4);
      div.textContent = el.content;
    } else if (el.type === 'image') {
      const img = document.createElement('img');
      img.src = el.src;
      img.alt = el.alt || '';
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = el.objectFit || 'cover';
      img.style.borderRadius = (el.borderRadius || 12) + 'px';
      div.appendChild(img);
    } else if (el.type === 'chart') {
      div.style.background = '#f8fafc';
      div.style.borderRadius = '12px';
      div.style.padding = '16px';
      div.style.color = '#0f172a';
      div.innerHTML = '<strong>' + el.title + '</strong><ul style="margin-top:8px;list-style:none;">' +
        el.data.map(d => '<li style="padding:4px 0;">' + d.label + ': <b>' + d.value + '</b></li>').join('') + '</ul>';
    }
    stage.appendChild(div);
  }
  document.getElementById('counter').textContent = (idx + 1) + ' / ' + slides.length;
}
function prev() { idx = (idx - 1 + slides.length) % slides.length; render(); }
function next() { idx = (idx + 1) % slides.length; render(); }
document.addEventListener('keydown', e => { if (e.key === 'ArrowRight') next(); if (e.key === 'ArrowLeft') prev(); });
render();
</script>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${sanitizeFileName(title)}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

let pptxScriptPromise: Promise<any> | null = null;
function loadBrowserPptx(): Promise<any> {
  if (typeof window === 'undefined') return Promise.reject(new Error('PowerPoint export is available in the browser.'));
  const browserWindow = window as Window & { JSZip?: any };
  if (browserWindow.JSZip) return Promise.resolve(browserWindow.JSZip);
  if (!pptxScriptPromise) {
    pptxScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = '/deckai/pptxgen.bundle.js';
      script.onload = () => browserWindow.JSZip ? resolve(browserWindow.JSZip) : reject(new Error('PowerPoint export library did not initialize.'));
      script.onerror = () => reject(new Error('Unable to load the PowerPoint export library.'));
      document.head.appendChild(script);
    });
  }
  return pptxScriptPromise;
}
