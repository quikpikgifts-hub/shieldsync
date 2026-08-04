export const config = { runtime: "edge" };

// Fired by Twilio as the Voice Webhook URL when any call arrives.
// Strategy: play a brief "we'll text you" message, hang up, and
// immediately dispatch the SMS text-back — all within one request.

import { verifyTwilioSignature } from "./_lib/twilio.js";

const CORS = { "Access-Control-Allow-Origin": "*" };

async function sendSMS(to, body) {
  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from  = process.env.TWILIO_PHONE_NUMBER;
  if (!sid || !token || !from) {
    console.error("[missed-call] Twilio env vars missing");
    return { ok: false, error: "not configured" };
  }
  try {
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
    if (!r.ok) console.error("[missed-call] SMS send failed:", data);
    else console.log("[missed-call] SMS sent → sid:", data.sid);
    return { ok: r.ok, sid: data.sid };
  } catch (err) {
    console.error("[missed-call] sendSMS error:", err?.message);
    return { ok: false, error: err?.message };
  }
}

function twimlSay(message) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">${message}</Say>
  <Hangup/>
</Response>`;
}

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

  const contentType = req.headers.get("content-type") || "";
  if (!contentType.includes("application/x-www-form-urlencoded")) {
    return new Response("Bad request", { status: 400, headers: CORS });
  }

  const text = await req.text();
  const params = new URLSearchParams(text);

  if (!(await verifyTwilioSignature(req, req.url, params))) {
    console.log("[missed-call] rejected — invalid Twilio signature");
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><Response><Hangup/></Response>`,
      { status: 403, headers: { "Content-Type": "application/xml" } }
    );
  }

  const callerNumber  = params.get("From")        || "";
  const calledNumber  = params.get("To")          || "";
  const callStatus    = params.get("CallStatus")  || "";
  const callSid       = params.get("CallSid")     || "";

  console.log(`[missed-call] CallSid=${callSid} From=${callerNumber} To=${calledNumber} Status=${callStatus}`);

  // Ignore calls from Twilio test numbers or empty callers
  if (!callerNumber || callerNumber === "anonymous" || callerNumber.startsWith("+1800") || callerNumber.startsWith("+1888") || callerNumber.startsWith("+1877") || callerNumber.startsWith("+1866")) {
    console.log("[missed-call] skipping — caller screened:", callerNumber);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><Response><Hangup/></Response>`,
      { headers: { "Content-Type": "application/xml" } }
    );
  }

  // Fire SMS immediately — do not await before returning TwiML
  // (Edge functions stay alive until the Response is sent, but we want
  //  TwiML returned fast so the caller hears the greeting promptly)
  const businessName = process.env.BUSINESS_NAME || "Veridian";
  const smsBody = `Hi, this is ${businessName}.\n\nSorry we missed your call — we don't want you to wait.\n\nWhat can we help you with today? Reply here and we'll get back to you right away.\n\nReply BOOK to schedule a free consultation.`;

  const smsSent = sendSMS(callerNumber, smsBody);

  // Return TwiML — caller hears a brief message then the call ends
  const twiml = twimlSay("Thanks for calling. We just sent you a text message so you don't have to wait on hold. Reply to that text and we will get right back to you.");

  // Await SMS after TwiML is constructed (before Response is sent the fetch is still in flight)
  await smsSent;

  console.log(`[missed-call] done — sms dispatched to ${callerNumber}`);

  return new Response(twiml, {
    headers: { "Content-Type": "application/xml" },
  });
}
