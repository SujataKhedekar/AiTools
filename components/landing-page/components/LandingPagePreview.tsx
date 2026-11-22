import React, { useState } from 'react';
import {
  Check,
  ChevronDown,
  Mail,
  Menu,
  MessageSquare,
  Phone,
  X,
} from 'lucide-react';
import type {
  BusinessBrief,
  DesignConfig,
  PageSection,
} from '../types/aivora';

interface LandingPagePreviewProps {
  brief: BusinessBrief;
  sections: PageSection[];
  design: DesignConfig;
  viewport: 'desktop' | 'tablet' | 'mobile';
  selectedSectionId?: string | null;
  sectionOnlyMode?: boolean;
  onSelectSection?: (id: string) => void;
}

function getButtonRadiusClass(style: DesignConfig['buttonStyle']): string {
  switch (style) {
    case 'sharp':
      return 'rounded-none';
    case 'rounded':
      return 'rounded-lg';
    case 'pill':
      return 'rounded-full';
  }
}

function getCardRadiusClass(radius: DesignConfig['borderRadius']): string {
  switch (radius) {
    case 'none':
      return 'rounded-none';
    case 'sm':
      return 'rounded';
    case 'md':
      return 'rounded-xl';
    case 'lg':
      return 'rounded-2xl';
  }
}

function isDarkHex(hex: string): boolean {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return false;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.45;
}

function PreviewImage({
  src,
  alt,
  radiusClass,
  primaryColor,
}: {
  src?: string;
  alt: string;
  radiusClass: string;
  primaryColor: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex aspect-video w-full flex-col items-center justify-center border border-slate-300/40 bg-slate-200/40 p-6 text-center ${radiusClass}`}
      >
        <div
          className="mb-2 h-8 w-8 rounded-full opacity-25"
          style={{ backgroundColor: primaryColor }}
        />
        <p className="text-xs font-medium opacity-70">{alt}</p>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`aspect-video w-full object-cover ${radiusClass}`}
    />
  );
}

export function LandingPagePreview({
  brief,
  sections,
  design,
  viewport,
  selectedSectionId,
  sectionOnlyMode,
  onSelectSection,
}: LandingPagePreviewProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);
  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadNotes, setLeadNotes] = useState('');
  const [formFeedback, setFormFeedback] = useState<{
    type: 'error' | 'info' | 'success';
    message: string;
  } | null>(null);

  const enabledSections = sections.filter((s) => s.enabled);
  const visibleSections =
    sectionOnlyMode && selectedSectionId
      ? enabledSections.filter((s) => s.id === selectedSectionId)
      : enabledSections;

  const hero = enabledSections.find((s) => s.type === 'hero');
  const navItems = enabledSections
    .filter((s) => s.type !== 'hero' && s.type !== 'footer')
    .slice(0, 5);

  const isDarkBg = isDarkHex(design.backgroundColor);
  const borderColor = isDarkBg ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.1)';
  const mutedText = isDarkBg ? 'rgba(248,250,252,0.72)' : 'rgba(15,23,42,0.68)';
  const cardSurface = isDarkBg ? design.surfaceColor : '#FFFFFF';
  const btnRadius = getButtonRadiusClass(design.buttonStyle);
  const cardRadius = getCardRadiusClass(design.borderRadius);
  const isCompactViewport = viewport === 'mobile' || viewport === 'tablet';
  const paddingY =
    design.spacingScale === 'compact'
      ? 'py-10'
      : design.spacingScale === 'airy'
        ? 'py-16 md:py-20'
        : 'py-14';

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (brief.integrations.formKind !== 'newsletter' && leadName.trim().length < 2) {
      setFormFeedback({ type: 'error', message: 'Please enter your full name.' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(leadEmail.trim())) {
      setFormFeedback({ type: 'error', message: 'Please enter a valid email address.' });
      return;
    }
    if (!brief.integrations.formEndpointUrl.trim()) {
      setFormFeedback({
        type: 'info',
        message:
          'Field validation passed. External form endpoint URL is not configured yet—add a webhook URL in Brief > Section 07 to transmit live submissions.',
      });
      return;
    }

    try {
      const res = await fetch(brief.integrations.formEndpointUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: leadName.trim(),
          email: leadEmail.trim(),
          notes: leadNotes.trim(),
        }),
      });
      if (res.ok) {
        setFormFeedback({
          type: 'success',
          message: 'Submitted successfully to your configured endpoint.',
        });
        setLeadName('');
        setLeadEmail('');
        setLeadNotes('');
      } else {
        setFormFeedback({
          type: 'error',
          message: `Configured endpoint responded with status ${res.status}.`,
        });
      }
    } catch {
      setFormFeedback({
        type: 'error',
        message: 'Could not reach the configured external form endpoint.',
      });
    }
  }

  return (
    <div
      style={{
        backgroundColor: design.backgroundColor,
        color: design.textColor,
        fontFamily: `'${design.bodyFont}', system-ui, sans-serif`,
      }}
      className="relative min-h-full w-full overflow-x-hidden"
    >
      {/* Top Bar (3-zone contract) */}
      <header
        style={{
          backgroundColor: design.backgroundColor,
          borderBottom: `1px solid ${borderColor}`,
        }}
        className="sticky top-0 z-20"
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-5">
          <a
            href="#preview-hero"
            style={{ fontFamily: `'${design.headingFont}', system-ui, sans-serif` }}
            className="flex items-center gap-2.5 text-base font-bold tracking-tight whitespace-nowrap shrink-0"
          >
            {brief.brandLogoUrl ? (
              <img
                src={brief.brandLogoUrl}
                alt={brief.businessName}
                referrerPolicy="no-referrer"
                className="h-7 w-auto max-w-[120px] object-contain"
              />
            ) : (
              <span>{brief.businessName}</span>
            )}
          </a>

          {!isCompactViewport && (
            <nav className="flex items-center gap-6 text-sm" style={{ color: mutedText }}>
              {navItems.map((sec) => (
                <a
                  key={sec.id}
                  href={`#preview-${sec.id}`}
                  className="hover:underline whitespace-nowrap shrink-0"
                >
                  {sec.navLabel}
                </a>
              ))}
            </nav>
          )}

          <div className="flex items-center gap-2.5 shrink-0">
            <a
              href={hero?.primaryCtaDestination || '#preview-final'}
              style={{ backgroundColor: design.primaryColor }}
              className={`inline-flex min-h-[38px] items-center px-4 py-1.5 text-xs font-semibold text-white whitespace-nowrap shrink-0 ${btnRadius}`}
            >
              {hero?.primaryCtaText || 'Get Started'}
            </a>
            {isCompactViewport && (
              <button
                type="button"
                aria-label="Toggle mobile menu"
                onClick={() => setMobileMenuOpen((v) => !v)}
                style={{ borderColor }}
                className={`inline-flex h-9 w-9 items-center justify-center border ${btnRadius}`}
              >
                {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            )}
          </div>
        </div>

        {isCompactViewport && mobileMenuOpen && (
          <div
            style={{
              backgroundColor: design.backgroundColor,
              borderTop: `1px solid ${borderColor}`,
            }}
            className="px-5 py-3 flex flex-col gap-1"
          >
            {navItems.map((sec) => (
              <a
                key={sec.id}
                href={`#preview-${sec.id}`}
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 text-sm font-medium"
              >
                {sec.navLabel}
              </a>
            ))}
          </div>
        )}
      </header>

      <main>
        {visibleSections.map((sec) => {
          const isSelected = selectedSectionId === sec.id;
          const wrapperRing = isSelected
            ? 'outline outline-2 outline-blue-600 outline-offset-[-2px]'
            : '';

          if (sec.type === 'hero') {
            return (
              <section
                key={sec.id}
                id={`preview-${sec.id}`}
                onClick={() => onSelectSection?.(sec.id)}
                className={`${paddingY} ${wrapperRing} cursor-pointer`}
              >
                <div
                  className={`mx-auto max-w-6xl px-5 grid gap-10 items-center ${
                    viewport === 'mobile' ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-12'
                  }`}
                >
                  <div className={viewport === 'mobile' ? '' : 'lg:col-span-6'}>
                    {sec.eyebrow && (
                      <p
                        className="mb-3 text-xs font-semibold tracking-wide"
                        style={{ color: design.primaryColor }}
                      >
                        {sec.eyebrow}
                      </p>
                    )}
                    <h1
                      style={{ fontFamily: `'${design.headingFont}', system-ui, sans-serif` }}
                      className={`font-bold tracking-tight text-balance ${
                        viewport === 'mobile'
                          ? 'text-3xl leading-tight'
                          : 'text-4xl lg:text-5xl leading-[1.1]'
                      }`}
                    >
                      {sec.headline}
                    </h1>
                    {sec.subheadline && (
                      <p className="mt-4 text-lg font-medium" style={{ color: mutedText }}>
                        {sec.subheadline}
                      </p>
                    )}
                    <p className="mt-3 text-base leading-relaxed" style={{ color: mutedText }}>
                      {sec.description}
                    </p>
                    <div className="mt-7 flex flex-wrap gap-3">
                      {sec.primaryCtaText && (
                        <a
                          href={sec.primaryCtaDestination || '#preview-final'}
                          style={{ backgroundColor: design.primaryColor }}
                          className={`inline-flex min-h-[44px] items-center justify-center px-6 py-2.5 text-sm font-semibold text-white whitespace-nowrap ${btnRadius}`}
                        >
                          {sec.primaryCtaText}
                        </a>
                      )}
                      {sec.secondaryCtaText && (
                        <a
                          href={sec.secondaryCtaDestination || '#'}
                          style={{ borderColor }}
                          className={`inline-flex min-h-[44px] items-center justify-center border px-6 py-2.5 text-sm font-semibold whitespace-nowrap ${btnRadius}`}
                        >
                          {sec.secondaryCtaText}
                        </a>
                      )}
                    </div>
                    {sec.trustIndicators && sec.trustIndicators.length > 0 && (
                      <p className="mt-6 text-xs" style={{ color: mutedText }}>
                        {sec.trustIndicators.join(' · ')}
                      </p>
                    )}
                  </div>
                  <div className={viewport === 'mobile' ? '' : 'lg:col-span-6'}>
                    <PreviewImage
                      src={sec.imageUrl}
                      alt={sec.imageAlt || sec.headline}
                      radiusClass={cardRadius}
                      primaryColor={design.primaryColor}
                    />
                  </div>
                </div>
              </section>
            );
          }

          if (sec.type === 'social_proof') {
            return (
              <section
                key={sec.id}
                id={`preview-${sec.id}`}
                onClick={() => onSelectSection?.(sec.id)}
                style={{
                  backgroundColor: design.surfaceColor,
                  borderTop: `1px solid ${borderColor}`,
                }}
                className={`${paddingY} ${wrapperRing} cursor-pointer`}
              >
                <div className="mx-auto max-w-6xl px-5">
                  <div className="max-w-2xl">
                    <h2
                      style={{ fontFamily: `'${design.headingFont}', system-ui, sans-serif` }}
                      className="text-2xl md:text-3xl font-bold tracking-tight"
                    >
                      {sec.headline}
                    </h2>
                    <p className="mt-2 text-sm md:text-base" style={{ color: mutedText }}>
                      {sec.description}
                    </p>
                  </div>

                  {sec.clientLogos && sec.clientLogos.length > 0 && (
                    <div
                      className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3 border-y py-4 text-sm font-semibold"
                      style={{ borderColor, color: mutedText }}
                    >
                      {sec.clientLogos.map((logo, idx) => (
                        <span key={idx}>{logo}</span>
                      ))}
                    </div>
                  )}

                  {sec.stats && sec.stats.length > 0 && (
                    <div
                      className={`mt-8 grid gap-5 ${
                        viewport === 'mobile' ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-3'
                      }`}
                    >
                      {sec.stats.map((st) => (
                        <div
                          key={st.id}
                          style={{ backgroundColor: cardSurface, borderColor }}
                          className={`border p-6 ${cardRadius}`}
                        >
                          <p
                            className="text-3xl font-bold tabular-nums"
                            style={{ color: design.primaryColor }}
                          >
                            {st.value}
                          </p>
                          <p className="mt-1 text-sm font-semibold">{st.label}</p>
                          <p className="mt-1 text-xs" style={{ color: mutedText }}>
                            {st.context}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {sec.testimonials && sec.testimonials.length > 0 && (
                    <div
                      className={`mt-8 grid gap-5 ${
                        viewport === 'mobile' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'
                      }`}
                    >
                      {sec.testimonials.map((t) => (
                        <blockquote
                          key={t.id}
                          style={{ backgroundColor: cardSurface, borderColor }}
                          className={`border p-6 ${cardRadius}`}
                        >
                          <p className="text-sm md:text-base leading-relaxed">"{t.quote}"</p>
                          <footer className="mt-4 text-xs" style={{ color: mutedText }}>
                            <strong style={{ color: design.textColor }}>{t.authorName}</strong> ·{' '}
                            {t.authorRole}
                            {t.company ? `, ${t.company}` : ''}
                          </footer>
                        </blockquote>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            );
          }

          if (sec.type === 'pricing') {
            return (
              <section
                key={sec.id}
                id={`preview-${sec.id}`}
                onClick={() => onSelectSection?.(sec.id)}
                style={{ borderTop: `1px solid ${borderColor}` }}
                className={`${paddingY} ${wrapperRing} cursor-pointer`}
              >
                <div className="mx-auto max-w-6xl px-5">
                  <div className="max-w-2xl">
                    <h2
                      style={{ fontFamily: `'${design.headingFont}', system-ui, sans-serif` }}
                      className="text-2xl md:text-3xl font-bold tracking-tight"
                    >
                      {sec.headline}
                    </h2>
                    <p className="mt-2 text-sm md:text-base" style={{ color: mutedText }}>
                      {sec.description}
                    </p>
                  </div>
                  <div
                    className={`mt-8 grid gap-6 ${
                      viewport === 'mobile'
                        ? 'grid-cols-1'
                        : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                    }`}
                  >
                    {(sec.pricingPlans || []).map((plan) => (
                      <div
                        key={plan.id}
                        style={{
                          backgroundColor: cardSurface,
                          borderColor: plan.isHighlighted ? design.primaryColor : borderColor,
                        }}
                        className={`flex flex-col justify-between border p-6 ${
                          plan.isHighlighted ? 'border-2' : ''
                        } ${cardRadius}`}
                      >
                        <div>
                          <h3 className="text-lg font-bold">{plan.name}</h3>
                          <p className="mt-1 text-xs" style={{ color: mutedText }}>
                            {plan.targetAudience}
                          </p>
                          <div className="mt-4 flex items-baseline gap-1.5">
                            <span className="text-3xl font-bold tabular-nums">{plan.price}</span>
                            <span className="text-xs" style={{ color: mutedText }}>
                              {plan.billingCycle}
                            </span>
                          </div>
                          <ul className="mt-5 space-y-2 text-sm">
                            {plan.features.map((f, fIdx) => (
                              <li key={fIdx} className="flex items-start gap-2">
                                <Check
                                  className="mt-0.5 h-4 w-4 shrink-0"
                                  style={{ color: design.primaryColor }}
                                />
                                <span>{f}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <a
                          href={sec.primaryCtaDestination || '#preview-final'}
                          style={{ backgroundColor: design.primaryColor }}
                          className={`mt-6 inline-flex min-h-[44px] w-full items-center justify-center px-4 py-2 text-sm font-semibold text-white ${btnRadius}`}
                        >
                          {plan.ctaText}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );
          }

          if (sec.type === 'faq') {
            return (
              <section
                key={sec.id}
                id={`preview-${sec.id}`}
                onClick={() => onSelectSection?.(sec.id)}
                style={{
                  backgroundColor: design.surfaceColor,
                  borderTop: `1px solid ${borderColor}`,
                }}
                className={`${paddingY} ${wrapperRing} cursor-pointer`}
              >
                <div className="mx-auto max-w-3xl px-5">
                  <h2
                    style={{ fontFamily: `'${design.headingFont}', system-ui, sans-serif` }}
                    className="text-2xl md:text-3xl font-bold tracking-tight"
                  >
                    {sec.headline}
                  </h2>
                  <p className="mt-2 text-sm md:text-base" style={{ color: mutedText }}>
                    {sec.description}
                  </p>
                  <div className="mt-8 space-y-3">
                    {(sec.faqs || []).map((faq) => {
                      const isOpen = openFaqId === faq.id;
                      return (
                        <div
                          key={faq.id}
                          style={{ backgroundColor: cardSurface, borderColor }}
                          className={`border ${cardRadius}`}
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenFaqId(isOpen ? null : faq.id);
                            }}
                            className="flex w-full items-center justify-between gap-4 p-4 text-left text-sm font-semibold cursor-pointer"
                          >
                            <span>{faq.question}</span>
                            <ChevronDown
                              className={`h-4 w-4 shrink-0 transition-transform ${
                                isOpen ? 'rotate-180' : ''
                              }`}
                            />
                          </button>
                          {isOpen && (
                            <p
                              className="border-t px-4 pb-4 pt-3 text-sm leading-relaxed"
                              style={{ borderColor, color: mutedText }}
                            >
                              {faq.answer}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            );
          }

          if (sec.type === 'final_cta') {
            return (
              <section
                key={sec.id}
                id={`preview-final`}
                onClick={() => onSelectSection?.(sec.id)}
                style={{ borderTop: `1px solid ${borderColor}` }}
                className={`${paddingY} ${wrapperRing} cursor-pointer`}
              >
                <div
                  style={{ backgroundColor: design.surfaceColor, borderColor }}
                  className={`mx-auto max-w-4xl border p-8 md:p-10 ${cardRadius}`}
                >
                  <h2
                    style={{ fontFamily: `'${design.headingFont}', system-ui, sans-serif` }}
                    className="text-2xl md:text-3xl font-bold tracking-tight text-balance"
                  >
                    {sec.headline}
                  </h2>
                  <p className="mt-3 text-sm md:text-base" style={{ color: mutedText }}>
                    {sec.description}
                  </p>

                  {brief.integrations.formKind !== 'none' ? (
                    <form
                      onSubmit={handleFormSubmit}
                      onClick={(e) => e.stopPropagation()}
                      noValidate
                      className="mt-6 space-y-4"
                    >
                      <div
                        className={`grid gap-3 ${
                          viewport === 'mobile' ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'
                        }`}
                      >
                        {brief.integrations.formKind !== 'newsletter' && (
                          <div>
                            <label className="block text-xs font-semibold mb-1">Full Name</label>
                            <input
                              type="text"
                              value={leadName}
                              onChange={(e) => setLeadName(e.target.value)}
                              placeholder="Alex Morgan"
                              style={{ borderColor, backgroundColor: cardSurface }}
                              className="h-11 w-full rounded-lg border px-3 text-sm"
                            />
                          </div>
                        )}
                        <div>
                          <label className="block text-xs font-semibold mb-1">Email Address</label>
                          <input
                            type="email"
                            value={leadEmail}
                            onChange={(e) => setLeadEmail(e.target.value)}
                            placeholder="alex@company.com"
                            style={{ borderColor, backgroundColor: cardSurface }}
                            className="h-11 w-full rounded-lg border px-3 text-sm"
                          />
                        </div>
                      </div>
                      {brief.integrations.formKind === 'contact' && (
                        <div>
                          <label className="block text-xs font-semibold mb-1">
                            Project or Enquiry Notes
                          </label>
                          <textarea
                            rows={2}
                            value={leadNotes}
                            onChange={(e) => setLeadNotes(e.target.value)}
                            style={{ borderColor, backgroundColor: cardSurface }}
                            className="w-full rounded-lg border p-3 text-sm"
                          />
                        </div>
                      )}
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="submit"
                          style={{ backgroundColor: design.primaryColor }}
                          className={`inline-flex min-h-[44px] items-center px-6 py-2.5 text-sm font-semibold text-white cursor-pointer ${btnRadius}`}
                        >
                          {sec.primaryCtaText || 'Submit Request'}
                        </button>
                        {brief.integrations.whatsappNumber && (
                          <a
                            href={`https://wa.me/${brief.integrations.whatsappNumber.replace(/[^\d]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ borderColor }}
                            className={`inline-flex min-h-[44px] items-center gap-2 border px-4 py-2 text-xs font-semibold ${btnRadius}`}
                          >
                            <MessageSquare className="h-3.5 w-3.5" /> WhatsApp
                          </a>
                        )}
                        {brief.integrations.phoneNumber && (
                          <a
                            href={`tel:${brief.integrations.phoneNumber}`}
                            style={{ borderColor }}
                            className={`inline-flex min-h-[44px] items-center gap-2 border px-4 py-2 text-xs font-semibold ${btnRadius}`}
                          >
                            <Phone className="h-3.5 w-3.5" /> {brief.integrations.phoneNumber}
                          </a>
                        )}
                      </div>
                      {formFeedback && (
                        <p
                          role="status"
                          className={`text-xs font-medium ${
                            formFeedback.type === 'error'
                              ? 'text-red-600'
                              : formFeedback.type === 'success'
                                ? 'text-emerald-700'
                                : 'text-amber-700'
                          }`}
                        >
                          {formFeedback.message}
                        </p>
                      )}
                    </form>
                  ) : (
                    <div className="mt-6 flex flex-wrap gap-3">
                      <a
                        href={sec.primaryCtaDestination || '#'}
                        style={{ backgroundColor: design.primaryColor }}
                        className={`inline-flex min-h-[44px] items-center px-6 py-2.5 text-sm font-semibold text-white ${btnRadius}`}
                      >
                        {sec.primaryCtaText || 'Get Started'}
                      </a>
                    </div>
                  )}
                </div>
              </section>
            );
          }

          if (sec.type === 'footer') {
            return (
              <footer
                key={sec.id}
                id={`preview-${sec.id}`}
                onClick={() => onSelectSection?.(sec.id)}
                style={{ borderTop: `1px solid ${borderColor}` }}
                className={`py-10 ${wrapperRing} cursor-pointer`}
              >
                <div className="mx-auto flex max-w-6xl flex-wrap items-start justify-between gap-6 px-5 text-xs">
                  <div className="max-w-sm space-y-1.5">
                    <p className="text-sm font-bold">{brief.businessName}</p>
                    <p style={{ color: mutedText }}>{sec.description}</p>
                    {sec.contactAddress && (
                      <p style={{ color: mutedText }}>{sec.contactAddress}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-start md:items-end gap-1.5" style={{ color: mutedText }}>
                    {brief.integrations.contactEmail && (
                      <a
                        href={`mailto:${brief.integrations.contactEmail}`}
                        className="inline-flex items-center gap-1.5 hover:underline"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        {brief.integrations.contactEmail}
                      </a>
                    )}
                    {brief.integrations.phoneNumber && (
                      <a
                        href={`tel:${brief.integrations.phoneNumber}`}
                        className="inline-flex items-center gap-1.5 hover:underline"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        {brief.integrations.phoneNumber}
                      </a>
                    )}
                    <p>{sec.legalNote}</p>
                  </div>
                </div>
              </footer>
            );
          }

          // Standard narrative sections: problem, solution, features, how_it_works, why_choose_us
          const useSurface = sec.type === 'problem' || sec.type === 'how_it_works';
          return (
            <section
              key={sec.id}
              id={`preview-${sec.id}`}
              onClick={() => onSelectSection?.(sec.id)}
              style={{
                backgroundColor: useSurface ? design.surfaceColor : design.backgroundColor,
                borderTop: `1px solid ${borderColor}`,
              }}
              className={`${paddingY} ${wrapperRing} cursor-pointer`}
            >
              <div className="mx-auto max-w-6xl px-5">
                <div className="max-w-2xl">
                  {sec.eyebrow && (
                    <p
                      className="mb-2 text-xs font-semibold"
                      style={{ color: design.primaryColor }}
                    >
                      {sec.eyebrow}
                    </p>
                  )}
                  <h2
                    style={{ fontFamily: `'${design.headingFont}', system-ui, sans-serif` }}
                    className="text-2xl md:text-3xl font-bold tracking-tight text-balance"
                  >
                    {sec.headline}
                  </h2>
                  <p className="mt-3 text-sm md:text-base leading-relaxed" style={{ color: mutedText }}>
                    {sec.description}
                  </p>
                </div>

                {sec.items && sec.items.length > 0 && (
                  <div
                    className={`mt-8 grid gap-5 ${
                      viewport === 'mobile'
                        ? 'grid-cols-1'
                        : sec.items.length === 2 || sec.items.length === 4
                          ? 'grid-cols-1 md:grid-cols-2'
                          : 'grid-cols-1 md:grid-cols-3'
                    }`}
                  >
                    {sec.items.map((item, idx) => (
                      <article
                        key={item.id}
                        style={{ backgroundColor: cardSurface, borderColor }}
                        className={`border p-6 ${cardRadius}`}
                      >
                        <p
                          className="text-xs font-bold tabular-nums"
                          style={{ color: design.primaryColor }}
                        >
                          {item.stepNumber || `0${idx + 1}.`}
                        </p>
                        <h3 className="mt-2 text-base font-bold">{item.title}</h3>
                        <p className="mt-2 text-sm leading-relaxed" style={{ color: mutedText }}>
                          {item.description}
                        </p>
                        {item.benefit && (
                          <p
                            className="mt-3 text-xs font-semibold"
                            style={{ color: design.primaryColor }}
                          >
                            {item.benefit}
                          </p>
                        )}
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </main>

      {/* Sticky Mobile CTA (strictly <= 15% mobile height) */}
      {viewport === 'mobile' && design.stickyMobileCta && hero?.primaryCtaText && (
        <div
          style={{
            backgroundColor: design.backgroundColor,
            borderTop: `1px solid ${borderColor}`,
          }}
          className="sticky bottom-0 z-20 px-4 py-2.5"
        >
          <a
            href={hero.primaryCtaDestination || '#preview-final'}
            style={{ backgroundColor: design.primaryColor }}
            className={`flex min-h-[44px] w-full items-center justify-center text-sm font-semibold text-white ${btnRadius}`}
          >
            {hero.primaryCtaText}
          </a>
        </div>
      )}
    </div>
  );
}
