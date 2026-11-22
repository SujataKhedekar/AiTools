import React, { useState } from 'react';
import {
  Copy,
  Download,
  Eye,
  EyeOff,
  FileText,
  GripVertical,
  Image as ImageIcon,
  LayoutGrid,
  Palette,
  Plus,
  Redo2,
  Save,
  Sparkles,
  Trash2,
  Undo2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { createId } from '../data/templates';
import {
  CustomSection,
  DesignConfig,
  LanguageItem,
  ResumeDocument,
  SectionKey,
  TemplateDefinition,
} from '../types/resume';
import { exportResumeToPdf } from '../utils/exportPdf';
import { exportResumeToDocx } from '../utils/exportDocx';
import AIInlineToolbar from './AIInlineToolbar';
import AIToolsPanel from './AIToolsPanel';
import DesignPanel from './DesignPanel';
import ResumePreview from './ResumePreview';
import TemplateGalleryPanel from './TemplateGalleryPanel';

interface EditorWorkspaceProps {
  resume: ResumeDocument;
  onChange: (updater: (prev: ResumeDocument) => ResumeDocument) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  lastSavedAt: string | null;
  onSaveDraft: () => void;
  onDuplicateResume: () => void;
}

type RightTab = 'preview' | 'templates' | 'design' | 'ai-tools';
type MobileTab = 'edit' | 'preview' | 'design';

const INPUT_CLASS =
  'h-10 w-full rounded-lg border border-white/[0.1] bg-[#0B0E14] px-3 text-sm text-white placeholder-[#64748B] transition-colors focus:border-[#D4A843] focus:outline-none';
const TEXTAREA_CLASS =
  'w-full rounded-lg border border-white/[0.1] bg-[#0B0E14] p-3 text-sm leading-relaxed text-white placeholder-[#64748B] transition-colors focus:border-[#D4A843] focus:outline-none';

export default function EditorWorkspace({
  resume,
  onChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  lastSavedAt,
  onSaveDraft,
  onDuplicateResume,
}: EditorWorkspaceProps) {
  const [activeSection, setActiveSection] = useState<SectionKey>('personal');
  const [rightTab, setRightTab] = useState<RightTab>('preview');
  const [mobileTab, setMobileTab] = useState<MobileTab>('edit');
  const [zoom, setZoom] = useState(0.64);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [skillDrafts, setSkillDrafts] = useState({ technical: '', tools: '', soft: '' });
  const [photoError, setPhotoError] = useState<string | null>(null);

  const updateDesign = (patch: Partial<DesignConfig>) => {
    onChange((prev) => ({
      ...prev,
      design: { ...prev.design, ...patch },
    }));
  };

  const handleSelectTemplate = (tpl: TemplateDefinition) => {
    onChange((prev) => ({
      ...prev,
      design: {
        ...prev.design,
        templateId: tpl.id,
        accentColor: tpl.defaultAccent,
        fontFamily: tpl.defaultFont,
        layoutOverride: 'template',
        showIcons: tpl.id === 'ats-classic' ? false : prev.design.showIcons,
        showPhoto: tpl.id === 'ats-classic' ? false : prev.design.showPhoto,
      },
    }));
  };

  const handleDragStart = (index: number) => setDragIndex(index);

  const handleDropSection = (targetIndex: number) => {
    if (dragIndex === null || dragIndex === targetIndex) return;
    // Keep 'personal' pinned at index 0
    if (dragIndex === 0 || targetIndex === 0) {
      setDragIndex(null);
      return;
    }
    onChange((prev) => {
      const next = [...prev.sections];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(targetIndex, 0, moved);
      return { ...prev, sections: next };
    });
    setDragIndex(null);
  };

  const handleAddCustomSection = () => {
    const newId = createId('cust');
    const customSec: CustomSection = {
      id: newId,
      title: 'Publications & Speaking',
      items: [
        {
          id: createId('citem'),
          heading: '',
          subheading: '',
          date: '',
          description: '',
          bullets: [''],
        },
      ],
    };
    const key: SectionKey = `custom:${newId}`;
    onChange((prev) => ({
      ...prev,
      customSections: [...prev.customSections, customSec],
      sections: [...prev.sections, { id: key, title: customSec.title, visible: true, isCustom: true }],
    }));
    setActiveSection(key);
  };

  const handleDuplicateCustomSection = (customId: string) => {
    const source = resume.customSections.find((c) => c.id === customId);
    if (!source) return;
    const newId = createId('cust');
    const copy: CustomSection = {
      id: newId,
      title: `${source.title} (Copy)`,
      items: source.items.map((it) => ({ ...it, id: createId('citem'), bullets: [...it.bullets] })),
    };
    const key: SectionKey = `custom:${newId}`;
    onChange((prev) => ({
      ...prev,
      customSections: [...prev.customSections, copy],
      sections: [...prev.sections, { id: key, title: copy.title, visible: true, isCustom: true }],
    }));
    setActiveSection(key);
  };

  const handleDeleteCustomSection = (customId: string) => {
    const key: SectionKey = `custom:${customId}`;
    onChange((prev) => ({
      ...prev,
      customSections: prev.customSections.filter((c) => c.id !== customId),
      sections: prev.sections.filter((s) => s.id !== key),
    }));
    if (activeSection === key) setActiveSection('personal');
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setPhotoError('Please choose a valid PNG, JPG, or WebP image.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setPhotoError('Profile photo must be under 2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      onChange((prev) => ({
        ...prev,
        personal: { ...prev.personal, photoDataUrl: dataUrl },
        design: { ...prev.design, showPhoto: true },
      }));
    };
    reader.readAsDataURL(file);
  };

  const addSkillChip = (group: 'technical' | 'tools' | 'soft') => {
    const raw = skillDrafts[group].trim();
    if (!raw) return;
    const additions = raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    onChange((prev) => {
      const existing = new Set(prev.skills[group].map((x) => x.toLowerCase()));
      const merged = [...prev.skills[group]];
      for (const item of additions) {
        if (!existing.has(item.toLowerCase())) {
          merged.push(item);
          existing.add(item.toLowerCase());
        }
      }
      return { ...prev, skills: { ...prev.skills, [group]: merged } };
    });
    setSkillDrafts((d) => ({ ...d, [group]: '' }));
  };

  const getSectionCountLabel = (id: SectionKey): string => {
    if (id === 'experience') return `${resume.experience.length}`;
    if (id === 'education') return `${resume.education.length}`;
    if (id === 'skills') {
      return `${resume.skills.technical.length + resume.skills.tools.length + resume.skills.soft.length}`;
    }
    if (id === 'projects') return `${resume.projects.length}`;
    if (id === 'certifications') return `${resume.certifications.length}`;
    if (id === 'languages') return `${resume.languages.length}`;
    if (id === 'achievements') return `${resume.achievements.length}`;
    if (id.startsWith('custom:')) {
      const cid = id.replace('custom:', '');
      const c = resume.customSections.find((s) => s.id === cid);
      return `${c?.items.length || 0}`;
    }
    return '';
  };

  const activeSectionMeta = resume.sections.find((s) => s.id === activeSection);

  const renderSectionEditor = () => {
    // 1. Personal Information
    if (activeSection === 'personal') {
      return (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#98A2B3]">Full Name</label>
              <input
                type="text"
                value={resume.personal.fullName}
                onChange={(e) =>
                  onChange((p) => ({ ...p, personal: { ...p.personal, fullName: e.target.value } }))
                }
                placeholder="e.g. Elena Vance"
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#98A2B3]">
                Professional Headline / Job Title
              </label>
              <input
                type="text"
                value={resume.personal.jobTitle}
                onChange={(e) =>
                  onChange((p) => ({ ...p, personal: { ...p.personal, jobTitle: e.target.value } }))
                }
                placeholder="e.g. Senior Full-Stack Engineer"
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#98A2B3]">Email</label>
              <input
                type="email"
                value={resume.personal.email}
                onChange={(e) =>
                  onChange((p) => ({ ...p, personal: { ...p.personal, email: e.target.value } }))
                }
                placeholder="name@company.com"
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#98A2B3]">Phone Number</label>
              <input
                type="tel"
                value={resume.personal.phone}
                onChange={(e) =>
                  onChange((p) => ({ ...p, personal: { ...p.personal, phone: e.target.value } }))
                }
                placeholder="+1 (415) 555-0194"
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#98A2B3]">Location</label>
              <input
                type="text"
                value={resume.personal.location}
                onChange={(e) =>
                  onChange((p) => ({ ...p, personal: { ...p.personal, location: e.target.value } }))
                }
                placeholder="San Francisco, CA"
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#98A2B3]">Target Role</label>
              <input
                type="text"
                value={resume.targetRole}
                onChange={(e) => onChange((p) => ({ ...p, targetRole: e.target.value }))}
                placeholder="e.g. Staff Software Engineer"
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#98A2B3]">LinkedIn URL</label>
              <input
                type="url"
                value={resume.personal.linkedin}
                onChange={(e) =>
                  onChange((p) => ({ ...p, personal: { ...p.personal, linkedin: e.target.value } }))
                }
                placeholder="https://linkedin.com/in/username"
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#98A2B3]">Portfolio / Website</label>
              <input
                type="url"
                value={resume.personal.portfolio}
                onChange={(e) =>
                  onChange((p) => ({ ...p, personal: { ...p.personal, portfolio: e.target.value } }))
                }
                placeholder="https://yourportfolio.dev"
                className={INPUT_CLASS}
              />
            </div>
          </div>

          {/* Profile Photo Control */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-white/[0.08] bg-[#10141D] p-4">
            <div className="flex items-center gap-3.5">
              {resume.personal.photoDataUrl ? (
                <img
                  src={resume.personal.photoDataUrl}
                  alt="Profile headshot"
                  referrerPolicy="no-referrer"
                  className="h-12 w-12 rounded-lg border border-white/10 object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-[#181D29] text-[#64748B]">
                  <ImageIcon className="h-5 w-5" />
                </div>
              )}
              <div>
                <div className="text-sm font-medium text-white">Profile Photo (Optional)</div>
                <div className="text-xs text-[#98A2B3]">
                  Toggle visibility in Design panel. Omitted automatically in ATS Classic.
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-md border border-white/[0.12] bg-[#181D29] px-3 text-xs font-medium text-white transition-colors hover:bg-[#202736]">
                <span>Upload Photo</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
              {resume.personal.photoDataUrl && (
                <button
                  type="button"
                  onClick={() =>
                    onChange((p) => ({
                      ...p,
                      personal: { ...p.personal, photoDataUrl: '' },
                      design: { ...p.design, showPhoto: false },
                    }))
                  }
                  className="h-9 rounded-md border border-white/[0.1] px-2.5 text-xs text-[#98A2B3] hover:text-red-300"
                >
                  Remove
                </button>
              )}
            </div>
            {photoError && <p className="w-full text-xs text-red-300">{photoError}</p>}
          </div>
        </div>
      );
    }

    // 2. Professional Summary
    if (activeSection === 'summary') {
      return (
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#98A2B3]">
              Professional Summary
            </label>
            <textarea
              rows={6}
              value={resume.summary}
              onChange={(e) => onChange((p) => ({ ...p, summary: e.target.value }))}
              placeholder="Summarize your core experience, domain expertise, and verified outcomes in 2–4 concise sentences..."
              className={TEXTAREA_CLASS}
            />
            <div className="mt-1.5 flex justify-between text-xs text-[#64748B]">
              <span>Aim for 45–80 words for crisp recruiter scannability</span>
              <span className="font-mono-tabular">
                {resume.summary.trim() ? resume.summary.trim().split(/\s+/).length : 0} words
              </span>
            </div>
          </div>

          <AIInlineToolbar
            section="Professional Summary"
            currentText={resume.summary}
            resumeContext={resume}
            onApply={(next) => onChange((p) => ({ ...p, summary: next }))}
          />
        </div>
      );
    }

    // 3. Work Experience
    if (activeSection === 'experience') {
      return (
        <div className="space-y-5">
          {resume.experience.length === 0 ? (
            <div className="rounded-lg border border-dashed border-white/[0.12] bg-[#10141D] p-8 text-center">
              <p className="text-sm font-medium text-white">No work experience added yet</p>
              <p className="mt-1 text-xs text-[#98A2B3]">
                Add your current or previous roles with action-oriented impact statements.
              </p>
              <button
                type="button"
                onClick={() =>
                  onChange((p) => ({
                    ...p,
                    experience: [
                      ...p.experience,
                      {
                        id: createId('exp'),
                        company: '',
                        role: '',
                        location: '',
                        startDate: '',
                        endDate: '',
                        current: false,
                        bullets: [''],
                      },
                    ],
                  }))
                }
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#D4A843] px-4 py-2 text-xs font-semibold text-[#0B0E14] hover:bg-[#E3BB5C]"
              >
                <Plus className="h-4 w-4" />
                <span>Add Work Experience</span>
              </button>
            </div>
          ) : (
            resume.experience.map((exp, idx) => (
              <div
                key={exp.id}
                className="space-y-4 rounded-lg border border-white/[0.08] bg-[#10141D] p-4"
              >
                <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
                  <div className="text-sm font-semibold text-white">
                    {exp.role || `Experience #${idx + 1}`}
                    {exp.company ? (
                      <span className="font-normal text-[#98A2B3]"> · {exp.company}</span>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onChange((p) => ({
                        ...p,
                        experience: p.experience.filter((item) => item.id !== exp.id),
                      }))
                    }
                    className="inline-flex items-center gap-1 text-xs text-[#98A2B3] hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Remove</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-[#98A2B3]">Job Title / Role</label>
                    <input
                      type="text"
                      value={exp.role}
                      onChange={(e) =>
                        onChange((p) => ({
                          ...p,
                          experience: p.experience.map((it) =>
                            it.id === exp.id ? { ...it, role: e.target.value } : it,
                          ),
                        }))
                      }
                      placeholder="Senior Software Engineer"
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-[#98A2B3]">Company</label>
                    <input
                      type="text"
                      value={exp.company}
                      onChange={(e) =>
                        onChange((p) => ({
                          ...p,
                          experience: p.experience.map((it) =>
                            it.id === exp.id ? { ...it, company: e.target.value } : it,
                          ),
                        }))
                      }
                      placeholder="Northstar Systems"
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-[#98A2B3]">Location</label>
                    <input
                      type="text"
                      value={exp.location}
                      onChange={(e) =>
                        onChange((p) => ({
                          ...p,
                          experience: p.experience.map((it) =>
                            it.id === exp.id ? { ...it, location: e.target.value } : it,
                          ),
                        }))
                      }
                      placeholder="San Francisco, CA / Remote"
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="mb-1 block text-xs text-[#98A2B3]">Start Date</label>
                      <input
                        type="text"
                        value={exp.startDate}
                        onChange={(e) =>
                          onChange((p) => ({
                            ...p,
                            experience: p.experience.map((it) =>
                              it.id === exp.id ? { ...it, startDate: e.target.value } : it,
                            ),
                          }))
                        }
                        placeholder="Mar 2022"
                        className={INPUT_CLASS}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-[#98A2B3]">End Date</label>
                      <input
                        type="text"
                        disabled={exp.current}
                        value={exp.current ? 'Present' : exp.endDate}
                        onChange={(e) =>
                          onChange((p) => ({
                            ...p,
                            experience: p.experience.map((it) =>
                              it.id === exp.id ? { ...it, endDate: e.target.value } : it,
                            ),
                          }))
                        }
                        placeholder="Feb 2025"
                        className={`${INPUT_CLASS} disabled:opacity-50`}
                      />
                    </div>
                  </div>
                </div>

                <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-[#CBD5E1]">
                  <input
                    type="checkbox"
                    checked={exp.current}
                    onChange={(e) =>
                      onChange((p) => ({
                        ...p,
                        experience: p.experience.map((it) =>
                          it.id === exp.id
                            ? {
                                ...it,
                                current: e.target.checked,
                                endDate: e.target.checked ? 'Present' : '',
                              }
                            : it,
                        ),
                      }))
                    }
                    className="h-3.5 w-3.5 accent-[#D4A843]"
                  />
                  <span>I currently work here</span>
                </label>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-[#98A2B3]">
                      Key Achievements & Responsibilities
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        onChange((p) => ({
                          ...p,
                          experience: p.experience.map((it) =>
                            it.id === exp.id ? { ...it, bullets: [...it.bullets, ''] } : it,
                          ),
                        }))
                      }
                      className="inline-flex items-center gap-1 text-xs font-medium text-[#D4A843] hover:underline"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add Bullet</span>
                    </button>
                  </div>
                  {exp.bullets.map((bullet, bIdx) => (
                    <div key={bIdx} className="flex items-start gap-2">
                      <textarea
                        rows={2}
                        value={bullet}
                        onChange={(e) =>
                          onChange((p) => ({
                            ...p,
                            experience: p.experience.map((it) =>
                              it.id === exp.id
                                ? {
                                    ...it,
                                    bullets: it.bullets.map((b, i) =>
                                      i === bIdx ? e.target.value : b,
                                    ),
                                  }
                                : it,
                            ),
                          }))
                        }
                        placeholder="Start with a strong action verb and describe measurable impact..."
                        className={TEXTAREA_CLASS}
                      />
                      {exp.bullets.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            onChange((p) => ({
                              ...p,
                              experience: p.experience.map((it) =>
                                it.id === exp.id
                                  ? { ...it, bullets: it.bullets.filter((_, i) => i !== bIdx) }
                                  : it,
                              ),
                            }))
                          }
                          className="mt-2 text-[#64748B] hover:text-red-400"
                          aria-label="Remove bullet"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <AIInlineToolbar
                  compact
                  section="experience"
                  currentText={exp.bullets.filter(Boolean).join('\n')}
                  resumeContext={resume}
                  onApply={(newText) => {
                    const nextBullets = newText
                      .split('\n')
                      .map((line) => line.replace(/^[-*•▪–›\s]+/, '').trim())
                      .filter(Boolean);
                    if (nextBullets.length === 0) return;
                    onChange((p) => ({
                      ...p,
                      experience: p.experience.map((it) =>
                        it.id === exp.id ? { ...it, bullets: nextBullets } : it,
                      ),
                    }));
                  }}
                />
              </div>
            ))
          )}

          {resume.experience.length > 0 && (
            <button
              type="button"
              onClick={() =>
                onChange((p) => ({
                  ...p,
                  experience: [
                    ...p.experience,
                    {
                      id: createId('exp'),
                      company: '',
                      role: '',
                      location: '',
                      startDate: '',
                      endDate: '',
                      current: false,
                      bullets: [''],
                    },
                  ],
                }))
              }
              className="inline-flex items-center gap-2 rounded-lg border border-white/[0.12] bg-[#181D29] px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:border-[#D4A843]/50"
            >
              <Plus className="h-4 w-4 text-[#D4A843]" />
              <span>Add Another Position</span>
            </button>
          )}
        </div>
      );
    }

    // 4. Education
    if (activeSection === 'education') {
      return (
        <div className="space-y-4">
          {resume.education.map((edu, idx) => (
            <div
              key={edu.id}
              className="space-y-3 rounded-lg border border-white/[0.08] bg-[#10141D] p-4"
            >
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
                <span className="text-sm font-semibold text-white">
                  {edu.institution || `Education #${idx + 1}`}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onChange((p) => ({
                      ...p,
                      education: p.education.filter((it) => it.id !== edu.id),
                    }))
                  }
                  className="inline-flex items-center gap-1 text-xs text-[#98A2B3] hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Remove</span>
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-[#98A2B3]">Institution</label>
                  <input
                    type="text"
                    value={edu.institution}
                    onChange={(e) =>
                      onChange((p) => ({
                        ...p,
                        education: p.education.map((it) =>
                          it.id === edu.id ? { ...it, institution: e.target.value } : it,
                        ),
                      }))
                    }
                    placeholder="University of Washington"
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[#98A2B3]">Degree</label>
                  <input
                    type="text"
                    value={edu.degree}
                    onChange={(e) =>
                      onChange((p) => ({
                        ...p,
                        education: p.education.map((it) =>
                          it.id === edu.id ? { ...it, degree: e.target.value } : it,
                        ),
                      }))
                    }
                    placeholder="Bachelor of Science"
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[#98A2B3]">Field of Study</label>
                  <input
                    type="text"
                    value={edu.field}
                    onChange={(e) =>
                      onChange((p) => ({
                        ...p,
                        education: p.education.map((it) =>
                          it.id === edu.id ? { ...it, field: e.target.value } : it,
                        ),
                      }))
                    }
                    placeholder="Computer Science"
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[#98A2B3]">Location</label>
                  <input
                    type="text"
                    value={edu.location}
                    onChange={(e) =>
                      onChange((p) => ({
                        ...p,
                        education: p.education.map((it) =>
                          it.id === edu.id ? { ...it, location: e.target.value } : it,
                        ),
                      }))
                    }
                    placeholder="Seattle, WA"
                    className={INPUT_CLASS}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-xs text-[#98A2B3]">Start</label>
                    <input
                      type="text"
                      value={edu.startDate}
                      onChange={(e) =>
                        onChange((p) => ({
                          ...p,
                          education: p.education.map((it) =>
                            it.id === edu.id ? { ...it, startDate: e.target.value } : it,
                          ),
                        }))
                      }
                      placeholder="Sep 2015"
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-[#98A2B3]">End</label>
                    <input
                      type="text"
                      value={edu.endDate}
                      onChange={(e) =>
                        onChange((p) => ({
                          ...p,
                          education: p.education.map((it) =>
                            it.id === edu.id ? { ...it, endDate: e.target.value } : it,
                          ),
                        }))
                      }
                      placeholder="Jun 2019"
                      className={INPUT_CLASS}
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[#98A2B3]">GPA / Honors (Optional)</label>
                  <input
                    type="text"
                    value={edu.gpa}
                    onChange={(e) =>
                      onChange((p) => ({
                        ...p,
                        education: p.education.map((it) =>
                          it.id === edu.id ? { ...it, gpa: e.target.value } : it,
                        ),
                      }))
                    }
                    placeholder="3.84 / 4.0"
                    className={INPUT_CLASS}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs text-[#98A2B3]">Coursework / Highlights</label>
                <input
                  type="text"
                  value={edu.highlights}
                  onChange={(e) =>
                    onChange((p) => ({
                      ...p,
                      education: p.education.map((it) =>
                        it.id === edu.id ? { ...it, highlights: e.target.value } : it,
                      ),
                    }))
                  }
                  placeholder="Dean's List, Capstone Lead..."
                  className={INPUT_CLASS}
                />
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              onChange((p) => ({
                ...p,
                education: [
                  ...p.education,
                  {
                    id: createId('edu'),
                    institution: '',
                    degree: '',
                    field: '',
                    location: '',
                    startDate: '',
                    endDate: '',
                    gpa: '',
                    highlights: '',
                  },
                ],
              }))
            }
            className="inline-flex items-center gap-2 rounded-lg border border-white/[0.12] bg-[#181D29] px-4 py-2.5 text-xs font-semibold text-white hover:border-[#D4A843]/50"
          >
            <Plus className="h-4 w-4 text-[#D4A843]" />
            <span>Add Education</span>
          </button>
        </div>
      );
    }

    // 5. Skills
    if (activeSection === 'skills') {
      const groups: Array<{ key: 'technical' | 'tools' | 'soft'; label: string; placeholder: string }> = [
        {
          key: 'technical',
          label: 'Technical Skills',
          placeholder: 'e.g. TypeScript, React, PostgreSQL (comma-separated)',
        },
        {
          key: 'tools',
          label: 'Tools & Platforms',
          placeholder: 'e.g. AWS, Docker, GitHub Actions, Figma',
        },
        {
          key: 'soft',
          label: 'Soft & Leadership Skills',
          placeholder: 'e.g. Technical Leadership, Stakeholder Communication',
        },
      ];

      return (
        <div className="space-y-5">
          {groups.map((grp) => (
            <div
              key={grp.key}
              className="space-y-3 rounded-lg border border-white/[0.08] bg-[#10141D] p-4"
            >
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-white">{grp.label}</label>
                <span className="font-mono-tabular text-xs text-[#64748B]">
                  {resume.skills[grp.key].length} items
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={skillDrafts[grp.key]}
                  onChange={(e) =>
                    setSkillDrafts((d) => ({ ...d, [grp.key]: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSkillChip(grp.key);
                    }
                  }}
                  placeholder={grp.placeholder}
                  className={INPUT_CLASS}
                />
                <button
                  type="button"
                  onClick={() => addSkillChip(grp.key)}
                  className="h-10 shrink-0 rounded-lg bg-[#D4A843] px-4 text-xs font-semibold text-[#0B0E14] whitespace-nowrap hover:bg-[#E3BB5C]"
                >
                  Add
                </button>
              </div>
              {resume.skills[grp.key].length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {resume.skills[grp.key].map((skill, sIdx) => (
                    <span
                      key={`${skill}-${sIdx}`}
                      className="inline-flex items-center gap-2 rounded-md border border-white/[0.1] bg-[#181D29] px-2.5 py-1 text-xs text-[#ECEFF4]"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() =>
                          onChange((p) => ({
                            ...p,
                            skills: {
                              ...p.skills,
                              [grp.key]: p.skills[grp.key].filter((_, i) => i !== sIdx),
                            },
                          }))
                        }
                        className="text-[#64748B] hover:text-red-400"
                        aria-label={`Remove ${skill}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div className="flex items-center justify-between rounded-lg border border-white/[0.08] bg-[#10141D] p-3.5 text-xs">
            <span className="text-[#98A2B3]">
              Need AI skill suggestions grounded in your experience?
            </span>
            <button
              type="button"
              onClick={() => {
                setRightTab('ai-tools');
                setMobileTab('design');
              }}
              className="inline-flex items-center gap-1.5 font-semibold text-[#D4A843] hover:underline"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Open AI Skills Advisor</span>
            </button>
          </div>
        </div>
      );
    }

    // 6. Projects
    if (activeSection === 'projects') {
      return (
        <div className="space-y-4">
          {resume.projects.map((proj, idx) => (
            <div
              key={proj.id}
              className="space-y-3 rounded-lg border border-white/[0.08] bg-[#10141D] p-4"
            >
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
                <span className="text-sm font-semibold text-white">
                  {proj.name || `Project #${idx + 1}`}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onChange((p) => ({
                      ...p,
                      projects: p.projects.filter((it) => it.id !== proj.id),
                    }))
                  }
                  className="inline-flex items-center gap-1 text-xs text-[#98A2B3] hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Remove</span>
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-[#98A2B3]">Project Name</label>
                  <input
                    type="text"
                    value={proj.name}
                    onChange={(e) =>
                      onChange((p) => ({
                        ...p,
                        projects: p.projects.map((it) =>
                          it.id === proj.id ? { ...it, name: e.target.value } : it,
                        ),
                      }))
                    }
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[#98A2B3]">Role</label>
                  <input
                    type="text"
                    value={proj.role}
                    onChange={(e) =>
                      onChange((p) => ({
                        ...p,
                        projects: p.projects.map((it) =>
                          it.id === proj.id ? { ...it, role: e.target.value } : it,
                        ),
                      }))
                    }
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[#98A2B3]">Link (GitHub / Live)</label>
                  <input
                    type="url"
                    value={proj.link}
                    onChange={(e) =>
                      onChange((p) => ({
                        ...p,
                        projects: p.projects.map((it) =>
                          it.id === proj.id ? { ...it, link: e.target.value } : it,
                        ),
                      }))
                    }
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[#98A2B3]">
                    Technologies (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={proj.technologies.join(', ')}
                    onChange={(e) =>
                      onChange((p) => ({
                        ...p,
                        projects: p.projects.map((it) =>
                          it.id === proj.id
                            ? {
                                ...it,
                                technologies: e.target.value
                                  .split(',')
                                  .map((t) => t.trim())
                                  .filter(Boolean),
                              }
                            : it,
                        ),
                      }))
                    }
                    className={INPUT_CLASS}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs text-[#98A2B3]">Project Description</label>
                <textarea
                  rows={3}
                  value={proj.description}
                  onChange={(e) =>
                    onChange((p) => ({
                      ...p,
                      projects: p.projects.map((it) =>
                        it.id === proj.id ? { ...it, description: e.target.value } : it,
                      ),
                    }))
                  }
                  className={TEXTAREA_CLASS}
                />
              </div>
              <AIInlineToolbar
                compact
                section="Project Description"
                currentText={proj.description}
                resumeContext={resume}
                onApply={(next) =>
                  onChange((p) => ({
                    ...p,
                    projects: p.projects.map((it) =>
                      it.id === proj.id ? { ...it, description: next } : it,
                    ),
                  }))
                }
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              onChange((p) => ({
                ...p,
                projects: [
                  ...p.projects,
                  {
                    id: createId('proj'),
                    name: '',
                    role: '',
                    link: '',
                    startDate: '',
                    endDate: '',
                    technologies: [],
                    description: '',
                    highlights: [],
                  },
                ],
              }))
            }
            className="inline-flex items-center gap-2 rounded-lg border border-white/[0.12] bg-[#181D29] px-4 py-2.5 text-xs font-semibold text-white hover:border-[#D4A843]/50"
          >
            <Plus className="h-4 w-4 text-[#D4A843]" />
            <span>Add Project</span>
          </button>
        </div>
      );
    }

    // 7. Certifications
    if (activeSection === 'certifications') {
      return (
        <div className="space-y-4">
          {resume.certifications.map((cert) => (
            <div
              key={cert.id}
              className="grid grid-cols-1 gap-3 rounded-lg border border-white/[0.08] bg-[#10141D] p-4 sm:grid-cols-2"
            >
              <div className="sm:col-span-2 flex justify-end">
                <button
                  type="button"
                  onClick={() =>
                    onChange((p) => ({
                      ...p,
                      certifications: p.certifications.filter((c) => c.id !== cert.id),
                    }))
                  }
                  className="inline-flex items-center gap-1 text-xs text-[#98A2B3] hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Remove</span>
                </button>
              </div>
              <input
                type="text"
                value={cert.name}
                placeholder="Certification Name"
                onChange={(e) =>
                  onChange((p) => ({
                    ...p,
                    certifications: p.certifications.map((c) =>
                      c.id === cert.id ? { ...c, name: e.target.value } : c,
                    ),
                  }))
                }
                className={INPUT_CLASS}
              />
              <input
                type="text"
                value={cert.issuer}
                placeholder="Issuing Organization"
                onChange={(e) =>
                  onChange((p) => ({
                    ...p,
                    certifications: p.certifications.map((c) =>
                      c.id === cert.id ? { ...c, issuer: e.target.value } : c,
                    ),
                  }))
                }
                className={INPUT_CLASS}
              />
              <input
                type="text"
                value={cert.date}
                placeholder="Issue Date (e.g. Aug 2024)"
                onChange={(e) =>
                  onChange((p) => ({
                    ...p,
                    certifications: p.certifications.map((c) =>
                      c.id === cert.id ? { ...c, date: e.target.value } : c,
                    ),
                  }))
                }
                className={INPUT_CLASS}
              />
              <input
                type="text"
                value={cert.credentialId}
                placeholder="Credential ID (Optional)"
                onChange={(e) =>
                  onChange((p) => ({
                    ...p,
                    certifications: p.certifications.map((c) =>
                      c.id === cert.id ? { ...c, credentialId: e.target.value } : c,
                    ),
                  }))
                }
                className={INPUT_CLASS}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              onChange((p) => ({
                ...p,
                certifications: [
                  ...p.certifications,
                  { id: createId('cert'), name: '', issuer: '', date: '', credentialId: '', url: '' },
                ],
              }))
            }
            className="inline-flex items-center gap-2 rounded-lg border border-white/[0.12] bg-[#181D29] px-4 py-2.5 text-xs font-semibold text-white hover:border-[#D4A843]/50"
          >
            <Plus className="h-4 w-4 text-[#D4A843]" />
            <span>Add Certification</span>
          </button>
        </div>
      );
    }

    // 8. Languages
    if (activeSection === 'languages') {
      return (
        <div className="space-y-3">
          {resume.languages.map((lang) => (
            <div
              key={lang.id}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-white/[0.08] bg-[#10141D] p-3.5"
            >
              <input
                type="text"
                value={lang.name}
                placeholder="Language (e.g. English)"
                onChange={(e) =>
                  onChange((p) => ({
                    ...p,
                    languages: p.languages.map((l) =>
                      l.id === lang.id ? { ...l, name: e.target.value } : l,
                    ),
                  }))
                }
                className={`${INPUT_CLASS} flex-1 min-w-[160px]`}
              />
              <select
                value={lang.proficiency}
                onChange={(e) =>
                  onChange((p) => ({
                    ...p,
                    languages: p.languages.map((l) =>
                      l.id === lang.id
                        ? { ...l, proficiency: e.target.value as LanguageItem['proficiency'] }
                        : l,
                    ),
                  }))
                }
                className="h-10 rounded-lg border border-white/[0.1] bg-[#0B0E14] px-3 text-sm text-white focus:border-[#D4A843] focus:outline-none"
              >
                {(['Native', 'Fluent', 'Professional', 'Conversational', 'Basic'] as const).map(
                  (lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ),
                )}
              </select>
              <button
                type="button"
                onClick={() =>
                  onChange((p) => ({
                    ...p,
                    languages: p.languages.filter((l) => l.id !== lang.id),
                  }))
                }
                className="text-[#98A2B3] hover:text-red-400"
                aria-label="Remove language"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              onChange((p) => ({
                ...p,
                languages: [
                  ...p.languages,
                  { id: createId('lang'), name: '', proficiency: 'Professional' },
                ],
              }))
            }
            className="inline-flex items-center gap-2 rounded-lg border border-white/[0.12] bg-[#181D29] px-4 py-2.5 text-xs font-semibold text-white hover:border-[#D4A843]/50"
          >
            <Plus className="h-4 w-4 text-[#D4A843]" />
            <span>Add Language</span>
          </button>
        </div>
      );
    }

    // 9. Achievements
    if (activeSection === 'achievements') {
      return (
        <div className="space-y-4">
          {resume.achievements.map((ach) => (
            <div
              key={ach.id}
              className="space-y-3 rounded-lg border border-white/[0.08] bg-[#10141D] p-4"
            >
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() =>
                    onChange((p) => ({
                      ...p,
                      achievements: p.achievements.filter((a) => a.id !== ach.id),
                    }))
                  }
                  className="inline-flex items-center gap-1 text-xs text-[#98A2B3] hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Remove</span>
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <input
                  type="text"
                  value={ach.title}
                  placeholder="Award / Achievement Title"
                  onChange={(e) =>
                    onChange((p) => ({
                      ...p,
                      achievements: p.achievements.map((a) =>
                        a.id === ach.id ? { ...a, title: e.target.value } : a,
                      ),
                    }))
                  }
                  className={INPUT_CLASS}
                />
                <input
                  type="text"
                  value={ach.issuer}
                  placeholder="Organization"
                  onChange={(e) =>
                    onChange((p) => ({
                      ...p,
                      achievements: p.achievements.map((a) =>
                        a.id === ach.id ? { ...a, issuer: e.target.value } : a,
                      ),
                    }))
                  }
                  className={INPUT_CLASS}
                />
                <input
                  type="text"
                  value={ach.date}
                  placeholder="Year / Date"
                  onChange={(e) =>
                    onChange((p) => ({
                      ...p,
                      achievements: p.achievements.map((a) =>
                        a.id === ach.id ? { ...a, date: e.target.value } : a,
                      ),
                    }))
                  }
                  className={INPUT_CLASS}
                />
              </div>
              <textarea
                rows={2}
                value={ach.description}
                placeholder="Brief context or measurable significance..."
                onChange={(e) =>
                  onChange((p) => ({
                    ...p,
                    achievements: p.achievements.map((a) =>
                      a.id === ach.id ? { ...a, description: e.target.value } : a,
                    ),
                  }))
                }
                className={TEXTAREA_CLASS}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              onChange((p) => ({
                ...p,
                achievements: [
                  ...p.achievements,
                  { id: createId('ach'), title: '', issuer: '', date: '', description: '' },
                ],
              }))
            }
            className="inline-flex items-center gap-2 rounded-lg border border-white/[0.12] bg-[#181D29] px-4 py-2.5 text-xs font-semibold text-white hover:border-[#D4A843]/50"
          >
            <Plus className="h-4 w-4 text-[#D4A843]" />
            <span>Add Achievement</span>
          </button>
        </div>
      );
    }

    // 10. Custom Sections
    if (activeSection.startsWith('custom:')) {
      const cid = activeSection.replace('custom:', '');
      const custom = resume.customSections.find((c) => c.id === cid);
      if (!custom) return null;

      return (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/[0.08] bg-[#10141D] p-3.5">
            <div className="flex-1 min-w-[200px]">
              <label className="mb-1 block text-xs text-[#98A2B3]">Custom Section Title</label>
              <input
                type="text"
                value={custom.title}
                onChange={(e) => {
                  const val = e.target.value;
                  onChange((p) => ({
                    ...p,
                    customSections: p.customSections.map((c) =>
                      c.id === cid ? { ...c, title: val } : c,
                    ),
                    sections: p.sections.map((s) =>
                      s.id === activeSection ? { ...s, title: val } : s,
                    ),
                  }));
                }}
                className={INPUT_CLASS}
              />
            </div>
            <div className="flex items-center gap-2 self-end">
              <button
                type="button"
                onClick={() => handleDuplicateCustomSection(cid)}
                className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-white/[0.1] px-3 text-xs font-medium text-[#CBD5E1] hover:bg-white/[0.05]"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>Duplicate</span>
              </button>
              <button
                type="button"
                onClick={() => handleDeleteCustomSection(cid)}
                className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-red-500/30 px-3 text-xs font-medium text-red-300 hover:bg-red-500/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Section</span>
              </button>
            </div>
          </div>

          {custom.items.map((item) => (
            <div
              key={item.id}
              className="space-y-3 rounded-lg border border-white/[0.08] bg-[#10141D] p-4"
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <input
                  type="text"
                  value={item.heading}
                  placeholder="Entry Heading"
                  onChange={(e) =>
                    onChange((p) => ({
                      ...p,
                      customSections: p.customSections.map((c) =>
                        c.id === cid
                          ? {
                              ...c,
                              items: c.items.map((it) =>
                                it.id === item.id ? { ...it, heading: e.target.value } : it,
                              ),
                            }
                          : c,
                      ),
                    }))
                  }
                  className={INPUT_CLASS}
                />
                <input
                  type="text"
                  value={item.subheading}
                  placeholder="Organization / Subtitle"
                  onChange={(e) =>
                    onChange((p) => ({
                      ...p,
                      customSections: p.customSections.map((c) =>
                        c.id === cid
                          ? {
                              ...c,
                              items: c.items.map((it) =>
                                it.id === item.id ? { ...it, subheading: e.target.value } : it,
                              ),
                            }
                          : c,
                      ),
                    }))
                  }
                  className={INPUT_CLASS}
                />
                <input
                  type="text"
                  value={item.date}
                  placeholder="Date"
                  onChange={(e) =>
                    onChange((p) => ({
                      ...p,
                      customSections: p.customSections.map((c) =>
                        c.id === cid
                          ? {
                              ...c,
                              items: c.items.map((it) =>
                                it.id === item.id ? { ...it, date: e.target.value } : it,
                              ),
                            }
                          : c,
                      ),
                    }))
                  }
                  className={INPUT_CLASS}
                />
              </div>
              <textarea
                rows={3}
                value={item.description}
                placeholder="Description..."
                onChange={(e) =>
                  onChange((p) => ({
                    ...p,
                    customSections: p.customSections.map((c) =>
                      c.id === cid
                        ? {
                            ...c,
                            items: c.items.map((it) =>
                              it.id === item.id ? { ...it, description: e.target.value } : it,
                            ),
                          }
                        : c,
                    ),
                  }))
                }
                className={TEXTAREA_CLASS}
              />
            </div>
          ))}

          <button
            type="button"
            onClick={() =>
              onChange((p) => ({
                ...p,
                customSections: p.customSections.map((c) =>
                  c.id === cid
                    ? {
                        ...c,
                        items: [
                          ...c.items,
                          {
                            id: createId('citem'),
                            heading: '',
                            subheading: '',
                            date: '',
                            description: '',
                            bullets: [],
                          },
                        ],
                      }
                    : c,
                ),
              }))
            }
            className="inline-flex items-center gap-2 rounded-lg border border-white/[0.12] bg-[#181D29] px-4 py-2.5 text-xs font-semibold text-white hover:border-[#D4A843]/50"
          >
            <Plus className="h-4 w-4 text-[#D4A843]" />
            <span>Add Entry</span>
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex h-[calc(100vh-60px)] flex-col overflow-hidden">
      {/* Secondary Workspace Toolbar */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] bg-[#12161F] px-4 py-2.5 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <input
            type="text"
            value={resume.title}
            onChange={(e) => onChange((p) => ({ ...p, title: e.target.value }))}
            aria-label="Resume title"
            className="font-display h-8 max-w-[240px] truncate rounded-md border border-transparent bg-transparent px-2 text-sm font-semibold text-white transition-colors hover:border-white/[0.12] focus:border-[#D4A843] focus:bg-[#0B0E14] focus:outline-none sm:max-w-[320px]"
          />
          {lastSavedAt && (
            <span className="hidden font-mono-tabular text-xs text-[#64748B] sm:inline">
              Autosaved {lastSavedAt}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!canUndo}
            onClick={onUndo}
            title="Undo"
            className="inline-flex h-8 items-center gap-1 rounded-md border border-white/[0.08] bg-[#181D29] px-2.5 text-xs text-[#CBD5E1] transition-colors hover:text-white disabled:opacity-35"
          >
            <Undo2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Undo</span>
          </button>
          <button
            type="button"
            disabled={!canRedo}
            onClick={onRedo}
            title="Redo"
            className="inline-flex h-8 items-center gap-1 rounded-md border border-white/[0.08] bg-[#181D29] px-2.5 text-xs text-[#CBD5E1] transition-colors hover:text-white disabled:opacity-35"
          >
            <Redo2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Redo</span>
          </button>
          <button
            type="button"
            onClick={onSaveDraft}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-white/[0.08] bg-[#181D29] px-3 text-xs font-medium text-[#ECEFF4] whitespace-nowrap hover:border-white/20"
          >
            <Save className="h-3.5 w-3.5 text-[#D4A843]" />
            <span>Save Draft</span>
          </button>
          <button
            type="button"
            onClick={onDuplicateResume}
            className="hidden h-8 items-center gap-1.5 rounded-md border border-white/[0.08] bg-[#181D29] px-3 text-xs font-medium text-[#CBD5E1] whitespace-nowrap hover:text-white md:inline-flex"
          >
            <Copy className="h-3.5 w-3.5" />
            <span>Duplicate</span>
          </button>
        </div>
      </div>

      {/* Mobile View Switcher (< lg) */}
      <div className="no-print flex items-center gap-1 border-b border-white/[0.08] bg-[#0B0E14] px-4 py-2 lg:hidden">
        {(
          [
            ['edit', 'Edit Resume'],
            ['preview', 'Live Preview'],
            ['design', 'Templates & Design'],
          ] as Array<[MobileTab, string]>
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setMobileTab(id);
              if (id === 'preview') setRightTab('preview');
              if (id === 'design' && rightTab === 'preview') setRightTab('templates');
            }}
            className={`flex-1 rounded-md py-2 text-xs font-semibold transition-colors ${
              mobileTab === id
                ? 'bg-[#D4A843] text-[#0B0E14]'
                : 'bg-[#12161F] text-[#98A2B3]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 3-Pane Workspace */}
      <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-12">
        {/* LEFT SIDEBAR: Section Navigation & Drag-and-Drop Ordering */}
        <aside
          className={`no-print flex flex-col border-r border-white/[0.08] bg-[#0F131B] lg:col-span-2 lg:flex ${
            mobileTab === 'edit' ? 'block max-h-48 overflow-y-auto border-b lg:max-h-none lg:border-b-0' : 'hidden'
          }`}
        >
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
            <span className="text-xs font-semibold text-[#98A2B3]">Resume Sections</span>
            <span className="text-[11px] text-[#64748B]">Drag to reorder</span>
          </div>

          <div className="flex-1 space-y-1 overflow-y-auto p-2.5">
            {resume.sections.map((sec, index) => {
              const isSelected = activeSection === sec.id;
              const count = getSectionCountLabel(sec.id);
              return (
                <div
                  key={sec.id}
                  draggable={index > 0}
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDropSection(index)}
                  className={`group flex items-center gap-1.5 rounded-lg px-2 py-2 text-xs transition-colors ${
                    isSelected
                      ? 'bg-[#181E2B] font-semibold text-white'
                      : 'text-[#98A2B3] hover:bg-white/[0.04] hover:text-[#ECEFF4]'
                  }`}
                >
                  <span
                    className={`shrink-0 ${
                      index === 0 ? 'opacity-20' : 'cursor-grab text-[#64748B] group-hover:text-[#98A2B3]'
                    }`}
                  >
                    <GripVertical className="h-3.5 w-3.5" />
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveSection(sec.id)}
                    className="flex min-w-0 flex-1 items-center justify-between gap-2 text-left"
                  >
                    <span className="truncate">{sec.title}</span>
                    {count && (
                      <span className="font-mono-tabular text-[11px] text-[#64748B]">{count}</span>
                    )}
                  </button>
                  {index > 0 && (
                    <button
                      type="button"
                      title={sec.visible ? 'Hide section' : 'Show section'}
                      onClick={() =>
                        onChange((p) => ({
                          ...p,
                          sections: p.sections.map((s) =>
                            s.id === sec.id ? { ...s, visible: !s.visible } : s,
                          ),
                        }))
                      }
                      className="shrink-0 text-[#64748B] hover:text-white"
                      aria-label={sec.visible ? `Hide ${sec.title}` : `Show ${sec.title}`}
                    >
                      {sec.visible ? (
                        <Eye className="h-3.5 w-3.5" />
                      ) : (
                        <EyeOff className="h-3.5 w-3.5 text-amber-400" />
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="border-t border-white/[0.06] p-2.5">
            <button
              type="button"
              onClick={handleAddCustomSection}
              className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/[0.15] text-xs font-medium text-[#D4A843] transition-colors hover:border-[#D4A843]/60 hover:bg-[#D4A843]/8"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Custom Section</span>
            </button>
          </div>
        </aside>

        {/* CENTER PANEL: Structured Section Form Editor */}
        <section
          className={`no-print flex-1 overflow-y-auto bg-[#0B0E14] p-5 sm:p-6 lg:col-span-5 lg:block ${
            mobileTab === 'edit' ? 'block' : 'hidden'
          }`}
        >
          <div className="mx-auto max-w-2xl space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
              <div>
                <h1 className="font-display text-lg font-bold text-white">
                  {activeSectionMeta?.title || 'Edit Section'}
                </h1>
                <p className="mt-0.5 text-xs text-[#98A2B3]">
                  Changes sync instantaneously to the live preview and all 12 templates.
                </p>
              </div>
              {activeSection !== 'personal' && activeSectionMeta && (
                <input
                  type="text"
                  value={activeSectionMeta.title}
                  onChange={(e) => {
                    const nextTitle = e.target.value;
                    onChange((p) => ({
                      ...p,
                      sections: p.sections.map((s) =>
                        s.id === activeSection ? { ...s, title: nextTitle } : s,
                      ),
                    }));
                  }}
                  aria-label="Rename section heading"
                  title="Customize section heading title"
                  className="h-8 w-44 rounded-md border border-white/[0.1] bg-[#12161F] px-2.5 text-xs text-[#CBD5E1] focus:border-[#D4A843] focus:outline-none"
                />
              )}
            </div>

            {renderSectionEditor()}
          </div>
        </section>

        {/* RIGHT PANEL: Live Preview, 12 Templates, Design Customizer, AI Tools */}
        <section
          className={`flex flex-col overflow-hidden border-l border-white/[0.08] bg-[#12161F] lg:col-span-5 lg:flex ${
            mobileTab !== 'edit' ? 'flex flex-1' : 'hidden'
          }`}
        >
          {/* Right Panel Tab Strip */}
          <div className="no-print flex items-center justify-between gap-2 border-b border-white/[0.08] px-3 py-2">
            <div className="flex items-center gap-1 overflow-x-auto">
              {(
                [
                  { id: 'preview', label: 'Preview', icon: Eye },
                  { id: 'templates', label: 'Templates (12)', icon: LayoutGrid },
                  { id: 'design', label: 'Design', icon: Palette },
                  { id: 'ai-tools', label: 'AI Tools', icon: Sparkles },
                ] as const
              ).map((tab) => {
                const Icon = tab.icon;
                const active = rightTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setRightTab(tab.id)}
                    className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium whitespace-nowrap transition-colors ${
                      active
                        ? 'bg-[#D4A843] font-semibold text-[#0B0E14]'
                        : 'text-[#98A2B3] hover:bg-white/[0.05] hover:text-white'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {rightTab === 'preview' && (
              <div className="hidden items-center gap-1 sm:flex">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0.42, Number((z - 0.08).toFixed(2))))}
                  className="flex h-7 w-7 items-center justify-center rounded border border-white/[0.08] text-[#98A2B3] hover:text-white"
                  aria-label="Zoom out"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </button>
                <span className="w-10 text-center font-mono-tabular text-[11px] text-[#CBD5E1]">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(1.05, Number((z + 0.08).toFixed(2))))}
                  className="flex h-7 w-7 items-center justify-center rounded border border-white/[0.08] text-[#98A2B3] hover:text-white"
                  aria-label="Zoom in"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Right Panel Body */}
          <div className="flex-1 overflow-auto bg-[#0D1118]">
            {rightTab === 'preview' && (
              <div className="flex min-h-full flex-col items-center p-5">
                <div className="no-print mb-4 flex w-full max-w-[540px] flex-wrap items-center justify-between gap-2 text-xs text-[#98A2B3]">
                  <span>
                    {resume.design.pageSize} · {resume.design.templateId.replace(/-/g, ' ')}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => exportResumeToPdf(resume)}
                      className="inline-flex items-center gap-1 rounded-md border border-white/[0.1] bg-[#181D29] px-2.5 py-1 text-xs font-medium text-white hover:border-[#D4A843]/50"
                    >
                      <Download className="h-3 w-3 text-[#D4A843]" />
                      <span>PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => exportResumeToDocx(resume)}
                      className="inline-flex items-center gap-1 rounded-md border border-white/[0.1] bg-[#181D29] px-2.5 py-1 text-xs font-medium text-white hover:border-[#D4A843]/50"
                    >
                      <FileText className="h-3 w-3 text-[#D4A843]" />
                      <span>DOCX</span>
                    </button>
                  </div>
                </div>
                <ResumePreview
                  resume={resume}
                  scale={zoom}
                  showPageGuides={true}
                />
              </div>
            )}

            {rightTab === 'templates' && (
              <TemplateGalleryPanel resume={resume} onSelectTemplate={handleSelectTemplate} />
            )}

            {rightTab === 'design' && (
              <DesignPanel design={resume.design} onChange={updateDesign} />
            )}

            {rightTab === 'ai-tools' && (
              <AIToolsPanel
                resume={resume}
                onJumpToSection={(sec) => {
                  setActiveSection(sec);
                  setMobileTab('edit');
                }}
                onApplyHeadline={(headline) =>
                  onChange((p) => ({ ...p, personal: { ...p.personal, jobTitle: headline } }))
                }
                onApplySummary={(summary) => onChange((p) => ({ ...p, summary }))}
                onAddSuggestedSkills={(suggested) =>
                  onChange((p) => {
                    const mergeUnique = (a: string[], b: string[]) => {
                      const seen = new Set(a.map((x) => x.toLowerCase()));
                      const out = [...a];
                      for (const item of b) {
                        if (!seen.has(item.toLowerCase())) {
                          out.push(item);
                          seen.add(item.toLowerCase());
                        }
                      }
                      return out;
                    };
                    return {
                      ...p,
                      skills: {
                        technical: mergeUnique(p.skills.technical, suggested.technical),
                        tools: mergeUnique(p.skills.tools, suggested.tools),
                        soft: mergeUnique(p.skills.soft, suggested.soft),
                      },
                    };
                  })
                }
                onApplyTranslatedResume={(translated) =>
                  onChange((p) => ({
                    ...p,
                    summary: translated.summary ?? p.summary,
                    personal: {
                      ...p.personal,
                      ...(translated.personal || {}),
                      photoDataUrl: p.personal.photoDataUrl,
                    },
                    experience: Array.isArray(translated.experience)
                      ? translated.experience.map((e, i) => ({
                          ...e,
                          id: p.experience[i]?.id || createId('exp'),
                        }))
                      : p.experience,
                    education: Array.isArray(translated.education)
                      ? translated.education.map((e, i) => ({
                          ...e,
                          id: p.education[i]?.id || createId('edu'),
                        }))
                      : p.education,
                    projects: Array.isArray(translated.projects)
                      ? translated.projects.map((pr, i) => ({
                          ...pr,
                          id: p.projects[i]?.id || createId('proj'),
                        }))
                      : p.projects,
                    skills: translated.skills || p.skills,
                  }))
                }
              />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
