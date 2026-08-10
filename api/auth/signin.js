export const config = { runtime: "edge" };

import { isAllowedOrigin, corsHeaders } from "../_lib/cors.js";
import { kvRateLimit } from "../_lib/kv.js";
import { signInWithPassword } from "../_lib/auth.js";

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

  // Tighter than signup's limit — this is the endpoint a password-guessing
  // script would actually hit.
  const limited = await kvRateLimit(req, { prefix: "auth-signin", max: 15, windowSec: 900 });
  if (limited) {
    return new Response(JSON.stringify({ error: "Too many attempts — try again shortly" }), {
      status: 429,
      headers: { "Content-Type": "application/json", ...cors },
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...cors },
    });
  }

  const email = (body?.email || "").trim().toLowerCase();
  const password = body?.password || "";
  if (!email || !password) {
    return new Response(JSON.stringify({ error: "Email and password are required" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...cors },
    });
  }

  const { ok, status, data } = await signInWithPassword(email, password);
  if (!ok) {
    return new Response(JSON.stringify({ error: data?.msg || data?.error_description || data?.error || "Invalid email or password" }), {
      status: status === 400 ? 401 : (status || 401),
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
