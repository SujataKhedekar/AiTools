import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  Paragraph,
  TabStopPosition,
  TabStopType,
  TextRun,
} from 'docx';
import { CoverLetterDocument, ResumeDocument } from '../types/resume';
import { formatDisplayUrl } from './storage';

function cleanHex(hex: string): string {
  const c = hex.replace('#', '').toUpperCase();
  return /^[0-9A-F]{6}$/.test(c) ? c : '1E3A5F';
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function exportResumeToDocx(resume: ResumeDocument): Promise<void> {
  const accent = cleanHex(resume.design.accentColor);
  const isA4 = resume.design.pageSize === 'A4';
  const marginTwips =
    resume.design.pageMargins === 'narrow'
      ? 720
      : resume.design.pageMargins === 'wide'
        ? 1260
        : 960;

  const baseHalfPt = Math.round(resume.design.baseFontSize * 2);
  const font = resume.design.fontFamily === 'IBM Plex Mono' ? 'Consolas' : 'Calibri';

  const children: Paragraph[] = [];

  const headerAlign =
    resume.design.headerAlignment === 'center' ||
    resume.design.templateId === 'corporate-executive' ||
    resume.design.templateId === 'academic-resume'
      ? AlignmentType.CENTER
      : AlignmentType.LEFT;

  // Name
  children.push(
    new Paragraph({
      alignment: headerAlign,
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: resume.personal.fullName || 'Your Name',
          bold: true,
          size: Math.round(baseHalfPt * 2.0),
          color: '111827',
          font,
        }),
      ],
    }),
  );

  // Job Title
  if (resume.personal.jobTitle) {
    children.push(
      new Paragraph({
        alignment: headerAlign,
        spacing: { after: 80 },
        children: [
          new TextRun({
            text: resume.personal.jobTitle,
            size: Math.round(baseHalfPt * 1.15),
            color: accent,
            font,
          }),
        ],
      }),
    );
  }

  // Contact line
  const contactParts = [
    resume.personal.email,
    resume.personal.phone,
    resume.personal.location,
    resume.personal.linkedin ? formatDisplayUrl(resume.personal.linkedin) : '',
    resume.personal.portfolio ? formatDisplayUrl(resume.personal.portfolio) : '',
  ].filter(Boolean);

  if (contactParts.length > 0) {
    children.push(
      new Paragraph({
        alignment: headerAlign,
        spacing: { after: 180 },
        border:
          resume.design.dividerStyle !== 'none'
            ? {
                bottom: {
                  color: accent,
                  space: 6,
                  style: BorderStyle.SINGLE,
                  size: resume.design.dividerStyle === 'bold' ? 12 : 6,
                },
              }
            : undefined,
        children: [
          new TextRun({
            text: contactParts.join('  •  '),
            size: Math.max(16, baseHalfPt - 2),
            color: '4B5563',
            font,
          }),
        ],
      }),
    );
  }

  const addSectionHeading = (title: string) => {
    children.push(
      new Paragraph({
        spacing: { before: 200, after: 90 },
        border:
          resume.design.dividerStyle !== 'none'
            ? {
                bottom: {
                  color: accent,
                  space: 4,
                  style:
                    resume.design.dividerStyle === 'dotted'
                      ? BorderStyle.DOTTED
                      : BorderStyle.SINGLE,
                  size: resume.design.dividerStyle === 'bold' ? 10 : 4,
                },
              }
            : undefined,
        children: [
          new TextRun({
            text: title.toUpperCase(),
            bold: true,
            size: Math.round(baseHalfPt * 1.15),
            color: accent,
            font,
          }),
        ],
      }),
    );
  };

  const addBulletParagraph = (text: string) => {
    if (!text.trim()) return;
    children.push(
      new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 55 },
        children: [
          new TextRun({
            text: text.trim(),
            size: baseHalfPt,
            color: '1F2937',
            font,
          }),
        ],
      }),
    );
  };

  for (const sec of resume.sections) {
    if (!sec.visible || sec.id === 'personal') continue;

    if (sec.id === 'summary' && resume.summary.trim()) {
      addSectionHeading(sec.title);
      children.push(
        new Paragraph({
          spacing: { after: 100 },
          children: [
            new TextRun({
              text: resume.summary.trim(),
              size: baseHalfPt,
              color: '1F2937',
              font,
            }),
          ],
        }),
      );
    }

    if (sec.id === 'experience' && resume.experience.length > 0) {
      addSectionHeading(sec.title);
      for (const exp of resume.experience) {
        const dateLabel = [exp.startDate, exp.current ? 'Present' : exp.endDate]
          .filter(Boolean)
          .join(' – ');
        children.push(
          new Paragraph({
            spacing: { before: 80, after: 25 },
            tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
            children: [
              new TextRun({
                text: exp.role || 'Role',
                bold: true,
                size: Math.round(baseHalfPt * 1.05),
                color: '111827',
                font,
              }),
              new TextRun({
                text: dateLabel ? `\t${dateLabel}` : '',
                size: Math.max(16, baseHalfPt - 2),
                color: '64748B',
                font,
              }),
            ],
          }),
        );

        const subline = [exp.company, exp.location].filter(Boolean).join(' · ');
        if (subline) {
          children.push(
            new Paragraph({
              spacing: { after: 55 },
              children: [
                new TextRun({
                  text: subline,
                  italics: true,
                  size: baseHalfPt,
                  color: '475569',
                  font,
                }),
              ],
            }),
          );
        }

        for (const bullet of exp.bullets) {
          addBulletParagraph(bullet);
        }
      }
    }

    if (sec.id === 'education' && resume.education.length > 0) {
      addSectionHeading(sec.title);
      for (const edu of resume.education) {
        const degreeTitle = [edu.degree, edu.field].filter(Boolean).join(' in ');
        const dateLabel = [edu.startDate, edu.endDate].filter(Boolean).join(' – ');
        children.push(
          new Paragraph({
            spacing: { before: 80, after: 25 },
            tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
            children: [
              new TextRun({
                text: degreeTitle || edu.institution,
                bold: true,
                size: Math.round(baseHalfPt * 1.05),
                color: '111827',
                font,
              }),
              new TextRun({
                text: dateLabel ? `\t${dateLabel}` : '',
                size: Math.max(16, baseHalfPt - 2),
                color: '64748B',
                font,
              }),
            ],
          }),
        );

        const inst = [edu.institution, edu.location, edu.gpa ? `GPA: ${edu.gpa}` : '']
          .filter(Boolean)
          .join(' · ');
        if (inst) {
          children.push(
            new Paragraph({
              spacing: { after: 40 },
              children: [
                new TextRun({
                  text: inst,
                  italics: true,
                  size: baseHalfPt,
                  color: '475569',
                  font,
                }),
              ],
            }),
          );
        }

        if (edu.highlights.trim()) {
          children.push(
            new Paragraph({
              spacing: { after: 60 },
              children: [
                new TextRun({
                  text: edu.highlights.trim(),
                  size: baseHalfPt,
                  color: '1F2937',
                  font,
                }),
              ],
            }),
          );
        }
      }
    }

    if (sec.id === 'skills') {
      const groups: Array<[string, string[]]> = [
        ['Technical', resume.skills.technical],
        ['Tools & Platforms', resume.skills.tools],
        ['Soft Skills', resume.skills.soft],
      ];
      if (groups.some(([, arr]) => arr.length > 0)) {
        addSectionHeading(sec.title);
        for (const [label, items] of groups) {
          if (items.length === 0) continue;
          children.push(
            new Paragraph({
              spacing: { after: 55 },
              children: [
                new TextRun({
                  text: `${label}: `,
                  bold: true,
                  size: baseHalfPt,
                  color: '111827',
                  font,
                }),
                new TextRun({
                  text: items.join(', '),
                  size: baseHalfPt,
                  color: '1F2937',
                  font,
                }),
              ],
            }),
          );
        }
      }
    }

    if (sec.id === 'projects' && resume.projects.length > 0) {
      addSectionHeading(sec.title);
      for (const proj of resume.projects) {
        const dateLabel = [proj.startDate, proj.endDate].filter(Boolean).join(' – ');
        children.push(
          new Paragraph({
            spacing: { before: 80, after: 25 },
            tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
            children: [
              new TextRun({
                text: proj.name || 'Project',
                bold: true,
                size: Math.round(baseHalfPt * 1.05),
                color: '111827',
                font,
              }),
              new TextRun({
                text: dateLabel ? `\t${dateLabel}` : '',
                size: Math.max(16, baseHalfPt - 2),
                color: '64748B',
                font,
              }),
            ],
          }),
        );
        const meta = [proj.role, proj.technologies.join(', '), proj.link ? formatDisplayUrl(proj.link) : '']
          .filter(Boolean)
          .join(' · ');
        if (meta) {
          children.push(
            new Paragraph({
              spacing: { after: 40 },
              children: [
                new TextRun({
                  text: meta,
                  italics: true,
                  size: baseHalfPt,
                  color: '475569',
                  font,
                }),
              ],
            }),
          );
        }
        if (proj.description.trim()) {
          children.push(
            new Paragraph({
              spacing: { after: 50 },
              children: [
                new TextRun({
                  text: proj.description.trim(),
                  size: baseHalfPt,
                  color: '1F2937',
                  font,
                }),
              ],
            }),
          );
        }
        for (const h of proj.highlights) {
          addBulletParagraph(h);
        }
      }
    }

    if (sec.id === 'certifications' && resume.certifications.length > 0) {
      addSectionHeading(sec.title);
      for (const cert of resume.certifications) {
        children.push(
          new Paragraph({
            spacing: { after: 50 },
            tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
            children: [
              new TextRun({
                text: cert.name,
                bold: true,
                size: baseHalfPt,
                color: '111827',
                font,
              }),
              new TextRun({
                text: cert.issuer ? ` · ${cert.issuer}` : '',
                size: baseHalfPt,
                color: '475569',
                font,
              }),
              new TextRun({
                text: cert.date ? `\t${cert.date}` : '',
                size: Math.max(16, baseHalfPt - 2),
                color: '64748B',
                font,
              }),
            ],
          }),
        );
      }
    }

    if (sec.id === 'languages' && resume.languages.length > 0) {
      addSectionHeading(sec.title);
      children.push(
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({
              text: resume.languages.map((l) => `${l.name} (${l.proficiency})`).join('  •  '),
              size: baseHalfPt,
              color: '1F2937',
              font,
            }),
          ],
        }),
      );
    }

    if (sec.id === 'achievements' && resume.achievements.length > 0) {
      addSectionHeading(sec.title);
      for (const ach of resume.achievements) {
        children.push(
          new Paragraph({
            spacing: { before: 60, after: 25 },
            tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
            children: [
              new TextRun({
                text: ach.title,
                bold: true,
                size: baseHalfPt,
                color: '111827',
                font,
              }),
              new TextRun({
                text: ach.issuer ? ` · ${ach.issuer}` : '',
                size: baseHalfPt,
                color: '475569',
                font,
              }),
              new TextRun({
                text: ach.date ? `\t${ach.date}` : '',
                size: Math.max(16, baseHalfPt - 2),
                color: '64748B',
                font,
              }),
            ],
          }),
        );
        if (ach.description.trim()) {
          children.push(
            new Paragraph({
              spacing: { after: 55 },
              children: [
                new TextRun({
                  text: ach.description.trim(),
                  size: baseHalfPt,
                  color: '1F2937',
                  font,
                }),
              ],
            }),
          );
        }
      }
    }

    if (sec.id.startsWith('custom:')) {
      const customId = sec.id.replace('custom:', '');
      const custom = resume.customSections.find((c) => c.id === customId);
      if (custom && custom.items.length > 0) {
        addSectionHeading(sec.title || custom.title);
        for (const item of custom.items) {
          children.push(
            new Paragraph({
              spacing: { before: 70, after: 25 },
              tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
              children: [
                new TextRun({
                  text: item.heading || 'Entry',
                  bold: true,
                  size: baseHalfPt,
                  color: '111827',
                  font,
                }),
                new TextRun({
                  text: item.date ? `\t${item.date}` : '',
                  size: Math.max(16, baseHalfPt - 2),
                  color: '64748B',
                  font,
                }),
              ],
            }),
          );
          if (item.subheading) {
            children.push(
              new Paragraph({
                spacing: { after: 35 },
                children: [
                  new TextRun({
                    text: item.subheading,
                    italics: true,
                    size: baseHalfPt,
                    color: '475569',
                    font,
                  }),
                ],
              }),
            );
          }
          if (item.description) {
            children.push(
              new Paragraph({
                spacing: { after: 45 },
                children: [
                  new TextRun({
                    text: item.description,
                    size: baseHalfPt,
                    color: '1F2937',
                    font,
                  }),
                ],
              }),
            );
          }
          for (const b of item.bullets) {
            addBulletParagraph(b);
          }
        }
      }
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: isA4
              ? { width: 11906, height: 16838 } // A4 in twips
              : { width: 12240, height: 15840 }, // Letter in twips
            margin: {
              top: marginTwips,
              bottom: marginTwips,
              left: marginTwips,
              right: marginTwips,
            },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const safeName = (resume.personal.fullName || resume.title || 'resume')
    .replace(/[^a-z0-9-_ ]/gi, '')
    .trim()
    .replace(/\s+/g, '_');
  triggerBlobDownload(blob, `${safeName || 'Aivora_Resume'}.docx`);
}

export async function exportCoverLetterToDocx(
  coverLetter: CoverLetterDocument,
  resume: ResumeDocument,
): Promise<void> {
  const accent = cleanHex(resume.design.accentColor);
  const font = 'Calibri';
  const children: Paragraph[] = [
    new Paragraph({
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: resume.personal.fullName || 'Your Name',
          bold: true,
          size: 36,
          color: '111827',
          font,
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 200 },
      border: {
        bottom: { color: accent, space: 6, style: BorderStyle.SINGLE, size: 6 },
      },
      children: [
        new TextRun({
          text: [resume.personal.email, resume.personal.phone, resume.personal.location]
            .filter(Boolean)
            .join('  •  '),
          size: 19,
          color: '64748B',
          font,
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 180 },
      children: [
        new TextRun({
          text: new Date().toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          }),
          size: 21,
          color: '374151',
          font,
        }),
      ],
    }),
  ];

  if (coverLetter.hiringManager) {
    children.push(
      new Paragraph({
        spacing: { after: 40 },
        children: [new TextRun({ text: coverLetter.hiringManager, size: 21, font })],
      }),
    );
  }
  if (coverLetter.companyName) {
    children.push(
      new Paragraph({
        spacing: { after: 140 },
        children: [new TextRun({ text: coverLetter.companyName, bold: true, size: 21, font })],
      }),
    );
  }
  if (coverLetter.subjectLine) {
    children.push(
      new Paragraph({
        spacing: { after: 160 },
        children: [
          new TextRun({
            text: `Re: ${coverLetter.subjectLine}`,
            bold: true,
            size: 21,
            color: accent,
            font,
          }),
        ],
      }),
    );
  }

  children.push(
    new Paragraph({
      spacing: { after: 160 },
      children: [
        new TextRun({ text: coverLetter.salutation || 'Dear Hiring Manager,', size: 21, font }),
      ],
    }),
  );

  for (const para of coverLetter.paragraphs) {
    children.push(
      new Paragraph({
        spacing: { after: 160 },
        children: [new TextRun({ text: para, size: 21, color: '1F2937', font })],
      }),
    );
  }

  children.push(
    new Paragraph({
      spacing: { before: 120, after: 120 },
      children: [new TextRun({ text: coverLetter.signOff || 'Sincerely,', size: 21, font })],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: resume.personal.fullName || 'Your Name',
          bold: true,
          size: 22,
          color: '111827',
          font,
        }),
      ],
    }),
  );

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const safeCompany = (coverLetter.companyName || 'Cover_Letter')
    .replace(/[^a-z0-9-_ ]/gi, '')
    .trim()
    .replace(/\s+/g, '_');
  triggerBlobDownload(blob, `Cover_Letter_${safeCompany || 'Aivora'}.docx`);
}
