import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "#020617",
          backgroundImage: "radial-gradient(circle at 20% 20%, rgba(37,99,235,0.35), transparent 55%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              display: "flex",
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "#2563eb",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M12 2 L21 6 V12 C21 17 17.5 20.5 12 22 C6.5 20.5 3 17 3 12 V6 Z" fill="white" fillOpacity="0.3" />
              <path d="M8.5 12.2 L11 14.7 L15.7 9.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div style={{ display: "flex", fontSize: 36, fontWeight: 700 }}>Veridian AI</div>
        </div>
        <div style={{ display: "flex", marginTop: 48, fontSize: 60, fontWeight: 700, maxWidth: 900, lineHeight: 1.15 }}>
          AI-Powered Safety &amp; Operations Platform
        </div>
        <div style={{ display: "flex", marginTop: 24, fontSize: 28, color: "#94a3b8", maxWidth: 820 }}>
          Generate professional security, HR, fleet, and compliance reports in minutes—not days.
        </div>
      </div>
    ),
    { ...size }
  );
}
