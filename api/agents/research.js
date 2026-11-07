import { authorized, json, body } from "../_lib/agent-auth.js";
export const config = { runtime: "edge" };
export default async function handler(req) {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!authorized(req)) return json({ error: "Unauthorized or QP_AGENT_BRIDGE_TOKEN not configured" }, 401);
  let input;
  try { input = await body(req); } catch (e) { return json({ error: e.message || "Invalid JSON" }, 400); }
  const query = String(input.query || "").trim().slice(0, 800);
  if (!query) return json({ error: "query is required" }, 400);
  const key = process.env.YDC_API_KEY;
  if (!key) return json({ status: "blocked", provider: "you.com", reason: "YDC_API_KEY is not configured. Add it to Vercel Environment Variables." }, 503);
  try {
    const r = await fetch("https://ydc-index.io/v1/search", {
      method: "POST",
      headers: { "X-API-Key": key, "Content-Type": "application/json" },
      body: JSON.stringify({ query, count: Math.min(Math.max(Number(input.count) || 5, 1), 10), freshness: input.freshness || "week" })
    });
    const data = await r.json();
    if (!r.ok) return json({ status: "failed", provider: "you.com", http_status: r.status, error: data?.message || "Search provider error" }, 502);
    return json({ status: "succeeded", provider: "you.com", query, results: data });
  } catch { return json({ status: "failed", provider: "you.com", error: "Provider request failed" }, 502); }
}
