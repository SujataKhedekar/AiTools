import { QRContentData, QRContentType, SocialPlatform } from '../types/qr';

export const DEFAULT_QR_CONTENT: QRContentData = {
  url: {
    value: 'https://aivora.studio',
  },
  text: {
    value: 'Welcome to Aivora Studio — Craft high-contrast, print-ready QR codes in seconds.',
  },
  email: {
    to: 'hello@aivora.studio',
    subject: 'Project Inquiry',
    body: 'Hi Aivora team, I would like to learn more about your platform.',
  },
  phone: {
    number: '+1 (415) 555-0194',
  },
  whatsapp: {
    phone: '+14155550194',
    message: 'Hi! Reaching out via your QR code.',
  },
  wifi: {
    ssid: 'Aivora_Guest_5G',
    password: 'StudioConnect2026',
    encryption: 'WPA',
    hidden: false,
  },
  vcard: {
    firstName: 'Elena',
    lastName: 'Vance',
    organization: 'Aivora Labs',
    title: 'Head of Product Design',
    phone: '+1 415 555 0194',
    email: 'elena@aivora.studio',
    website: 'https://aivora.studio',
    address: '548 Market St, San Francisco, CA',
  },
  sms: {
    phone: '+14155550194',
    message: 'JOIN AIVORA',
  },
  location: {
    mode: 'coordinates',
    latitude: '37.7897',
    longitude: '-122.4014',
    placeQuery: '548 Market St, San Francisco, CA',
  },
  social: {
    platform: 'instagram',
    handle: 'aivorastudio',
  },
};

export const EMPTY_QR_CONTENT: QRContentData = {
  url: { value: '' },
  text: { value: '' },
  email: { to: '', subject: '', body: '' },
  phone: { number: '' },
  whatsapp: { phone: '', message: '' },
  wifi: { ssid: '', password: '', encryption: 'WPA', hidden: false },
  vcard: {
    firstName: '',
    lastName: '',
    organization: '',
    title: '',
    phone: '',
    email: '',
    website: '',
    address: '',
  },
  sms: { phone: '', message: '' },
  location: { mode: 'coordinates', latitude: '', longitude: '', placeQuery: '' },
  social: { platform: 'instagram', handle: '' },
};

const SOCIAL_BASE_URLS: Record<SocialPlatform, string> = {
  instagram: 'https://instagram.com/',
  x: 'https://x.com/',
  linkedin: 'https://linkedin.com/in/',
  youtube: 'https://youtube.com/@',
  tiktok: 'https://tiktok.com/@',
  facebook: 'https://facebook.com/',
  github: 'https://github.com/',
};

function escapeWifiField(value: string): string {
  return value.replace(/([\\;,:"])/g, '\\$1');
}

function sanitizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}

function sanitizeWhatsAppPhone(phone: string): string {
  return phone.replace(/[^\d]/g, '');
}

/**
 * Generates the exact encoded payload string for a given QR type and form data.
 */
export function buildQRPayload(type: QRContentType, data: QRContentData): string {
  switch (type) {
    case 'url': {
      const raw = data.url.value.trim();
      if (!raw) return '';
      if (/^https?:\/\//i.test(raw) || /^[a-z]+:/i.test(raw)) {
        return raw;
      }
      return `https://${raw}`;
    }

    case 'text':
      return data.text.value;

    case 'email': {
      const to = data.email.to.trim();
      if (!to) return '';
      const params: string[] = [];
      if (data.email.subject.trim()) {
        params.push(`subject=${encodeURIComponent(data.email.subject.trim())}`);
      }
      if (data.email.body.trim()) {
        params.push(`body=${encodeURIComponent(data.email.body.trim())}`);
      }
      return params.length > 0 ? `mailto:${to}?${params.join('&')}` : `mailto:${to}`;
    }

    case 'phone': {
      const cleaned = sanitizePhone(data.phone.number);
      return cleaned ? `tel:${cleaned}` : '';
    }

    case 'whatsapp': {
      const digits = sanitizeWhatsAppPhone(data.whatsapp.phone);
      if (!digits) return '';
      const msg = data.whatsapp.message.trim();
      return msg
        ? `https://wa.me/${digits}?text=${encodeURIComponent(msg)}`
        : `https://wa.me/${digits}`;
    }

    case 'wifi': {
      const ssid = data.wifi.ssid.trim();
      if (!ssid) return '';
      const enc = data.wifi.encryption;
      const pass = enc === 'nopass' ? '' : escapeWifiField(data.wifi.password);
      const hidden = data.wifi.hidden ? 'true' : 'false';
      return `WIFI:T:${enc};S:${escapeWifiField(ssid)};P:${pass};H:${hidden};;`;
    }

    case 'vcard': {
      const v = data.vcard;
      const hasAny = [
        v.firstName,
        v.lastName,
        v.organization,
        v.title,
        v.phone,
        v.email,
        v.website,
        v.address,
      ].some((f) => f.trim().length > 0);
      if (!hasAny) return '';
      const fullName = [v.firstName.trim(), v.lastName.trim()].filter(Boolean).join(' ') || v.organization.trim();
      const lines = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `N:${v.lastName.trim()};${v.firstName.trim()};;;`,
        `FN:${fullName}`,
      ];
      if (v.organization.trim()) lines.push(`ORG:${v.organization.trim()}`);
      if (v.title.trim()) lines.push(`TITLE:${v.title.trim()}`);
      if (v.phone.trim()) lines.push(`TEL;TYPE=CELL:${v.phone.trim()}`);
      if (v.email.trim()) lines.push(`EMAIL:${v.email.trim()}`);
      if (v.website.trim()) {
        const url = /^https?:\/\//i.test(v.website.trim())
          ? v.website.trim()
          : `https://${v.website.trim()}`;
        lines.push(`URL:${url}`);
      }
      if (v.address.trim()) lines.push(`ADR;TYPE=WORK:;;${v.address.trim()};;;;`);
      lines.push('END:VCARD');
      return lines.join('\n');
    }

    case 'sms': {
      const num = sanitizePhone(data.sms.phone);
      if (!num) return '';
      const msg = data.sms.message.trim();
      return msg ? `SMSTO:${num}:${msg}` : `SMSTO:${num}`;
    }

    case 'location': {
      if (data.location.mode === 'place') {
        const q = data.location.placeQuery.trim();
        return q ? `https://maps.google.com/?q=${encodeURIComponent(q)}` : '';
      }
      const lat = data.location.latitude.trim();
      const lng = data.location.longitude.trim();
      if (!lat || !lng) return '';
      return `https://maps.google.com/?q=${encodeURIComponent(`${lat},${lng}`)}`;
    }

    case 'social': {
      const raw = data.social.handle.trim();
      if (!raw) return '';
      if (/^https?:\/\//i.test(raw)) return raw;
      const cleanHandle = raw.replace(/^@+/, '');
      return `${SOCIAL_BASE_URLS[data.social.platform]}${cleanHandle}`;
    }

    default:
      return '';
  }
}

export function getQRTypeLabel(type: QRContentType): string {
  const labels: Record<QRContentType, string> = {
    url: 'Website URL',
    text: 'Text',
    email: 'Email',
    phone: 'Phone',
    whatsapp: 'WhatsApp',
    wifi: 'Wi-Fi',
    vcard: 'vCard',
    sms: 'SMS',
    location: 'Location',
    social: 'Social',
  };
  return labels[type];
}
