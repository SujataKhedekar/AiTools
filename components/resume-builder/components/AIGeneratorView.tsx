import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, FileUp, Loader2, ShieldCheck, Sparkles } from 'lucide-react';
import { createBlankResume, createId } from '../data/templates';
import { ResumeDocument, ResumeGeneratorInput } from '../types/resume';
import { generateResumeWithAI, parseUploadedResume } from '../services/api';
import { normalizeResume } from '../utils/storage';

interface AIGeneratorViewProps {
  initialMode: 'form' | 'upload';
  onResumeReady: (resume: ResumeDocument) => void;
}

const INPUT_CLASS =
  'h-10 w-full rounded-lg border border-white/[0.1] bg-[#0B0E14] px-3 text-sm text-white placeholder-[#64748B] focus:border-[#D4A843] focus:outline-none';
const TEXTAREA_CLASS =
  'w-full rounded-lg border border-white/[0.1] bg-[#0B0E14] p-3 text-sm text-white placeholder-[#64748B] focus:border-[#D4A843] focus:outline-none';

function hydrateAIResume(raw: Partial<ResumeDocument>): ResumeDocument {
  const base = createBlankResume(raw.title || raw.personal?.jobTitle || 'AI Generated Resume');
  const hydrated = normalizeResume({
    ...base,
    ...raw,
    id: createId('res'),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    experience: (raw.experience || []).map((e) => ({
      ...e,
      id: createId('exp'),
      bullets: Array.isArray(e.bullets) ? e.bullets : [],
    })),
    education: (raw.education || []).map((e) => ({ ...e, id: createId('edu') })),
    projects: (raw.projects || []).map((p) => ({
      ...p,
      id: createId('proj'),
      technologies: Array.isArray(p.technologies) ? p.technologies : [],
      highlights: Array.isArray(p.highlights) ? p.highlights : [],
    })),
    certifications: (raw.certifications || []).map((c) => ({ ...c, id: createId('cert') })),
    languages: (raw.languages || []).map((l) => ({
      ...l,
      id: createId('lang'),
      proficiency: (['Native', 'Fluent', 'Professional', 'Conversational', 'Basic'].includes(
        l.proficiency,
      )
        ? l.proficiency
        : 'Professional') as ResumeDocument['languages'][number]['proficiency'],
    })),
    achievements: (raw.achievements || []).map((a) => ({ ...a, id: createId('ach') })),
  });
  return hydrated;
}

export default function AIGeneratorView({ initialMode, onResumeReady }: AIGeneratorViewProps) {
  const [mode, setMode] = useState<'form' | 'upload'>(initialMode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Option A form state
  const [form, setForm] = useState<ResumeGeneratorInput>({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    portfolio: '',
    jobTitle: '',
    yearsOfExperience: '',
    currentCompany: '',
    previousWorkExperience: '',
    education: '',
    technicalSkills: '',
    softSkills: '',
    certifications: '',
    projects: '',
    targetJobDescription: '',
    careerObjective: '',
  });

  // Option B upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [enhanceUpload, setEnhanceUpload] = useState(true);
  const [uploadTargetJd, setUploadTargetJd] = useState('');

  const handleGenerateFromForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.fullName.trim() || !form.jobTitle.trim()) {
      setError('Please enter at least your full name and job title to generate a resume.');
      return;
    }
    setBusy(true);
    try {
      const generated = await generateResumeWithAI(form);
      onResumeReady(hydrateAIResume(generated));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate resume.');
    } finally {
      setBusy(false);
    }
  };

  const handleFileChange = (file: File | null) => {
    setError(null);
    if (!file) return;
    const ext = file.name.toLowerCase();
    if (!ext.endsWith('.pdf') && !ext.endsWith('.docx')) {
      setError('Please upload a PDF (.pdf) or Microsoft Word (.docx) file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Uploaded resume must be 5 MB or smaller.');
      return;
    }
    setSelectedFile(file);
  };

  const handleProcessUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Choose a PDF or DOCX resume file first.');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const parsed = await parseUploadedResume(selectedFile, enhanceUpload, uploadTargetJd);
      onResumeReady(hydrateAIResume(parsed));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract and parse resume.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1160px] space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col justify-between gap-4 border-b border-white/[0.08] pb-6 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-medium text-[#D4A843]">AI Resume Studio</p>
          <h1 className="font-display mt-1 text-3xl font-bold tracking-tight text-white">
            AI Resume Generator
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-[#98A2B3]">
            Build a complete ATS-structured resume from your background or import an existing PDF / DOCX resume for clean restructuring.
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="inline-flex rounded-lg border border-white/[0.08] bg-[#12161F] p-1">
          <button
            type="button"
            onClick={() => {
              setMode('form');
              setError(null);
            }}
            className={`h-9 rounded-md px-4 text-xs font-semibold whitespace-nowrap transition-colors ${
              mode === 'form' ? 'bg-[#D4A843] text-[#0B0E14]' : 'text-[#98A2B3] hover:text-white'
            }`}
          >
            Option A · From Information
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('upload');
              setError(null);
            }}
            className={`h-9 rounded-md px-4 text-xs font-semibold whitespace-nowrap transition-colors ${
              mode === 'upload' ? 'bg-[#D4A843] text-[#0B0E14]' : 'text-[#98A2B3] hover:text-white'
            }`}
          >
            Option B · From Existing PDF / DOCX
          </button>
        </div>
      </div>

      {/* Privacy & Factual Integrity Disclosure */}
      <div className="flex items-start gap-3 rounded-lg border border-white/[0.08] bg-[#12161F] p-4 text-xs text-[#CBD5E1]">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#D4A843]" />
        <p className="leading-relaxed">
          <strong className="font-semibold text-white">Privacy & Accuracy Notice:</strong> Information and uploaded files you submit here are sent securely to our server-side AI model solely to structure and refine your resume, and files are processed in memory without permanent server storage. AI preserves your real credentials and never fabricates employers, dates, degrees, or achievements.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-lg border border-red-500/35 bg-red-500/10 p-4 text-sm text-red-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {mode === 'form' ? (
        <form onSubmit={handleGenerateFromForm} className="space-y-6 rounded-xl border border-white/[0.08] bg-[#12161F] p-6">
          {/* Contact & Profile */}
          <div className="space-y-4">
            <h2 className="font-display text-base font-semibold text-white">
              01. Personal & Contact Details
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-xs text-[#98A2B3]">Full Name *</label>
                <input
                  type="text"
                  required
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  placeholder="Jordan Patel"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-[#98A2B3]">Target / Current Job Title *</label>
                <input
                  type="text"
                  required
                  value={form.jobTitle}
                  onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
                  placeholder="Product Manager"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-[#98A2B3]">Years of Experience</label>
                <input
                  type="text"
                  value={form.yearsOfExperience}
                  onChange={(e) => setForm({ ...form, yearsOfExperience: e.target.value })}
                  placeholder="e.g. 6 years"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-[#98A2B3]">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="jordan@example.com"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-[#98A2B3]">Phone Number</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+1 (212) 555-0182"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-[#98A2B3]">Location</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="New York, NY"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-[#98A2B3]">LinkedIn URL</label>
                <input
                  type="url"
                  value={form.linkedin}
                  onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
                  placeholder="https://linkedin.com/in/jordanpatel"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-[#98A2B3]">Portfolio URL</label>
                <input
                  type="url"
                  value={form.portfolio}
                  onChange={(e) => setForm({ ...form, portfolio: e.target.value })}
                  placeholder="https://jordanpatel.co"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-[#98A2B3]">Current Company</label>
                <input
                  type="text"
                  value={form.currentCompany}
                  onChange={(e) => setForm({ ...form, currentCompany: e.target.value })}
                  placeholder="Acme Cloud Inc."
                  className={INPUT_CLASS}
                />
              </div>
            </div>
          </div>

          {/* Experience & Education */}
          <div className="space-y-4 border-t border-white/[0.08] pt-6">
            <h2 className="font-display text-base font-semibold text-white">
              02. Experience, Education & Credentials
            </h2>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs text-[#98A2B3]">
                  Work Experience Notes (Companies, Roles, Dates, Achievements)
                </label>
                <textarea
                  rows={5}
                  value={form.previousWorkExperience}
                  onChange={(e) => setForm({ ...form, previousWorkExperience: e.target.value })}
                  placeholder="List your roles, dates, and real accomplishments..."
                  className={TEXTAREA_CLASS}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-[#98A2B3]">Education</label>
                <textarea
                  rows={5}
                  value={form.education}
                  onChange={(e) => setForm({ ...form, education: e.target.value })}
                  placeholder="University, degree, graduation year, honors..."
                  className={TEXTAREA_CLASS}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-[#98A2B3]">Technical Skills</label>
                <textarea
                  rows={3}
                  value={form.technicalSkills}
                  onChange={(e) => setForm({ ...form, technicalSkills: e.target.value })}
                  placeholder="SQL, Python, Roadmapping, A/B Testing, Figma, Jira..."
                  className={TEXTAREA_CLASS}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-[#98A2B3]">Soft Skills</label>
                <textarea
                  rows={3}
                  value={form.softSkills}
                  onChange={(e) => setForm({ ...form, softSkills: e.target.value })}
                  placeholder="Executive communication, cross-functional leadership..."
                  className={TEXTAREA_CLASS}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-[#98A2B3]">Projects</label>
                <textarea
                  rows={3}
                  value={form.projects}
                  onChange={(e) => setForm({ ...form, projects: e.target.value })}
                  placeholder="Notable projects, tools used, and outcomes..."
                  className={TEXTAREA_CLASS}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-[#98A2B3]">Certifications</label>
                <textarea
                  rows={3}
                  value={form.certifications}
                  onChange={(e) => setForm({ ...form, certifications: e.target.value })}
                  placeholder="PMP, AWS Solutions Architect, Google Analytics..."
                  className={TEXTAREA_CLASS}
                />
              </div>
            </div>
          </div>

          {/* Career Objective & Target JD */}
          <div className="space-y-4 border-t border-white/[0.08] pt-6">
            <h2 className="font-display text-base font-semibold text-white">
              03. Target Alignment (Optional)
            </h2>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs text-[#98A2B3]">Career Objective</label>
                <textarea
                  rows={3}
                  value={form.careerObjective}
                  onChange={(e) => setForm({ ...form, careerObjective: e.target.value })}
                  placeholder="What role, industry, or impact are you targeting next?"
                  className={TEXTAREA_CLASS}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-[#98A2B3]">Target Job Description</label>
                <textarea
                  rows={3}
                  value={form.targetJobDescription}
                  onChange={(e) => setForm({ ...form, targetJobDescription: e.target.value })}
                  placeholder="Paste the job posting to align your existing experience terminology..."
                  className={TEXTAREA_CLASS}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end border-t border-white/[0.08] pt-5">
            <button
              type="submit"
              disabled={busy}
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#D4A843] px-6 text-sm font-semibold text-[#0B0E14] transition-colors hover:bg-[#E3BB5C] disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              <span>{busy ? 'Generating Structured Resume...' : 'Generate Complete Resume'}</span>
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleProcessUpload} className="space-y-6 rounded-xl border border-white/[0.08] bg-[#12161F] p-6">
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/[0.14] bg-[#0B0E14] px-6 py-12 text-center transition-colors hover:border-[#D4A843]/60">
            <FileUp className="h-8 w-8 text-[#D4A843]" />
            <p className="mt-3 text-sm font-semibold text-white">
              {selectedFile ? selectedFile.name : 'Drop your existing PDF or DOCX resume here'}
            </p>
            <p className="mt-1 text-xs text-[#98A2B3]">
              {selectedFile
                ? `${(selectedFile.size / 1024).toFixed(1)} KB · Ready to extract`
                : 'Supports PDF and Microsoft Word (.docx) up to 5 MB'}
            </p>
            <input
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              className="hidden"
            />
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-white/[0.08] bg-[#10141D] p-4">
            <input
              type="checkbox"
              checked={enhanceUpload}
              onChange={(e) => setEnhanceUpload(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[#D4A843]"
            />
            <div className="text-xs">
              <div className="font-semibold text-white">
                Enhance wording, action verbs, and ATS clarity during import
              </div>
              <div className="mt-0.5 text-[#98A2B3]">
                Uncheck to perform a strict verbatim extraction into the Aivora live editor.
              </div>
            </div>
          </label>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#98A2B3]">
              Optional Target Job Description (for phrasing alignment)
            </label>
            <textarea
              rows={4}
              value={uploadTargetJd}
              onChange={(e) => setUploadTargetJd(e.target.value)}
              placeholder="Paste a target role description if you want phrasing aligned while keeping your facts intact..."
              className={TEXTAREA_CLASS}
            />
          </div>

          <div className="flex items-center justify-between border-t border-white/[0.08] pt-5">
            <div className="flex items-center gap-2 text-xs text-[#98A2B3]">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Opens directly in the Live Editor for full review</span>
            </div>
            <button
              type="submit"
              disabled={busy || !selectedFile}
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#D4A843] px-6 text-sm font-semibold text-[#0B0E14] transition-colors hover:bg-[#E3BB5C] disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              <span>{busy ? 'Extracting & Structuring...' : 'Import & Open in Editor'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
