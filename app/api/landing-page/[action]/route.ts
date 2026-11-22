import { NextRequest, NextResponse } from 'next/server';
import { analyzeBusinessWebsite } from '@/components/landing-page/server/engines/businessAnalyzer';
import { generateLandingPageStrategy } from '@/components/landing-page/server/engines/strategyEngine';
import { generatePageAndCtas } from '@/components/landing-page/server/engines/pageGenerator';
import { regenerateSingleSection } from '@/components/landing-page/server/engines/sectionRegenerator';
import { generateSeoAndCroReport } from '@/components/landing-page/server/engines/seoCroEngine';
import { getTokenUsageStats } from '@/components/landing-page/server/geminiClient';
import { analyzeUrlSchema, businessBriefSchema } from '@/components/landing-page/server/security';
import type { LandingPageStrategy, PageSection } from '@/components/landing-page/types/aivora';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BODY_BYTES = 8 * 1024 * 1024;
const RATE_LIMIT = 15;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const requestsByClient = new Map<string, number[]>();

function clientKey(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') || 'unknown';
}

function enforceRateLimit(request: NextRequest): NextResponse | null {
  const key = clientKey(request);
  const now = Date.now();
  const previous = requestsByClient.get(key) ?? [];
  const recent = previous.filter((time) => now - time < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) {
    requestsByClient.set(key, recent);
    return NextResponse.json(
      { error: 'AI request limit reached. Please wait a few minutes and try again.' },
      { status: 429, headers: { 'Retry-After': '600' } }
    );
  }
  recent.push(now);
  requestsByClient.set(key, recent);
  if (requestsByClient.size > 1000) {
    for (const [ip, times] of requestsByClient) {
      if (!times.some((time) => now - time < RATE_WINDOW_MS)) requestsByClient.delete(ip);
    }
  }
  return null;
}

async function readJson(request: NextRequest): Promise<unknown> {
  const declaredLength = Number(request.headers.get('content-length') || 0);
  if (declaredLength > MAX_BODY_BYTES) throw new Error('Request is too large. Reduce image uploads and try again.');
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
    throw new Error('Request is too large. Reduce image uploads and try again.');
  }
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error('Request body must be valid JSON.');
  }
}

function briefFrom(value: unknown) {
  const parsed = businessBriefSchema.safeParse(value);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || 'Business brief is invalid.');
  return parsed.data;
}

function asObject(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} is required.`);
  return value as Record<string, unknown>;
}

function errorResponse(error: unknown): NextResponse {
  const message = error instanceof Error ? error.message : 'The request could not be completed.';
  const statusCode = error && typeof error === 'object' && 'statusCode' in error
    ? Number((error as { statusCode?: unknown }).statusCode)
    : undefined;
  if (message.includes('GEMINI_API_KEY')) {
    return NextResponse.json({ error: 'AI generation is not configured yet. Add GEMINI_API_KEY to the server environment.' }, { status: 503 });
  }
  if (/private|internal|restricted network|credentials|only http/i.test(message)) {
    return NextResponse.json({ error: message }, { status: 400 });
  }
  if (statusCode === 429 || /quota|rate limit/i.test(message)) {
    return NextResponse.json({ error: 'The AI provider is rate limited. Please wait and try again.' }, { status: 429 });
  }
  if (statusCode === 503) return NextResponse.json({ error: 'The AI provider is temporarily unavailable. Please retry shortly.' }, { status: 503 });
  const isInputError = message.includes('is required') || message.includes('valid') || message.includes('too large') || message.includes('must be');
  return NextResponse.json({ error: message }, { status: isInputError ? 400 : 502 });
}

export async function POST(request: NextRequest, { params }: { params: { action: string } }) {
  const limited = enforceRateLimit(request);
  if (limited) return limited;
  try {
    const body = await readJson(request);
    let result: Record<string, unknown>;

    switch (params.action) {
      case 'analyze-url': {
        const parsed = analyzeUrlSchema.safeParse(body);
        if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || 'Please enter a valid website URL.');
        const analysis = await analyzeBusinessWebsite(parsed.data.url);
        result = { analysis, usage: getTokenUsageStats() };
        break;
      }
      case 'generate-strategy': {
        const brief = briefFrom(body);
        result = { strategy: await generateLandingPageStrategy(brief), usage: getTokenUsageStats() };
        break;
      }
      case 'generate-page': {
        const input = asObject(body, 'Generation input');
        const brief = briefFrom(input.brief);
        const strategy = asObject(input.strategy, 'Strategy') as unknown as LandingPageStrategy;
        const { sections, ctaSuite } = await generatePageAndCtas({ brief, strategy });
        const { seo, cro } = await generateSeoAndCroReport({ brief, strategy, sections });
        result = { sections, ctaSuite, seo, cro, usage: getTokenUsageStats() };
        break;
      }
      case 'regenerate-section': {
        const input = asObject(body, 'Regeneration input');
        const brief = briefFrom(input.brief);
        const strategy = asObject(input.strategy, 'Strategy') as unknown as LandingPageStrategy;
        const targetSection = asObject(input.targetSection, 'Target section') as unknown as PageSection;
        const otherSectionsSummary = typeof input.otherSectionsSummary === 'string' ? input.otherSectionsSummary.slice(0, 20000) : '';
        const userDirection = typeof input.userDirection === 'string' ? input.userDirection.slice(0, 1000) : undefined;
        const section = await regenerateSingleSection({ brief, strategy, targetSection, otherSectionsSummary, userDirection });
        result = { section, usage: getTokenUsageStats() };
        break;
      }
      case 'reanalyze-seo-cro': {
        const input = asObject(body, 'SEO/CRO input');
        const brief = briefFrom(input.brief);
        const strategy = asObject(input.strategy, 'Strategy') as unknown as LandingPageStrategy;
        if (!Array.isArray(input.sections) || input.sections.length > 40) throw new Error('Sections must be a list of no more than 40 items.');
        const sections = input.sections as PageSection[];
        const report = await generateSeoAndCroReport({ brief, strategy, sections, skipCache: true });
        result = { ...report, usage: getTokenUsageStats() };
        break;
      }
      default:
        return NextResponse.json({ error: 'Unknown landing page action.' }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function GET(_request: NextRequest, { params }: { params: { action: string } }) {
  if (params.action !== 'usage') return NextResponse.json({ error: 'Unknown landing page action.' }, { status: 404 });
  return NextResponse.json({ usage: getTokenUsageStats() });
}
