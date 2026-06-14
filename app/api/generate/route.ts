import OpenAI from "openai";
import { getTool, type Tool } from "@/lib/tools";

export const runtime = "nodejs";
// Allow long generations (e.g. full blog posts / landing pages).
export const maxDuration = 60;

// Free by default: Groq (OpenAI-compatible, reliable from serverless hosts).
// The API key comes from the USER (sent per-request as a header, "bring your
// own key"); we never store or log it. An optional env GROQ_API_KEY acts as a
// fallback if the site owner wants to provide one.
// Swap providers by setting AI_BASE_URL / AI_MODEL (e.g. Gemini, OpenAI, etc.).
const BASE_URL = process.env.AI_BASE_URL || "https://api.groq.com/openai/v1";
const MODEL = process.env.AI_MODEL || "llama-3.3-70b-versatile";

// Build the user message from whatever fields the tool defines.
function buildUserMessage(tool: Tool, inputs: Record<string, string>) {
  const lines: string[] = [tool.instruction, ""];
  for (const field of tool.fields) {
    const value = (inputs[field.name] ?? "").toString().trim();
    if (value) lines.push(`${field.label}: ${value}`);
  }
  return lines.join("\n");
}

export async function POST(req: Request) {
  // Prefer the user's own key (BYOK); fall back to an optional owner key.
  const userKey = req.headers.get("x-ai-key")?.trim();
  const API_KEY = userKey || process.env.GROQ_API_KEY || process.env.AI_API_KEY;

  if (!API_KEY) {
    return Response.json(
      {
        error:
          "No API key set. Click “API key” at the top and paste your free Groq key from console.groq.com/keys to start.",
      },
      { status: 401 },
    );
  }

  let body: { slug?: string; inputs?: Record<string, string> };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const tool = body.slug ? getTool(body.slug) : undefined;
  if (!tool) {
    return Response.json({ error: "Unknown tool." }, { status: 404 });
  }

  const inputs = body.inputs ?? {};

  // Require any field marked required.
  const missing = tool.fields
    .filter((f) => f.required && !(inputs[f.name] ?? "").toString().trim())
    .map((f) => f.label);
  if (missing.length) {
    return Response.json(
      { error: `Please fill in: ${missing.join(", ")}.` },
      { status: 400 },
    );
  }

  const client = new OpenAI({ apiKey: API_KEY, baseURL: BASE_URL });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const completion = await client.chat.completions.create({
          model: MODEL,
          max_tokens: 4096,
          stream: true,
          messages: [
            { role: "system", content: tool.system },
            { role: "user", content: buildUserMessage(tool, inputs) },
          ],
        });

        for await (const chunk of completion) {
          const delta = chunk.choices[0]?.delta?.content;
          if (delta) controller.enqueue(encoder.encode(delta));
        }
        controller.close();
      } catch (err) {
        let message = "Something went wrong generating the response.";
        if (err instanceof OpenAI.APIError) {
          const detail = (err.message || "").replace(/\s+/g, " ").trim().slice(0, 500);
          if (err.status === 401 || err.status === 403) {
            message = `Your API key was rejected (${err.status}). Open “API key” and check it’s correct and active. ${detail}`;
          } else if (err.status === 429) {
            message = `Rate limit hit (429). ${detail} — free-tier limit; wait a few seconds and try again.`;
          } else {
            message = `AI provider error (${err.status}). ${detail}`;
          }
        }
        controller.enqueue(encoder.encode(`\n\n⚠️ ${message}`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
