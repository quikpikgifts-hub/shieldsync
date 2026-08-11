export const config = { runtime: "edge" };

import { isAllowedOrigin, corsHeaders } from "../_lib/cors.js";
import { getUser, bearerToken } from "../_lib/auth.js";
import { supabaseSelect } from "../_lib/supabase.js";
import { isConfigured, createPortalSession } from "../_lib/stripe.js";

// Opens the Stripe-hosted billing portal for an org's existing customer
// (plan changes, payment method updates, cancellation) — nothing here is
// reachable until an org has actually subscribed via api/billing/checkout.js.
export default async function handler(req) {
  const allowedOrigin = isAllowedOrigin(req);

  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders(allowedOrigin) });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  if (!allowedOrigin) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403, headers: { "Content-Type": "application/json" } });
  }
  const cors = corsHeaders(allowedOrigin);

  if (!isConfigured()) {
    return new Response(JSON.stringify({ ok: false, reason: "not_configured" }), { status: 501, headers: { "Content-Type": "application/json", ...cors } });
  }

  const { ok, data: authUser } = await getUser(bearerToken(req));
  if (!ok || !authUser?.id) {
    return new Response(JSON.stringify({ error: "Invalid or expired session" }), { status: 401, headers: { "Content-Type": "application/json", ...cors } });
  }

  let body;
  try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: { "Content-Type": "application/json", ...cors } }); }
  const { orgId, returnUrl } = body || {};
  if (!orgId || !returnUrl) {
    return new Response(JSON.stringify({ error: "orgId and returnUrl are required" }), { status: 400, headers: { "Content-Type": "application/json", ...cors } });
  }

  const memberships = await supabaseSelect("memberships", `org_id=eq.${encodeURIComponent(orgId)}&user_id=eq.${encodeURIComponent(authUser.id)}&select=role&limit=1`);
  if (!memberships || memberships.length === 0) {
    return new Response(JSON.stringify({ error: "Not a member of this organization" }), { status: 403, headers: { "Content-Type": "application/json", ...cors } });
  }

  const existing = await supabaseSelect("subscriptions", `org_id=eq.${encodeURIComponent(orgId)}&select=stripe_customer_id&limit=1`);
  const customerId = existing?.[0]?.stripe_customer_id;
  if (!customerId) {
    return new Response(JSON.stringify({ error: "This organization has no billing account yet" }), { status: 404, headers: { "Content-Type": "application/json", ...cors } });
  }

  const session = await createPortalSession({ customerId, returnUrl });
  if (!session.ok) {
    return new Response(JSON.stringify({ error: session.error || "Could not open the billing portal" }), { status: 502, headers: { "Content-Type": "application/json", ...cors } });
  }

  return new Response(JSON.stringify({ url: session.data.url }), { headers: { "Content-Type": "application/json", ...cors } });
}
