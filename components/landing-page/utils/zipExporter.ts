import JSZip from 'jszip';
import type { GeneratedLandingPage } from '../types/aivora';
import { generateCodeForFramework } from './codeGenerators';
import { generateDocumentationFiles } from './reportGenerators';

const LANDING_PAGE_ASSETS = [
  'hero_agency_editorial_1795364463495.jpg',
  'hero_ecommerce_product_1795364463582.jpg',
  'hero_saas_workspace_1795364462832.jpg',
  'hero_healthcare_clinic_1795364463489.jpg',
];

export async function buildCompleteProjectZip(page: GeneratedLandingPage): Promise<Blob> {
  const zip = new JSZip();

  const htmlFiles = generateCodeForFramework(page, 'html');
  const reactFiles = generateCodeForFramework(page, 'react-tailwind');
  const nextFiles = generateCodeForFramework(page, 'nextjs-ts');
  const bootstrapFiles = generateCodeForFramework(page, 'bootstrap');
  const docFiles = generateDocumentationFiles(page);

  for (const file of [...htmlFiles, ...reactFiles, ...nextFiles, ...bootstrapFiles, ...docFiles]) {
    if (file.path === 'html/index.html' || file.path === 'bootstrap/index.html') {
      file.content = file.content.replaceAll('/landing-page/assets/', './assets/');
    }
    zip.file(file.path, file.content);
  }

  const assets = await Promise.all(
    LANDING_PAGE_ASSETS.map(async (filename) => {
      const response = await fetch(`/landing-page/assets/${filename}`);
      if (!response.ok) throw new Error(`Could not include required image asset: ${filename}`);
      return { filename, data: await response.arrayBuffer() };
    })
  );
  for (const asset of assets) {
    zip.file(`html/assets/${asset.filename}`, asset.data);
    zip.file(`bootstrap/assets/${asset.filename}`, asset.data);
    zip.file(`react-tailwind/public/landing-page/assets/${asset.filename}`, asset.data);
    zip.file(`nextjs-ts/public/landing-page/assets/${asset.filename}`, asset.data);
  }

  return await zip.generateAsync({ type: 'blob' });
}

export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
