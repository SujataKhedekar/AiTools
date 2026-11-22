import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import type { TokenUsageStats } from '../types/aivora';

const MODEL_NAME = 'gemini-3.8-flash';

let cachedClient: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'MY_GEMINI_API_KEY') {
    const err = new Error(
      'GEMINI_API_KEY is not configured on the server. Set it in the server environment to use AI generation.'
    );
    (err as Error & { statusCode?: number }).statusCode = 500;
    throw err;
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

const tokenStats: TokenUsageStats = {
  totalRequests: 0,
  promptTokens: 0,
  candidateTokens: 0,
  totalTokens: 0,
  cacheHits: 0,
  lastModel: MODEL_NAME,
};

export function recordCacheHit(): void {
  tokenStats.cacheHits += 1;
}

export function getTokenUsageStats(): TokenUsageStats {
  return { ...tokenStats };
}

function isRetryableError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const msg = String((error as { message?: string }).message ?? '').toLowerCase();
  const status = (error as { status?: number; statusCode?: number }).status ??
    (error as { statusCode?: number }).statusCode;
  return (
    status === 429 ||
    status === 503 ||
    msg.includes('503') ||
    msg.includes('unavailable') ||
    msg.includes('timeout')
  );
}

export interface StructuredPromptOptions {
  systemInstruction: string;
  userPrompt: string;
  responseSchema: Record<string, unknown>;
  thinkingLevel?: ThinkingLevel;
  seed?: number;
}

export async function generateStructuredJson<T>(
  options: StructuredPromptOptions
): Promise<T> {
  const ai = getClient();
  const maxAttempts = 3;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: options.userPrompt,
        config: {
          systemInstruction: options.systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: options.responseSchema,
          ...(options.thinkingLevel
            ? { thinkingConfig: { thinkingLevel: options.thinkingLevel } }
            : {}),
          ...(typeof options.seed === 'number' ? { seed: options.seed } : {}),
        },
      });

      const usage = response.usageMetadata;
      tokenStats.totalRequests += 1;
      tokenStats.promptTokens += usage?.promptTokenCount ?? 0;
      tokenStats.candidateTokens += usage?.candidatesTokenCount ?? 0;
      tokenStats.totalTokens += usage?.totalTokenCount ?? 0;
      tokenStats.lastModel = MODEL_NAME;

      const rawText = (response.text ?? '').trim();
      if (!rawText) {
        throw new Error('Gemini returned an empty response payload.');
      }

      return JSON.parse(rawText) as T;
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts && isRetryableError(err)) {
        const delayMs = 600 * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
      throw err;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Gemini generation failed.');
}
