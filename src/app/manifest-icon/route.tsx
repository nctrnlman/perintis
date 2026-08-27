import { ImageResponse } from "next/og";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#09090B",
          borderRadius: 112,
        }}
      >
        <div
          style={{
            display: "flex",
            color: "#FAFAFA",
            fontSize: 280,
            fontFamily: "Helvetica",
            fontWeight: 700,
            letterSpacing: -14,
          }}
        >
          P
        </div>
      </div>
    ),
    { width: 512, height: 512 }
  );
}
