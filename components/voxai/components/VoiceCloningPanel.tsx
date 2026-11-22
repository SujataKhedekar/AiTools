import { CheckCircle2, Loader2, Mic, Square, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { SUPPORTED_LANGUAGES } from '../data/voices';
import { blobToBase64, formatDuration } from '../lib/audioUtils';
import type { LanguageOption, VoiceProfile } from '../types/vox';

interface VoiceCloningPanelProps {
  defaultLanguage: LanguageOption;
  onVoiceCreated: (voice: VoiceProfile) => void;
}

export function VoiceCloningPanel({
  defaultLanguage,
  onVoiceCreated,
}: VoiceCloningPanelProps) {
  const [voiceName, setVoiceName] = useState('');
  const [language, setLanguage] = useState<LanguageOption>(defaultLanguage);
  const [consentChecked, setConsentChecked] = useState(false);

  const [sampleBlob, setSampleBlob] = useState<Blob | null>(null);
  const [sampleUrl, setSampleUrl] = useState<string | null>(null);
  const [sampleLabel, setSampleLabel] = useState<string>('');

  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNote, setSuccessNote] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (sampleUrl) URL.revokeObjectURL(sampleUrl);
    };
  }, [sampleUrl]);

  const setNewSample = (blob: Blob, label: string) => {
    if (sampleUrl) URL.revokeObjectURL(sampleUrl);
    const url = URL.createObjectURL(blob);
    setSampleBlob(blob);
    setSampleUrl(url);
    setSampleLabel(label);
    setError(null);
    setSuccessNote(null);
  };

  const startRecording = async () => {
    setError(null);
    setSuccessNote(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const preferredMime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      const recorder = new MediaRecorder(stream, { mimeType: preferredMime });
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        setNewSample(blob, 'Microphone Recording');
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordSeconds(0);

      timerRef.current = window.setInterval(() => {
        setRecordSeconds((s) => {
          if (s >= 60) {
            stopRecording();
            return s;
          }
          return s + 1;
        });
      }, 1000);
    } catch {
      setError(
        'Microphone access was denied or unavailable. You can upload an audio recording instead.'
      );
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      setError('Audio sample must be under 15 MB.');
      return;
    }
    setNewSample(file, file.name);
    e.target.value = '';
  };

  const handleCloneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessNote(null);

    if (!sampleBlob) {
      setError('Record your voice or upload a clean audio sample first.');
      return;
    }
    if (!voiceName.trim()) {
      setError('Enter a name for your custom voice.');
      return;
    }
    if (!consentChecked) {
      setError('Explicit voice-owner consent is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const audioBase64 = await blobToBase64(sampleBlob);
      const res = await fetch('/api/voxai/voices/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: voiceName.trim(),
          language,
          consent: true,
          audioBase64,
          mimeType: sampleBlob.type || 'audio/webm',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Voice cloning failed.');
      }

      onVoiceCreated(data.voice as VoiceProfile);
      setSuccessNote(
        `Custom voice "${data.voice.name}" created and selected. You can now generate speech with it.`
      );
      setVoiceName('');
      setConsentChecked(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Voice cloning failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleCloneSubmit} className="space-y-5">
      <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#111318] p-4">
        <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
          1. Capture or Upload Your Voice Sample
        </h3>
        <p className="mt-1 text-xs text-slate-600 dark:text-[#A1A1AA]">
          Speak naturally for 10–30 seconds in a quiet room, or upload a clean WAV/MP3/WebM clip.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {!isRecording ? (
            <button
              type="button"
              onClick={startRecording}
              className="inline-flex items-center gap-2 rounded-xl bg-[#8065F5] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#7053eb] transition-colors"
            >
              <Mic className="h-4 w-4" />
              <span>Record Microphone</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={stopRecording}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-500 transition-colors"
            >
              <Square className="h-4 w-4" />
              <span className="font-mono-tabular">
                Stop Recording ({formatDuration(recordSeconds)})
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#202430] px-4 py-2.5 text-sm font-medium text-slate-800 dark:text-white hover:border-[#8065F5] transition-colors"
          >
            <Upload className="h-4 w-4" />
            <span>Upload Audio File</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {sampleUrl && (
          <div className="mt-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#191C24] p-3.5">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-[#A1A1AA] mb-2">
              <span className="font-medium text-slate-900 dark:text-white">{sampleLabel}</span>
              <span>Preview before cloning</span>
            </div>
            <audio controls src={sampleUrl} className="w-full h-9" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="clone-voice-name" className="block text-xs font-medium text-slate-600 dark:text-[#A1A1AA] mb-1.5">
            Custom Voice Name
          </label>
          <input
            id="clone-voice-name"
            type="text"
            maxLength={40}
            value={voiceName}
            onChange={(e) => setVoiceName(e.target.value)}
            placeholder="e.g. My Studio Voice"
            className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#111318] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#8065F5] focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="clone-voice-lang" className="block text-xs font-medium text-slate-600 dark:text-[#A1A1AA] mb-1.5">
            Primary Language
          </label>
          <select
            id="clone-voice-lang"
            value={language}
            onChange={(e) => setLanguage(e.target.value as LanguageOption)}
            className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#111318] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-[#8065F5] focus:outline-none"
          >
            {SUPPORTED_LANGUAGES.map((l) => (
              <option key={l.label} value={l.label}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Explicit Consent Guardrail */}
      <label className="flex items-start gap-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#111318] p-4 cursor-pointer">
        <input
          type="checkbox"
          checked={consentChecked}
          onChange={(e) => setConsentChecked(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#8065F5] focus:ring-[#8065F5]"
        />
        <span className="text-xs leading-relaxed text-slate-700 dark:text-[#A1A1AA]">
          I confirm that this recording is my own voice or that I hold explicit, verifiable
          permission from the speaker. I agree not to use VoxAI to impersonate public figures or
          create unauthorized voice clones.
        </span>
      </label>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300"
        >
          {error}
        </div>
      )}

      {successNote && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successNote}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting || !sampleBlob || !voiceName.trim() || !consentChecked}
        className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#8065F5] px-6 py-3 text-sm font-semibold text-white hover:bg-[#7053eb] disabled:opacity-45 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        <span>{isSubmitting ? 'Analyzing & Creating Voice Profile…' : 'Create Cloned Voice'}</span>
      </button>
    </form>
  );
}
