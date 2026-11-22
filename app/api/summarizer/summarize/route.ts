import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import type {
  OutputFeature,
  SummarizationMode,
  SummaryFormat,
  SummaryLength,
  SummaryResult,
  SummaryTone,
} from "@/components/summarizer/types/summarizer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SOURCE_CHARS = 150_000;
const rateBuckets = new Map<string, number[]>();
const lengths: SummaryLength[] = ["Very Short", "Short", "Medium", "Detailed", "Comprehensive"];
const formats: SummaryFormat[] = ["Paragraph", "Bullet Points", "Numbered List", "Key Takeaways", "Executive Summary"];
const tones: SummaryTone[] = ["Professional", "Simple", "Academic", "Casual", "Business", "Technical"];
const modes: SummarizationMode[] = ["General", "Article Summarizer", "Document Summarizer", "Meeting Summarizer", "Research Paper Summarizer", "YouTube Transcript Summarizer", "Academic Summarizer", "Business Summarizer", "Simple Language Summarizer"];
const features: OutputFeature[] = ["Full Summary", "Key Points Extractor", "Important Facts Extractor", "Action Items Generator", "Main Idea Extractor", "Pros and Cons Extractor", "Important Keywords", "Questions and Answers Generator", "Conclusion Generator", "TL;DR Generator"];

function countWords(value: string) { return value.trim() ? value.trim().split(/\s+/).length : 0; }
function limited(ip: string) {
  const now = Date.now();
  const recent = (rateBuckets.get(ip) ?? []).filter((timestamp) => timestamp > now - 60_000);
  if (recent.length >= 25) { rateBuckets.set(ip, recent); return true; }
  recent.push(now); rateBuckets.set(ip, recent); return false;
}
function getClientIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}
function clientError(message: string, status: number) { return NextResponse.json({ error: message }, { status }); }
async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let last: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try { return await fn(); } catch (error) {
      last = error;
      const message = error instanceof Error ? error.message : String(error);
      if (!/503|500|UNAVAILABLE|ECONNRESET|ETIMEDOUT/i.test(message) || attempt === 2) throw error;
      await new Promise((resolve) => setTimeout(resolve, 600 * 2 ** attempt));
    }
  }
  throw last;
}
function responseError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (!process.env.GEMINI_API_KEY) return clientError("AI service is not configured. Add GEMINI_API_KEY to the server environment.", 503);
  if (/API_KEY_INVALID|PERMISSION_DENIED|403/i.test(message)) return clientError("The configured Gemini API key was rejected or lacks permission.", 403);
  if (/RESOURCE_EXHAUSTED|429/i.test(message)) return clientError("AI quota reached. Wait a moment and try again.", 429);
  console.error("Summarizer request failed:", message);
  return clientError("Unable to complete the request right now. Please try again.", 500);
}

const lengthGuidance: Record<SummaryLength, string> = {
  "Very Short": "Extremely concise: 1–2 sentences (about 30–50 words) for prose, or 3 brief points.",
  Short: "Concise: 1 short paragraph (about 60–110 words) and 3–4 crisp key points.",
  Medium: "Balanced: 2–3 cohesive paragraphs (about 140–220 words) and 4–6 structured key points.",
  Detailed: "Thorough: multi-paragraph coverage (about 260–400 words) and 6–8 detailed key points.",
  Comprehensive: "In-depth synthesis preserving nuances, sections, figures, and sub-arguments (about 420–650+ words) with 7–10 thorough key points.",
};
const modeGuidance: Record<SummarizationMode, string> = {
  General: "Identify the central topic, remove redundancy, and distill the core narrative and supporting points.",
  "Article Summarizer": "Capture the thesis, reporting angle, key evidence, and editorial conclusion.",
  "Document Summarizer": "Preserve section structure, definitions, requirements, and quantitative findings.",
  "Meeting Summarizer": "Prioritize discussion topics, decisions, owners, deadlines, and actionable next steps.",
  "Research Paper Summarizer": "Organize objectives, methodology, empirical findings, limitations, and conclusions.",
  "YouTube Transcript Summarizer": "Clean spoken repetition and organize the speaker’s main themes, steps, and takeaways.",
  "Academic Summarizer": "Emphasize concepts, definitions, mechanisms, and study-relevant takeaways.",
  "Business Summarizer": "Focus on strategic impact, KPIs, risks, ROI, decisions, and executive recommendations.",
  "Simple Language Summarizer": "Rewrite dense material in everyday language without changing its factual meaning.",
};
const featureGuidance: Record<OutputFeature, string> = {
  "Full Summary": "Produce a complete structured summary and fill the relevant facts, action items, keywords, Q&A, pros/cons, and conclusion.",
  "Key Points Extractor": "Focus on standalone key points, a brief context summary, and relevant keywords.",
  "Important Facts Extractor": "Extract verifiable facts, dates, entities, metrics, and statistics present in the source.",
  "Action Items Generator": "Extract concrete tasks, next steps, and deliverables, attributing owners only when stated.",
  "Main Idea Extractor": "Distill the single overarching thesis and support it with up to three core points.",
  "Pros and Cons Extractor": "Identify explicitly supported advantages and drawbacks in the source.",
  "Important Keywords": "Extract 8–15 significant terms and concepts from the source.",
  "Questions and Answers Generator": "Generate useful source-grounded questions and accurate answers.",
  "Conclusion Generator": "Synthesize a clear closing statement grounded strictly in the source.",
  "TL;DR Generator": "Produce an ultra-tight 1–3 sentence summary and up to three key points.",
};

export async function POST(request: NextRequest) {
  if (limited(getClientIp(request))) return clientError("Rate limit reached. Please wait a moment before generating another summary.", 429);
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 16 * 1024 * 1024) return clientError("Request is too large. Text input is limited to 150,000 characters.", 413);
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; }
  catch { return clientError("Invalid request body.", 400); }
  const rawText = typeof body.text === "string" ? body.text.trim() : "";
  if (!rawText) return clientError("Please enter or upload text to summarize.", 400);
  if (rawText.length < 20) return clientError("Please provide at least 20 characters of text for a meaningful summary.", 400);
  if (rawText.length > MAX_SOURCE_CHARS) return clientError(`Input exceeds the ${MAX_SOURCE_CHARS.toLocaleString()} character limit.`, 413);

  const length = lengths.includes(body.length as SummaryLength) ? body.length as SummaryLength : "Medium";
  const format = formats.includes(body.format as SummaryFormat) ? body.format as SummaryFormat : "Paragraph";
  const tone = tones.includes(body.tone as SummaryTone) ? body.tone as SummaryTone : "Professional";
  const mode = modes.includes(body.mode as SummarizationMode) ? body.mode as SummarizationMode : "General";
  const feature = features.includes(body.feature as OutputFeature) ? body.feature as OutputFeature : "Full Summary";
  const language = typeof body.language === "string" && body.language.trim() ? body.language.trim().slice(0, 60) : "Auto Detect";
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") return clientError("AI service is not configured. Add GEMINI_API_KEY to the server environment.", 503);

  try {
    const ai = new GoogleGenAI({ apiKey, apiVersion: "v1beta" });
    const languageRule = language === "Auto Detect"
      ? "Detect the primary source language and write the entire output in that language. Return its English name in detectedLanguage."
      : `Write all output in ${language}; detectedLanguage should name the source language.`;
    const systemInstruction = [
      "You are Aivora AI Summarizer, a high-precision text analysis engine.",
      "Use only the supplied text. Never invent facts, context, statistics, quotes, or claims.",
      "Preserve names, dates, numbers, percentages, currencies, and proper nouns accurately.",
      `LENGTH: ${lengthGuidance[length]}`,
      `FORMAT: ${format}. Use a brief framing summary for list formats; use decision-ready key points for executive summaries.`,
      `TONE: ${tone}.`, `MODE: ${mode} — ${modeGuidance[mode]}`,
      `FEATURE: ${feature} — ${featureGuidance[feature]}`, `LANGUAGE: ${languageRule}`,
    ].join("\n");
    const response = await withRetry(() => ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `Analyze and summarize the following source text:\n\n\"\"\"\n${rawText}\n\"\"\"`,
      config: {
        systemInstruction,
        thinkingConfig: { thinkingLevel: length === "Very Short" || length === "Short" ? ThinkingLevel.LOW : ThinkingLevel.MEDIUM },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING }, summary: { type: Type.STRING },
            keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            importantInfo: { type: Type.ARRAY, items: { type: Type.STRING } },
            actionItems: { type: Type.ARRAY, items: { type: Type.STRING } },
            prosAndCons: { type: Type.OBJECT, properties: { pros: { type: Type.ARRAY, items: { type: Type.STRING } }, cons: { type: Type.ARRAY, items: { type: Type.STRING } } } },
            qaPairs: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { question: { type: Type.STRING }, answer: { type: Type.STRING } } } },
            keywords: { type: Type.ARRAY, items: { type: Type.STRING } }, conclusion: { type: Type.STRING }, detectedLanguage: { type: Type.STRING },
          }, required: ["title", "summary", "keyPoints", "keywords", "detectedLanguage"],
        },
      },
    }));
    const rawJson = response.text?.trim();
    if (!rawJson) return clientError("The AI returned an empty response. Please try again.", 502);
    const parsed = JSON.parse(rawJson) as Partial<SummaryResult>;
    const strings = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim())) : [];
    const normalized = {
      title: typeof parsed.title === "string" && parsed.title.trim() ? parsed.title.trim() : "Summary",
      summary: typeof parsed.summary === "string" ? parsed.summary.trim() : "",
      keyPoints: strings(parsed.keyPoints), importantInfo: strings(parsed.importantInfo), actionItems: strings(parsed.actionItems),
      prosAndCons: { pros: strings(parsed.prosAndCons?.pros), cons: strings(parsed.prosAndCons?.cons) },
      qaPairs: Array.isArray(parsed.qaPairs) ? parsed.qaPairs.filter((pair) => pair && typeof pair.question === "string" && typeof pair.answer === "string" && pair.question.trim() && pair.answer.trim()) : [],
      keywords: strings(parsed.keywords), conclusion: typeof parsed.conclusion === "string" ? parsed.conclusion.trim() : "",
      detectedLanguage: typeof parsed.detectedLanguage === "string" && parsed.detectedLanguage.trim() ? parsed.detectedLanguage.trim() : "Unknown",
    };
    const outputText = [normalized.title, normalized.summary, ...normalized.keyPoints, ...normalized.importantInfo, ...normalized.actionItems, ...normalized.prosAndCons.pros, ...normalized.prosAndCons.cons, ...normalized.qaPairs.flatMap((pair) => [pair.question, pair.answer]), normalized.conclusion].filter(Boolean).join(" ");
    const wordCount = countWords(outputText); const sourceWordCount = countWords(rawText);
    const result: SummaryResult = { ...normalized, wordCount, sourceWordCount, readingTimeMinutes: Math.max(1, Math.ceil(wordCount / 200)), compressionPercent: sourceWordCount ? Math.max(0, Math.min(99, Math.round((1 - wordCount / sourceWordCount) * 100))) : 0 };
    return NextResponse.json(result);
  } catch (error) { return responseError(error); }
}
