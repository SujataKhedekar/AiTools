import mammoth from "mammoth";
import { getDocumentProxy, extractText } from "unpdf";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const MAX_SOURCE_CHARS = 150_000;
const rateBuckets = new Map<string, number[]>();

function limited(ip: string) {
  const now = Date.now();
  const recent = (rateBuckets.get(ip) ?? []).filter((timestamp) => timestamp > now - 60_000);
  if (recent.length >= 25) { rateBuckets.set(ip, recent); return true; }
  recent.push(now); rateBuckets.set(ip, recent); return false;
}

function cleanText(raw: string) {
  return raw.replace(/\u0000/g, "").replace(/\r\n/g, "\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (limited(ip)) return NextResponse.json({ error: "Too many uploads. Please wait a moment and try again." }, { status: 429 });
  if (Number(request.headers.get("content-length") || 0) > 15 * 1024 * 1024) {
    return NextResponse.json({ error: "Upload request is too large. The file limit is 10 MB." }, { status: 413 });
  }

  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; }
  catch { return NextResponse.json({ error: "Invalid file payload." }, { status: 400 }); }
  const filename = typeof body.filename === "string" ? body.filename.trim() : "";
  const dataBase64 = typeof body.dataBase64 === "string" ? body.dataBase64 : "";
  if (!filename || !dataBase64) return NextResponse.json({ error: "Invalid file payload." }, { status: 400 });

  const extension = path.extname(filename).toLowerCase();
  if (!new Set([".pdf", ".docx", ".txt", ".md"]).has(extension)) {
    return NextResponse.json({ error: "Unsupported file type. Upload a PDF, DOCX, TXT, or MD file." }, { status: 400 });
  }
  const buffer = Buffer.from(dataBase64, "base64");
  if (!buffer.length) return NextResponse.json({ error: "The uploaded file appears to be empty." }, { status: 400 });
  if (buffer.byteLength > MAX_UPLOAD_BYTES) return NextResponse.json({ error: "File exceeds the 10 MB maximum size limit." }, { status: 413 });

  try {
    let extracted = "";
    if (extension === ".txt" || extension === ".md") extracted = buffer.toString("utf8");
    else if (extension === ".docx") extracted = (await mammoth.extractRawText({ buffer })).value ?? "";
    else {
      const pdf = await getDocumentProxy(new Uint8Array(buffer));
      const result = await extractText(pdf, { mergePages: true });
      extracted = Array.isArray(result.text) ? result.text.join("\n\n") : result.text ?? "";
      await pdf.destroy();
    }
    let text = cleanText(extracted);
    if (!text) return NextResponse.json({ error: "No readable text was extracted. Scanned image-only PDFs are not supported." }, { status: 422 });
    if (text.length > MAX_SOURCE_CHARS) text = text.slice(0, MAX_SOURCE_CHARS);
    return NextResponse.json({
      text,
      filename: path.basename(filename),
      mimeType: typeof body.mimeType === "string" ? body.mimeType : "",
      fileSize: buffer.byteLength,
      charCount: text.length,
      wordCount: text.trim().split(/\s+/).length,
    });
  } catch (error) {
    console.error("Summarizer file extraction failed:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Failed to read this document. Check that it is not corrupted or password-protected." }, { status: 422 });
  }
}
