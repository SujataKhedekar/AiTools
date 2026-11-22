import { GoogleGenAI, type GenerateContentResponse } from '@google/genai';
import type { TokenUsage } from '../../shared/types';

export const DEFAULT_MULTIMODAL_MODEL = 'gemini-3.8-flash';

let cachedClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new GeminiServiceError(
      'GEMINI_API_KEY is not configured on the server. Add it to the server environment to enable AI generation.',
      503
    );
  }
  if (!cachedClient) {
    cachedClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return cachedClient;
}

export class GeminiServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.name = 'GeminiServiceError';
    this.statusCode = statusCode;
  }
}

export function extractTokenUsage(
  response: GenerateContentResponse,
  model = DEFAULT_MULTIMODAL_MODEL
): TokenUsage {
  const meta = response.usageMetadata;
  const promptTokens = meta?.promptTokenCount ?? 0;
  const candidatesTokens = meta?.candidatesTokenCount ?? 0;
  const totalTokens = meta?.totalTokenCount ?? promptTokens + candidatesTokens;

  return {
    promptTokens,
    candidatesTokens,
    totalTokens,
    model,
  };
}

export function mergeTokenUsage(a: TokenUsage, b: TokenUsage): TokenUsage {
  return {
    promptTokens: a.promptTokens + b.promptTokens,
    candidatesTokens: a.candidatesTokens + b.candidatesTokens,
    totalTokens: a.totalTokens + b.totalTokens,
    model: b.model || a.model,
  };
}

export async function withGeminiRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);

      if (msg.includes('API_KEY_INVALID') || msg.includes('PERMISSION_DENIED') || msg.includes('403')) {
        throw new GeminiServiceError(
          'Gemini API authentication failed. Verify the server-side GEMINI_API_KEY configuration.',
          403
        );
      }
      if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('429')) {
        if (attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, 900 * (attempt + 1)));
          continue;
        }
        throw new GeminiServiceError(
          'Gemini API rate or quota limit reached. Please wait a moment and check the account quota.',
          429
        );
      }
      if (msg.includes('NOT_FOUND') || msg.includes('404')) {
        throw new GeminiServiceError(
          `Requested Gemini model "${DEFAULT_MULTIMODAL_MODEL}" was unavailable. Please verify model configuration.`,
          404
        );
      }
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
        continue;
      }
    }
  }
  const finalMsg = lastError instanceof Error ? lastError.message : 'Gemini request failed.';
  throw new GeminiServiceError(finalMsg, 502);
}

export function safeJsonParse<T>(rawText: string | undefined, fallbackContext: string): T {
  const text = (rawText ?? '').trim();
  if (!text) {
    throw new GeminiServiceError(`Empty JSON response received from Gemini during ${fallbackContext}.`, 502);
  }
  // Strip accidental markdown fences if present
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new GeminiServiceError(`Failed to parse structured JSON during ${fallbackContext}.`, 502);
  }
}
