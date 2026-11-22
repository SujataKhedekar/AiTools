export type TemplateId =
  | 'modern-professional'
  | 'minimal-clean'
  | 'corporate-executive'
  | 'creative-designer'
  | 'senior-manager'
  | 'technical-developer'
  | 'marketing-specialist'
  | 'fresher-resume'
  | 'academic-resume'
  | 'two-column-modern'
  | 'elegant-professional'
  | 'ats-classic';

export type BuiltInSectionKey =
  | 'personal'
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'certifications'
  | 'languages'
  | 'achievements';

export type SectionKey = BuiltInSectionKey | `custom:${string}`;

export interface SectionConfig {
  id: SectionKey;
  title: string;
  visible: boolean;
  isCustom?: boolean;
}

export interface PersonalInfo {
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  portfolio: string;
  photoDataUrl: string;
}

export interface ExperienceItem {
  id: string;
  company: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  bullets: string[];
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  field: string;
  location: string;
  startDate: string;
  endDate: string;
  gpa: string;
  highlights: string;
}

export interface SkillsData {
  technical: string[];
  soft: string[];
  tools: string[];
}

export interface ProjectItem {
  id: string;
  name: string;
  role: string;
  link: string;
  startDate: string;
  endDate: string;
  technologies: string[];
  description: string;
  highlights: string[];
}

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  date: string;
  credentialId: string;
  url: string;
}

export interface LanguageItem {
  id: string;
  name: string;
  proficiency: 'Native' | 'Fluent' | 'Professional' | 'Conversational' | 'Basic';
}

export interface AchievementItem {
  id: string;
  title: string;
  issuer: string;
  date: string;
  description: string;
}

export interface CustomSectionEntry {
  id: string;
  heading: string;
  subheading: string;
  date: string;
  description: string;
  bullets: string[];
}

export interface CustomSection {
  id: string;
  title: string;
  items: CustomSectionEntry[];
}

export type FontFamilyOption =
  | 'Plus Jakarta Sans'
  | 'DM Sans'
  | 'Lora'
  | 'Merriweather'
  | 'Playfair Display'
  | 'IBM Plex Mono';

export type LayoutOverride = 'template' | 'single' | 'two-column';
export type SpacingOption = 'compact' | 'balanced' | 'airy';
export type MarginOption = 'narrow' | 'normal' | 'wide';
export type HeaderAlignment = 'left' | 'center' | 'split';
export type DividerStyle = 'hairline' | 'bold' | 'dotted' | 'none';
export type BulletStyle = 'disc' | 'square' | 'dash' | 'arrow';
export type PageSize = 'A4' | 'Letter';

export interface DesignConfig {
  templateId: TemplateId;
  accentColor: string;
  fontFamily: FontFamilyOption;
  baseFontSize: number; // 9 to 12 pt
  headingScale: number; // 1.1 to 1.6
  fontWeight: '400' | '500';
  lineHeight: number; // 1.25 to 1.7
  layoutOverride: LayoutOverride;
  sectionSpacing: SpacingOption;
  pageMargins: MarginOption;
  headerAlignment: HeaderAlignment;
  dividerStyle: DividerStyle;
  bulletStyle: BulletStyle;
  showPhoto: boolean;
  showIcons: boolean;
  pageSize: PageSize;
}

export interface ResumeDocument {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  targetRole: string;
  personal: PersonalInfo;
  summary: string;
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: SkillsData;
  projects: ProjectItem[];
  certifications: CertificationItem[];
  languages: LanguageItem[];
  achievements: AchievementItem[];
  customSections: CustomSection[];
  sections: SectionConfig[];
  design: DesignConfig;
}

export interface TemplateDefinition {
  id: TemplateId;
  name: string;
  category: 'Executive' | 'Modern' | 'Minimal' | 'Technical' | 'Creative' | 'Academic' | 'Entry-Level' | 'ATS';
  description: string;
  defaultLayout: 'single' | 'two-column';
  defaultAccent: string;
  defaultFont: FontFamilyOption;
  atsFriendly: boolean;
  atsNote: string;
}

export type AIAssistAction =
  | 'generate'
  | 'rewrite'
  | 'professional'
  | 'shorten'
  | 'expand'
  | 'improve-wording'
  | 'fix-grammar'
  | 'suggest-skills'
  | 'headline'
  | 'linkedin-summary'
  | 'career-objective'
  | 'tailor-job'
  | 'translate'
  | 'tone-adjust';

export interface ATSCategoryScore {
  name: string;
  score: number;
  status: 'strong' | 'moderate' | 'needs-work';
  summary: string;
}

export interface ATSAnalysisResult {
  overallScore: number;
  keywordMatchPercent: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  relevantSkillsFound: string[];
  recommendedSkillsToVerify: string[];
  categories: ATSCategoryScore[];
  formattingIssues: string[];
  contactChecks: Array<{ label: string; passed: boolean; detail: string }>;
  sectionCompleteness: Array<{ section: string; status: 'complete' | 'partial' | 'missing'; note: string }>;
  experienceRelevance: string;
  readabilitySuggestions: string[];
  actionableRecommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    area: string;
    recommendation: string;
  }>;
  disclaimer: string;
}

export type CoverLetterTone = 'professional' | 'short' | 'creative' | 'executive';

export interface CoverLetterDocument {
  companyName: string;
  jobTitle: string;
  hiringManager: string;
  jobDescription: string;
  tone: CoverLetterTone;
  subjectLine: string;
  salutation: string;
  paragraphs: string[];
  signOff: string;
  updatedAt: string;
}

export interface ResumeGeneratorInput {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  portfolio: string;
  jobTitle: string;
  yearsOfExperience: string;
  currentCompany: string;
  previousWorkExperience: string;
  education: string;
  technicalSkills: string;
  softSkills: string;
  certifications: string;
  projects: string;
  targetJobDescription: string;
  careerObjective: string;
}

export type ActiveAppView = 'resumes' | 'editor' | 'generator' | 'ats' | 'cover-letter';
