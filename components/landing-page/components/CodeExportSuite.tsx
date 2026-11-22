import React, { useMemo, useState } from 'react';
import { Check, CheckCircle2, Copy, Download, FileCode2, Play, XCircle } from 'lucide-react';
import type {
  CodeFramework,
  GeneratedLandingPage,
  TokenUsageStats,
} from '../types/aivora';
import { generateCodeForFramework } from '../utils/codeGenerators';
import { generateDocumentationFiles } from '../utils/reportGenerators';
import {
  runLandingPageVerification,
  type VerificationCheckResult,
} from '../utils/verificationSuite';
import { buildCompleteProjectZip, triggerBlobDownload } from '../utils/zipExporter';

interface CodeExportSuiteProps {
  page: GeneratedLandingPage;
  tokenUsage: TokenUsageStats | null;
}

export function CodeExportSuite({ page, tokenUsage }: CodeExportSuiteProps) {
  const [viewGroup, setViewGroup] = useState<CodeFramework | 'reports'>('nextjs-ts');
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [verificationResults, setVerificationResults] = useState<
    VerificationCheckResult[] | null
  >(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const files = useMemo(() => {
    if (viewGroup === 'reports') {
      return generateDocumentationFiles(page);
    }
    return generateCodeForFramework(page, viewGroup);
  }, [page, viewGroup]);

  const activeFile = files[selectedFileIndex] || files[0];

  function handleSelectGroup(group: CodeFramework | 'reports') {
    setViewGroup(group);
    setSelectedFileIndex(0);
  }

  function handleCopy() {
    if (!activeFile) return;
    navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function handleDownloadSingle() {
    if (!activeFile) return;
    const blob = new Blob([activeFile.content], { type: 'text/plain;charset=utf-8' });
    const baseName = activeFile.path.split('/').pop() || 'export.txt';
    triggerBlobDownload(blob, baseName);
  }

  async function handleDownloadZip() {
    setIsExportingZip(true);
    try {
      const blob = await buildCompleteProjectZip(page);
      const slug =
        page.brief.businessName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '') || 'aivora-landing-page';
      triggerBlobDownload(blob, `${slug}-aivora-export.zip`);
    } finally {
      setIsExportingZip(false);
    }
  }

  async function handleRunVerification() {
    setIsVerifying(true);
    try {
      const res = await runLandingPageVerification(page);
      setVerificationResults(res);
    } finally {
      setIsVerifying(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            Code Generation &amp; Complete Export Suite
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Modular source code across HTML/CSS/JS, React + Tailwind, Next.js App Router (TypeScript), and Bootstrap 5, plus full strategy, SEO, CTA, and CRO documentation.
          </p>
        </div>

        <button
          type="button"
          disabled={isExportingZip}
          onClick={handleDownloadZip}
          className="inline-flex min-h-[42px] items-center gap-2 rounded-lg bg-blue-700 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Download className="h-4 w-4" />
          <span>{isExportingZip ? 'Building ZIP...' : 'Download Complete ZIP Project'}</span>
        </button>
      </div>

      {/* Stack Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg bg-slate-200/70 p-1">
          {[
            { id: 'nextjs-ts', label: 'Next.js App Router (TS)' },
            { id: 'react-tailwind', label: 'React + Tailwind' },
            { id: 'html', label: 'HTML / CSS / JS' },
            { id: 'bootstrap', label: 'Bootstrap 5' },
            { id: 'reports', label: 'Reports & README' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelectGroup(item.id as CodeFramework | 'reports')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                viewGroup === item.id
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {tokenUsage && (
          <div className="flex items-center gap-3 text-xs text-slate-500 font-mono tabular-nums">
            <span>Requests: {tokenUsage.totalRequests}</span>
            <span aria-hidden="true">·</span>
            <span>Tokens: {tokenUsage.totalTokens.toLocaleString()}</span>
            <span aria-hidden="true">·</span>
            <span>Cache Hits: {tokenUsage.cacheHits}</span>
          </div>
        )}
      </div>

      {/* File Browser & Code Inspector */}
      <div className="grid gap-4 rounded-xl border border-slate-200 bg-white overflow-hidden lg:grid-cols-12">
        <aside className="border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-50 p-3 lg:col-span-3 space-y-1">
          <p className="px-2 py-1 text-[11px] font-semibold text-slate-500">
            Generated Files ({files.length})
          </p>
          {files.map((file, idx) => (
            <button
              key={file.path}
              type="button"
              onClick={() => setSelectedFileIndex(idx)}
              className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-mono transition-colors cursor-pointer ${
                idx === selectedFileIndex
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-700 hover:bg-slate-200/70'
              }`}
            >
              <FileCode2 className="h-3.5 w-3.5 shrink-0 opacity-75" />
              <span className="truncate">{file.path}</span>
            </button>
          ))}
        </aside>

        <div className="flex flex-col lg:col-span-9">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-2.5 bg-white">
            <span className="font-mono text-xs font-semibold text-slate-800 truncate">
              {activeFile?.path}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadSingle}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download File</span>
              </button>
            </div>
          </div>
          <pre className="max-h-[540px] overflow-auto bg-slate-950 p-5 text-xs leading-relaxed text-slate-100">
            <code>{activeFile?.content}</code>
          </pre>
        </div>
      </div>

      {/* Verification Suite Runner */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-950">
              Automated Deliverable &amp; Codegen Verification
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Verify heading structure, JSON-LD syntax, anti-fabrication guards, multi-framework output, and ZIP archive integrity before shipping.
            </p>
          </div>
          <button
            type="button"
            disabled={isVerifying}
            onClick={handleRunVerification}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
          >
            <Play className="h-3.5 w-3.5" />
            <span>{isVerifying ? 'Running Checks...' : 'Run Verification Suite'}</span>
          </button>
        </div>

        {verificationResults && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 pt-2">
            {verificationResults.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-500">{item.category}</span>
                  {item.passed ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600 shrink-0" />
                  )}
                </div>
                <p className="font-semibold text-slate-900">{item.label}</p>
                <p className="text-slate-600">{item.detail}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
