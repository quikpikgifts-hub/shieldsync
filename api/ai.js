/**
 * Vercel Edge Function — Anthropic AI Proxy
 *
 * Moves the API key server-side so it never touches the browser.
 * Set ANTHROPIC_API_KEY in Vercel project environment variables.
 * Falls back gracefully when the key is absent (demo mode in UI).
 */
export const config = { runtime: "edge" };

const ALLOWED_ORIGINS = [
  "https://shieldsync-qldm.vercel.app",
  "https://shieldsync-psi.vercel.app",
  "https://shieldsync-jbsx.vercel.app",
  "https://shieldsync-app.vercel.app",
];

function corsHeaders(req) {
  const origin = req.headers.get("origin") || "";
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
}

export default async function handler(req) {
  const cors = corsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: cors });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY not configured in environment" }),
      { status: 503, headers: { "Content-Type": "application/json", ...cors } }
    );
  }

  let body;
  try {
    body = await req.text();
    JSON.parse(body); // validate JSON
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...cors },
    });
  }

  const upstream = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body,
  });

  const data = await upstream.text();
  return new Response(data, {
    status: upstream.status,
    headers: { "Content-Type": "application/json", ...cors },
  });
}
