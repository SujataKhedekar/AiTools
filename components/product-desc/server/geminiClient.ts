import { GoogleGenAI, type GenerateContentParameters, type GenerateContentResponse } from '@google/genai';
import type { TokenUsageSummary } from '../shared/types';

export const GEMINI_MODEL = 'gemini-3.8-flash';

let cachedClient: GoogleGenAI | null = null;

const usageTracker: TokenUsageSummary = {
  promptTokens: 0,
  outputTokens: 0,
  totalTokens: 0,
  requestsCount: 0,
};

export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error(
      'GEMINI_API_KEY is not configured on the server. Set it in the server environment to enable AI generation.'
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

export function getTokenUsageSummary(): TokenUsageSummary {
  return { ...usageTracker };
}

function recordUsage(response: GenerateContentResponse): void {
  const meta = response.usageMetadata;
  usageTracker.requestsCount += 1;
  if (meta) {
    usageTracker.promptTokens += meta.promptTokenCount ?? 0;
    usageTracker.outputTokens += meta.candidatesTokenCount ?? 0;
    usageTracker.totalTokens += meta.totalTokenCount ?? 0;
  }
}

export async function generateWithRetry(
  params: Omit<GenerateContentParameters, 'model'>,
  maxRetries = 3
): Promise<GenerateContentResponse> {
  const ai = getGeminiClient();
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        ...params,
      });
      recordUsage(response);
      return response;
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      const isTransient =
        msg.includes('429') ||
        msg.includes('503') ||
        msg.includes('RESOURCE_EXHAUSTED') ||
        msg.includes('UNAVAILABLE');

      if (!isTransient || attempt === maxRetries) {
        break;
      }
      const delayMs = 800 * Math.pow(2, attempt) + Math.floor(Math.random() * 400);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Gemini API request failed.');
}

export function formatGeminiError(err: unknown): { status: number; message: string } {
  const raw = err instanceof Error ? err.message : String(err);
  if (raw.includes('GEMINI_API_KEY')) {
    return { status: 503, message: raw };
  }
  if (raw.includes('API_KEY_INVALID') || raw.includes('PERMISSION_DENIED')) {
    return {
      status: 403,
      message: 'Gemini API key is invalid or unauthorized. Please check Settings > Secrets.',
    };
  }
  if (raw.includes('RESOURCE_EXHAUSTED') || raw.includes('429')) {
    return {
      status: 429,
      message: 'Gemini API rate or quota limit reached. Please wait a moment and retry.',
    };
  }
  if (raw.includes('NOT_FOUND') || raw.includes('404')) {
    return {
      status: 404,
      message: `Requested Gemini model (${GEMINI_MODEL}) was not found.`,
    };
  }
  return {
    status: 500,
    message: raw || 'Failed to process request with Gemini API.',
  };
}
