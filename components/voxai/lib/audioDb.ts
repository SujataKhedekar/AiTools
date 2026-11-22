import type {
  AppSettings,
  GeneratedAudioRecord,
  PronunciationRule,
  VoiceProfile,
} from '../types/vox';

const DB_NAME = 'voxai_audio_db';
const DB_VERSION = 1;
const STORE_NAME = 'audio_history';

const SETTINGS_KEY = 'voxai_settings_v1';
const PRONUNCIATIONS_KEY = 'voxai_pronunciations_v1';
const FAVORITES_KEY = 'voxai_favorites_v1';
const CLONED_VOICES_KEY = 'voxai_cloned_voices_v1';

export const DEFAULT_SETTINGS: AppSettings = {
  defaultLanguage: 'English (US)',
  defaultVoiceId: 'aria-us',
  defaultSpeed: 1.0,
  defaultDownloadFormat: 'wav',
  theme: 'dark',
};

function openAudioDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'));
  });
}

export async function saveAudioRecord(record: GeneratedAudioRecord): Promise<void> {
  const db = await openAudioDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('Failed to save audio'));
    });
  } finally {
    db.close();
  }
}

export async function listAudioRecords(): Promise<GeneratedAudioRecord[]> {
  const db = await openAudioDb();
  try {
    return await new Promise<GeneratedAudioRecord[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).getAll();
      req.onsuccess = () => {
        const rows = (req.result as GeneratedAudioRecord[]) || [];
        rows.sort((a, b) => b.createdAt - a.createdAt);
        resolve(rows);
      };
      req.onerror = () => reject(req.error ?? new Error('Failed to read audio history'));
    });
  } finally {
    db.close();
  }
}

export async function renameAudioRecord(id: string, title: string): Promise<void> {
  const db = await openAudioDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const existing = getReq.result as GeneratedAudioRecord | undefined;
        if (existing) {
          store.put({ ...existing, title: title.trim() || existing.title });
        }
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('Failed to rename audio'));
    });
  } finally {
    db.close();
  }
}

export async function deleteAudioRecord(id: string): Promise<void> {
  const db = await openAudioDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('Failed to delete audio'));
    });
  } finally {
    db.close();
  }
}

export async function clearAudioHistory(): Promise<void> {
  const db = await openAudioDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('Failed to clear history'));
    });
  } finally {
    db.close();
  }
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadPronunciations(): PronunciationRule[] {
  try {
    const raw = localStorage.getItem(PRONUNCIATIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function savePronunciations(rules: PronunciationRule[]): void {
  localStorage.setItem(PRONUNCIATIONS_KEY, JSON.stringify(rules));
}

export function loadFavoriteVoiceIds(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveFavoriteVoiceIds(ids: string[]): void {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
}

export function loadClonedVoices(): VoiceProfile[] {
  try {
    const raw = localStorage.getItem(CLONED_VOICES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveClonedVoices(voices: VoiceProfile[]): void {
  localStorage.setItem(CLONED_VOICES_KEY, JSON.stringify(voices));
}
