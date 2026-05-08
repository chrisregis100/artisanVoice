import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Billo — Assistant vocal de facturation pour artisans";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 64,
          background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 96, fontWeight: 700, marginBottom: 20 }}>
          Billo
        </div>
        <div style={{ fontSize: 36, opacity: 0.9, textAlign: "center", maxWidth: "80%" }}>
          Assistant vocal de facturation pour artisans
        </div>
      </div>
    ),
    { ...size }
  );
}
