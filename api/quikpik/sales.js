export const config = { runtime: "edge" };

import { getUser, bearerToken } from "../_lib/auth.js";
import { kv } from "../_lib/kv.js";

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
});

export default async function handler(req) {
  if (req.method !== "GET") return new Response("Method not allowed", { status: 405 });
  const ownerEmail = (process.env.QUIKPIK_OWNER_EMAIL || "").trim().toLowerCase();
  if (!ownerEmail) return json({ error: "Quik Pik owner access is not configured" }, 503);

  const token = bearerToken(req);
  if (!token) return json({ error: "Authentication required" }, 401);
  const userResult = await getUser(token);
  if (!userResult.ok || !userResult.data?.email) return json({ error: "Invalid or expired session" }, 401);
  if (String(userResult.data.email).toLowerCase() !== ownerEmail) return json({ error: "Forbidden" }, 403);

  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return json({ error: "Sales storage is not configured" }, 503);
  }

  let rows;
  try {
    rows = await kv("LRANGE", "quikpik:gumroad:sales", 0, 499);
    if (!Array.isArray(rows)) throw new Error("No sales list");
  } catch {
    return json({ error: "Sales data is temporarily unavailable" }, 503);
  }

  const sales = rows.map((row) => {
    try { return typeof row === "string" ? JSON.parse(row) : row; } catch { return null; }
  }).filter(s => s && s.source === "gumroad" && typeof s.priceCents === "number");
  const grossCents = sales.reduce((sum, s) => sum + (s.isRefunded ? 0 : s.priceCents), 0);
  const refundedCount = sales.filter(s => s.isRefunded).length;
  const currencyCounts = [...new Set(sales.map(s => s.currency))];
  return json({
    connected: true,
    source: "verified Gumroad webhook events",
    salesCount: sales.length,
    grossCents,
    refundedCount,
    currencies: currencyCounts,
    recentSales: sales.slice(0, 20).map(({ saleId, productName, priceCents, currency, createdAt, isRefunded }) =>
      ({ saleId, productName, priceCents, currency, createdAt, isRefunded })
    ),
    note: "This view includes only verified webhook events received after setup. It is not a historical Gumroad sales import.",
  });
}
