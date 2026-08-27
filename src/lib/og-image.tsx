import { ImageResponse } from "next/og";

export const OG_IMAGE_SIZE = { width: 1200, height: 630 };

export function renderOgImage(title: string, tagline: string) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#09090B",
          fontFamily: "Helvetica",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 64,
              height: 64,
              borderRadius: 14,
              background: "#2563EB",
              color: "#FAFAFA",
              fontSize: 32,
              fontWeight: 700,
              letterSpacing: -1,
            }}
          >
            P
          </div>
          <div style={{ display: "flex", flexDirection: "column", marginLeft: 16 }}>
            <div style={{ display: "flex", fontSize: 22, fontWeight: 700, color: "#FAFAFA" }}>
              Perintis
            </div>
            <div style={{ display: "flex", fontSize: 16, color: "#71717A" }}>by Rhazes Labs</div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 48,
            fontSize: 56,
            fontWeight: 700,
            letterSpacing: -1.5,
            color: "#FAFAFA",
            lineHeight: 1.15,
            maxWidth: 980,
          }}
        >
          {title}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 24,
            fontSize: 28,
            color: "#A1A1AA",
            maxWidth: 900,
          }}
        >
          {tagline}
        </div>
      </div>
    ),
    { ...OG_IMAGE_SIZE }
  );
}
