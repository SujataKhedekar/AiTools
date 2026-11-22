import type {
  DocumentSection,
  KeywordOccurrenceStats,
  ObjectiveTextMetrics,
  RepeatedNgram,
} from '../../types/contentIntelligence';

const STOPWORDS = new Set([
  'the', 'and', 'for', 'that', 'with', 'this', 'from', 'are', 'was', 'were',
  'have', 'has', 'had', 'not', 'but', 'what', 'all', 'when', 'your', 'can',
  'said', 'there', 'use', 'each', 'which', 'she', 'how', 'their', 'will',
  'other', 'about', 'out', 'many', 'then', 'them', 'these', 'some', 'her',
  'would', 'make', 'like', 'into', 'time', 'look', 'two', 'more', 'write',
  'see', 'way', 'could', 'people', 'than', 'first', 'been', 'call', 'who',
  'its', 'now', 'find', 'long', 'down', 'day', 'did', 'get', 'come', 'made',
  'may', 'part', 'over', 'such', 'our', 'you', 'they', 'his', 'one', 'also',
  'into', 'most', 'very', 'just', 'where', 'only', 'well', 'because', 'while',
]);

export const OVERUSED_EXPRESSIONS: Array<{
  phrase: string;
  category:
    | 'Overused AI Expression'
    | 'Filler Phrase'
    | 'Vague Buzzword'
    | 'Repeated Transition'
    | 'Generic Opener';
  whyDefault: string;
  alternatives: string[];
}> = [
  {
    phrase: "in today's fast-paced world",
    category: 'Generic Opener',
    whyDefault: 'Generic time-filler opener that delays the real subject and signals templated writing.',
    alternatives: ['Currently', 'In recent quarters', 'As deadlines tighten'],
  },
  {
    phrase: "in today's digital landscape",
    category: 'Generic Opener',
    whyDefault: 'Vague framing cliché that adds no industry-specific context.',
    alternatives: ['Across modern software teams', 'Online', 'In current digital channels'],
  },
  {
    phrase: 'it is important to note that',
    category: 'Filler Phrase',
    whyDefault: 'Wordy throat-clearing that weakens the main clause following it.',
    alternatives: ['Notably,', 'Keep in mind that', '(Omit and state the fact directly)'],
  },
  {
    phrase: 'it is worth noting that',
    category: 'Filler Phrase',
    whyDefault: 'Indirect hedge that adds wordiness without adding meaning.',
    alternatives: ['Notably,', '(Start directly with the observation)'],
  },
  {
    phrase: 'furthermore',
    category: 'Repeated Transition',
    whyDefault: 'Overused formal transition when chained across consecutive paragraphs.',
    alternatives: ['Beyond that,', 'In addition,', 'Next,'],
  },
  {
    phrase: 'moreover',
    category: 'Repeated Transition',
    whyDefault: 'Formal additive transition that often feels stiff in conversational or editorial prose.',
    alternatives: ['Even more,', 'Alongside that,', 'On top of that,'],
  },
  {
    phrase: 'additionally',
    category: 'Repeated Transition',
    whyDefault: 'Predictable paragraph opener when repeated multiple times in a piece.',
    alternatives: ['Another factor is', 'Also,', 'Second,'],
  },
  {
    phrase: 'ultimately',
    category: 'Repeated Transition',
    whyDefault: 'Formulaic conclusion signpost that telegraphs a generic wrap-up.',
    alternatives: ['In practice,', 'At the end of the quarter,', 'The practical takeaway is'],
  },
  {
    phrase: 'delve into',
    category: 'Overused AI Expression',
    whyDefault: 'Heavily over-indexed cliché in generated prose; concrete verbs read more naturally.',
    alternatives: ['examine', 'break down', 'inspect', 'look closely at'],
  },
  {
    phrase: 'unlock the potential',
    category: 'Overused AI Expression',
    whyDefault: 'Abstract marketing trope without a measurable outcome.',
    alternatives: ['get more value from', 'speed up', 'put to practical use'],
  },
  {
    phrase: 'seamless integration',
    category: 'Vague Buzzword',
    whyDefault: 'Overpromised buzzword; readers prefer knowing what connects and how.',
    alternatives: ['direct two-way sync', 'native connection', 'automatic handoff'],
  },
  {
    phrase: 'game-changing solution',
    category: 'Vague Buzzword',
    whyDefault: 'Hyperbolic claim lacking proof or specific mechanism.',
    alternatives: ['practical workflow improvement', 'high-impact tool', 'faster method'],
  },
  {
    phrase: 'game-changing solutions',
    category: 'Vague Buzzword',
    whyDefault: 'Hyperbolic claim lacking proof or specific mechanism.',
    alternatives: ['practical workflow tools', 'reliable systems', 'targeted improvements'],
  },
  {
    phrase: 'comprehensive approach',
    category: 'Vague Buzzword',
    whyDefault: 'Vague placeholder phrase that hides the actual steps involved.',
    alternatives: ['step-by-step system', 'end-to-end process', 'coordinated workflow'],
  },
  {
    phrase: 'leverage innovative solutions',
    category: 'Vague Buzzword',
    whyDefault: 'Stacks three vague corporate buzzwords together.',
    alternatives: ['adopt newer tools', 'use specialized software', 'apply proven automation'],
  },
  {
    phrase: 'leveraging innovative solutions',
    category: 'Vague Buzzword',
    whyDefault: 'Stacks vague corporate buzzwords together instead of naming the tool or action.',
    alternatives: ['using targeted automation', 'adopting specialized tools', 'putting newer systems to work'],
  },
  {
    phrase: 'operational excellence',
    category: 'Vague Buzzword',
    whyDefault: 'Abstract corporate goal without concrete metrics.',
    alternatives: ['fewer manual errors', 'faster cycle times', 'consistent execution'],
  },
  {
    phrase: 'sustainable long-term growth',
    category: 'Vague Buzzword',
    whyDefault: 'Predictable closing cliché in B2B drafts.',
    alternatives: ['steady margin expansion', 'durable revenue gains', 'predictable scaling'],
  },
  {
    phrase: 'stay competitive',
    category: 'Overused AI Expression',
    whyDefault: 'Generic motivational framing common in filler introductions.',
    alternatives: ['protect margins', 'keep pace with peers', 'win more bids'],
  },
  {
    phrase: 'elevate your',
    category: 'Overused AI Expression',
    whyDefault: 'Generic promotional verb.',
    alternatives: ['sharpen your', 'upgrade your', 'simplify your'],
  },
  {
    phrase: 'robust',
    category: 'Vague Buzzword',
    whyDefault: 'Often used as a generic intensifier when specific capabilities would be stronger.',
    alternatives: ['reliable', 'audit-ready', 'fault-tolerant'],
  },
  {
    phrase: 'tapestry',
    category: 'Overused AI Expression',
    whyDefault: 'Ornate metaphor frequently overused in synthetic prose.',
    alternatives: ['mix', 'network', 'combination'],
  },
];

export const FILLER_PHRASES = [
  'in order to',
  'due to the fact that',
  'at the end of the day',
  'needless to say',
  'it goes without saying',
  'for all intents and purposes',
  'in the grand scheme of things',
  'very unique',
  'really important',
  'a wide range of',
  'on a daily basis',
  'has the ability to',
];

export const TRANSITION_WORDS = [
  'furthermore',
  'moreover',
  'additionally',
  'consequently',
  'therefore',
  'however',
  'nevertheless',
  'nonetheless',
  'ultimately',
  'meanwhile',
  'conversely',
  'subsequently',
];

export function countSyllables(word: string): number {
  const cleaned = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!cleaned) return 0;
  if (cleaned.length <= 3) return 1;

  const trimmed = cleaned
    .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '')
    .replace(/^y/, '');
  const vowelGroups = trimmed.match(/[aeiouy]{1,2}/g);
  return Math.max(1, vowelGroups ? vowelGroups.length : 1);
}

export function extractHeadingsAndBody(text: string): {
  headings: Array<{ level: number; text: string }>;
  paragraphs: string[];
  sections: DocumentSection[];
} {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const headings: Array<{ level: number; text: string }> = [];
  const paragraphs: string[] = [];
  const sections: DocumentSection[] = [];

  let currentSection: DocumentSection = {
    id: 'sec-0',
    heading: 'Introduction',
    headingLevel: 0,
    paragraphs: [],
    paragraphIndices: [],
    wordCount: 0,
  };

  let buffer: string[] = [];

  const flushBuffer = () => {
    if (buffer.length === 0) return;
    const para = buffer.join(' ').replace(/\s+/g, ' ').trim();
    buffer = [];
    if (!para) return;
    const idx = paragraphs.length;
    paragraphs.push(para);
    currentSection.paragraphs.push(para);
    currentSection.paragraphIndices.push(idx);
    currentSection.wordCount += tokenizeWords(para).length;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const mdHeading = line.match(/^(#{1,6})\s+(.+)$/);
    if (mdHeading) {
      flushBuffer();
      if (currentSection.paragraphs.length > 0 || currentSection.headingLevel > 0) {
        sections.push(currentSection);
      }
      const level = mdHeading[1].length;
      const headingText = mdHeading[2].trim();
      headings.push({ level, text: headingText });
      currentSection = {
        id: `sec-${sections.length + 1}`,
        heading: headingText,
        headingLevel: level,
        paragraphs: [],
        paragraphIndices: [],
        wordCount: 0,
      };
      continue;
    }

    if (!line) {
      flushBuffer();
    } else {
      buffer.push(line.replace(/^[-*•]\s+/, ''));
    }
  }
  flushBuffer();

  if (currentSection.paragraphs.length > 0 || sections.length === 0) {
    sections.push(currentSection);
  }

  return { headings, paragraphs, sections };
}

export function splitSentences(text: string): string[] {
  // Strip markdown heading hashes for sentence splitting while keeping heading text if inline,
  // or split cleanly per paragraph.
  const cleaned = text.replace(/\r\n/g, '\n').trim();
  if (!cleaned) return [];

  // Protect common abbreviations and decimal numbers
  const protectedText = cleaned
    .replace(/\b(e\.g|i\.e|etc|vs|Dr|Mr|Mrs|Ms|Prof|Inc|Ltd|U\.S|Fig)\./gi, '$1<DOT>')
    .replace(/(\d)\.(\d)/g, '$1<DOT>$2');

  const rawSentences = protectedText
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"'(\[])|(?:\n{1,})/)
    .map((s) => s.replace(/<DOT>/g, '.').replace(/^#{1,6}\s+/, '').replace(/^[-*•]\s+/, '').trim())
    .filter((s) => s.length > 0);

  return rawSentences;
}

export interface IndexedSentence {
  index: number;
  paragraphIndex: number;
  text: string;
  wordCount: number;
}

export function extractIndexedSentences(text: string): {
  sentences: IndexedSentence[];
  headings: Array<{ level: number; text: string }>;
  paragraphs: string[];
  sections: DocumentSection[];
} {
  const { headings, paragraphs, sections } = extractHeadingsAndBody(text);
  const sentences: IndexedSentence[] = [];

  paragraphs.forEach((para, pIdx) => {
    const paraSentences = splitSentences(para);
    for (const s of paraSentences) {
      const words = tokenizeWords(s);
      if (words.length === 0) continue;
      sentences.push({
        index: sentences.length,
        paragraphIndex: pIdx,
        text: s,
        wordCount: words.length,
      });
    }
  });

  // Fallback if text was only headings or unpunctuated single block
  if (sentences.length === 0 && text.trim()) {
    const fallback = splitSentences(text);
    fallback.forEach((s, i) => {
      sentences.push({
        index: i,
        paragraphIndex: 0,
        text: s,
        wordCount: tokenizeWords(s).length,
      });
    });
  }

  return { sentences, headings, paragraphs, sections };
}

export function tokenizeWords(text: string): string[] {
  const matches = text.toLowerCase().match(/[a-z0-9]+(?:['’-][a-z0-9]+)*/g);
  return matches ?? [];
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function analyzeObjectiveMetrics(
  text: string,
  primaryKeyword = '',
  secondaryKeywords: string[] = [],
  explicitHeadings?: Array<{ level: number; text: string }>
): ObjectiveTextMetrics {
  const normalized = text.replace(/\r\n/g, '\n');
  const { sentences, headings: mdHeadings, paragraphs } = extractIndexedSentences(normalized);
  const headings = explicitHeadings && explicitHeadings.length > 0 ? explicitHeadings : mdHeadings;

  const words = tokenizeWords(normalized.replace(/^#{1,6}\s+/gm, ''));
  const wordCount = words.length;
  const characterCount = normalized.length;
  const characterCountNoSpaces = normalized.replace(/\s/g, '').length;
  const sentenceCount = Math.max(1, sentences.length);
  const paragraphCount = Math.max(1, paragraphs.length);
  const estimatedReadingTimeMinutes = Math.max(0.1, Math.round((wordCount / 225) * 10) / 10);

  const sentenceLengths = sentences.map((s) => s.wordCount).filter((n) => n > 0);
  const avgSentenceLength =
    sentenceLengths.length > 0
      ? Math.round((sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length) * 10) / 10
      : 0;

  const variance =
    sentenceLengths.length > 1
      ? sentenceLengths.reduce((sum, len) => sum + Math.pow(len - avgSentenceLength, 2), 0) /
        sentenceLengths.length
      : 0;
  const sentenceLengthStdDev = Math.round(Math.sqrt(variance) * 10) / 10;
  const minSentenceLength = sentenceLengths.length > 0 ? Math.min(...sentenceLengths) : 0;
  const maxSentenceLength = sentenceLengths.length > 0 ? Math.max(...sentenceLengths) : 0;

  const paragraphWordCounts = paragraphs.map((p) => tokenizeWords(p).length);
  const avgParagraphLengthWords =
    paragraphWordCounts.length > 0
      ? Math.round((paragraphWordCounts.reduce((a, b) => a + b, 0) / paragraphWordCounts.length) * 10) / 10
      : 0;

  let totalSyllables = 0;
  const difficultSet = new Set<string>();
  let difficultWordOccurrences = 0;

  for (const w of words) {
    const syl = countSyllables(w);
    totalSyllables += syl;
    if (syl >= 3 && w.length > 5 && !/^\d+$/.test(w)) {
      difficultWordOccurrences += 1;
      difficultSet.add(w);
    }
  }

  const safeWords = Math.max(1, wordCount);
  const syllablesPerWord = totalSyllables / safeWords;
  const wordsPerSentence = safeWords / sentenceCount;

  const fleschReadingEaseRaw = 206.835 - 1.015 * wordsPerSentence - 84.6 * syllablesPerWord;
  const fleschReadingEase = Math.max(0, Math.min(100, Math.round(fleschReadingEaseRaw * 10) / 10));

  const fleschKincaidRaw = 0.39 * wordsPerSentence + 11.8 * syllablesPerWord - 15.59;
  const fleschKincaidGrade = Math.max(1, Math.min(20, Math.round(fleschKincaidRaw * 10) / 10));

  const complexRatio = (difficultWordOccurrences / safeWords) * 100;
  const gunningFogIndex = Math.max(
    1,
    Math.min(22, Math.round((0.4 * (wordsPerSentence + complexRatio)) * 10) / 10)
  );

  let readabilityBand = 'Standard (Grade 8–9)';
  if (fleschReadingEase >= 80) readabilityBand = 'Very Easy (Grade 5–6)';
  else if (fleschReadingEase >= 70) readabilityBand = 'Plain English (Grade 7)';
  else if (fleschReadingEase >= 60) readabilityBand = 'Standard Editorial (Grade 8–9)';
  else if (fleschReadingEase >= 50) readabilityBand = 'Moderately Dense (Grade 10–12)';
  else if (fleschReadingEase >= 30) readabilityBand = 'Academic / Specialist (College)';
  else readabilityBand = 'Highly Technical (Graduate+)';

  const uniqueWords = new Set(words);
  const typeTokenRatio = Math.round((uniqueWords.size / safeWords) * 1000) / 1000;

  // Repeated 2-grams and 3-grams
  const ngramCounts = new Map<string, number>();
  for (let n = 2; n <= 3; n++) {
    for (let i = 0; i <= words.length - n; i++) {
      const slice = words.slice(i, i + n);
      if (slice.every((w) => STOPWORDS.has(w))) continue;
      if (slice.some((w) => w.length < 2)) continue;
      const key = slice.join(' ');
      ngramCounts.set(key, (ngramCounts.get(key) ?? 0) + 1);
    }
  }
  const repeatedNgrams: RepeatedNgram[] = Array.from(ngramCounts.entries())
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
    .slice(0, 12)
    .map(([phrase, count]) => ({ phrase, count }));

  const lowerText = normalized.toLowerCase();

  const transitionMatches = TRANSITION_WORDS.map((phrase) => {
    const regex = new RegExp(`\\b${escapeRegExp(phrase)}\\b`, 'gi');
    const count = (lowerText.match(regex) ?? []).length;
    return { phrase, count };
  }).filter((item) => item.count > 0);

  const fillerMatches = FILLER_PHRASES.map((phrase) => {
    const regex = new RegExp(`\\b${escapeRegExp(phrase)}\\b`, 'gi');
    const count = (lowerText.match(regex) ?? []).length;
    return { phrase, count };
  }).filter((item) => item.count > 0);

  const clicheMatches = OVERUSED_EXPRESSIONS.map((item) => {
    const regex = new RegExp(`\\b${escapeRegExp(item.phrase)}\\b`, 'gi');
    const count = (lowerText.match(regex) ?? []).length;
    const sentenceIndices: number[] = [];
    if (count > 0) {
      sentences.forEach((s) => {
        if (new RegExp(`\\b${escapeRegExp(item.phrase)}\\b`, 'i').test(s.text)) {
          sentenceIndices.push(s.index);
        }
      });
    }
    return { phrase: item.phrase, count, sentenceIndices };
  }).filter((item) => item.count > 0);

  const passiveRegex = /\b(?:is|are|was|were|be|been|being)\s+[a-z]+(?:ed|en|wn|nt)\b/i;
  const passiveVoiceSentenceCount = sentences.filter((s) => passiveRegex.test(s.text)).length;

  // SEO Keyword analysis
  const keywordsToCheck: Array<{ keyword: string; isPrimary: boolean }> = [];
  if (primaryKeyword.trim()) {
    keywordsToCheck.push({ keyword: primaryKeyword.trim(), isPrimary: true });
  }
  for (const sec of secondaryKeywords) {
    const trimmed = sec.trim();
    if (trimmed && !keywordsToCheck.some((k) => k.keyword.toLowerCase() === trimmed.toLowerCase())) {
      keywordsToCheck.push({ keyword: trimmed, isPrimary: false });
    }
  }

  const firstParagraphLower = (paragraphs[0] ?? '').toLowerCase();
  const headingsLower = headings.map((h) => h.text.toLowerCase()).join(' | ');

  const keywordStats: KeywordOccurrenceStats[] = keywordsToCheck.map(({ keyword, isPrimary }) => {
    const escaped = escapeRegExp(keyword.toLowerCase());
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
    const positions: number[] = [];
    let match: RegExpExecArray | null;
    while ((match = regex.exec(lowerText)) !== null) {
      positions.push(match.index);
    }
    const kwWordCount = Math.max(1, tokenizeWords(keyword).length);
    const densityPercent = Math.round(((positions.length * kwWordCount) / safeWords) * 10000) / 100;
    return {
      keyword,
      isPrimary,
      count: positions.length,
      densityPercent,
      inFirstParagraph: new RegExp(`\\b${escaped}\\b`, 'i').test(firstParagraphLower),
      inHeadings: new RegExp(`\\b${escaped}\\b`, 'i').test(headingsLower),
      positions,
    };
  });

  return {
    wordCount,
    characterCount,
    characterCountNoSpaces,
    sentenceCount: sentences.length,
    paragraphCount: paragraphs.length,
    estimatedReadingTimeMinutes,
    avgSentenceLength,
    sentenceLengthStdDev,
    minSentenceLength,
    maxSentenceLength,
    avgParagraphLengthWords,
    fleschReadingEase,
    fleschKincaidGrade,
    gunningFogIndex,
    readabilityBand,
    difficultWordCount: difficultWordOccurrences,
    difficultWordRatioPercent: Math.round((difficultWordOccurrences / safeWords) * 1000) / 10,
    difficultWordsSample: Array.from(difficultSet).slice(0, 15),
    typeTokenRatio,
    repeatedNgrams,
    transitionMatches,
    fillerMatches,
    clicheMatches,
    passiveVoiceSentenceCount,
    headingCount: headings.length,
    headings,
    keywordStats,
    sentenceLengths,
  };
}

/**
 * Deterministic 3-word shingle Jaccard similarity between two documents (0..100%).
 * Used for Website Content Audit duplicate/near-duplicate detection.
 */
export function computeTextSimilarityPercent(textA: string, textB: string): number {
  const wordsA = tokenizeWords(textA);
  const wordsB = tokenizeWords(textB);
  if (wordsA.length < 8 || wordsB.length < 8) return 0;

  const shinglesA = new Set<string>();
  const shinglesB = new Set<string>();
  for (let i = 0; i <= wordsA.length - 3; i++) {
    shinglesA.add(`${wordsA[i]} ${wordsA[i + 1]} ${wordsA[i + 2]}`);
  }
  for (let i = 0; i <= wordsB.length - 3; i++) {
    shinglesB.add(`${wordsB[i]} ${wordsB[i + 1]} ${wordsB[i + 2]}`);
  }

  let intersection = 0;
  for (const s of shinglesA) {
    if (shinglesB.has(s)) intersection += 1;
  }
  const union = shinglesA.size + shinglesB.size - intersection;
  if (union === 0) return 0;
  return Math.round((intersection / union) * 100);
}
