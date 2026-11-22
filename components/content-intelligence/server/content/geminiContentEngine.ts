import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import type {
  ContentAnalysisResponse,
  ContextualRewriteProfile,
  CrawledPageExtract,
  DetectionAssessment,
  ObjectiveTextMetrics,
  PhraseSuggestion,
  QualityReport,
  RestructuringItem,
  RewriteRequest,
  RewriteResponse,
  SentenceAnalysisItem,
  SentenceSeverity,
} from '../../types/contentIntelligence';
import {
  analyzeObjectiveMetrics,
  extractIndexedSentences,
  type IndexedSentence,
  OVERUSED_EXPRESSIONS,
} from './textMetrics';
import { contentUsageMonitor } from './usageMonitor';

const MODEL_NAME = 'gemini-3.8-flash';

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not configured on the server. Add it to the server environment to enable AI content analysis and rewriting.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function callGeminiWithRetry<T>(
  fn: (ai: GoogleGenAI) => Promise<{ result: T; promptTokens: number; outputTokens: number; totalTokens: number }>,
  maxRetries = 2
): Promise<{ result: T; promptTokens: number; outputTokens: number; totalTokens: number }> {
  const ai = getGeminiClient();
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const output = await fn(ai);
      contentUsageMonitor.recordGeminiUsage(
        output.promptTokens,
        output.outputTokens,
        output.totalTokens
      );
      return output;
    } catch (error) {
      lastError = error;
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('API_KEY_INVALID') || msg.includes('PERMISSION_DENIED') || msg.includes('403') || msg.includes('400')) {
        throw error;
      }
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 600 * Math.pow(2, attempt)));
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Gemini API request failed.');
}

function severityToLabel(severity: SentenceSeverity): SentenceAnalysisItem['severityLabel'] {
  if (severity === 'red') return 'Needs substantial editing';
  if (severity === 'orange') return 'Could be improved';
  if (severity === 'yellow') return 'Minor writing improvement';
  return 'Clear and natural writing';
}

function normalizeSeverity(raw: string): SentenceSeverity {
  const lower = (raw || '').toLowerCase().trim();
  if (lower === 'red' || lower === 'orange' || lower === 'yellow' || lower === 'green') {
    return lower;
  }
  return 'yellow';
}

function chunkArray<T>(items: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
}

async function analyzeSentenceChunk(
  chunk: IndexedSentence[],
  priorContext: string,
  profile: ContextualRewriteProfile
): Promise<{
  items: Array<{
    index: number;
    severity: SentenceSeverity;
    patternIdentified: string;
    whyGenericOrUnnatural: string;
    repetitiveOrVaguePhrases: string[];
    suggestedImprovements: string[];
    alternativeWordings: string[];
    improvedSentence: string;
    confidence: 'Low' | 'Moderate' | 'High';
    falsePositiveNote: string;
  }>;
  promptTokens: number;
  outputTokens: number;
  totalTokens: number;
}> {
  const numberedSentences = chunk
    .map((s) => `[${s.index}] (Para ${s.paragraphIndex + 1}): ${s.text}`)
    .join('\n');

  const prompt = `Analyze each numbered sentence below for editorial quality and potentially AI-like writing patterns.
Document context:
- Document type: ${profile.documentType}
- Target audience: ${profile.targetAudience}
- Industry: ${profile.industry}
- Brand voice: ${profile.brandVoice}
- Preferred reading level: ${profile.preferredReadingLevel}
- Primary keyword: ${profile.primaryKeyword || 'None specified'}

${priorContext ? `Preceding context summary: ${priorContext}\n` : ''}
Sentences to evaluate:
${numberedSentences}

Rules:
1. Do NOT assume every polished or formal sentence is AI-generated. Mark genuinely clear, concrete, well-paced sentences as "green".
2. Use "red" only for sentences with heavy clichés, robotic boilerplate, hollow filler, or tangled syntax. Use "orange" for generic/predictable phrasing or weak specificity. Use "yellow" for minor cadence, clarity, or word-choice refinements.
3. Preserve verified facts, numbers, and keywords in "improvedSentence". Do NOT invent fake statistics or personal anecdotes.
4. Provide a concise falsePositiveNote explaining when the pattern could simply reflect standard domain style (e.g., legal, academic, or technical conventions).
5. Return an entry for EVERY sentence index provided.`;

  const { result, promptTokens, outputTokens, totalTokens } = await callGeminiWithRetry(async (ai) => {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        systemInstruction:
          'You are a computational linguist and senior editorial strategist. Evaluate writing patterns probabilistically without claiming authorship certainty.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sentences: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  index: { type: Type.INTEGER },
                  severity: { type: Type.STRING, description: 'red | orange | yellow | green' },
                  patternIdentified: { type: Type.STRING },
                  whyGenericOrUnnatural: { type: Type.STRING },
                  repetitiveOrVaguePhrases: { type: Type.ARRAY, items: { type: Type.STRING } },
                  suggestedImprovements: { type: Type.ARRAY, items: { type: Type.STRING } },
                  alternativeWordings: { type: Type.ARRAY, items: { type: Type.STRING } },
                  improvedSentence: { type: Type.STRING },
                  confidence: { type: Type.STRING, description: 'Low | Moderate | High' },
                  falsePositiveNote: { type: Type.STRING },
                },
                required: [
                  'index',
                  'severity',
                  'patternIdentified',
                  'whyGenericOrUnnatural',
                  'repetitiveOrVaguePhrases',
                  'suggestedImprovements',
                  'alternativeWordings',
                  'improvedSentence',
                  'confidence',
                  'falsePositiveNote',
                ],
              },
            },
          },
          required: ['sentences'],
        },
      },
    });

    const parsed = JSON.parse((response.text ?? '{"sentences":[]}').trim()) as {
      sentences: Array<{
        index: number;
        severity: string;
        patternIdentified: string;
        whyGenericOrUnnatural: string;
        repetitiveOrVaguePhrases: string[];
        suggestedImprovements: string[];
        alternativeWordings: string[];
        improvedSentence: string;
        confidence: string;
        falsePositiveNote: string;
      }>;
    };

    const meta = response.usageMetadata;
    return {
      result: (parsed.sentences || []).map((item) => ({
        index: item.index,
        severity: normalizeSeverity(item.severity),
        patternIdentified: item.patternIdentified || 'Standard declarative sentence',
        whyGenericOrUnnatural: item.whyGenericOrUnnatural || 'No major unnatural phrasing observed.',
        repetitiveOrVaguePhrases: item.repetitiveOrVaguePhrases || [],
        suggestedImprovements: item.suggestedImprovements || [],
        alternativeWordings: item.alternativeWordings || [],
        improvedSentence: item.improvedSentence || '',
        confidence: (['Low', 'Moderate', 'High'].includes(item.confidence)
          ? item.confidence
          : 'Moderate') as 'Low' | 'Moderate' | 'High',
        falsePositiveNote:
          item.falsePositiveNote ||
          'Formal or structured phrasing can naturally occur in human-edited professional writing.',
      })),
      promptTokens: meta?.promptTokenCount ?? 0,
      outputTokens: meta?.candidatesTokenCount ?? 0,
      totalTokens: meta?.totalTokenCount ?? 0,
    };
  });

  return { items: result, promptTokens, outputTokens, totalTokens };
}

async function analyzeDocumentHolistics(
  text: string,
  metrics: ObjectiveTextMetrics,
  profile: ContextualRewriteProfile,
  sentences: IndexedSentence[]
): Promise<{
  detectionAssessment: DetectionAssessment;
  phraseSuggestions: PhraseSuggestion[];
  qualityReport: QualityReport;
  restructuringRecommendations: RestructuringItem[];
  recommendedOutline: string[];
  promptTokens: number;
  outputTokens: number;
  totalTokens: number;
}> {
  const sampleText = text.length > 14000 ? `${text.slice(0, 9000)}\n\n[...middle omitted for summary...]\n\n${text.slice(-4500)}` : text;

  const detectedClicheHints = metrics.clicheMatches.map((c) => ({
    phrase: c.phrase,
    count: c.count,
    sentenceIndices: c.sentenceIndices,
  }));

  const sentenceReference = sentences
    .slice(0, 60)
    .map((s) => `[${s.index}] ${s.text}`)
    .join('\n');

  const prompt = `Perform a holistic editorial, writing-pattern, phrase-context, content-quality, SEO, and structural analysis of this text.

CRITICAL SCIENTIFIC INTEGRITY RULES:
- Never claim to determine authorship (human vs AI) with certainty.
- Do not fabricate a scientific percentage score of AI authorship. Instead evaluate "patternPrevalence" (Low | Moderate | Elevated | High) and "confidence" (Low | Moderate | High) based on observable linguistic patterns.
- Clearly list falsePositiveRiskFactors (e.g., non-native English clarity, standard corporate/academic templates, edited human prose).
- Contextually evaluate overused phrases before suggesting replacements. Only include phraseSuggestions where replacing the phrase genuinely improves clarity or specificity in that exact sentence.

Objective Metrics Already Measured Programmatically:
- Word count: ${metrics.wordCount}, Sentences: ${metrics.sentenceCount}, Paragraphs: ${metrics.paragraphCount}
- Avg sentence length: ${metrics.avgSentenceLength} words (StdDev: ${metrics.sentenceLengthStdDev})
- Flesch Reading Ease: ${metrics.fleschReadingEase} (${metrics.readabilityBand}), FK Grade: ${metrics.fleschKincaidGrade}
- Type-Token Ratio (vocabulary diversity): ${metrics.typeTokenRatio}
- Repeated n-grams: ${metrics.repeatedNgrams.map((n) => `${n.phrase} (${n.count}x)`).join(', ') || 'None'}
- Lexicon matches found: ${JSON.stringify(detectedClicheHints)}
- Keyword stats: ${JSON.stringify(metrics.keywordStats)}

Context Profile:
- Audience: ${profile.targetAudience}
- Industry: ${profile.industry}
- Business type: ${profile.businessType}
- Brand voice: ${profile.brandVoice}
- Objective: ${profile.contentObjective}
- Primary keyword: ${profile.primaryKeyword || 'None'}
- Secondary keywords: ${profile.secondaryKeywords.join(', ') || 'None'}
- Document type: ${profile.documentType}
- Preferred reading level: ${profile.preferredReadingLevel}

Indexed Sentences (for phraseSuggestions sentenceIndex and updatedSentencePreview):
${sentenceReference}

Full/Sample Document:
${sampleText}`;

  const { result, promptTokens, outputTokens, totalTokens } = await callGeminiWithRetry(async (ai) => {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
        systemInstruction:
          'You are a world-class editorial director, computational linguist, and SEO strategist. Provide honest, probabilistic, context-aware critique.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detectionAssessment: {
              type: Type.OBJECT,
              properties: {
                patternPrevalence: { type: Type.STRING, description: 'Low | Moderate | Elevated | High' },
                confidence: { type: Type.STRING, description: 'Low | Moderate | High' },
                methodologySummary: { type: Type.STRING },
                limitationsDisclaimer: { type: Type.STRING },
                falsePositiveRiskFactors: { type: Type.ARRAY, items: { type: Type.STRING } },
                uniformityNote: { type: Type.STRING },
                patternFindings: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      dimension: { type: Type.STRING },
                      signalLevel: { type: Type.STRING, description: 'Low | Moderate | Elevated | High' },
                      confidence: { type: Type.STRING, description: 'Low | Moderate | High' },
                      evidenceSummary: { type: Type.STRING },
                      affectedLocations: { type: Type.ARRAY, items: { type: Type.STRING } },
                      limitationNote: { type: Type.STRING },
                    },
                    required: ['dimension', 'signalLevel', 'confidence', 'evidenceSummary', 'affectedLocations', 'limitationNote'],
                  },
                },
              },
              required: [
                'patternPrevalence',
                'confidence',
                'methodologySummary',
                'limitationsDisclaimer',
                'falsePositiveRiskFactors',
                'uniformityNote',
                'patternFindings',
              ],
            },
            phraseSuggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  sentenceIndex: { type: Type.INTEGER },
                  originalPhrase: { type: Type.STRING },
                  category: { type: Type.STRING },
                  whyImprove: { type: Type.STRING },
                  suggestedAlternatives: { type: Type.ARRAY, items: { type: Type.STRING } },
                  recommendedReplacement: { type: Type.STRING },
                  contextSnippet: { type: Type.STRING },
                  updatedSentencePreview: { type: Type.STRING },
                },
                required: [
                  'sentenceIndex',
                  'originalPhrase',
                  'category',
                  'whyImprove',
                  'suggestedAlternatives',
                  'recommendedReplacement',
                  'contextSnippet',
                  'updatedSentencePreview',
                ],
              },
            },
            qualityReport: {
              type: Type.OBJECT,
              properties: {
                readabilityAssessment: {
                  type: Type.OBJECT,
                  properties: {
                    objectiveSummary: { type: Type.STRING },
                    editorialJudgment: { type: Type.STRING },
                    targetAlignment: { type: Type.STRING },
                  },
                  required: ['objectiveSummary', 'editorialJudgment', 'targetAlignment'],
                },
                writingQuality: {
                  type: Type.OBJECT,
                  properties: {
                    grammarAndMechanicsNotes: { type: Type.ARRAY, items: { type: Type.STRING } },
                    sentenceClarityRating: { type: Type.STRING, description: 'Strong | Moderate | Needs Work' },
                    vocabularyDiversityAssessment: { type: Type.STRING },
                    repetitionAssessment: { type: Type.STRING },
                    transitionQualityAssessment: { type: Type.STRING },
                  },
                  required: [
                    'grammarAndMechanicsNotes',
                    'sentenceClarityRating',
                    'vocabularyDiversityAssessment',
                    'repetitionAssessment',
                    'transitionQualityAssessment',
                  ],
                },
                contentQuality: {
                  type: Type.OBJECT,
                  properties: {
                    informationDepthAssessment: { type: Type.STRING },
                    specificityAssessment: { type: Type.STRING },
                    contextualRelevanceAssessment: { type: Type.STRING },
                    supportingExamplesAssessment: { type: Type.STRING },
                    factualClarityAssessment: { type: Type.STRING },
                    completenessAssessment: { type: Type.STRING },
                  },
                  required: [
                    'informationDepthAssessment',
                    'specificityAssessment',
                    'contextualRelevanceAssessment',
                    'supportingExamplesAssessment',
                    'factualClarityAssessment',
                    'completenessAssessment',
                  ],
                },
                seoQuality: {
                  type: Type.OBJECT,
                  properties: {
                    keywordUsageAssessment: { type: Type.STRING },
                    keywordPlacementAssessment: { type: Type.STRING },
                    headingStructureAssessment: { type: Type.STRING },
                    searchIntentAlignment: { type: Type.STRING },
                    topicCoverageAssessment: { type: Type.STRING },
                    keywordStuffingRisk: { type: Type.STRING, description: 'None | Low | Moderate | High' },
                    recommendedMetaTitle: { type: Type.STRING },
                    recommendedMetaDescription: { type: Type.STRING },
                  },
                  required: [
                    'keywordUsageAssessment',
                    'keywordPlacementAssessment',
                    'headingStructureAssessment',
                    'searchIntentAlignment',
                    'topicCoverageAssessment',
                    'keywordStuffingRisk',
                    'recommendedMetaTitle',
                    'recommendedMetaDescription',
                  ],
                },
              },
              required: ['readabilityAssessment', 'writingQuality', 'contentQuality', 'seoQuality'],
            },
            restructuringRecommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  issueType: { type: Type.STRING },
                  locationLabel: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  recommendedFix: { type: Type.STRING },
                  paragraphIndex: { type: Type.INTEGER },
                },
                required: ['issueType', 'locationLabel', 'explanation', 'recommendedFix'],
              },
            },
            recommendedOutline: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: [
            'detectionAssessment',
            'phraseSuggestions',
            'qualityReport',
            'restructuringRecommendations',
            'recommendedOutline',
          ],
        },
      },
    });

    const parsed = JSON.parse((response.text ?? '{}').trim());
    const meta = response.usageMetadata;
    return {
      result: parsed,
      promptTokens: meta?.promptTokenCount ?? 0,
      outputTokens: meta?.candidatesTokenCount ?? 0,
      totalTokens: meta?.totalTokenCount ?? 0,
    };
  });

  // Merge deterministic phrase detections if Gemini omitted any exact lexicon hit with valid context
  const phraseSuggestions: PhraseSuggestion[] = (result.phraseSuggestions || []).map(
    (p: Omit<PhraseSuggestion, 'id' | 'status'>, idx: number) => ({
      ...p,
      id: `phr-${idx}-${p.sentenceIndex}`,
      status: 'pending' as const,
    })
  );

  for (const hit of metrics.clicheMatches) {
    const alreadyCovered = phraseSuggestions.some(
      (ps) => ps.originalPhrase.toLowerCase() === hit.phrase.toLowerCase()
    );
    if (!alreadyCovered && hit.sentenceIndices.length > 0) {
      const sIdx = hit.sentenceIndices[0];
      const sentObj = sentences.find((s) => s.index === sIdx);
      const lexiconDef = OVERUSED_EXPRESSIONS.find((o) => o.phrase === hit.phrase);
      if (sentObj && lexiconDef) {
        const replacement = lexiconDef.alternatives[0] || '';
        const regex = new RegExp(`\\b${hit.phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        const preview = replacement.startsWith('(')
          ? sentObj.text.replace(regex, '').replace(/\s{2,}/g, ' ').trim()
          : sentObj.text.replace(regex, replacement);

        phraseSuggestions.push({
          id: `phr-lex-${sIdx}-${hit.phrase.replace(/\s+/g, '-')}`,
          sentenceIndex: sIdx,
          originalPhrase: sentObj.text.match(regex)?.[0] ?? hit.phrase,
          category: lexiconDef.category,
          whyImprove: lexiconDef.whyDefault,
          suggestedAlternatives: lexiconDef.alternatives,
          recommendedReplacement: replacement,
          contextSnippet: sentObj.text,
          updatedSentencePreview: preview,
          status: 'pending',
        });
      }
    }
  }

  const restructuringRecommendations: RestructuringItem[] = (
    result.restructuringRecommendations || []
  ).map((item: Omit<RestructuringItem, 'id'>, idx: number) => ({
    ...item,
    id: `restruct-${idx}`,
  }));

  const detectionAssessment: DetectionAssessment = {
    patternPrevalence: result.detectionAssessment?.patternPrevalence || 'Moderate',
    confidence: result.detectionAssessment?.confidence || 'Moderate',
    methodologySummary:
      result.detectionAssessment?.methodologySummary ||
      'Combines programmatic surface metrics (sentence-length variance, vocabulary diversity, n-gram repetition, cliché density) with contextual Gemini linguistic pattern evaluation.',
    limitationsDisclaimer:
      result.detectionAssessment?.limitationsDisclaimer ||
      'Writing-pattern analysis is probabilistic and cannot prove human or AI authorship. Carefully edited AI drafts can appear natural, while structured human prose can trigger pattern signals.',
    falsePositiveRiskFactors: result.detectionAssessment?.falsePositiveRiskFactors || [
      'Standardized corporate or academic formatting naturally reduces sentence length variance.',
      'Domain terminology repetition can raise n-gram overlap scores.',
    ],
    uniformityNote: result.detectionAssessment?.uniformityNote || '',
    patternFindings: (result.detectionAssessment?.patternFindings || []).map(
      (f: Omit<DetectionAssessment['patternFindings'][number], 'id'>, i: number) => ({
        ...f,
        id: `pat-${i}`,
      })
    ),
  };

  return {
    detectionAssessment,
    phraseSuggestions,
    qualityReport: result.qualityReport,
    restructuringRecommendations,
    recommendedOutline: result.recommendedOutline || [],
    promptTokens,
    outputTokens,
    totalTokens,
  };
}

export async function runFullContentAnalysis(
  text: string,
  profile: ContextualRewriteProfile
): Promise<ContentAnalysisResponse> {
  const { sentences, sections } = extractIndexedSentences(text);
  const objectiveMetrics = analyzeObjectiveMetrics(
    text,
    profile.primaryKeyword,
    profile.secondaryKeywords
  );

  if (sentences.length === 0) {
    throw new Error('Please provide at least one complete sentence to analyze.');
  }

  // Chunk sentences for large-document scalability while preserving prior context
  const chunks = chunkArray(sentences, 22);
  let totalPromptTokens = 0;
  let totalOutputTokens = 0;
  let totalTokens = 0;

  const analyzedMap = new Map<
    number,
    Omit<SentenceAnalysisItem, 'id' | 'paragraphIndex' | 'originalSentence' | 'wordCount' | 'severityLabel'>
  >();

  // Run holistic analysis concurrently with first sentence chunk
  const holisticPromise = analyzeDocumentHolistics(text, objectiveMetrics, profile, sentences);

  for (let cIdx = 0; cIdx < chunks.length; cIdx++) {
    const chunk = chunks[cIdx];
    const priorContext =
      cIdx > 0
        ? chunks[cIdx - 1]
            .slice(-2)
            .map((s) => s.text)
            .join(' ')
        : '';

    const chunkRes = await analyzeSentenceChunk(chunk, priorContext, profile);
    totalPromptTokens += chunkRes.promptTokens;
    totalOutputTokens += chunkRes.outputTokens;
    totalTokens += chunkRes.totalTokens;

    for (const item of chunkRes.items) {
      analyzedMap.set(item.index, item);
    }
  }

  const holistic = await holisticPromise;
  totalPromptTokens += holistic.promptTokens;
  totalOutputTokens += holistic.outputTokens;
  totalTokens += holistic.totalTokens;

  const sentenceResults: SentenceAnalysisItem[] = sentences.map((s) => {
    const analyzed = analyzedMap.get(s.index);
    const severity: SentenceSeverity = analyzed?.severity ?? 'green';
    return {
      id: `sent-${s.index}`,
      index: s.index,
      paragraphIndex: s.paragraphIndex,
      originalSentence: s.text,
      severity,
      severityLabel: severityToLabel(severity),
      patternIdentified: analyzed?.patternIdentified ?? 'Direct statement',
      whyGenericOrUnnatural:
        analyzed?.whyGenericOrUnnatural ?? 'Reads naturally within the surrounding paragraph.',
      repetitiveOrVaguePhrases: analyzed?.repetitiveOrVaguePhrases ?? [],
      suggestedImprovements: analyzed?.suggestedImprovements ?? [],
      alternativeWordings: analyzed?.alternativeWordings ?? [],
      improvedSentence: analyzed?.improvedSentence || s.text,
      confidence: analyzed?.confidence ?? 'Moderate',
      falsePositiveNote:
        analyzed?.falsePositiveNote ??
        'Clear professional phrasing should not be over-edited.',
      wordCount: s.wordCount,
    };
  });

  return {
    analysisId: `anl_${Date.now().toString(36)}`,
    analyzedAt: new Date().toISOString(),
    chunkCount: chunks.length,
    modelUsed: MODEL_NAME,
    tokenUsage: {
      promptTokens: totalPromptTokens,
      outputTokens: totalOutputTokens,
      totalTokens,
    },
    objectiveMetrics,
    detectionAssessment: holistic.detectionAssessment,
    sentences: sentenceResults,
    phraseSuggestions: holistic.phraseSuggestions,
    qualityReport: holistic.qualityReport,
    restructuringRecommendations: holistic.restructuringRecommendations,
    recommendedOutline: holistic.recommendedOutline,
    sections,
    cached: false,
  };
}

export async function runIntelligentRewrite(req: RewriteRequest): Promise<RewriteResponse> {
  const originalMetrics = analyzeObjectiveMetrics(
    req.targetText,
    req.profile.primaryKeyword,
    req.profile.secondaryKeywords
  );

  // For very large complete articles (> 1400 words), split into paragraph groups with context carryover
  const paragraphs = req.targetText.split(/\n{2,}/).filter((p) => p.trim().length > 0);
  const isLargeArticle = req.scope === 'article' && originalMetrics.wordCount > 1400 && paragraphs.length > 4;

  let promptTokens = 0;
  let outputTokens = 0;
  let totalTokens = 0;
  let finalRewrittenText = '';
  let rationaleAll: string[] = [];
  let preservedEntitiesAll: string[] = [];

  if (isLargeArticle) {
    const groups = chunkArray(paragraphs, Math.ceil(paragraphs.length / 2));
    const rewrittenChunks: string[] = [];
    let priorSummary = '';

    for (const group of groups) {
      const chunkText = group.join('\n\n');
      const chunkRes = await executeSingleRewriteCall({
        ...req,
        targetText: chunkText,
        priorSummary,
      });
      promptTokens += chunkRes.promptTokens;
      outputTokens += chunkRes.outputTokens;
      totalTokens += chunkRes.totalTokens;
      rewrittenChunks.push(chunkRes.result.rewrittenText.trim());
      rationaleAll.push(...chunkRes.result.changeRationale);
      preservedEntitiesAll.push(...chunkRes.result.preservedFactsAndEntities);
      priorSummary = chunkRes.result.rewrittenText.slice(-450);
    }

    finalRewrittenText = rewrittenChunks.join('\n\n');
  } else {
    const single = await executeSingleRewriteCall(req);
    promptTokens = single.promptTokens;
    outputTokens = single.outputTokens;
    totalTokens = single.totalTokens;
    finalRewrittenText = single.result.rewrittenText.trim();
    rationaleAll = single.result.changeRationale;
    preservedEntitiesAll = single.result.preservedFactsAndEntities;
  }

  const rewrittenMetrics = analyzeObjectiveMetrics(
    finalRewrittenText,
    req.profile.primaryKeyword,
    req.profile.secondaryKeywords
  );

  const requestedKeywords = [
    ...(req.profile.primaryKeyword ? [req.profile.primaryKeyword] : []),
    ...req.profile.secondaryKeywords,
  ].filter(Boolean);

  const preservedKeywords = requestedKeywords.filter((kw) =>
    new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(finalRewrittenText)
  );
  const missingKeywords = requestedKeywords.filter((kw) => !preservedKeywords.includes(kw));

  return {
    rewrittenText: finalRewrittenText,
    scope: req.scope,
    style: req.style,
    changeRationale: Array.from(new Set(rationaleAll)).slice(0, 8),
    preservedKeywords,
    missingKeywords,
    preservedFactsAndEntities: Array.from(new Set(preservedEntitiesAll)).slice(0, 12),
    originalMetrics,
    rewrittenMetrics,
    tokenUsage: {
      promptTokens,
      outputTokens,
      totalTokens,
    },
  };
}

async function executeSingleRewriteCall(
  req: RewriteRequest & { priorSummary?: string }
): Promise<{
  result: {
    rewrittenText: string;
    changeRationale: string[];
    preservedFactsAndEntities: string[];
  };
  promptTokens: number;
  outputTokens: number;
  totalTokens: number;
}> {
  const keywordsList = [
    req.profile.primaryKeyword ? `Primary: "${req.profile.primaryKeyword}"` : null,
    req.profile.secondaryKeywords.length
      ? `Secondary: ${req.profile.secondaryKeywords.map((k) => `"${k}"`).join(', ')}`
      : null,
  ]
    .filter(Boolean)
    .join(' | ');

  const prompt = `Rewrite the target text below in the "${req.style}" writing style while maintaining full factual, semantic, and SEO integrity.

Scope: ${req.scope}
Target Audience: ${req.profile.targetAudience}
Industry: ${req.profile.industry}
Business Type: ${req.profile.businessType}
Brand Voice: ${req.profile.brandVoice}
Content Objective: ${req.profile.contentObjective}
Desired Tone: ${req.profile.desiredTone}
Preferred Reading Level: ${req.profile.preferredReadingLevel}
Document Type: ${req.profile.documentType}
${keywordsList ? `SEO Keywords to Preserve Naturally (${req.preserveKeywords ? 'MANDATORY' : 'OPTIONAL'}): ${keywordsList}` : ''}
${req.preserveEntities ? 'Preserve all factual numbers, product specs, URLs, brand names, and entities accurately.' : ''}
${req.customInstruction ? `Additional Editorial Direction: ${req.customInstruction}` : ''}
${req.priorSummary ? `Preceding Rewritten Context (for continuity): ${req.priorSummary}` : ''}

STRICT QUALITY & INTEGRITY RULES:
1. Preserve the original meaning and every verified fact.
2. NEVER introduce intentional grammar mistakes, typos, fake personal anecdotes, or invented statistics.
3. Eliminate generic AI clichés ("In today's fast-paced world", "delve into", "unlock the potential", "game-changing solutions", etc.) and hollow filler words.
4. Vary sentence rhythm naturally (mix concise punchy sentences with well-structured longer ones) and improve transitions.
5. Keep existing markdown headings (#, ##, ###) and URLs intact unless improving heading clarity while preserving keywords.
6. Return ONLY the rewritten text in the "rewrittenText" field matching the scope (${req.scope}).

Target Text to Rewrite:
"""
${req.targetText}
"""`;

  return callGeminiWithRetry(async (ai) => {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
        systemInstruction:
          'You are a master human editor and subject-matter writer. Produce crisp, natural, context-authentic prose without synthetic filler or fabricated claims.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            rewrittenText: { type: Type.STRING },
            changeRationale: { type: Type.ARRAY, items: { type: Type.STRING } },
            preservedFactsAndEntities: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['rewrittenText', 'changeRationale', 'preservedFactsAndEntities'],
        },
      },
    });

    const parsed = JSON.parse((response.text ?? '{}').trim());
    const meta = response.usageMetadata;
    return {
      result: {
        rewrittenText: parsed.rewrittenText || req.targetText,
        changeRationale: parsed.changeRationale || [],
        preservedFactsAndEntities: parsed.preservedFactsAndEntities || [],
      },
      promptTokens: meta?.promptTokenCount ?? 0,
      outputTokens: meta?.candidatesTokenCount ?? 0,
      totalTokens: meta?.totalTokenCount ?? 0,
    };
  });
}

export async function synthesizeWebsiteEditorialSummary(
  rootUrl: string,
  pages: CrawledPageExtract[]
): Promise<{
  siteEditorialSummary: string;
  pageRecommendations: Array<{ url: string; recommendation: string }>;
  promptTokens: number;
  outputTokens: number;
  totalTokens: number;
}> {
  const pageSummaries = pages
    .map(
      (p) =>
        `URL: ${p.url}\nTitle: ${p.title}\nMeta: ${p.metaDescription || 'Missing'}\nWords: ${p.wordCount}\nHeadings: ${p.headings.slice(0, 6).map((h) => `H${h.level}:${h.text}`).join(' | ')}\nOpening: ${p.paragraphs[0]?.slice(0, 260) || 'None'}\nAutomated flags: ${p.issues.join(' ') || 'None'}`
    )
    .join('\n---\n');

  const prompt = `Review these crawled website pages from ${rootUrl} and provide an editorial content audit summary plus one specific improvement recommendation per URL. Focus on generic descriptions, weak service positioning, repetitive intros, or lack of concrete proof.

${pageSummaries}`;

  const { result, promptTokens, outputTokens, totalTokens } = await callGeminiWithRetry(async (ai) => {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        systemInstruction:
          'You are a website content strategist auditing extracted main-page copy for clarity, differentiation, and specificity.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            siteEditorialSummary: { type: Type.STRING },
            pageRecommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  url: { type: Type.STRING },
                  recommendation: { type: Type.STRING },
                },
                required: ['url', 'recommendation'],
              },
            },
          },
          required: ['siteEditorialSummary', 'pageRecommendations'],
        },
      },
    });

    const parsed = JSON.parse((response.text ?? '{}').trim());
    const meta = response.usageMetadata;
    return {
      result: {
        siteEditorialSummary: parsed.siteEditorialSummary || '',
        pageRecommendations: parsed.pageRecommendations || [],
      },
      promptTokens: meta?.promptTokenCount ?? 0,
      outputTokens: meta?.candidatesTokenCount ?? 0,
      totalTokens: meta?.totalTokenCount ?? 0,
    };
  });

  return {
    ...result,
    promptTokens,
    outputTokens,
    totalTokens,
  };
}
