export interface LiveTextCounters {
  wordCount: number;
  characterCount: number;
  characterCountNoSpaces: number;
  sentenceCount: number;
  paragraphCount: number;
  estimatedReadingTimeLabel: string;
}

export function computeLiveTextCounters(text: string): LiveTextCounters {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      wordCount: 0,
      characterCount: 0,
      characterCountNoSpaces: 0,
      sentenceCount: 0,
      paragraphCount: 0,
      estimatedReadingTimeLabel: '0 sec read',
    };
  }

  const words = trimmed.match(/[a-zA-Z0-9]+(?:['’-][a-zA-Z0-9]+)*/g) ?? [];
  const wordCount = words.length;
  const characterCount = text.length;
  const characterCountNoSpaces = text.replace(/\s/g, '').length;
  const sentences = trimmed
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  const paragraphs = trimmed
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const minutesFloat = wordCount / 225;
  let estimatedReadingTimeLabel = '0 sec read';
  if (wordCount > 0 && minutesFloat < 1) {
    const secs = Math.max(5, Math.round(minutesFloat * 60));
    estimatedReadingTimeLabel = `${secs} sec read`;
  } else if (wordCount > 0) {
    const mins = Math.max(1, Math.round(minutesFloat * 10) / 10);
    estimatedReadingTimeLabel = `${mins} min read`;
  }

  return {
    wordCount,
    characterCount,
    characterCountNoSpaces,
    sentenceCount: sentences.length,
    paragraphCount: paragraphs.length,
    estimatedReadingTimeLabel,
  };
}
