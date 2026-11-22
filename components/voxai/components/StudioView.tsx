import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  FileUp,
  Loader2,
  MessageSquare,
  Mic,
  Play,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Square,
  Trash2,
  User,
  Volume2,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  SAMPLE_DIALOGUE_SCRIPT,
  SAMPLE_SCRIPTS,
  SUPPORTED_LANGUAGES,
} from '../data/voices';
import {
  base64ToBlob,
  estimateChunkCount,
} from '../lib/audioUtils';
import type {
  AudioFormat,
  DialogueLine,
  EmotionTone,
  ExpressivenessStyle,
  GeneratedAudioRecord,
  LanguageOption,
  PronunciationRule,
  ProviderHealth,
  SpeechSpeed,
  VoiceProfile,
  VoiceSettingsState,
  VoiceStability,
} from '../types/vox';
import { PronunciationModal } from './PronunciationModal';
import { VoiceCloningPanel } from './VoiceCloningPanel';
import { WaveformPlayer } from './WaveformPlayer';

export type StudioMode = 'single' | 'multi' | 'clone';

interface StudioViewProps {
  mode: StudioMode;
  onChangeMode: (mode: StudioMode) => void;
  voices: VoiceProfile[];
  selectedVoiceId: string;
  onSelectVoiceId: (id: string) => void;
  voiceSettings: VoiceSettingsState;
  onChangeVoiceSettings: (next: VoiceSettingsState) => void;
  text: string;
  onChangeText: (next: string) => void;
  pronunciations: PronunciationRule[];
  onAddPronunciation: (word: string, pronunciation: string) => void;
  onDeletePronunciation: (id: string) => void;
  defaultDownloadFormat: AudioFormat;
  health: ProviderHealth | null;
  onOpenLibrary: () => void;
  onAudioGenerated: (record: GeneratedAudioRecord) => Promise<void>;
  onVoiceCloned: (voice: VoiceProfile) => void;
}

const SPEEDS: SpeechSpeed[] = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
const STYLES: ExpressivenessStyle[] = ['Natural', 'Conversational', 'Expressive', 'Dramatic'];
const EMOTIONS: EmotionTone[] = [
  'Neutral',
  'Happy',
  'Sad',
  'Excited',
  'Serious',
  'Calm',
  'Friendly',
];
const STABILITIES: VoiceStability[] = ['Low', 'Medium', 'High'];

export function StudioView({
  mode,
  onChangeMode,
  voices,
  selectedVoiceId,
  onSelectVoiceId,
  voiceSettings,
  onChangeVoiceSettings,
  text,
  onChangeText,
  pronunciations,
  onAddPronunciation,
  onDeletePronunciation,
  defaultDownloadFormat,
  health,
  onOpenLibrary,
  onAudioGenerated,
  onVoiceCloned,
}: StudioViewProps) {
  const [pronModalOpen, setPronModalOpen] = useState(false);

  // Multi-speaker state
  const [speaker1Name, setSpeaker1Name] = useState('Alex');
  const [speaker2Name, setSpeaker2Name] = useState('Sam');
  const [speaker1VoiceId, setSpeaker1VoiceId] = useState('liam-us');
  const [speaker2VoiceId, setSpeaker2VoiceId] = useState('aria-us');
  const [dialogueLines, setDialogueLines] = useState<DialogueLine[]>([
    {
      id: 'd1',
      speaker: 'Speaker 1',
      text: 'Welcome back everyone! <breath> Today we are testing multi-speaker audio generation inside VoxAI.',
    },
    {
      id: 'd2',
      speaker: 'Speaker 2',
      text: 'Honestly, |yeah| hearing two distinct voices interact in one seamless track makes scripting podcasts so much faster.',
    },
  ]);

  // Generation & Enhance states
  const [isGenerating, setIsGenerating] = useState(false);
  const [genProgressText, setGenProgressText] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [genSuccess, setGenSuccess] = useState<string | null>(null);

  // Generated Output state
  const [generatedOutput, setGeneratedOutput] = useState<{
    title: string;
    voiceLabel: string;
    blob: Blob;
    durationSeconds: number;
  } | null>(null);

  // Quick preview of selected voice
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const txtInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  // Filter voices according to selected language (native first, then multilingual compatible)
  const voicesForLanguage = useMemo(() => {
    const lang = voiceSettings.language;
    const native = voices.filter((v) => v.language === lang);
    const compatible = voices.filter(
      (v) => v.language !== lang && v.supportedLanguages.includes(lang)
    );
    const cloned = voices.filter(
      (v) =>
        v.isCloned &&
        v.language !== lang &&
        !v.supportedLanguages.includes(lang)
    );
    const combined = [...native, ...compatible, ...cloned];
    return combined.length > 0 ? combined : voices;
  }, [voices, voiceSettings.language]);

  const selectedVoice = useMemo(
    () =>
      voices.find((v) => v.id === selectedVoiceId) ??
      voicesForLanguage[0] ??
      voices[0],
    [voices, selectedVoiceId, voicesForLanguage]
  );

  // Auto-switch selected voice when language changes if current voice doesn't support it
  const handleLanguageChange = (nextLang: LanguageOption) => {
    onChangeVoiceSettings({ ...voiceSettings, language: nextLang });
    const currentSupports =
      selectedVoice &&
      (selectedVoice.language === nextLang ||
        selectedVoice.supportedLanguages.includes(nextLang) ||
        selectedVoice.isCloned);
    if (!currentSupports) {
      const bestMatch =
        voices.find((v) => v.language === nextLang) ??
        voices.find((v) => v.supportedLanguages.includes(nextLang));
      if (bestMatch) {
        onSelectVoiceId(bestMatch.id);
      }
    }
  };

  // Text metrics & validation
  const charCount = text.length;
  const wordCount = useMemo(() => {
    const trimmed = text.trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
  }, [text]);
  const paragraphCount = useMemo(() => {
    const trimmed = text.trim();
    return trimmed ? trimmed.split(/\n\s*\n+/).filter(Boolean).length : 0;
  }, [text]);
  const chunkCount = useMemo(() => estimateChunkCount(text, 550), [text]);
  const isOverLimit = charCount > 15000;

  const elevenLabsActiveForVoice = Boolean(
    health?.providers.elevenlabs && selectedVoice?.elevenLabsVoiceId
  );

  const handleImportTxt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const content = await file.text();
    onChangeText(content.slice(0, 15000));
    setGenError(null);
    e.target.value = '';
  };

  const handleEnhanceText = async () => {
    if (!text.trim() || isEnhancing) return;
    setIsEnhancing(true);
    setGenError(null);
    try {
      const res = await fetch('/api/voxai/tts/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not enhance text.');
      onChangeText(data.enhancedText);
    } catch (err: unknown) {
      setGenError(err instanceof Error ? err.message : 'Text enhancement failed.');
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleQuickPreview = async () => {
    if (!selectedVoice) return;
    if (isPreviewPlaying && previewAudioRef.current) {
      previewAudioRef.current.pause();
      setIsPreviewPlaying(false);
      return;
    }

    setIsPreviewLoading(true);
    setGenError(null);
    try {
      const res = await fetch('/api/voxai/tts/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voiceId: selectedVoice.id,
          language: voiceSettings.language,
          customVoice: selectedVoice.isCloned ? selectedVoice : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Preview failed.');

      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      const blob = base64ToBlob(data.audioBase64, 'audio/wav');
      const url = URL.createObjectURL(blob);
      previewUrlRef.current = url;

      const audio = new Audio(url);
      previewAudioRef.current = audio;
      audio.onended = () => setIsPreviewPlaying(false);
      await audio.play();
      setIsPreviewPlaying(true);
    } catch (err: unknown) {
      setGenError(err instanceof Error ? err.message : 'Voice preview failed.');
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleGenerateSingle = async () => {
    setGenError(null);
    setGenSuccess(null);

    if (!text.trim()) {
      setGenError('Enter or paste some text before generating speech.');
      return;
    }
    if (isOverLimit) {
      setGenError('Please shorten text to 15,000 characters or fewer.');
      return;
    }

    setIsGenerating(true);
    setGenProgressText(
      chunkCount > 1
        ? `Synthesizing ${chunkCount} long-form audio segments and merging cleanly…`
        : `Generating speech with ${selectedVoice.name}…`
    );

    try {
      const res = await fetch('/api/voxai/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voiceId: selectedVoice.id,
          language: voiceSettings.language,
          speed: voiceSettings.speed,
          pitch: voiceSettings.pitch,
          style: voiceSettings.style,
          emotion: voiceSettings.emotion,
          stability: voiceSettings.stability,
          similarity: voiceSettings.similarity,
          pronunciations,
          customVoice: selectedVoice.isCloned ? selectedVoice : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Speech generation failed.');
      }

      const wavBlob = base64ToBlob(data.audioBase64, 'audio/wav');
      const snippetTitle =
        text.trim().split(/\s+/).slice(0, 6).join(' ') || 'Generated Speech';
      const title = snippetTitle.length > 42 ? `${snippetTitle.slice(0, 42)}…` : snippetTitle;

      const output = {
        title,
        voiceLabel: `${selectedVoice.name} · ${voiceSettings.language}`,
        blob: wavBlob,
        durationSeconds: Number(data.durationSeconds || 0),
      };
      setGeneratedOutput(output);

      await onAudioGenerated({
        id: crypto.randomUUID(),
        title,
        text: text.trim(),
        voiceId: selectedVoice.id,
        voiceName: selectedVoice.name,
        language: voiceSettings.language,
        createdAt: Date.now(),
        durationSeconds: output.durationSeconds,
        byteLength: wavBlob.size,
        format: 'wav',
        mode: 'single',
        blob: wavBlob,
      });

      setGenSuccess(
        `Audio ready (${data.chunksProcessed > 1 ? `${data.chunksProcessed} segments combined` : 'single pass'}). Saved to My Audio.`
      );
    } catch (err: unknown) {
      setGenError(err instanceof Error ? err.message : 'Speech generation failed.');
    } finally {
      setIsGenerating(false);
      setGenProgressText('');
    }
  };

  const handleGenerateMultiSpeaker = async () => {
    setGenError(null);
    setGenSuccess(null);
    const validLines = dialogueLines.filter((l) => l.text.trim().length > 0);
    if (validLines.length === 0) {
      setGenError('Add at least one line of dialogue.');
      return;
    }

    setIsGenerating(true);
    setGenProgressText('Synthesizing multi-speaker dialogue track…');

    try {
      const v1 = voices.find((v) => v.id === speaker1VoiceId) ?? voices[0];
      const v2 = voices.find((v) => v.id === speaker2VoiceId) ?? voices[1] ?? voices[0];

      const res = await fetch('/api/voxai/tts/multi-speaker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lines: validLines,
          speaker1Name,
          speaker2Name,
          speaker1VoiceId: v1.id,
          speaker2VoiceId: v2.id,
          speaker1Custom: v1.isCloned ? v1 : undefined,
          speaker2Custom: v2.isCloned ? v2 : undefined,
          language: voiceSettings.language,
          speed: voiceSettings.speed,
          pronunciations,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Multi-speaker generation failed.');
      }

      const wavBlob = base64ToBlob(data.audioBase64, 'audio/wav');
      const title = `${speaker1Name} & ${speaker2Name} Dialogue`;

      const output = {
        title,
        voiceLabel: `${v1.name} + ${v2.name} · ${voiceSettings.language}`,
        blob: wavBlob,
        durationSeconds: Number(data.durationSeconds || 0),
      };
      setGeneratedOutput(output);

      const combinedScript = validLines
        .map((l) => `${l.speaker === 'Speaker 1' ? speaker1Name : speaker2Name}: ${l.text}`)
        .join('\n');

      await onAudioGenerated({
        id: crypto.randomUUID(),
        title,
        text: combinedScript,
        voiceId: v1.id,
        voiceName: `${v1.name} & ${v2.name}`,
        language: voiceSettings.language,
        createdAt: Date.now(),
        durationSeconds: output.durationSeconds,
        byteLength: wavBlob.size,
        format: 'wav',
        mode: 'multi-speaker',
        blob: wavBlob,
      });

      setGenSuccess('Multi-speaker dialogue generated and saved to My Audio.');
    } catch (err: unknown) {
      setGenError(err instanceof Error ? err.message : 'Dialogue generation failed.');
    } finally {
      setIsGenerating(false);
      setGenProgressText('');
    }
  };

  const handleLoadDialoguePreset = () => {
    const parsedLines = SAMPLE_DIALOGUE_SCRIPT.split('\n')
      .map((line, i) => {
        const match = line.match(/^([^:]+):\s*(.+)$/);
        if (!match) return null;
        return {
          id: `preset-${i}`,
          speaker: (i % 2 === 0 ? 'Speaker 1' : 'Speaker 2') as 'Speaker 1' | 'Speaker 2',
          text: match[2].trim(),
        };
      })
      .filter((x): x is DialogueLine => x !== null);
    if (parsedLines.length > 0) setDialogueLines(parsedLines);
  };

  const activeAccent = SUPPORTED_LANGUAGES.find(
    (l) => l.label === voiceSettings.language
  )?.accent;

  return (
    <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8 py-7">
      {/* Studio Hero Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white text-balance">
            Give Your Text a Voice
          </h1>
          <p className="mt-2 text-base text-slate-600 dark:text-[#A1A1AA]">
            Generate realistic AI voices from any text in seconds. Transform Text Into Realistic Human Voices.
          </p>
        </div>

        {/* Workspace Mode Switcher */}
        <div
          role="tablist"
          aria-label="Generation Mode"
          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-[#191C24] p-1 self-start lg:self-auto"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'single'}
            onClick={() => onChangeMode('single')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
              mode === 'single'
                ? 'bg-[#8065F5] text-white'
                : 'text-slate-600 dark:text-[#A1A1AA] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <User className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Text to Speech</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={mode === 'multi'}
            onClick={() => onChangeMode('multi')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
              mode === 'multi'
                ? 'bg-[#8065F5] text-white'
                : 'text-slate-600 dark:text-[#A1A1AA] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Multi-Speaker</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={mode === 'clone'}
            onClick={() => onChangeMode('clone')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
              mode === 'clone'
                ? 'bg-[#8065F5] text-white'
                : 'text-slate-600 dark:text-[#A1A1AA] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Mic className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Voice Cloning</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
        {/* Left Column: Editor + Output Player */}
        <div className="space-y-6 min-w-0">
          {mode === 'single' && (
            <section
              aria-label="Text Input Editor"
              className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#191C24] p-5 sm:p-6"
            >
              {/* Editor Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-white/10">
                <div className="flex flex-wrap items-center gap-1.5">
                  {SAMPLE_SCRIPTS.map((sample) => (
                    <button
                      key={sample.label}
                      type="button"
                      onClick={() => {
                        onChangeText(sample.text);
                        setGenError(null);
                      }}
                      className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#111318] px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-[#A1A1AA] hover:border-[#8065F5]/60 hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap"
                    >
                      {sample.label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => txtInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-white/10 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-[#A1A1AA] hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap"
                  >
                    <FileUp className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Import TXT</span>
                  </button>
                  <input
                    ref={txtInputRef}
                    type="file"
                    accept=".txt,text/plain"
                    onChange={handleImportTxt}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => setPronModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-white/10 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-[#A1A1AA] hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap"
                  >
                    <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>
                      Pronunciation{pronunciations.length > 0 ? ` (${pronunciations.length})` : ''}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleEnhanceText}
                    disabled={!text.trim() || isEnhancing}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#8065F5]/40 bg-[#8065F5]/10 px-2.5 py-1.5 text-xs font-medium text-[#8065F5] dark:text-[#A78BFA] hover:bg-[#8065F5]/20 disabled:opacity-45 transition-colors whitespace-nowrap"
                  >
                    {isEnhancing ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                    <span>{isEnhancing ? 'Enhancing…' : 'Enhance Text'}</span>
                  </button>

                  {text.length > 0 && (
                    <button
                      type="button"
                      onClick={() => onChangeText('')}
                      className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-red-500 dark:text-[#A1A1AA] dark:hover:text-red-400 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Large Text Area */}
              <textarea
                aria-label="Speech text editor"
                value={text}
                onChange={(e) => {
                  onChangeText(e.target.value);
                  if (genError) setGenError(null);
                }}
                rows={10}
                placeholder="Type or paste your text here to generate realistic speech..."
                className="mt-4 w-full resize-y rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#111318] p-4 text-[15px] leading-relaxed text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#A1A1AA]/60 focus:border-[#8065F5] focus:outline-none min-h-[240px]"
              />

              {/* Metrics & Validation Footer */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-[#A1A1AA]">
                <div className="flex flex-wrap items-center gap-2 font-mono-tabular">
                  <span className={isOverLimit ? 'text-red-500 font-semibold' : ''}>
                    {charCount.toLocaleString()} / 15,000 chars
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{wordCount.toLocaleString()} words</span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {paragraphCount} paragraph{paragraphCount === 1 ? '' : 's'}
                  </span>
                  {chunkCount > 1 && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-[#8065F5] dark:text-[#A78BFA]">
                        Long-form auto-chunking ({chunkCount} segments)
                      </span>
                    </>
                  )}
                </div>

                <span className="text-slate-400 dark:text-[#A1A1AA]/80">
                  Tip: Use &lt;breath&gt; or &lt;laugh&gt; for natural vocal bursts
                </span>
              </div>
            </section>
          )}

          {mode === 'multi' && (
            <section
              aria-label="Multi-Speaker Dialogue Editor"
              className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#191C24] p-5 sm:p-6 space-y-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-white/10">
                <div>
                  <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                    Multi-Speaker Conversation
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-[#A1A1AA]">
                    Assign distinct voices to two speakers and build natural dialogue.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPronModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-white/10 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-[#A1A1AA] hover:text-slate-900 dark:hover:text-white"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>Pronunciation</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleLoadDialoguePreset}
                    className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#111318] px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-[#A1A1AA] hover:text-slate-900 dark:hover:text-white"
                  >
                    Load Sample Dialogue
                  </button>
                </div>
              </div>

              {/* Speaker Assignment Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#111318] p-3.5 space-y-2.5">
                  <label className="block text-xs font-medium text-slate-500 dark:text-[#A1A1AA]">
                    Speaker 1 Name & Voice
                  </label>
                  <input
                    type="text"
                    value={speaker1Name}
                    onChange={(e) => setSpeaker1Name(e.target.value)}
                    placeholder="Alex"
                    className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#191C24] px-3 py-1.5 text-sm text-slate-900 dark:text-white focus:border-[#8065F5] focus:outline-none"
                  />
                  <select
                    aria-label="Speaker 1 Voice"
                    value={speaker1VoiceId}
                    onChange={(e) => setSpeaker1VoiceId(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#191C24] px-3 py-1.5 text-sm text-slate-900 dark:text-white focus:border-[#8065F5] focus:outline-none"
                  >
                    {voices.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} · {v.language}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#111318] p-3.5 space-y-2.5">
                  <label className="block text-xs font-medium text-slate-500 dark:text-[#A1A1AA]">
                    Speaker 2 Name & Voice
                  </label>
                  <input
                    type="text"
                    value={speaker2Name}
                    onChange={(e) => setSpeaker2Name(e.target.value)}
                    placeholder="Sam"
                    className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#191C24] px-3 py-1.5 text-sm text-slate-900 dark:text-white focus:border-[#8065F5] focus:outline-none"
                  />
                  <select
                    aria-label="Speaker 2 Voice"
                    value={speaker2VoiceId}
                    onChange={(e) => setSpeaker2VoiceId(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#191C24] px-3 py-1.5 text-sm text-slate-900 dark:text-white focus:border-[#8065F5] focus:outline-none"
                  >
                    {voices.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} · {v.language}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dialogue Lines */}
              <div className="space-y-3">
                {dialogueLines.map((line, index) => (
                  <div
                    key={line.id}
                    className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-start rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#111318] p-3"
                  >
                    <select
                      aria-label={`Line ${index + 1} speaker`}
                      value={line.speaker}
                      onChange={(e) => {
                        const nextSpeaker = e.target.value as 'Speaker 1' | 'Speaker 2';
                        setDialogueLines((prev) =>
                          prev.map((l) => (l.id === line.id ? { ...l, speaker: nextSpeaker } : l))
                        );
                      }}
                      className="sm:w-36 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#191C24] px-2.5 py-2 text-xs font-medium text-slate-900 dark:text-white focus:border-[#8065F5] focus:outline-none"
                    >
                      <option value="Speaker 1">{speaker1Name || 'Speaker 1'}</option>
                      <option value="Speaker 2">{speaker2Name || 'Speaker 2'}</option>
                    </select>

                    <textarea
                      rows={2}
                      value={line.text}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDialogueLines((prev) =>
                          prev.map((l) => (l.id === line.id ? { ...l, text: val } : l))
                        );
                      }}
                      placeholder="Enter spoken dialogue line…"
                      className="flex-1 resize-y rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#191C24] px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-[#8065F5] focus:outline-none"
                    />

                    {dialogueLines.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setDialogueLines((prev) => prev.filter((l) => l.id !== line.id))
                        }
                        aria-label="Remove line"
                        className="self-end sm:self-center rounded-lg p-2 text-slate-400 hover:bg-red-500/10 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() =>
                    setDialogueLines((prev) => [
                      ...prev,
                      {
                        id: crypto.randomUUID(),
                        speaker:
                          prev[prev.length - 1]?.speaker === 'Speaker 1'
                            ? 'Speaker 2'
                            : 'Speaker 1',
                        text: '',
                      },
                    ])
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 dark:border-white/20 px-4 py-2 text-xs font-medium text-slate-600 dark:text-[#A1A1AA] hover:border-[#8065F5] hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Dialogue Turn</span>
                </button>
              </div>
            </section>
          )}

          {mode === 'clone' && (
            <section
              aria-label="Voice Cloning Studio"
              className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#191C24] p-5 sm:p-6"
            >
              <div className="border-b border-slate-200 dark:border-white/10 pb-4 mb-5">
                <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                  Create Your Custom Voice
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-[#A1A1AA]">
                  Record or upload your own voice with explicit consent to synthesize personalized speech.
                </p>
              </div>
              <VoiceCloningPanel
                defaultLanguage={voiceSettings.language}
                onVoiceCreated={(newVoice) => {
                  onVoiceCloned(newVoice);
                }}
              />
            </section>
          )}

          {/* Generation Status / Progress / Errors */}
          {isGenerating && (
            <div className="flex items-center gap-3 rounded-2xl border border-[#8065F5]/40 bg-[#8065F5]/10 px-5 py-4">
              <Loader2 className="h-5 w-5 animate-spin text-[#8065F5] shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {genProgressText || 'Synthesizing realistic speech…'}
                </p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                  <div className="h-full w-1/2 animate-pulse rounded-full bg-[#8065F5]" />
                </div>
              </div>
            </div>
          )}

          {genError && (
            <div
              role="alert"
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4"
            >
              <div className="flex items-center gap-2.5 text-sm text-red-700 dark:text-red-300">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{genError}</span>
              </div>
              {mode !== 'clone' && (
                <button
                  type="button"
                  onClick={mode === 'single' ? handleGenerateSingle : handleGenerateMultiSpeaker}
                  className="rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-red-500"
                >
                  Retry Generation
                </button>
              )}
            </div>
          )}

          {genSuccess && !isGenerating && (
            <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3.5 text-sm text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{genSuccess}</span>
            </div>
          )}

          {/* Audio Playback & Export Section */}
          {generatedOutput && (
            <WaveformPlayer
              title={generatedOutput.title}
              voiceLabel={generatedOutput.voiceLabel}
              audioBlob={generatedOutput.blob}
              durationSeconds={generatedOutput.durationSeconds}
              defaultDownloadFormat={defaultDownloadFormat}
              onRegenerate={
                mode === 'single'
                  ? handleGenerateSingle
                  : mode === 'multi'
                    ? handleGenerateMultiSpeaker
                    : undefined
              }
              isRegenerating={isGenerating}
            />
          )}
        </div>

        {/* Right Column: Voice Selection, Language & Voice Settings */}
        <aside className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#191C24] p-5 sm:p-6 space-y-6">
          {/* Language & Accent */}
          <div>
            <label
              htmlFor="studio-language"
              className="block text-xs font-medium text-slate-600 dark:text-[#A1A1AA] mb-1.5"
            >
              Language & Accent
            </label>
            <select
              id="studio-language"
              value={voiceSettings.language}
              onChange={(e) => handleLanguageChange(e.target.value as LanguageOption)}
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#111318] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-[#8065F5] focus:outline-none"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.label} value={lang.label}>
                  {lang.label} — {lang.accent}
                </option>
              ))}
            </select>
            {activeAccent && (
              <p className="mt-1.5 text-xs text-slate-500 dark:text-[#A1A1AA]">
                Showing voices tuned for {voiceSettings.language} ({activeAccent})
              </p>
            )}
          </div>

          {/* Voice Selection Panel */}
          {mode !== 'multi' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="studio-voice"
                  className="text-xs font-medium text-slate-600 dark:text-[#A1A1AA]"
                >
                  AI Voice
                </label>
                <button
                  type="button"
                  onClick={onOpenLibrary}
                  className="text-xs font-medium text-[#8065F5] dark:text-[#A78BFA] hover:underline"
                >
                  Browse All ({voices.length})
                </button>
              </div>

              <div className="flex items-center gap-2">
                <select
                  id="studio-voice"
                  value={selectedVoice?.id || ''}
                  onChange={(e) => onSelectVoiceId(e.target.value)}
                  className="min-w-0 flex-1 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#111318] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-[#8065F5] focus:outline-none"
                >
                  {voicesForLanguage.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.gender} · {v.accent})
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleQuickPreview}
                  disabled={isPreviewLoading}
                  aria-label="Preview selected voice"
                  title="Preview selected voice"
                  className="inline-flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#111318] text-[#8065F5] hover:border-[#8065F5] disabled:opacity-50 transition-colors"
                >
                  {isPreviewLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isPreviewPlaying ? (
                    <Square className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </button>
              </div>

              {selectedVoice && (
                <div className="mt-2.5 rounded-xl bg-slate-50 dark:bg-[#111318] p-3 border border-slate-200/80 dark:border-white/5">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-[#A1A1AA]">
                    <Volume2 className="h-3.5 w-3.5 text-[#8065F5] shrink-0" />
                    <span>{selectedVoice.accent}</span>
                    <span aria-hidden="true">·</span>
                    <span>{selectedVoice.gender}</span>
                    <span aria-hidden="true">·</span>
                    <span>{selectedVoice.ageGroup}</span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-[#A1A1AA]">
                    {selectedVoice.description}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Voice Customization Controls */}
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-white/10">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-white">
                <SlidersHorizontal className="h-3.5 w-3.5 text-[#8065F5]" />
                <span>Voice Settings</span>
              </span>
              <button
                type="button"
                onClick={() =>
                  onChangeVoiceSettings({
                    ...voiceSettings,
                    speed: 1.0,
                    style: 'Natural',
                    emotion: 'Neutral',
                    pitch: 0,
                    stability: 'Medium',
                    similarity: 75,
                  })
                }
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 dark:text-[#A1A1AA] dark:hover:text-white"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            </div>

            {/* Speech Speed */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-600 dark:text-[#A1A1AA]">Speech Speed</span>
                <span className="font-mono-tabular font-medium text-slate-900 dark:text-white">
                  {voiceSettings.speed}x
                </span>
              </div>
              <div className="grid grid-cols-6 gap-1 rounded-xl bg-slate-100 dark:bg-[#111318] p-1 border border-slate-200 dark:border-white/10">
                {SPEEDS.map((spd) => (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => onChangeVoiceSettings({ ...voiceSettings, speed: spd })}
                    className={`rounded-lg py-1.5 text-[11px] font-mono-tabular font-medium transition-colors ${
                      voiceSettings.speed === spd
                        ? 'bg-[#8065F5] text-white'
                        : 'text-slate-600 dark:text-[#A1A1AA] hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>

            {/* Style & Expressiveness */}
            {mode === 'single' && (
              <>
                <div>
                  <label
                    htmlFor="voice-style"
                    className="block text-xs text-slate-600 dark:text-[#A1A1AA] mb-1.5"
                  >
                    Style & Expressiveness
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {STYLES.map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => onChangeVoiceSettings({ ...voiceSettings, style: st })}
                        className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                          voiceSettings.style === st
                            ? 'border-[#8065F5] bg-[#8065F5]/15 text-[#8065F5] dark:text-[#A78BFA]'
                            : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#111318] text-slate-600 dark:text-[#A1A1AA] hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Emotion */}
                <div>
                  <label
                    htmlFor="voice-emotion"
                    className="block text-xs text-slate-600 dark:text-[#A1A1AA] mb-1.5"
                  >
                    Emotion
                  </label>
                  <select
                    id="voice-emotion"
                    value={voiceSettings.emotion}
                    onChange={(e) =>
                      onChangeVoiceSettings({
                        ...voiceSettings,
                        emotion: e.target.value as EmotionTone,
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#111318] px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-[#8065F5] focus:outline-none"
                  >
                    {EMOTIONS.map((em) => (
                      <option key={em} value={em}>
                        {em}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Pitch Adjustment */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-600 dark:text-[#A1A1AA]">Pitch Shift</span>
                    <span className="font-mono-tabular font-medium text-slate-900 dark:text-white">
                      {voiceSettings.pitch > 0 ? `+${voiceSettings.pitch}` : voiceSettings.pitch} st
                    </span>
                  </div>
                  <input
                    type="range"
                    aria-label="Pitch shift in semitones"
                    min={-4}
                    max={4}
                    step={0.5}
                    value={voiceSettings.pitch}
                    onChange={(e) =>
                      onChangeVoiceSettings({
                        ...voiceSettings,
                        pitch: Number(e.target.value),
                      })
                    }
                    className="vox-slider w-full"
                  />
                </div>

                {/* Provider-Gated ElevenLabs Controls (Honest: disabled unless ElevenLabs voice is active) */}
                <div className="pt-2 border-t border-slate-200/80 dark:border-white/10 space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-[#A1A1AA]">
                    <span>Stability & Similarity</span>
                    <span>
                      {elevenLabsActiveForVoice
                        ? 'ElevenLabs active'
                        : 'Requires ElevenLabs voice'}
                    </span>
                  </div>

                  <div>
                    <span className="block text-xs text-slate-600 dark:text-[#A1A1AA] mb-1">
                      Voice Stability
                    </span>
                    <div className="grid grid-cols-3 gap-1">
                      {STABILITIES.map((stb) => (
                        <button
                          key={stb}
                          type="button"
                          disabled={!elevenLabsActiveForVoice}
                          onClick={() =>
                            onChangeVoiceSettings({ ...voiceSettings, stability: stb })
                          }
                          className={`rounded-lg py-1.5 text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                            voiceSettings.stability === stb
                              ? 'bg-[#8065F5] text-white'
                              : 'border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#111318] text-slate-600 dark:text-[#A1A1AA]'
                          }`}
                        >
                          {stb}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-600 dark:text-[#A1A1AA]">Voice Similarity</span>
                      <span className="font-mono-tabular text-slate-700 dark:text-[#A1A1AA]">
                        {voiceSettings.similarity}%
                      </span>
                    </div>
                    <input
                      type="range"
                      aria-label="Voice Similarity"
                      disabled={!elevenLabsActiveForVoice}
                      min={0}
                      max={100}
                      value={voiceSettings.similarity}
                      onChange={(e) =>
                        onChangeVoiceSettings({
                          ...voiceSettings,
                          similarity: Number(e.target.value),
                        })
                      }
                      className="vox-slider w-full"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Primary Generate Action + Real API Connection Readout */}
          {mode !== 'clone' && (
            <div className="pt-2 space-y-3">
              <button
                type="button"
                disabled={
                  isGenerating ||
                  (mode === 'single' && (!text.trim() || isOverLimit)) ||
                  !health?.providers.gemini
                }
                onClick={mode === 'single' ? handleGenerateSingle : handleGenerateMultiSpeaker}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#8065F5] px-5 py-3.5 text-sm font-semibold text-white hover:bg-[#7053eb] disabled:opacity-45 disabled:cursor-not-allowed transition-colors"
              >
                {isGenerating && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>
                  {isGenerating
                    ? 'Generating Speech…'
                    : mode === 'multi'
                      ? 'Generate Dialogue'
                      : 'Generate Speech'}
                </span>
              </button>

              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-[#A1A1AA]">
                <span>Speech Engine</span>
                <span
                  className={
                    health?.providers.gemini
                      ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                      : 'text-amber-500 font-medium'
                  }
                >
                  {health === null
                    ? 'Checking connection…'
                    : health.providers.gemini
                      ? health.providers.elevenlabs
                        ? 'Gemini + ElevenLabs Ready'
                        : 'Gemini Neural TTS Ready'
                      : 'API Key Missing'}
                </span>
              </div>
            </div>
          )}
        </aside>
      </div>

      <PronunciationModal
        isOpen={pronModalOpen}
        rules={pronunciations}
        onClose={() => setPronModalOpen(false)}
        onAddRule={onAddPronunciation}
        onDeleteRule={onDeletePronunciation}
      />
    </div>
  );
}
