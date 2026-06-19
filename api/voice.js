export const config = { runtime: "edge" };

const AGENT_PROMPT = "You are Alex, the AI receptionist for Veridian Risk Group. You answer inbound calls professionally.\n\nServices: Revenue recovery for service businesses — AI answering, SMS follow-up, lead management.\n\nFor BOOKING calls: collect name, email, callback number, business name → call book_consultation function.\nFor INFO calls: briefly describe Veridian's service, guide toward booking.\nFor EXISTING clients: take a message and promise callback within 2 hours.\n\nBe warm, concise, and results-focused. Every call should end with either a booking or captured contact info.";

const CORS = { "Access-Control-Allow-Origin": "*" };

async function supabaseInsert(row) {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const url = rawUrl.replace(/^=+/, "").trim();
  const key = rawKey.replace(/^=+/, "").trim();
  if (!url || !key) return;
  try {
    await fetch(`${url}/rest/v1/leads`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": key,
        "Authorization": `Bearer ${key}`,
        "Prefer": "return=minimal",
      },
      body: JSON.stringify(row),
    });
  } catch {}
}

function mkId() {
  return `vrd_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export default async function handler(req) {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        ...CORS,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, x-vapi-secret",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: CORS });
  }

  const vapiSecret = process.env.VAPI_SECRET;
  if (vapiSecret && req.headers.get("x-vapi-secret") !== vapiSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  }

  let event;
  try { event = await req.json(); }
  catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  }

  const type = event.type || event.message?.type;

  if (type === "assistant-request") {
    return new Response(JSON.stringify({
      assistant: {
        firstMessage: "Thanks for calling Veridian Risk Group. This is Alex — how can I help you today?",
        model: {
          provider: "anthropic",
          model: "claude-haiku-4-5-20251001",
          systemPrompt: AGENT_PROMPT,
        },
        voice: {
          provider: "playht",
          voiceId: "jennifer",
        },
        tools: [
          {
            type: "function",
            function: {
              name: "book_consultation",
              description: "Book a Revenue Recovery Assessment consultation when caller provides their details",
              parameters: {
                type: "object",
                properties: {
                  name:     { type: "string", description: "Caller's full name" },
                  email:    { type: "string", description: "Caller's email address" },
                  phone:    { type: "string", description: "Callback phone number" },
                  business: { type: "string", description: "Caller's business name" },
                },
                required: ["name", "phone"],
              },
            },
          },
          {
            type: "function",
            function: {
              name: "capture_lead",
              description: "Capture caller contact info without booking a specific slot",
              parameters: {
                type: "object",
                properties: {
                  name:    { type: "string", description: "Caller's full name" },
                  phone:   { type: "string", description: "Callback phone number" },
                  message: { type: "string", description: "Reason for calling or message to pass along" },
                },
                required: ["name", "phone"],
              },
            },
          },
        ],
      },
    }), {
      headers: { "Content-Type": "application/json", ...CORS },
    });
  }

  if (type === "end-of-call-report") {
    const transcript = event.transcript || event.call?.transcript || "";
    const emailMatch = transcript.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/);
    const email = emailMatch?.[0] || null;
    const phone = event.call?.customer?.number || null;
    const duration = event.call?.duration || null;
    const summary = event.summary || event.call?.summary || null;

    await supabaseInsert({
      lead_id:  mkId(),
      name:     null,
      email,
      phone,
      priority: "HIGH",
      status:   "contacted",
      notes:    `Voice call${duration ? ` — ${duration}s` : ""}${summary ? `. Summary: ${summary}` : ""}`,
    });

    return new Response(JSON.stringify({ status: "ok" }), {
      headers: { "Content-Type": "application/json", ...CORS },
    });
  }

  if (type === "function-call") {
    const fnName = event.functionCall?.name || event.message?.functionCall?.name;
    const params = event.functionCall?.parameters || event.message?.functionCall?.parameters || {};

    if (fnName === "book_consultation") {
      await supabaseInsert({
        lead_id:  mkId(),
        name:     params.name || null,
        email:    params.email || null,
        phone:    params.phone || null,
        business: params.business || null,
        priority: "HOT",
        status:   "consultation_booked",
        notes:    "Booked via AI voice receptionist",
      });
      return new Response(JSON.stringify({
        result: "I've captured your details. A Veridian advisor will confirm your consultation within 2 hours. Is there anything else I can help with?",
      }), {
        headers: { "Content-Type": "application/json", ...CORS },
      });
    }

    if (fnName === "capture_lead") {
      await supabaseInsert({
        lead_id:  mkId(),
        name:     params.name || null,
        phone:    params.phone || null,
        priority: "HIGH",
        status:   "contacted",
        notes:    params.message ? `Message: ${params.message}` : "Captured via AI voice receptionist",
      });
      return new Response(JSON.stringify({
        result: "Thank you! Our team will follow up with your personalized revenue recovery assessment within 1 business day.",
      }), {
        headers: { "Content-Type": "application/json", ...CORS },
      });
    }
  }

  return new Response(JSON.stringify({ status: "ok" }), {
    headers: { "Content-Type": "application/json", ...CORS },
  });
}
