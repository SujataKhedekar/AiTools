import { GoogleGenAI, Type } from "@google/genai";
import { spawn, spawnSync } from "node:child_process";
import { NextRequest, NextResponse } from "next/server";
import { CURATED_VOICES, SUPPORTED_LANGUAGES } from "@/components/voxai/data/voices";
import type {
  DialogueLine,
  EmotionTone,
  ExpressivenessStyle,
  GeminiVoiceName,
  LanguageOption,
  PronunciationRule,
  VoiceProfile,
} from "@/components/voxai/types/vox";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_GEMINI_VOICES: GeminiVoiceName[] = ["Puck", "Charon", "Kore", "Fenrir", "Zephyr"];
const previewCache = new Map<string, { audioBase64: string; durationSeconds: number; byteLength: number }>();

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured in server environment variables.");
  return new GoogleGenAI({ apiKey, apiVersion: "v1beta", httpOptions: { headers: { "User-Agent": "aivora-voxai" } } });
}

async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  let last: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try { return await fn(); } catch (error) {
      last = error;
      const message = error instanceof Error ? error.message : String(error);
      if (!/503|500|429|UNAVAILABLE|overloaded/i.test(message) || attempt === maxAttempts) throw error;
      await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
    }
  }
  throw last;
}

function resolveVoice(voiceId: string, customVoice?: VoiceProfile): VoiceProfile {
  if (customVoice && customVoice.id === voiceId) {
    return { ...customVoice, geminiVoice: VALID_GEMINI_VOICES.includes(customVoice.geminiVoice) ? customVoice.geminiVoice : "Kore" };
  }
  return CURATED_VOICES.find((voice) => voice.id === voiceId) ?? CURATED_VOICES[0];
}

function applyPronunciations(text: string, rules: PronunciationRule[] = []) {
  let result = text;
  for (const rule of rules) {
    const word = rule.word?.trim();
    const pronunciation = rule.pronunciation?.trim();
    if (!word || !pronunciation) continue;
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = /^[A-Za-z0-9_-]+$/.test(word) ? new RegExp(`\\b${escaped}\\b`, "gi") : new RegExp(escaped, "g");
    result = result.replace(pattern, pronunciation);
  }
  return result;
}

function splitText(text: string, maxChars = 550): string[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (normalized.length <= maxChars) return normalized ? [normalized] : [];
  const chunks: string[] = [];
  let current = "";
  const sentences = normalized.match(/[^.!?。！？\n]+[.!?。！？\n]*\s*/g) ?? [normalized];
  for (const raw of sentences) {
    const sentence = raw.trim();
    if (!sentence) continue;
    if (sentence.length > maxChars) {
      if (current) chunks.push(current), current = "";
      const words = sentence.split(/\s+/);
      let part = "";
      for (const word of words) {
        if (part && part.length + word.length + 1 > maxChars) chunks.push(part), part = "";
        part = part ? `${part} ${word}` : word;
      }
      if (part) chunks.push(part);
    } else if (current && current.length + sentence.length + 1 > maxChars) {
      chunks.push(current); current = sentence;
    } else current = current ? `${current} ${sentence}` : sentence;
  }
  if (current) chunks.push(current);
  return chunks;
}

function styleDirective(voice: VoiceProfile, language: LanguageOption, style: ExpressivenessStyle, emotion: EmotionTone) {
  const languageMeta = SUPPORTED_LANGUAGES.find((item) => item.label === language);
  const styleDescription: Record<ExpressivenessStyle, string> = {
    Natural: "natural, effortless studio delivery", Conversational: "warm, relaxed conversational cadence",
    Expressive: "vivid, dynamic inflection and expressive phrasing", Dramatic: "cinematic, theatrical emphasis and dramatic pauses",
  };
  const emotionDescription = emotion === "Neutral" ? "balanced, natural emotional tone" : `${emotion.toLowerCase()} emotional tone`;
  return `${voice.stylePrompt} Speak fluently in ${language}${languageMeta ? ` (${languageMeta.accent})` : ""}. Deliver with ${styleDescription[style]} and a ${emotionDescription}.`;
}

async function synthesize(text: string, voice: GeminiVoiceName, directive: string, flagship = false): Promise<Buffer> {
  const ai = getGeminiClient();
  const model = flagship ? "gemini-3.8-flash-tts" : "gemini-3.8-flash-lite-tts";
  const response = await withRetry(() => ai.models.generateContent({
    model,
    contents: [{ role: "user", parts: [{ text, speechMetadata: { style: directive } } as never] }],
    config: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } },
  }));
  const encoded = response.candidates?.[0]?.content?.parts?.find((part) => part.inlineData?.data)?.inlineData?.data;
  if (!encoded) throw new Error("The speech model did not return audio data.");
  return Buffer.from(encoded, "base64");
}

async function synthesizeElevenLabs(params: {
  voiceId: string; text: string; stability: string; similarity: number; speed: number;
}) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error("ELEVENLABS_API_KEY is not configured in server environment variables.");
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(params.voiceId)}?output_format=pcm_24000`, {
    method: "POST",
    headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      text: params.text, model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability: params.stability === "Low" ? 0.25 : params.stability === "High" ? 0.85 : 0.5,
        similarity_boost: Math.max(0, Math.min(1, params.similarity / 100)),
        speed: Math.max(0.7, Math.min(1.2, params.speed)),
      },
    }),
  });
  if (!res.ok) throw new Error(`ElevenLabs request failed (${res.status}).`);
  return pcmToWav(Buffer.from(await res.arrayBuffer()));
}

async function applySpeedAndPitch(wav: Buffer, speed: number, pitch: number) {
  const boundedSpeed = Math.max(0.5, Math.min(2, Number.isFinite(speed) ? speed : 1));
  const boundedPitch = Math.max(-6, Math.min(6, Number.isFinite(pitch) ? pitch : 0));
  if (Math.abs(boundedSpeed - 1) < 0.01 && Math.abs(boundedPitch) < 0.05) return wav;
  if (spawnSync("ffmpeg", ["-version"], { stdio: "ignore" }).status !== 0) {
    throw new Error("Speed and pitch processing require FFmpeg on the server. Set speed to 1× and pitch to 0, or install FFmpeg.");
  }
  const filters: string[] = [];
  let tempo = boundedSpeed;
  if (Math.abs(boundedPitch) >= 0.05) {
    const factor = Math.pow(2, boundedPitch / 12);
    filters.push(`asetrate=${Math.round(24000 * factor)}`, "aresample=24000");
    tempo /= factor;
  }
  while (tempo > 2) filters.push("atempo=2.0"), tempo /= 2;
  while (tempo < 0.5) filters.push("atempo=0.5"), tempo /= 0.5;
  filters.push(`atempo=${tempo.toFixed(4)}`);
  return new Promise<Buffer>((resolve, reject) => {
    const child = spawn("ffmpeg", ["-hide_banner", "-loglevel", "error", "-i", "pipe:0", "-af", filters.join(","), "-c:a", "pcm_s16le", "-ar", "24000", "-ac", "1", "-f", "wav", "pipe:1"]);
    const output: Buffer[] = []; const errors: Buffer[] = [];
    child.stdout.on("data", (chunk: Buffer) => output.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => errors.push(chunk));
    child.on("error", reject);
    child.on("close", (code) => code === 0 ? resolve(Buffer.concat(output)) : reject(new Error(Buffer.concat(errors).toString("utf8").slice(0, 200) || "Audio processing failed.")));
    child.stdin.end(wav);
  });
}

function pcmToWav(pcm: Buffer, sampleRate = 24000, channels = 1, bits = 16) {
  const header = Buffer.alloc(44);
  const blockAlign = channels * bits / 8;
  header.write("RIFF", 0); header.writeUInt32LE(36 + pcm.length, 4); header.write("WAVE", 8);
  header.write("fmt ", 12); header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22); header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * blockAlign, 28); header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bits, 34); header.write("data", 36); header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

function combineWav(buffers: Buffer[]) {
  if (!buffers.length) throw new Error("No audio was returned by the speech provider.");
  const pcmChunks = buffers.map((buffer) => buffer.length > 44 && buffer.toString("ascii", 0, 4) === "RIFF" ? buffer.subarray(44) : buffer);
  const silence = Buffer.alloc(Math.floor(24000 * 0.16) * 2);
  const pieces: Buffer[] = [];
  pcmChunks.forEach((chunk, index) => { pieces.push(chunk); if (index < pcmChunks.length - 1) pieces.push(silence); });
  const wav = pcmToWav(Buffer.concat(pieces));
  return { wav, durationSeconds: (wav.length - 44) / (24000 * 2) };
}

function jsonError(error: unknown, fallback: string, status = 500) {
  const message = error instanceof Error ? error.message : fallback;
  return NextResponse.json({ error: message || fallback }, { status });
}

async function health() {
  const ffmpeg = spawnSync("ffmpeg", ["-version"], { stdio: "ignore" }).status === 0;
  const gemini = Boolean(process.env.GEMINI_API_KEY);
  return NextResponse.json({ ok: gemini, providers: { gemini, elevenlabs: Boolean(process.env.ELEVENLABS_API_KEY) }, ffmpeg });
}

async function preview(body: Record<string, unknown>) {
  try {
    const voice = resolveVoice(String(body.voiceId ?? ""), body.customVoice as VoiceProfile | undefined);
    const language = (body.language || "English (US)") as LanguageOption;
    const key = `${voice.id}:${language}:${voice.stylePrompt}`;
    const cached = previewCache.get(key);
    if (cached) return NextResponse.json({ ...cached, mimeType: "audio/wav", cached: true });
    const langMeta = SUPPORTED_LANGUAGES.find((item) => item.label === language);
    const text = voice.language === language || !langMeta ? voice.sampleLine : langMeta.nativeGreeting;
    const audio = voice.elevenLabsVoiceId && process.env.ELEVENLABS_API_KEY
      ? await synthesizeElevenLabs({ voiceId: voice.elevenLabsVoiceId, text, stability: "Medium", similarity: 75, speed: 1 })
      : await synthesize(text, voice.geminiVoice, styleDirective(voice, language, "Natural", "Friendly"), Boolean(voice.isCloned));
    const { wav, durationSeconds } = combineWav([audio]);
    const result = { audioBase64: wav.toString("base64"), durationSeconds, byteLength: wav.length };
    if (previewCache.size >= 60) previewCache.delete(previewCache.keys().next().value!);
    previewCache.set(key, result);
    return NextResponse.json({ ...result, mimeType: "audio/wav", cached: false });
  } catch (error) { return jsonError(error, "Failed to generate voice preview."); }
}

async function generate(body: Record<string, unknown>) {
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) return jsonError(new Error("Please enter some text before generating speech."), "Invalid request.", 400);
  if (text.length > 15000) return jsonError(new Error("Text exceeds the 15,000 character limit."), "Invalid request.", 400);
  try {
    const voice = resolveVoice(String(body.voiceId || "aria-us"), body.customVoice as VoiceProfile | undefined);
    const language = (body.language || "English (US)") as LanguageOption;
    const style = (body.style || "Natural") as ExpressivenessStyle;
    const emotion = (body.emotion || "Neutral") as EmotionTone;
    const rules = Array.isArray(body.pronunciations) ? body.pronunciations as PronunciationRule[] : [];
    const processed = applyPronunciations(text, rules);
    const chunks = splitText(processed);
    const directive = styleDirective(voice, language, style, emotion);
    const flagship = Boolean(voice.isCloned) || style === "Expressive" || style === "Dramatic" || /<(laugh|gasp|breath)>|\|\w+\|/i.test(processed);
    const audio: Buffer[] = [];
    const speed = Number(body.speed ?? 1);
    const useElevenLabs = Boolean(voice.elevenLabsVoiceId && process.env.ELEVENLABS_API_KEY);
    const needsDsp = Math.abs(speed - 1) >= 0.01 || Math.abs(Number(body.pitch ?? 0)) >= 0.05;
    if (!useElevenLabs && needsDsp && spawnSync("ffmpeg", ["-version"], { stdio: "ignore" }).status !== 0) {
      return jsonError(new Error("Speed and pitch processing require FFmpeg on the server. Set speed to 1× and pitch to 0, or install FFmpeg."), "Audio processing unavailable.", 501);
    }
    if (useElevenLabs) {
      for (const chunk of chunks) audio.push(await synthesizeElevenLabs({
        voiceId: voice.elevenLabsVoiceId!, text: chunk,
        stability: String(body.stability || "Medium"), similarity: Number(body.similarity ?? 75), speed,
      }));
    } else {
      for (const chunk of chunks) audio.push(await synthesize(chunk, voice.geminiVoice, directive, flagship));
    }
    let { wav, durationSeconds } = combineWav(audio);
    if (!voice.elevenLabsVoiceId || !process.env.ELEVENLABS_API_KEY) {
      wav = Buffer.from(await applySpeedAndPitch(wav, speed, Number(body.pitch ?? 0)));
      durationSeconds = Math.max(0, (wav.length - 44) / 48000);
    }
    return NextResponse.json({ audioBase64: wav.toString("base64"), mimeType: "audio/wav", durationSeconds, byteLength: wav.length, chunksProcessed: chunks.length, provider: "gemini" });
  } catch (error) { return jsonError(error, "Speech generation failed."); }
}

async function multiSpeaker(body: Record<string, unknown>) {
  const lines = Array.isArray(body.lines) ? (body.lines as DialogueLine[]).filter((line) => line && typeof line.text === "string" && line.text.trim()) : [];
  if (!lines.length) return jsonError(new Error("Add at least one dialogue line."), "Invalid request.", 400);
  try {
    const speed = Number(body.speed ?? 1);
    if (Math.abs(speed - 1) >= 0.01 && spawnSync("ffmpeg", ["-version"], { stdio: "ignore" }).status !== 0) {
      return jsonError(new Error("Speed adjustment requires FFmpeg on the server."), "Audio processing unavailable.", 501);
    }
    const lang = (body.language || "English (US)") as LanguageOption;
    const v1 = resolveVoice(String(body.speaker1VoiceId || "liam-us"), body.speaker1Custom as VoiceProfile | undefined);
    const v2 = resolveVoice(String(body.speaker2VoiceId || "aria-us"), body.speaker2Custom as VoiceProfile | undefined);
    const speaker1 = String(body.speaker1Name || "Alex").trim() || "Alex";
    const speaker2 = String(body.speaker2Name || "Sam").trim() || "Sam";
    const ai = getGeminiClient();
    const parts = lines.slice(0, 24).map((line) => {
      const first = line.speaker === "Speaker 1";
      const speaker = first ? speaker1 : speaker2;
      const voice = first ? v1 : v2;
      return { text: `${speaker}: ${line.text.trim().slice(0, 1200)}`, speechMetadata: { speaker, style: `${voice.stylePrompt} Speak in ${lang} naturally in conversation.` } };
    });
    const result = await withRetry(() => ai.models.generateContent({
      model: "gemini-3.8-flash-tts",
      contents: [{ role: "user", parts: parts as never }],
      config: { responseModalities: ["AUDIO"], speechConfig: { multiSpeakerVoiceConfig: { speakerVoiceConfigs: [
        { speaker: speaker1, voiceConfig: { prebuiltVoiceConfig: { voiceName: v1.geminiVoice } } },
        { speaker: speaker2, voiceConfig: { prebuiltVoiceConfig: { voiceName: v2.geminiVoice } } },
      ] } } },
    }));
    const encoded = result.candidates?.[0]?.content?.parts?.find((part) => part.inlineData?.data)?.inlineData?.data;
    if (!encoded) throw new Error("The multi-speaker model did not return audio data.");
    let { wav, durationSeconds } = combineWav([Buffer.from(encoded, "base64")]);
    if (Math.abs(speed - 1) >= 0.01) {
      wav = Buffer.from(await applySpeedAndPitch(wav, speed, 0));
      durationSeconds = Math.max(0, (wav.length - 44) / 48000);
    }
    return NextResponse.json({ audioBase64: wav.toString("base64"), mimeType: "audio/wav", durationSeconds, byteLength: wav.length, chunksProcessed: 1, provider: "gemini" });
  } catch (error) { return jsonError(error, "Multi-speaker generation failed."); }
}

async function enhance(body: Record<string, unknown>) {
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text || text.length > 15000) return jsonError(new Error(text ? "Text is too long to enhance in one pass." : "Enter text to enhance."), "Invalid request.", 400);
  try {
    const result = await withRetry(() => getGeminiClient().models.generateContent({
      model: "gemini-3.8-flash",
      contents: text,
      config: { systemInstruction: "You are a speech script copyeditor. Fix punctuation, run-on sentences, and paragraph spacing for spoken delivery. Preserve the original language, facts, names, and meaning. Return only the refined text." },
    }));
    const enhancedText = result.text?.trim();
    if (!enhancedText) throw new Error("Could not enhance text.");
    return NextResponse.json({ enhancedText });
  } catch (error) { return jsonError(error, "Failed to enhance text."); }
}

async function cloneVoice(body: Record<string, unknown>) {
  const consent = body.consent === true;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const audioBase64 = typeof body.audioBase64 === "string" ? body.audioBase64 : "";
  const mimeType = typeof body.mimeType === "string" ? body.mimeType : "audio/webm";
  const language = (body.language || "English (US)") as LanguageOption;
  if (!consent) return jsonError(new Error("Explicit voice-owner consent is required."), "Invalid request.", 400);
  if (!name || name.length > 40) return jsonError(new Error("Provide a voice name from 1 to 40 characters."), "Invalid request.", 400);
  if (audioBase64.length < 100 || audioBase64.length > 20_000_000) return jsonError(new Error("Upload a voice sample smaller than 15 MB."), "Invalid request.", 400);
  try {
    let elevenLabsVoiceId: string | undefined;
    if (process.env.ELEVENLABS_API_KEY) {
      const audio = Buffer.from(audioBase64, "base64");
      const form = new FormData();
      form.append("name", name);
      form.append("description", "User-consented custom voice profile created in VoxAI");
      form.append("files", new Blob([audio], { type: mimeType }), "voice-sample");
      const cloneResponse = await fetch("https://api.elevenlabs.io/v1/voices/add", {
        method: "POST", headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY }, body: form,
      });
      if (!cloneResponse.ok) throw new Error(`ElevenLabs voice creation failed (${cloneResponse.status}).`);
      const cloned = await cloneResponse.json() as { voice_id?: string };
      elevenLabsVoiceId = cloned.voice_id;
    }
    const ai = getGeminiClient();
    const analysis = await withRetry(() => ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: { parts: [
        { inlineData: { mimeType: mimeType.split(";")[0] || "audio/webm", data: audioBase64 } },
        { text: "Analyze this consented voice sample. Describe audible timbre, pitch, cadence, warmth, and accent without inferring sensitive traits. Select the closest base voice from Puck (bright male), Charon (deep male), Fenrir (resonant male), Kore (warm female), Zephyr (smooth female). Return the voice design JSON." },
      ] },
      config: { responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: {
        accent: { type: Type.STRING }, description: { type: Type.STRING }, stylePrompt: { type: Type.STRING },
        bestGeminiVoice: { type: Type.STRING }, transcript: { type: Type.STRING },
      }, required: ["description", "stylePrompt", "bestGeminiVoice"] } },
    }));
    const parsed = JSON.parse(analysis.text || "{}") as Record<string, string>;
    const baseVoice = VALID_GEMINI_VOICES.includes(parsed.bestGeminiVoice as GeminiVoiceName) ? parsed.bestGeminiVoice as GeminiVoiceName : "Kore";
    const voice: VoiceProfile = {
      id: `cloned-${crypto.randomUUID().slice(0, 8)}`, name,
      description: parsed.description || "Custom voice persona modeled from your consented audio recording.",
      language, supportedLanguages: SUPPORTED_LANGUAGES.map((item) => item.label),
      accent: parsed.accent || "Custom Studio Profile", gender: baseVoice === "Puck" || baseVoice === "Charon" || baseVoice === "Fenrir" ? "Male" : "Female",
      ageGroup: "Young", categories: ["Conversational Voices"], geminiVoice: baseVoice,
      stylePrompt: parsed.stylePrompt || `Speak with the natural voice characteristics of ${name}.`,
      sampleLine: parsed.transcript?.length ? parsed.transcript : `Hello, this is ${name}.`, isCloned: true,
      elevenLabsVoiceId,
    };
    return NextResponse.json({ voice, transcript: parsed.transcript || "", provider: "gemini-voice-design" });
  } catch (error) { return jsonError(error, "Voice profile creation failed."); }
}

async function convertAudio(body: Record<string, unknown>) {
  const audioBase64 = typeof body.audioBase64 === "string" ? body.audioBase64 : "";
  const format = body.format === "mp3" || body.format === "wav" ? body.format : null;
  if (!audioBase64 || !format) return jsonError(new Error("Valid audio data and target format are required."), "Invalid request.", 400);
  const input = Buffer.from(audioBase64, "base64");
  if (input.length < 44) return jsonError(new Error("Invalid audio payload."), "Invalid request.", 400);
  const hasTrim = Number.isFinite(Number(body.startTime)) && Number.isFinite(Number(body.endTime)) && Number(body.startTime) >= 0 && Number(body.endTime) > Number(body.startTime) + 0.05;
  if (format === "wav" && !hasTrim) return new NextResponse(new Uint8Array(input), { headers: { "Content-Type": "audio/wav", "X-Audio-Bytes": String(input.length) } });
  if (spawnSync("ffmpeg", ["-version"], { stdio: "ignore" }).status !== 0) {
    return jsonError(new Error("MP3 export and trimmed audio require FFmpeg on the server. WAV downloads are available without it."), "Audio conversion is unavailable.", 501);
  }
  try {
    const out = await new Promise<Buffer>((resolve, reject) => {
      const child = spawn("ffmpeg", ["-hide_banner", "-loglevel", "error", "-i", "pipe:0", ...(hasTrim ? ["-ss", String(body.startTime), "-to", String(body.endTime)] : []), "-vn", ...(format === "mp3" ? ["-c:a", "libmp3lame", "-b:a", "192k"] : ["-c:a", "pcm_s16le", "-ar", "24000", "-ac", "1"]), "-f", format, "pipe:1"]);
      const chunks: Buffer[] = []; const errors: Buffer[] = [];
      child.stdout.on("data", (chunk: Buffer) => chunks.push(chunk)); child.stderr.on("data", (chunk: Buffer) => errors.push(chunk));
      child.on("error", reject); child.on("close", (code) => code === 0 ? resolve(Buffer.concat(chunks)) : reject(new Error(Buffer.concat(errors).toString("utf8").slice(0, 250) || "FFmpeg conversion failed.")));
      child.stdin.end(input);
    });
    const contentType = format === "mp3" ? "audio/mpeg" : "audio/wav";
    return new NextResponse(new Uint8Array(out), { headers: { "Content-Type": contentType, "X-Audio-Bytes": String(out.length) } });
  } catch (error) { return jsonError(error, "Audio conversion failed."); }
}

async function dispatch(request: NextRequest, context: { params: { path: string[] } }) {
  const path = context.params.path.join("/");
  if (request.method === "GET" && path === "health") return health();
  if (request.method !== "POST") return NextResponse.json({ error: "Method not allowed." }, { status: 405 });
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 22_000_000) return NextResponse.json({ error: "Request body is too large. Voice samples must be smaller than 15 MB." }, { status: 413 });
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; }
  catch { return NextResponse.json({ error: "Invalid JSON request." }, { status: 400 }); }
  if (path === "tts/preview") return preview(body);
  if (path === "tts/generate") return generate(body);
  if (path === "tts/multi-speaker") return multiSpeaker(body);
  if (path === "tts/enhance") return enhance(body);
  if (path === "voices/clone") return cloneVoice(body);
  if (path === "tts/convert") return convertAudio(body);
  return NextResponse.json({ error: "VoxAI endpoint not found." }, { status: 404 });
}

export const GET = dispatch;
export const POST = dispatch;
