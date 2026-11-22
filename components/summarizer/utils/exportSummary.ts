import { Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';
import { jsPDF } from 'jspdf';
import type { OutputFeature, SummaryFormat, SummaryResult } from '../types/summarizer';

export interface ExportContext {
  format: SummaryFormat;
  feature: OutputFeature;
}

export function getVisibleSections(result: SummaryResult, ctx: ExportContext) {
  const { feature, format } = ctx;

  const showSummary =
    Boolean(result.summary) &&
    (feature === 'Full Summary' ||
      feature === 'Main Idea Extractor' ||
      feature === 'TL;DR Generator' ||
      feature === 'Key Points Extractor' ||
      feature === 'Important Facts Extractor' ||
      feature === 'Action Items Generator' ||
      feature === 'Pros and Cons Extractor' ||
      feature === 'Important Keywords' ||
      feature === 'Questions and Answers Generator' ||
      feature === 'Conclusion Generator');

  const showKeyPoints =
    result.keyPoints.length > 0 &&
    feature !== 'Important Facts Extractor' &&
    feature !== 'Action Items Generator' &&
    feature !== 'Pros and Cons Extractor' &&
    feature !== 'Important Keywords' &&
    feature !== 'Questions and Answers Generator' &&
    feature !== 'Conclusion Generator';

  const showImportantInfo =
    result.importantInfo.length > 0 &&
    (feature === 'Full Summary' || feature === 'Important Facts Extractor');

  const showActionItems =
    result.actionItems.length > 0 &&
    (feature === 'Full Summary' || feature === 'Action Items Generator');

  const showProsAndCons =
    (result.prosAndCons.pros.length > 0 || result.prosAndCons.cons.length > 0) &&
    (feature === 'Full Summary' || feature === 'Pros and Cons Extractor');

  const showQaPairs =
    result.qaPairs.length > 0 &&
    (feature === 'Full Summary' || feature === 'Questions and Answers Generator');

  const showKeywords =
    result.keywords.length > 0 &&
    (feature === 'Full Summary' || feature === 'Important Keywords' || feature === 'TL;DR Generator');

  const showConclusion =
    Boolean(result.conclusion) &&
    (feature === 'Full Summary' ||
      feature === 'Conclusion Generator' ||
      format === 'Executive Summary');

  return {
    showSummary,
    showKeyPoints,
    showImportantInfo,
    showActionItems,
    showProsAndCons,
    showQaPairs,
    showKeywords,
    showConclusion,
  };
}

export function getSummarySectionHeading(feature: OutputFeature): string {
  if (feature === 'Main Idea Extractor') return 'MAIN IDEA';
  if (feature === 'TL;DR Generator') return 'TL;DR';
  return 'SUMMARY';
}

export function getKeyPointsSectionHeading(format: SummaryFormat): string {
  if (format === 'Key Takeaways') return 'KEY TAKEAWAYS';
  return 'KEY POINTS';
}

export function formatSummaryAsPlainText(result: SummaryResult, ctx: ExportContext): string {
  const vis = getVisibleSections(result, ctx);
  const lines: string[] = [];

  lines.push(result.title.toUpperCase());
  lines.push(
    `Words: ${result.wordCount} | Est. reading time: ${result.readingTimeMinutes} min | Language: ${result.detectedLanguage}`
  );
  lines.push('');

  if (vis.showSummary) {
    lines.push(getSummarySectionHeading(ctx.feature));
    lines.push(result.summary);
    lines.push('');
  }

  if (vis.showKeyPoints) {
    lines.push(getKeyPointsSectionHeading(ctx.format));
    result.keyPoints.forEach((pt, idx) => {
      const prefix = ctx.format === 'Numbered List' || ctx.format === 'Key Takeaways' ? `${idx + 1}. ` : '• ';
      lines.push(`${prefix}${pt}`);
    });
    lines.push('');
  }

  if (vis.showImportantInfo) {
    lines.push('IMPORTANT INFORMATION');
    result.importantInfo.forEach((info) => {
      lines.push(`• ${info}`);
    });
    lines.push('');
  }

  if (vis.showActionItems) {
    lines.push('ACTION ITEMS');
    result.actionItems.forEach((item, idx) => {
      lines.push(`${idx + 1}. [ ] ${item}`);
    });
    lines.push('');
  }

  if (vis.showProsAndCons) {
    lines.push('PROS & CONS');
    if (result.prosAndCons.pros.length > 0) {
      lines.push('Pros:');
      result.prosAndCons.pros.forEach((p) => lines.push(`+ ${p}`));
    }
    if (result.prosAndCons.cons.length > 0) {
      lines.push('Cons:');
      result.prosAndCons.cons.forEach((c) => lines.push(`- ${c}`));
    }
    lines.push('');
  }

  if (vis.showQaPairs) {
    lines.push('QUESTIONS & ANSWERS');
    result.qaPairs.forEach((qa, idx) => {
      lines.push(`Q${idx + 1}: ${qa.question}`);
      lines.push(`A${idx + 1}: ${qa.answer}`);
      lines.push('');
    });
  }

  if (vis.showKeywords) {
    lines.push('IMPORTANT KEYWORDS');
    lines.push(result.keywords.join(', '));
    lines.push('');
  }

  if (vis.showConclusion) {
    lines.push('CONCLUSION');
    lines.push(result.conclusion);
    lines.push('');
  }

  return lines.join('\n').trim();
}

function sanitizeFilename(title: string, ext: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return `${base || 'aivora-summary'}.${ext}`;
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadAsTxt(result: SummaryResult, ctx: ExportContext): string {
  const content = formatSummaryAsPlainText(result, ctx);
  const filename = sanitizeFilename(result.title, 'txt');
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  triggerBlobDownload(blob, filename);
  return filename;
}

export function downloadAsPdf(result: SummaryResult, ctx: ExportContext): string {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 48;
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const writeHeading = (text: string) => {
    ensureSpace(28);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(79, 70, 229);
    doc.text(text, margin, y);
    y += 16;
  };

  const writeParagraph = (text: string, fontSize = 10.5, isBold = false) => {
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(fontSize);
    doc.setTextColor(39, 39, 42);
    const wrapped = doc.splitTextToSize(text, maxWidth) as string[];
    const lineHeight = fontSize * 1.45;
    for (const line of wrapped) {
      ensureSpace(lineHeight);
      doc.text(line, margin, y);
      y += lineHeight;
    }
    y += 6;
  };

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(24, 24, 27);
  const titleLines = doc.splitTextToSize(result.title, maxWidth) as string[];
  for (const line of titleLines) {
    ensureSpace(24);
    doc.text(line, margin, y);
    y += 22;
  }

  // Metadata
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(113, 113, 122);
  doc.text(
    `Aivora AI Summarizer  ·  ${result.wordCount} words  ·  ${result.readingTimeMinutes} min read  ·  ${result.detectedLanguage}`,
    margin,
    y
  );
  y += 20;

  // Divider
  doc.setDrawColor(232, 228, 220);
  doc.line(margin, y, pageWidth - margin, y);
  y += 20;

  const vis = getVisibleSections(result, ctx);

  if (vis.showSummary) {
    writeHeading(getSummarySectionHeading(ctx.feature));
    writeParagraph(result.summary);
    y += 6;
  }

  if (vis.showKeyPoints) {
    writeHeading(getKeyPointsSectionHeading(ctx.format));
    result.keyPoints.forEach((pt, idx) => {
      const prefix = ctx.format === 'Numbered List' || ctx.format === 'Key Takeaways' ? `${idx + 1}. ` : '• ';
      writeParagraph(`${prefix}${pt}`);
    });
    y += 6;
  }

  if (vis.showImportantInfo) {
    writeHeading('IMPORTANT INFORMATION');
    result.importantInfo.forEach((info) => writeParagraph(`• ${info}`));
    y += 6;
  }

  if (vis.showActionItems) {
    writeHeading('ACTION ITEMS');
    result.actionItems.forEach((item, idx) => writeParagraph(`${idx + 1}. ${item}`));
    y += 6;
  }

  if (vis.showProsAndCons) {
    writeHeading('PROS & CONS');
    if (result.prosAndCons.pros.length > 0) {
      writeParagraph('Pros:', 10.5, true);
      result.prosAndCons.pros.forEach((p) => writeParagraph(`+ ${p}`));
    }
    if (result.prosAndCons.cons.length > 0) {
      writeParagraph('Cons:', 10.5, true);
      result.prosAndCons.cons.forEach((c) => writeParagraph(`- ${c}`));
    }
    y += 6;
  }

  if (vis.showQaPairs) {
    writeHeading('QUESTIONS & ANSWERS');
    result.qaPairs.forEach((qa, idx) => {
      writeParagraph(`Q${idx + 1}: ${qa.question}`, 10.5, true);
      writeParagraph(`A${idx + 1}: ${qa.answer}`);
    });
    y += 6;
  }

  if (vis.showKeywords) {
    writeHeading('IMPORTANT KEYWORDS');
    writeParagraph(result.keywords.join(' · '));
    y += 6;
  }

  if (vis.showConclusion) {
    writeHeading('CONCLUSION');
    writeParagraph(result.conclusion);
  }

  const filename = sanitizeFilename(result.title, 'pdf');
  doc.save(filename);
  return filename;
}

export async function downloadAsDocx(result: SummaryResult, ctx: ExportContext): Promise<string> {
  const vis = getVisibleSections(result, ctx);
  const children: Paragraph[] = [];

  children.push(
    new Paragraph({
      text: result.title,
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 120 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Aivora AI Summarizer  ·  ${result.wordCount} words  ·  ${result.readingTimeMinutes} min read  ·  ${result.detectedLanguage}`,
          color: '6B7280',
          size: 18,
        }),
      ],
      spacing: { after: 280 },
    })
  );

  const pushHeading = (label: string) => {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: label,
            bold: true,
            size: 20,
            color: '4F46E5',
          }),
        ],
        spacing: { before: 200, after: 100 },
      })
    );
  };

  if (vis.showSummary) {
    pushHeading(getSummarySectionHeading(ctx.feature));
    result.summary.split(/\n+/).forEach((para) => {
      children.push(
        new Paragraph({
          text: para,
          spacing: { after: 120 },
        })
      );
    });
  }

  if (vis.showKeyPoints) {
    pushHeading(getKeyPointsSectionHeading(ctx.format));
    result.keyPoints.forEach((pt, idx) => {
      const prefix = ctx.format === 'Numbered List' || ctx.format === 'Key Takeaways' ? `${idx + 1}. ` : '• ';
      children.push(
        new Paragraph({
          text: `${prefix}${pt}`,
          spacing: { after: 80 },
        })
      );
    });
  }

  if (vis.showImportantInfo) {
    pushHeading('IMPORTANT INFORMATION');
    result.importantInfo.forEach((info) => {
      children.push(
        new Paragraph({
          text: `• ${info}`,
          spacing: { after: 80 },
        })
      );
    });
  }

  if (vis.showActionItems) {
    pushHeading('ACTION ITEMS');
    result.actionItems.forEach((item, idx) => {
      children.push(
        new Paragraph({
          text: `${idx + 1}. ${item}`,
          spacing: { after: 80 },
        })
      );
    });
  }

  if (vis.showProsAndCons) {
    pushHeading('PROS & CONS');
    if (result.prosAndCons.pros.length > 0) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: 'Pros', bold: true })],
          spacing: { after: 60 },
        })
      );
      result.prosAndCons.pros.forEach((p) => {
        children.push(new Paragraph({ text: `+ ${p}`, spacing: { after: 60 } }));
      });
    }
    if (result.prosAndCons.cons.length > 0) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: 'Cons', bold: true })],
          spacing: { before: 80, after: 60 },
        })
      );
      result.prosAndCons.cons.forEach((c) => {
        children.push(new Paragraph({ text: `- ${c}`, spacing: { after: 60 } }));
      });
    }
  }

  if (vis.showQaPairs) {
    pushHeading('QUESTIONS & ANSWERS');
    result.qaPairs.forEach((qa, idx) => {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `Q${idx + 1}: ${qa.question}`, bold: true })],
          spacing: { after: 40 },
        }),
        new Paragraph({
          text: `A${idx + 1}: ${qa.answer}`,
          spacing: { after: 120 },
        })
      );
    });
  }

  if (vis.showKeywords) {
    pushHeading('IMPORTANT KEYWORDS');
    children.push(
      new Paragraph({
        text: result.keywords.join(', '),
        spacing: { after: 120 },
      })
    );
  }

  if (vis.showConclusion) {
    pushHeading('CONCLUSION');
    children.push(
      new Paragraph({
        text: result.conclusion,
        spacing: { after: 120 },
      })
    );
  }

  const doc = new Document({
    sections: [{ children }],
  });

  const blob = await Packer.toBlob(doc);
  const filename = sanitizeFilename(result.title, 'docx');
  triggerBlobDownload(blob, filename);
  return filename;
}
