import {
  Download,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Scissors,
  Square,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import {
  blobToBase64,
  formatBytes,
  formatDuration,
  formatDurationPrecise,
  triggerFileDownload,
} from '../lib/audioUtils';
import type { AudioFormat } from '../types/vox';

interface WaveformPlayerProps {
  title: string;
  voiceLabel: string;
  audioBlob: Blob;
  durationSeconds: number;
  defaultDownloadFormat: AudioFormat;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}

const PLAYBACK_RATES = [0.75, 1.0, 1.25, 1.5, 2.0];

export function WaveformPlayer({
  title,
  voiceLabel,
  audioBlob,
  durationSeconds,
  defaultDownloadFormat,
  onRegenerate,
  isRegenerating,
}: WaveformPlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wsRef = useRef<WaveSurfer | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(durationSeconds);
  const [volume, setVolume] = useState(0.95);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);

  const [trimMode, setTrimMode] = useState(false);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(durationSeconds);

  const [exportingFormat, setExportingFormat] = useState<AudioFormat | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [lastExportInfo, setLastExportInfo] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const objectUrl = URL.createObjectURL(audioBlob);
    setIsReady(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setLastExportInfo(null);
    setExportError(null);

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: 'rgba(167, 139, 250, 0.35)',
      progressColor: '#8065F5',
      cursorColor: '#FFFFFF',
      cursorWidth: 2,
      barWidth: 2,
      barGap: 2,
      barRadius: 2,
      height: 72,
      normalize: true,
    });

    wsRef.current = ws;

    ws.on('ready', () => {
      const dur = ws.getDuration() || durationSeconds;
      setTotalDuration(dur);
      setTrimStart(0);
      setTrimEnd(Number(dur.toFixed(1)));
      setIsReady(true);
      ws.setVolume(isMuted ? 0 : volume);
      ws.setPlaybackRate(playbackRate);
    });

    ws.on('timeupdate', (time) => {
      setCurrentTime(time);
      if (trimMode && time >= trimEnd && ws.isPlaying()) {
        ws.pause();
        ws.setTime(trimStart);
      }
    });

    ws.on('play', () => setIsPlaying(true));
    ws.on('pause', () => setIsPlaying(false));
    ws.on('finish', () => setIsPlaying(false));

    ws.load(objectUrl);

    return () => {
      ws.destroy();
      wsRef.current = null;
      URL.revokeObjectURL(objectUrl);
    };
  }, [audioBlob]);

  useEffect(() => {
    if (wsRef.current && isReady) {
      wsRef.current.setVolume(isMuted ? 0 : volume);
    }
  }, [volume, isMuted, isReady]);

  useEffect(() => {
    if (wsRef.current && isReady) {
      wsRef.current.setPlaybackRate(playbackRate);
    }
  }, [playbackRate, isReady]);

  const handlePlayPause = () => {
    if (!wsRef.current || !isReady) return;
    if (trimMode && !isPlaying) {
      const cur = wsRef.current.getCurrentTime();
      if (cur < trimStart || cur >= trimEnd) {
        wsRef.current.setTime(trimStart);
      }
    }
    wsRef.current.playPause();
  };

  const handleStop = () => {
    if (!wsRef.current || !isReady) return;
    wsRef.current.stop();
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const handleRestart = () => {
    if (!wsRef.current || !isReady) return;
    wsRef.current.setTime(trimMode ? trimStart : 0);
    wsRef.current.play();
  };

  const handleDownload = async (format: AudioFormat, onlySelectedSection: boolean) => {
    setExportError(null);
    setExportingFormat(format);
    try {
      const base64 = await blobToBase64(audioBlob);
      const body: {
        audioBase64: string;
        format: AudioFormat;
        startTime?: number;
        endTime?: number;
      } = {
        audioBase64: base64,
        format,
      };

      if (onlySelectedSection && trimEnd > trimStart + 0.05) {
        body.startTime = trimStart;
        body.endTime = trimEnd;
      }

      const response = await fetch('/api/voxai/tts/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: 'Conversion failed.' }));
        throw new Error(errData.error || 'Export failed.');
      }

      const outputBlob = await response.blob();
      const safeName = (title || 'voxai-speech')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 40) || 'voxai-speech';

      const suffix = onlySelectedSection ? '-clip' : '';
      triggerFileDownload(outputBlob, `${safeName}${suffix}.${format}`);
      setLastExportInfo(
        `Exported ${format.toUpperCase()} (${formatBytes(outputBlob.size)})`
      );
    } catch (err: unknown) {
      setExportError(err instanceof Error ? err.message : 'Download failed.');
    } finally {
      setExportingFormat(null);
    }
  };

  const progressPct = totalDuration > 0 ? Math.min(100, (currentTime / totalDuration) * 100) : 0;

  return (
    <section
      aria-label="Generated Audio Player"
      className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#191C24] p-5 sm:p-6"
    >
      {/* Top Info Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-white/10">
        <div className="min-w-0">
          <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white truncate">
            {title}
          </h3>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-[#A1A1AA]">
            <span>{voiceLabel}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-tabular">{formatDuration(totalDuration)}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-tabular">{formatBytes(audioBlob.size)} WAV</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTrimMode((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
              trimMode
                ? 'border-[#8065F5] bg-[#8065F5]/15 text-[#8065F5] dark:text-[#A78BFA]'
                : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-[#A1A1AA] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Scissors className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Select Section</span>
          </button>

          {onRegenerate && (
            <button
              type="button"
              onClick={onRegenerate}
              disabled={isRegenerating}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-white/10 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-[#A1A1AA] hover:border-[#8065F5]/50 hover:text-slate-900 dark:hover:text-white disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isRegenerating ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              <span>Regenerate</span>
            </button>
          )}
        </div>
      </div>

      {/* Interactive Waveform */}
      <div className="mt-4 rounded-xl bg-slate-100 dark:bg-[#111318] p-3.5 border border-slate-200/80 dark:border-white/5">
        <div ref={containerRef} className="w-full cursor-pointer" />
        {/* Progress bar & timestamps */}
        <div className="mt-2.5 flex items-center gap-3">
          <span className="font-mono-tabular text-xs text-slate-600 dark:text-[#A1A1AA] w-11">
            {formatDuration(currentTime)}
          </span>
          <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
            <div
              className="h-full bg-[#8065F5] transition-[width] duration-75"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="font-mono-tabular text-xs text-slate-600 dark:text-[#A1A1AA] w-11 text-right">
            {formatDuration(totalDuration)}
          </span>
        </div>
      </div>

      {/* Section Trim Controls */}
      {trimMode && (
        <div className="mt-3 rounded-xl border border-[#8065F5]/30 bg-[#8065F5]/5 p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs mb-2.5">
            <span className="font-medium text-slate-900 dark:text-white">
              Clip Range Selection
            </span>
            <span className="font-mono-tabular text-[#8065F5] dark:text-[#A78BFA]">
              {formatDurationPrecise(trimStart)} – {formatDurationPrecise(trimEnd)} (
              {formatDurationPrecise(Math.max(0, trimEnd - trimStart))})
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] text-slate-500 dark:text-[#A1A1AA] mb-1">
                Start Time (s)
              </label>
              <input
                type="range"
                min={0}
                max={Math.max(0.1, Number((trimEnd - 0.2).toFixed(1)))}
                step={0.1}
                value={trimStart}
                onChange={(e) => setTrimStart(Number(e.target.value))}
                className="vox-slider w-full"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 dark:text-[#A1A1AA] mb-1">
                End Time (s)
              </label>
              <input
                type="range"
                min={Math.min(totalDuration, Number((trimStart + 0.2).toFixed(1)))}
                max={Math.max(0.2, Number(totalDuration.toFixed(1)))}
                step={0.1}
                value={trimEnd}
                onChange={(e) => setTrimEnd(Number(e.target.value))}
                className="vox-slider w-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* Transport & Audio Controls */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePlayPause}
            disabled={!isReady}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#8065F5] px-4 text-sm font-medium text-white hover:bg-[#7053eb] disabled:opacity-50 transition-colors"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            <span>{isPlaying ? 'Pause' : currentTime > 0 ? 'Resume' : 'Play'}</span>
          </button>

          <button
            type="button"
            onClick={handleStop}
            disabled={!isReady}
            aria-label="Stop"
            title="Stop"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-[#A1A1AA] hover:text-slate-900 dark:hover:text-white disabled:opacity-40 transition-colors"
          >
            <Square className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={handleRestart}
            disabled={!isReady}
            aria-label="Restart audio"
            title="Restart"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-[#A1A1AA] hover:text-slate-900 dark:hover:text-white disabled:opacity-40 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

        {/* Volume & Playback Speed */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMuted((m) => !m)}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
              className="text-slate-600 dark:text-[#A1A1AA] hover:text-slate-900 dark:hover:text-white"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </button>
            <input
              type="range"
              aria-label="Volume"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setIsMuted(false);
                setVolume(Number(e.target.value));
              }}
              className="vox-slider w-20"
            />
          </div>

          <div className="flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-[#111318] p-1 border border-slate-200 dark:border-white/10">
            {PLAYBACK_RATES.map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => setPlaybackRate(rate)}
                className={`px-2 py-1 text-xs font-mono-tabular rounded-md transition-colors ${
                  playbackRate === rate
                    ? 'bg-[#8065F5] text-white'
                    : 'text-slate-600 dark:text-[#A1A1AA] hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Download Bar */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-white/10">
        <div className="text-xs text-slate-500 dark:text-[#A1A1AA]">
          {exportError ? (
            <span className="text-red-500 dark:text-red-400">{exportError}</span>
          ) : lastExportInfo ? (
            <span className="text-emerald-600 dark:text-emerald-400">{lastExportInfo}</span>
          ) : (
            <span>
              Download studio-quality {defaultDownloadFormat.toUpperCase()} or lossless WAV
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {trimMode && (
            <button
              type="button"
              disabled={exportingFormat !== null}
              onClick={() => handleDownload(defaultDownloadFormat, true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#8065F5]/40 bg-[#8065F5]/10 px-3 py-2 text-xs font-medium text-[#8065F5] dark:text-[#A78BFA] hover:bg-[#8065F5]/20 disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              <Scissors className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Export Section ({defaultDownloadFormat.toUpperCase()})</span>
            </button>
          )}

          <button
            type="button"
            disabled={exportingFormat !== null}
            onClick={() => handleDownload('mp3', false)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-white/15 bg-slate-100 dark:bg-[#202430] px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white hover:border-[#8065F5] disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{exportingFormat === 'mp3' ? 'Converting MP3…' : 'Download MP3'}</span>
          </button>

          <button
            type="button"
            disabled={exportingFormat !== null}
            onClick={() => handleDownload('wav', false)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-white/15 bg-slate-100 dark:bg-[#202430] px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white hover:border-[#8065F5] disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{exportingFormat === 'wav' ? 'Preparing WAV…' : 'Download WAV'}</span>
          </button>
        </div>
      </div>
    </section>
  );
}
