"use client";

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Eye, FileEdit, SlidersHorizontal } from 'lucide-react';
import {
  DesignTemplate,
  PreviewBackdrop,
  QRContentData,
  QRContentType,
  QRDesignRecord,
  QRStyleConfig,
} from './types/qr';
import { DEFAULT_QR_CONTENT, EMPTY_QR_CONTENT, buildQRPayload } from './utils/qrPayload';
import { DEFAULT_QR_STYLE, DESIGN_TEMPLATES } from './data/templates';
import { generateRandomPalette } from './utils/colorUtils';
import {
  evaluateReadability,
  renderQRToPNGBlob,
  renderQRToSVG,
  triggerFileDownload,
} from './utils/qrRenderer';
import { TopBar } from './components/TopBar';
import { ContentPanel } from './components/ContentPanel';
import { PreviewStage } from './components/PreviewStage';
import { CustomizationPanel } from './components/CustomizationPanel';
import { ExportModal } from './components/ExportModal';
import { RecentDesignsModal } from './components/RecentDesignsModal';

const STORAGE_KEY = 'aivora_qr_recent_designs_v1';

function loadStoredDesigns(): QRDesignRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    return [];
  }
}

export default function App() {
  const [title, setTitle] = useState<string>('Aivora QR Design');
  const [contentType, setContentType] = useState<QRContentType>('url');
  const [content, setContent] = useState<QRContentData>(DEFAULT_QR_CONTENT);
  const [style, setStyle] = useState<QRStyleConfig>(() => ({
    ...DEFAULT_QR_STYLE,
    ...DESIGN_TEMPLATES[1].stylePatch, // Start with Modern Gradient for immediate visual polish
    framePreset: 'scan-me',
    frameText: 'SCAN ME',
  }));
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>('modern-gradient');
  const [activeDesignId, setActiveDesignId] = useState<string | null>(null);

  // Studio UI states
  const [rightTab, setRightTab] = useState<'style' | 'templates'>('style');
  const [mobileTab, setMobileTab] = useState<'content' | 'preview' | 'customize'>('preview');
  const [zoom, setZoom] = useState<number>(100);
  const [backdrop, setBackdrop] = useState<PreviewBackdrop>('grid');
  const [exportModalOpen, setExportModalOpen] = useState<boolean>(false);
  const [recentModalOpen, setRecentModalOpen] = useState<boolean>(false);
  const [recentDesigns, setRecentDesigns] = useState<QRDesignRecord[]>(loadStoredDesigns);
  const [copiedState, setCopiedState] = useState<'image' | 'payload' | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recentDesigns.slice(0, 24)));
    } catch {
      // ignore storage quota errors
    }
  }, [recentDesigns]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 2400);
  }, []);

  const payload = useMemo(() => buildQRPayload(contentType, content), [contentType, content]);

  const renderedQR = useMemo(() => {
    return renderQRToSVG(payload, style, {
      includeFrame: style.framePreset !== 'none',
      baseSize: 512,
    });
  }, [payload, style]);

  const readability = useMemo(
    () => evaluateReadability(payload, style, renderedQR.matrix),
    [payload, style, renderedQR.matrix]
  );

  const handleContentChange = useCallback(
    <K extends QRContentType>(key: K, patch: Partial<QRContentData[K]>) => {
      setContent((prev) => ({
        ...prev,
        [key]: { ...prev[key], ...patch },
      }));
    },
    []
  );

  const handleUpdateStyle = useCallback((patch: Partial<QRStyleConfig>) => {
    setStyle((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleApplyTemplate = useCallback(
    (template: DesignTemplate) => {
      setStyle((prev) => ({
        ...DEFAULT_QR_STYLE,
        // Preserve user's uploaded logo and error correction preferences
        logoDataUrl: prev.logoDataUrl,
        logoFileName: prev.logoFileName,
        logoSize: prev.logoSize,
        logoPadding: prev.logoPadding,
        logoShape: prev.logoShape,
        logoBgEnabled: prev.logoBgEnabled,
        logoBgColor: prev.logoBgColor,
        logoOffsetX: prev.logoOffsetX,
        logoOffsetY: prev.logoOffsetY,
        logoExcavate: prev.logoExcavate,
        autoErrorCorrection: prev.autoErrorCorrection,
        ...template.stylePatch,
      }));
      setActiveTemplateId(template.id);
      showToast(`Applied "${template.name}" template`);
    },
    [showToast]
  );

  const handleLogoUpload = useCallback(
    (dataUrl: string, fileName: string) => {
      setStyle((prev) => ({
        ...prev,
        logoDataUrl: dataUrl,
        logoFileName: fileName,
        errorCorrection: prev.autoErrorCorrection ? 'H' : prev.errorCorrection,
      }));
      showToast('Logo added — error correction optimized for scanning');
    },
    [showToast]
  );

  const handleLogoRemove = useCallback(() => {
    setStyle((prev) => ({
      ...prev,
      logoDataUrl: null,
      logoFileName: null,
    }));
  }, []);

  const handleRandomPalette = useCallback(() => {
    const p = generateRandomPalette();
    setStyle((prev) => ({
      ...prev,
      fgMode: p.fgMode,
      fgColor: p.fgColor,
      gradientStart: p.gradientStart,
      gradientEnd: p.gradientEnd,
      gradientRotation: p.gradientRotation,
      bgColor: p.bgColor,
      bgTransparent: false,
      cornerSquareColor: p.cornerSquareColor,
      cornerDotColor: p.cornerDotColor,
      useCustomCornerColors: p.useCustomCornerColors,
      frameColor: p.fgColor,
      frameTextColor: p.bgColor === '#FFFFFF' ? '#FFFFFF' : '#FFFFFF',
    }));
    setActiveTemplateId(null);
  }, []);

  const handleResetStyle = useCallback(() => {
    setStyle((prev) => ({
      ...DEFAULT_QR_STYLE,
      logoDataUrl: prev.logoDataUrl,
      logoFileName: prev.logoFileName,
    }));
    setActiveTemplateId(null);
    showToast('Reset design styling to defaults');
  }, [showToast]);

  const handleClearInputs = useCallback(() => {
    setContent((prev) => ({
      ...prev,
      [contentType]: EMPTY_QR_CONTENT[contentType],
    }));
    showToast('Cleared current input fields');
  }, [contentType, showToast]);

  const handleSaveDesign = useCallback(() => {
    const id = `qr-${Date.now()}`;
    const record: QRDesignRecord = {
      id,
      title: title.trim() || 'Untitled QR Design',
      updatedAt: Date.now(),
      contentType,
      content: JSON.parse(JSON.stringify(content)),
      style: { ...style },
      activeTemplateId,
    };
    setRecentDesigns((prev) => [record, ...prev.filter((d) => d.id !== id)]);
    setActiveDesignId(id);
    showToast(`Saved "${record.title}" to Recent Designs`);
  }, [title, contentType, content, style, activeTemplateId, showToast]);

  const handleDuplicateCurrent = useCallback(() => {
    const copyTitle = title.endsWith('Copy') ? `${title} 2` : `${title || 'QR Design'} Copy`;
    const id = `qr-${Date.now()}`;
    const record: QRDesignRecord = {
      id,
      title: copyTitle,
      updatedAt: Date.now(),
      contentType,
      content: JSON.parse(JSON.stringify(content)),
      style: { ...style },
      activeTemplateId,
    };
    setTitle(copyTitle);
    setRecentDesigns((prev) => [record, ...prev]);
    setActiveDesignId(id);
    showToast(`Duplicated as "${copyTitle}"`);
  }, [title, contentType, content, style, activeTemplateId, showToast]);

  const handleLoadDesign = useCallback(
    (design: QRDesignRecord) => {
      setTitle(design.title);
      setContentType(design.contentType);
      setContent(design.content);
      setStyle(design.style);
      setActiveTemplateId(design.activeTemplateId);
      setActiveDesignId(design.id);
      showToast(`Loaded "${design.title}"`);
    },
    [showToast]
  );

  const handleDuplicateSaved = useCallback(
    (design: QRDesignRecord) => {
      const copy: QRDesignRecord = {
        ...design,
        id: `qr-${Date.now()}`,
        title: `${design.title} (Copy)`,
        updatedAt: Date.now(),
      };
      setRecentDesigns((prev) => [copy, ...prev]);
      showToast(`Duplicated "${design.title}"`);
    },
    [showToast]
  );

  const handleDeleteSaved = useCallback((id: string) => {
    setRecentDesigns((prev) => prev.filter((d) => d.id !== id));
    setActiveDesignId((curr) => (curr === id ? null : curr));
  }, []);

  const safeFilename = (title || 'aivora-qr-code')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'aivora-qr-code';

  const handleQuickDownloadPNG = useCallback(async () => {
    setIsExporting(true);
    try {
      const { blob } = await renderQRToPNGBlob(payload, style, {
        targetWidth: 1024,
        includeFrame: style.framePreset !== 'none',
        transparentBg: style.bgTransparent,
      });
      triggerFileDownload(blob, `${safeFilename}-1024px.png`);
      showToast('Downloaded high-resolution PNG (1024px)');
    } finally {
      setIsExporting(false);
    }
  }, [payload, style, safeFilename, showToast]);

  const handleQuickDownloadSVG = useCallback(() => {
    const blob = new Blob([renderedQR.svgMarkup], { type: 'image/svg+xml;charset=utf-8' });
    triggerFileDownload(blob, `${safeFilename}.svg`);
    showToast('Downloaded scalable SVG vector');
  }, [renderedQR.svgMarkup, safeFilename, showToast]);

  const handleCopyImage = useCallback(async () => {
    try {
      const { blob } = await renderQRToPNGBlob(payload, style, {
        targetWidth: 1024,
        includeFrame: style.framePreset !== 'none',
        transparentBg: style.bgTransparent,
      });
      if (navigator.clipboard && 'ClipboardItem' in window) {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        setCopiedState('image');
        setTimeout(() => setCopiedState(null), 2000);
        showToast('Copied QR code PNG to clipboard');
      } else {
        showToast('Clipboard image copy is not supported in this browser');
      }
    } catch {
      showToast('Could not copy image to clipboard — use Download PNG instead');
    }
  }, [payload, style, showToast]);

  const handleCopyPayload = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(payload || 'https://aivora.studio');
      setCopiedState('payload');
      setTimeout(() => setCopiedState(null), 2000);
      showToast('Copied QR link / payload to clipboard');
    } catch {
      showToast('Clipboard copy failed');
    }
  }, [payload, showToast]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  return (
    <div id="top" className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      {/* Strict 3-Zone Top Bar */}
      <TopBar
        activeSection={
          recentModalOpen
            ? 'recent'
            : rightTab === 'templates'
            ? 'templates'
            : 'workspace'
        }
        recentCount={recentDesigns.length}
        onSelectWorkspace={() => {
          setRecentModalOpen(false);
          setRightTab('style');
          setMobileTab('preview');
        }}
        onSelectTemplates={() => {
          setRecentModalOpen(false);
          setRightTab('templates');
          setMobileTab('customize');
        }}
        onOpenRecent={() => setRecentModalOpen(true)}
        onOpenExport={() => setExportModalOpen(true)}
      />

      {/* Mobile / Tablet Compact Workspace Tab Switcher (kept concise to stay well under 15% mobile sticky cap) */}
      <div className="border-b border-slate-200 bg-white px-3 py-2 lg:hidden">
        <div className="grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setMobileTab('content')}
            className={`flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-md text-xs font-semibold transition-colors ${
              mobileTab === 'content'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600'
            }`}
          >
            <FileEdit className="h-3.5 w-3.5" />
            <span>Content</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('preview')}
            className={`flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-md text-xs font-semibold transition-colors ${
              mobileTab === 'preview'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600'
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Preview</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('customize')}
            className={`flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-md text-xs font-semibold transition-colors ${
              mobileTab === 'customize'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Customize</span>
          </button>
        </div>
      </div>

      {/* Three-Panel Desktop Studio Workspace */}
      <div className="mx-auto grid w-full max-w-[1600px] flex-1 grid-cols-1 lg:h-[calc(100vh-3.5rem)] lg:grid-cols-[336px_minmax(0,1fr)_360px] lg:overflow-hidden">
        {/* Left Panel: Content */}
        <div
          className={`${
            mobileTab === 'content' ? 'block' : 'hidden'
          } lg:block lg:h-full lg:overflow-hidden`}
        >
          <ContentPanel
            title={title}
            onTitleChange={setTitle}
            contentType={contentType}
            onContentTypeChange={setContentType}
            content={content}
            onContentChange={handleContentChange}
            style={style}
            onLogoUpload={handleLogoUpload}
            onLogoRemove={handleLogoRemove}
            onClearInputs={handleClearInputs}
            onSaveDesign={handleSaveDesign}
            onDuplicateDesign={handleDuplicateCurrent}
          />
        </div>

        {/* Center Panel: Live Preview */}
        <div
          className={`${
            mobileTab === 'preview' ? 'flex' : 'hidden'
          } min-h-[540px] flex-col lg:flex lg:h-full lg:min-h-0 lg:overflow-hidden`}
        >
          <PreviewStage
            title={title}
            payload={payload}
            svgMarkup={renderedQR.svgMarkup}
            zoom={zoom}
            onZoomChange={setZoom}
            backdrop={backdrop}
            onBackdropChange={setBackdrop}
            readability={readability}
            onRandomPalette={handleRandomPalette}
            onResetStyle={handleResetStyle}
            onQuickDownloadPNG={handleQuickDownloadPNG}
            onQuickDownloadSVG={handleQuickDownloadSVG}
            onCopyImage={handleCopyImage}
            onCopyPayload={handleCopyPayload}
            onPrint={handlePrint}
            onOpenExport={() => setExportModalOpen(true)}
            copiedState={copiedState}
            isExporting={isExporting}
          />
        </div>

        {/* Right Panel: Customization & Templates */}
        <div
          className={`${
            mobileTab === 'customize' ? 'block' : 'hidden'
          } lg:block lg:h-full lg:overflow-hidden`}
        >
          <CustomizationPanel
            activeTab={rightTab}
            onTabChange={setRightTab}
            style={style}
            activeTemplateId={activeTemplateId}
            onUpdateStyle={handleUpdateStyle}
            onApplyTemplate={handleApplyTemplate}
            onLogoUpload={handleLogoUpload}
            onLogoRemove={handleLogoRemove}
            onRandomPalette={handleRandomPalette}
            onResetStyle={handleResetStyle}
          />
        </div>
      </div>

      {/* Export Studio Modal */}
      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        title={title}
        payload={payload}
        style={style}
        onPrint={handlePrint}
      />

      {/* Recent QR Designs Drawer */}
      <RecentDesignsModal
        isOpen={recentModalOpen}
        onClose={() => setRecentModalOpen(false)}
        designs={recentDesigns}
        activeDesignId={activeDesignId}
        onLoadDesign={handleLoadDesign}
        onDuplicateDesign={handleDuplicateSaved}
        onDeleteDesign={handleDeleteSaved}
        onSaveCurrent={handleSaveDesign}
      />

      {/* Subtle Transient Action Confirmation Toast */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-medium text-white shadow-lg"
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}
