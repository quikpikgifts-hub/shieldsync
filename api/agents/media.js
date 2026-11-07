import { authorized, json, body } from "../_lib/agent-auth.js";
export const config = { runtime: "edge" };

export default async function handler(req) {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!authorized(req)) return json({ error: "Unauthorized" }, 401);

  let input;
  try {
    input = await body(req);
  } catch (e) {
    return json({ error: e.message || "Invalid JSON" }, 400);
  }

  const prompt = typeof input.prompt === "string" ? input.prompt.trim().slice(0, 5000) : "";
  const model = typeof input.model === "string" ? input.model.trim().slice(0, 120) : "";
  if (!prompt || !model) return json({ error: "prompt and model are required" }, 400);

  const key = process.env.MUSE_API_KEY;
  if (!key) return json({ status: "blocked", provider: "muse-video", reason: "Muse provider is not configured" }, 503);

  // Deliberately forward only documented core fields. Extend this allowlist
  // only after confirming optional parameters against the provider's API docs.
  try {
    const r = await fetch("https://muse-video.com/api/v1/generate", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, model })
    });
    const data = await r.json();
    if (!r.ok) {
      return json({ status: "failed", provider: "muse-video", http_status: r.status, error: data?.message || "Generation request failed" }, 502);
    }
    return json({ status: "accepted", provider: "muse-video", task: data.data || data });
  } catch {
    return json({ status: "failed", provider: "muse-video", error: "Provider request failed" }, 502);
  }
}
