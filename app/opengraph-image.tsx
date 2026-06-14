import { ImageResponse } from "next/og";
import { SITE } from "@/lib/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${SITE.name} — ${SITE.tagline}`;

// Social share card (Open Graph / Twitter).
export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#faf8f4",
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 64,
              height: 64,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#1c1a16",
              color: "#faf8f4",
              fontSize: 40,
              fontWeight: 700,
              borderRadius: 16,
            }}
          >
            A
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 26,
              letterSpacing: 6,
              color: "#76716a",
              textTransform: "uppercase",
            }}
          >
            Aivora · by codepalette
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 78,
              fontWeight: 700,
              color: "#1c1a16",
              lineHeight: 1.05,
              maxWidth: 980,
            }}
          >
            80+ AI tools, one premium workspace
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 26,
              fontSize: 30,
              color: "#5d594f",
            }}
          >
            Writing · Code · Social · Design · Video · E-commerce · Business
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ display: "flex", width: 44, height: 6, background: "#1f6f63", borderRadius: 9999 }} />
          <div style={{ display: "flex", fontSize: 24, color: "#76716a" }}>
            Free to run · streams instantly
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
