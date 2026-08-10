export const config = { runtime: "edge" };

import { isAllowedOrigin, corsHeaders } from "../_lib/cors.js";
import { signOut, bearerToken } from "../_lib/auth.js";

export default async function handler(req) {
  const allowedOrigin = isAllowedOrigin(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(allowedOrigin) });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  if (!allowedOrigin) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
  const cors = corsHeaders(allowedOrigin);

  const token = bearerToken(req);
  // Best-effort: revoking the refresh token server-side is a courtesy, not
  // a security boundary — the client always clears its local session too.
  await signOut(token).catch(() => {});

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json", ...cors },
  });
}
