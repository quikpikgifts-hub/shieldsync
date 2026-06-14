export const config = { runtime: "edge" };

async function kv(cmd, ...args) {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  const r = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify([cmd, ...args]),
  });
  const data = await r.json();
  return data.result;
}

function mkId() {
  return `vrd_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function priority(annual, challenge) {
  const hot = ["urgent", "immediately", "asap", "losing", "crisis", "now"].some(
    w => (challenge || "").toLowerCase().includes(w)
  );
  if (hot || annual >= 200000) return "HOT";
  if (annual >= 75000) return "HIGH";
  if (annual >= 25000) return "MEDIUM";
  return "LOW";
}

function fmtAnnual(n) {
  if (!n || n === 0) return null;
  return n >= 1000 ? `$${(n / 1000).toFixed(1)}K` : `$${n}`;
}

export default async function handler(req) {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { name, email, biz, phone, challenge, calcData } = body;
  if (!name || !name.trim() || !email || !email.trim()) {
    return new Response(JSON.stringify({ error: "Name and email are required." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const leadId = mkId();
  const ts = new Date().toISOString();
  const annual = calcData?.annualPotential || 0;
  const p = priority(annual, challenge);
  const firstName = name.trim().split(" ")[0];

  const crmEntry = {
    leadId,
    timestamp: ts,
    source: "veridian-website",
    priority: p,
    followUpTrigger: true,
    contact: { name: name.trim(), email: email.trim(), phone: phone || "", business: biz || "" },
    challenge: challenge || "",
    calcData: calcData || null,
    recoveryEstimate: fmtAnnual(annual),
  };

  const resendKey = process.env.RESEND_API_KEY;
  const webhookUrl = process.env.CONTACT_WEBHOOK_URL;
  const fromDomain = process.env.FROM_DOMAIN || "veridian.io";
  const toEmail = process.env.TEAM_EMAIL || "hello@veridian.io";

  const calcBlock = calcData
    ? [
        `Monthly calls: ${calcData.calls}  |  Miss rate: ${calcData.miss}%  |  Avg value: $${calcData.val}  |  Conv: ${calcData.conv}%`,
        `Missed/mo: ${calcData.missedPerMonth}  |  At risk: $${calcData.lostMonthly}/mo  |  Recovery: $${calcData.recoveryMonthly}/mo`,
        `Annual potential: ${fmtAnnual(annual)}`,
      ].join("\n")
    : "No calculator data — direct contact.";

  const subjectSuffix = annual > 0 ? ` | Est. ${fmtAnnual(annual)}/yr` : "";
  const recoveryLine =
    annual > 0
      ? `Based on your calculator inputs, we estimate ${fmtAnnual(annual)} per year in recoverable revenue is within reach.`
      : "We'll assess your recovery potential during our review and share specific numbers.";

  const promises = [];

  if (resendKey) {
    const teamText = `[${p}] NEW LEAD — VERIDIAN\nLead ID: ${leadId}\nSubmitted: ${ts}\n\nCONTACT\nName:     ${name.trim()}\nBusiness: ${biz || "(not provided)"}\nEmail:    ${email.trim()}\nPhone:    ${phone || "(not provided)"}\n\nREVENUE CALCULATOR\n${calcBlock}\n\nCHALLENGE\n${challenge || "(not provided)"}\n\n---\nPriority: ${p} — follow up within 1 business day.`;

    const prospectText = `Hi ${firstName},\n\nThanks for reaching out to Veridian.\n\n${recoveryLine}\n\nA member of our team will be in touch within one business day with your personalized revenue recovery assessment.\n\nWhat to expect:\n- We'll review your business type and call volume\n- We'll identify your highest-impact recovery opportunities\n- We'll propose a specific plan with projected outcomes\n\n— The Veridian Team\n${toEmail}`;

    promises.push(
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: `Veridian <noreply@${fromDomain}>`,
          to: [toEmail],
          subject: `[${p}] New lead: ${name.trim()} — ${biz || "Unknown"}${subjectSuffix}`,
          text: teamText,
        }),
      }),
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: `Veridian <hello@${fromDomain}>`,
          to: [email.trim()],
          reply_to: toEmail,
          subject: "Your Veridian Revenue Assessment — We're on it",
          text: prospectText,
        }),
      })
    );
  }

  if (webhookUrl) {
    promises.push(
      fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(crmEntry),
      })
    );
  }

  // Always write to KV if configured (powers the Revenue Dashboard)
  promises.push(kv("LPUSH", "veridian:leads", JSON.stringify(crmEntry)));

  await Promise.allSettled(promises);

  return new Response(JSON.stringify({ success: true, leadId, priority: p }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}
