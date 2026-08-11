export const config = { runtime: "edge" };

import { verifyWebhookSignature, isConfigured } from "../_lib/stripe.js";
import { supabaseUpdate, supabaseInsert, supabaseSelect } from "../_lib/supabase.js";

// Stripe calls this endpoint directly (not a browser), so it is
// intentionally NOT gated by api/_lib/cors.js's same-origin check — the
// signature verification below is the actual security boundary here, per
// Stripe's own documented model.
export default async function handler(req) {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  if (!isConfigured()) return new Response(JSON.stringify({ error: "not_configured" }), { status: 501, headers: { "Content-Type": "application/json" } });

  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");
  const verified = await verifyWebhookSignature(rawBody, signature);
  if (!verified.ok) {
    return new Response(JSON.stringify({ error: `Signature verification failed: ${verified.reason}` }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  let event;
  try { event = JSON.parse(rawBody); } catch { return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: { "Content-Type": "application/json" } }); }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object;
        const orgId = sub.metadata?.org_id;
        if (orgId) {
          await upsertSubscription(orgId, {
            stripe_customer_id: sub.customer,
            stripe_subscription_id: sub.id,
            plan: sub.items?.data?.[0]?.price?.id || null,
            status: sub.status,
            current_period_end: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
          });
          await upsertEntitlement(orgId, "social", entitlementStatusFor(sub.status));
        }
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object;
        const orgId = sub.metadata?.org_id;
        if (orgId) {
          await upsertSubscription(orgId, { status: "canceled" });
          await upsertEntitlement(orgId, "social", "canceled");
        }
        break;
      }
      case "invoice.paid":
      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const orgId = invoice.subscription_details?.metadata?.org_id;
        if (orgId) {
          await supabaseInsert("invoices", {
            org_id: orgId,
            stripe_invoice_id: invoice.id,
            amount_cents: invoice.amount_paid ?? invoice.amount_due ?? 0,
            currency: invoice.currency || "usd",
            status: invoice.status,
            period_start: invoice.period_start ? new Date(invoice.period_start * 1000).toISOString() : null,
            period_end: invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : null,
          }).catch(() => {}); // duplicate delivery of an already-recorded invoice — safe to ignore (stripe_invoice_id is unique)
        }
        break;
      }
      default:
        break; // unhandled event types are intentionally no-ops, not errors
    }
  } catch (err) {
    // Stripe retries on non-2xx, so a transient DB error should surface as
    // one instead of silently dropping the event.
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }

  return new Response(JSON.stringify({ received: true }), { headers: { "Content-Type": "application/json" } });
}

function entitlementStatusFor(stripeStatus) {
  if (stripeStatus === "active" || stripeStatus === "trialing") return stripeStatus;
  if (stripeStatus === "past_due" || stripeStatus === "unpaid") return "past_due";
  return "canceled";
}

async function upsertSubscription(orgId, fields) {
  const existing = await supabaseSelect("subscriptions", `org_id=eq.${encodeURIComponent(orgId)}&select=org_id&limit=1`);
  if (existing && existing.length > 0) {
    await supabaseUpdate("subscriptions", `org_id=eq.${encodeURIComponent(orgId)}`, { ...fields, updated_at: new Date().toISOString() });
  } else {
    await supabaseInsert("subscriptions", { org_id: orgId, ...fields });
  }
}

async function upsertEntitlement(orgId, productKey, status) {
  const existing = await supabaseSelect(
    "product_entitlements",
    `org_id=eq.${encodeURIComponent(orgId)}&product_key=eq.${encodeURIComponent(productKey)}&select=org_id&limit=1`
  );
  if (existing && existing.length > 0) {
    await supabaseUpdate(
      "product_entitlements",
      `org_id=eq.${encodeURIComponent(orgId)}&product_key=eq.${encodeURIComponent(productKey)}`,
      { status, updated_at: new Date().toISOString() }
    );
  } else {
    await supabaseInsert("product_entitlements", { org_id: orgId, product_key: productKey, status });
  }
}
