export const config = { runtime: "edge" };

import { isAllowedOrigin, corsHeaders } from "../_lib/cors.js";
import { refreshSession } from "../_lib/auth.js";

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

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...cors },
    });
  }

  const refreshToken = body?.refresh_token;
  if (!refreshToken) {
    return new Response(JSON.stringify({ error: "refresh_token required" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...cors },
    });
  }

  const { ok, status, data } = await refreshSession(refreshToken);
  if (!ok) {
    return new Response(JSON.stringify({ error: data?.msg || data?.error_description || "Session refresh failed — please sign in again" }), {
      status: status || 401,
      headers: { "Content-Type": "application/json", ...cors },
    });
  }

  return new Response(JSON.stringify({
    user: data.user ? { id: data.user.id, email: data.user.email } : null,
    session: {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
    },
  }), { headers: { "Content-Type": "application/json", ...cors } });
}
