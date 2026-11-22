import JSZip from 'jszip';
import type { BrandAssetInput, FrameworkId, GeneratedFile, GenerationOptions } from '../shared/types';

function getMimeExtension(mime: string): string {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  return 'jpg';
}

function buildFallbackPackageJson(options: GenerationOptions): string {
  const isTs = options.language === 'typescript';
  const isNext = options.framework === 'nextjs_tailwind' || options.framework === 'nextjs_app';
  const isVue = options.framework === 'vue';
  const usesTailwind = options.styling === 'tailwind' || options.framework.includes('tailwind');

  if (isNext) {
    return JSON.stringify(
      {
        name: 'aivora-generated-nextjs-app',
        version: '0.1.0',
        private: true,
        scripts: {
          dev: 'next dev',
          build: 'next build',
          start: 'next start',
          lint: 'next lint',
        },
        dependencies: {
          next: '^15.2.0',
          react: '^19.0.0',
          'react-dom': '^19.0.0',
          'lucide-react': '^0.510.0',
        },
        devDependencies: {
          ...(isTs
            ? {
                typescript: '^5.7.0',
                '@types/node': '^22.10.0',
                '@types/react': '^19.0.0',
                '@types/react-dom': '^19.0.0',
              }
            : {}),
          ...(usesTailwind ? { tailwindcss: '^4.0.0', '@tailwindcss/postcss': '^4.0.0' } : {}),
        },
      },
      null,
      2
    );
  }

  if (isVue) {
    return JSON.stringify(
      {
        name: 'aivora-generated-vue-app',
        version: '0.1.0',
        private: true,
        type: 'module',
        scripts: {
          dev: 'vite',
          build: 'vite build',
          preview: 'vite preview',
        },
        dependencies: {
          vue: '^3.5.0',
        },
        devDependencies: {
          '@vitejs/plugin-react': undefined,
          '@vitejs/plugin-vue': '^5.2.0',
          vite: '^6.2.0',
          ...(isTs ? { typescript: '^5.7.0', 'vue-tsc': '^2.2.0' } : {}),
        },
      },
      null,
      2
    );
  }

  return JSON.stringify(
    {
      name: 'aivora-generated-react-app',
      version: '0.1.0',
      private: true,
      type: 'module',
      scripts: {
        dev: 'vite',
        build: 'vite build',
        preview: 'vite preview',
      },
      dependencies: {
        react: '^19.0.0',
        'react-dom': '^19.0.0',
        'lucide-react': '^0.510.0',
      },
      devDependencies: {
        '@vitejs/plugin-react': '^4.3.4',
        vite: '^6.2.0',
        ...(isTs
          ? {
              typescript: '^5.7.0',
              '@types/react': '^19.0.0',
              '@types/react-dom': '^19.0.0',
            }
          : {}),
        ...(usesTailwind ? { tailwindcss: '^4.0.0', '@tailwindcss/vite': '^4.0.0' } : {}),
      },
    },
    null,
    2
  );
}

function buildFallbackTsConfig(framework: FrameworkId): string {
  const isNext = framework === 'nextjs_tailwind' || framework === 'nextjs_app';
  return JSON.stringify(
    {
      compilerOptions: {
        target: 'ES2020',
        lib: ['dom', 'dom.iterable', 'esnext'],
        allowJs: true,
        skipLibCheck: true,
        strict: true,
        noEmit: true,
        esModuleInterop: true,
        module: 'esnext',
        moduleResolution: 'bundler',
        resolveJsonModule: true,
        isolatedModules: true,
        jsx: isNext ? 'preserve' : 'react-jsx',
        paths: {
          '@/*': ['./src/*'],
        },
      },
      include: ['**/*.ts', '**/*.tsx'],
      exclude: ['node_modules'],
    },
    null,
    2
  );
}

function buildFallbackReadme(options: GenerationOptions): string {
  const isStatic = options.framework === 'html_css_js' || options.framework === 'bootstrap';
  if (isStatic) {
    return `# Generated Frontend Project (${options.framework})

Generated with AIVORA Image-to-Code.

## Quick Start
Open \`index.html\` in your browser or serve with any static server:

\`\`\`bash
npx serve .
\`\`\`
`;
  }

  return `# Generated Frontend Project (${options.framework})

Generated with AIVORA Image-to-Code.

## Setup & Local Development

\`\`\`bash
npm install
npm run dev
\`\`\`

## Production Build

\`\`\`bash
npm run build
\`\`\`
`;
}

export async function exportProjectAsZip(params: {
  files: GeneratedFile[];
  assets: BrandAssetInput[];
  options: GenerationOptions;
}): Promise<void> {
  const { files, assets, options } = params;
  const zip = new JSZip();

  const existingPaths = new Set(files.map((f) => f.path));

  for (const file of files) {
    zip.file(file.path, file.content);
  }

  // Ensure runnable scaffolding files exist in the ZIP
  const isStatic = options.framework === 'html_css_js' || options.framework === 'bootstrap';
  if (!isStatic && !existingPaths.has('package.json')) {
    zip.file('package.json', buildFallbackPackageJson(options));
  }
  if (!isStatic && options.language === 'typescript' && !existingPaths.has('tsconfig.json')) {
    zip.file('tsconfig.json', buildFallbackTsConfig(options.framework));
  }
  if (!existingPaths.has('README.md')) {
    zip.file('README.md', buildFallbackReadme(options));
  }

  if (!isStatic && !existingPaths.has('index.html') && options.framework !== 'nextjs_app' && options.framework !== 'nextjs_tailwind') {
    const entryFile = options.framework === 'vue'
      ? '/src/main.ts'
      : options.language === 'typescript'
        ? '/src/main.tsx'
        : '/src/main.jsx';
    zip.file(
      'index.html',
      `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Generated Application</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="${entryFile}"></script>
  </body>
</html>
`
    );
  }

  // Include user-uploaded brand assets in public/assets/
  for (const asset of assets) {
    const ext = getMimeExtension(asset.mimeType);
    zip.file(`public/assets/${asset.label}.${ext}`, asset.base64, { base64: true });
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `aivora-${options.framework}-project.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function downloadSingleFile(file: GeneratedFile): void {
  const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.path.split('/').pop() || 'file.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
