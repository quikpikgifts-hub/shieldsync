export const config = { runtime: "edge" };

import { kvRateLimit } from "../_lib/kv.js";
import { callAnthropic } from "../_lib/ai-gateway.js";
import { getAgent, parseJsonResponse } from "../_lib/agents.js";
import { isAllowedOrigin, corsHeaders } from "../_lib/cors.js";
import { getUser, bearerToken } from "../_lib/auth.js";
import { supabaseSelect } from "../_lib/supabase.js";

export default async function handler(req) {
  const allowedOrigin = isAllowedOrigin(req);
  const cors = corsHeaders(allowedOrigin, "POST, OPTIONS");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: cors });
  }
  if (!allowedOrigin) {
    return new Response(JSON.stringify({ error: "Unauthorized origin" }), {
      status: 403, headers: { "Content-Type": "application/json", ...cors },
    });
  }

  // Fail closed until the AI generation path is explicitly enabled after
  // deployment configuration and tenant authorization have been verified.
  if (process.env.SOCIAL_AI_ENABLED !== "true") {
    return new Response(JSON.stringify({ error: "Social AI generation is temporarily disabled pending workspace security setup." }), {
      status: 503, headers: { "Content-Type": "application/json", ...cors },
    });
  }

  const token = bearerToken(req);
  const auth = await getUser(token);
  if (!auth.ok || !auth.data?.id) {
    return new Response(JSON.stringify({ error: "A valid signed-in session is required." }), {
      status: 401, headers: { "Content-Type": "application/json", ...cors },
    });
  }

  let body;
  try { body = await req.json(); }
  catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400, headers: { "Content-Type": "application/json", ...cors },
    });
  }

  const { agent: agentKey, input, org_id: orgId } = body || {};
  if (typeof orgId !== "string" || !orgId) {
    return new Response(JSON.stringify({ error: "A workspace ID is required." }), {
      status: 400, headers: { "Content-Type": "application/json", ...cors },
    });
  }

  // Verify membership for this exact workspace; never trust a client-supplied
  // org_id without checking it against the authenticated user.
  const memberships = await supabaseSelect(
    "memberships",
    `user_id=eq.${encodeURIComponent(auth.data.id)}&org_id=eq.${encodeURIComponent(orgId)}&select=org_id&limit=1`
  );
  if (!Array.isArray(memberships) || memberships.length === 0) {
    return new Response(JSON.stringify({ error: "You do not have access to this workspace." }), {
      status: 403, headers: { "Content-Type": "application/json", ...cors },
    });
  }

  if (await kvRateLimit(req, { prefix: `social-generate:${auth.data.id}`, max: 30, windowSec: 3600 })) {
    return new Response(JSON.stringify({ error: "Too many requests. Please try again shortly." }), {
      status: 429, headers: { "Content-Type": "application/json", ...cors },
    });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "AI generation is not configured yet." }), {
      status: 503, headers: { "Content-Type": "application/json", ...cors },
    });
  }

  const agent = getAgent(agentKey);
  if (!agent || !input || (typeof input !== "object" && typeof input !== "string")) {
    return new Response(JSON.stringify({ error: "Unknown agent or missing input" }), {
      status: 400, headers: { "Content-Type": "application/json", ...cors },
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
        status: 502, headers: { "Content-Type": "application/json", ...cors },
      });
    }

    const data = await resp.json();
    const generatedText = data?.content?.[0]?.text ?? "";

    if (agentKey === "drafts") {
      const parsed = parseJsonResponse(generatedText);
      return new Response(JSON.stringify({
        drafts: Array.isArray(parsed) ? parsed : [{ caption: generatedText, hashtags: "" }],
      }), { headers: { "Content-Type": "application/json", ...cors } });
    }

    if (agentKey === "videoScript") {
      const parsed = parseJsonResponse(generatedText);
      return new Response(JSON.stringify({
        script: parsed && typeof parsed === "object" && !Array.isArray(parsed)
          ? parsed
          : { hook: "", beats: [generatedText], cta: "", onScreenText: [] },
      }), { headers: { "Content-Type": "application/json", ...cors } });
    }

    if (agentKey === "hashtags") {
      return new Response(JSON.stringify({ hashtags: generatedText.trim() }), {
        headers: { "Content-Type": "application/json", ...cors },
      });
    }

    return new Response(JSON.stringify({ text: generatedText }), {
      headers: { "Content-Type": "application/json", ...cors },
    });
  } catch (e) {
    console.error("[social/generate] error:", e?.message || String(e));
    return new Response(JSON.stringify({ error: "AI generation failed. Please try again." }), {
      status: 500, headers: { "Content-Type": "application/json", ...cors },
    });
  }
}
