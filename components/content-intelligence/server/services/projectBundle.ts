import JSZip from 'jszip';
import fs from 'node:fs/promises';
import path from 'node:path';

const EXCLUDED_DIRS = new Set(['node_modules', 'dist', '.git', '.next', '.turbo', '.cache', 'coverage']);
const EXCLUDED_FILES = new Set(['.env', '.env.local', '.env.production', '.env.development', '.DS_Store', 'bun.lock', 'package-lock.json', 'yarn.lock']);
const EXCLUDED_EXTENSIONS = new Set(['.pem', '.key', '.p12', '.pfx', '.crt', '.secret']);

async function walkDirectory(rootDir: string, currentDir: string, zip: JSZip): Promise<number> {
  let fileCount = 0;
  const entries = await fs.readdir(currentDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (EXCLUDED_DIRS.has(entry.name) || entry.name.startsWith('.aistudio')) continue;
      fileCount += await walkDirectory(rootDir, path.resolve(currentDir, entry.name), zip);
      continue;
    }

    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name).toLowerCase();
    if (EXCLUDED_FILES.has(entry.name) || entry.name.startsWith('.env.') || EXCLUDED_EXTENSIONS.has(ext)) continue;

    const absolutePath = path.resolve(currentDir, entry.name);
    if (!absolutePath.startsWith(rootDir + path.sep)) continue;

    const stat = await fs.stat(absolutePath);
    if (stat.size > 2 * 1024 * 1024) continue;

    const relativePath = path.relative(rootDir, absolutePath).split(path.sep).join('/');
    zip.file(relativePath, await fs.readFile(absolutePath));
    fileCount += 1;
  }

  return fileCount;
}

export async function buildProjectZipBuffer(): Promise<{ buffer: Buffer; fileCount: number }> {
  const rootDir = path.resolve(process.cwd());
  const zip = new JSZip();
  const fileCount = await walkDirectory(rootDir, rootDir, zip);
  const buffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
  return { buffer, fileCount };
}
