import React from 'react';
import { sanitizeUrl } from '../utils/newsletterExport';

interface RichInlineTextProps {
  text: string;
  accentColor: string;
}

/**
 * Safely parses a lightweight subset of inline markdown into React nodes
 * without raw HTML injection.
 */
export function RichInlineText({ text, accentColor }: RichInlineTextProps) {
  const lines = text.split('\n');

  return (
    <>
      {lines.map((line, lineIdx) => (
        <React.Fragment key={lineIdx}>
          {parseInlineTokens(line, accentColor)}
          {lineIdx < lines.length - 1 && <br />}
        </React.Fragment>
      ))}
    </>
  );
}

function parseInlineTokens(line: string, accentColor: string): React.ReactNode[] {
  const tokenRegex = /(\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`)/g;
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let keyCounter = 0;

  while ((match = tokenRegex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(line.slice(lastIndex, match.index));
    }

    if (match[2] !== undefined && match[3] !== undefined) {
      // [label](url)
      const safe = sanitizeUrl(match[3]);
      if (safe) {
        nodes.push(
          <a
            key={keyCounter++}
            href={safe}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: accentColor }}
            className="underline underline-offset-4 decoration-1 hover:opacity-80 transition-opacity"
          >
            {match[2]}
          </a>
        );
      } else {
        nodes.push(match[2]);
      }
    } else if (match[4] !== undefined) {
      nodes.push(
        <strong key={keyCounter++} className="font-semibold">
          {match[4]}
        </strong>
      );
    } else if (match[5] !== undefined) {
      nodes.push(
        <em key={keyCounter++} className="italic">
          {match[5]}
        </em>
      );
    } else if (match[6] !== undefined) {
      nodes.push(
        <code
          key={keyCounter++}
          className="font-mono text-[0.88em] px-1.5 py-0.5 rounded bg-black/5"
        >
          {match[6]}
        </code>
      );
    }

    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < line.length) {
    nodes.push(line.slice(lastIndex));
  }

  return nodes;
}
