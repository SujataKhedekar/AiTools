import { generateSeoReport } from "@/lib/seoReport";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  let body: { url?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (typeof body.url !== "string" || !body.url.trim() || body.url.length > 2048) {
    return Response.json(
      { error: "Enter a valid website URL (up to 2,048 characters)." },
      { status: 400 },
    );
  }

  try {
    return Response.json(await generateSeoReport(body.url.trim()), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "The page could not be scanned.";
    return Response.json({ error: message }, { status: 400 });
  }
}
