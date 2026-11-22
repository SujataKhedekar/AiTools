import type { DeckTheme } from '../types/deck';

export const DECK_THEMES: DeckTheme[] = [
  {
    id: 'cobalt-studio',
    name: 'Cobalt Studio',
    description: 'Crisp alabaster canvas with electric cobalt & deep slate typography',
    backgroundColor: '#FFFFFF',
    surfaceColor: '#F4F6FB',
    textColor: '#0F172A',
    mutedTextColor: '#475569',
    accentColor: '#3B5BDB',
    secondaryAccent: '#6366F1',
    fontDisplay: 'Plus Jakarta Sans',
    fontBody: 'DM Sans',
  },
  {
    id: 'obsidian-pitch',
    name: 'Obsidian Executive',
    description: 'Deep slate obsidian canvas with luminous indigo & sky highlights',
    backgroundColor: '#0B1120',
    surfaceColor: '#162033',
    textColor: '#F8FAFC',
    mutedTextColor: '#94A3B8',
    accentColor: '#6366F1',
    secondaryAccent: '#38BDF8',
    fontDisplay: 'Plus Jakarta Sans',
    fontBody: 'DM Sans',
  },
  {
    id: 'minimal-paper',
    name: 'Minimalist Editorial',
    description: 'Warm archival off-white with charcoal type and cobalt accents',
    backgroundColor: '#FAF9F6',
    surfaceColor: '#F1EFEA',
    textColor: '#18181B',
    mutedTextColor: '#52525B',
    accentColor: '#2563EB',
    secondaryAccent: '#0EA5E9',
    fontDisplay: 'Plus Jakarta Sans',
    fontBody: 'DM Sans',
  },
  {
    id: 'emerald-finance',
    name: 'Capital & Finance',
    description: 'Clean white boardroom grid with deep forest slate & emerald data accents',
    backgroundColor: '#FFFFFF',
    surfaceColor: '#F0FDF4',
    textColor: '#064E3B',
    mutedTextColor: '#374151',
    accentColor: '#059669',
    secondaryAccent: '#0284C7',
    fontDisplay: 'Plus Jakarta Sans',
    fontBody: 'DM Sans',
  },
  {
    id: 'violet-modern',
    name: 'Modern SaaS Gradient',
    description: 'Soft lavender-mist backdrop with crisp violet and cobalt accents',
    backgroundColor: '#F8F7FF',
    surfaceColor: '#EEF2FF',
    textColor: '#1E1B4B',
    mutedTextColor: '#4338CA',
    accentColor: '#4F46E5',
    secondaryAccent: '#7C3AED',
    fontDisplay: 'Plus Jakarta Sans',
    fontBody: 'DM Sans',
  },
];

export const PRESENTATION_TYPES = [
  'Startup Pitch Deck',
  'Investor Pitch Deck',
  'Business Proposal',
  'Company Profile',
  'Marketing Strategy',
  'Sales Presentation',
  'Product Launch',
  'Financial Report',
  'Educational Presentation',
  'Project Proposal',
  'Portfolio Presentation',
] as const;

export const PRESENTATION_TONES = [
  'Professional',
  'Minimal',
  'Creative',
  'Corporate',
  'Modern',
  'Educational',
] as const;

export const DESIGN_STYLES = [
  'Modern Executive',
  'Minimalist Editorial',
  'Dark Pitch',
  'Data-Driven Corporate',
  'Soft SaaS Gradient',
] as const;

export const COLOR_PALETTES = [
  { id: 'cobalt-studio', label: 'Cobalt & Slate', swatch: ['#FFFFFF', '#3B5BDB', '#0F172A'] },
  { id: 'obsidian-pitch', label: 'Obsidian Dark', swatch: ['#0B1120', '#6366F1', '#38BDF8'] },
  { id: 'minimal-paper', label: 'Warm Minimal', swatch: ['#FAF9F6', '#2563EB', '#18181B'] },
  { id: 'emerald-finance', label: 'Emerald Capital', swatch: ['#FFFFFF', '#059669', '#064E3B'] },
  { id: 'violet-modern', label: 'Soft Violet', swatch: ['#F8F7FF', '#4F46E5', '#7C3AED'] },
] as const;

export const PRESENTATION_LANGUAGES = [
  'English',
  'Spanish',
  'French',
  'German',
  'Portuguese',
  'Japanese',
  'Korean',
  'Mandarin Chinese',
] as const;

export const CURATED_VISUAL_ASSETS = [
  {
    id: 'architecture',
    label: 'Modern Innovation Pavilion',
    src: '/deckai/assets/hero_deck_showcase_1795339616751.jpg',
  },
  {
    id: 'product',
    label: 'Geometric Frosted Prisms',
    src: '/deckai/assets/template_startup_pitch_1795339616799.jpg',
  },
  {
    id: 'boardroom',
    label: 'Executive Boardroom',
    src: '/deckai/assets/template_corporate_strategy_1795339617216.jpg',
  },
  {
    id: 'creative',
    label: 'Editorial Archival Studio',
    src: '/deckai/assets/template_creative_portfolio_1795339616318.jpg',
  },
  {
    id: 'team',
    label: 'Product Design Collaboration',
    src: '/deckai/assets/slide_team_workspace_1795339616938.jpg',
  },
] as const;
