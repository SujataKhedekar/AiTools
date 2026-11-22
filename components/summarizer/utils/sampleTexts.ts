import type { SummarizationMode } from '../types/summarizer';

export const SAMPLE_TEXTS: Partial<Record<SummarizationMode, string>> = {
  General: `Artificial intelligence adoption in enterprise software accelerated significantly between 2024 and 2026, shifting from experimental chatbots to embedded workflow automation. According to a 2025 industry survey of 1,400 technology leaders, 68% of organizations now deploy generative AI in production for document triage, customer support drafting, and code review, up from 31% in 2023.

However, implementation outcomes remain uneven. Teams that pair AI models with strict input validation, human-in-the-loop review, and domain-specific context report 2.4x faster turnaround times and a 37% reduction in manual copy-editing errors. Conversely, organizations that deploy uncalibrated prompts without grounding report higher hallucination rates and employee distrust.

Security and cost governance have also become primary architectural concerns. Engineering teams increasingly route model calls through server-side API gateways to enforce rate limits, protect credentials, audit usage, and keep latency predictable under peak load. As model inference costs continue to fall, competitive advantage is shifting away from raw model access toward clean user experience, reliable document parsing, and verifiable outputs.`,

  'Meeting Summarizer': `Product & Engineering Weekly Sync — November 18, 2026
Attendees: Priya Nair (PM), Marcus Chen (Backend Lead), Elena Rostova (Design), David Park (QA)

1. Q4 Document Upload Rollout
Marcus confirmed that PDF and DOCX extraction endpoints passed load testing at 120 concurrent uploads with median latency of 420ms. Remaining edge case: scanned image-only PDFs return an empty text string; Priya asked that we surface a clear, friendly message guiding users to upload text-based PDFs or paste text directly.

2. Export Formatting Feedback
Elena shared usability test results from 14 beta users. 11 out of 14 users exported summaries to DOCX or PDF rather than copying plain text, and requested cleaner section headings for Key Takeaways and Action Items. Elena will finalize the spacing spec by Thursday, November 20.

3. Security & Rate Limiting
David verified that the server-side rate limiter (25 requests/minute per IP) and 10MB file size cap properly reject oversized payloads with HTTP 413.

Decisions Made:
- Ship AI Summarizer v1 to all workspace users on Monday, November 24.
- Keep default summary length at Medium and format at Paragraph.

Action Items:
- Marcus: Add explicit empty-PDF validation message before Friday, Nov 21.
- Elena: Deliver final print stylesheet tweaks by Thursday, Nov 20.
- David: Run cross-browser mobile responsiveness suite by Friday afternoon.
- Priya: Publish release notes and update the AI Service catalog entry on Nov 24.`,

  'Research Paper Summarizer': `Abstract & Findings: Impact of Structured Summarization Interfaces on Reading Comprehension in Knowledge Workers (2025)

Objective: This study evaluates whether multi-format AI-assisted summaries (paragraph overviews combined with numbered key takeaways and extracted quantitative facts) improve information retention and verification speed compared with standard prose-only summaries.

Methodology: We conducted a randomized controlled trial with 186 analysts, legal researchers, and graduate students across three institutions over a 6-week period. Participants reviewed 12 complex policy and scientific documents averaging 4,200 words each. Group A used raw source documents; Group B used single-paragraph AI summaries; Group C used structured multi-section summaries separating main claims, quantitative facts, and conclusions.

Results: Group C completed comprehension assessments 41% faster than Group A (mean 11.4 min vs. 19.3 min, p < 0.001) and achieved 18% higher factual recall accuracy than Group B (89.2% vs. 75.6%). Crucially, separating exact figures and dates into a dedicated Important Information list reduced verification oversight errors by 52%.

Limitations & Conclusion: Participants noted that overly aggressive condensation ("Very Short") omitted critical boundary conditions in technical texts. The authors conclude that allowing readers to adjust summary length, tone, and output structure yields optimal accuracy and trust.`,
};

export function getSampleTextForMode(mode: SummarizationMode): string {
  return SAMPLE_TEXTS[mode] ?? SAMPLE_TEXTS.General!;
}
