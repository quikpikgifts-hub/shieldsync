import { useEffect, useState } from "react";

// Single shared design system for the whole Veridian AI shell — the shell
// chrome, the Social module, and any future module all use this one object,
// so switching between them reads as one product, not several stitched
// together. (Promoted from what was Social.jsx's local palette.)
export const T = {
  bg: "#0A0A12", surface: "#0F0F1A", card: "#151522", cardH: "#1B1B2C",
  border: "#232336", borderH: "#33334A",
  accent: "#8B5CF6", accentH: "#7C3AED", accentB: "rgba(139,92,246,0.14)",
  green: "#10B981", greenB: "rgba(16,185,129,0.14)",
  amber: "#F59E0B", amberB: "rgba(245,158,11,0.14)",
  red: "#EF4444", redB: "rgba(239,68,68,0.14)",
  text: "#F1F0FA", textSub: "#8B8AA8", textDim: "#4A4A64",
};

export const BASE_CSS = `*{box-sizing:border-box;margin:0;padding:0}body{background:${T.bg};color:${T.text};font-family:-apple-system,BlinkMacSystemFont,'Inter','Segoe UI',sans-serif;-webkit-font-smoothing:antialiased}input,textarea,button,select{font-family:inherit}::-webkit-scrollbar{width:6px}::-webkit-scrollbar-thumb{background:${T.border};border-radius:3px}input:focus-visible,textarea:focus-visible,select:focus-visible,button:focus-visible{outline:2px solid ${T.accent};outline-offset:1px}`;

export function useInjectedStyle(css) {
  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = css;
    document.head.appendChild(el);
    return () => el.remove();
  }, [css]);
}

// Distinguishes "you're offline" from "something's broken" throughout the
// shell — never shown as broken UI, just an honest status.
export function useOnlineStatus() {
  const [online, setOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine);
  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);
  return online;
}
