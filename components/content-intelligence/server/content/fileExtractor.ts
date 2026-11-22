import * as cheerio from 'cheerio';
import mammoth from 'mammoth';

export interface ExtractedDocument {
  fileName: string;
  fileType: 'txt' | 'md' | 'docx' | 'html';
  text: string;
  warnings: string[];
}

export async function extractTextFromUploadedFile(
  buffer: Buffer,
  originalName: string,
  mimeType: string
): Promise<ExtractedDocument> {
  const lowerName = originalName.toLowerCase();
  const warnings: string[] = [];

  if (
    lowerName.endsWith('.docx') ||
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    const htmlResult = await mammoth.convertToHtml({ buffer });
    for (const msg of htmlResult.messages) {
      if (msg.message) warnings.push(msg.message);
    }

    const $ = cheerio.load(htmlResult.value || '');
    const blocks: string[] = [];

    $('h1, h2, h3, h4, h5, h6, p, li').each((_, el) => {
      const tag = el.tagName.toLowerCase();
      const text = $(el).text().replace(/\s+/g, ' ').trim();
      if (!text) return;
      if (tag === 'h1') blocks.push(`# ${text}`);
      else if (tag === 'h2') blocks.push(`## ${text}`);
      else if (tag === 'h3') blocks.push(`### ${text}`);
      else if (tag.startsWith('h')) blocks.push(`#### ${text}`);
      else if (tag === 'li') blocks.push(`- ${text}`);
      else blocks.push(text);
    });

    const combined = blocks.join('\n\n').trim();
    if (!combined) {
      const rawText = await mammoth.extractRawText({ buffer });
      return {
        fileName: originalName,
        fileType: 'docx',
        text: rawText.value.trim(),
        warnings,
      };
    }

    return {
      fileName: originalName,
      fileType: 'docx',
      text: combined,
      warnings,
    };
  }

  if (lowerName.endsWith('.html') || lowerName.endsWith('.htm') || mimeType === 'text/html') {
    const rawHtml = buffer.toString('utf8');
    const $ = cheerio.load(rawHtml);
    $('script, style, nav, footer, header, aside, noscript').remove();
    const blocks: string[] = [];
    $('h1, h2, h3, h4, p, li').each((_, el) => {
      const tag = el.tagName.toLowerCase();
      const text = $(el).text().replace(/\s+/g, ' ').trim();
      if (!text) return;
      if (tag === 'h1') blocks.push(`# ${text}`);
      else if (tag === 'h2') blocks.push(`## ${text}`);
      else if (tag === 'h3') blocks.push(`### ${text}`);
      else if (tag === 'li') blocks.push(`- ${text}`);
      else blocks.push(text);
    });
    return {
      fileName: originalName,
      fileType: 'html',
      text: blocks.join('\n\n').trim(),
      warnings,
    };
  }

  if (
    lowerName.endsWith('.md') ||
    lowerName.endsWith('.markdown') ||
    mimeType === 'text/markdown'
  ) {
    return {
      fileName: originalName,
      fileType: 'md',
      text: buffer.toString('utf8').replace(/\r\n/g, '\n').trim(),
      warnings,
    };
  }

  if (
    lowerName.endsWith('.txt') ||
    lowerName.endsWith('.csv') ||
    mimeType.startsWith('text/')
  ) {
    return {
      fileName: originalName,
      fileType: 'txt',
      text: buffer.toString('utf8').replace(/\r\n/g, '\n').trim(),
      warnings,
    };
  }

  throw new Error(
    'Unsupported file format. Please upload a .txt, .md, .docx, or .html document.'
  );
}
