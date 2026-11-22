import { GoogleGenAI } from "@google/genai";
import { NEWSLETTER_SCHEMA, SUBJECTS_SCHEMA, REWRITE_SCHEMA, type GenerateRequestBody } from "@/components/newsletter/services/schemas";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MODEL = "gemini-2.5-flash";
const buckets = new Map<string, number[]>();
function limited(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now(); const recent = (buckets.get(ip) || []).filter(t => t > now - 60_000);
  if (recent.length >= 12) { buckets.set(ip, recent); return true; }
  recent.push(now); buckets.set(ip, recent); return false;
}
function errorResponse(error: unknown) {
  const msg = error instanceof Error ? error.message : String(error);
  if (!process.env.GEMINI_API_KEY) return Response.json({error:"AI service is not configured. Add GEMINI_API_KEY to the server environment."},{status:503});
  if (/PERMISSION_DENIED|API_KEY_INVALID|\b403\b/i.test(msg)) return Response.json({error:"The configured Gemini API key was rejected or lacks permission."},{status:403});
  if (/RESOURCE_EXHAUSTED|\b429\b/i.test(msg)) return Response.json({error:"Gemini quota reached. Wait a moment and try again."},{status:429});
  console.error("Newsletter AI request failed:", msg);
  return Response.json({error:"Unable to complete the newsletter request right now. Please try again."},{status:500});
}
function getClient() { return new GoogleGenAI({apiKey:process.env.GEMINI_API_KEY || "missing-key"}); }
async function bodyOf(request: Request): Promise<Record<string, any> | null> {
  const size = Number(request.headers.get("content-length") || 0);
  if (size > 64_000) return null;
  try { const body=await request.json(); return body && typeof body === "object" ? body : null; } catch { return null; }
}
export async function POST(request: Request, context: {params:{action:string}}) {
  if (limited(request)) return Response.json({error:"Too many newsletter requests. Please wait a minute and try again."},{status:429});
  const body=await bodyOf(request); if(!body) return Response.json({error:"Invalid or oversized request body."},{status:400});
  const action=context.params.action;
  if(action==="generate") {
    const topic=typeof body.topic==="string"?body.topic.trim().slice(0,1200):"";
    if(topic.length<3) return Response.json({error:"Please provide a newsletter topic or brief (at least 3 characters)."},{status:400});
    if(!process.env.GEMINI_API_KEY) return errorResponse(new Error("missing key"));
    try {
      const b=body as GenerateRequestBody;
      const formats:Record<string,string>={essay:"Long-Form Editorial Essay (thoughtful narrative arc, drop-cap lead, clear subheadings)",digest:"Weekly Curated Digest (crisp intro, structured curated links with commentary, concise closing)",product:"Product & Studio Update (headline summary, release highlights, concrete improvements, clear CTA)",letter:"Personal Member Letter (warm direct greeting, candid reflections, unhurried cadence, sign-off)"};
      const tones:Record<string,string>={editorial:"Calm, literary, magazine-grade editorial prose with zero hype",analytical:"Sharp, structured, evidence-oriented, and insightful",warm:"Warm, personal, conversational, written human-to-human",concise:"Crisp, high-signal, scannable, and direct"};
      const lengths:Record<string,string>={short:"Concise 2-minute read (~280-400 words total across 5-7 blocks)",medium:"Balanced 4-minute read (~500-700 words total across 7-10 blocks)",deep:"Substantive 6-minute deep dive (~800-1050 words total across 10-13 blocks)"};
      const requested:string[]=[]; if(b.includeQuote!==false)requested.push('at least one "quote" block');if(b.includeLinks)requested.push('a "links" block with 3 curated items');if(b.includeMetrics)requested.push('a "metrics" block with 3 figures');if(b.includeCallout!==false)requested.push('a "callout" block');if(b.includeCta!==false)requested.push('a closing "button" CTA block');
      const prompt=["Generate a complete, publication-ready email newsletter issue.",`Topic / Brief: ${topic}`,`Format: ${formats[b.format||"essay"]||formats.essay}`,`Target Audience: ${String(b.audience||"Thoughtful general readers").slice(0,200)}`,`Voice & Tone: ${tones[b.tone||"editorial"]||tones.editorial}`,`Target Length: ${lengths[b.length||"medium"]||lengths.medium}`,b.publicationName?`Preferred Publication Name: ${String(b.publicationName).slice(0,100)}`:"Choose a grounded publication name fitting the topic.",b.authorName?`Author / Sender Name: ${String(b.authorName).slice(0,100)}`:"Choose a realistic author or editorial byline.",requested.length?`Include these structural blocks naturally: ${requested.join(", ")}.`:"",b.sourceNotes?`Source notes to incorporate faithfully:\n${String(b.sourceNotes).slice(0,4000)}`:"","Writing rules: avoid generic AI clichés; no emojis or clickbait; subject lines under 55 characters; preheaders add context; URLs must begin with https://."].filter(Boolean).join("\n");
      const response=await getClient().models.generateContent({model:MODEL,contents:prompt,config:{systemInstruction:"You are a senior independent newsletter editor. Return valid JSON matching the schema with crisp, specific editorial prose.",responseMimeType:"application/json",responseSchema:NEWSLETTER_SCHEMA}});
      const text=(response.text||"").trim(); if(!text)throw new Error("The model returned an empty response."); return Response.json(JSON.parse(text));
    } catch(e){return errorResponse(e);}
  }
  if(action==="subjects") {
    const excerpt=String(body.excerpt||body.subject||"").trim().slice(0,3000); if(!excerpt)return Response.json({error:"Add a topic or body content before generating subject lines."},{status:400});if(!process.env.GEMINI_API_KEY)return errorResponse(new Error("missing key"));
    try{const prompt=["Generate 4 distinct, high-craft newsletter subject and preheader pairs.",body.publicationName?`Publication: ${String(body.publicationName).slice(0,100)}`:"",body.audience?`Audience: ${String(body.audience).slice(0,160)}`:"",body.subject?`Current subject: ${String(body.subject).slice(0,140)}`:"",body.preheader?`Current preheader: ${String(body.preheader).slice(0,200)}`:"",`Issue excerpt:\n${excerpt}`,"Rules: subject under 55 characters; preheader 60-95 characters; no emojis, clickbait, or repetition."].filter(Boolean).join("\n");const response=await getClient().models.generateContent({model:MODEL,contents:prompt,config:{systemInstruction:"You are an editorial newsletter strategist. Return 4 crisp, varied subject and preheader options in strict JSON.",responseMimeType:"application/json",responseSchema:SUBJECTS_SCHEMA}});return Response.json(JSON.parse((response.text||'{"options":[]}').trim()));}catch(e){return errorResponse(e);}
  }
  if(action==="rewrite") {
    const text=String(body.text||"").trim().slice(0,3000);if(!text)return Response.json({error:"Block text is empty."},{status:400});if(!process.env.GEMINI_API_KEY)return errorResponse(new Error("missing key"));
    const directions:Record<string,string>={tighten:"Cut filler by 25-35% while keeping every concrete idea.",expand:"Add depth and nuance, roughly 40-60% longer while staying crisp.",warmer:"Use a warmer, more personal voice without becoming cheesy.",sharper:"Use a sharper, analytical tone with strong verbs."};const action=String(body.action||"tighten");
    try{const prompt=[`Issue subject: ${String(body.issueSubject||"Editorial Issue").slice(0,140)}`,`Block type: ${String(body.blockType||"paragraph")}`,`Direction: ${directions[action]||directions.tighten}`,`Original copy:\n${text}`,"Preserve useful markdown in paragraphs; return only prose without clichés or emojis."].join("\n");const response=await getClient().models.generateContent({model:MODEL,contents:prompt,config:{systemInstruction:"You are a careful newsletter copy editor. Return strictly valid JSON.",responseMimeType:"application/json",responseSchema:REWRITE_SCHEMA}});return Response.json(JSON.parse((response.text||"{}").trim()));}catch(e){return errorResponse(e);}
  }
  return Response.json({error:"Unknown newsletter action."},{status:404});
}
