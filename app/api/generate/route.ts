import OpenAI from "openai";
import { getTool, type Tool } from "@/lib/tools";

export const runtime = "nodejs";
// Allow long generations (e.g. full blog posts / landing pages).
export const maxDuration = 60;

// Free by default: Google Gemini via its OpenAI-compatible endpoint.
// The API key comes from the USER (sent per-request as a header, "bring your
// own key"); we never store or log it. An optional env GEMINI_API_KEY acts as a
// fallback if the site owner wants to provide one.
// Swap providers by setting AI_BASE_URL / AI_MODEL (e.g. Groq).
const BASE_URL =
  process.env.AI_BASE_URL ||
  "https://generativelanguage.googleapis.com/v1beta/openai/";
const MODEL = process.env.AI_MODEL || "gemini-2.0-flash";

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
  const userKey = req.headers.get("x-gemini-key")?.trim();
  const API_KEY = userKey || process.env.GEMINI_API_KEY || process.env.AI_API_KEY;

  if (!API_KEY) {
    return Response.json(
      {
        error:
          "No Gemini API key set. Click “API key” at the top and paste your free key from aistudio.google.com to start.",
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
          message =
            err.status === 400 || err.status === 401 || err.status === 403
              ? "Your Gemini API key was rejected. Open “API key” and check it’s correct and active."
              : err.status === 429
                ? "Gemini rate limit hit (free tier). Wait a moment and try again."
                : `AI provider error (${err.status}): ${err.message}`;
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
