import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import PDFDocument from 'pdfkit';
import type { ContentAnalysisResponse } from '../../types/contentIntelligence';

export interface ExportPayload {
  kind: 'original' | 'improved' | 'full_report';
  format: 'txt' | 'docx' | 'pdf';
  originalText: string;
  improvedText: string;
  analysis?: ContentAnalysisResponse | null;
  documentTitle?: string;
}

export async function generateExportBuffer(payload: ExportPayload): Promise<{
  buffer: Buffer;
  contentType: string;
  fileName: string;
}> {
  const safeBase = (payload.documentTitle || 'ai-content-intelligence')
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'content-report';

  if (payload.format === 'txt') {
    const content = buildPlainTextReport(payload);
    return {
      buffer: Buffer.from(content, 'utf8'),
      contentType: 'text/plain; charset=utf-8',
      fileName: `${safeBase}-${payload.kind}.txt`,
    };
  }

  if (payload.format === 'docx') {
    const buffer = await buildDocxBuffer(payload);
    return {
      buffer,
      contentType:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileName: `${safeBase}-${payload.kind}.docx`,
    };
  }

  if (payload.format === 'pdf') {
    const buffer = await buildPdfBuffer(payload);
    return {
      buffer,
      contentType: 'application/pdf',
      fileName: `${safeBase}-${payload.kind}.pdf`,
    };
  }

  throw new Error('Unsupported export format.');
}

function buildPlainTextReport(payload: ExportPayload): string {
  if (payload.kind === 'original') {
    return payload.originalText;
  }
  if (payload.kind === 'improved') {
    return payload.improvedText || payload.originalText;
  }

  const a = payload.analysis;
  const lines: string[] = [
    'AI CONTENT INTELLIGENCE — EDITORIAL & WRITING PATTERN REPORT',
    `Generated: ${new Date().toISOString()}`,
    '='.repeat(72),
    '',
    '1. CONTENT OVERVIEW',
  ];

  if (a) {
    lines.push(
      `Words: ${a.objectiveMetrics.wordCount} | Characters: ${a.objectiveMetrics.characterCount} | Reading Time: ${a.objectiveMetrics.estimatedReadingTimeMinutes} min`,
      `Sentences: ${a.objectiveMetrics.sentenceCount} | Paragraphs: ${a.objectiveMetrics.paragraphCount}`,
      '',
      '2. WRITING PATTERN ANALYSIS (PROBABILISTIC)',
      `Pattern Prevalence: ${a.detectionAssessment.patternPrevalence} (Confidence: ${a.detectionAssessment.confidence})`,
      `Methodology: ${a.detectionAssessment.methodologySummary}`,
      `Limitations: ${a.detectionAssessment.limitationsDisclaimer}`,
      ...a.detectionAssessment.patternFindings.map(
        (f) => `- [${f.signalLevel}] ${f.dimension}: ${f.evidenceSummary}`
      ),
      '',
      '3. FLAGGED SENTENCES',
      ...a.sentences
        .filter((s) => s.severity !== 'green')
        .map(
          (s) =>
            `- [Sentence ${s.index + 1} | ${s.severity.toUpperCase()} - ${s.severityLabel}]\n  Original: ${s.originalSentence}\n  Pattern: ${s.patternIdentified}\n  Reason: ${s.whyGenericOrUnnatural}\n  Improved: ${s.improvedSentence}`
        ),
      '',
      '4. PHRASE REPLACEMENT SUGGESTIONS',
      ...a.phraseSuggestions.map(
        (p) =>
          `- "${p.originalPhrase}" -> "${p.recommendedReplacement}" (${p.status})\n  Why: ${p.whyImprove}\n  Preview: ${p.updatedSentencePreview}`
      ),
      '',
      '5. READABILITY ANALYSIS',
      `Flesch Reading Ease: ${a.objectiveMetrics.fleschReadingEase} (${a.objectiveMetrics.readabilityBand})`,
      `Flesch-Kincaid Grade: ${a.objectiveMetrics.fleschKincaidGrade} | Gunning Fog: ${a.objectiveMetrics.gunningFogIndex}`,
      `Avg Sentence Length: ${a.objectiveMetrics.avgSentenceLength} words (StdDev: ${a.objectiveMetrics.sentenceLengthStdDev})`,
      `Editorial Summary: ${a.qualityReport.readabilityAssessment.editorialJudgment}`,
      '',
      '6. SEO CONTENT ANALYSIS',
      `Recommended Meta Title: ${a.qualityReport.seoQuality.recommendedMetaTitle}`,
      `Recommended Meta Description: ${a.qualityReport.seoQuality.recommendedMetaDescription}`,
      `Keyword Stuffing Risk: ${a.qualityReport.seoQuality.keywordStuffingRisk}`,
      `Search Intent Alignment: ${a.qualityReport.seoQuality.searchIntentAlignment}`,
      ...a.objectiveMetrics.keywordStats.map(
        (k) =>
          `- Keyword "${k.keyword}" (${k.isPrimary ? 'Primary' : 'Secondary'}): ${k.count}x (${k.densityPercent}%), In Headings: ${k.inHeadings ? 'Yes' : 'No'}, In First Paragraph: ${k.inFirstParagraph ? 'Yes' : 'No'}`
      ),
      '',
      '7. REWRITTEN / IMPROVED CONTENT',
      payload.improvedText || payload.originalText,
      '',
      '8. EDITORIAL & RESTRUCTURING RECOMMENDATIONS',
      ...a.restructuringRecommendations.map(
        (r) => `- [${r.issueType} @ ${r.locationLabel}] ${r.explanation} -> Fix: ${r.recommendedFix}`
      )
    );
  } else {
    lines.push('Original Text:', payload.originalText, '', 'Improved Text:', payload.improvedText);
  }

  return lines.join('\n');
}

function textParagraphsFromString(text: string): Paragraph[] {
  return text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const headingMatch = block.match(/^(#{1,3})\s+(.+)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        return new Paragraph({
          text: headingMatch[2],
          heading:
            level === 1
              ? HeadingLevel.HEADING_1
              : level === 2
              ? HeadingLevel.HEADING_2
              : HeadingLevel.HEADING_3,
          spacing: { before: 220, after: 120 },
        });
      }
      return new Paragraph({
        children: [new TextRun({ text: block, size: 22 })],
        spacing: { after: 140 },
      });
    });
}

async function buildDocxBuffer(payload: ExportPayload): Promise<Buffer> {
  const children: Array<Paragraph | Table> = [];

  if (payload.kind === 'original' || payload.kind === 'improved') {
    const content =
      payload.kind === 'original'
        ? payload.originalText
        : payload.improvedText || payload.originalText;
    children.push(...textParagraphsFromString(content));
  } else {
    const a = payload.analysis;
    children.push(
      new Paragraph({
        text: 'AI Content Intelligence — Content Analysis & Improvement Report',
        heading: HeadingLevel.TITLE,
        spacing: { after: 120 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Generated ${new Date().toLocaleString()} · Probabilistic Editorial Analysis`,
            color: '475569',
            size: 20,
          }),
        ],
        spacing: { after: 280 },
      })
    );

    if (a) {
      // 1. Overview
      children.push(
        new Paragraph({
          text: '1. Content Overview',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 200, after: 120 },
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            ['Word Count', String(a.objectiveMetrics.wordCount)],
            ['Character Count', String(a.objectiveMetrics.characterCount)],
            ['Estimated Reading Time', `${a.objectiveMetrics.estimatedReadingTimeMinutes} min`],
            ['Sentences / Paragraphs', `${a.objectiveMetrics.sentenceCount} / ${a.objectiveMetrics.paragraphCount}`],
            ['Pattern Prevalence', `${a.detectionAssessment.patternPrevalence} (Confidence: ${a.detectionAssessment.confidence})`],
            ['Flesch Reading Ease', `${a.objectiveMetrics.fleschReadingEase} (${a.objectiveMetrics.readabilityBand})`],
          ].map(
            ([label, val]) =>
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 40, type: WidthType.PERCENTAGE },
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
                      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
                      left: { style: BorderStyle.NONE },
                      right: { style: BorderStyle.NONE },
                    },
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: label, bold: true, size: 20 })],
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 60, type: WidthType.PERCENTAGE },
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
                      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
                      left: { style: BorderStyle.NONE },
                      right: { style: BorderStyle.NONE },
                    },
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: val, size: 20 })],
                      }),
                    ],
                  }),
                ],
              })
          ),
        })
      );

      // 2. Writing pattern analysis
      children.push(
        new Paragraph({
          text: '2. Writing Pattern Analysis',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 260, after: 120 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Limitations Note: ', bold: true, size: 20 }),
            new TextRun({ text: a.detectionAssessment.limitationsDisclaimer, size: 20 }),
          ],
          spacing: { after: 140 },
        }),
        ...a.detectionAssessment.patternFindings.map(
          (f) =>
            new Paragraph({
              children: [
                new TextRun({ text: `[${f.signalLevel}] ${f.dimension}: `, bold: true, size: 20 }),
                new TextRun({ text: f.evidenceSummary, size: 20 }),
              ],
              spacing: { after: 100 },
            })
        )
      );

      // 3. Flagged sentences
      children.push(
        new Paragraph({
          text: '3. Flagged Sentences & Improvements',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 260, after: 120 },
        })
      );
      const flagged = a.sentences.filter((s) => s.severity !== 'green');
      if (flagged.length === 0) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: 'No sentences required substantial editing.', size: 20 })],
          })
        );
      } else {
        for (const s of flagged) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `Sentence ${s.index + 1} (${s.severity.toUpperCase()} — ${s.severityLabel}): `,
                  bold: true,
                  size: 20,
                }),
                new TextRun({ text: s.originalSentence, size: 20 }),
              ],
              spacing: { after: 60 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: 'Pattern & Critique: ', bold: true, size: 19, color: '475569' }),
                new TextRun({ text: `${s.patternIdentified}. ${s.whyGenericOrUnnatural}`, size: 19, color: '475569' }),
              ],
              spacing: { after: 60 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: 'Suggested Improvement: ', bold: true, size: 19, color: '0F172A' }),
                new TextRun({ text: s.improvedSentence, size: 19 }),
              ],
              spacing: { after: 140 },
            })
          );
        }
      }

      // 4. Phrase replacements
      children.push(
        new Paragraph({
          text: '4. Phrase Replacement Suggestions',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 260, after: 120 },
        }),
        ...a.phraseSuggestions.map(
          (p) =>
            new Paragraph({
              children: [
                new TextRun({
                  text: `"${p.originalPhrase}" → "${p.recommendedReplacement}" (${p.status.toUpperCase()}): `,
                  bold: true,
                  size: 20,
                }),
                new TextRun({ text: p.whyImprove, size: 20 }),
              ],
              spacing: { after: 100 },
            })
        )
      );

      // 5. Readability analysis
      children.push(
        new Paragraph({
          text: '5. Readability Analysis',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 260, after: 120 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Flesch-Kincaid Grade: ${a.objectiveMetrics.fleschKincaidGrade} | Gunning Fog: ${a.objectiveMetrics.gunningFogIndex} | Avg Sentence Length: ${a.objectiveMetrics.avgSentenceLength} words (StdDev: ${a.objectiveMetrics.sentenceLengthStdDev})`,
              size: 20,
            }),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [new TextRun({ text: a.qualityReport.readabilityAssessment.editorialJudgment, size: 20 })],
          spacing: { after: 120 },
        })
      );

      // 6. SEO Content Analysis
      children.push(
        new Paragraph({
          text: '6. SEO Content Analysis',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 260, after: 120 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Recommended Meta Title: ', bold: true, size: 20 }),
            new TextRun({ text: a.qualityReport.seoQuality.recommendedMetaTitle, size: 20 }),
          ],
          spacing: { after: 80 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Recommended Meta Description: ', bold: true, size: 20 }),
            new TextRun({ text: a.qualityReport.seoQuality.recommendedMetaDescription, size: 20 }),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [new TextRun({ text: a.qualityReport.seoQuality.searchIntentAlignment, size: 20 })],
          spacing: { after: 120 },
        })
      );

      // 7. Rewritten Content
      children.push(
        new Paragraph({
          text: '7. Improved / Rewritten Content',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 260, after: 120 },
        }),
        ...textParagraphsFromString(payload.improvedText || payload.originalText)
      );

      // 8. Editorial Recommendations
      children.push(
        new Paragraph({
          text: '8. Editorial & Restructuring Recommendations',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 260, after: 120 },
        }),
        ...a.restructuringRecommendations.map(
          (r) =>
            new Paragraph({
              children: [
                new TextRun({ text: `[${r.issueType}] ${r.locationLabel}: `, bold: true, size: 20 }),
                new TextRun({ text: `${r.explanation} Fix: ${r.recommendedFix}`, size: 20 }),
              ],
              spacing: { after: 100 },
            })
        )
      );
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}

async function buildPdfBuffer(payload: ExportPayload): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 48, size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const a = payload.analysis;

    doc
      .fontSize(18)
      .fillColor('#0F172A')
      .text('AI Content Intelligence — Editorial Analysis Report');
    doc
      .fontSize(9.5)
      .fillColor('#64748B')
      .text(`Generated ${new Date().toLocaleString()} · Probabilistic Pattern & Quality Assessment`);
    doc.moveDown(1);

    const sectionHeader = (title: string) => {
      doc.moveDown(0.7);
      doc.fontSize(13).fillColor('#0F172A').text(title);
      doc.moveTo(doc.x, doc.y + 2).lineTo(547, doc.y + 2).strokeColor('#CBD5E1').stroke();
      doc.moveDown(0.5);
    };

    if (!a) {
      sectionHeader('1. Original Content');
      doc.fontSize(10).fillColor('#1E293B').text(payload.originalText);
      sectionHeader('2. Improved Content');
      doc.fontSize(10).fillColor('#1E293B').text(payload.improvedText || payload.originalText);
      doc.end();
      return;
    }

    sectionHeader('1. Content Overview');
    doc
      .fontSize(10)
      .fillColor('#1E293B')
      .text(
        `Word Count: ${a.objectiveMetrics.wordCount}   |   Characters: ${a.objectiveMetrics.characterCount}   |   Reading Time: ${a.objectiveMetrics.estimatedReadingTimeMinutes} min`
      )
      .text(
        `Sentences: ${a.objectiveMetrics.sentenceCount}   |   Paragraphs: ${a.objectiveMetrics.paragraphCount}   |   Vocabulary Diversity (TTR): ${a.objectiveMetrics.typeTokenRatio}`
      );

    sectionHeader('2. Writing Pattern Analysis');
    doc
      .fontSize(10)
      .fillColor('#0F172A')
      .text(
        `Pattern Prevalence: ${a.detectionAssessment.patternPrevalence} (Confidence: ${a.detectionAssessment.confidence})`
      );
    doc
      .fontSize(9.5)
      .fillColor('#475569')
      .text(`Limitations: ${a.detectionAssessment.limitationsDisclaimer}`);
    doc.moveDown(0.3);
    for (const f of a.detectionAssessment.patternFindings.slice(0, 8)) {
      doc
        .fontSize(9.5)
        .fillColor('#1E293B')
        .text(`• [${f.signalLevel}] ${f.dimension}: ${f.evidenceSummary}`);
    }

    sectionHeader('3. Flagged Sentences');
    const flagged = a.sentences.filter((s) => s.severity !== 'green');
    if (flagged.length === 0) {
      doc.fontSize(10).fillColor('#1E293B').text('No sentences required editing.');
    } else {
      for (const s of flagged.slice(0, 25)) {
        doc
          .fontSize(9.5)
          .fillColor('#0F172A')
          .text(`Sentence ${s.index + 1} [${s.severity.toUpperCase()} — ${s.severityLabel}]`);
        doc.fontSize(9.5).fillColor('#334155').text(`Original: ${s.originalSentence}`);
        doc.fontSize(9).fillColor('#475569').text(`Pattern: ${s.patternIdentified} — ${s.whyGenericOrUnnatural}`);
        doc.fontSize(9.5).fillColor('#0F172A').text(`Improved: ${s.improvedSentence}`);
        doc.moveDown(0.4);
      }
    }

    sectionHeader('4. Phrase Replacement Suggestions');
    if (a.phraseSuggestions.length === 0) {
      doc.fontSize(10).fillColor('#1E293B').text('No overused phrase replacements flagged.');
    } else {
      for (const p of a.phraseSuggestions.slice(0, 20)) {
        doc
          .fontSize(9.5)
          .fillColor('#1E293B')
          .text(`• "${p.originalPhrase}" → "${p.recommendedReplacement}" (${p.status}) — ${p.whyImprove}`);
      }
    }

    sectionHeader('5. Readability Analysis');
    doc
      .fontSize(10)
      .fillColor('#1E293B')
      .text(
        `Flesch Reading Ease: ${a.objectiveMetrics.fleschReadingEase} (${a.objectiveMetrics.readabilityBand}) | FK Grade: ${a.objectiveMetrics.fleschKincaidGrade} | Gunning Fog: ${a.objectiveMetrics.gunningFogIndex}`
      )
      .text(
        `Sentence Length: Avg ${a.objectiveMetrics.avgSentenceLength} words (StdDev ${a.objectiveMetrics.sentenceLengthStdDev}, Range ${a.objectiveMetrics.minSentenceLength}–${a.objectiveMetrics.maxSentenceLength})`
      )
      .moveDown(0.25)
      .text(a.qualityReport.readabilityAssessment.editorialJudgment);

    sectionHeader('6. SEO Content Analysis');
    doc
      .fontSize(10)
      .fillColor('#1E293B')
      .text(`Recommended Meta Title: ${a.qualityReport.seoQuality.recommendedMetaTitle}`)
      .text(`Recommended Meta Description: ${a.qualityReport.seoQuality.recommendedMetaDescription}`)
      .text(`Keyword Stuffing Risk: ${a.qualityReport.seoQuality.keywordStuffingRisk}`)
      .moveDown(0.25)
      .text(a.qualityReport.seoQuality.searchIntentAlignment);

    sectionHeader('7. Rewritten / Improved Content');
    doc.fontSize(10).fillColor('#1E293B').text(payload.improvedText || payload.originalText);

    sectionHeader('8. Editorial & Restructuring Recommendations');
    for (const r of a.restructuringRecommendations) {
      doc
        .fontSize(9.5)
        .fillColor('#1E293B')
        .text(`• [${r.issueType} · ${r.locationLabel}] ${r.explanation} Fix: ${r.recommendedFix}`);
    }

    doc.end();
  });
}
