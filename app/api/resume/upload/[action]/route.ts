import mammoth from "mammoth";
import { GoogleGenAI } from "@google/genai";
import { getDocumentProxy, extractText } from "unpdf";
import { RESUME_JSON_SCHEMA } from "@/components/resume-builder/resume-schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MAX_BYTES = 5 * 1024 * 1024;
const limited = new Map<string, number[]>();
const error = (message: string, status = 400) => Response.json({ error: message }, { status });

export async function POST(request: Request, context: { params: { action: string } }) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now(); const hits = (limited.get(ip) || []).filter((at) => at > now - 60_000);
  if (hits.length >= 15) return error("Upload limit reached. Wait a minute and try again.", 429);
  hits.push(now); limited.set(ip, hits);
  if (Number(request.headers.get("content-length") || 0) > MAX_BYTES + 100_000) return error("File exceeds the 5 MB size limit.", 413);
  try {
    const form = await request.formData(); const file = form.get("file");
    if (!(file instanceof File) || !file.size) return error("Choose a file to continue.");
    if (file.size > MAX_BYTES) return error("File exceeds the 5 MB size limit.", 413);
    const name = file.name.toLowerCase(); const bytes = Buffer.from(await file.arrayBuffer());
    const pdf = name.endsWith(".pdf") && bytes.subarray(0, 5).toString("ascii") === "%PDF-";
    const docx = name.endsWith(".docx") && bytes[0] === 0x50 && bytes[1] === 0x4b;
    const txt = name.endsWith(".txt");
    if (!pdf && !docx && !(context.params.action === "extract-text" && txt)) return error("Upload a valid PDF or DOCX resume; job description text can also be TXT.");
    if (context.params.action === "extract-text") {
      let text = "";
      if (txt) text = bytes.toString("utf8");
      else if (docx) text = (await mammoth.extractRawText({ buffer: bytes })).value || "";
      else {
        const document = await getDocumentProxy(new Uint8Array(bytes));
        try { const result = await extractText(document, { mergePages: true }); text = Array.isArray(result.text) ? result.text.join("\n\n") : result.text || ""; }
        finally { await document.destroy(); }
      }
      text = text.replace(/\u0000/g, "").replace(/\n{3,}/g, "\n\n").trim().slice(0, 25000);
      return text ? Response.json({ text }) : error("No readable text was found in this file.", 422);
    }
    if (context.params.action !== "parse-resume") return error("Unknown resume upload action.", 404);
    if (!process.env.GEMINI_API_KEY) return error("Resume parsing requires GEMINI_API_KEY configured on the server.", 503);
    let contents: string | { parts: Array<{ inlineData?: { mimeType: string; data: string }; text?: string }> };
    const instructions = `Extract all factual information into the provided resume structure. ${form.get("enhance") !== "false" ? "Improve clarity and ATS wording without changing facts." : "Do not rewrite facts."} Never invent employers, dates, degrees, metrics, or skills. Optional job description: ${String(form.get("targetJobDescription") || "").slice(0, 5000)}`;
    if (docx) {
      const raw = (await mammoth.extractRawText({ buffer: bytes })).value.trim();
      if (!raw) return error("Could not extract readable text from the DOCX file.", 422);
      contents = `${instructions}\nRESUME:\n${raw.slice(0, 30000)}`;
    } else contents = { parts: [{ inlineData: { mimeType: "application/pdf", data: bytes.toString("base64") } }, { text: `${instructions}\nParse the attached resume.` }] };
    const response = await new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }).models.generateContent({ model: "gemini-2.5-flash", contents, config: { responseMimeType: "application/json", responseSchema: RESUME_JSON_SCHEMA, systemInstruction: instructions } });
    return Response.json({ resume: JSON.parse(response.text || "{}") });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Upload processing failed.";
    const status = /429|quota|RESOURCE_EXHAUSTED/i.test(message) ? 429 : /API_KEY_INVALID|PERMISSION_DENIED/i.test(message) ? 503 : 422;
    return error(status === 429 ? "Gemini quota reached. Please try again later." : status === 503 ? "The server AI key is invalid or lacks permission." : "Could not process this document. Check that it is valid and not password-protected.", status);
  }
}
