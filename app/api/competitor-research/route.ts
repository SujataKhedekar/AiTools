import { runResearch } from "@/lib/competitorResearch";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return Response.json({ error: "Invalid request body." }, { status: 400 }); }
  if (typeof body.url !== "string" || body.url.length > 2048) return Response.json({ error: "Enter a website URL." }, { status: 400 });
  const count = Number(body.count);
  if (![5, 10, 20].includes(count)) return Response.json({ error: "Choose 5, 10 or 20 competitors." }, { status: 400 });
  try {
    const result = await runResearch({ url: body.url, country: String(body.country || "us"), industry: String(body.industry || ""), location: String(body.location || ""), count });
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Research failed." }, { status: 400 }); }
}
