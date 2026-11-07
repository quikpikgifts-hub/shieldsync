import { authorized, json } from "../_lib/agent-auth.js";
export const config = { runtime: "edge" };
export default async function handler(req) {
  if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);
  if (!authorized(req)) return json({ error: "Unauthorized or QP_AGENT_BRIDGE_TOKEN not configured" }, 401);
  const taskId = new URL(req.url).searchParams.get("task_id") || "";
  if (!/^[a-zA-Z0-9_-]{3,200}$/.test(taskId)) return json({ error: "Valid task_id is required" }, 400);
  const key = process.env.MUSE_API_KEY;
  if (!key) return json({ status: "blocked", provider: "muse-video", reason: "MUSE_API_KEY is not configured" }, 503);
  try {
    const r = await fetch("https://muse-video.com/api/v1/status?task_id=" + encodeURIComponent(taskId), { headers: { Authorization: `Bearer ${key}` } });
    const data = await r.json();
    if (!r.ok) return json({ status: "failed", provider: "muse-video", http_status: r.status, error: data?.message || "Status request failed" }, 502);
    return json({ provider: "muse-video", task: data.data || data });
  } catch { return json({ status: "failed", provider: "muse-video", error: "Provider request failed" }, 502); }
}
