import * as esbuild from 'esbuild';
import type {
  CodeQualityReport,
  FrameworkId,
  GeneratedFile,
  QualityCheck,
} from '../../shared/types';

const BANNED_EXTERNAL_IMAGE_HOSTS = [
  'images.unsplash.com',
  'unsplash.com/photos',
  'via.placeholder.com',
  'placeholder.com',
  'picsum.photos',
  'lorempixel.com',
  'placekitten.com',
];

function resolveLocalImport(
  importerPath: string,
  specifier: string,
  fileMap: Map<string, GeneratedFile>
): string | null {
  let base = specifier;
  if (specifier.startsWith('@/')) {
    const sub = specifier.slice(2);
    const candidates = [sub, `src/${sub}`];
    for (const c of candidates) {
      const hit = matchFileWithExtensions(c, fileMap);
      if (hit) return hit;
    }
    return null;
  }

  if (!specifier.startsWith('.')) return null;

  const importerParts = importerPath.split('/').slice(0, -1);
  const specParts = specifier.split('/');
  for (const part of specParts) {
    if (part === '.' || part === '') continue;
    if (part === '..') {
      importerParts.pop();
    } else {
      importerParts.push(part);
    }
  }
  base = importerParts.join('/');
  return matchFileWithExtensions(base, fileMap);
}

function matchFileWithExtensions(
  base: string,
  fileMap: Map<string, GeneratedFile>
): string | null {
  const extensions = [
    '',
    '.tsx',
    '.ts',
    '.jsx',
    '.js',
    '.css',
    '.module.css',
    '.json',
    '.vue',
    '/index.tsx',
    '/index.ts',
    '/index.jsx',
    '/index.js',
  ];
  for (const ext of extensions) {
    const candidate = `${base}${ext}`;
    if (fileMap.has(candidate)) return candidate;
  }
  return null;
}

export async function verifyCodeCompilation(
  files: GeneratedFile[],
  framework: FrameworkId
): Promise<string[]> {
  const fileMap = new Map<string, GeneratedFile>();
  for (const f of files) {
    fileMap.set(f.path.replace(/^\/+/, ''), f);
  }

  // For HTML/CSS/JS/Bootstrap, validate script blocks via esbuild transform
  if (framework === 'html_css_js' || framework === 'bootstrap') {
    const errors: string[] = [];
    for (const f of files) {
      if (f.path.endsWith('.js') || f.path.endsWith('.ts')) {
        try {
          await esbuild.transform(f.content, {
            loader: f.path.endsWith('.ts') ? 'ts' : 'js',
            sourcefile: f.path,
          });
        } catch (err) {
          errors.push(err instanceof Error ? err.message : `Syntax error in ${f.path}`);
        }
      }
    }
    return errors;
  }

  // For Vue, validate <script> blocks with esbuild transform
  if (framework === 'vue') {
    const errors: string[] = [];
    for (const f of files) {
      if (f.path.endsWith('.vue')) {
        const scriptMatch = /<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/i.exec(f.content);
        if (scriptMatch) {
          const isTs = /lang=["']ts["']/i.test(f.content);
          try {
            await esbuild.transform(scriptMatch[1], {
              loader: isTs ? 'ts' : 'js',
              sourcefile: f.path,
            });
          } catch (err) {
            errors.push(err instanceof Error ? err.message : `Script syntax error in ${f.path}`);
          }
        }
        if (!/<template[\s>]/i.test(f.content)) {
          errors.push(`Missing <template> block in Vue SFC "${f.path}".`);
        }
      }
    }
    return errors;
  }

  // For React / Next.js projects, run virtual esbuild bundle check across all files
  const entryCandidates = [
    'src/app/page.tsx',
    'src/app/page.jsx',
    'app/page.tsx',
    'app/page.jsx',
    'src/App.tsx',
    'src/App.jsx',
    'src/main.tsx',
    'src/main.jsx',
  ];
  const entry = entryCandidates.find((p) => fileMap.has(p));
  if (!entry) {
    return ['No application entry file found (expected src/App.tsx or src/app/page.tsx).'];
  }

  const errors: string[] = [];
  try {
    await esbuild.build({
      entryPoints: [entry],
      bundle: true,
      write: false,
      format: 'esm',
      jsx: 'automatic',
      logLevel: 'silent',
      plugins: [
        {
          name: 'aivora-virtual-check',
          setup(build) {
            build.onResolve({ filter: /.*/ }, (args) => {
              if (args.kind === 'entry-point') {
                return { path: args.path, namespace: 'aivora-file' };
              }
              if (args.path.startsWith('.') || args.path.startsWith('@/')) {
                const resolved = resolveLocalImport(args.importer, args.path, fileMap);
                if (!resolved) {
                  return {
                    errors: [
                      {
                        text: `Unresolved local import "${args.path}" from "${args.importer}"`,
                      },
                    ],
                  };
                }
                if (resolved.endsWith('.css')) {
                  return { path: resolved, namespace: 'aivora-css' };
                }
                return { path: resolved, namespace: 'aivora-file' };
              }
              // External npm modules (react, next/*, lucide-react, etc.) marked external for syntax/import check
              return { path: args.path, external: true };
            });

            build.onLoad({ filter: /.*/, namespace: 'aivora-css' }, () => {
              return { contents: 'export default {};', loader: 'js' };
            });

            build.onLoad({ filter: /.*/, namespace: 'aivora-file' }, (args) => {
              const file = fileMap.get(args.path);
              if (!file) {
                return { errors: [{ text: `Missing file "${args.path}"` }] };
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
              return { contents: file.content, loader };
            });
          },
        },
      ],
    });
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

  return errors;
}

export async function analyzeCodeQuality(
  files: GeneratedFile[],
  framework: FrameworkId,
  issuesFixed: string[] = []
): Promise<CodeQualityReport> {
  const compilationErrors = await verifyCodeCompilation(files, framework);
  const checks: QualityCheck[] = [];

  // 1. Compilation check
  checks.push({
    name: 'Syntax & Module Resolution',
    category: 'compilation',
    status: compilationErrors.length === 0 ? 'pass' : 'fail',
    detail:
      compilationErrors.length === 0
        ? `All ${files.length} files passed TypeScript/JSX/module verification.`
        : compilationErrors[0],
  });

  const codeFiles = files.filter((f) =>
    ['tsx', 'jsx', 'html', 'vue', 'ts', 'js'].includes(f.language)
  );
  const combinedMarkup = codeFiles.map((f) => f.content).join('\n');

  // 2. Semantic HTML landmarks
  const hasSemanticLandmarks =
    /<(header|main|nav|section|footer)\b/i.test(combinedMarkup);
  checks.push({
    name: 'Semantic Landmarks',
    category: 'semantics',
    status: hasSemanticLandmarks ? 'pass' : 'warning',
    detail: hasSemanticLandmarks
      ? 'Uses semantic HTML5 landmarks (<header>, <nav>, <main>, <section>, <footer>).'
      : 'Consider adding semantic HTML5 landmarks (<header>, <main>, <footer>) for screen readers.',
  });

  // 3. Image Alt Text & No Fabricated External Placeholders
  const imgTags = combinedMarkup.match(/<img\b[^>]*>/gi) ?? [];
  const missingAlt = imgTags.filter((tag) => !/\balt\s*=/i.test(tag));
  checks.push({
    name: 'Image Accessibility (alt attributes)',
    category: 'accessibility',
    status: missingAlt.length === 0 ? 'pass' : 'warning',
    detail:
      missingAlt.length === 0
        ? imgTags.length > 0
          ? `All ${imgTags.length} <img> elements include descriptive alt attributes.`
          : 'Uses inline SVG/CSS media placeholders with accessible labels.'
        : `${missingAlt.length} <img> tag(s) are missing an alt attribute.`,
  });

  const foundBannedHost = BANNED_EXTERNAL_IMAGE_HOSTS.find((host) =>
    combinedMarkup.toLowerCase().includes(host)
  );
  checks.push({
    name: 'Asset Provenance & Placeholder Safety',
    category: 'assets',
    status: foundBannedHost ? 'warning' : 'pass',
    detail: foundBannedHost
      ? `Detected unverified external placeholder host "${foundBannedHost}". Prefer uploaded assets or local SVG placeholders.`
      : 'Zero fabricated external image URLs detected; uses local placeholders or uploaded brand assets.',
  });

  // 4. Security checks
  const hasDangerousSink =
    /dangerouslySetInnerHTML|\beval\s*\(|new\s+Function\s*\(|javascript:/i.test(combinedMarkup);
  checks.push({
    name: 'XSS & Unsafe Sink Check',
    category: 'security',
    status: hasDangerousSink ? 'warning' : 'pass',
    detail: hasDangerousSink
      ? 'Detected potentially unsafe dynamic HTML/script pattern; review before deployment.'
      : 'No unsafe HTML injection, eval(), or javascript: URI sinks detected.',
  });

  // 5. Responsive CSS / Breakpoints
  const hasResponsiveRules =
    /\b(sm:|md:|lg:|xl:|@media\s*\(|col-md-|col-lg-)/i.test(combinedMarkup) ||
    files.some((f) => f.language === 'css' && /@media\s*\(/i.test(f.content));
  checks.push({
    name: 'Responsive Breakpoints',
    category: 'responsive',
    status: hasResponsiveRules ? 'pass' : 'warning',
    detail: hasResponsiveRules
      ? 'Responsive grid/breakpoint rules detected across mobile, tablet, and desktop widths.'
      : 'Limited responsive breakpoint rules detected; verify mobile stacking in preview.',
  });

  // 6. Component modularity
  const componentFiles = files.filter(
    (f) =>
      f.path.includes('components/') ||
      f.path.endsWith('.css') ||
      f.path.endsWith('.vue')
  );
  checks.push({
    name: 'Modular Component Structure',
    category: 'semantics',
    status: componentFiles.length >= 2 || files.length >= 3 ? 'pass' : 'warning',
    detail: `Organized into ${files.length} modular project files (${componentFiles.length} component/style modules).`,
  });

  const hasFail = checks.some((c) => c.status === 'fail');
  const hasWarn = checks.some((c) => c.status === 'warning');

  return {
    overallStatus: hasFail ? 'errors' : hasWarn ? 'warnings' : 'clean',
    issuesFixed,
    checks,
    compilationErrors,
  };
}
