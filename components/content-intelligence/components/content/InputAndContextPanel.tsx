import React, { useRef, useState } from 'react';
import {
  FileText,
  Globe,
  Loader2,
  SlidersHorizontal,
  Sparkles,
  Upload,
} from 'lucide-react';
import {
  DOCUMENT_CATEGORIES,
  SAMPLE_PRESETS,
} from '../../config/contentConfig';
import { uploadDocumentApi } from '../../lib/api/contentClient';
import { computeLiveTextCounters } from '../../lib/text/liveCounters';
import type {
  ContextualRewriteProfile,
  DocumentCategory,
} from '../../types/contentIntelligence';

interface InputAndContextPanelProps {
  originalText: string;
  onChangeOriginalText: (text: string) => void;
  profile: ContextualRewriteProfile;
  onChangeProfile: (next: ContextualRewriteProfile) => void;
  onRunAnalysis: () => void;
  isAnalyzing: boolean;
  analysisProgressStep: string;
  onSwitchToSiteAudit: () => void;
}

export const InputAndContextPanel: React.FC<InputAndContextPanelProps> = ({
  originalText,
  onChangeOriginalText,
  profile,
  onChangeProfile,
  onRunAnalysis,
  isAnalyzing,
  analysisProgressStep,
  onSwitchToSiteAudit,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showContextConfig, setShowContextConfig] = useState(true);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const counters = computeLiveTextCounters(originalText);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploadStatus(null);
    setIsUploading(true);
    try {
      const result = await uploadDocumentApi(file);
      onChangeOriginalText(result.text);
      setUploadStatus(`Loaded ${result.fileName} (${result.fileType.toUpperCase()})`);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to extract document.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const applyPreset = (presetId: string) => {
    const preset = SAMPLE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    onChangeOriginalText(preset.text);
    onChangeProfile({
      ...profile,
      ...preset.profile,
      secondaryKeywords: preset.profile.secondaryKeywords ?? profile.secondaryKeywords,
    });
    setUploadStatus(`Loaded sample: ${preset.label}`);
    setUploadError(null);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* Mode & Preset Toolbar */}
      <div className="px-5 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-700" />
          <h2 className="text-sm font-semibold text-slate-900">Source Content &amp; Context</h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onSwitchToSiteAudit}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
          >
            <Globe className="w-3.5 h-3.5 text-slate-500" />
            Analyze Website URL
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.docx,.html,.htm"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 disabled:opacity-60"
          >
            {isUploading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5 text-slate-500" />
            )}
            Upload TXT / DOCX
          </button>
        </div>
      </div>

      {/* Sample Presets Strip */}
      <div className="px-5 py-2.5 border-b border-slate-100 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-500 font-medium">Test samples:</span>
        {SAMPLE_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => applyPreset(preset.id)}
            title={preset.summary}
            className="px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Upload feedback */}
      {(uploadStatus || uploadError) && (
        <div
          className={`px-5 py-2 text-xs border-b ${
            uploadError
              ? 'bg-red-50 text-red-700 border-red-200'
              : 'bg-slate-50 text-slate-700 border-slate-200'
          }`}
        >
          {uploadError || uploadStatus}
        </div>
      )}

      {/* Main Textarea */}
      <div className="p-5">
        <label htmlFor="source-content-editor" className="sr-only">
          Source content text
        </label>
        <textarea
          id="source-content-editor"
          value={originalText}
          onChange={(e) => onChangeOriginalText(e.target.value)}
          rows={13}
          placeholder="Paste a blog article, website page copy, marketing draft, academic excerpt, or upload a .txt / .docx file..."
          className="w-full rounded-lg border border-slate-200 bg-white p-4 text-[15px] leading-relaxed text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-400 resize-y"
        />

        {/* Live Programmatic Counters */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono tabular-nums">
            <span>
              <strong className="text-slate-900">{counters.wordCount.toLocaleString()}</strong> words
            </span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>
              <strong className="text-slate-900">{counters.characterCount.toLocaleString()}</strong> chars
            </span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>
              <strong className="text-slate-900">{counters.sentenceCount}</strong> sentences
            </span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>
              <strong className="text-slate-900">{counters.paragraphCount}</strong> paragraphs
            </span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>{counters.estimatedReadingTimeLabel}</span>
          </div>

          <button
            type="button"
            onClick={() => setShowContextConfig((prev) => !prev)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {showContextConfig ? 'Hide Audience & SEO Context' : 'Configure Audience & SEO Context'}
          </button>
        </div>
      </div>

      {/* Contextual Rewriting & SEO Profile */}
      {showContextConfig && (
        <div className="px-5 pb-5 pt-3 border-t border-slate-100 bg-slate-50/50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Document Type
              </label>
              <select
                value={profile.documentType}
                onChange={(e) =>
                  onChangeProfile({
                    ...profile,
                    documentType: e.target.value as DocumentCategory,
                  })
                }
                className="w-full h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-900 focus:outline-none focus:border-slate-400"
              >
                {DOCUMENT_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Primary SEO Keyword
              </label>
              <input
                type="text"
                value={profile.primaryKeyword}
                onChange={(e) =>
                  onChangeProfile({ ...profile, primaryKeyword: e.target.value })
                }
                placeholder="e.g., automated invoice reconciliation"
                className="w-full h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-900 focus:outline-none focus:border-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Secondary Keywords (comma-separated)
              </label>
              <input
                type="text"
                value={profile.secondaryKeywords.join(', ')}
                onChange={(e) =>
                  onChangeProfile({
                    ...profile,
                    secondaryKeywords: e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="accounts payable, month-end close"
                className="w-full h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-900 focus:outline-none focus:border-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Target Audience
              </label>
              <input
                type="text"
                value={profile.targetAudience}
                onChange={(e) =>
                  onChangeProfile({ ...profile, targetAudience: e.target.value })
                }
                placeholder="e.g., CPAs and controllers"
                className="w-full h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-900 focus:outline-none focus:border-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Industry &amp; Business Type
              </label>
              <input
                type="text"
                value={profile.industry}
                onChange={(e) =>
                  onChangeProfile({ ...profile, industry: e.target.value })
                }
                placeholder="e.g., B2B Financial Software"
                className="w-full h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-900 focus:outline-none focus:border-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Preferred Reading Level
              </label>
              <select
                value={profile.preferredReadingLevel}
                onChange={(e) =>
                  onChangeProfile({
                    ...profile,
                    preferredReadingLevel: e.target.value as ContextualRewriteProfile['preferredReadingLevel'],
                  })
                }
                className="w-full h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-900 focus:outline-none focus:border-slate-400"
              >
                <option value="Accessible (Grade 5-6)">Accessible (Grade 5-6)</option>
                <option value="General (Grade 7-9)">General (Grade 7-9)</option>
                <option value="Professional (Grade 10-12)">Professional (Grade 10-12)</option>
                <option value="Academic / Technical (College+)">
                  Academic / Technical (College+)
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Brand Voice
              </label>
              <input
                type="text"
                value={profile.brandVoice}
                onChange={(e) =>
                  onChangeProfile({ ...profile, brandVoice: e.target.value })
                }
                placeholder="e.g., Pragmatic, candid, evidence-led"
                className="w-full h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-900 focus:outline-none focus:border-slate-400"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Content Objective
              </label>
              <input
                type="text"
                value={profile.contentObjective}
                onChange={(e) =>
                  onChangeProfile({ ...profile, contentObjective: e.target.value })
                }
                placeholder="e.g., Explain workflow bottlenecks clearly and drive demo signups"
                className="w-full h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-900 focus:outline-none focus:border-slate-400"
              />
            </div>
          </div>
        </div>
      )}

      {/* Analysis Action Footer */}
      <div className="px-5 py-3.5 border-t border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-slate-500">
          {isAnalyzing ? (
            <span className="inline-flex items-center gap-2 text-slate-800 font-medium">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              {analysisProgressStep || 'Running linguistic pattern and editorial analysis...'}
            </span>
          ) : (
            'Programmatic linguistic metrics + sentence-by-sentence Gemini editorial analysis.'
          )}
        </div>

        <button
          type="button"
          disabled={isAnalyzing || counters.wordCount < 5}
          onClick={onRunAnalysis}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 whitespace-nowrap shrink-0"
        >
          {isAnalyzing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          {isAnalyzing ? 'Analyzing Content...' : 'Analyze Content'}
        </button>
      </div>
    </div>
  );
};
