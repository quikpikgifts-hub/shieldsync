export const config = { runtime: "edge" };

import { isAllowedOrigin, corsHeaders } from "../_lib/cors.js";
import { getUser, bearerToken } from "../_lib/auth.js";
import { supabaseSelect } from "../_lib/supabase.js";
import { isConfigured } from "../_lib/stripe.js";
import { getEntitlement } from "../_lib/entitlements.js";

// Live billing status for the Settings screen — never fabricates a plan;
// reports { configured: false } honestly until STRIPE_SECRET_KEY exists.
export default async function handler(req) {
  const allowedOrigin = isAllowedOrigin(req);

  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders(allowedOrigin, "GET, OPTIONS") });
  if (req.method !== "GET") return new Response("Method not allowed", { status: 405 });
  if (!allowedOrigin) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403, headers: { "Content-Type": "application/json" } });
  }
  const cors = corsHeaders(allowedOrigin, "GET, OPTIONS");

  const url = new URL(req.url);
  const orgId = url.searchParams.get("orgId");
  if (!orgId) {
    return new Response(JSON.stringify({ error: "orgId is required" }), { status: 400, headers: { "Content-Type": "application/json", ...cors } });
  }

  const { ok, data: authUser } = await getUser(bearerToken(req));
  if (!ok || !authUser?.id) {
    return new Response(JSON.stringify({ error: "Invalid or expired session" }), { status: 401, headers: { "Content-Type": "application/json", ...cors } });
  }

  const memberships = await supabaseSelect("memberships", `org_id=eq.${encodeURIComponent(orgId)}&user_id=eq.${encodeURIComponent(authUser.id)}&select=role&limit=1`);
  if (!memberships || memberships.length === 0) {
    return new Response(JSON.stringify({ error: "Not a member of this organization" }), { status: 403, headers: { "Content-Type": "application/json", ...cors } });
  }

  const entitlement = await getEntitlement(orgId, "social");
  return new Response(JSON.stringify({ configured: isConfigured(), entitlement }), {
    headers: { "Content-Type": "application/json", ...cors },
  });
}
