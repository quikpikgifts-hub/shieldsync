export const config = { runtime: "edge" };

import { kv } from "../_lib/kv.js";

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
});

function constantTimeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length || !a.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

function safeSale(sale) {
  const price = Number(sale.price);
  return {
    saleId: String(sale.id || sale.sale_id || ""),
    productId: String(sale.product_id || ""),
    productName: String(sale.product_name || "Quik Pik product").slice(0, 160),
    permalink: String(sale.product_permalink || "").slice(0, 300),
    priceCents: Number.isFinite(price) ? Math.round(price) : null,
    currency: String(sale.currency || "usd").slice(0, 8).toUpperCase(),
    createdAt: sale.created_at || sale.sale_timestamp || new Date().toISOString(),
    isRefunded: Boolean(sale.refunded || sale.is_refunded),
    source: "gumroad",
  };
}

export default async function handler(req) {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const expectedSecret = process.env.GUMROAD_WEBHOOK_SECRET || "";
  const suppliedSecret = new URL(req.url).searchParams.get("token") || "";
  if (!constantTimeEqual(suppliedSecret, expectedSecret)) return new Response("Not found", { status: 404 });

  const accessToken = process.env.GUMROAD_ACCESS_TOKEN || "";
  const allowedIds = (process.env.GUMROAD_ALLOWED_PRODUCT_IDS || "")
    .split(",").map(v => v.trim()).filter(Boolean);
  const kvReady = Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
  if (!accessToken || allowedIds.length === 0 || !kvReady) {
    console.error("[quikpik-gumroad] integration not configured");
    return json({ error: "Integration not configured" }, 503);
  }

  let form;
  try {
    form = await req.formData();
  } catch {
    return json({ error: "Expected form-encoded Gumroad ping" }, 400);
  }

  const resourceName = String(form.get("resource_name") || "sale");
  const saleId = String(form.get("sale_id") || "").trim();
  if (resourceName !== "sale") return new Response(null, { status: 204 });
  if (!saleId || saleId.length > 200) return json({ error: "Missing or invalid sale_id" }, 400);
  if (String(form.get("test") || "").toLowerCase() === "true") return new Response(null, { status: 200 });

  // Gumroad pings are not signed. Never trust the posted price/product fields:
  // retrieve the sale from Gumroad's authenticated API and validate the product.
  let verified;
  try {
    const saleUrl = new URL(`https://api.gumroad.com/v2/sales/${encodeURIComponent(saleId)}`);
    saleUrl.searchParams.set("access_token", accessToken);
    const response = await fetch(saleUrl.toString(), { headers: { Accept: "application/json" } });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.success !== true) {
      console.error("[quikpik-gumroad] sale verification rejected", response.status);
      return json({ error: "Sale could not be verified" }, 400);
    }
    verified = payload.sale || payload.data?.sale || payload.data;
  } catch {
    return json({ error: "Sale verification unavailable" }, 502);
  }

  if (!verified || String(verified.id || verified.sale_id || "") !== saleId) {
    return json({ error: "Verified sale ID mismatch" }, 400);
  }
  const normalized = safeSale(verified);
  if (!allowedIds.includes(normalized.productId)) {
    console.log("[quikpik-gumroad] verified sale ignored: product not allowlisted");
    return new Response(null, { status: 204 });
  }
  if (!normalized.saleId || normalized.priceCents === null || normalized.priceCents < 0) {
    return json({ error: "Verified sale data is incomplete" }, 400);
  }

  // SET NX is the idempotency gate. Fail closed if KV does not confirm that
  // this event was newly claimed, so retries cannot double-count a sale.
  let claim;
  try {
    claim = await kv("SET", `quikpik:gumroad:processed:${normalized.saleId}`, "1", "NX", "EX", 60 * 60 * 24 * 365);
  } catch {
    return json({ error: "Event storage unavailable" }, 503);
  }
  if (claim !== "OK") {
    // A duplicate may be retried by Gumroad. Return success without re-counting.
    return new Response(null, { status: 200 });
  }

  try {
    await kv("LPUSH", "quikpik:gumroad:sales", JSON.stringify(normalized));
  } catch {
    // Keep the idempotency claim: never risk a duplicate financial event.
    console.error("[quikpik-gumroad] event claimed but sales-list write failed");
    return json({ error: "Event storage incomplete; manual reconciliation required" }, 503);
  }

  console.log("[quikpik-gumroad] verified sale recorded", normalized.saleId);
  return new Response(null, { status: 200 });
}
