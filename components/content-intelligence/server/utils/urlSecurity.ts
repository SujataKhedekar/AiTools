import dns from 'node:dns/promises';
import net from 'node:net';

function isPrivateOrReservedIp(ip: string): boolean {
  const normalized = ip.replace(/^::ffff:/i, '');
  if (net.isIPv4(normalized)) {
    const parts = normalized.split('.').map(Number);
    const [a, b] = parts;
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true; // link-local / cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    if (a >= 224) return true; // multicast/reserved
    return false;
  }

  if (net.isIPv6(normalized)) {
    const lower = normalized.toLowerCase();
    if (lower === '::1' || lower === '::') return true;
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true; // ULA
    if (lower.startsWith('fe80')) return true; // link-local
    return false;
  }

  return true;
}

export function normalizeTargetDomain(rawInput: string): string {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    throw new Error('Domain or URL cannot be empty.');
  }
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const parsed = new URL(withProtocol);
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only http and https URLs are supported.');
  }
  const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');
  if (!hostname || !hostname.includes('.') || hostname.length > 253) {
    throw new Error('Please enter a valid public domain name (e.g., example.com).');
  }
  return hostname;
}

export async function validatePublicUrl(rawInput: string): Promise<URL> {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    throw new Error('Please enter a website URL or domain.');
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let parsed: URL;
  try {
    parsed = new URL(withProtocol);
  } catch {
    throw new Error('Invalid website URL format.');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only HTTP and HTTPS website URLs are supported.');
  }

  const hostname = parsed.hostname.toLowerCase();
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    !hostname.includes('.')
  ) {
    throw new Error('Local or internal hostnames cannot be crawled.');
  }

  if (net.isIP(hostname) && isPrivateOrReservedIp(hostname)) {
    throw new Error('Private or reserved IP addresses cannot be crawled.');
  }

  try {
    const records = await dns.lookup(hostname, { all: true });
    if (!records.length) {
      throw new Error(`Could not resolve DNS for ${hostname}.`);
    }
    for (const rec of records) {
      if (isPrivateOrReservedIp(rec.address)) {
        throw new Error('Target domain resolves to a restricted network address.');
      }
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes('restricted')) {
      throw err;
    }
    // Allow fallback if DNS lookup fails in isolated environments only if clearly not local IP
    if (net.isIP(hostname)) {
      throw new Error('Direct IP crawling is restricted.');
    }
  }

  return parsed;
}
