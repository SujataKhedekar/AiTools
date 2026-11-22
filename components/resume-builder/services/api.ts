import {
  AIAssistAction,
  ATSAnalysisResult,
  CoverLetterTone,
  ResumeDocument,
  ResumeGeneratorInput,
} from '../types/resume';

async function parseJsonResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data as T;
}

export async function generateResumeWithAI(
  input: ResumeGeneratorInput,
): Promise<Partial<ResumeDocument>> {
  const res = await fetch('/api/resume/ai/generate-resume', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input }),
  });
  const data = await parseJsonResponse<{ resume: Partial<ResumeDocument> }>(res);
  return data.resume;
}

export async function parseUploadedResume(
  file: File,
  enhance: boolean,
  targetJobDescription?: string,
): Promise<Partial<ResumeDocument>> {
  const form = new FormData();
  form.append('file', file);
  form.append('enhance', String(enhance));
  if (targetJobDescription?.trim()) {
    form.append('targetJobDescription', targetJobDescription.trim());
  }
  const res = await fetch('/api/resume/upload/parse-resume', {
    method: 'POST',
    body: form,
  });
  const data = await parseJsonResponse<{ resume: Partial<ResumeDocument> }>(res);
  return data.resume;
}

export async function extractTextFromFile(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch('/api/resume/upload/extract-text', {
    method: 'POST',
    body: form,
  });
  const data = await parseJsonResponse<{ text: string }>(res);
  return data.text;
}

export async function runAIAssist(params: {
  action: AIAssistAction;
  section?: string;
  text?: string;
  context?: ResumeDocument;
  targetLanguage?: string;
  targetTone?: string;
  jobDescription?: string;
}): Promise<{
  suggestion?: string;
  result?: { technical: string[]; tools: string[]; soft: string[]; note: string };
  translatedResume?: Partial<ResumeDocument>;
}> {
  const res = await fetch('/api/resume/ai/assist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  return parseJsonResponse(res);
}

export async function analyzeATSWithAI(
  resume: ResumeDocument,
  jobDescription: string,
): Promise<ATSAnalysisResult> {
  const res = await fetch('/api/resume/ai/ats-analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resume, jobDescription }),
  });
  const data = await parseJsonResponse<{ analysis: ATSAnalysisResult }>(res);
  return data.analysis;
}

export async function generateCoverLetterWithAI(params: {
  resume: ResumeDocument;
  companyName: string;
  jobTitle: string;
  hiringManager: string;
  jobDescription: string;
  tone: CoverLetterTone;
}): Promise<{
  subjectLine: string;
  salutation: string;
  paragraphs: string[];
  signOff: string;
}> {
  const res = await fetch('/api/resume/ai/cover-letter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await parseJsonResponse<{
    coverLetter: {
      subjectLine: string;
      salutation: string;
      paragraphs: string[];
      signOff: string;
    };
  }>(res);
  return data.coverLetter;
}
