import React, { useEffect, useRef, useState } from 'react';
import { Globe, Linkedin, Mail, MapPin, Phone } from 'lucide-react';
import { RESUME_TEMPLATES } from '../data/templates';
import { ResumeDocument, SectionConfig, TemplateId } from '../types/resume';
import { formatDisplayUrl, sanitizeExternalUrl } from '../utils/storage';

interface ResumePreviewProps {
  resume: ResumeDocument;
  templateOverride?: TemplateId;
  scale?: number;
  showPageGuides?: boolean;
  printId?: string;
}

const SIDEBAR_SECTIONS = new Set(['skills', 'education', 'certifications', 'languages', 'achievements']);

function getBulletMarker(style: ResumeDocument['design']['bulletStyle']): string {
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

export default function ResumePreview({
  resume,
  templateOverride,
  scale = 1,
  showPageGuides = true,
  printId,
}: ResumePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pageCount, setPageCount] = useState(1);

  const activeTemplateId = templateOverride || resume.design.templateId;
  const templateMeta =
    RESUME_TEMPLATES.find((t) => t.id === activeTemplateId) || RESUME_TEMPLATES[0];

  const isA4 = resume.design.pageSize === 'A4';
  // 96 DPI equivalent pixel dimensions for crisp live layout
  const pageWidthPx = isA4 ? 794 : 816;
  const pageHeightPx = isA4 ? 1123 : 1056;

  const isATSClassic = activeTemplateId === 'ats-classic';
  const effectiveLayout = isATSClassic
    ? 'single'
    : resume.design.layoutOverride === 'template'
      ? templateMeta.defaultLayout
      : resume.design.layoutOverride;

  const accent = isATSClassic
    ? '#111827'
    : templateOverride
      ? templateMeta.defaultAccent
      : resume.design.accentColor;

  const fontFamily = templateOverride ? templateMeta.defaultFont : resume.design.fontFamily;
  const baseFontSizePt = resume.design.baseFontSize;
  const baseFontPx = baseFontSizePt * 1.333;
  const headingPx = baseFontPx * resume.design.headingScale;
  const lineHeight = resume.design.lineHeight;
  const showIcons = !isATSClassic && resume.design.showIcons;
  const showPhoto = !isATSClassic && resume.design.showPhoto && Boolean(resume.personal.photoDataUrl);

  const paddingPx =
    resume.design.pageMargins === 'narrow'
      ? 32
      : resume.design.pageMargins === 'wide'
        ? 56
        : 44;

  const sectionGapPx =
    resume.design.sectionSpacing === 'compact'
      ? 14
      : resume.design.sectionSpacing === 'airy'
        ? 26
        : 20;

  const bulletGlyph = getBulletMarker(resume.design.bulletStyle);

  useEffect(() => {
    if (!showPageGuides || !containerRef.current) return;
    const el = containerRef.current;
    const measure = () => {
      const h = el.scrollHeight;
      setPageCount(Math.max(1, Math.ceil(h / pageHeightPx)));
    };
    measure();
    const obs = new ResizeObserver(measure);
    obs.observe(el);
    return () => obs.disconnect();
  }, [resume, activeTemplateId, pageHeightPx, showPageGuides]);

  const dividerBorderStyle = (): React.CSSProperties => {
    if (resume.design.dividerStyle === 'none') return { borderBottom: 'none' };
    if (resume.design.dividerStyle === 'bold') {
      return { borderBottom: `2px solid ${accent}` };
    }
    if (resume.design.dividerStyle === 'dotted') {
      return { borderBottom: `1px dotted ${accent}` };
    }
    return { borderBottom: `1px solid ${activeTemplateId === 'minimal-clean' ? '#CBD5E1' : `${accent}55`}` };
  };

  // Ordered sections; Fresher Resume prioritizes education & projects if user hasn't customized
  const orderedSections: SectionConfig[] = (() => {
    const visible = resume.sections.filter((s) => s.visible && s.id !== 'personal');
    if (activeTemplateId === 'fresher-resume' && templateOverride) {
      const priority = ['summary', 'education', 'projects', 'skills', 'experience'];
      return [...visible].sort((a, b) => {
        const ia = priority.indexOf(a.id);
        const ib = priority.indexOf(b.id);
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      });
    }
    if (activeTemplateId === 'academic-resume' && templateOverride) {
      const priority = ['summary', 'education', 'projects', 'certifications', 'achievements', 'experience'];
      return [...visible].sort((a, b) => {
        const ia = priority.indexOf(a.id);
        const ib = priority.indexOf(b.id);
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      });
    }
    return visible;
  })();

  const contactItems = [
    { key: 'email', icon: Mail, text: resume.personal.email, href: resume.personal.email ? `mailto:${resume.personal.email}` : null },
    { key: 'phone', icon: Phone, text: resume.personal.phone, href: null },
    { key: 'location', icon: MapPin, text: resume.personal.location, href: null },
    {
      key: 'linkedin',
      icon: Linkedin,
      text: resume.personal.linkedin ? formatDisplayUrl(resume.personal.linkedin) : '',
      href: sanitizeExternalUrl(resume.personal.linkedin),
    },
    {
      key: 'portfolio',
      icon: Globe,
      text: resume.personal.portfolio ? formatDisplayUrl(resume.personal.portfolio) : '',
      href: sanitizeExternalUrl(resume.personal.portfolio),
    },
  ].filter((c) => Boolean(c.text));

  const renderSectionTitle = (title: string, inverted = false) => {
    const isSerifHeading =
      activeTemplateId === 'corporate-executive' ||
      activeTemplateId === 'elegant-professional' ||
      activeTemplateId === 'academic-resume';

    const isTechHeading = activeTemplateId === 'technical-developer';

    return (
      <div
        className="mb-2.5 pb-1"
        style={
          inverted
            ? { borderBottom: '1px solid rgba(255,255,255,0.28)' }
            : activeTemplateId === 'corporate-executive'
              ? { borderBottom: `2px double ${accent}` }
              : dividerBorderStyle()
        }
      >
        <h2
          className="font-bold tracking-wider uppercase"
          style={{
            fontSize: `${Math.max(10.5, headingPx * 0.78)}px`,
            color: inverted ? '#FFFFFF' : activeTemplateId === 'minimal-clean' ? '#0F172A' : accent,
            fontFamily: isSerifHeading
              ? `'Playfair Display', 'Lora', Georgia, serif`
              : isTechHeading
                ? `'IBM Plex Mono', monospace`
                : `'${fontFamily}', sans-serif`,
            letterSpacing: isTechHeading ? '0.09em' : '0.08em',
          }}
        >
          {title}
        </h2>
      </div>
    );
  };

  const renderSectionBody = (sec: SectionConfig, inverted = false) => {
    const primaryText = inverted ? '#F8FAFC' : '#111827';
    const secondaryText = inverted ? '#CBD5E1' : '#475569';
    const mutedText = inverted ? '#94A3B8' : '#64748B';

    if (sec.id === 'summary') {
      if (!resume.summary.trim()) return null;
      return (
        <section key={sec.id} style={{ marginBottom: `${sectionGapPx}px` }}>
          {renderSectionTitle(sec.title, inverted)}
          <p style={{ color: primaryText, fontSize: `${baseFontPx}px`, lineHeight }}>
            {resume.summary}
          </p>
        </section>
      );
    }

    if (sec.id === 'experience') {
      if (resume.experience.length === 0) return null;
      return (
        <section key={sec.id} style={{ marginBottom: `${sectionGapPx}px` }}>
          {renderSectionTitle(sec.title, inverted)}
          <div className="space-y-3.5">
            {resume.experience.map((exp) => {
              const dateRange = [exp.startDate, exp.current ? 'Present' : exp.endDate]
                .filter(Boolean)
                .join(' – ');
              return (
                <div key={exp.id} className="break-inside-avoid">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3
                      className="font-semibold"
                      style={{ color: primaryText, fontSize: `${baseFontPx * 1.07}px` }}
                    >
                      {exp.role || 'Role Title'}
                    </h3>
                    {dateRange && (
                      <span
                        className="shrink-0 font-mono-tabular"
                        style={{ color: mutedText, fontSize: `${baseFontPx * 0.88}px` }}
                      >
                        {dateRange}
                      </span>
                    )}
                  </div>
                  <div
                    className="mb-1.5 font-medium"
                    style={{
                      color: inverted ? '#E2E8F0' : accent,
                      fontSize: `${baseFontPx * 0.96}px`,
                    }}
                  >
                    {[exp.company, exp.location].filter(Boolean).join(' · ')}
                  </div>
                  {exp.bullets.filter((b) => b.trim()).length > 0 && (
                    <ul className="space-y-1">
                      {exp.bullets
                        .filter((b) => b.trim())
                        .map((bullet, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2"
                            style={{ color: primaryText, fontSize: `${baseFontPx}px`, lineHeight }}
                          >
                            <span
                              className="shrink-0 select-none"
                              style={{ color: inverted ? '#E2E8F0' : accent }}
                            >
                              {bulletGlyph}
                            </span>
                            <span>{bullet}</span>
                          </li>
                        ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      );
    }

    if (sec.id === 'education') {
      if (resume.education.length === 0) return null;
      return (
        <section key={sec.id} style={{ marginBottom: `${sectionGapPx}px` }}>
          {renderSectionTitle(sec.title, inverted)}
          <div className="space-y-2.5">
            {resume.education.map((edu) => {
              const dateRange = [edu.startDate, edu.endDate].filter(Boolean).join(' – ');
              const title = [edu.degree, edu.field].filter(Boolean).join(' in ');
              return (
                <div key={edu.id} className="break-inside-avoid">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3
                      className="font-semibold"
                      style={{ color: primaryText, fontSize: `${baseFontPx * 1.03}px` }}
                    >
                      {title || edu.institution || 'Degree'}
                    </h3>
                    {dateRange && (
                      <span
                        className="shrink-0 font-mono-tabular"
                        style={{ color: mutedText, fontSize: `${baseFontPx * 0.86}px` }}
                      >
                        {dateRange}
                      </span>
                    )}
                  </div>
                  <div style={{ color: secondaryText, fontSize: `${baseFontPx * 0.94}px` }}>
                    {[edu.institution, edu.location, edu.gpa ? `GPA ${edu.gpa}` : '']
                      .filter(Boolean)
                      .join(' · ')}
                  </div>
                  {edu.highlights.trim() && (
                    <p
                      className="mt-0.5"
                      style={{ color: mutedText, fontSize: `${baseFontPx * 0.92}px`, lineHeight }}
                    >
                      {edu.highlights}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      );
    }

    if (sec.id === 'skills') {
      const groups: Array<[string, string[]]> = [
        ['Technical', resume.skills.technical],
        ['Tools & Platforms', resume.skills.tools],
        ['Soft Skills', resume.skills.soft],
      ].filter(([, arr]) => arr.length > 0) as Array<[string, string[]]>;

      if (groups.length === 0) return null;

      return (
        <section key={sec.id} style={{ marginBottom: `${sectionGapPx}px` }}>
          {renderSectionTitle(sec.title, inverted)}
          <div className={activeTemplateId === 'technical-developer' ? 'grid grid-cols-1 gap-1.5' : 'space-y-1.5'}>
            {groups.map(([label, items]) => (
              <div
                key={label}
                style={{ color: primaryText, fontSize: `${baseFontPx * 0.96}px`, lineHeight }}
              >
                <span className="font-semibold" style={{ color: inverted ? '#FFFFFF' : '#0F172A' }}>
                  {label}:{' '}
                </span>
                <span style={{ color: secondaryText }}>{items.join(', ')}</span>
              </div>
            ))}
          </div>
        </section>
      );
    }

    if (sec.id === 'projects') {
      if (resume.projects.length === 0) return null;
      return (
        <section key={sec.id} style={{ marginBottom: `${sectionGapPx}px` }}>
          {renderSectionTitle(sec.title, inverted)}
          <div className="space-y-3">
            {resume.projects.map((proj) => {
              const dateRange = [proj.startDate, proj.endDate].filter(Boolean).join(' – ');
              const safeLink = sanitizeExternalUrl(proj.link);
              return (
                <div key={proj.id} className="break-inside-avoid">
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <h3
                        className="font-semibold"
                        style={{ color: primaryText, fontSize: `${baseFontPx * 1.04}px` }}
                      >
                        {proj.name || 'Project'}
                      </h3>
                      {proj.role && (
                        <span style={{ color: secondaryText, fontSize: `${baseFontPx * 0.92}px` }}>
                          · {proj.role}
                        </span>
                      )}
                    </div>
                    {dateRange && (
                      <span
                        className="shrink-0 font-mono-tabular"
                        style={{ color: mutedText, fontSize: `${baseFontPx * 0.86}px` }}
                      >
                        {dateRange}
                      </span>
                    )}
                  </div>
                  {(proj.technologies.length > 0 || safeLink) && (
                    <div
                      className="mb-1 flex flex-wrap items-center gap-x-2"
                      style={{ color: inverted ? '#CBD5E1' : accent, fontSize: `${baseFontPx * 0.9}px` }}
                    >
                      {proj.technologies.length > 0 && <span>{proj.technologies.join(' · ')}</span>}
                      {safeLink && (
                        <a
                          href={safeLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          {formatDisplayUrl(proj.link)}
                        </a>
                      )}
                    </div>
                  )}
                  {proj.description.trim() && (
                    <p style={{ color: primaryText, fontSize: `${baseFontPx}px`, lineHeight }}>
                      {proj.description}
                    </p>
                  )}
                  {proj.highlights.filter((h) => h.trim()).length > 0 && (
                    <ul className="mt-1 space-y-1">
                      {proj.highlights
                        .filter((h) => h.trim())
                        .map((h, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2"
                            style={{ color: primaryText, fontSize: `${baseFontPx}px`, lineHeight }}
                          >
                            <span style={{ color: inverted ? '#E2E8F0' : accent }}>{bulletGlyph}</span>
                            <span>{h}</span>
                          </li>
                        ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      );
    }

    if (sec.id === 'certifications') {
      if (resume.certifications.length === 0) return null;
      return (
        <section key={sec.id} style={{ marginBottom: `${sectionGapPx}px` }}>
          {renderSectionTitle(sec.title, inverted)}
          <div className="space-y-1.5">
            {resume.certifications.map((cert) => (
              <div key={cert.id} className="flex items-baseline justify-between gap-2 break-inside-avoid">
                <div style={{ color: primaryText, fontSize: `${baseFontPx * 0.96}px` }}>
                  <span className="font-semibold">{cert.name}</span>
                  {cert.issuer && <span style={{ color: secondaryText }}> · {cert.issuer}</span>}
                  {cert.credentialId && (
                    <span style={{ color: mutedText }}> · ID {cert.credentialId}</span>
                  )}
                </div>
                {cert.date && (
                  <span
                    className="shrink-0 font-mono-tabular"
                    style={{ color: mutedText, fontSize: `${baseFontPx * 0.86}px` }}
                  >
                    {cert.date}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      );
    }

    if (sec.id === 'languages') {
      if (resume.languages.length === 0) return null;
      return (
        <section key={sec.id} style={{ marginBottom: `${sectionGapPx}px` }}>
          {renderSectionTitle(sec.title, inverted)}
          <div
            className="flex flex-wrap gap-x-4 gap-y-1"
            style={{ color: primaryText, fontSize: `${baseFontPx * 0.96}px` }}
          >
            {resume.languages.map((lang) => (
              <span key={lang.id}>
                <strong className="font-semibold">{lang.name}</strong>
                <span style={{ color: secondaryText }}> ({lang.proficiency})</span>
              </span>
            ))}
          </div>
        </section>
      );
    }

    if (sec.id === 'achievements') {
      if (resume.achievements.length === 0) return null;
      return (
        <section key={sec.id} style={{ marginBottom: `${sectionGapPx}px` }}>
          {renderSectionTitle(sec.title, inverted)}
          <div className="space-y-2">
            {resume.achievements.map((ach) => (
              <div key={ach.id} className="break-inside-avoid">
                <div className="flex items-baseline justify-between gap-2">
                  <div style={{ color: primaryText, fontSize: `${baseFontPx * 0.98}px` }}>
                    <span className="font-semibold">{ach.title}</span>
                    {ach.issuer && <span style={{ color: secondaryText }}> · {ach.issuer}</span>}
                  </div>
                  {ach.date && (
                    <span
                      className="shrink-0 font-mono-tabular"
                      style={{ color: mutedText, fontSize: `${baseFontPx * 0.86}px` }}
                    >
                      {ach.date}
                    </span>
                  )}
                </div>
                {ach.description.trim() && (
                  <p style={{ color: secondaryText, fontSize: `${baseFontPx * 0.94}px`, lineHeight }}>
                    {ach.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      );
    }

    if (sec.id.startsWith('custom:')) {
      const cid = sec.id.replace('custom:', '');
      const custom = resume.customSections.find((c) => c.id === cid);
      if (!custom || custom.items.length === 0) return null;
      return (
        <section key={sec.id} style={{ marginBottom: `${sectionGapPx}px` }}>
          {renderSectionTitle(sec.title || custom.title, inverted)}
          <div className="space-y-2.5">
            {custom.items.map((item) => (
              <div key={item.id} className="break-inside-avoid">
                <div className="flex items-baseline justify-between gap-2">
                  <h3
                    className="font-semibold"
                    style={{ color: primaryText, fontSize: `${baseFontPx * 1.02}px` }}
                  >
                    {item.heading}
                  </h3>
                  {item.date && (
                    <span
                      className="shrink-0 font-mono-tabular"
                      style={{ color: mutedText, fontSize: `${baseFontPx * 0.86}px` }}
                    >
                      {item.date}
                    </span>
                  )}
                </div>
                {item.subheading && (
                  <div style={{ color: secondaryText, fontSize: `${baseFontPx * 0.94}px` }}>
                    {item.subheading}
                  </div>
                )}
                {item.description && (
                  <p style={{ color: primaryText, fontSize: `${baseFontPx}px`, lineHeight }}>
                    {item.description}
                  </p>
                )}
                {item.bullets.filter((b) => b.trim()).length > 0 && (
                  <ul className="mt-1 space-y-1">
                    {item.bullets
                      .filter((b) => b.trim())
                      .map((b, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2"
                          style={{ color: primaryText, fontSize: `${baseFontPx}px`, lineHeight }}
                        >
                          <span style={{ color: inverted ? '#E2E8F0' : accent }}>{bulletGlyph}</span>
                          <span>{b}</span>
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      );
    }

    return null;
  };

  const renderContactLine = (inverted = false, vertical = false) => {
    if (contactItems.length === 0) return null;
    return (
      <div
        className={
          vertical
            ? 'mt-3 flex flex-col gap-1.5'
            : `mt-2.5 flex flex-wrap items-center gap-x-3.5 gap-y-1 ${
                resume.design.headerAlignment === 'center' ||
                activeTemplateId === 'corporate-executive' ||
                activeTemplateId === 'academic-resume'
                  ? 'justify-center'
                  : ''
              }`
        }
        style={{
          fontSize: `${baseFontPx * 0.89}px`,
          color: inverted ? '#E2E8F0' : '#475569',
        }}
      >
        {contactItems.map((item) => {
          const Icon = item.icon;
          const inner = (
            <span className="inline-flex items-center gap-1.5">
              {showIcons && (
                <Icon
                  className="h-3.5 w-3.5 shrink-0"
                  style={{ color: inverted ? '#FFFFFF' : accent }}
                />
              )}
              <span>{item.text}</span>
            </span>
          );
          if (item.href) {
            return (
              <a
                key={item.key}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {inner}
              </a>
            );
          }
          return <span key={item.key}>{inner}</span>;
        })}
      </div>
    );
  };

  const renderHeader = () => {
    const isBanner = activeTemplateId === 'senior-manager';
    const isTopStrip = activeTemplateId === 'marketing-specialist';
    const isCentered =
      !isBanner &&
      (resume.design.headerAlignment === 'center' ||
        activeTemplateId === 'corporate-executive' ||
        activeTemplateId === 'academic-resume');
    const isSplit = !isBanner && !isCentered && resume.design.headerAlignment === 'split';
    const isSerifDisplay =
      activeTemplateId === 'corporate-executive' ||
      activeTemplateId === 'elegant-professional' ||
      activeTemplateId === 'academic-resume';

    if (isBanner) {
      return (
        <header
          style={{
            backgroundColor: accent,
            padding: `${Math.round(paddingPx * 0.72)}px ${paddingPx}px`,
            marginBottom: `${sectionGapPx}px`,
          }}
        >
          <div className="flex items-center justify-between gap-5">
            <div className="min-w-0 flex-1">
              <h1
                className="font-bold tracking-tight text-white"
                style={{ fontSize: `${baseFontPx * 2.1}px` }}
              >
                {resume.personal.fullName || 'Your Full Name'}
              </h1>
              {resume.personal.jobTitle && (
                <p
                  className="mt-1 font-medium text-white/90"
                  style={{ fontSize: `${baseFontPx * 1.15}px` }}
                >
                  {resume.personal.jobTitle}
                </p>
              )}
              {renderContactLine(true, false)}
            </div>
            {showPhoto && (
              <img
                src={resume.personal.photoDataUrl}
                alt={resume.personal.fullName || 'Profile'}
                referrerPolicy="no-referrer"
                className="h-20 w-20 shrink-0 rounded-lg border-2 border-white/30 object-cover"
              />
            )}
          </div>
        </header>
      );
    }

    return (
      <header
        style={{
          marginBottom: `${sectionGapPx}px`,
          paddingBottom: '14px',
          borderTop: isTopStrip ? `5px solid ${accent}` : undefined,
          paddingTop: isTopStrip ? '14px' : undefined,
          borderBottom:
            resume.design.dividerStyle === 'none'
              ? 'none'
              : activeTemplateId === 'corporate-executive'
                ? `2px solid ${accent}`
                : `1px solid ${activeTemplateId === 'minimal-clean' ? '#E2E8F0' : `${accent}66`}`,
        }}
      >
        <div
          className={
            isCentered
              ? 'flex flex-col items-center text-center'
              : isSplit
                ? 'flex items-start justify-between gap-6'
                : 'flex items-center justify-between gap-5'
          }
        >
          <div className="min-w-0 flex-1">
            {showPhoto && isCentered && (
              <img
                src={resume.personal.photoDataUrl}
                alt={resume.personal.fullName || 'Profile'}
                referrerPolicy="no-referrer"
                className="mx-auto mb-3 h-20 w-20 rounded-full object-cover"
              />
            )}
            <h1
              className="font-bold tracking-tight text-[#0F172A]"
              style={{
                fontSize: `${baseFontPx * (activeTemplateId === 'minimal-clean' ? 1.95 : 2.15)}px`,
                fontFamily: isSerifDisplay
                  ? `'Playfair Display', 'Lora', Georgia, serif`
                  : `'${fontFamily}', sans-serif`,
              }}
            >
              {resume.personal.fullName || 'Your Full Name'}
            </h1>
            {resume.personal.jobTitle && (
              <p
                className="mt-0.5 font-medium"
                style={{
                  color: activeTemplateId === 'minimal-clean' ? '#475569' : accent,
                  fontSize: `${baseFontPx * 1.15}px`,
                }}
              >
                {resume.personal.jobTitle}
              </p>
            )}
            {!isSplit && renderContactLine(false, false)}
          </div>

          {isSplit && <div className="max-w-[260px] shrink-0 text-right">{renderContactLine(false, true)}</div>}

          {showPhoto && !isCentered && (
            <img
              src={resume.personal.photoDataUrl}
              alt={resume.personal.fullName || 'Profile'}
              referrerPolicy="no-referrer"
              className="h-20 w-20 shrink-0 rounded-lg object-cover"
            />
          )}
        </div>
      </header>
    );
  };

  const renderContentLayout = () => {
    // Creative Designer: Deep accent left sidebar + white right canvas
    if (effectiveLayout === 'two-column' && activeTemplateId === 'creative-designer') {
      const leftSections = orderedSections.filter((s) => SIDEBAR_SECTIONS.has(s.id));
      const rightSections = orderedSections.filter((s) => !SIDEBAR_SECTIONS.has(s.id));
      return (
        <div className="grid min-h-full grid-cols-12" style={{ minHeight: `${pageHeightPx}px` }}>
          <aside
            className="col-span-4 text-white"
            style={{ backgroundColor: accent, padding: `${paddingPx}px ${Math.round(paddingPx * 0.65)}px` }}
          >
            {showPhoto && (
              <img
                src={resume.personal.photoDataUrl}
                alt={resume.personal.fullName || 'Profile'}
                referrerPolicy="no-referrer"
                className="mb-4 h-24 w-24 rounded-full border-2 border-white/30 object-cover"
              />
            )}
            <h1 className="font-bold leading-tight text-white" style={{ fontSize: `${baseFontPx * 1.8}px` }}>
              {resume.personal.fullName || 'Your Full Name'}
            </h1>
            {resume.personal.jobTitle && (
              <p className="mt-1 text-white/85" style={{ fontSize: `${baseFontPx * 1.02}px` }}>
                {resume.personal.jobTitle}
              </p>
            )}
            <div className="mb-6">{renderContactLine(true, true)}</div>
            {leftSections.map((sec) => renderSectionBody(sec, true))}
          </aside>
          <main
            className="col-span-8 bg-white"
            style={{ padding: `${paddingPx}px ${Math.round(paddingPx * 0.85)}px` }}
          >
            {rightSections.map((sec) => renderSectionBody(sec, false))}
          </main>
        </div>
      );
    }

    // Two-Column Modern / Marketing Specialist / User two-column override
    if (effectiveLayout === 'two-column') {
      const leftSections = orderedSections.filter((s) => SIDEBAR_SECTIONS.has(s.id));
      const rightSections = orderedSections.filter((s) => !SIDEBAR_SECTIONS.has(s.id));
      const isRightSidebar = activeTemplateId === 'marketing-specialist';

      return (
        <div style={{ padding: `${paddingPx}px` }}>
          {renderHeader()}
          <div className="grid grid-cols-12 gap-7">
            {!isRightSidebar && (
              <aside
                className="col-span-4 rounded-md p-3.5"
                style={{ backgroundColor: `${accent}0D` }}
              >
                {leftSections.map((sec) => renderSectionBody(sec, false))}
              </aside>
            )}
            <div className="col-span-8">
              {rightSections.map((sec) => renderSectionBody(sec, false))}
            </div>
            {isRightSidebar && (
              <aside
                className="col-span-4 rounded-md p-3.5"
                style={{ backgroundColor: `${accent}0D` }}
              >
                {leftSections.map((sec) => renderSectionBody(sec, false))}
              </aside>
            )}
          </div>
        </div>
      );
    }

    // Single-column templates (including Senior Manager full-bleed header banner)
    const isBanner = activeTemplateId === 'senior-manager';
    return (
      <div>
        {isBanner && renderHeader()}
        <div
          style={{
            padding: isBanner
              ? `0 ${paddingPx}px ${paddingPx}px ${paddingPx}px`
              : `${paddingPx}px`,
          }}
        >
          {!isBanner && renderHeader()}
          {orderedSections.map((sec) => renderSectionBody(sec, false))}
        </div>
      </div>
    );
  };

  return (
    <div
      className="relative origin-top-left"
      style={{
        width: `${pageWidthPx * scale}px`,
        minHeight: `${pageHeightPx * scale}px`,
      }}
    >
      <div
        id={printId}
        ref={containerRef}
        className="relative bg-white text-[#111827] shadow-2xl"
        style={{
          width: `${pageWidthPx}px`,
          minHeight: `${pageHeightPx}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          fontFamily: `'${fontFamily}', system-ui, sans-serif`,
          fontWeight: Number(resume.design.fontWeight),
        }}
      >
        {renderContentLayout()}

        {/* Visual page break guides & page numbers in live preview (hidden in print) */}
        {showPageGuides &&
          Array.from({ length: pageCount }).map((_, idx) => {
            const pageNum = idx + 1;
            const bottomY = pageNum * pageHeightPx;
            return (
              <React.Fragment key={pageNum}>
                {pageNum < pageCount && (
                  <div
                    className="no-print pointer-events-none absolute inset-x-0 z-20 flex items-center justify-between border-t border-dashed border-[#D4A843]/80 bg-[#D4A843]/10 px-3 py-0.5 text-[10px] font-medium text-[#9A6F1C]"
                    style={{ top: `${bottomY - 1}px` }}
                  >
                    <span>Page {pageNum} End</span>
                    <span>Page {pageNum + 1} Start</span>
                  </div>
                )}
                <div
                  className="no-print pointer-events-none absolute right-4 z-10 font-mono-tabular text-[10px] text-slate-400"
                  style={{ top: `${bottomY - 22}px` }}
                >
                  Page {pageNum} of {pageCount}
                </div>
              </React.Fragment>
            );
          })}
      </div>
    </div>
  );
}
