import { GoogleGenAI, Type } from "@google/genai";
import { RESUME_JSON_SCHEMA } from "@/components/resume-builder/resume-schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const recent = new Map<string, number[]>();
const respond = (error: string, status = 400) => Response.json({ error }, { status });
function guard(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const hits = (recent.get(ip) || []).filter((time) => time > now - 60_000);
  if (hits.length >= 12) return respond("AI request limit reached. Please wait a minute and try again.", 429);
  hits.push(now); recent.set(ip, hits);
  if (!process.env.GEMINI_API_KEY) return respond("Resume AI features require GEMINI_API_KEY configured on the server.", 503);
  return null;
}
function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "AI request failed.";
  const status = /429|quota|RESOURCE_EXHAUSTED/i.test(message) ? 429 : /API_KEY_INVALID|PERMISSION_DENIED/i.test(message) ? 503 : 500;
  return respond(status === 429 ? "Gemini quota reached. Please try again later." : status === 503 ? "The server AI key is invalid or lacks permission." : "The AI request failed. Please try again.", status);
}
const facts = "Use only facts supplied in the resume or user input. Never invent jobs, dates, qualifications, skills, metrics, or achievements. Leave unavailable fields empty.";
const client = () => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(request: Request, context: { params: { action: string } }) {
  const blocked = guard(request); if (blocked) return blocked;
  try {
    const body = await request.json();
    const ai = client();
    const action = context.params.action;
    if (action === "generate-resume") {
      if (!body.input || typeof body.input !== "object") return respond("Invalid resume details.");
      const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: `Create a polished ATS-friendly resume from these user-supplied details. ${facts}\n\n${JSON.stringify(body.input).slice(0, 18000)}`, config: { responseMimeType: "application/json", responseSchema: RESUME_JSON_SCHEMA, systemInstruction: facts } });
      return Response.json({ resume: JSON.parse(response.text || "{}") });
    }
    if (action === "assist") {
      if (typeof body.action !== "string") return respond("Select an AI writing action.");
      if (body.action === "suggest-skills") {
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: `Suggest skills grounded in this resume. Flag anything the user must verify.\n${JSON.stringify(body.context || {}).slice(0, 10000)}`, config: { responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { technical: { type: Type.ARRAY, items: { type: Type.STRING } }, tools: { type: Type.ARRAY, items: { type: Type.STRING } }, soft: { type: Type.ARRAY, items: { type: Type.STRING } }, note: { type: Type.STRING } }, required: ["technical", "tools", "soft", "note"] } } });
        return Response.json({ result: JSON.parse(response.text || "{}") });
      }
      if (body.action === "translate") {
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: `Translate user-facing prose in this resume into ${String(body.targetLanguage || "Spanish").slice(0, 60)}. Preserve proper nouns and return the same JSON structure. ${facts}\n${JSON.stringify(body.context || {}).slice(0, 18000)}`, config: { responseMimeType: "application/json", responseSchema: RESUME_JSON_SCHEMA, systemInstruction: facts } });
        return Response.json({ translatedResume: JSON.parse(response.text || "{}") });
      }
      const instructions: Record<string, string> = { generate: "Draft resume content", rewrite: "Rewrite clearly while preserving facts", professional: "Make the tone professional", shorten: "Shorten concisely", expand: "Clarify using only known facts", "improve-wording": "Improve action verbs", "fix-grammar": "Fix grammar with minimal changes", headline: "Write five resume headlines", "linkedin-summary": "Write a first-person LinkedIn summary", "career-objective": "Write a two-sentence career objective", "tailor-job": "Give grounded job-tailoring suggestions", "tone-adjust": `Adjust tone to ${String(body.targetTone || "executive")}` };
      const prompt = instructions[body.action] || instructions.rewrite;
      const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: `${prompt} for the ${String(body.section || "resume").slice(0, 80)}. Preserve all facts. Return only clean plain text.\nTEXT:\n${String(body.text || "").slice(0, 8000)}\nRESUME CONTEXT:\n${JSON.stringify(body.context || {}).slice(0, 10000)}\nJOB DESCRIPTION:\n${String(body.jobDescription || "").slice(0, 4000)}`, config: { systemInstruction: facts } });
      return Response.json({ suggestion: (response.text || "").trim() });
    }
    if (action === "ats-analyze") {
      if (!body.resume || typeof body.jobDescription !== "string" || body.jobDescription.trim().length < 25) return respond("Add a resume and a job description of at least 25 characters.");
      const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: `Return JSON for an ATS comparison. Include overallScore and keywordMatchPercent (0-100), matchedKeywords, missingKeywords, relevantSkillsFound, recommendedSkillsToVerify, categories (name, score, status, summary), formattingIssues, contactChecks (label, passed, detail), sectionCompleteness (section,status,note), experienceRelevance, readabilitySuggestions, actionableRecommendations (priority,area,recommendation), and disclaimer. Compare only evidence in the resume with the job description; explain score limitations.\nRESUME:${JSON.stringify(body.resume).slice(0, 16000)}\nJOB:${body.jobDescription.slice(0, 9000)}`, config: { responseMimeType: "application/json" } });
      return Response.json({ analysis: JSON.parse(response.text || "{}") });
    }
    if (action === "cover-letter") {
      if (!body.resume || !body.companyName || !body.jobTitle) return respond("Resume, company, and job title are required.");
      const schema = { type: Type.OBJECT, properties: { subjectLine: { type: Type.STRING }, salutation: { type: Type.STRING }, paragraphs: { type: Type.ARRAY, items: { type: Type.STRING } }, signOff: { type: Type.STRING } }, required: ["subjectLine", "salutation", "paragraphs", "signOff"] };
      const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: `Write a tailored cover letter for ${String(body.jobTitle).slice(0, 180)} at ${String(body.companyName).slice(0, 180)}. Tone: ${String(body.tone || "professional")}. Hiring manager: ${String(body.hiringManager || "Hiring Manager").slice(0, 100)}. Job description: ${String(body.jobDescription || "Not provided").slice(0, 5000)}. Ground every claim in the resume.\n${JSON.stringify(body.resume).slice(0, 14000)}`, config: { responseMimeType: "application/json", responseSchema: schema, systemInstruction: facts } });
      return Response.json({ coverLetter: JSON.parse(response.text || "{}") });
    }
    return respond("Unknown resume AI action.", 404);
  } catch (error) { return errorResponse(error); }
}
