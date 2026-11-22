import dns from 'node:dns/promises';
import net from 'node:net';

function isPrivateOrRestrictedIPv4(ip: string): boolean {
  const parts = ip.split('.').map((n) => Number.parseInt(n, 10));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
    return true;
  }
  const [a, b] = parts;
  if (a === 0) return true; // 0.0.0.0/8
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 127) return true; // 127.0.0.0/8 loopback
  if (a === 169 && b === 254) return true; // 169.254.0.0/16 link-local & cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 CGNAT
  if (a >= 224) return true; // multicast / reserved
  return false;
}

function isPrivateOrRestrictedIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  if (normalized === '::1' || normalized === '::') return true;
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true; // ULA fc00::/7
  if (normalized.startsWith('fe8') || normalized.startsWith('fe9') || normalized.startsWith('fea') || normalized.startsWith('feb')) {
    return true; // link-local fe80::/10
  }
  if (normalized.startsWith('::ffff:')) {
    const mappedV4 = normalized.slice('::ffff:'.length);
    if (net.isIPv4(mappedV4)) {
      return isPrivateOrRestrictedIPv4(mappedV4);
    }
  }
  return false;
}

function isRestrictedIp(ip: string): boolean {
  if (net.isIPv4(ip)) return isPrivateOrRestrictedIPv4(ip);
  if (net.isIPv6(ip)) return isPrivateOrRestrictedIPv6(ip);
  return true;
}

export async function validateSafePublicUrl(rawUrl: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    throw new Error('Invalid URL format. Please enter a valid http:// or https:// product URL.');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Only http:// and https:// URLs are supported.');
  }
  if (parsed.username || parsed.password) {
    throw new Error('URLs containing embedded credentials cannot be analyzed.');
  }

  const hostname = parsed.hostname.toLowerCase();
  if (
    !hostname ||
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal')
  ) {
    throw new Error('Local or internal hostnames cannot be accessed.');
  }

  if (net.isIP(hostname) !== 0 && isRestrictedIp(hostname)) {
    throw new Error('Private, loopback, or metadata IP addresses cannot be accessed.');
  }

  try {
    const records = await dns.lookup(hostname, { all: true });
    if (!records.length) {
      throw new Error('Could not resolve target hostname.');
    }
    for (const record of records) {
      if (isRestrictedIp(record.address)) {
        throw new Error('Target URL resolves to a restricted network address.');
      }
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes('restricted')) {
      throw err;
    }
    throw new Error('Unable to verify target hostname DNS resolution.');
  }

  return parsed;
}
