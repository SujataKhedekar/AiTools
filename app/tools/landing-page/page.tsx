import type { Metadata } from 'next';
import LandingPageEntry from '@/components/landing-page/LandingPageEntry';

export const metadata: Metadata = {
  title: 'AI Landing Page Generator | Aivora',
  description: 'Plan, generate, edit, and export conversion-focused landing pages with AI.',
};

export default function LandingPageTool() {
  return <LandingPageEntry />;
}
