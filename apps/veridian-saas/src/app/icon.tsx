import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

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
          background: "#2563eb",
          borderRadius: 7,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2 L21 6 V12 C21 17 17.5 20.5 12 22 C6.5 20.5 3 17 3 12 V6 Z"
            fill="white"
            fillOpacity="0.25"
          />
          <path
            d="M12 2 L21 6 V12 C21 17 17.5 20.5 12 22 C6.5 20.5 3 17 3 12 V6 Z"
            stroke="white"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path d="M8.5 12.2 L11 14.7 L15.7 9.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
