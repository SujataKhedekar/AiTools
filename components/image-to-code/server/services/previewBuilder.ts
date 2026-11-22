import path from 'node:path';
import * as esbuild from 'esbuild';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import type {
  BrandAssetInput,
  FrameworkId,
  GeneratedFile,
  PreviewCompileResponse,
} from '../../shared/types';
import { analyzeCodeQuality } from './codeQualityAnalyzer';

async function compileTailwindCandidates(candidates: string[]): Promise<string> {
  const result = await postcss([
    tailwindcss({ content: [{ raw: candidates.join(' '), extension: 'html' }], corePlugins: { preflight: false } }),
  ]).process('@tailwind utilities;', { from: undefined });
  return result.css;
}

function extractTailwindCandidates(files: GeneratedFile[]): string[] {
  const tokens = new Set<string>();
  const tokenRegex = /[A-Za-z0-9_!:\-\[\]\/.#%()@]+/g;
  for (const file of files) {
    if (!['tsx', 'jsx', 'ts', 'js', 'html', 'vue'].includes(file.language)) continue;
    const matches = file.content.match(tokenRegex);
    if (!matches) continue;
    for (const m of matches) {
      if (m.length >= 2 && m.length <= 80) {
        tokens.add(m);
      }
    }
  }
  return Array.from(tokens);
}

function buildAssetMapJson(assets: BrandAssetInput[]): string {
  const map: Record<string, string> = {};
  for (const asset of assets) {
    const dataUri = `data:${asset.mimeType};base64,${asset.base64}`;
    map[`/assets/${asset.label}`] = dataUri;
    map[`assets/${asset.label}`] = dataUri;
    map[`/public/assets/${asset.label}`] = dataUri;
    map[`/assets/${asset.name}`] = dataUri;
    map[asset.name] = dataUri;
  }
  return JSON.stringify(map);
}

function escapeHtmlScript(code: string): string {
  return code.replace(/<\/script>/gi, '<\\/script>');
}

function resolveVirtualImport(
  importerPath: string,
  specifier: string,
  fileMap: Map<string, GeneratedFile>
): string | null {
  const tryMatch = (base: string): string | null => {
    const exts = [
      '',
      '.tsx',
      '.ts',
      '.jsx',
      '.js',
      '.css',
      '.module.css',
      '.json',
      '/index.tsx',
      '/index.ts',
      '/index.jsx',
      '/index.js',
    ];
    for (const ext of exts) {
      const candidate = `${base}${ext}`.replace(/^\/+/, '');
      if (fileMap.has(candidate)) return candidate;
    }
    return null;
  };

  if (specifier.startsWith('@/')) {
    const sub = specifier.slice(2);
    return tryMatch(sub) ?? tryMatch(`src/${sub}`);
  }

  if (!specifier.startsWith('.')) return null;

  const dirParts = importerPath.split('/').slice(0, -1);
  for (const part of specifier.split('/')) {
    if (part === '.' || part === '') continue;
    if (part === '..') {
      dirParts.pop();
    } else {
      dirParts.push(part);
    }
  }
  return tryMatch(dirParts.join('/'));
}

function parseCssModuleClassMap(cssContent: string): Record<string, string> {
  const map: Record<string, string> = {};
  const regex = /\.([A-Za-z_-][A-Za-z0-9_-]*)/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(cssContent)) !== null) {
    const cls = match[1];
    map[cls] = cls;
  }
  return map;
}

const NEXT_SHIMS = `
import React from 'react';
export function ImageShim({ src, alt = '', width, height, className = '', style, fill, ...rest }) {
  const mergedStyle = fill ? { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', ...style } : style;
  return React.createElement('img', { src, alt, width, height, className, style: mergedStyle, referrerPolicy: 'no-referrer', ...rest });
}
export function LinkShim({ href = '#', children, className = '', onClick, ...rest }) {
  return React.createElement('a', {
    href: href || '#',
    className,
    onClick: (e) => {
      if (onClick) onClick(e);
      if (href && href.startsWith('#')) return;
      e.preventDefault();
    },
    ...rest
  }, children);
}
export function useRouter() {
  return { push: () => {}, replace: () => {}, back: () => {}, prefetch: () => {} };
}
export function usePathname() { return '/'; }
export function useSearchParams() { return new URLSearchParams(); }
`;

const BASE_PREVIEW_SAFE_SCRIPT = (assetMapJson: string) => `
(function() {
  var ASSETS = ${assetMapJson};
  function resolveAssetSrc(src) {
    if (!src) return null;
    if (ASSETS[src]) return ASSETS[src];
    var clean = src.replace(/^\\.\\//, '').replace(/^\\//, '');
    if (ASSETS[clean]) return ASSETS[clean];
    if (ASSETS['/' + clean]) return ASSETS['/' + clean];
    var base = clean.split('/').pop();
    if (base) {
      var noExt = base.replace(/\\.[a-z0-9]+$/i, '');
      if (ASSETS['/assets/' + noExt]) return ASSETS['/assets/' + noExt];
      if (ASSETS[base]) return ASSETS[base];
    }
    return null;
  }

  function applyAssetsAndFallbacks() {
    document.querySelectorAll('img').forEach(function(img) {
      var rawSrc = img.getAttribute('src') || '';
      var resolved = resolveAssetSrc(rawSrc);
      if (resolved && img.src !== resolved) {
        img.src = resolved;
      }
      if (!img.dataset.aivoraBound) {
        img.dataset.aivoraBound = '1';
        img.addEventListener('error', function() {
          if (img.dataset.fallbackApplied) return;
          img.dataset.fallbackApplied = '1';
          var label = (img.alt || 'Visual Asset').slice(0, 32);
          var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">' +
            '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
            '<stop offset="0%" stop-color="#e2e8f0"/><stop offset="100%" stop-color="#cbd5e1"/></linearGradient></defs>' +
            '<rect width="600" height="400" fill="url(#g)"/>' +
            '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#475569" font-family="sans-serif" font-size="18">' +
            label.replace(/[<>&"']/g, '') + '</text></svg>';
          img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
        });
      }
    });
    document.querySelectorAll('a[href]').forEach(function(a) {
      var href = a.getAttribute('href') || '';
      if (href && !href.startsWith('#') && !a.dataset.aivoraNav) {
        a.dataset.aivoraNav = '1';
        a.addEventListener('click', function(e) { e.preventDefault(); });
      }
    });
  }

  var obs = new MutationObserver(applyAssetsAndFallbacks);
  if (document.body) {
    obs.observe(document.body, { childList: true, subtree: true });
    applyAssetsAndFallbacks();
  } else {
    document.addEventListener('DOMContentLoaded', function() {
      obs.observe(document.body, { childList: true, subtree: true });
      applyAssetsAndFallbacks();
    });
  }
})();
`;

function buildBootstrapShimCss(): string {
  return `
  *, *::before, *::after { box-sizing: border-box; }
  body { margin: 0; font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; color: #0f172a; line-height: 1.5; }
  .container { width: 100%; max-width: 1200px; margin-inline: auto; padding-inline: 1rem; }
  .container-fluid { width: 100%; padding-inline: 1rem; }
  .row { display: flex; flex-wrap: wrap; margin-inline: -0.75rem; }
  .row > * { padding-inline: 0.75rem; flex: 1 0 0%; }
  .col-12 { flex: 0 0 auto; width: 100%; }
  @media (min-width: 768px) {
    .col-md-3 { flex: 0 0 auto; width: 25%; }
    .col-md-4 { flex: 0 0 auto; width: 33.3333%; }
    .col-md-6 { flex: 0 0 auto; width: 50%; }
    .col-md-8 { flex: 0 0 auto; width: 66.6667%; }
    .col-md-12 { flex: 0 0 auto; width: 100%; }
  }
  @media (min-width: 992px) {
    .col-lg-3 { flex: 0 0 auto; width: 25%; }
    .col-lg-4 { flex: 0 0 auto; width: 33.3333%; }
    .col-lg-6 { flex: 0 0 auto; width: 50%; }
    .col-lg-8 { flex: 0 0 auto; width: 66.6667%; }
  }
  .d-flex { display: flex !important; }
  .d-grid { display: grid !important; }
  .d-none { display: none !important; }
  .justify-content-between { justify-content: space-between; }
  .justify-content-center { justify-content: center; }
  .align-items-center { align-items: center; }
  .gap-2 { gap: 0.5rem; } .gap-3 { gap: 1rem; } .gap-4 { gap: 1.5rem; }
  .p-3 { padding: 1rem; } .p-4 { padding: 1.5rem; } .py-3 { padding-block: 1rem; } .py-4 { padding-block: 1.5rem; } .py-5 { padding-block: 3rem; }
  .mb-2 { margin-bottom: 0.5rem; } .mb-3 { margin-bottom: 1rem; } .mb-4 { margin-bottom: 1.5rem; }
  .btn { display: inline-flex; align-items: center; justify-content: center; padding: 0.5rem 1rem; border-radius: 0.375rem; font-weight: 500; cursor: pointer; border: 1px solid transparent; text-decoration: none; }
  .btn-primary { background: #2563eb; color: #fff; }
  .btn-outline-secondary { border-color: #cbd5e1; color: #334155; background: transparent; }
  .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 0.75rem; overflow: hidden; }
  .card-body { padding: 1.25rem; }
  .navbar { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; }
  .navbar-nav { display: flex; list-style: none; gap: 1.25rem; margin: 0; padding: 0; }
  .nav-link { text-decoration: none; color: inherit; }
  .form-control { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 0.375rem; }
  .badge { display: inline-block; padding: 0.2rem 0.5rem; font-size: 0.75rem; border-radius: 999px; }
  .img-fluid { max-width: 100%; height: auto; }
  .rounded { border-radius: 0.375rem; } .rounded-3 { border-radius: 0.75rem; }
  .shadow-sm { box-shadow: 0 1px 2px rgba(15,23,42,0.06); }
  .text-center { text-align: center; } .fw-bold { font-weight: 700; } .fw-semibold { font-weight: 600; }
  `;
}

function wrapHtmlDocument(params: {
  headCss: string;
  bodyHtml: string;
  bodyScript: string;
  assetMapJson: string;
}): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; font-family: "DM Sans", system-ui, -apple-system, sans-serif; }
    ${params.headCss}
  </style>
</head>
<body>
  ${params.bodyHtml}
  <script>${escapeHtmlScript(BASE_PREVIEW_SAFE_SCRIPT(params.assetMapJson))}</script>
  ${params.bodyScript ? `<script type="module">${escapeHtmlScript(params.bodyScript)}</script>` : ''}
</body>
</html>`;
}

async function compileHtmlStackPreview(
  files: GeneratedFile[],
  framework: FrameworkId,
  assets: BrandAssetInput[]
): Promise<{ html: string; errors: string[] }> {
  const indexHtmlFile = files.find((f) => f.path === 'index.html' || f.path.endsWith('/index.html'));
  const cssFiles = files.filter((f) => f.path.endsWith('.css'));
  const jsFiles = files.filter((f) => f.path.endsWith('.js') || f.path.endsWith('.ts'));

  const extraCss = [
    framework === 'bootstrap' ? buildBootstrapShimCss() : '',
    ...cssFiles.map((c) => c.content),
  ].join('\n');

  let bodyHtml = indexHtmlFile?.content ?? '<main><h1>No index.html found</h1></main>';
  const bodyMatch = /<body[^>]*>([\s\S]*?)<\/body>/i.exec(bodyHtml);
  if (bodyMatch) {
    bodyHtml = bodyMatch[1];
  }
  // Remove external script/link tags referencing local files so we inline them safely
  bodyHtml = bodyHtml
    .replace(/<script\b[^>]*src=["'][^"']+["'][^>]*><\/script>/gi, '')
    .replace(/<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi, '');

  const errors: string[] = [];
  const transformedJs: string[] = [];
  for (const jf of jsFiles) {
    try {
      const res = await esbuild.transform(jf.content, {
        loader: jf.path.endsWith('.ts') ? 'ts' : 'js',
        sourcefile: jf.path,
      });
      transformedJs.push(res.code);
    } catch (err) {
      errors.push(err instanceof Error ? err.message : `Syntax error in ${jf.path}`);
    }
  }

  const html = wrapHtmlDocument({
    headCss: extraCss,
    bodyHtml,
    bodyScript: transformedJs.join('\n'),
    assetMapJson: buildAssetMapJson(assets),
  });

  return { html, errors };
}

function buildVuePreviewHtml(
  files: GeneratedFile[],
  assets: BrandAssetInput[],
  compiledTailwindCss: string
): { html: string; errors: string[] } {
  const appVue = files.find((f) => f.path === 'src/App.vue') ?? files.find((f) => f.path.endsWith('.vue'));
  if (!appVue) {
    return {
      html: wrapHtmlDocument({
        headCss: '',
        bodyHtml: '<div style="padding:24px;font-family:sans-serif">No App.vue entry file found.</div>',
        bodyScript: '',
        assetMapJson: buildAssetMapJson(assets),
      }),
      errors: ['No App.vue entry file found.'],
    };
  }

  // Extract styles from all .vue and .css files
  const allStyles: string[] = [compiledTailwindCss];
  const componentTemplates: Record<string, string> = {};

  for (const f of files) {
    if (f.path.endsWith('.css')) {
      allStyles.push(f.content);
    } else if (f.path.endsWith('.vue')) {
      const styleMatches = [...f.content.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)];
      for (const sm of styleMatches) {
        allStyles.push(sm[1]);
      }
      const tmplMatch = /<template[^>]*>([\s\S]*?)<\/template>/i.exec(f.content);
      if (tmplMatch) {
        const compName = path.basename(f.path, '.vue');
        componentTemplates[compName] = tmplMatch[1];
      }
    }
  }

  // Recursively expand child Vue component tags inside App.vue template for faithful static + interactive preview
  let rootMarkup = componentTemplates['App'] ?? '';
  for (let pass = 0; pass < 4; pass++) {
    let changed = false;
    for (const [compName, tmpl] of Object.entries(componentTemplates)) {
      if (compName === 'App') continue;
      const selfClosing = new RegExp(`<${compName}\\b[^>]*/>`, 'g');
      const paired = new RegExp(`<${compName}\\b[^>]*>[\\s\\S]*?</${compName}>`, 'g');
      if (selfClosing.test(rootMarkup) || paired.test(rootMarkup)) {
        rootMarkup = rootMarkup.replace(selfClosing, tmpl).replace(paired, tmpl);
        changed = true;
      }
    }
    if (!changed) break;
  }

  // Strip Vue directive attributes that don't render cleanly in raw HTML fallback
  rootMarkup = rootMarkup
    .replace(/\s+v-(?:for|if|else-if|else|model|show)=["'][^"']*["']/g, '')
    .replace(/\s+@(?:click|submit|change|input)(?:\.[a-z]+)*=["'][^"']*["']/g, '')
    .replace(/\s+:[a-zA-Z0-9_-]+=["'][^"']*["']/g, '')
    .replace(/\{\{[^}]+\}\}/g, '');

  const html = wrapHtmlDocument({
    headCss: allStyles.join('\n'),
    bodyHtml: `<div id="app">${rootMarkup}</div>`,
    bodyScript: '',
    assetMapJson: buildAssetMapJson(assets),
  });

  return { html, errors: [] };
}

export async function compilePreviewBundle(params: {
  files: GeneratedFile[];
  framework: FrameworkId;
  assets?: BrandAssetInput[];
}): Promise<PreviewCompileResponse> {
  const { files, framework, assets = [] } = params;
  const qualityReport = await analyzeCodeQuality(files, framework);

  if (framework === 'html_css_js' || framework === 'bootstrap') {
    const { html, errors } = await compileHtmlStackPreview(files, framework, assets);
    return {
      previewHtml: html,
      errors: [...errors, ...qualityReport.compilationErrors],
      qualityReport,
    };
  }

  // Compile Tailwind utilities if Tailwind classes are present
  let tailwindCss = '';
  try {
    const candidates = extractTailwindCandidates(files);
    tailwindCss = await compileTailwindCandidates(candidates);
  } catch {
    tailwindCss = '';
  }

  if (framework === 'vue') {
    const { html, errors } = buildVuePreviewHtml(files, assets, tailwindCss);
    return {
      previewHtml: html,
      errors: [...errors, ...qualityReport.compilationErrors],
      qualityReport,
    };
  }

  // React / Next.js bundling via esbuild with local node_modules + virtual generated files
  const fileMap = new Map<string, GeneratedFile>();
  for (const f of files) {
    fileMap.set(f.path.replace(/^\/+/, ''), f);
  }

  const entryCandidates = [
    'src/app/page.tsx',
    'src/app/page.jsx',
    'app/page.tsx',
    'app/page.jsx',
    'src/App.tsx',
    'src/App.jsx',
  ];
  const entryPath = entryCandidates.find((p) => fileMap.has(p));

  if (!entryPath) {
    const fallback = wrapHtmlDocument({
      headCss: tailwindCss,
      bodyHtml: '<div style="padding:24px;color:#b91c1c;font-family:sans-serif">Entry file (src/App.tsx or src/app/page.tsx) not found.</div>',
      bodyScript: '',
      assetMapJson: buildAssetMapJson(assets),
    });
    return {
      previewHtml: fallback,
      errors: ['Entry file (src/App.tsx or src/app/page.tsx) not found.'],
      qualityReport,
    };
  }

  const collectedCss: string[] = [tailwindCss];
  for (const f of files) {
    if (f.path.endsWith('.css')) {
      // Strip utility directives after compiling the project's Tailwind classes.
      const cleanedCss = f.content
        .replace(/@import\s+["']tailwindcss["']\s*;?/g, '')
        .replace(/@tailwind\s+[a-z]+\s*;?/g, '');
      collectedCss.push(cleanedCss);
    }
  }

  const virtualEntryCode = `
import React from 'react';
import { createRoot } from 'react-dom/client';
import EntryComponent from './${entryPath}';

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(
    React.createElement(React.StrictMode, null, React.createElement(EntryComponent))
  );
}
`;

  const errors: string[] = [];
  let bundledJs = '';

  try {
    const result = await esbuild.build({
      stdin: {
        contents: virtualEntryCode,
        resolveDir: process.cwd(),
        loader: 'tsx',
        sourcefile: '__preview_entry__.tsx',
      },
      bundle: true,
      write: false,
      format: 'esm',
      jsx: 'automatic',
      platform: 'browser',
      logLevel: 'silent',
      define: {
        'process.env.NODE_ENV': '"production"',
      },
      plugins: [
        {
          name: 'aivora-preview-bundler',
          setup(build) {
            build.onResolve({ filter: /^next\/image$/ }, () => ({
              path: 'next/image',
              namespace: 'aivora-next-image',
            }));
            build.onResolve({ filter: /^next\/link$/ }, () => ({
              path: 'next/link',
              namespace: 'aivora-next-link',
            }));
            build.onResolve({ filter: /^next\/navigation$/ }, () => ({
              path: 'next/navigation',
              namespace: 'aivora-next-nav',
            }));

            build.onResolve({ filter: /.*/ }, (args) => {
              // Virtual entry resolving entryPath
              if (args.importer === '__preview_entry__.tsx' || args.importer.endsWith('__preview_entry__.tsx')) {
                const clean = args.path.replace(/^\.\//, '');
                if (fileMap.has(clean)) {
                  return { path: clean, namespace: 'aivora-vfs' };
                }
              }

              if (args.namespace === 'aivora-vfs' && (args.path.startsWith('.') || args.path.startsWith('@/'))) {
                const resolved = resolveVirtualImport(args.importer, args.path, fileMap);
                if (!resolved) {
                  return {
                    errors: [{ text: `Cannot resolve "${args.path}" from "${args.importer}"` }],
                  };
                }
                if (resolved.endsWith('.module.css')) {
                  return { path: resolved, namespace: 'aivora-css-module' };
                }
                if (resolved.endsWith('.css')) {
                  return { path: resolved, namespace: 'aivora-css-plain' };
                }
                return { path: resolved, namespace: 'aivora-vfs' };
              }

              return undefined;
            });

            build.onLoad({ filter: /.*/, namespace: 'aivora-next-image' }, () => ({
              contents: `${NEXT_SHIMS}\nexport { ImageShim as default };`,
              loader: 'js',
              resolveDir: process.cwd(),
            }));
            build.onLoad({ filter: /.*/, namespace: 'aivora-next-link' }, () => ({
              contents: `${NEXT_SHIMS}\nexport { LinkShim as default };`,
              loader: 'js',
              resolveDir: process.cwd(),
            }));
            build.onLoad({ filter: /.*/, namespace: 'aivora-next-nav' }, () => ({
              contents: NEXT_SHIMS,
              loader: 'js',
              resolveDir: process.cwd(),
            }));

            build.onLoad({ filter: /.*/, namespace: 'aivora-css-plain' }, () => ({
              contents: 'export default {};',
              loader: 'js',
            }));
            build.onLoad({ filter: /.*/, namespace: 'aivora-css-module' }, (args) => {
              const file = fileMap.get(args.path);
              const classMap = file ? parseCssModuleClassMap(file.content) : {};
              return {
                contents: `export default ${JSON.stringify(classMap)};`,
                loader: 'js',
              };
            });

            build.onLoad({ filter: /.*/, namespace: 'aivora-vfs' }, (args) => {
              const file = fileMap.get(args.path);
              if (!file) {
                return { errors: [{ text: `File not found: ${args.path}` }] };
              }
              const loader = args.path.endsWith('.tsx')
                ? 'tsx'
                : args.path.endsWith('.ts')
                  ? 'ts'
                  : args.path.endsWith('.jsx')
                    ? 'jsx'
                    : args.path.endsWith('.json')
                      ? 'json'
                      : 'js';
              return {
                contents: file.content,
                loader,
                resolveDir: process.cwd(),
              };
            });
          },
        },
      ],
    });

    bundledJs = result.outputFiles?.[0]?.text ?? '';
  } catch (err: unknown) {
    const buildErr = err as { errors?: Array<{ text: string; location?: { file?: string; line?: number } }> };
    if (Array.isArray(buildErr?.errors) && buildErr.errors.length > 0) {
      for (const e of buildErr.errors) {
        const loc = e.location?.file ? `${e.location.file}:${e.location.line ?? 1} — ` : '';
        errors.push(`${loc}${e.text}`);
      }
    } else if (err instanceof Error) {
      errors.push(err.message);
    }
  }

  const runtimeErrorBanner = `
  <div id="root"></div>
  <div id="aivora-runtime-error" style="display:none;padding:16px;margin:16px;border-radius:8px;border:1px solid #fecaca;background:#fef2f2;color:#991b1b;font-family:monospace;font-size:13px;"></div>
  <script>
    window.addEventListener('error', function(e) {
      var box = document.getElementById('aivora-runtime-error');
      if (box) { box.style.display = 'block'; box.textContent = 'Preview Runtime Error: ' + (e.message || 'Unknown error'); }
    });
  </script>
  `;

  const previewHtml = wrapHtmlDocument({
    headCss: collectedCss.join('\n'),
    bodyHtml: runtimeErrorBanner,
    bodyScript: bundledJs,
    assetMapJson: buildAssetMapJson(assets),
  });

  return {
    previewHtml,
    errors,
    qualityReport,
  };
}
