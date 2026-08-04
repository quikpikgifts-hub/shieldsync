export const config = { runtime: "edge" };

import { kvRateLimit } from "./_lib/kv.js";

const SYSTEM = "You are Alex, the Veridian AI Front Desk — a professional AI concierge for Veridian Risk Group. Veridian helps service businesses recover $30K–$200K/year in lost revenue from missed calls and poor lead follow-up.\n\nYour goals:\n1. Welcome the visitor and uncover their revenue challenge\n2. Ask qualifying questions: business type, monthly call volume, biggest revenue problem\n3. Help them estimate their missed revenue potential\n4. Guide them toward booking a free 30-minute Revenue Recovery Assessment\n5. Capture: name, email, phone, and business name when they're ready\n\nRules:\n- Max 2-3 sentences per reply. Be direct and results-focused.\n- Never discuss specific pricing — say 'We cover investment options during your assessment'\n- Always end with a question or clear next step\n- When you have name + email, say: 'Perfect — I can lock in a consultation slot for you right now. Just click Book My Free Assessment below.'";

const CORS = { "Access-Control-Allow-Origin": "*" };

export default async function handler(req) {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        ...CORS,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: CORS });
  }

  const limited = await kvRateLimit(req, { prefix: "chat", max: 20, windowSec: 60 });
  if (limited) {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ reply: "Our chat team is offline right now. Please use the contact form below — we respond within 1 business day." }),
      { headers: { "Content-Type": "application/json", ...CORS } }
    );
  }

  let body;
  try { body = await req.json(); }
  catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  }

  const { message, history = [] } = body;
  if (!message?.trim()) {
    return new Response(JSON.stringify({ error: "message is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  }

  const messages = [
    ...history.slice(-10),
    { role: "user", content: message },
  ];

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        system: SYSTEM,
        messages,
      }),
    });

    const data = await r.json();
    if (!r.ok) {
      console.error("[chat] Anthropic API error — HTTP", r.status, JSON.stringify(data));
      throw new Error(data?.error?.message || "Anthropic error");
    }

    return new Response(JSON.stringify({ reply: data.content[0].text }), {
      headers: { "Content-Type": "application/json", ...CORS },
    });
  } catch (err) {
    console.error("[chat] error:", err?.message || String(err));
    return new Response(
      JSON.stringify({ reply: "Our chat team is offline right now. Please use the contact form below — we respond within 1 business day." }),
      { headers: { "Content-Type": "application/json", ...CORS } }
    );
  }
}
