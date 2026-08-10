// Shared same-origin allowlist + CORS headers. Extracted from api/ai.js
// (the one route that already did this correctly) so new routes — starting
// with api/auth/* — don't add a fifth copy-pasted ALLOWED_ORIGINS list.
// api/ai.js itself is left as-is: it also accepts a DASH_PIN bearer token,
// a second auth path this shared helper doesn't need to model.
export const ALLOWED_ORIGINS = [
  "https://shieldsync-psi.vercel.app",
  "https://veridianresiliencegroupllc.org",
  "https://www.veridianresiliencegroupllc.org",
  "http://localhost:5173", // Vite dev
  "http://localhost:3000", // alt dev
];

export function isAllowedOrigin(req) {
  const origin = req.headers.get("origin") || "";
  const referer = req.headers.get("referer") || "";
  if (ALLOWED_ORIGINS.some((o) => origin === o)) return origin;
  if (ALLOWED_ORIGINS.some((o) => referer.startsWith(o + "/"))) {
    try { return new URL(referer).origin; } catch { /* fall through */ }
  }
  return null;
}

export function corsHeaders(allowedOrigin, methods = "POST, OPTIONS") {
  return {
    "Access-Control-Allow-Origin": allowedOrigin || "null",
    "Access-Control-Allow-Methods": methods,
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Vary": "Origin",
  };
}
