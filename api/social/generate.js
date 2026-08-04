export const config = { runtime: "edge" };

import { kvRateLimit } from "../_lib/kv.js";
import { callAnthropic } from "../_lib/ai-gateway.js";
import { getAgent, parseJsonResponse } from "../_lib/agents.js";

const CORS = { "Access-Control-Allow-Origin": "*" };

export default async function handler(req) {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: { ...CORS, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" },
    });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: CORS });
  }

  if (await kvRateLimit(req, { prefix: "social-generate", max: 30, windowSec: 3600 })) {
    return new Response(JSON.stringify({ error: "Too many requests. Please try again shortly." }), {
      status: 429,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "AI generation is not configured yet (ANTHROPIC_API_KEY missing)." }), {
      status: 503,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  }

  let body;
  try { body = await req.json(); }
  catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400, headers: { "Content-Type": "application/json", ...CORS },
    });
  }

  const { agent: agentKey, input } = body;
  const agent = getAgent(agentKey);
  if (!agent || !input) {
    return new Response(JSON.stringify({ error: "Unknown agent or missing input" }), {
      status: 400, headers: { "Content-Type": "application/json", ...CORS },
    });
  }

  try {
    const resp = await callAnthropic({
      apiKey,
      model: agent.model,
      system: agent.system,
      messages: agent.buildMessages(input),
      maxTokens: agent.maxTokens,
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error(`[social/generate] Anthropic error for agent=${agentKey} — HTTP ${resp.status}:`, errText);
      return new Response(JSON.stringify({ error: "AI generation failed. Please try again." }), {
        status: 502, headers: { "Content-Type": "application/json", ...CORS },
      });
    }

    const data = await resp.json();
    const text = data?.content?.[0]?.text ?? "";

    if (agentKey === "drafts") {
      const parsed = parseJsonResponse(text);
      if (!Array.isArray(parsed)) {
        console.error("[social/generate] drafts agent returned non-JSON, falling back to single raw draft");
        return new Response(JSON.stringify({ drafts: [{ caption: text, hashtags: "" }] }), {
          headers: { "Content-Type": "application/json", ...CORS },
        });
      }
      return new Response(JSON.stringify({ drafts: parsed }), {
        headers: { "Content-Type": "application/json", ...CORS },
      });
    }

    return new Response(JSON.stringify({ text }), {
      headers: { "Content-Type": "application/json", ...CORS },
    });
  } catch (e) {
    console.error("[social/generate] error:", e?.message || String(e));
    return new Response(JSON.stringify({ error: "AI generation failed. Please try again." }), {
      status: 500, headers: { "Content-Type": "application/json", ...CORS },
    });
  }
}
