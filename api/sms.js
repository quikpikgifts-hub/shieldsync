export const config = { runtime: "edge" };

import { verifyTwilioSignature, sendSMS } from "./_lib/twilio.js";
import { supabaseInsert } from "./_lib/supabase.js";
import { mkId } from "./_lib/ids.js";

const CORS = { "Access-Control-Allow-Origin": "*" };

function twiml(msg) {
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${msg}</Message></Response>`,
    { headers: { "Content-Type": "application/xml", ...CORS } }
  );
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
    const dashPin = process.env.DASH_PIN;
    if (action !== "send" || !dashPin || dashPin === "0000" || pin !== dashPin) {
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
    const result = await sendSMS(to, body, "sms");
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

    if (!(await verifyTwilioSignature(req, req.url, params))) {
      return new Response("Forbidden", { status: 403, headers: CORS });
    }

    const from = params.get("From") || "";
    const body = (params.get("Body") || "").trim().toLowerCase();

    if (body === "stop" || body === "unsubscribe") {
      return twiml("You've been unsubscribed from Veridian outreach. Reply START to re-subscribe.");
    }
    if (body === "book" || body === "schedule" || body === "appointment" || body === "consult") {
      return twiml("Book your free Revenue Recovery Assessment: https://www.veridianresiliencegroupllc.org/#contact — We'll confirm within 1 business day.");
    }
    if (body === "yes" || body === "interested" || body === "tell me more") {
      await supabaseInsert("leads", {
        lead_id:  mkId("vrd"),
        phone:    from || null,
        priority: "HOT",
        status:   "contacted",
        notes:    "Replied YES to SMS outreach",
      }).catch(() => {});
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
  const dashPinInternal = process.env.DASH_PIN;
  if (!dashPinInternal || dashPinInternal === "0000" || bearerPin !== dashPinInternal) {
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
    smsBody = `Hi ${firstName}, this is Veridian.\n\nSorry we missed your call.\n\nMany businesses lose revenue when calls go unanswered.\n\nWhat challenge are you trying to solve today?\n\nReply here and we'll respond right away.`;
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

  const result = await sendSMS(to, smsBody, "sms");
  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json", ...CORS },
  });
}
