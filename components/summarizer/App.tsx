/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { AivoraHeader } from './components/AivoraHeader';
import { InputsPanel } from './components/InputsPanel';
import { OutputPanel } from './components/OutputPanel';
import type {
  ExtractedFileResponse,
  OutputFeature,
  SummarizationMode,
  SummaryFormat,
  SummaryLength,
  SummaryResult,
  SummaryTone,
} from './types/summarizer';
import { getSampleTextForMode } from './utils/sampleTexts';

export default function App() {
  const [text, setText] = useState('');
  const [length, setLength] = useState<SummaryLength>('Medium');
  const [format, setFormat] = useState<SummaryFormat>('Paragraph');
  const [tone, setTone] = useState<SummaryTone>('Professional');
  const [language, setLanguage] = useState<string>('Auto Detect');
  const [customLanguage, setCustomLanguage] = useState<string>('');
  const [mode, setMode] = useState<SummarizationMode>('General');
  const [feature, setFeature] = useState<OutputFeature>('Full Summary');

  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: number;
    wordCount: number;
  } | null>(null);

  const [result, setResult] = useState<SummaryResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleTextChange = (val: string) => {
    setText(val);
    if (validationError && val.trim().length >= 20) {
      setValidationError(null);
    }
  };

  const handleFileExtracted = (data: ExtractedFileResponse) => {
    setUploadedFile({
      name: data.filename,
      size: data.fileSize,
      wordCount: data.wordCount,
    });
    setText(data.text);
    setValidationError(null);
    setApiError(null);
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setText('');
    setValidationError(null);
  };

  const handleLoadSample = () => {
    const sample = getSampleTextForMode(mode);
    setUploadedFile(null);
    setText(sample);
    setValidationError(null);
    setApiError(null);
  };

  const handleGenerate = async () => {
    if (isGenerating) return;

    const trimmed = text.trim();
    if (!trimmed) {
      setValidationError('Please paste text or upload a document to summarize.');
      return;
    }
    if (trimmed.length < 20) {
      setValidationError('Please enter at least 20 characters for an accurate summary.');
      return;
    }

    const effectiveLanguage =
      language === 'Other'
        ? customLanguage.trim() || 'Auto Detect'
        : language;

    setValidationError(null);
    setApiError(null);
    setIsGenerating(true);

    try {
      const response = await fetch('/api/summarizer/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: trimmed,
          length,
          format,
          tone,
          language: effectiveLanguage,
          mode,
          feature,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to generate summary.');
      }

      setResult(payload as SummaryResult);
    } catch (err: unknown) {
      setApiError(
        err instanceof Error ? err.message : 'Unable to reach summarization service.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    if (isGenerating) return;
    setText('');
    setLength('Medium');
    setFormat('Paragraph');
    setTone('Professional');
    setLanguage('Auto Detect');
    setCustomLanguage('');
    setMode('General');
    setFeature('Full Summary');
    setUploadedFile(null);
    setResult(null);
    setValidationError(null);
    setApiError(null);
  };

  const scrollToElement = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div id="top" className="aivora-grid-bg min-h-screen flex flex-col text-[#18181B]">
      <AivoraHeader
        onResetAll={handleReset}
        onScrollToInputs={() => scrollToElement('inputs-panel')}
        onScrollToOutput={() => scrollToElement('output-panel')}
        hasResult={Boolean(result)}
      />

      <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 pb-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <InputsPanel
              text={text}
              onTextChange={handleTextChange}
              length={length}
              onLengthChange={setLength}
              format={format}
              onFormatChange={setFormat}
              tone={tone}
              onToneChange={setTone}
              language={language}
              onLanguageChange={setLanguage}
              customLanguage={customLanguage}
              onCustomLanguageChange={setCustomLanguage}
              mode={mode}
              onModeChange={setMode}
              feature={feature}
              onFeatureChange={setFeature}
              uploadedFile={uploadedFile}
              onFileExtracted={handleFileExtracted}
              onRemoveFile={handleRemoveFile}
              onLoadSample={handleLoadSample}
              onGenerate={() => void handleGenerate()}
              onReset={handleReset}
              isGenerating={isGenerating}
              validationError={validationError}
            />
          </div>

          <div className="lg:col-span-6">
            <OutputPanel
              result={result}
              format={format}
              feature={feature}
              isGenerating={isGenerating}
              error={apiError}
              onRegenerate={() => void handleGenerate()}
              onClearOutput={() => {
                setResult(null);
                setApiError(null);
              }}
            />
          </div>
        </div>
      </main>

      <footer className="no-print border-t border-[#E8E4DC] bg-white/60 py-4 text-center text-xs text-[#71717A]">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          Aivora AI Summarizer · Summaries are generated strictly from your provided content.
        </div>
      </footer>
    </div>
  );
}
