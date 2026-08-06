export const config = { runtime: "edge" };

import { kvRateLimit } from "./_lib/kv.js";
import { callAnthropic } from "./_lib/ai-gateway.js";

// ─── Allowed origins (same-origin requests from the site itself) ─────────────
const ALLOWED_ORIGINS = [
  "https://shieldsync-psi.vercel.app",
  "https://veridianresiliencegroupllc.org",
  "https://www.veridianresiliencegroupllc.org",
  "http://localhost:5173",   // Vite dev
  "http://localhost:3000",   // alt dev
];

function isAllowedOrigin(req) {
  const origin = req.headers.get("origin") || "";
  const referer = req.headers.get("referer") || "";
  if (ALLOWED_ORIGINS.some((o) => origin === o)) return origin;
  if (ALLOWED_ORIGINS.some((o) => referer.startsWith(o + "/"))) {
    // Extract origin from referer for CORS header
    try { return new URL(referer).origin; } catch { /* fall through */ }
  }
  return null;
}

function hasDashPinAuth(req) {
  const auth = req.headers.get("authorization") || "";
  const pin = process.env.DASH_PIN;
  if (!pin || pin === "0000") return false; // fail closed on unset or default PIN
  return auth === `Bearer ${pin}`;
}

function corsHeaders(allowedOrigin) {
  return {
    "Access-Control-Allow-Origin": allowedOrigin || "null",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Vary": "Origin",
  };
}

// ─── Handler ─────────────────────────────────────────────────────────────────
export default async function handler(req) {
  // Pre-flight
  if (req.method === "OPTIONS") {
    const allowed = isAllowedOrigin(req);
    return new Response(null, {
      headers: corsHeaders(allowed || (hasDashPinAuth(req) ? "*" : "null")),
    });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // ── Auth: allow same-origin requests OR valid DASH_PIN Bearer token ──
  const allowedOrigin = isAllowedOrigin(req);
  const hasPin = hasDashPinAuth(req);
  if (!allowedOrigin && !hasPin) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
  const cors = corsHeaders(allowedOrigin || "*");

  // ── Rate limit by IP ──
  const limited = await kvRateLimit(req, { prefix: "ai", max: 20, windowSec: 60 });
  if (limited) {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: { "Content-Type": "application/json", ...cors },
    });
  }

  // ── API key check ──
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "API key not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...cors },
    });
  }

  // ── Parse body ──
  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...cors },
    });
  }

  const { messages, system, max_tokens = 800 } = body;
  if (!messages || !Array.isArray(messages)) {
    return new Response(JSON.stringify({ error: "messages required" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...cors },
    });
  }

  // ── Proxy to Anthropic ──
  try {
    const resp = await callAnthropic({
      apiKey,
      model: "claude-sonnet-4-6",
      maxTokens: Math.min(max_tokens, 2048),   // cap to prevent abuse
      system: system || "You are a helpful AI assistant.",
      messages: messages.slice(-10),              // cap history depth
    });

    if (!resp.ok) {
      const err = await resp.text();
      return new Response(JSON.stringify({ error: err }), {
        status: resp.status,
        headers: { "Content-Type": "application/json", ...cors },
      });
    }

    const data = await resp.json();
    const text = data?.content?.[0]?.text ?? "";
    return new Response(JSON.stringify({ text }), {
      headers: { "Content-Type": "application/json", ...cors },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...cors },
    });
  }
}
