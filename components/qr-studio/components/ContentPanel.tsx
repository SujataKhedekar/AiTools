import React, { useRef } from 'react';
import {
  Contact,
  Copy,
  FileText,
  Globe,
  ImagePlus,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquare,
  Phone,
  Save,
  Share2,
  Trash2,
  Wifi,
  X,
} from 'lucide-react';
import {
  QRContentData,
  QRContentType,
  QRStyleConfig,
  SocialPlatform,
  WifiEncryption,
} from '../types/qr';
import { SAMPLE_LOGO_MARKS } from '../data/templates';

interface ContentPanelProps {
  title: string;
  onTitleChange: (title: string) => void;
  contentType: QRContentType;
  onContentTypeChange: (type: QRContentType) => void;
  content: QRContentData;
  onContentChange: <K extends QRContentType>(key: K, patch: Partial<QRContentData[K]>) => void;
  style: QRStyleConfig;
  onLogoUpload: (dataUrl: string, fileName: string) => void;
  onLogoRemove: () => void;
  onClearInputs: () => void;
  onSaveDesign: () => void;
  onDuplicateDesign: () => void;
}

const QR_TYPE_ITEMS: Array<{
  id: QRContentType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'url', label: 'Website', icon: Globe },
  { id: 'text', label: 'Text', icon: FileText },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'phone', label: 'Phone', icon: Phone },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { id: 'wifi', label: 'Wi-Fi', icon: Wifi },
  { id: 'vcard', label: 'vCard', icon: Contact },
  { id: 'sms', label: 'SMS', icon: MessageSquare },
  { id: 'location', label: 'Location', icon: MapPin },
  { id: 'social', label: 'Social', icon: Share2 },
];

const SOCIAL_PLATFORMS: Array<{ id: SocialPlatform; label: string; prefix: string }> = [
  { id: 'instagram', label: 'Instagram', prefix: 'instagram.com/' },
  { id: 'x', label: 'X / Twitter', prefix: 'x.com/' },
  { id: 'linkedin', label: 'LinkedIn', prefix: 'linkedin.com/in/' },
  { id: 'youtube', label: 'YouTube', prefix: 'youtube.com/@' },
  { id: 'tiktok', label: 'TikTok', prefix: 'tiktok.com/@' },
  { id: 'facebook', label: 'Facebook', prefix: 'facebook.com/' },
  { id: 'github', label: 'GitHub', prefix: 'github.com/' },
];

const inputCls =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15 transition-colors';

const labelCls = 'block text-xs font-medium text-slate-700 mb-1.5';

export const ContentPanel: React.FC<ContentPanelProps> = ({
  title,
  onTitleChange,
  contentType,
  onContentTypeChange,
  content,
  onContentChange,
  style,
  onLogoUpload,
  onLogoRemove,
  onClearInputs,
  onSaveDesign,
  onDuplicateDesign,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/image\/(png|jpeg|jpg|svg\+xml|webp)/i.test(file.type)) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onLogoUpload(reader.result, file.name);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <aside className="flex h-full flex-col border-r border-slate-200 bg-white">
      {/* Panel Header with Editable Custom Title */}
      <div className="border-b border-slate-200 p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-sm font-semibold text-slate-900">Content</h2>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onSaveDesign}
              title="Save to Recent Designs"
              className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md px-2 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Save</span>
            </button>
            <button
              type="button"
              onClick={onDuplicateDesign}
              title="Duplicate current QR design"
              className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-md px-2 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="qr-design-title" className="sr-only">
            Design Title
          </label>
          <input
            id="qr-design-title"
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Untitled QR Design"
            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/70 px-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/15 transition-colors"
          />
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="studio-scroll flex-1 overflow-y-auto p-4 space-y-6">
        {/* QR Type Grid */}
        <section>
          <div className="mb-2.5 flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-800">QR Code Type</h3>
            <span className="text-xs text-slate-400">10 formats</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {QR_TYPE_ITEMS.map(({ id, label, icon: Icon }) => {
              const active = contentType === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onContentTypeChange(id)}
                  className={`flex h-9 cursor-pointer items-center gap-2 rounded-lg border px-2.5 text-left text-xs font-medium transition-colors whitespace-nowrap ${
                    active
                      ? 'border-blue-600 bg-blue-50/70 text-blue-700'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Icon
                    className={`h-3.5 w-3.5 shrink-0 ${active ? 'text-blue-600' : 'text-slate-400'}`}
                  />
                  <span className="truncate">{label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Divider */}
        <hr className="border-slate-100" />

        {/* Dynamic Content Form Fields */}
        <section className="space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-800">Payload Details</h3>
            <button
              type="button"
              onClick={onClearInputs}
              className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-slate-500 hover:text-rose-600 transition-colors"
            >
              <Trash2 className="h-3 w-3" />
              <span>Clear</span>
            </button>
          </div>

          {contentType === 'url' && (
            <div>
              <label htmlFor="field-url" className={labelCls}>
                Website URL
              </label>
              <input
                id="field-url"
                type="url"
                value={content.url.value}
                onChange={(e) => onContentChange('url', { value: e.target.value })}
                placeholder="https://example.com"
                className={inputCls}
              />
              <p className="mt-1.5 text-xs text-slate-500">
                Includes automatic https:// protocol normalization when omitted.
              </p>
            </div>
          )}

          {contentType === 'text' && (
            <div>
              <label htmlFor="field-text" className={labelCls}>
                Text or Message
              </label>
              <textarea
                id="field-text"
                rows={4}
                value={content.text.value}
                onChange={(e) => onContentChange('text', { value: e.target.value })}
                placeholder="Enter any plain text, note, or instructions..."
                className={`${inputCls} resize-y`}
              />
              <div className="mt-1 flex justify-end font-mono text-[11px] text-slate-400 tabular-nums">
                {content.text.value.length} chars
              </div>
            </div>
          )}

          {contentType === 'email' && (
            <div className="space-y-3">
              <div>
                <label htmlFor="field-email-to" className={labelCls}>
                  Recipient Email
                </label>
                <input
                  id="field-email-to"
                  type="email"
                  value={content.email.to}
                  onChange={(e) => onContentChange('email', { to: e.target.value })}
                  placeholder="hello@company.com"
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="field-email-subject" className={labelCls}>
                  Subject
                </label>
                <input
                  id="field-email-subject"
                  type="text"
                  value={content.email.subject}
                  onChange={(e) => onContentChange('email', { subject: e.target.value })}
                  placeholder="Inquiry subject"
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="field-email-body" className={labelCls}>
                  Message Body
                </label>
                <textarea
                  id="field-email-body"
                  rows={3}
                  value={content.email.body}
                  onChange={(e) => onContentChange('email', { body: e.target.value })}
                  placeholder="Prefilled email message..."
                  className={inputCls}
                />
              </div>
            </div>
          )}

          {contentType === 'phone' && (
            <div>
              <label htmlFor="field-phone" className={labelCls}>
                Phone Number
              </label>
              <input
                id="field-phone"
                type="tel"
                value={content.phone.number}
                onChange={(e) => onContentChange('phone', { number: e.target.value })}
                placeholder="+1 (415) 555-0194"
                className={inputCls}
              />
              <p className="mt-1.5 text-xs text-slate-500">
                Include international country code for reliable dialing.
              </p>
            </div>
          )}

          {contentType === 'whatsapp' && (
            <div className="space-y-3">
              <div>
                <label htmlFor="field-wa-phone" className={labelCls}>
                  WhatsApp Number (with country code)
                </label>
                <input
                  id="field-wa-phone"
                  type="tel"
                  value={content.whatsapp.phone}
                  onChange={(e) => onContentChange('whatsapp', { phone: e.target.value })}
                  placeholder="+14155550194"
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="field-wa-msg" className={labelCls}>
                  Prefilled Message
                </label>
                <textarea
                  id="field-wa-msg"
                  rows={3}
                  value={content.whatsapp.message}
                  onChange={(e) => onContentChange('whatsapp', { message: e.target.value })}
                  placeholder="Hello! I scanned your QR code..."
                  className={inputCls}
                />
              </div>
            </div>
          )}

          {contentType === 'wifi' && (
            <div className="space-y-3">
              <div>
                <label htmlFor="field-wifi-ssid" className={labelCls}>
                  Network Name (SSID)
                </label>
                <input
                  id="field-wifi-ssid"
                  type="text"
                  value={content.wifi.ssid}
                  onChange={(e) => onContentChange('wifi', { ssid: e.target.value })}
                  placeholder="Office_Guest_5G"
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="field-wifi-enc" className={labelCls}>
                  Security Type
                </label>
                <select
                  id="field-wifi-enc"
                  value={content.wifi.encryption}
                  onChange={(e) =>
                    onContentChange('wifi', { encryption: e.target.value as WifiEncryption })
                  }
                  className={inputCls}
                >
                  <option value="WPA">WPA / WPA2 / WPA3</option>
                  <option value="WEP">WEP</option>
                  <option value="nopass">Open Network (No Password)</option>
                </select>
              </div>
              {content.wifi.encryption !== 'nopass' && (
                <div>
                  <label htmlFor="field-wifi-pass" className={labelCls}>
                    Password
                  </label>
                  <input
                    id="field-wifi-pass"
                    type="text"
                    value={content.wifi.password}
                    onChange={(e) => onContentChange('wifi', { password: e.target.value })}
                    placeholder="Network password"
                    className={inputCls}
                  />
                </div>
              )}
              <label className="flex cursor-pointer items-center gap-2.5 pt-1">
                <input
                  type="checkbox"
                  checked={content.wifi.hidden}
                  onChange={(e) => onContentChange('wifi', { hidden: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                />
                <span className="text-xs font-medium text-slate-700">Hidden SSID network</span>
              </label>
            </div>
          )}

          {contentType === 'vcard' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label htmlFor="vc-first" className={labelCls}>
                    First Name
                  </label>
                  <input
                    id="vc-first"
                    type="text"
                    value={content.vcard.firstName}
                    onChange={(e) => onContentChange('vcard', { firstName: e.target.value })}
                    placeholder="Elena"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label htmlFor="vc-last" className={labelCls}>
                    Last Name
                  </label>
                  <input
                    id="vc-last"
                    type="text"
                    value={content.vcard.lastName}
                    onChange={(e) => onContentChange('vcard', { lastName: e.target.value })}
                    placeholder="Vance"
                    className={inputCls}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label htmlFor="vc-org" className={labelCls}>
                    Organization
                  </label>
                  <input
                    id="vc-org"
                    type="text"
                    value={content.vcard.organization}
                    onChange={(e) => onContentChange('vcard', { organization: e.target.value })}
                    placeholder="Aivora Labs"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label htmlFor="vc-title" className={labelCls}>
                    Job Title
                  </label>
                  <input
                    id="vc-title"
                    type="text"
                    value={content.vcard.title}
                    onChange={(e) => onContentChange('vcard', { title: e.target.value })}
                    placeholder="Design Lead"
                    className={inputCls}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="vc-phone" className={labelCls}>
                  Mobile Phone
                </label>
                <input
                  id="vc-phone"
                  type="tel"
                  value={content.vcard.phone}
                  onChange={(e) => onContentChange('vcard', { phone: e.target.value })}
                  placeholder="+1 415 555 0194"
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="vc-email" className={labelCls}>
                  Email
                </label>
                <input
                  id="vc-email"
                  type="email"
                  value={content.vcard.email}
                  onChange={(e) => onContentChange('vcard', { email: e.target.value })}
                  placeholder="elena@aivora.studio"
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="vc-web" className={labelCls}>
                  Website
                </label>
                <input
                  id="vc-web"
                  type="url"
                  value={content.vcard.website}
                  onChange={(e) => onContentChange('vcard', { website: e.target.value })}
                  placeholder="https://aivora.studio"
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="vc-addr" className={labelCls}>
                  Address
                </label>
                <input
                  id="vc-addr"
                  type="text"
                  value={content.vcard.address}
                  onChange={(e) => onContentChange('vcard', { address: e.target.value })}
                  placeholder="548 Market St, San Francisco, CA"
                  className={inputCls}
                />
              </div>
            </div>
          )}

          {contentType === 'sms' && (
            <div className="space-y-3">
              <div>
                <label htmlFor="field-sms-phone" className={labelCls}>
                  Recipient Phone
                </label>
                <input
                  id="field-sms-phone"
                  type="tel"
                  value={content.sms.phone}
                  onChange={(e) => onContentChange('sms', { phone: e.target.value })}
                  placeholder="+14155550194"
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="field-sms-msg" className={labelCls}>
                  SMS Message
                </label>
                <textarea
                  id="field-sms-msg"
                  rows={3}
                  value={content.sms.message}
                  onChange={(e) => onContentChange('sms', { message: e.target.value })}
                  placeholder="Enter SMS body..."
                  className={inputCls}
                />
              </div>
            </div>
          )}

          {contentType === 'location' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => onContentChange('location', { mode: 'coordinates' })}
                  className={`h-7 cursor-pointer rounded-md text-xs font-medium transition-colors ${
                    content.location.mode === 'coordinates'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Coordinates
                </button>
                <button
                  type="button"
                  onClick={() => onContentChange('location', { mode: 'place' })}
                  className={`h-7 cursor-pointer rounded-md text-xs font-medium transition-colors ${
                    content.location.mode === 'place'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Address / Place
                </button>
              </div>

              {content.location.mode === 'coordinates' ? (
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label htmlFor="loc-lat" className={labelCls}>
                      Latitude
                    </label>
                    <input
                      id="loc-lat"
                      type="text"
                      value={content.location.latitude}
                      onChange={(e) => onContentChange('location', { latitude: e.target.value })}
                      placeholder="37.7897"
                      className={`${inputCls} font-mono tabular-nums`}
                    />
                  </div>
                  <div>
                    <label htmlFor="loc-lng" className={labelCls}>
                      Longitude
                    </label>
                    <input
                      id="loc-lng"
                      type="text"
                      value={content.location.longitude}
                      onChange={(e) => onContentChange('location', { longitude: e.target.value })}
                      placeholder="-122.4014"
                      className={`${inputCls} font-mono tabular-nums`}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label htmlFor="loc-place" className={labelCls}>
                    Google Maps Search Query
                  </label>
                  <input
                    id="loc-place"
                    type="text"
                    value={content.location.placeQuery}
                    onChange={(e) => onContentChange('location', { placeQuery: e.target.value })}
                    placeholder="548 Market St, San Francisco, CA"
                    className={inputCls}
                  />
                </div>
              )}
            </div>
          )}

          {contentType === 'social' && (
            <div className="space-y-3">
              <div>
                <label htmlFor="soc-platform" className={labelCls}>
                  Platform
                </label>
                <select
                  id="soc-platform"
                  value={content.social.platform}
                  onChange={(e) =>
                    onContentChange('social', { platform: e.target.value as SocialPlatform })
                  }
                  className={inputCls}
                >
                  {SOCIAL_PLATFORMS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="soc-handle" className={labelCls}>
                  Username or Full Profile URL
                </label>
                <input
                  id="soc-handle"
                  type="text"
                  value={content.social.handle}
                  onChange={(e) => onContentChange('social', { handle: e.target.value })}
                  placeholder="aivorastudio"
                  className={inputCls}
                />
                <p className="mt-1.5 font-mono text-[11px] text-slate-400 truncate">
                  {SOCIAL_PLATFORMS.find((p) => p.id === content.social.platform)?.prefix}
                  {content.social.handle.replace(/^@+/, '') || 'username'}
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Divider */}
        <hr className="border-slate-100" />

        {/* Logo Upload directly in Left Panel */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-800">Center Logo</h3>
            {style.logoDataUrl && (
              <button
                type="button"
                onClick={onLogoRemove}
                className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-rose-600 hover:text-rose-700"
              >
                <X className="h-3 w-3" />
                <span>Remove</span>
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            onChange={handleFileSelected}
            className="hidden"
          />

          {style.logoDataUrl ? (
            <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-2.5">
              <img
                src={style.logoDataUrl}
                alt="Uploaded QR center logo"
                className="h-10 w-10 rounded-md border border-slate-200 bg-white object-contain p-1"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-slate-800">
                  {style.logoFileName || 'Brand Logo'}
                </p>
                <p className="text-[11px] text-slate-500">
                  Adjust size, shape & padding on the right
                </p>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="h-8 cursor-pointer rounded-md border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
              >
                Replace
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 bg-slate-50/50 px-4 py-4 text-center hover:border-blue-500 hover:bg-blue-50/30 transition-colors"
            >
              <ImagePlus className="h-5 w-5 text-slate-400" />
              <span className="text-xs font-medium text-slate-700">
                Upload PNG, JPG, or SVG logo
              </span>
              <span className="text-[11px] text-slate-400">
                Auto-switches to Level H error correction
              </span>
            </button>
          )}

          {/* Built-in quick sample marks */}
          <div className="space-y-1.5">
            <span className="block text-[11px] font-medium text-slate-500">Quick sample marks</span>
            <div className="grid grid-cols-4 gap-1.5">
              {SAMPLE_LOGO_MARKS.map((mark) => {
                const isSelected = style.logoDataUrl === mark.dataUrl;
                return (
                  <button
                    key={mark.id}
                    type="button"
                    onClick={() => onLogoUpload(mark.dataUrl, `${mark.name}.svg`)}
                    className={`flex h-11 cursor-pointer flex-col items-center justify-center rounded-lg border p-1 transition-colors ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/60'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                    title={`Use ${mark.name} logo`}
                  >
                    <img
                      src={mark.dataUrl}
                      alt={mark.name}
                      className="h-6 w-6 object-contain"
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </aside>
  );
};
