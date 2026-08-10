export const config = { runtime: "edge" };

import { isAllowedOrigin, corsHeaders } from "../_lib/cors.js";
import { kvRateLimit } from "../_lib/kv.js";
import { signUp } from "../_lib/auth.js";

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

  const limited = await kvRateLimit(req, { prefix: "auth-signup", max: 10, windowSec: 3600 });
  if (limited) {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
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
  if (!email || !password || password.length < 8) {
    return new Response(JSON.stringify({ error: "A valid email and an 8+ character password are required" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...cors },
    });
  }

  const { ok, status, data } = await signUp(email, password);
  if (!ok) {
    return new Response(JSON.stringify({ error: data?.msg || data?.error_description || data?.error || "Sign-up failed" }), {
      status: status || 400,
      headers: { "Content-Type": "application/json", ...cors },
    });
  }

  // Supabase only returns a live session immediately when email
  // confirmation is disabled on the project; otherwise `session` is null
  // and the user must click the link GoTrue emails them before signing in.
  // Report that honestly instead of pretending the account is active.
  return new Response(JSON.stringify({
    user: data.user ? { id: data.user.id, email: data.user.email } : null,
    session: data.session || null,
    needsEmailConfirmation: !data.session,
  }), { headers: { "Content-Type": "application/json", ...cors } });
}
