import { jsPDF } from 'jspdf';
import { CoverLetterDocument, ResumeDocument } from '../types/resume';
import { formatDisplayUrl } from './storage';

function hexToRgb(hex: string): [number, number, number] {
  const cleaned = hex.replace('#', '');
  if (cleaned.length !== 6) return [30, 58, 95];
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  return [isNaN(r) ? 30 : r, isNaN(g) ? 58 : g, isNaN(b) ? 95 : b];
}

function getPdfFont(fontFamily: string): 'helvetica' | 'times' | 'courier' {
  if (fontFamily === 'Lora' || fontFamily === 'Merriweather' || fontFamily === 'Playfair Display') {
    return 'times';
  }
  if (fontFamily === 'IBM Plex Mono') {
    return 'courier';
  }
  return 'helvetica';
}

function getBulletGlyph(style: string): string {
  switch (style) {
    case 'square':
      return '▪';
    case 'dash':
      return '–';
    case 'arrow':
      return '›';
    default:
      return '•';
  }
}

export function exportResumeToPdf(resume: ResumeDocument): void {
  const isA4 = resume.design.pageSize === 'A4';
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: isA4 ? 'a4' : 'letter',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginMap = { narrow: 34, normal: 46, wide: 58 };
  const margin = marginMap[resume.design.pageMargins] || 46;
  const contentWidth = pageWidth - margin * 2;
  const bottomLimit = pageHeight - margin - 14;

  const font = getPdfFont(resume.design.fontFamily);
  const baseSize = Math.max(8.5, Math.min(11.5, resume.design.baseFontSize));
  const lineStep = baseSize * resume.design.lineHeight;
  const sectionGap =
    resume.design.sectionSpacing === 'compact'
      ? 11
      : resume.design.sectionSpacing === 'airy'
        ? 20
        : 15;
  const [ar, ag, ab] = hexToRgb(resume.design.accentColor);
  const bulletGlyph = getBulletGlyph(resume.design.bulletStyle);

  let y = margin;

  const ensureSpace = (needed: number) => {
    if (y + needed > bottomLimit) {
      doc.addPage();
      y = margin;
    }
  };

  const drawHeader = () => {
    const isBanner = resume.design.templateId === 'senior-manager';
    const isCentered =
      resume.design.headerAlignment === 'center' ||
      resume.design.templateId === 'corporate-executive' ||
      resume.design.templateId === 'academic-resume';

    const contactParts = [
      resume.personal.email,
      resume.personal.phone,
      resume.personal.location,
      resume.personal.linkedin ? formatDisplayUrl(resume.personal.linkedin) : '',
      resume.personal.portfolio ? formatDisplayUrl(resume.personal.portfolio) : '',
    ].filter(Boolean);

    if (isBanner) {
      doc.setFillColor(ar, ag, ab);
      doc.rect(0, 0, pageWidth, 88, 'F');
      doc.setFont(font, 'bold');
      doc.setFontSize(baseSize * 2.1);
      doc.setTextColor(255, 255, 255);
      doc.text(resume.personal.fullName || 'Your Name', margin, 38);

      if (resume.personal.jobTitle) {
        doc.setFont(font, 'normal');
        doc.setFontSize(baseSize * 1.15);
        doc.setTextColor(235, 240, 248);
        doc.text(resume.personal.jobTitle, margin, 56);
      }

      if (contactParts.length > 0) {
        doc.setFontSize(baseSize * 0.85);
        doc.setTextColor(225, 232, 242);
        const contactLine = doc.splitTextToSize(contactParts.join('  |  '), contentWidth);
        doc.text(contactLine, margin, 73);
      }
      y = 108;
      return;
    }

    const align = isCentered ? 'center' : 'left';
    const anchorX = isCentered ? pageWidth / 2 : margin;

    doc.setFont(font, 'bold');
    doc.setFontSize(baseSize * 2.1);
    doc.setTextColor(17, 24, 39);
    doc.text(resume.personal.fullName || 'Your Name', anchorX, y + 16, { align });
    y += baseSize * 2.1 + 4;

    if (resume.personal.jobTitle) {
      doc.setFont(font, 'normal');
      doc.setFontSize(baseSize * 1.15);
      doc.setTextColor(ar, ag, ab);
      doc.text(resume.personal.jobTitle, anchorX, y + 4, { align });
      y += baseSize * 1.3 + 4;
    }

    if (contactParts.length > 0) {
      doc.setFont(font, 'normal');
      doc.setFontSize(baseSize * 0.88);
      doc.setTextColor(75, 85, 99);
      const lines = doc.splitTextToSize(contactParts.join('  •  '), contentWidth);
      doc.text(lines, anchorX, y + 2, { align });
      y += lines.length * (baseSize * 1.15) + 6;
    }

    if (resume.design.dividerStyle !== 'none') {
      doc.setDrawColor(ar, ag, ab);
      doc.setLineWidth(resume.design.dividerStyle === 'bold' ? 1.8 : 0.8);
      doc.line(margin, y, pageWidth - margin, y);
      y += 12;
    } else {
      y += 6;
    }
  };

  const drawSectionHeading = (title: string) => {
    ensureSpace(34);
    y += sectionGap * 0.6;
    doc.setFont(font, 'bold');
    doc.setFontSize(baseSize * resume.design.headingScale * 0.92);
    doc.setTextColor(ar, ag, ab);
    doc.text(title.toUpperCase(), margin, y);
    y += 5;

    if (resume.design.dividerStyle !== 'none') {
      doc.setDrawColor(ar, ag, ab);
      doc.setLineWidth(resume.design.dividerStyle === 'bold' ? 1.3 : 0.6);
      if (resume.design.dividerStyle === 'dotted') {
        doc.setLineDashPattern([2, 2], 0);
      } else {
        doc.setLineDashPattern([], 0);
      }
      doc.line(margin, y, pageWidth - margin, y);
      doc.setLineDashPattern([], 0);
    }
    y += 12;
  };

  const drawWrappedText = (
    text: string,
    x: number,
    width: number,
    options?: { bold?: boolean; italic?: boolean; size?: number; color?: [number, number, number] },
  ) => {
    const sz = options?.size || baseSize;
    const style = options?.bold ? 'bold' : options?.italic ? 'italic' : 'normal';
    const [r, g, b] = options?.color || [31, 41, 55];
    doc.setFont(font, style);
    doc.setFontSize(sz);
    doc.setTextColor(r, g, b);
    const lines: string[] = doc.splitTextToSize(text, width);
    for (const line of lines) {
      ensureSpace(lineStep);
      doc.text(line, x, y);
      y += sz * resume.design.lineHeight;
    }
  };

  const drawBullet = (text: string) => {
    const clean = text.trim();
    if (!clean) return;
    doc.setFont(font, 'normal');
    doc.setFontSize(baseSize);
    doc.setTextColor(31, 41, 55);
    const indent = 12;
    const lines: string[] = doc.splitTextToSize(clean, contentWidth - indent);
    ensureSpace(lines.length * lineStep);
    doc.text(bulletGlyph, margin + 2, y);
    for (const line of lines) {
      ensureSpace(lineStep);
      doc.text(line, margin + indent, y);
      y += lineStep;
    }
  };

  drawHeader();

  for (const sec of resume.sections) {
    if (!sec.visible || sec.id === 'personal') continue;

    if (sec.id === 'summary' && resume.summary.trim()) {
      drawSectionHeading(sec.title);
      drawWrappedText(resume.summary.trim(), margin, contentWidth);
    }

    if (sec.id === 'experience' && resume.experience.length > 0) {
      drawSectionHeading(sec.title);
      for (const exp of resume.experience) {
        ensureSpace(36);
        doc.setFont(font, 'bold');
        doc.setFontSize(baseSize * 1.06);
        doc.setTextColor(17, 24, 39);
        doc.text(exp.role || 'Role', margin, y);

        const dateLabel = [exp.startDate, exp.current ? 'Present' : exp.endDate]
          .filter(Boolean)
          .join(' – ');
        if (dateLabel) {
          doc.setFont(font, 'normal');
          doc.setFontSize(baseSize * 0.9);
          doc.setTextColor(100, 116, 139);
          doc.text(dateLabel, pageWidth - margin, y, { align: 'right' });
        }
        y += baseSize * 1.25;

        const companyLine = [exp.company, exp.location].filter(Boolean).join(' · ');
        if (companyLine) {
          doc.setFont(font, 'italic');
          doc.setFontSize(baseSize * 0.96);
          doc.setTextColor(71, 85, 105);
          doc.text(companyLine, margin, y);
          y += baseSize * 1.3;
        }

        for (const bullet of exp.bullets) {
          drawBullet(bullet);
        }
        y += 6;
      }
    }

    if (sec.id === 'education' && resume.education.length > 0) {
      drawSectionHeading(sec.title);
      for (const edu of resume.education) {
        ensureSpace(32);
        const degreeTitle = [edu.degree, edu.field].filter(Boolean).join(' in ');
        doc.setFont(font, 'bold');
        doc.setFontSize(baseSize * 1.04);
        doc.setTextColor(17, 24, 39);
        doc.text(degreeTitle || edu.institution || 'Education', margin, y);

        const dateLabel = [edu.startDate, edu.endDate].filter(Boolean).join(' – ');
        if (dateLabel) {
          doc.setFont(font, 'normal');
          doc.setFontSize(baseSize * 0.9);
          doc.setTextColor(100, 116, 139);
          doc.text(dateLabel, pageWidth - margin, y, { align: 'right' });
        }
        y += baseSize * 1.25;

        const instLine = [edu.institution, edu.location, edu.gpa ? `GPA: ${edu.gpa}` : '']
          .filter(Boolean)
          .join(' · ');
        if (instLine) {
          drawWrappedText(instLine, margin, contentWidth, { italic: true, size: baseSize * 0.94, color: [71, 85, 105] });
        }
        if (edu.highlights.trim()) {
          drawWrappedText(edu.highlights.trim(), margin, contentWidth, { size: baseSize * 0.94 });
        }
        y += 5;
      }
    }

    if (sec.id === 'skills') {
      const hasSkills =
        resume.skills.technical.length > 0 ||
        resume.skills.tools.length > 0 ||
        resume.skills.soft.length > 0;
      if (hasSkills) {
        drawSectionHeading(sec.title);
        const groups: Array<[string, string[]]> = [
          ['Technical', resume.skills.technical],
          ['Tools & Platforms', resume.skills.tools],
          ['Soft Skills', resume.skills.soft],
        ];
        for (const [label, items] of groups) {
          if (items.length === 0) continue;
          drawWrappedText(`${label}: ${items.join(', ')}`, margin, contentWidth);
          y += 2;
        }
      }
    }

    if (sec.id === 'projects' && resume.projects.length > 0) {
      drawSectionHeading(sec.title);
      for (const proj of resume.projects) {
        ensureSpace(32);
        doc.setFont(font, 'bold');
        doc.setFontSize(baseSize * 1.04);
        doc.setTextColor(17, 24, 39);
        doc.text(proj.name || 'Project', margin, y);

        const dateLabel = [proj.startDate, proj.endDate].filter(Boolean).join(' – ');
        if (dateLabel) {
          doc.setFont(font, 'normal');
          doc.setFontSize(baseSize * 0.9);
          doc.setTextColor(100, 116, 139);
          doc.text(dateLabel, pageWidth - margin, y, { align: 'right' });
        }
        y += baseSize * 1.25;

        const meta = [proj.role, proj.technologies.join(', '), proj.link ? formatDisplayUrl(proj.link) : '']
          .filter(Boolean)
          .join(' · ');
        if (meta) {
          drawWrappedText(meta, margin, contentWidth, { italic: true, size: baseSize * 0.92, color: [71, 85, 105] });
        }
        if (proj.description.trim()) {
          drawWrappedText(proj.description.trim(), margin, contentWidth);
        }
        for (const h of proj.highlights) {
          drawBullet(h);
        }
        y += 5;
      }
    }

    if (sec.id === 'certifications' && resume.certifications.length > 0) {
      drawSectionHeading(sec.title);
      for (const cert of resume.certifications) {
        ensureSpace(20);
        const line = [cert.name, cert.issuer, cert.credentialId ? `ID: ${cert.credentialId}` : '']
          .filter(Boolean)
          .join(' · ');
        doc.setFont(font, 'bold');
        doc.setFontSize(baseSize);
        doc.setTextColor(17, 24, 39);
        const split = doc.splitTextToSize(line, contentWidth - 70);
        doc.text(split, margin, y);
        if (cert.date) {
          doc.setFont(font, 'normal');
          doc.setFontSize(baseSize * 0.9);
          doc.setTextColor(100, 116, 139);
          doc.text(cert.date, pageWidth - margin, y, { align: 'right' });
        }
        y += split.length * lineStep + 3;
      }
    }

    if (sec.id === 'languages' && resume.languages.length > 0) {
      drawSectionHeading(sec.title);
      const langLine = resume.languages.map((l) => `${l.name} (${l.proficiency})`).join('  •  ');
      drawWrappedText(langLine, margin, contentWidth);
    }

    if (sec.id === 'achievements' && resume.achievements.length > 0) {
      drawSectionHeading(sec.title);
      for (const ach of resume.achievements) {
        ensureSpace(24);
        const titleLine = [ach.title, ach.issuer].filter(Boolean).join(' · ');
        doc.setFont(font, 'bold');
        doc.setFontSize(baseSize);
        doc.setTextColor(17, 24, 39);
        doc.text(titleLine, margin, y);
        if (ach.date) {
          doc.setFont(font, 'normal');
          doc.setFontSize(baseSize * 0.9);
          doc.setTextColor(100, 116, 139);
          doc.text(ach.date, pageWidth - margin, y, { align: 'right' });
        }
        y += baseSize * 1.25;
        if (ach.description.trim()) {
          drawWrappedText(ach.description.trim(), margin, contentWidth);
        }
        y += 4;
      }
    }

    if (sec.id.startsWith('custom:')) {
      const customId = sec.id.replace('custom:', '');
      const custom = resume.customSections.find((c) => c.id === customId);
      if (custom && custom.items.length > 0) {
        drawSectionHeading(sec.title || custom.title);
        for (const item of custom.items) {
          ensureSpace(28);
          doc.setFont(font, 'bold');
          doc.setFontSize(baseSize * 1.03);
          doc.setTextColor(17, 24, 39);
          doc.text(item.heading || 'Entry', margin, y);
          if (item.date) {
            doc.setFont(font, 'normal');
            doc.setFontSize(baseSize * 0.9);
            doc.setTextColor(100, 116, 139);
            doc.text(item.date, pageWidth - margin, y, { align: 'right' });
          }
          y += baseSize * 1.25;
          if (item.subheading) {
            drawWrappedText(item.subheading, margin, contentWidth, {
              italic: true,
              size: baseSize * 0.94,
              color: [71, 85, 105],
            });
          }
          if (item.description) {
            drawWrappedText(item.description, margin, contentWidth);
          }
          for (const b of item.bullets) {
            drawBullet(b);
          }
          y += 5;
        }
      }
    }
  }

  // Page numbers when multi-page
  const totalPages = doc.getNumberOfPages();
  if (totalPages > 1) {
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFont(font, 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(148, 163, 184);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 20, { align: 'center' });
    }
  }

  const safeName = (resume.personal.fullName || resume.title || 'resume')
    .replace(/[^a-z0-9-_ ]/gi, '')
    .trim()
    .replace(/\s+/g, '_');
  doc.save(`${safeName || 'Aivora_Resume'}.pdf`);
}

export function exportCoverLetterToPdf(
  coverLetter: CoverLetterDocument,
  resume: ResumeDocument,
): void {
  const isA4 = resume.design.pageSize === 'A4';
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: isA4 ? 'a4' : 'letter',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 56;
  const contentWidth = pageWidth - margin * 2;
  const font = getPdfFont(resume.design.fontFamily);
  const [ar, ag, ab] = hexToRgb(resume.design.accentColor);

  let y = margin;

  // Sender header
  doc.setFont(font, 'bold');
  doc.setFontSize(18);
  doc.setTextColor(17, 24, 39);
  doc.text(resume.personal.fullName || 'Your Name', margin, y);
  y += 18;

  const contact = [resume.personal.email, resume.personal.phone, resume.personal.location]
    .filter(Boolean)
    .join('  •  ');
  if (contact) {
    doc.setFont(font, 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(100, 116, 139);
    doc.text(contact, margin, y);
    y += 12;
  }

  doc.setDrawColor(ar, ag, ab);
  doc.setLineWidth(1);
  doc.line(margin, y, pageWidth - margin, y);
  y += 26;

  // Date & Recipient
  doc.setFont(font, 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(55, 65, 81);
  doc.text(
    new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    margin,
    y,
  );
  y += 22;

  if (coverLetter.hiringManager) {
    doc.text(coverLetter.hiringManager, margin, y);
    y += 15;
  }
  if (coverLetter.companyName) {
    doc.setFont(font, 'bold');
    doc.text(coverLetter.companyName, margin, y);
    y += 20;
  }

  if (coverLetter.subjectLine) {
    doc.setFont(font, 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(ar, ag, ab);
    const subjLines = doc.splitTextToSize(`Re: ${coverLetter.subjectLine}`, contentWidth);
    doc.text(subjLines, margin, y);
    y += subjLines.length * 15 + 12;
  }

  doc.setFont(font, 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(31, 41, 55);
  doc.text(coverLetter.salutation || 'Dear Hiring Manager,', margin, y);
  y += 22;

  for (const para of coverLetter.paragraphs) {
    const lines: string[] = doc.splitTextToSize(para, contentWidth);
    for (const line of lines) {
      if (y > pageHeight - margin - 20) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += 15.5;
    }
    y += 10;
  }

  y += 8;
  doc.text(coverLetter.signOff || 'Sincerely,', margin, y);
  y += 20;
  doc.setFont(font, 'bold');
  doc.text(resume.personal.fullName || 'Your Name', margin, y);

  const safeCompany = (coverLetter.companyName || 'Cover_Letter')
    .replace(/[^a-z0-9-_ ]/gi, '')
    .trim()
    .replace(/\s+/g, '_');
  doc.save(`Cover_Letter_${safeCompany || 'Aivora'}.pdf`);
}
