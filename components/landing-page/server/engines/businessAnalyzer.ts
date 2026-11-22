import { ThinkingLevel, Type } from '@google/genai';
import type { BusinessUrlAnalysis } from '../../types/aivora';
import { generateStructuredJson } from '../geminiClient';
import {
  fetchPublicWebsiteSnapshot,
  getCachedValue,
  makeCacheKey,
  setCachedValue,
} from '../security';
import { recordCacheHit } from '../geminiClient';

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    extractedSummary: { type: Type.STRING },
    inferredCategory: { type: Type.STRING },
    inferredOfferings: { type: Type.STRING },
    inferredAudience: { type: Type.STRING },
    inferredTone: { type: Type.STRING },
    inferredUsp: { type: Type.STRING },
    missingCriticalDetails: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
  required: [
    'extractedSummary',
    'inferredCategory',
    'inferredOfferings',
    'inferredAudience',
    'inferredTone',
    'inferredUsp',
    'missingCriticalDetails',
  ],
};

export async function analyzeBusinessWebsite(url: string): Promise<BusinessUrlAnalysis> {
  const cacheKey = makeCacheKey('analyze-url', { url });
  const cached = getCachedValue<BusinessUrlAnalysis>(cacheKey);
  if (cached) {
    recordCacheHit();
    return cached;
  }

  const snapshot = await fetchPublicWebsiteSnapshot(url);

  if (!snapshot.bodyExcerpt && !snapshot.title && !snapshot.description) {
    return {
      url: snapshot.url,
      fetchedTitle: snapshot.title,
      fetchedDescription: snapshot.description,
      fetchedHeadings: snapshot.headings,
      extractedSummary: snapshot.fetchWarning || 'No HTML content could be retrieved from this URL.',
      inferredCategory: '',
      inferredOfferings: '',
      inferredAudience: '',
      inferredTone: '',
      inferredUsp: '',
      missingCriticalDetails: [
        'Business name and primary category',
        'Product or service description',
        'Target audience and geographic market',
        'Unique selling proposition (USP)',
        'Primary conversion objective and target keyword',
      ],
    };
  }

  const systemInstruction = `You are a factual business analyst. Extract only what is directly evidenced in the fetched website content.
CRITICAL RULES:
1. NEVER invent, extrapolate, or fabricate pricing, client counts, testimonials, awards, locations, or features not present in the provided text.
2. If information about target audience, USP, location, or specific offerings is unclear or absent in the page text, leave that field concise/empty or explicitly list it inside missingCriticalDetails.
3. Keep prose factual, plain, and concise.`;

  const userPrompt = `Analyze this fetched website snapshot for ${snapshot.url}:
Title: ${snapshot.title || '(none)'}
Meta Description: ${snapshot.description || '(none)'}
Headings: ${snapshot.headings.join(' | ') || '(none)'}
Page Excerpt:
${snapshot.bodyExcerpt}`;

  const parsed = await generateStructuredJson<
    Omit<BusinessUrlAnalysis, 'url' | 'fetchedTitle' | 'fetchedDescription' | 'fetchedHeadings'>
  >({
    systemInstruction,
    userPrompt,
    responseSchema: analysisSchema,
    thinkingLevel: ThinkingLevel.LOW,
  });

  const result: BusinessUrlAnalysis = {
    url: snapshot.url,
    fetchedTitle: snapshot.title,
    fetchedDescription: snapshot.description,
    fetchedHeadings: snapshot.headings,
    ...parsed,
  };

  setCachedValue(cacheKey, result);
  return result;
}
