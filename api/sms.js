export const config = { runtime: "edge" };

const CORS = { "Access-Control-Allow-Origin": "*" };

async function sendSMS(to, body) {
  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from  = process.env.TWILIO_PHONE_NUMBER;
  if (!sid || !token || !from) {
    console.error("[sms] Twilio env vars missing (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER)");
    return { ok: false, error: "SMS not configured" };
  }
  const r = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(`${sid}:${token}`)}`,
      },
      body: new URLSearchParams({ To: to, From: from, Body: body }).toString(),
    }
  );
  const data = await r.json().catch(() => ({}));
  return { ok: r.ok, sid: data.sid };
}

function twiml(msg) {
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${msg}</Message></Response>`,
    { headers: { "Content-Type": "application/xml", ...CORS } }
  );
}

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
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  if (req.method === "GET") {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const pin    = searchParams.get("pin");
    if (action !== "send" || pin !== process.env.DASH_PIN) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...CORS },
      });
    }
    const to   = searchParams.get("to");
    const body = searchParams.get("body");
    if (!to || !body) {
      return new Response(JSON.stringify({ error: "to and body are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...CORS },
      });
    }
    const result = await sendSMS(to, body);
    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json", ...CORS },
    });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: CORS });
  }

  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const text = await req.text();
    const params = new URLSearchParams(text);
    const from = params.get("From") || "";
    const body = (params.get("Body") || "").trim().toLowerCase();

    if (body === "stop" || body === "unsubscribe") {
      return twiml("You've been unsubscribed from Veridian outreach. Reply START to re-subscribe.");
    }
    if (body === "book" || body === "schedule" || body === "appointment" || body === "consult") {
      return twiml("Book your free Revenue Recovery Assessment: https://www.veridianresiliencegroupllc.org/#contact — We'll confirm within 1 business day.");
    }
    if (body === "yes" || body === "interested" || body === "tell me more") {
      await supabaseInsert({
        lead_id:  mkId(),
        phone:    from || null,
        priority: "HOT",
        status:   "contacted",
        notes:    "Replied YES to SMS outreach",
      });
      return twiml("Excellent! A Veridian advisor will call you within 1 business day. Preview your recovery potential: https://www.veridianresiliencegroupllc.org/#calculator");
    }
    if (body === "price" || body === "cost" || body === "how much") {
      return twiml("Plans from $497/mo — no setup fee. Start with a free Revenue Recovery Assessment: https://www.veridianresiliencegroupllc.org/#contact");
    }
    if (body === "no" || body === "not interested" || body === "remove") {
      return twiml("Understood — we've noted your preference. Reach us anytime at veridianresiliencegroupllc.org. — Veridian Team");
    }
    return twiml("Thanks for reaching out to Veridian! Book a free Revenue Recovery Assessment: https://www.veridianresiliencegroupllc.org/#contact or reply BOOK. Questions? A team member will respond shortly.");
  }

  // Internal missed-call text-back — JSON body, DASH_PIN in Authorization Bearer
  const authHeader = req.headers.get("authorization") || "";
  const bearerPin  = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (bearerPin !== process.env.DASH_PIN) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  }

  let body;
  try { body = await req.json(); }
  catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  }

  const { type, to, name, message } = body;
  const firstName = (name || "").split(" ")[0] || "there";

  let smsBody;
  if (type === "missed_call") {
    smsBody = `Hi ${firstName}, this is Veridian — we just missed your call. We'd love to show you how to recover $30K–$120K in lost revenue. Reply here or book at https://www.veridianresiliencegroupllc.org/#contact`;
  } else if (type === "reminder_24h") {
    smsBody = `Hi ${firstName}, following up from Veridian. Have you had a chance to calculate your missed revenue? Most of our clients recover over $50K in year one: https://www.veridianresiliencegroupllc.org/#calculator`;
  } else if (type === "reminder_3d") {
    smsBody = `Hi ${firstName}, Veridian here. Still thinking about recovering lost revenue? We guarantee results or you don't pay. Book a free call: https://www.veridianresiliencegroupllc.org/#contact`;
  } else if (type === "custom") {
    smsBody = message;
  } else {
    return new Response(JSON.stringify({ error: "Unknown type" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  }

  const result = await sendSMS(to, smsBody);
  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json", ...CORS },
  });
}
