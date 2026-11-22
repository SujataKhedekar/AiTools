import { diffWordsWithSpace, type Change } from 'diff';

export interface ParagraphDiffBlock {
  id: string;
  index: number;
  originalParagraph: string;
  improvedParagraph: string;
  hasChanges: boolean;
  wordChanges: Change[];
  decision: 'pending' | 'accepted' | 'rejected';
}

export function computeWordDiff(original: string, improved: string): Change[] {
  return diffWordsWithSpace(original, improved);
}

export function buildParagraphDiffBlocks(
  originalText: string,
  improvedText: string
): ParagraphDiffBlock[] {
  const origParas = originalText
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const impParas = improvedText
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const maxLen = Math.max(origParas.length, impParas.length);
  const blocks: ParagraphDiffBlock[] = [];

  for (let i = 0; i < maxLen; i++) {
    const orig = origParas[i] ?? '';
    const imp = impParas[i] ?? '';
    const hasChanges = orig !== imp;
    blocks.push({
      id: `pdiff-${i}`,
      index: i,
      originalParagraph: orig,
      improvedParagraph: imp,
      hasChanges,
      wordChanges: diffWordsWithSpace(orig, imp),
      decision: hasChanges ? 'pending' : 'accepted',
    });
  }

  return blocks;
}

export function replaceSentenceInText(
  fullText: string,
  originalSentence: string,
  replacementSentence: string
): string {
  if (!originalSentence.trim()) return fullText;
  const idx = fullText.indexOf(originalSentence);
  if (idx !== -1) {
    return (
      fullText.slice(0, idx) +
      replacementSentence +
      fullText.slice(idx + originalSentence.length)
    );
  }
  // Fallback: whitespace-normalized regex match
  const escaped = originalSentence
    .trim()
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\s+/g, '\\s+');
  const regex = new RegExp(escaped);
  if (regex.test(fullText)) {
    return fullText.replace(regex, replacementSentence);
  }
  return fullText;
}

export function replacePhraseInText(
  fullText: string,
  contextSentence: string,
  originalPhrase: string,
  replacementPhrase: string
): string {
  const cleanReplacement = replacementPhrase.startsWith('(')
    ? ''
    : replacementPhrase;

  const escapedPhrase = originalPhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const phraseRegex = new RegExp(escapedPhrase, 'i');

  if (contextSentence && fullText.includes(contextSentence)) {
    const updatedSentence = cleanReplacement
      ? contextSentence.replace(phraseRegex, cleanReplacement)
      : contextSentence.replace(phraseRegex, '').replace(/\s{2,}/g, ' ').replace(/\s+([.,;!?])/g, '$1').trim();
    return replaceSentenceInText(fullText, contextSentence, updatedSentence);
  }

  if (phraseRegex.test(fullText)) {
    return cleanReplacement
      ? fullText.replace(phraseRegex, cleanReplacement)
      : fullText.replace(phraseRegex, '').replace(/\s{2,}/g, ' ').trim();
  }

  return fullText;
}
