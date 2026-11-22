import { createBlankResume, createId, createSampleResume, DEFAULT_DESIGN, DEFAULT_SECTIONS } from '../data/templates';
import { CoverLetterDocument, ResumeDocument } from '../types/resume';

const STORAGE_KEY = 'aivora_resume_builder_v1_resumes';
const ACTIVE_ID_KEY = 'aivora_resume_builder_v1_active_id';
const COVER_LETTER_KEY = 'aivora_resume_builder_v1_cover_letter';

export function sanitizeExternalUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const parsed = new URL(candidate);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

export function formatDisplayUrl(raw: string): string {
  return raw.trim().replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '');
}

export function normalizeResume(doc: Partial<ResumeDocument>): ResumeDocument {
  const base = createBlankResume(doc.title || 'Untitled Resume');
  return {
    ...base,
    ...doc,
    id: doc.id || createId('res'),
    createdAt: doc.createdAt || base.createdAt,
    updatedAt: doc.updatedAt || base.updatedAt,
    personal: { ...base.personal, ...(doc.personal || {}) },
    skills: {
      technical: Array.isArray(doc.skills?.technical) ? doc.skills.technical : [],
      soft: Array.isArray(doc.skills?.soft) ? doc.skills.soft : [],
      tools: Array.isArray(doc.skills?.tools) ? doc.skills.tools : [],
    },
    experience: Array.isArray(doc.experience) ? doc.experience : [],
    education: Array.isArray(doc.education) ? doc.education : [],
    projects: Array.isArray(doc.projects) ? doc.projects : [],
    certifications: Array.isArray(doc.certifications) ? doc.certifications : [],
    languages: Array.isArray(doc.languages) ? doc.languages : [],
    achievements: Array.isArray(doc.achievements) ? doc.achievements : [],
    customSections: Array.isArray(doc.customSections) ? doc.customSections : [],
    sections:
      Array.isArray(doc.sections) && doc.sections.length > 0
        ? doc.sections
        : DEFAULT_SECTIONS.map((s) => ({ ...s })),
    design: { ...DEFAULT_DESIGN, ...(doc.design || {}) },
  };
}

export function loadResumes(): ResumeDocument[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const starter = [createSampleResume()];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(starter));
      return starter;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const starter = [createSampleResume()];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(starter));
      return starter;
    }
    return parsed.map((item) => normalizeResume(item));
  } catch {
    return [createSampleResume()];
  }
}

export function saveResumes(resumes: ResumeDocument[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(resumes));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export function loadActiveResumeId(resumes: ResumeDocument[]): string {
  try {
    const saved = localStorage.getItem(ACTIVE_ID_KEY);
    if (saved && resumes.some((r) => r.id === saved)) {
      return saved;
    }
  } catch {
    // Ignore
  }
  return resumes[0]?.id || '';
}

export function saveActiveResumeId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_ID_KEY, id);
  } catch {
    // Ignore
  }
}

export function loadCoverLetter(): CoverLetterDocument {
  try {
    const raw = localStorage.getItem(COVER_LETTER_KEY);
    if (raw) {
      return JSON.parse(raw) as CoverLetterDocument;
    }
  } catch {
    // Ignore
  }
  return {
    companyName: '',
    jobTitle: '',
    hiringManager: '',
    jobDescription: '',
    tone: 'professional',
    subjectLine: '',
    salutation: 'Dear Hiring Manager,',
    paragraphs: [],
    signOff: 'Sincerely,',
    updatedAt: new Date().toISOString(),
  };
}

export function saveCoverLetter(doc: CoverLetterDocument): void {
  try {
    localStorage.setItem(COVER_LETTER_KEY, JSON.stringify(doc));
  } catch {
    // Ignore
  }
}

export interface CompletenessReport {
  score: number;
  checks: Array<{
    key: string;
    label: string;
    sectionId: string;
    completed: boolean;
    tip: string;
  }>;
}

export function calculateCompleteness(resume: ResumeDocument): CompletenessReport {
  const checks = [
    {
      key: 'name-role',
      label: 'Full name & target headline',
      sectionId: 'personal',
      completed: Boolean(resume.personal.fullName.trim() && resume.personal.jobTitle.trim()),
      tip: 'Add both your full name and current or target job title.',
    },
    {
      key: 'contact',
      label: 'Contact details (email, phone, location)',
      sectionId: 'personal',
      completed: Boolean(
        resume.personal.email.trim() && resume.personal.phone.trim() && resume.personal.location.trim(),
      ),
      tip: 'Include email, phone number, and city/region for recruiters.',
    },
    {
      key: 'links',
      label: 'LinkedIn or portfolio link',
      sectionId: 'personal',
      completed: Boolean(resume.personal.linkedin.trim() || resume.personal.portfolio.trim()),
      tip: 'Add a LinkedIn profile or portfolio URL.',
    },
    {
      key: 'summary',
      label: 'Professional summary (40+ characters)',
      sectionId: 'summary',
      completed: resume.summary.trim().length >= 40,
      tip: 'Write a concise 2–4 sentence professional summary.',
    },
    {
      key: 'experience',
      label: 'Work experience with action bullets',
      sectionId: 'experience',
      completed:
        resume.experience.length > 0 &&
        resume.experience.some((e) => e.company.trim() && e.bullets.some((b) => b.trim().length > 10)),
      tip: 'Add at least one role with clear, outcome-driven bullet points.',
    },
    {
      key: 'education',
      label: 'Education record',
      sectionId: 'education',
      completed: resume.education.some((e) => e.institution.trim() && e.degree.trim()),
      tip: 'List your highest degree or relevant educational program.',
    },
    {
      key: 'skills',
      label: 'At least 5 organized skills',
      sectionId: 'skills',
      completed:
        resume.skills.technical.length + resume.skills.soft.length + resume.skills.tools.length >= 5,
      tip: 'Add at least 5 technical, tool, or soft skills.',
    },
    {
      key: 'projects-or-certs',
      label: 'Projects, certifications, or achievements',
      sectionId: 'projects',
      completed:
        resume.projects.length > 0 || resume.certifications.length > 0 || resume.achievements.length > 0,
      tip: 'Strengthen credibility with a project, certification, or key achievement.',
    },
  ];

  const completedCount = checks.filter((c) => c.completed).length;
  const score = Math.round((completedCount / checks.length) * 100);
  return { score, checks };
}

export function formatShortDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}
