export const config = { runtime: "edge" };

import { isAllowedOrigin, corsHeaders } from "../_lib/cors.js";
import { getUser, bearerToken } from "../_lib/auth.js";
import { supabaseSelect, supabaseInsert, supabaseUpdate } from "../_lib/supabase.js";
import { isConfigured, createCustomer, createCheckoutSession } from "../_lib/stripe.js";

// Starts a Stripe Checkout subscription flow for the caller's own org.
// Returns not_configured (not an error) until STRIPE_SECRET_KEY exists and
// real prices have been created — matches the "honest degrade" pattern
// every other integration in this codebase uses (see api/_lib/publishers/*).
export default async function handler(req) {
  const allowedOrigin = isAllowedOrigin(req);

  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders(allowedOrigin) });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  if (!allowedOrigin) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403, headers: { "Content-Type": "application/json" } });
  }
  const cors = corsHeaders(allowedOrigin);

  if (!isConfigured()) {
    return new Response(JSON.stringify({ ok: false, reason: "not_configured" }), {
      status: 501,
      headers: { "Content-Type": "application/json", ...cors },
    });
  }

  const { ok, data: authUser } = await getUser(bearerToken(req));
  if (!ok || !authUser?.id) {
    return new Response(JSON.stringify({ error: "Invalid or expired session" }), { status: 401, headers: { "Content-Type": "application/json", ...cors } });
  }

  let body;
  try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: { "Content-Type": "application/json", ...cors } }); }
  const { orgId, priceId, successUrl, cancelUrl } = body || {};
  if (!orgId || !priceId || !successUrl || !cancelUrl) {
    return new Response(JSON.stringify({ error: "orgId, priceId, successUrl, and cancelUrl are required" }), { status: 400, headers: { "Content-Type": "application/json", ...cors } });
  }

  // Confirm the caller actually belongs to the org they're buying for.
  const memberships = await supabaseSelect("memberships", `org_id=eq.${encodeURIComponent(orgId)}&user_id=eq.${encodeURIComponent(authUser.id)}&select=role&limit=1`);
  if (!memberships || memberships.length === 0) {
    return new Response(JSON.stringify({ error: "Not a member of this organization" }), { status: 403, headers: { "Content-Type": "application/json", ...cors } });
  }

  // Reuse an existing Stripe customer for this org if one's on file.
  let customerId;
  const existing = await supabaseSelect("subscriptions", `org_id=eq.${encodeURIComponent(orgId)}&select=stripe_customer_id&limit=1`);
  if (existing && existing[0]?.stripe_customer_id) {
    customerId = existing[0].stripe_customer_id;
  } else {
    const created = await createCustomer({ email: authUser.email, orgId });
    if (!created.ok) {
      return new Response(JSON.stringify({ error: created.error || "Could not create billing customer" }), { status: 502, headers: { "Content-Type": "application/json", ...cors } });
    }
    customerId = created.data.id;
    if (existing && existing.length > 0) {
      await supabaseUpdate("subscriptions", `org_id=eq.${encodeURIComponent(orgId)}`, { stripe_customer_id: customerId });
    } else {
      await supabaseInsert("subscriptions", { org_id: orgId, stripe_customer_id: customerId, status: "none" }).catch(() => {});
    }
  }

  const session = await createCheckoutSession({ customerId, priceId, successUrl, cancelUrl, orgId });
  if (!session.ok) {
    return new Response(JSON.stringify({ error: session.error || "Could not start checkout" }), { status: 502, headers: { "Content-Type": "application/json", ...cors } });
  }

  return new Response(JSON.stringify({ url: session.data.url }), { headers: { "Content-Type": "application/json", ...cors } });
}
