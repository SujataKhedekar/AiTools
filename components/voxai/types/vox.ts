export type LanguageOption =
  | 'English (US)'
  | 'English (UK)'
  | 'English (India)'
  | 'Hindi'
  | 'Spanish'
  | 'French'
  | 'German'
  | 'Portuguese'
  | 'Italian'
  | 'Japanese'
  | 'Korean'
  | 'Arabic'
  | 'Chinese';

export type VoiceCategory =
  | 'Male Voices'
  | 'Female Voices'
  | 'Young Voices'
  | 'Mature Voices'
  | 'Professional Voices'
  | 'Narrator Voices'
  | 'Storytelling Voices'
  | 'Conversational Voices'
  | 'Deep Voices'
  | 'Energetic Voices'
  | 'Calm Voices';

export type GeminiVoiceName = 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';

export type SpeechSpeed = 0.5 | 0.75 | 1.0 | 1.25 | 1.5 | 2.0;
export type VoiceStability = 'Low' | 'Medium' | 'High';
export type ExpressivenessStyle = 'Natural' | 'Conversational' | 'Expressive' | 'Dramatic';
export type EmotionTone =
  | 'Neutral'
  | 'Happy'
  | 'Sad'
  | 'Excited'
  | 'Serious'
  | 'Calm'
  | 'Friendly';

export type AudioFormat = 'mp3' | 'wav';

export interface VoiceProfile {
  id: string;
  name: string;
  description: string;
  language: LanguageOption;
  supportedLanguages: LanguageOption[];
  accent: string;
  gender: 'Male' | 'Female';
  ageGroup: 'Young' | 'Mature';
  categories: VoiceCategory[];
  geminiVoice: GeminiVoiceName;
  stylePrompt: string;
  sampleLine: string;
  isCloned?: boolean;
  elevenLabsVoiceId?: string;
  recommendedPitchOffset?: number;
}

export interface PronunciationRule {
  id: string;
  word: string;
  pronunciation: string;
}

export interface DialogueLine {
  id: string;
  speaker: 'Speaker 1' | 'Speaker 2';
  text: string;
}

export interface VoiceSettingsState {
  language: LanguageOption;
  speed: SpeechSpeed;
  stability: VoiceStability;
  similarity: number;
  style: ExpressivenessStyle;
  emotion: EmotionTone;
  pitch: number;
}

export interface GeneratedAudioRecord {
  id: string;
  title: string;
  text: string;
  voiceId: string;
  voiceName: string;
  language: LanguageOption;
  createdAt: number;
  durationSeconds: number;
  byteLength: number;
  format: 'wav';
  mode: 'single' | 'multi-speaker';
  blob: Blob;
}

export interface ProviderHealth {
  ok: boolean;
  providers: {
    gemini: boolean;
    elevenlabs: boolean;
  };
  ffmpeg: boolean;
}

export interface AppSettings {
  defaultLanguage: LanguageOption;
  defaultVoiceId: string;
  defaultSpeed: SpeechSpeed;
  defaultDownloadFormat: AudioFormat;
  theme: 'dark' | 'light';
}
