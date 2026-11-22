import crypto from 'node:crypto';
import dns from 'node:dns/promises';
import net from 'node:net';
import { z } from 'zod';

// ---- Validation Schemas ----

export const verifiedTestimonialSchema = z.object({
  id: z.string().max(80),
  quote: z.string().min(1).max(1000),
  authorName: z.string().min(1).max(120),
  authorRole: z.string().max(120).default(''),
  company: z.string().max(120).default(''),
  rating: z.number().min(1).max(5).optional(),
});

export const verifiedStatSchema = z.object({
  id: z.string().max(80),
  value: z.string().min(1).max(60),
  label: z.string().min(1).max(120),
  context: z.string().max(240).default(''),
});

export const verifiedPricingPlanSchema = z.object({
  id: z.string().max(80),
  name: z.string().min(1).max(120),
  targetAudience: z.string().max(180).default(''),
  price: z.string().min(1).max(60),
  billingCycle: z.string().max(60).default(''),
  features: z.array(z.string().max(200)).max(20),
  ctaText: z.string().max(80).default('Get Started'),
  isHighlighted: z.boolean().optional(),
});

export const businessBriefSchema = z.object({
  businessName: z.string().trim().min(1, 'Business name is required').max(160),
  websiteUrl: z.string().trim().max(300).default(''),
  category: z.string().trim().min(1, 'Business category is required').max(160),
  productName: z.string().trim().min(1, 'Product or service name is required').max(200),
  productDescription: z.string().trim().min(10, 'Product or service description is required').max(3000),
  targetAudience: z.string().trim().min(3, 'Target audience is required').max(1000),
  targetLocation: z.string().trim().max(200).default('Global'),
  objective: z.enum([
    'Generate leads',
    'Sell products',
    'Book appointments',
    'Get consultation requests',
    'Promote a service',
    'Launch a product',
    'Collect email subscribers',
    'Promote an event',
    'Download resources',
    'Generate enquiries',
  ]),
  primaryKeyword: z.string().trim().max(160).default(''),
  secondaryKeywords: z.array(z.string().trim().max(120)).max(20).default([]),
  usp: z.string().trim().max(1000).default(''),
  competitorUrls: z.array(z.string().trim().max(300)).max(10).default([]),
  brandColors: z.object({
    primary: z.string().max(30).default('#1D4ED8'),
    secondary: z.string().max(30).default('#0F172A'),
    background: z.string().max(30).default('#FFFFFF'),
  }),
  brandLogoUrl: z.string().max(500000).default(''),
  referenceImageUrls: z.array(z.string().max(500000)).max(6).default([]),
  designStyle: z.enum([
    'modern-minimal',
    'premium-luxury',
    'corporate-professional',
    'saas-technology',
    'creative-agency',
    'ecommerce',
    'healthcare',
    'finance',
    'local-business',
    'bold-editorial',
    'clean-minimalist',
  ]),
  toneOfVoice: z.string().trim().max(300).default('Clear, professional, customer-focused'),
  verifiedTestimonials: z.array(verifiedTestimonialSchema).max(20).default([]),
  verifiedStats: z.array(verifiedStatSchema).max(20).default([]),
  verifiedClientLogos: z.array(z.string().max(120)).max(20).default([]),
  verifiedPricingPlans: z.array(verifiedPricingPlanSchema).max(10).default([]),
  confirmedOffers: z.object({
    freeTrial: z.boolean().default(false),
    freeConsultation: z.boolean().default(false),
    discountText: z.string().max(160).default(''),
    guaranteeText: z.string().max(200).default(''),
  }),
  integrations: z.object({
    formKind: z.enum(['lead-generation', 'contact', 'newsletter', 'none']).default('lead-generation'),
    formEndpointUrl: z.string().max(300).default(''),
    bookingUrl: z.string().max(300).default(''),
    whatsappNumber: z.string().max(40).default(''),
    phoneNumber: z.string().max(40).default(''),
    contactEmail: z.string().max(160).default(''),
    purchaseUrl: z.string().max(300).default(''),
  }),
});

export const analyzeUrlSchema = z.object({
  url: z.string().trim().url('Please enter a valid http or https URL').max(300),
});

// ---- TTL Cache ----

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const responseCache = new Map<string, CacheEntry<unknown>>();
const MAX_CACHE_ITEMS = 100;

export function makeCacheKey(prefix: string, payload: unknown): string {
  const hash = crypto
    .createHash('sha256')
    .update(JSON.stringify(payload))
    .digest('hex')
    .slice(0, 24);
  return `${prefix}:${hash}`;
}

export function getCachedValue<T>(key: string): T | null {
  const entry = responseCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    responseCache.delete(key);
    return null;
  }
  return entry.value as T;
}

export function setCachedValue<T>(key: string, value: T, ttlMs = 30 * 60 * 1000): void {
  if (responseCache.size >= MAX_CACHE_ITEMS) {
    const oldestKey = responseCache.keys().next().value;
    if (oldestKey) responseCache.delete(oldestKey);
  }
  responseCache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

// ---- SSRF-Safe Website Fetcher ----

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const parts = ip.split('.').map(Number);
    if (parts.length !== 4 || parts.some(Number.isNaN)) return true;
    const [a, b] = parts;
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    return false;
  }
  if (net.isIPv6(ip)) {
    const normalized = ip.toLowerCase();
    if (normalized === '::1' || normalized === '::') return true;
    if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;
    if (normalized.startsWith('fe80')) return true;
    if (normalized.startsWith('::ffff:')) {
      return isPrivateIp(normalized.replace('::ffff:', ''));
    }
    return false;
  }
  return true;
}

export async function assertSafePublicHttpUrl(rawUrl: string): Promise<URL> {
  const parsed = new URL(rawUrl);
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Only http and https URLs are permitted.');
  }
  if (parsed.username || parsed.password) {
    throw new Error('URLs containing embedded credentials are not allowed.');
  }
  const hostname = parsed.hostname.toLowerCase();
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.localhost')
  ) {
    throw new Error('Local or internal hostnames cannot be analyzed.');
  }

  if (net.isIP(hostname)) {
    if (isPrivateIp(hostname)) {
      throw new Error('Private or loopback IP addresses cannot be analyzed.');
    }
    return parsed;
  }

  const records = await dns.lookup(hostname, { all: true });
  if (!records || records.length === 0) {
    throw new Error('Could not resolve target domain name.');
  }
  for (const record of records) {
    if (isPrivateIp(record.address)) {
      throw new Error('Target domain resolves to a restricted network address.');
    }
  }
  return parsed;
}

export interface FetchedPageSnapshot {
  url: string;
  title: string;
  description: string;
  headings: string[];
  bodyExcerpt: string;
  fetchWarning?: string;
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

export async function fetchPublicWebsiteSnapshot(rawUrl: string): Promise<FetchedPageSnapshot> {
  const safeUrl = await assertSafePublicHttpUrl(rawUrl);

  try {
    const response = await fetch(safeUrl.toString(), {
      method: 'GET',
      redirect: 'manual',
      signal: AbortSignal.timeout(8000),
      headers: {
        'User-Agent': 'AivoraSiteAnalyzer/1.0 (+https://aivora.app)',
        Accept: 'text/html,application/xhtml+xml',
      },
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (location) {
        const redirectTarget = new URL(location, safeUrl);
        await assertSafePublicHttpUrl(redirectTarget.toString());
        const redirected = await fetch(redirectTarget.toString(), {
          method: 'GET',
          redirect: 'manual',
          signal: AbortSignal.timeout(8000),
          headers: {
            'User-Agent': 'AivoraSiteAnalyzer/1.0 (+https://aivora.app)',
            Accept: 'text/html,application/xhtml+xml',
          },
        });
        return await extractHtmlSnapshot(redirectTarget.toString(), redirected);
      }
    }

    return await extractHtmlSnapshot(safeUrl.toString(), response);
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'Network error';
    return {
      url: safeUrl.toString(),
      title: '',
      description: '',
      headings: [],
      bodyExcerpt: '',
      fetchWarning: `Live fetch unavailable (${reason}). Analysis uses the domain and any details you provide directly.`,
    };
  }
}

async function extractHtmlSnapshot(
  finalUrl: string,
  response: globalThis.Response
): Promise<FetchedPageSnapshot> {
  if (!response.ok) {
    return {
      url: finalUrl,
      title: '',
      description: '',
      headings: [],
      bodyExcerpt: '',
      fetchWarning: `Website returned HTTP ${response.status}. Please supply missing details manually.`,
    };
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
    return {
      url: finalUrl,
      title: '',
      description: '',
      headings: [],
      bodyExcerpt: '',
      fetchWarning: 'Target URL did not return an HTML page.',
    };
  }

  const rawText = (await response.text()).slice(0, 512_000);
  const titleMatch = rawText.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? decodeHtmlEntities(titleMatch[1].replace(/\s+/g, ' ').trim()) : '';

  const descMatch =
    rawText.match(/<meta[^>]+name=["']description["'][^>]+content=["']([\s\S]*?)["'][^>]*>/i) ||
    rawText.match(/<meta[^>]+content=["']([\s\S]*?)["'][^>]+name=["']description["'][^>]*>/i);
  const description = descMatch ? decodeHtmlEntities(descMatch[1].replace(/\s+/g, ' ').trim()) : '';

  const headings: string[] = [];
  const headingRegex = /<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi;
  let match: RegExpExecArray | null;
  while ((match = headingRegex.exec(rawText)) !== null && headings.length < 15) {
    const clean = decodeHtmlEntities(match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
    if (clean) headings.push(clean);
  }

  const stripped = rawText
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const bodyExcerpt = decodeHtmlEntities(stripped).slice(0, 4500);

  return {
    url: finalUrl,
    title,
    description,
    headings,
    bodyExcerpt,
  };
}
