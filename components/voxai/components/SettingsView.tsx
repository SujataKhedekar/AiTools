import { Check, Moon, Sun, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { SUPPORTED_LANGUAGES } from '../data/voices';
import type {
  AppSettings,
  AudioFormat,
  LanguageOption,
  ProviderHealth,
  SpeechSpeed,
  VoiceProfile,
} from '../types/vox';

interface SettingsViewProps {
  settings: AppSettings;
  voices: VoiceProfile[];
  health: ProviderHealth | null;
  historyCount: number;
  onUpdateSettings: (next: AppSettings) => void;
  onClearHistory: () => Promise<void>;
  onClearPronunciations: () => void;
}

const SPEED_OPTIONS: SpeechSpeed[] = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

export function SettingsView({
  settings,
  voices,
  health,
  historyCount,
  onUpdateSettings,
  onClearHistory,
  onClearPronunciations,
}: SettingsViewProps) {
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearedBanner, setClearedBanner] = useState<string | null>(null);

  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    onUpdateSettings({ ...settings, [key]: value });
  };

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="border-b border-slate-200 dark:border-white/10 pb-6">
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Settings
        </h1>
        <p className="mt-1.5 text-sm text-slate-600 dark:text-[#A1A1AA]">
          Customize your default studio preferences, theme, and local browser storage.
        </p>
      </div>

      <div className="mt-6 space-y-6">
        {/* Voice & Language Defaults */}
        <section className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#191C24] p-6 space-y-5">
          <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
            Studio Defaults
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="setting-language"
                className="block text-xs font-medium text-slate-600 dark:text-[#A1A1AA] mb-1.5"
              >
                Default Language
              </label>
              <select
                id="setting-language"
                value={settings.defaultLanguage}
                onChange={(e) => update('defaultLanguage', e.target.value as LanguageOption)}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#111318] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-[#8065F5] focus:outline-none"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.label} value={lang.label}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="setting-voice"
                className="block text-xs font-medium text-slate-600 dark:text-[#A1A1AA] mb-1.5"
              >
                Default Voice
              </label>
              <select
                id="setting-voice"
                value={settings.defaultVoiceId}
                onChange={(e) => update('defaultVoiceId', e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#111318] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-[#8065F5] focus:outline-none"
              >
                {voices.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.language})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <span className="block text-xs font-medium text-slate-600 dark:text-[#A1A1AA] mb-2">
              Default Speech Speed
            </span>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {SPEED_OPTIONS.map((spd) => (
                <button
                  key={spd}
                  type="button"
                  onClick={() => update('defaultSpeed', spd)}
                  className={`rounded-xl py-2 text-xs font-mono-tabular font-medium transition-colors ${
                    settings.defaultSpeed === spd
                      ? 'bg-[#8065F5] text-white'
                      : 'border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#111318] text-slate-700 dark:text-[#A1A1AA] hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <span className="block text-xs font-medium text-slate-600 dark:text-[#A1A1AA] mb-2">
                Preferred Download Format
              </span>
              <div className="grid grid-cols-2 gap-2">
                {(['mp3', 'wav'] as AudioFormat[]).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => update('defaultDownloadFormat', fmt)}
                    className={`rounded-xl py-2.5 text-xs font-semibold uppercase transition-colors ${
                      settings.defaultDownloadFormat === fmt
                        ? 'bg-[#8065F5] text-white'
                        : 'border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#111318] text-slate-700 dark:text-[#A1A1AA]'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="block text-xs font-medium text-slate-600 dark:text-[#A1A1AA] mb-2">
                Theme
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => update('theme', 'dark')}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-medium transition-colors ${
                    settings.theme === 'dark'
                      ? 'bg-[#8065F5] text-white'
                      : 'border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#111318] text-slate-700 dark:text-[#A1A1AA]'
                  }`}
                >
                  <Moon className="h-3.5 w-3.5" />
                  <span>Dark Studio</span>
                </button>
                <button
                  type="button"
                  onClick={() => update('theme', 'light')}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-medium transition-colors ${
                    settings.theme === 'light'
                      ? 'bg-[#8065F5] text-white'
                      : 'border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#111318] text-slate-700 dark:text-[#A1A1AA]'
                  }`}
                >
                  <Sun className="h-3.5 w-3.5" />
                  <span>Light</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Engine Status (Read-Only) */}
        <section className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#191C24] p-6">
          <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
            Connected Speech Engines
          </h2>
          <div className="mt-4 divide-y divide-slate-200 dark:divide-white/10 text-sm">
            <div className="flex items-center justify-between py-2.5">
              <span className="text-slate-600 dark:text-[#A1A1AA]">Gemini Neural TTS</span>
              <span className={health?.providers.gemini ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-amber-500 font-medium'}>
                {health?.providers.gemini ? 'Connected' : 'Not configured'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-slate-600 dark:text-[#A1A1AA]">ElevenLabs Engine</span>
              <span className={health?.providers.elevenlabs ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-500 dark:text-[#A1A1AA]'}>
                {health?.providers.elevenlabs ? 'Connected' : 'Optional (Server Secret)'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-slate-600 dark:text-[#A1A1AA]">FFmpeg Audio Converter (MP3 / WAV)</span>
              <span className={health?.ffmpeg ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-amber-500'}>
                {health?.ffmpeg ? 'Ready' : health ? 'Not installed' : 'Checking…'}
              </span>
            </div>
          </div>
        </section>

        {/* Local Data Management */}
        <section className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#191C24] p-6">
          <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
            Local Storage & History
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-[#A1A1AA]">
            Currently storing {historyCount} generated audio clip{historyCount === 1 ? '' : 's'} in IndexedDB.
          </p>

          {clearedBanner && (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs text-emerald-700 dark:text-emerald-300">
              <Check className="h-4 w-4" />
              <span>{clearedBanner}</span>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {!confirmClear ? (
              <button
                type="button"
                disabled={historyCount === 0}
                onClick={() => setConfirmClear(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-medium text-red-600 dark:text-red-300 hover:bg-red-500/20 disabled:opacity-40 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear Audio History</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    await onClearHistory();
                    setConfirmClear(false);
                    setClearedBanner('Audio history cleared.');
                  }}
                  className="rounded-xl bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-500"
                >
                  Confirm Delete All ({historyCount})
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="rounded-xl border border-slate-200 dark:border-white/10 px-3 py-2 text-xs font-medium text-slate-600 dark:text-[#A1A1AA]"
                >
                  Cancel
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                onClearPronunciations();
                setClearedBanner('Pronunciation dictionary reset.');
              }}
              className="rounded-xl border border-slate-200 dark:border-white/10 px-4 py-2 text-xs font-medium text-slate-700 dark:text-[#A1A1AA] hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Reset Pronunciation Rules
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
