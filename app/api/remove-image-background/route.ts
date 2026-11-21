export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

function isSupportedImage(bytes: Uint8Array) {
  const png = bytes.length > 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  const jpeg = bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const webp = bytes.length > 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  return png || jpeg || webp;
}

export async function POST(request: Request) {
  const apiKey = process.env.REMOVEBG_API_KEY;
  if (!apiKey) return Response.json({ error: "Background removal is not configured. Add REMOVEBG_API_KEY to the server environment." }, { status: 503 });

  let form: FormData;
  try { form = await request.formData(); } catch { return Response.json({ error: "Upload a PNG, JPEG or WebP image." }, { status: 400 }); }
  const file = form.get("image");
  if (!(file instanceof File)) return Response.json({ error: "Choose an image to process." }, { status: 400 });
  if (!file.size || file.size > MAX_UPLOAD_BYTES) return Response.json({ error: "Images must be smaller than 10 MB." }, { status: 413 });

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!isSupportedImage(bytes)) return Response.json({ error: "This file is not a supported PNG, JPEG or WebP image." }, { status: 415 });

  const payload = new FormData();
  payload.append("image_file", new Blob([bytes], { type: file.type || "application/octet-stream" }), file.name || "upload");
  payload.append("size", "auto");
  payload.append("format", "png");

  try {
    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: { "X-Api-Key": apiKey, Accept: "image/png" },
      body: payload,
      signal: AbortSignal.timeout(55_000),
      cache: "no-store",
    });
    if (!response.ok) {
      const message = await response.text();
      let detail = "The image provider could not remove this background.";
      try { const parsed = JSON.parse(message); detail = parsed.errors?.[0]?.title || parsed.errors?.[0]?.detail || detail; } catch { /* Provider returned a non-JSON error. */ }
      if (response.status === 402) detail = "The background-removal API has no credits available. Check the remove.bg account or plan.";
      if (response.status === 429) detail = "The background-removal service is busy. Please wait a moment and try again.";
      return Response.json({ error: detail }, { status: response.status >= 500 ? 502 : response.status });
    }
    return new Response(await response.arrayBuffer(), {
      headers: { "Content-Type": "image/png", "Content-Disposition": 'attachment; filename="background-removed.png"', "Cache-Control": "no-store" },
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    return Response.json({ error: timedOut ? "Background removal took too long. Try a smaller image." : "Could not reach the background-removal service." }, { status: 502 });
  }
}
