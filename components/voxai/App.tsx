"use client";

import { useEffect, useMemo, useState } from 'react';
import { CURATED_VOICES, SAMPLE_SCRIPTS } from './data/voices';
import {
  clearAudioHistory,
  deleteAudioRecord,
  listAudioRecords,
  loadClonedVoices,
  loadFavoriteVoiceIds,
  loadPronunciations,
  loadSettings,
  renameAudioRecord,
  saveAudioRecord,
  saveClonedVoices,
  saveFavoriteVoiceIds,
  savePronunciations,
  saveSettings,
} from './lib/audioDb';
import type {
  AppSettings,
  GeneratedAudioRecord,
  PronunciationRule,
  ProviderHealth,
  VoiceProfile,
  VoiceSettingsState,
} from './types/vox';
import { Header, type NavTab } from './components/Header';
import { MyAudioView } from './components/MyAudioView';
import { SettingsView } from './components/SettingsView';
import { StudioView, type StudioMode } from './components/StudioView';
import { VoiceLibraryView } from './components/VoiceLibraryView';

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [activeTab, setActiveTab] = useState<NavTab>('studio');
  const [studioMode, setStudioMode] = useState<StudioMode>('single');

  const [clonedVoices, setClonedVoices] = useState<VoiceProfile[]>(() => loadClonedVoices());
  const [favoriteVoiceIds, setFavoriteVoiceIds] = useState<string[]>(() =>
    loadFavoriteVoiceIds()
  );
  const [pronunciations, setPronunciations] = useState<PronunciationRule[]>(() =>
    loadPronunciations()
  );

  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(
    () => settings.defaultVoiceId || CURATED_VOICES[0].id
  );
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettingsState>(() => ({
    language: settings.defaultLanguage,
    speed: settings.defaultSpeed,
    stability: 'Medium',
    similarity: 75,
    style: 'Natural',
    emotion: 'Neutral',
    pitch: 0,
  }));

  const [text, setText] = useState<string>(SAMPLE_SCRIPTS[0].text);
  const [audioHistory, setAudioHistory] = useState<GeneratedAudioRecord[]>([]);
  const [health, setHealth] = useState<ProviderHealth | null>(null);

  const allVoices = useMemo(
    () => [...clonedVoices, ...CURATED_VOICES],
    [clonedVoices]
  );

  // Load API health & IndexedDB audio history on mount
  useEffect(() => {
    fetch('/api/voxai/health')
      .then((res) => res.json())
      .then((data: ProviderHealth) => setHealth(data))
      .catch(() =>
        setHealth({
          ok: false,
          providers: { gemini: false, elevenlabs: false },
          ffmpeg: false,
        })
      );

    listAudioRecords()
      .then((rows) => setAudioHistory(rows))
      .catch(() => setAudioHistory([]));
  }, []);

  const handleUpdateSettings = (next: AppSettings) => {
    setSettings(next);
    saveSettings(next);
  };

  const handleToggleFavorite = (voiceId: string) => {
    setFavoriteVoiceIds((prev) => {
      const next = prev.includes(voiceId)
        ? prev.filter((id) => id !== voiceId)
        : [...prev, voiceId];
      saveFavoriteVoiceIds(next);
      return next;
    });
  };

  const handleAddPronunciation = (word: string, pronunciation: string) => {
    setPronunciations((prev) => {
      const next = [...prev, { id: crypto.randomUUID(), word, pronunciation }];
      savePronunciations(next);
      return next;
    });
  };

  const handleDeletePronunciation = (id: string) => {
    setPronunciations((prev) => {
      const next = prev.filter((r) => r.id !== id);
      savePronunciations(next);
      return next;
    });
  };

  const handleVoiceCloned = (voice: VoiceProfile) => {
    setClonedVoices((prev) => {
      const next = [voice, ...prev];
      saveClonedVoices(next);
      return next;
    });
    setSelectedVoiceId(voice.id);
    setVoiceSettings((prev) => ({ ...prev, language: voice.language }));
  };

  const handleDeleteClonedVoice = (voiceId: string) => {
    setClonedVoices((prev) => {
      const next = prev.filter((v) => v.id !== voiceId);
      saveClonedVoices(next);
      return next;
    });
    if (selectedVoiceId === voiceId) {
      setSelectedVoiceId(CURATED_VOICES[0].id);
    }
  };

  const handleAudioGenerated = async (record: GeneratedAudioRecord) => {
    await saveAudioRecord(record);
    setAudioHistory((prev) => [record, ...prev]);
  };

  const handleRenameRecord = async (id: string, title: string) => {
    await renameAudioRecord(id, title);
    setAudioHistory((prev) =>
      prev.map((r) => (r.id === id ? { ...r, title: title.trim() || r.title } : r))
    );
  };

  const handleDeleteRecord = async (id: string) => {
    await deleteAudioRecord(id);
    setAudioHistory((prev) => prev.filter((r) => r.id !== id));
  };

  const handleClearHistory = async () => {
    await clearAudioHistory();
    setAudioHistory([]);
  };

  const handleClearPronunciations = () => {
    setPronunciations([]);
    savePronunciations([]);
  };

  return (
    <div className={`min-h-screen flex flex-col bg-slate-50 text-slate-900 transition-colors ${settings.theme === 'dark' ? 'dark bg-[#111318] text-white' : ''}`}>
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenVoiceClone={() => {
          setActiveTab('studio');
          setStudioMode('clone');
        }}
      />

      <main className="flex-1">
        {activeTab === 'studio' && (
          <StudioView
            mode={studioMode}
            onChangeMode={setStudioMode}
            voices={allVoices}
            selectedVoiceId={selectedVoiceId}
            onSelectVoiceId={setSelectedVoiceId}
            voiceSettings={voiceSettings}
            onChangeVoiceSettings={setVoiceSettings}
            text={text}
            onChangeText={setText}
            pronunciations={pronunciations}
            onAddPronunciation={handleAddPronunciation}
            onDeletePronunciation={handleDeletePronunciation}
            defaultDownloadFormat={settings.defaultDownloadFormat}
            health={health}
            onOpenLibrary={() => setActiveTab('library')}
            onAudioGenerated={handleAudioGenerated}
            onVoiceCloned={handleVoiceCloned}
          />
        )}

        {activeTab === 'library' && (
          <VoiceLibraryView
            voices={allVoices}
            selectedVoiceId={selectedVoiceId}
            favoriteVoiceIds={favoriteVoiceIds}
            activeLanguage={voiceSettings.language}
            onSelectVoice={(voice) => {
              setSelectedVoiceId(voice.id);
              setVoiceSettings((prev) => ({
                ...prev,
                language: voice.language,
              }));
              setStudioMode('single');
              setActiveTab('studio');
            }}
            onToggleFavorite={handleToggleFavorite}
            onDeleteClonedVoice={handleDeleteClonedVoice}
          />
        )}

        {activeTab === 'history' && (
          <MyAudioView
            records={audioHistory}
            defaultDownloadFormat={settings.defaultDownloadFormat}
            onRename={handleRenameRecord}
            onDelete={handleDeleteRecord}
            onLoadIntoStudio={(record) => {
              setText(record.text);
              setSelectedVoiceId(record.voiceId);
              setVoiceSettings((prev) => ({ ...prev, language: record.language }));
              setStudioMode('single');
              setActiveTab('studio');
            }}
            onGoToStudio={() => setActiveTab('studio')}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            voices={allVoices}
            health={health}
            historyCount={audioHistory.length}
            onUpdateSettings={handleUpdateSettings}
            onClearHistory={handleClearHistory}
            onClearPronunciations={handleClearPronunciations}
          />
        )}
      </main>

      <footer className="border-t border-slate-200 dark:border-white/10 py-5">
        <div className="mx-auto flex max-w-[1360px] flex-wrap items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 text-xs text-slate-500 dark:text-[#A1A1AA]">
          <span>VoxAI · Transform Text Into Realistic Human Voices</span>
          <span>Audio stored locally in your browser · No account required</span>
        </div>
      </footer>
    </div>
  );
}
