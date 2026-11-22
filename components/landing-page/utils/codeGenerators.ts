import type {
  CodeFramework,
  GeneratedCodeFile,
  GeneratedLandingPage,
  PageSection,
} from '../types/aivora';

function escapeHtml(str: string): string {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeHref(url?: string): string {
  const trimmed = (url || '#conversion-form').trim();
  if (
    trimmed.startsWith('#') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('tel:')
  ) {
    return trimmed;
  }
  return '#conversion-form';
}

function getBorderRadiusCss(radius: GeneratedLandingPage['design']['borderRadius']): string {
  switch (radius) {
    case 'none':
      return '0px';
    case 'sm':
      return '4px';
    case 'md':
      return '8px';
    case 'lg':
      return '14px';
  }
}

function getButtonRadiusCss(style: GeneratedLandingPage['design']['buttonStyle']): string {
  switch (style) {
    case 'sharp':
      return '2px';
    case 'rounded':
      return '8px';
    case 'pill':
      return '9999px';
  }
}

function renderHtmlSection(sec: PageSection, page: GeneratedLandingPage): string {
  const idAttr = escapeHtml(sec.type.replace(/_/g, '-'));
  if (sec.type === 'hero') {
    return `
    <section id="hero" class="hero-section">
      <div class="container hero-grid">
        <div class="hero-copy">
          ${sec.eyebrow ? `<p class="eyebrow">${escapeHtml(sec.eyebrow)}</p>` : ''}
          <h1>${escapeHtml(sec.headline)}</h1>
          ${sec.subheadline ? `<p class="lead">${escapeHtml(sec.subheadline)}</p>` : ''}
          <p class="body-copy">${escapeHtml(sec.description)}</p>
          <div class="cta-row">
            ${
              sec.primaryCtaText
                ? `<a class="btn btn-primary" href="${escapeHtml(safeHref(sec.primaryCtaDestination))}">${escapeHtml(sec.primaryCtaText)}</a>`
                : ''
            }
            ${
              sec.secondaryCtaText
                ? `<a class="btn btn-secondary" href="${escapeHtml(safeHref(sec.secondaryCtaDestination))}">${escapeHtml(sec.secondaryCtaText)}</a>`
                : ''
            }
          </div>
          ${
            sec.trustIndicators?.length
              ? `<p class="trust-line">${sec.trustIndicators.map((t) => escapeHtml(t)).join(' &middot; ')}</p>`
              : ''
          }
        </div>
        ${
          sec.imageUrl
            ? `<div class="hero-media"><img src="${escapeHtml(sec.imageUrl)}" alt="${escapeHtml(sec.imageAlt || sec.headline)}" width="1280" height="720" loading="eager" /></div>`
            : ''
        }
      </div>
    </section>`;
  }

  if (sec.type === 'social_proof') {
    return `
    <section id="${idAttr}" class="band band-surface">
      <div class="container">
        <div class="section-header">
          <h2>${escapeHtml(sec.headline)}</h2>
          <p>${escapeHtml(sec.description)}</p>
        </div>
        ${
          sec.stats?.length
            ? `<div class="grid-3">${sec.stats
                .map(
                  (st) => `
            <article class="card">
              <div class="metric-value">${escapeHtml(st.value)}</div>
              <h3>${escapeHtml(st.label)}</h3>
              <p class="muted">${escapeHtml(st.context)}</p>
            </article>`
                )
                .join('')}</div>`
            : ''
        }
        ${
          sec.testimonials?.length
            ? `<div class="grid-2">${sec.testimonials
                .map(
                  (t) => `
            <blockquote class="card quote-card">
              <p>"${escapeHtml(t.quote)}"</p>
              <footer><strong>${escapeHtml(t.authorName)}</strong> &middot; ${escapeHtml(t.authorRole)}, ${escapeHtml(t.company)}</footer>
            </blockquote>`
                )
                .join('')}</div>`
            : ''
        }
      </div>
    </section>`;
  }

  if (sec.type === 'pricing' && sec.pricingPlans?.length) {
    return `
    <section id="${idAttr}" class="band">
      <div class="container">
        <div class="section-header">
          <h2>${escapeHtml(sec.headline)}</h2>
          <p>${escapeHtml(sec.description)}</p>
        </div>
        <div class="grid-3">
          ${sec.pricingPlans
            .map(
              (plan) => `
          <article class="card ${plan.isHighlighted ? 'card-highlight' : ''}">
            <h3>${escapeHtml(plan.name)}</h3>
            <p class="muted">${escapeHtml(plan.targetAudience)}</p>
            <div class="price-row"><span class="metric-value">${escapeHtml(plan.price)}</span> <span class="muted">${escapeHtml(plan.billingCycle)}</span></div>
            <ul class="feature-list">${plan.features.map((f) => `<li>${escapeHtml(f)}</li>`).join('')}</ul>
            <a class="btn btn-primary" href="${escapeHtml(safeHref(sec.primaryCtaDestination))}">${escapeHtml(plan.ctaText)}</a>
          </article>`
            )
            .join('')}
        </div>
      </div>
    </section>`;
  }

  if (sec.type === 'faq' && sec.faqs?.length) {
    return `
    <section id="${idAttr}" class="band band-surface">
      <div class="container narrow">
        <div class="section-header">
          <h2>${escapeHtml(sec.headline)}</h2>
          <p>${escapeHtml(sec.description)}</p>
        </div>
        <div class="faq-list">
          ${sec.faqs
            .map(
              (f) => `
          <details class="faq-item">
            <summary>${escapeHtml(f.question)}</summary>
            <p>${escapeHtml(f.answer)}</p>
          </details>`
            )
            .join('')}
        </div>
      </div>
    </section>`;
  }

  if (sec.type === 'final_cta') {
    const formHtml =
      page.brief.integrations.formKind !== 'none'
        ? `
      <form id="conversion-form" class="lead-form" data-endpoint="${escapeHtml(page.brief.integrations.formEndpointUrl)}" novalidate>
        <div class="form-grid">
          ${
            page.brief.integrations.formKind !== 'newsletter'
              ? `<div class="field"><label for="lead-name">Full Name</label><input id="lead-name" name="name" type="text" required placeholder="Jane Smith" /></div>`
              : ''
          }
          <div class="field"><label for="lead-email">Work Email</label><input id="lead-email" name="email" type="email" required placeholder="jane@company.com" /></div>
        </div>
        <button type="submit" class="btn btn-primary">${escapeHtml(sec.primaryCtaText || 'Submit')}</button>
        <p id="form-status" class="form-status" role="status" aria-live="polite"></p>
      </form>`
        : `<div class="cta-row"><a class="btn btn-primary" href="${escapeHtml(safeHref(sec.primaryCtaDestination))}">${escapeHtml(sec.primaryCtaText || 'Get Started')}</a></div>`;

    return `
    <section id="final-cta" class="band final-cta-band">
      <div class="container narrow">
        <h2>${escapeHtml(sec.headline)}</h2>
        <p class="lead">${escapeHtml(sec.description)}</p>
        ${formHtml}
      </div>
    </section>`;
  }

  if (sec.type === 'footer') {
    return '';
  }

  return `
  <section id="${idAttr}" class="band ${sec.type === 'problem' || sec.type === 'how_it_works' ? 'band-surface' : ''}">
    <div class="container">
      <div class="section-header">
        ${sec.eyebrow ? `<p class="eyebrow">${escapeHtml(sec.eyebrow)}</p>` : ''}
        <h2>${escapeHtml(sec.headline)}</h2>
        <p>${escapeHtml(sec.description)}</p>
      </div>
      ${
        sec.items?.length
          ? `<div class="grid-3">${sec.items
              .map(
                (item, idx) => `
        <article class="card">
          ${item.stepNumber ? `<span class="step-num">${escapeHtml(item.stepNumber)}</span>` : `<span class="step-num">0${idx + 1}.</span>`}
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.description)}</p>
          ${item.benefit ? `<p class="benefit-line">${escapeHtml(item.benefit)}</p>` : ''}
        </article>`
              )
              .join('')}</div>`
          : ''
      }
    </div>
  </section>`;
}

function generateHtmlBundle(page: GeneratedLandingPage): GeneratedCodeFile[] {
  const enabled = page.sections.filter((s) => s.enabled);
  const hero = enabled.find((s) => s.type === 'hero');
  const footer = enabled.find((s) => s.type === 'footer');
  const navLinks = enabled.filter((s) => s.type !== 'hero' && s.type !== 'footer').slice(0, 5);
  const jsonLdScripts = page.seo.jsonLdSchemas
    .filter((s) => s.eligible && s.isValidJson)
    .map((s) => `<script type="application/ld+json">\n${s.jsonString}\n</script>`)
    .join('\n  ');

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(page.seo.metadata.seoTitle)}</title>
  <meta name="description" content="${escapeHtml(page.seo.metadata.metaDescription)}" />
  <link rel="canonical" href="${escapeHtml(page.seo.metadata.canonicalUrl)}" />
  <meta property="og:title" content="${escapeHtml(page.seo.metadata.ogTitle)}" />
  <meta property="og:description" content="${escapeHtml(page.seo.metadata.ogDescription)}" />
  <meta property="og:type" content="website" />
  <link rel="stylesheet" href="./styles.css" />
  ${jsonLdScripts}
</head>
<body>
  <header class="site-header">
    <div class="container nav-row">
      <a href="#hero" class="brand">${escapeHtml(page.brief.businessName)}</a>
      <nav aria-label="Primary navigation" class="nav-links" id="primary-nav">
        ${navLinks.map((s) => `<a href="#${escapeHtml(s.type.replace(/_/g, '-'))}">${escapeHtml(s.navLabel)}</a>`).join('\n        ')}
      </nav>
      <div class="nav-actions">
        <a class="btn btn-primary btn-sm" href="${escapeHtml(safeHref(hero?.primaryCtaDestination))}">${escapeHtml(hero?.primaryCtaText || 'Get Started')}</a>
        <button type="button" class="menu-toggle" aria-expanded="false" aria-controls="primary-nav">Menu</button>
      </div>
    </div>
  </header>

  <main>
    ${enabled.map((sec) => renderHtmlSection(sec, page)).join('\n')}
  </main>

  <footer class="site-footer">
    <div class="container footer-row">
      <div>
        <strong>${escapeHtml(page.brief.businessName)}</strong>
        <p class="muted">${escapeHtml(footer?.description || page.brief.productDescription)}</p>
      </div>
      <div class="footer-meta">
        ${page.brief.integrations.contactEmail ? `<a href="mailto:${escapeHtml(page.brief.integrations.contactEmail)}">${escapeHtml(page.brief.integrations.contactEmail)}</a>` : ''}
        ${page.brief.integrations.phoneNumber ? `<a href="tel:${escapeHtml(page.brief.integrations.phoneNumber)}">${escapeHtml(page.brief.integrations.phoneNumber)}</a>` : ''}
        <p class="muted">${escapeHtml(footer?.legalNote || `© ${new Date().getFullYear()} ${page.brief.businessName}`)}</p>
      </div>
    </div>
  </footer>

  <script src="./main.js" defer></script>
</body>
</html>`;

  const css = `:root {
  --bg: ${page.design.backgroundColor};
  --surface: ${page.design.surfaceColor};
  --text: ${page.design.textColor};
  --primary: ${page.design.primaryColor};
  --secondary: ${page.design.secondaryColor};
  --radius: ${getBorderRadiusCss(page.design.borderRadius)};
  --btn-radius: ${getButtonRadiusCss(page.design.buttonStyle)};
  --font-heading: '${page.design.headingFont}', system-ui, sans-serif;
  --font-body: '${page.design.bodyFont}', system-ui, sans-serif;
}

* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0;
  font-family: var(--font-body);
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
}
h1, h2, h3 { font-family: var(--font-heading); line-height: 1.15; margin: 0 0 0.75rem; text-wrap: balance; }
h1 { font-size: clamp(2.25rem, 4vw, 3.5rem); letter-spacing: -0.025em; }
h2 { font-size: clamp(1.6rem, 2.8vw, 2.35rem); letter-spacing: -0.02em; }
img { max-width: 100%; height: auto; display: block; border-radius: var(--radius); }
a { color: inherit; }

.container { width: 100%; max-width: 1180px; margin: 0 auto; padding: 0 1.25rem; }
.container.narrow { max-width: 780px; }

.site-header {
  position: sticky; top: 0; z-index: 40;
  background: var(--bg);
  border-bottom: 1px solid rgba(148, 163, 184, 0.25);
}
.nav-row { display: flex; align-items: center; justify-content: space-between; gap: 2rem; min-height: 68px; }
.brand { font-family: var(--font-heading); font-weight: 700; font-size: 1.125rem; text-decoration: none; white-space: nowrap; }
.nav-links { display: flex; gap: 1.5rem; }
.nav-links a { text-decoration: none; font-size: 0.9rem; opacity: 0.82; white-space: nowrap; }
.nav-links a:hover { opacity: 1; text-decoration: underline; }
.nav-actions { display: flex; align-items: center; gap: 0.75rem; }
.menu-toggle { display: none; background: transparent; border: 1px solid rgba(148,163,184,0.4); color: var(--text); padding: 0.45rem 0.75rem; border-radius: var(--btn-radius); cursor: pointer; }

.hero-section { padding: 4.5rem 0; }
.hero-grid { display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 3rem; align-items: center; }
.eyebrow { font-size: 0.8125rem; font-weight: 600; color: var(--primary); margin: 0 0 0.75rem; }
.lead { font-size: 1.15rem; opacity: 0.9; margin: 0 0 1rem; }
.trust-line { font-size: 0.85rem; opacity: 0.75; margin-top: 1.25rem; }

.band { padding: 4.25rem 0; }
.band-surface { background: var(--surface); }
.section-header { max-width: 680px; margin-bottom: 2.25rem; }
.grid-3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1.5rem; }
.grid-2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1.5rem; margin-top: 1.5rem; }
.card {
  background: var(--bg);
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: var(--radius);
  padding: 1.5rem;
}
.card-highlight { border-color: var(--primary); border-width: 2px; }
.step-num { display: block; font-size: 0.85rem; font-weight: 700; color: var(--primary); margin-bottom: 0.5rem; }
.benefit-line { font-size: 0.9rem; font-weight: 600; color: var(--primary); margin-top: 0.75rem; }
.metric-value { font-size: 2rem; font-weight: 700; font-variant-numeric: tabular-nums; }
.muted { opacity: 0.75; font-size: 0.92rem; }

.cta-row { display: flex; flex-wrap: wrap; gap: 0.85rem; margin-top: 1.5rem; }
.btn {
  display: inline-flex; align-items: center; justify-content: center;
  min-height: 44px; padding: 0.65rem 1.35rem;
  font-weight: 600; font-size: 0.95rem; text-decoration: none;
  border-radius: var(--btn-radius); border: 1px solid transparent; cursor: pointer;
}
.btn-sm { min-height: 38px; padding: 0.45rem 1rem; font-size: 0.85rem; }
.btn-primary { background: var(--primary); color: #FFFFFF; }
.btn-secondary { border-color: rgba(148, 163, 184, 0.45); color: var(--text); }

.faq-list { display: grid; gap: 0.75rem; }
.faq-item { border: 1px solid rgba(148,163,184,0.28); border-radius: var(--radius); padding: 1rem 1.25rem; background: var(--bg); }
.faq-item summary { font-weight: 600; cursor: pointer; }

.lead-form { margin-top: 1.5rem; display: grid; gap: 1rem; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
.field { display: grid; gap: 0.35rem; }
.field label { font-size: 0.875rem; font-weight: 600; }
.field input { min-height: 44px; padding: 0.55rem 0.75rem; border: 1px solid rgba(148,163,184,0.45); border-radius: var(--radius); font: inherit; }
.form-status { font-size: 0.9rem; margin: 0; }

.site-footer { padding: 2.5rem 0; border-top: 1px solid rgba(148,163,184,0.25); }
.footer-row { display: flex; justify-content: space-between; gap: 2rem; flex-wrap: wrap; }
.footer-meta { display: grid; gap: 0.35rem; text-align: right; }

@media (max-width: 900px) {
  .hero-grid, .grid-3, .grid-2, .form-grid { grid-template-columns: 1fr; }
  .nav-links { display: none; position: absolute; top: 68px; left: 0; right: 0; background: var(--bg); flex-direction: column; padding: 1rem 1.25rem; border-bottom: 1px solid rgba(148,163,184,0.25); }
  .nav-links.open { display: flex; }
  .menu-toggle { display: inline-flex; }
  .footer-meta { text-align: left; }
}
`;

  const js = `document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.getElementById('primary-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
  }

  const form = document.getElementById('conversion-form');
  const statusEl = document.getElementById('form-status');
  if (form && statusEl) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const emailInput = form.querySelector('input[type="email"]');
      const nameInput = form.querySelector('input[name="name"]');
      const email = emailInput ? emailInput.value.trim() : '';
      const name = nameInput ? nameInput.value.trim() : '';

      if (nameInput && name.length < 2) {
        statusEl.textContent = 'Please enter your name.';
        return;
      }
      if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) {
        statusEl.textContent = 'Please enter a valid email address.';
        return;
      }

      const endpoint = form.getAttribute('data-endpoint') || '';
      if (!endpoint) {
        statusEl.textContent = 'Validation passed. Configure a live form endpoint URL on data-endpoint to transmit submissions.';
        return;
      }

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email }),
        });
        statusEl.textContent = res.ok
          ? 'Thank you — your request has been submitted.'
          : 'Submission failed with status ' + res.status;
      } catch {
        statusEl.textContent = 'Network error while submitting form.';
      }
    });
  }
});
`;

  return [
    { path: 'html/index.html', language: 'html', content: html },
    { path: 'html/styles.css', language: 'css', content: css },
    { path: 'html/main.js', language: 'javascript', content: js },
  ];
}

function generateReactTailwindBundle(page: GeneratedLandingPage): GeneratedCodeFile[] {
  const dataPayload = JSON.stringify(
    {
      brief: page.brief,
      design: page.design,
      seo: page.seo.metadata,
      sections: page.sections.filter((s) => s.enabled),
    },
    null,
    2
  );

  const navbarTsx = `import React, { useState } from 'react';
import type { PageSection } from '../data/landingData';

interface NavbarProps {
  brandName: string;
  sections: PageSection[];
  ctaText: string;
  ctaHref: string;
  primaryColor: string;
}

export function Navbar({ brandName, sections, ctaText, ctaHref, primaryColor }: NavbarProps) {
  const [open, setOpen] = useState(false);
  const links = sections.filter((s) => s.type !== 'hero' && s.type !== 'footer').slice(0, 5);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-8 px-5">
        <a href="#hero" className="text-lg font-bold tracking-tight whitespace-nowrap shrink-0">
          {brandName}
        </a>
        <nav aria-label="Primary" className="hidden md:flex items-center gap-6 text-sm text-slate-600">
          {links.map((s) => (
            <a
              key={s.id}
              href={\`#\${s.type.replace(/_/g, '-')}\`}
              className="hover:text-slate-950 whitespace-nowrap shrink-0"
            >
              {s.navLabel}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3 shrink-0">
          <a
            href={ctaHref}
            style={{ backgroundColor: primaryColor }}
            className="inline-flex min-h-[40px] items-center rounded-lg px-4 py-2 text-sm font-semibold text-white whitespace-nowrap shrink-0"
          >
            {ctaText}
          </a>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="md:hidden rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium"
          >
            Menu
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden border-t border-slate-200 bg-white px-5 py-3 flex flex-col gap-2">
          {links.map((s) => (
            <a
              key={s.id}
              href={\`#\${s.type.replace(/_/g, '-')}\`}
              onClick={() => setOpen(false)}
              className="py-2 text-sm font-medium text-slate-700"
            >
              {s.navLabel}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}
`;

  const heroTsx = `import React from 'react';
import type { PageSection } from '../data/landingData';

export function HeroSection({ section, primaryColor }: { section: PageSection; primaryColor: string }) {
  return (
    <section id="hero" className="py-16 md:py-24">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-6">
          {section.eyebrow && (
            <p className="mb-3 text-sm font-semibold" style={{ color: primaryColor }}>
              {section.eyebrow}
            </p>
          )}
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl text-balance">
            {section.headline}
          </h1>
          {section.subheadline && (
            <p className="mt-4 text-lg text-slate-700">{section.subheadline}</p>
          )}
          <p className="mt-4 text-base text-slate-600">{section.description}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            {section.primaryCtaText && (
              <a
                href={section.primaryCtaDestination || '#conversion-form'}
                style={{ backgroundColor: primaryColor }}
                className="inline-flex min-h-[44px] items-center rounded-lg px-6 py-3 text-sm font-semibold text-white"
              >
                {section.primaryCtaText}
              </a>
            )}
            {section.secondaryCtaText && (
              <a
                href={section.secondaryCtaDestination || '#how-it-works'}
                className="inline-flex min-h-[44px] items-center rounded-lg border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-900"
              >
                {section.secondaryCtaText}
              </a>
            )}
          </div>
          {section.trustIndicators && section.trustIndicators.length > 0 && (
            <p className="mt-6 text-xs text-slate-500">
              {section.trustIndicators.join(' · ')}
            </p>
          )}
        </div>
        {section.imageUrl && (
          <div className="lg:col-span-6">
            <img
              src={section.imageUrl}
              alt={section.imageAlt || section.headline}
              width={1280}
              height={720}
              className="w-full rounded-xl object-cover shadow-sm"
            />
          </div>
        )}
      </div>
    </section>
  );
}
`;

  const formTsx = `import React, { useState } from 'react';

interface ConversionFormProps {
  formKind: 'lead-generation' | 'contact' | 'newsletter' | 'none';
  endpointUrl: string;
  ctaText: string;
  primaryColor: string;
}

export function ConversionForm({ formKind, endpointUrl, ctaText, primaryColor }: ConversionFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');

  if (formKind === 'none') return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (formKind !== 'newsletter' && name.trim().length < 2) {
      setStatus('Please enter your full name.');
      return;
    }
    if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email.trim())) {
      setStatus('Please enter a valid email address.');
      return;
    }
    if (!endpointUrl) {
      setStatus('Form validation succeeded. Configure an external endpoint URL to transmit submissions.');
      return;
    }
    try {
      const res = await fetch(endpointUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });
      setStatus(res.ok ? 'Thank you. Your submission has been received.' : \`Server returned \${res.status}\`);
    } catch {
      setStatus('Network error submitting form.');
    }
  }

  return (
    <form id="conversion-form" onSubmit={handleSubmit} noValidate className="mt-8 grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {formKind !== 'newsletter' && (
          <div>
            <label htmlFor="cf-name" className="block text-sm font-medium mb-1">Full Name</label>
            <input
              id="cf-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full min-h-[44px] rounded-lg border border-slate-300 px-3 text-sm"
              required
            />
          </div>
        )}
        <div>
          <label htmlFor="cf-email" className="block text-sm font-medium mb-1">Work Email</label>
          <input
            id="cf-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full min-h-[44px] rounded-lg border border-slate-300 px-3 text-sm"
            required
          />
        </div>
      </div>
      <div>
        <button
          type="submit"
          style={{ backgroundColor: primaryColor }}
          className="inline-flex min-h-[44px] items-center rounded-lg px-6 py-2.5 text-sm font-semibold text-white"
        >
          {ctaText}
        </button>
      </div>
      {status && <p role="status" className="text-sm text-slate-700">{status}</p>}
    </form>
  );
}
`;

  const sectionRendererTsx = `import React from 'react';
import type { PageSection } from '../data/landingData';

export function ContentSection({ section, primaryColor }: { section: PageSection; primaryColor: string }) {
  const id = section.type.replace(/_/g, '-');

  if (section.type === 'faq' && section.faqs) {
    return (
      <section id={id} className="bg-slate-50 py-16">
        <div className="mx-auto max-w-3xl px-5">
          <h2 className="text-3xl font-bold tracking-tight">{section.headline}</h2>
          <p className="mt-2 text-slate-600">{section.description}</p>
          <div className="mt-8 space-y-3">
            {section.faqs.map((faq) => (
              <details key={faq.id} className="rounded-lg border border-slate-200 bg-white p-4">
                <summary className="cursor-pointer font-semibold text-slate-900">{faq.question}</summary>
                <p className="mt-2 text-sm text-slate-600">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id={id} className="py-16 border-t border-slate-200/60">
      <div className="mx-auto max-w-6xl px-5">
        <div className="max-w-2xl">
          {section.eyebrow && (
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: primaryColor }}>
              {section.eyebrow}
            </p>
          )}
          <h2 className="text-3xl font-bold tracking-tight">{section.headline}</h2>
          <p className="mt-3 text-slate-600">{section.description}</p>
        </div>
        {section.items && section.items.length > 0 && (
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {section.items.map((item, idx) => (
              <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-6">
                <p className="text-xs font-bold" style={{ color: primaryColor }}>
                  {item.stepNumber || \`0\${idx + 1}.\`}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{item.description}</p>
                {item.benefit && (
                  <p className="mt-3 text-xs font-medium text-slate-800">{item.benefit}</p>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
`;

  const appTsx = `import React from 'react';
import { landingData } from './data/landingData';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { ContentSection } from './components/ContentSection';
import { ConversionForm } from './components/ConversionForm';

export default function App() {
  const { brief, design, sections } = landingData;
  const hero = sections.find((s) => s.type === 'hero');
  const finalCta = sections.find((s) => s.type === 'final_cta');
  const footer = sections.find((s) => s.type === 'footer');

  return (
    <div className="min-h-screen" style={{ backgroundColor: design.backgroundColor, color: design.textColor }}>
      <Navbar
        brandName={brief.businessName}
        sections={sections}
        ctaText={hero?.primaryCtaText || 'Get Started'}
        ctaHref={hero?.primaryCtaDestination || '#conversion-form'}
        primaryColor={design.primaryColor}
      />
      <main>
        {hero && <HeroSection section={hero} primaryColor={design.primaryColor} />}
        {sections
          .filter((s) => s.type !== 'hero' && s.type !== 'final_cta' && s.type !== 'footer')
          .map((sec) => (
            <ContentSection key={sec.id} section={sec} primaryColor={design.primaryColor} />
          ))}
        {finalCta && (
          <section id="final-cta" className="bg-slate-50 py-16 border-t border-slate-200">
            <div className="mx-auto max-w-3xl px-5">
              <h2 className="text-3xl font-bold">{finalCta.headline}</h2>
              <p className="mt-3 text-slate-600">{finalCta.description}</p>
              <ConversionForm
                formKind={brief.integrations.formKind}
                endpointUrl={brief.integrations.formEndpointUrl}
                ctaText={finalCta.primaryCtaText || 'Submit'}
                primaryColor={design.primaryColor}
              />
            </div>
          </section>
        )}
      </main>
      <footer className="border-t border-slate-200 py-10">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-6 px-5 text-sm text-slate-600">
          <div>
            <strong className="text-slate-900">{brief.businessName}</strong>
            <p className="mt-1">{footer?.description || brief.productDescription}</p>
          </div>
          <p>{footer?.legalNote || \`© \${new Date().getFullYear()} \${brief.businessName}\`}</p>
        </div>
      </footer>
    </div>
  );
}
`;

  const dataTs = `export type PageSection = ${JSON.stringify(page.sections[0] || {}, null, 2).replace(/{[\s\S]*}/, 'Record<string, any> & { id: string; type: string; navLabel: string; headline: string; description: string; eyebrow?: string; subheadline?: string; primaryCtaText?: string; primaryCtaDestination?: string; secondaryCtaText?: string; secondaryCtaDestination?: string; imageUrl?: string; imageAlt?: string; trustIndicators?: string[]; legalNote?: string; items?: Array<{ id: string; title: string; description: string; benefit?: string; stepNumber?: string }>; faqs?: Array<{ id: string; question: string; answer: string }> }')};

export const landingData = ${dataPayload};
`;

  return [
    { path: 'react-tailwind/src/data/landingData.ts', language: 'typescript', content: dataTs },
    { path: 'react-tailwind/src/components/Navbar.tsx', language: 'typescript', content: navbarTsx },
    { path: 'react-tailwind/src/components/HeroSection.tsx', language: 'typescript', content: heroTsx },
    { path: 'react-tailwind/src/components/ContentSection.tsx', language: 'typescript', content: sectionRendererTsx },
    { path: 'react-tailwind/src/components/ConversionForm.tsx', language: 'typescript', content: formTsx },
    { path: 'react-tailwind/src/App.tsx', language: 'typescript', content: appTsx },
    { path: 'react-tailwind/src/index.css', language: 'css', content: '@import "tailwindcss";\n' },
  ];
}

function generateNextJsBundle(page: GeneratedLandingPage): GeneratedCodeFile[] {
  const validSchemas = page.seo.jsonLdSchemas
    .filter((s) => s.eligible && s.isValidJson)
    .map((s) => JSON.parse(s.jsonString));

  const layoutTsx = `import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: ${JSON.stringify(page.seo.metadata.seoTitle)},
  description: ${JSON.stringify(page.seo.metadata.metaDescription)},
  alternates: {
    canonical: ${JSON.stringify(page.seo.metadata.canonicalUrl)},
  },
  openGraph: {
    title: ${JSON.stringify(page.seo.metadata.ogTitle)},
    description: ${JSON.stringify(page.seo.metadata.ogDescription)},
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
`;

  const pageTsx = `import { Navbar } from '../components/Navbar';
import { HeroSection } from '../components/HeroSection';
import { ContentSection } from '../components/ContentSection';
import { ConversionForm } from '../components/ConversionForm';
import { landingData } from '../lib/landingData';

const jsonLdSchemas = ${JSON.stringify(validSchemas, null, 2)};

export default function LandingPage() {
  const { brief, design, sections } = landingData;
  const hero = sections.find((s) => s.type === 'hero');
  const finalCta = sections.find((s) => s.type === 'final_cta');
  const footer = sections.find((s) => s.type === 'footer');

  return (
    <>
      {jsonLdSchemas.map((schema, idx) => (
        <script
          key={idx}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <div style={{ backgroundColor: design.backgroundColor, color: design.textColor }}>
        <Navbar
          brandName={brief.businessName}
          sections={sections}
          ctaText={hero?.primaryCtaText || 'Get Started'}
          ctaHref={hero?.primaryCtaDestination || '#conversion-form'}
          primaryColor={design.primaryColor}
        />
        <main>
          {hero && <HeroSection section={hero} primaryColor={design.primaryColor} />}
          {sections
            .filter((s) => s.type !== 'hero' && s.type !== 'final_cta' && s.type !== 'footer')
            .map((sec) => (
              <ContentSection key={sec.id} section={sec} primaryColor={design.primaryColor} />
            ))}
          {finalCta && (
            <section id="final-cta" className="bg-slate-50 py-16 border-t border-slate-200">
              <div className="mx-auto max-w-3xl px-5">
                <h2 className="text-3xl font-bold">{finalCta.headline}</h2>
                <p className="mt-3 text-slate-600">{finalCta.description}</p>
                <ConversionForm
                  formKind={brief.integrations.formKind}
                  endpointUrl={brief.integrations.formEndpointUrl}
                  ctaText={finalCta.primaryCtaText || 'Submit'}
                  primaryColor={design.primaryColor}
                />
              </div>
            </section>
          )}
        </main>
        <footer className="border-t border-slate-200 py-10">
          <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-6 px-5 text-sm text-slate-600">
            <div>
              <strong className="text-slate-900">{brief.businessName}</strong>
              <p className="mt-1">{footer?.description || brief.productDescription}</p>
            </div>
            <p>{footer?.legalNote || \`© \${new Date().getFullYear()} \${brief.businessName}\`}</p>
          </div>
        </footer>
      </div>
    </>
  );
}
`;

  const reactFiles = generateReactTailwindBundle(page).map((f) => ({
    ...f,
    path: f.path
      .replace('react-tailwind/src/data/', 'nextjs-ts/lib/')
      .replace('react-tailwind/src/components/', 'nextjs-ts/components/')
      .replace('react-tailwind/src/index.css', 'nextjs-ts/app/globals.css'),
  }));

  const clientConversionForm = reactFiles.find((f) => f.path.endsWith('ConversionForm.tsx'));
  if (clientConversionForm) {
    clientConversionForm.content = `'use client';\n` + clientConversionForm.content;
  }
  const clientNavbar = reactFiles.find((f) => f.path.endsWith('Navbar.tsx'));
  if (clientNavbar) {
    clientNavbar.content = `'use client';\n` + clientNavbar.content;
  }

  return [
    { path: 'nextjs-ts/app/layout.tsx', language: 'typescript', content: layoutTsx },
    { path: 'nextjs-ts/app/page.tsx', language: 'typescript', content: pageTsx },
    ...reactFiles.filter((f) => !f.path.endsWith('App.tsx')),
  ];
}

function generateBootstrapBundle(page: GeneratedLandingPage): GeneratedCodeFile[] {
  const enabled = page.sections.filter((s) => s.enabled);
  const hero = enabled.find((s) => s.type === 'hero');
  const footer = enabled.find((s) => s.type === 'footer');

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(page.seo.metadata.seoTitle)}</title>
  <meta name="description" content="${escapeHtml(page.seo.metadata.metaDescription)}" />
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" />
  <link href="./custom.css" rel="stylesheet" />
</head>
<body>
  <nav class="navbar navbar-expand-lg border-bottom bg-white sticky-top">
    <div class="container">
      <a class="navbar-brand fw-bold" href="#hero">${escapeHtml(page.brief.businessName)}</a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="mainNav">
        <ul class="navbar-nav mx-auto mb-2 mb-lg-0">
          ${enabled
            .filter((s) => s.type !== 'hero' && s.type !== 'footer')
            .slice(0, 5)
            .map(
              (s) =>
                `<li class="nav-item"><a class="nav-link" href="#${escapeHtml(s.type.replace(/_/g, '-'))}">${escapeHtml(s.navLabel)}</a></li>`
            )
            .join('\n          ')}
        </ul>
        <a class="btn btn-brand" href="${escapeHtml(safeHref(hero?.primaryCtaDestination))}">${escapeHtml(hero?.primaryCtaText || 'Get Started')}</a>
      </div>
    </div>
  </nav>

  <main>
    ${enabled
      .filter((s) => s.type !== 'footer')
      .map(
        (sec) => `
    <section id="${escapeHtml(sec.type.replace(/_/g, '-'))}" class="py-5 border-bottom">
      <div class="container py-3">
        ${sec.type === 'hero' ? `<h1 class="display-5 fw-bold">${escapeHtml(sec.headline)}</h1>` : `<h2 class="h2 fw-bold">${escapeHtml(sec.headline)}</h2>`}
        <p class="lead text-body-secondary">${escapeHtml(sec.description)}</p>
        ${
          sec.items?.length
            ? `<div class="row g-4 mt-2">${sec.items
                .map(
                  (it) =>
                    `<div class="col-md-4"><div class="card h-100"><div class="card-body"><h3 class="h5">${escapeHtml(it.title)}</h3><p class="card-text text-body-secondary">${escapeHtml(it.description)}</p></div></div></div>`
                )
                .join('')}</div>`
            : ''
        }
      </div>
    </section>`
      )
      .join('\n')}
  </main>

  <footer class="py-4 bg-light">
    <div class="container d-flex flex-wrap justify-content-between gap-3 text-body-secondary small">
      <span><strong>${escapeHtml(page.brief.businessName)}</strong> — ${escapeHtml(footer?.description || page.brief.productDescription)}</span>
      <span>${escapeHtml(footer?.legalNote || `© ${new Date().getFullYear()} ${page.brief.businessName}`)}</span>
    </div>
  </footer>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>`;

  const customCss = `.btn-brand {
  background-color: ${page.design.primaryColor};
  color: #ffffff;
  border-color: ${page.design.primaryColor};
}
.btn-brand:hover {
  opacity: 0.92;
  color: #ffffff;
}
`;

  return [
    { path: 'bootstrap/index.html', language: 'html', content: html },
    { path: 'bootstrap/custom.css', language: 'css', content: customCss },
  ];
}

export function generateCodeForFramework(
  page: GeneratedLandingPage,
  framework: CodeFramework
): GeneratedCodeFile[] {
  switch (framework) {
    case 'html':
      return generateHtmlBundle(page);
    case 'react-tailwind':
      return generateReactTailwindBundle(page);
    case 'nextjs-ts':
      return generateNextJsBundle(page);
    case 'bootstrap':
      return generateBootstrapBundle(page);
  }
}
