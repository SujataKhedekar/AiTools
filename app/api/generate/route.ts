import Anthropic from "@anthropic-ai/sdk";
import { getTool, type Tool } from "@/lib/tools";

export const runtime = "nodejs";
// Allow long generations (e.g. full blog posts / landing pages).
export const maxDuration = 60;

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";

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
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "Server is missing ANTHROPIC_API_KEY. Add it to .env.local and restart." },
      { status: 500 },
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

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const claudeStream = client.messages.stream({
          model: MODEL,
          max_tokens: 4096,
          system: tool.system,
          messages: [{ role: "user", content: buildUserMessage(tool, inputs) }],
        });

        claudeStream.on("text", (delta) => {
          controller.enqueue(encoder.encode(delta));
        });

        await claudeStream.finalMessage();
        controller.close();
      } catch (err) {
        const message =
          err instanceof Anthropic.APIError
            ? `Claude API error (${err.status}): ${err.message}`
            : "Something went wrong generating the response.";
        // Surface the error inline in the stream so the UI can show it.
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
