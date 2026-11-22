import { Check, Heart, Loader2, Play, Search, Square, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { SUPPORTED_LANGUAGES, VOICE_CATEGORIES } from '../data/voices';
import { base64ToBlob } from '../lib/audioUtils';
import type { LanguageOption, VoiceCategory, VoiceProfile } from '../types/vox';

interface VoiceLibraryViewProps {
  voices: VoiceProfile[];
  selectedVoiceId: string;
  favoriteVoiceIds: string[];
  activeLanguage: LanguageOption;
  onSelectVoice: (voice: VoiceProfile) => void;
  onToggleFavorite: (voiceId: string) => void;
  onDeleteClonedVoice?: (voiceId: string) => void;
}

export function VoiceLibraryView({
  voices,
  selectedVoiceId,
  favoriteVoiceIds,
  activeLanguage,
  onSelectVoice,
  onToggleFavorite,
  onDeleteClonedVoice,
}: VoiceLibraryViewProps) {
  const [search, setSearch] = useState('');
  const [languageFilter, setLanguageFilter] = useState<string>('All');
  const [accentFilter, setAccentFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<'All' | VoiceCategory>('All');
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const [previewLoadingId, setPreviewLoadingId] = useState<string | null>(null);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  const accents = useMemo(() => {
    const set = new Set<string>();
    voices.forEach((v) => set.add(v.accent));
    return ['All', ...Array.from(set)];
  }, [voices]);

  const filteredVoices = useMemo(() => {
    const q = search.trim().toLowerCase();
    return voices.filter((voice) => {
      if (favoritesOnly && !favoriteVoiceIds.includes(voice.id)) return false;
      if (
        languageFilter !== 'All' &&
        voice.language !== languageFilter &&
        !voice.supportedLanguages.includes(languageFilter as LanguageOption)
      ) {
        return false;
      }
      if (accentFilter !== 'All' && voice.accent !== accentFilter) return false;
      if (categoryFilter !== 'All' && !voice.categories.includes(categoryFilter)) return false;
      if (q) {
        const haystack = `${voice.name} ${voice.description} ${voice.language} ${voice.accent} ${voice.gender} ${voice.categories.join(' ')}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [voices, favoritesOnly, favoriteVoiceIds, languageFilter, accentFilter, categoryFilter, search]);

  const stopPreview = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setPlayingVoiceId(null);
  };

  const handlePreview = async (voice: VoiceProfile) => {
    setPreviewError(null);
    if (playingVoiceId === voice.id) {
      stopPreview();
      return;
    }
    stopPreview();
    setPreviewLoadingId(voice.id);

    try {
      const targetLang =
        languageFilter !== 'All'
          ? (languageFilter as LanguageOption)
          : voice.language || activeLanguage;

      const res = await fetch('/api/voxai/tts/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voiceId: voice.id,
          language: targetLang,
          customVoice: voice.isCloned ? voice : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not preview voice.');
      }

      const blob = base64ToBlob(data.audioBase64, 'audio/wav');
      const url = URL.createObjectURL(blob);
      objectUrlRef.current = url;

      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        setPlayingVoiceId(null);
      };
      audio.onerror = () => {
        setPlayingVoiceId(null);
        setPreviewError('Browser could not play the preview audio.');
      };

      await audio.play();
      setPlayingVoiceId(voice.id);
    } catch (err: unknown) {
      setPreviewError(err instanceof Error ? err.message : 'Preview failed.');
    } finally {
      setPreviewLoadingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Voice Library
          </h1>
          <p className="mt-1.5 text-sm text-slate-600 dark:text-[#A1A1AA]">
            Audition studio voices across accents, tones, and languages before generating speech.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search voices, accents…"
              aria-label="Search voices"
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#191C24] pl-9 pr-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#8065F5] focus:outline-none"
            />
          </div>

          <select
            aria-label="Filter by language"
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#191C24] px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-[#8065F5] focus:outline-none"
          >
            <option value="All">All Languages</option>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.label} value={lang.label}>
                {lang.label}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by accent"
            value={accentFilter}
            onChange={(e) => setAccentFilter(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#191C24] px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-[#8065F5] focus:outline-none"
          >
            {accents.map((acc) => (
              <option key={acc} value={acc}>
                {acc === 'All' ? 'All Accents' : acc}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setFavoritesOnly((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
              favoritesOnly
                ? 'border-[#8065F5] bg-[#8065F5]/15 text-[#8065F5] dark:text-[#A78BFA]'
                : 'border-slate-200 dark:border-white/10 bg-white dark:bg-[#191C24] text-slate-700 dark:text-[#A1A1AA] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Heart
              className={`h-4 w-4 ${favoritesOnly ? 'fill-current' : ''}`}
              aria-hidden="true"
            />
            <span>Favorites</span>
          </button>
        </div>
      </div>

      {/* Category Filter Strip */}
      <div className="mt-5 flex items-center gap-1.5 overflow-x-auto pb-2">
        <button
          type="button"
          onClick={() => setCategoryFilter('All')}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
            categoryFilter === 'All'
              ? 'bg-[#8065F5] text-white'
              : 'bg-slate-100 dark:bg-[#191C24] text-slate-600 dark:text-[#A1A1AA] hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          All Voices
        </button>
        {VOICE_CATEGORIES.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setCategoryFilter(category)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
              categoryFilter === category
                ? 'bg-[#8065F5] text-white'
                : 'bg-slate-100 dark:bg-[#191C24] text-slate-600 dark:text-[#A1A1AA] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {previewError && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300"
        >
          {previewError}
        </div>
      )}

      {/* Voice Grid */}
      {filteredVoices.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#191C24] p-10 text-center">
          <p className="text-base font-medium text-slate-900 dark:text-white">
            No voices match these filters
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-[#A1A1AA]">
            Try clearing your search query or switching back to All Languages.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setLanguageFilter('All');
              setAccentFilter('All');
              setCategoryFilter('All');
              setFavoritesOnly(false);
            }}
            className="mt-4 rounded-lg bg-[#8065F5] px-4 py-2 text-sm font-medium text-white hover:bg-[#7053eb]"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVoices.map((voice) => {
            const isSelected = voice.id === selectedVoiceId;
            const isFav = favoriteVoiceIds.includes(voice.id);
            const isLoadingPreview = previewLoadingId === voice.id;
            const isPlaying = playingVoiceId === voice.id;

            return (
              <article
                key={voice.id}
                className={`flex flex-col justify-between rounded-2xl border p-5 transition-colors ${
                  isSelected
                    ? 'border-[#8065F5] bg-[#8065F5]/5 dark:bg-[#202430]'
                    : 'border-slate-200 dark:border-white/10 bg-white dark:bg-[#191C24] hover:border-slate-300 dark:hover:border-white/20'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                        {voice.name}
                      </h2>
                      {/* Clean unboxed metadata per design constitution */}
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-[#A1A1AA]">
                        <span>{voice.language}</span>
                        <span aria-hidden="true">·</span>
                        <span>{voice.accent}</span>
                        <span aria-hidden="true">·</span>
                        <span>{voice.gender}</span>
                        {voice.isCloned && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-[#8065F5] dark:text-[#A78BFA] font-medium">
                              Cloned Voice
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onToggleFavorite(voice.id)}
                        aria-label={isFav ? `Remove ${voice.name} from favorites` : `Favorite ${voice.name}`}
                        className={`rounded-lg p-2 transition-colors ${
                          isFav
                            ? 'text-[#8065F5] dark:text-[#A78BFA]'
                            : 'text-slate-400 hover:text-slate-700 dark:text-[#A1A1AA] dark:hover:text-white'
                        }`}
                      >
                        <Heart className={`h-4 w-4 ${isFav ? 'fill-current' : ''}`} />
                      </button>

                      {voice.isCloned && onDeleteClonedVoice && (
                        <button
                          type="button"
                          onClick={() => onDeleteClonedVoice(voice.id)}
                          aria-label={`Delete cloned voice ${voice.name}`}
                          className="rounded-lg p-2 text-slate-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-[#A1A1AA]">
                    {voice.description}
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between gap-3 pt-4 border-t border-slate-200/80 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => handlePreview(voice)}
                    disabled={isLoadingPreview}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#111318] px-3 py-2 text-xs font-medium text-slate-700 dark:text-white hover:border-[#8065F5]/60 disabled:opacity-50 transition-colors whitespace-nowrap"
                  >
                    {isLoadingPreview ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-[#8065F5]" />
                    ) : isPlaying ? (
                      <Square className="h-3.5 w-3.5 text-[#8065F5]" />
                    ) : (
                      <Play className="h-3.5 w-3.5 text-[#8065F5]" />
                    )}
                    <span>
                      {isLoadingPreview ? 'Loading…' : isPlaying ? 'Stop' : 'Preview Audio'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectVoice(voice)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                      isSelected
                        ? 'bg-[#8065F5]/15 text-[#8065F5] dark:text-[#A78BFA]'
                        : 'bg-[#8065F5] text-white hover:bg-[#7053eb]'
                    }`}
                  >
                    {isSelected && <Check className="h-3.5 w-3.5" />}
                    <span>{isSelected ? 'Selected' : 'Select Voice'}</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
