import type {
  ContentAnalysisResponse,
  ContextualRewriteProfile,
  CrawlMode,
  ObjectiveTextMetrics,
  RewriteRequest,
  RewriteResponse,
  UsageSnapshot,
  WebsiteAuditReport,
} from '../../types/contentIntelligence';

async function parseJsonOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errMsg = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data?.error) errMsg = data.error;
    } catch {
      const text = await res.text().catch(() => '');
      if (text) errMsg = text.slice(0, 200);
    }
    throw new Error(errMsg);
  }
  return res.json() as Promise<T>;
}

export async function analyzeContentApi(
  text: string,
  profile: ContextualRewriteProfile
): Promise<ContentAnalysisResponse> {
  const res = await fetch('/api/content/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, profile }),
  });
  return parseJsonOrThrow<ContentAnalysisResponse>(res);
}

export async function computeMetricsApi(
  text: string,
  primaryKeyword: string,
  secondaryKeywords: string[]
): Promise<{ metrics: ObjectiveTextMetrics }> {
  const res = await fetch('/api/content/metrics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, primaryKeyword, secondaryKeywords }),
  });
  return parseJsonOrThrow<{ metrics: ObjectiveTextMetrics }>(res);
}

export async function uploadDocumentApi(file: File): Promise<{
  fileName: string;
  fileType: string;
  text: string;
  warnings: string[];
}> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch('/api/content/upload', {
    method: 'POST',
    body: formData,
  });
  return parseJsonOrThrow(res);
}

export async function rewriteContentApi(
  payload: RewriteRequest
): Promise<RewriteResponse> {
  const res = await fetch('/api/content/rewrite', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseJsonOrThrow<RewriteResponse>(res);
}

export async function crawlWebsiteAuditApi(options: {
  url: string;
  crawlMode: CrawlMode;
  selectedUrls?: string[];
  maxPages?: number;
  maxDepth?: number;
}): Promise<WebsiteAuditReport> {
  const res = await fetch('/api/content/crawl-audit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options),
  });
  return parseJsonOrThrow<WebsiteAuditReport>(res);
}

export async function fetchUsageSnapshotApi(): Promise<UsageSnapshot> {
  const res = await fetch('/api/content/usage');
  return parseJsonOrThrow<UsageSnapshot>(res);
}

export async function downloadProjectSourceZipApi(): Promise<void> {
  const res = await fetch('/api/content/export-source');
  if (!res.ok) {
    let errMsg = 'Source download failed.';
    try {
      const data = await res.json();
      if (data?.error) errMsg = data.error;
    } catch {
      // ignore
    }
    throw new Error(errMsg);
  }

  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = 'ai-content-intelligence-source.zip';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

export async function downloadExportApi(payload: {
  kind: 'original' | 'improved' | 'full_report';
  format: 'txt' | 'docx' | 'pdf';
  originalText: string;
  improvedText: string;
  analysis?: ContentAnalysisResponse | null;
  documentTitle?: string;
}): Promise<void> {
  const res = await fetch('/api/content/export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let errMsg = `Export failed (${res.status})`;
    try {
      const data = await res.json();
      if (data?.error) errMsg = data.error;
    } catch {
      // ignore
    }
    throw new Error(errMsg);
  }

  const blob = await res.blob();
  const disposition = res.headers.get('Content-Disposition') || '';
  const match = disposition.match(/filename="([^"]+)"/);
  const fileName = match?.[1] || `content-intelligence-${payload.kind}.${payload.format}`;

  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

