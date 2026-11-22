import {
  EditorialCheck,
  IssueStats,
  NewsletterBlock,
  NewsletterIssue,
  TypographyPreset,
} from '../types/newsletter';

export function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function sanitizeUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (/^(https?:\/\/|mailto:)/i.test(trimmed)) {
    return trimmed;
  }
  return null;
}

/**
 * Converts a safe subset of inline markdown (**bold**, *italic*, `code`, [label](url))
 * to escaped HTML suitable for email clients.
 */
export function renderInlineMarkdownToHtml(text: string, accentColor: string): string {
  let escaped = escapeHtml(text);

  // Links: [label](url)
  escaped = escaped.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label: string, rawUrl: string) => {
    const safe = sanitizeUrl(rawUrl.replace(/&amp;/g, '&'));
    if (!safe) return label;
    return `<a href="${escapeHtml(safe)}" style="color:${escapeHtml(accentColor)};text-decoration:underline;text-underline-offset:3px;">${label}</a>`;
  });

  // Inline code
  escaped = escaped.replace(
    /`([^`]+)`/g,
    '<code style="font-family:\'IBM Plex Mono\',monospace;font-size:0.9em;background:rgba(0,0,0,0.05);padding:2px 5px;border-radius:3px;">$1</code>'
  );

  // Bold
  escaped = escaped.replace(/\*\*([^*]+)\*\*/g, '<strong style="font-weight:600;">$1</strong>');

  // Italic
  escaped = escaped.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em style="font-style:italic;">$1</em>');

  // Line breaks
  escaped = escaped.replace(/\n/g, '<br />');

  return escaped;
}

function getFontStacks(typography: TypographyPreset): { heading: string; body: string } {
  switch (typography) {
    case 'book-monograph':
      return {
        heading: "'Fraunces', Georgia, 'Times New Roman', serif",
        body: "Georgia, 'Times New Roman', serif",
      };
    case 'modern-sans':
      return {
        heading: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
        body: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
      };
    case 'editorial-serif':
    default:
      return {
        heading: "'Fraunces', Georgia, 'Times New Roman', serif",
        body: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
      };
  }
}

function blockToEmailHtml(block: NewsletterBlock, issue: NewsletterIssue): string {
  const { design } = issue;
  const fonts = getFontStacks(design.typography);

  switch (block.type) {
    case 'heading': {
      const fontSize = block.level === 2 ? '24px' : '19px';
      const kickerHtml = block.kicker.trim()
        ? `<p style="margin:0 0 6px 0;font-family:${fonts.body};font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:${design.mutedColor};">${escapeHtml(block.kicker)}</p>`
        : '';
      return `
        <tr>
          <td style="padding:24px 0 8px 0;">
            ${kickerHtml}
            <h${block.level} style="margin:0;font-family:${fonts.heading};font-size:${fontSize};line-height:1.25;font-weight:600;color:${design.textColor};letter-spacing:-0.015em;">
              ${escapeHtml(block.text)}
            </h${block.level}>
          </td>
        </tr>`;
    }

    case 'paragraph': {
      const bodyHtml = renderInlineMarkdownToHtml(block.text, design.accentColor);
      return `
        <tr>
          <td style="padding:8px 0 12px 0;font-family:${fonts.body};font-size:16px;line-height:1.7;color:${design.textColor};">
            ${bodyHtml}
          </td>
        </tr>`;
    }

    case 'image': {
      const captionHtml = block.caption.trim()
        ? `<p style="margin:10px 0 0 0;font-family:${fonts.body};font-size:13px;line-height:1.5;color:${design.mutedColor};font-style:italic;">${escapeHtml(block.caption)}</p>`
        : '';
      return `
        <tr>
          <td style="padding:14px 0 18px 0;">
            <img src="${escapeHtml(block.src)}" alt="${escapeHtml(block.alt)}" width="${design.maxWidth - 64}" style="display:block;width:100%;max-width:100%;height:auto;border-radius:4px;border:1px solid ${design.borderColor};" />
            ${captionHtml}
          </td>
        </tr>`;
    }

    case 'quote': {
      const attrHtml = block.attribution.trim()
        ? `<p style="margin:12px 0 0 0;font-family:${fonts.body};font-size:13px;color:${design.mutedColor};">— ${escapeHtml(block.attribution)}</p>`
        : '';
      return `
        <tr>
          <td style="padding:18px 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${design.borderColor};border-bottom:1px solid ${design.borderColor};">
              <tr>
                <td style="padding:22px 12px;text-align:center;">
                  <p style="margin:0;font-family:${fonts.heading};font-size:21px;line-height:1.45;font-style:italic;color:${design.textColor};">
                    “${escapeHtml(block.text)}”
                  </p>
                  ${attrHtml}
                </td>
              </tr>
            </table>
          </td>
        </tr>`;
    }

    case 'links': {
      const headingHtml = block.heading.trim()
        ? `<h3 style="margin:0 0 14px 0;font-family:${fonts.heading};font-size:20px;font-weight:600;color:${design.textColor};">${escapeHtml(block.heading)}</h3>`
        : '';
      const rows = block.items
        .map((item) => {
          const safeUrl = sanitizeUrl(item.url);
          const titleMarkup = safeUrl
            ? `<a href="${escapeHtml(safeUrl)}" style="color:${design.accentColor};text-decoration:underline;text-underline-offset:3px;font-weight:600;font-size:16px;">${escapeHtml(item.title)}</a>`
            : `<span style="color:${design.textColor};font-weight:600;font-size:16px;">${escapeHtml(item.title)}</span>`;
          const sourceMarkup = item.source.trim()
            ? `<span style="color:${design.mutedColor};font-size:13px;"> · ${escapeHtml(item.source)}</span>`
            : '';
          return `
            <tr>
              <td style="padding:12px 0;border-top:1px solid ${design.borderColor};">
                <div style="font-family:${fonts.body};line-height:1.45;">
                  ${titleMarkup}${sourceMarkup}
                </div>
                ${
                  item.note.trim()
                    ? `<p style="margin:6px 0 0 0;font-family:${fonts.body};font-size:14px;line-height:1.6;color:${design.mutedColor};">${escapeHtml(item.note)}</p>`
                    : ''
                }
              </td>
            </tr>`;
        })
        .join('');
      return `
        <tr>
          <td style="padding:18px 0;">
            ${headingHtml}
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              ${rows}
            </table>
          </td>
        </tr>`;
    }

    case 'callout': {
      return `
        <tr>
          <td style="padding:16px 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${design.surfaceColor};border:1px solid ${design.borderColor};border-radius:6px;">
              <tr>
                <td style="padding:20px 24px;">
                  ${
                    block.title.trim()
                      ? `<p style="margin:0 0 8px 0;font-family:${fonts.heading};font-size:17px;font-weight:600;color:${design.textColor};">${escapeHtml(block.title)}</p>`
                      : ''
                  }
                  <p style="margin:0;font-family:${fonts.body};font-size:15px;line-height:1.65;color:${design.mutedColor};">
                    ${renderInlineMarkdownToHtml(block.body, design.accentColor)}
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>`;
    }

    case 'button': {
      const safeUrl = sanitizeUrl(block.url) || '#';
      const isSolid = block.variant === 'solid';
      const btnStyles = isSolid
        ? `background-color:${design.accentColor};color:#FFFFFF;border:1px solid ${design.accentColor};`
        : `background-color:transparent;color:${design.accentColor};border:1px solid ${design.accentColor};`;
      return `
        <tr>
          <td align="${block.alignment}" style="padding:18px 0;">
            <a href="${escapeHtml(safeUrl)}" style="display:inline-block;padding:12px 24px;font-family:${fonts.body};font-size:14px;font-weight:600;text-decoration:none;border-radius:6px;${btnStyles}">
              ${escapeHtml(block.label)}
            </a>
          </td>
        </tr>`;
    }

    case 'metrics': {
      const colWidth = Math.floor(100 / Math.max(block.items.length, 1));
      const cells = block.items
        .map(
          (item) => `
          <td width="${colWidth}%" valign="top" style="padding:14px 12px;border-top:1px solid ${design.borderColor};border-bottom:1px solid ${design.borderColor};">
            <div style="font-family:${fonts.heading};font-size:26px;font-weight:600;color:${design.textColor};line-height:1.15;">${escapeHtml(item.value)}</div>
            <div style="margin-top:4px;font-family:${fonts.body};font-size:13px;font-weight:600;color:${design.textColor};">${escapeHtml(item.label)}</div>
            ${
              item.detail.trim()
                ? `<div style="margin-top:2px;font-family:${fonts.body};font-size:12px;color:${design.mutedColor};">${escapeHtml(item.detail)}</div>`
                : ''
            }
          </td>`
        )
        .join('');
      return `
        <tr>
          <td style="padding:18px 0;">
            ${
              block.heading.trim()
                ? `<p style="margin:0 0 12px 0;font-family:${fonts.body};font-size:12px;letter-spacing:0.06em;text-transform:uppercase;color:${design.mutedColor};">${escapeHtml(block.heading)}</p>`
                : ''
            }
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>${cells}</tr>
            </table>
          </td>
        </tr>`;
    }

    case 'divider': {
      if (block.style === 'space') {
        return `<tr><td style="height:28px;line-height:28px;font-size:1px;">&nbsp;</td></tr>`;
      }
      if (block.style === 'dinkus') {
        return `
          <tr>
            <td align="center" style="padding:20px 0;font-family:${fonts.heading};font-size:16px;letter-spacing:0.6em;color:${design.mutedColor};">
              * * *
            </td>
          </tr>`;
      }
      return `
        <tr>
          <td style="padding:18px 0;">
            <div style="height:1px;background-color:${design.borderColor};font-size:1px;line-height:1px;">&nbsp;</div>
          </td>
        </tr>`;
    }
  }
}

export function generateEmailHtml(issue: NewsletterIssue): string {
  const { design } = issue;
  const fonts = getFontStacks(design.typography);
  const headerAlign = design.headerLayout === 'masthead' ? 'center' : 'left';

  const headerMarkup =
    design.headerLayout === 'minimal'
      ? `
        <tr>
          <td style="padding:0 0 24px 0;border-bottom:1px solid ${design.borderColor};">
            <p style="margin:0 0 8px 0;font-family:${fonts.body};font-size:13px;color:${design.mutedColor};">
              ${escapeHtml(issue.publicationName)} · Issue ${escapeHtml(issue.issueNumber)} · ${escapeHtml(issue.publishDate)}
            </p>
            <h1 style="margin:0;font-family:${fonts.heading};font-size:30px;line-height:1.2;font-weight:600;color:${design.textColor};letter-spacing:-0.02em;">
              ${escapeHtml(issue.subject)}
            </h1>
          </td>
        </tr>`
      : `
        <tr>
          <td align="${headerAlign}" style="padding:0 0 26px 0;border-bottom:1px solid ${design.borderColor};">
            <p style="margin:0 0 10px 0;font-family:${fonts.body};font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:${design.mutedColor};">
              ${escapeHtml(issue.publicationName)} · Issue ${escapeHtml(issue.issueNumber)} · ${escapeHtml(issue.publishDate)}
            </p>
            <h1 style="margin:0 0 10px 0;font-family:${fonts.heading};font-size:34px;line-height:1.18;font-weight:600;color:${design.textColor};letter-spacing:-0.02em;">
              ${escapeHtml(issue.subject)}
            </h1>
            ${
              issue.preheader.trim()
                ? `<p style="margin:0 0 12px 0;font-family:${fonts.body};font-size:16px;line-height:1.5;color:${design.mutedColor};">${escapeHtml(issue.preheader)}</p>`
                : ''
            }
            <p style="margin:0;font-family:${fonts.body};font-size:13px;color:${design.mutedColor};">
              By ${escapeHtml(issue.authorName)}
            </p>
          </td>
        </tr>`;

  const blocksHtml = issue.blocks.map((b) => blockToEmailHtml(b, issue)).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(issue.subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:#F4F4F5;color:${design.textColor};-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">
    ${escapeHtml(issue.preheader)}
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F4F4F5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:${design.maxWidth}px;background-color:${design.backgroundColor};border:1px solid ${design.borderColor};border-radius:4px;">
          <tr>
            <td style="padding:40px 32px 32px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${headerMarkup}
                <tr><td style="height:16px;line-height:16px;font-size:1px;">&nbsp;</td></tr>
                ${blocksHtml}
                <tr>
                  <td style="padding:32px 0 0 0;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${design.borderColor};">
                      <tr>
                        <td style="padding:20px 0 0 0;font-family:${fonts.body};font-size:12px;line-height:1.6;color:${design.mutedColor};text-align:${headerAlign};">
                          <p style="margin:0 0 6px 0;">${escapeHtml(issue.footerNote)}</p>
                          <p style="margin:0 0 8px 0;">${escapeHtml(issue.addressLine)}</p>
                          <a href="#unsubscribe" style="color:${design.mutedColor};text-decoration:underline;">${escapeHtml(issue.unsubscribeLabel)}</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function generateMarkdown(issue: NewsletterIssue): string {
  const lines: string[] = [
    `# ${issue.subject}`,
    `_${issue.publicationName} · Issue ${issue.issueNumber} · ${issue.publishDate} · By ${issue.authorName}_`,
    '',
  ];

  if (issue.preheader.trim()) {
    lines.push(`> ${issue.preheader}`, '');
  }

  for (const block of issue.blocks) {
    switch (block.type) {
      case 'heading':
        if (block.kicker.trim()) lines.push(`_${block.kicker}_`);
        lines.push(`${block.level === 2 ? '##' : '###'} ${block.text}`, '');
        break;
      case 'paragraph':
        lines.push(block.text, '');
        break;
      case 'image':
        lines.push(`![${block.alt}](${block.src})`);
        if (block.caption.trim()) lines.push(`*${block.caption}*`);
        lines.push('');
        break;
      case 'quote':
        lines.push(`> "${block.text}"`);
        if (block.attribution.trim()) lines.push(`> — ${block.attribution}`);
        lines.push('');
        break;
      case 'links':
        if (block.heading.trim()) lines.push(`### ${block.heading}`, '');
        for (const item of block.items) {
          const source = item.source.trim() ? ` (${item.source})` : '';
          lines.push(`- **[${item.title}](${item.url})**${source}${item.note.trim() ? ` — ${item.note}` : ''}`);
        }
        lines.push('');
        break;
      case 'callout':
        lines.push(`**${block.title}**`, block.body, '');
        break;
      case 'button':
        lines.push(`[${block.label}](${block.url})`, '');
        break;
      case 'metrics':
        if (block.heading.trim()) lines.push(`### ${block.heading}`, '');
        for (const item of block.items) {
          lines.push(`- **${item.value}** — ${item.label}${item.detail ? ` (${item.detail})` : ''}`);
        }
        lines.push('');
        break;
      case 'divider':
        lines.push(block.style === 'dinkus' ? '* * *' : '---', '');
        break;
    }
  }

  lines.push('---', issue.footerNote, issue.addressLine);
  return lines.join('\n').trim() + '\n';
}

export function generatePlainText(issue: NewsletterIssue): string {
  const stripMd = (s: string) =>
    s
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/`([^`]+)`/g, '$1');

  const lines: string[] = [
    `${issue.publicationName.toUpperCase()} — ISSUE ${issue.issueNumber}`,
    issue.publishDate,
    '',
    issue.subject,
    '='.repeat(Math.min(issue.subject.length || 24, 60)),
    '',
  ];

  if (issue.preheader.trim()) {
    lines.push(issue.preheader, '');
  }

  for (const block of issue.blocks) {
    switch (block.type) {
      case 'heading':
        if (block.kicker.trim()) lines.push(block.kicker.toUpperCase());
        lines.push(block.text, '-'.repeat(Math.min(block.text.length || 16, 48)), '');
        break;
      case 'paragraph':
        lines.push(stripMd(block.text), '');
        break;
      case 'image':
        lines.push(`[Image: ${block.alt || 'Untitled'}]`);
        if (block.caption.trim()) lines.push(block.caption);
        lines.push('');
        break;
      case 'quote':
        lines.push(`"${block.text}"`);
        if (block.attribution.trim()) lines.push(`  — ${block.attribution}`);
        lines.push('');
        break;
      case 'links':
        if (block.heading.trim()) lines.push(block.heading.toUpperCase(), '');
        for (const item of block.items) {
          lines.push(`* ${item.title}${item.source ? ` (${item.source})` : ''}`);
          lines.push(`  ${item.url}`);
          if (item.note.trim()) lines.push(`  ${item.note}`);
          lines.push('');
        }
        break;
      case 'callout':
        lines.push(`[ ${block.title || 'NOTE'} ]`, stripMd(block.body), '');
        break;
      case 'button':
        lines.push(`${block.label}: ${block.url}`, '');
        break;
      case 'metrics':
        if (block.heading.trim()) lines.push(block.heading.toUpperCase());
        for (const item of block.items) {
          lines.push(`* ${item.value} — ${item.label}${item.detail ? ` (${item.detail})` : ''}`);
        }
        lines.push('');
        break;
      case 'divider':
        lines.push(block.style === 'dinkus' ? '* * *' : '----------------------------------------', '');
        break;
    }
  }

  lines.push('----------------------------------------', issue.footerNote, issue.addressLine, issue.unsubscribeLabel);
  return lines.join('\n').trim() + '\n';
}

export function computeIssueStats(issue: NewsletterIssue): IssueStats {
  const textParts: string[] = [issue.subject, issue.preheader];
  let linkCount = 0;
  let imageCount = 0;

  for (const block of issue.blocks) {
    switch (block.type) {
      case 'heading':
        textParts.push(block.kicker, block.text);
        break;
      case 'paragraph':
        textParts.push(block.text);
        linkCount += (block.text.match(/\[[^\]]+\]\([^)]+\)/g) || []).length;
        break;
      case 'image':
        imageCount += 1;
        textParts.push(block.caption);
        break;
      case 'quote':
        textParts.push(block.text, block.attribution);
        break;
      case 'links':
        textParts.push(block.heading);
        for (const item of block.items) {
          linkCount += 1;
          textParts.push(item.title, item.note);
        }
        break;
      case 'callout':
        textParts.push(block.title, block.body);
        break;
      case 'button':
        linkCount += 1;
        textParts.push(block.label);
        break;
      case 'metrics':
        textParts.push(block.heading);
        for (const item of block.items) {
          textParts.push(item.value, item.label, item.detail);
        }
        break;
      case 'divider':
        break;
    }
  }

  const combined = textParts.join(' ').trim();
  const words = combined ? combined.split(/\s+/).filter(Boolean).length : 0;
  const readingMinutes = Math.max(1, Math.ceil(words / 215));
  const html = generateEmailHtml(issue);
  const htmlBytes = new TextEncoder().encode(html).length;

  return {
    wordCount: words,
    readingMinutes,
    blockCount: issue.blocks.length,
    linkCount,
    imageCount,
    htmlBytes,
  };
}

export function runEditorialChecks(issue: NewsletterIssue, stats: IssueStats): EditorialCheck[] {
  const checks: EditorialCheck[] = [];

  // 1. Subject line check
  const subjLen = issue.subject.trim().length;
  if (subjLen === 0) {
    checks.push({
      id: 'subject',
      label: 'Subject line',
      detail: 'Missing subject line.',
      status: 'fail',
    });
  } else if (subjLen > 60) {
    checks.push({
      id: 'subject',
      label: 'Subject line',
      detail: `${subjLen} chars — may truncate on mobile inboxes (aim for ≤ 55).`,
      status: 'warn',
    });
  } else {
    checks.push({
      id: 'subject',
      label: 'Subject line',
      detail: `${subjLen} chars — fits cleanly on desktop and mobile.`,
      status: 'pass',
    });
  }

  // 2. Preheader check
  const preLen = issue.preheader.trim().length;
  if (preLen === 0) {
    checks.push({
      id: 'preheader',
      label: 'Preheader text',
      detail: 'Add a short preheader so email clients do not pull random body text.',
      status: 'warn',
    });
  } else if (preLen > 105) {
    checks.push({
      id: 'preheader',
      label: 'Preheader text',
      detail: `${preLen} chars — inbox preview will clip after ~90 characters.`,
      status: 'warn',
    });
  } else {
    checks.push({
      id: 'preheader',
      label: 'Preheader text',
      detail: `${preLen} chars — concise inbox preview.`,
      status: 'pass',
    });
  }

  // 3. Image alt text check
  const images = issue.blocks.filter((b): b is Extract<NewsletterBlock, { type: 'image' }> => b.type === 'image');
  const missingAlt = images.filter((img) => !img.alt.trim()).length;
  checks.push({
    id: 'alt-text',
    label: 'Image alt descriptions',
    detail:
      images.length === 0
        ? 'No images in this issue.'
        : missingAlt === 0
        ? `All ${images.length} image${images.length > 1 ? 's have' : ' has'} descriptive alt text.`
        : `${missingAlt} of ${images.length} image${images.length > 1 ? 's are' : ' is'} missing alt text.`,
    status: missingAlt > 0 ? 'warn' : 'pass',
  });

  // 4. Link URL validity
  const urls: string[] = [];
  for (const b of issue.blocks) {
    if (b.type === 'button') urls.push(b.url);
    if (b.type === 'links') b.items.forEach((item) => urls.push(item.url));
  }
  const invalidUrls = urls.filter((u) => !sanitizeUrl(u)).length;
  checks.push({
    id: 'links',
    label: 'Link formatting',
    detail:
      urls.length === 0
        ? 'No standalone links or buttons yet.'
        : invalidUrls === 0
        ? `All ${urls.length} link URLs use valid https:// or mailto: schemes.`
        : `${invalidUrls} link${invalidUrls > 1 ? 's need' : ' needs'} a full https:// URL.`,
    status: invalidUrls > 0 ? 'fail' : 'pass',
  });

  // 5. Gmail 102KB clipping limit
  const kb = stats.htmlBytes / 1024;
  checks.push({
    id: 'clip-size',
    label: 'Gmail message weight',
    detail:
      kb < 85
        ? `${kb.toFixed(1)} KB — safely under Gmail’s 102 KB clipping threshold.`
        : kb <= 102
        ? `${kb.toFixed(1)} KB — approaching Gmail’s 102 KB clipping limit.`
        : `${kb.toFixed(1)} KB — exceeds 102 KB and will clip in Gmail.`,
    status: kb > 102 ? 'fail' : kb >= 85 ? 'warn' : 'pass',
  });

  // 6. Compliance footer
  const hasFooter = issue.addressLine.trim().length > 0 && issue.unsubscribeLabel.trim().length > 0;
  checks.push({
    id: 'footer',
    label: 'Compliance footer',
    detail: hasFooter
      ? 'Physical mailing address and unsubscribe link text included.'
      : 'Add a mailing address and unsubscribe copy in the Envelope tab.',
    status: hasFooter ? 'pass' : 'warn',
  });

  return checks;
}
