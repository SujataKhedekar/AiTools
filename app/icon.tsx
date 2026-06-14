import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

// Browser-tab favicon: an "A" monogram on the brand ink color.
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1c1a16",
          color: "#faf8f4",
          fontSize: 44,
          fontWeight: 700,
          borderRadius: 14,
        }}
      >
        A
      </div>
    ),
    { ...size },
  );
}
