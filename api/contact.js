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
  return (await r.json()).result;
}

function mkId() {
  return `vrd_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function priority(annual, challenge) {
  const urgentWords = ["urgent", "immediately", "asap", "losing", "crisis", "emergency", "now"];
  const isUrgent = urgentWords.some(w => (challenge || "").toLowerCase().includes(w));
  if (isUrgent || annual >= 200000) return "HOT";
  if (annual >= 75000) return "HIGH";
  if (annual >= 25000) return "MEDIUM";
  return "LOW";
}

function fmtAnnual(n) {
  if (!n || n === 0) return null;
  return n >= 1000 ? `$${(n / 1000).toFixed(1)}K` : `$${n}`;
}

async function ghlIntegration(crmEntry, annual, calcBlock, fmtAnnual) {
  const ghlKey = process.env.GOHIGHLEVEL_API_KEY;
  if (!ghlKey) return;

  const { contact, challenge, priority: p, leadId, calcData } = crmEntry;
  const nameParts = contact.name.split(" ");

  try {
    const ghlPayload = {
      firstName: nameParts[0] || contact.name,
      lastName: nameParts.slice(1).join(" ") || "",
      email: contact.email,
      phone: contact.phone || "",
      companyName: contact.business || "",
      source: "Veridian Website",
      tags: [p, "veridian-website", ...(annual > 0 ? ["calculator-lead"] : ["direct-lead"])],
    };
    const locationId = process.env.GOHIGHLEVEL_LOCATION_ID;
    if (locationId) ghlPayload.locationId = locationId;

    const ghlRes = await fetch("https://rest.gohighlevel.com/v1/contacts/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ghlKey}`,
        "Content-Type": "application/json",
        Version: "2021-07-28",
      },
      body: JSON.stringify(ghlPayload),
    });
    const ghlData = await ghlRes.json();
    const contactId = ghlData.contact?.id;
    if (!contactId) return;

    // Add note with full recovery data
    const noteText = [
      `VERIDIAN LEAD — ${p} PRIORITY`,
      `Lead ID: ${leadId}`,
      ``,
      `REVENUE CALCULATOR`,
      calcBlock,
      ``,
      `CHALLENGE`,
      challenge || "(not provided)",
      ``,
      `RECOVERY ESTIMATE: ${fmtAnnual(annual) || "Not calculated"}`,
    ].join("\n");

    await fetch(`https://rest.gohighlevel.com/v1/contacts/${contactId}/notes/`, {
      method: "POST",
      headers: { Authorization: `Bearer ${ghlKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ body: noteText }),
    });

    // Create pipeline opportunity if configured and lead has value
    const pipelineId = process.env.GOHIGHLEVEL_PIPELINE_ID;
    const stageId = process.env.GOHIGHLEVEL_STAGE_ID;
    if (pipelineId && stageId && annual > 0) {
      await fetch("https://rest.gohighlevel.com/v1/opportunities/", {
        method: "POST",
        headers: { Authorization: `Bearer ${ghlKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${contact.business || contact.name} — ${fmtAnnual(annual)}/yr Recovery`,
          pipelineId,
          pipelineStageId: stageId,
          status: "open",
          monetaryValue: Math.round(annual * 0.1), // ~10% of annual recovery = est. first year fee
          contactId,
          source: "Veridian Website",
        }),
      });
    }
  } catch {}
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
  try { body = await req.json(); }
  catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400, headers: { "Content-Type": "application/json" },
    });
  }

  const { name, email, biz, phone, challenge, calcData } = body;
  if (!name?.trim() || !email?.trim()) {
    return new Response(JSON.stringify({ error: "Name and email are required." }), {
      status: 400, headers: { "Content-Type": "application/json" },
    });
  }

  const leadId = mkId();
  const ts = new Date().toISOString();
  const annual = calcData?.annualPotential || 0;
  const p = priority(annual, challenge);
  const firstName = name.trim().split(" ")[0];

  const calcBlock = calcData
    ? [
        `Monthly calls: ${calcData.calls}  |  Miss rate: ${calcData.miss}%  |  Avg value: $${calcData.val}  |  Conv: ${calcData.conv}%`,
        `Missed/mo: ${calcData.missedPerMonth}  |  At risk: $${calcData.lostMonthly}/mo  |  Recovery: $${calcData.recoveryMonthly}/mo`,
        `Annual potential: ${fmtAnnual(annual)}`,
      ].join("\n")
    : "No calculator data — direct contact.";

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
  const subjectSuffix = annual > 0 ? ` | Est. ${fmtAnnual(annual)}/yr` : "";

  const promises = [];

  // KV: indexed lead (fast lookup for follow-up engine)
  promises.push(kv("SET", `veridian:lead:${leadId}`, JSON.stringify(crmEntry)));
  // KV: lead list (dashboard)
  promises.push(kv("LPUSH", "veridian:leads", JSON.stringify(crmEntry)));

  // KV: schedule follow-up sequences
  const now = Date.now();
  promises.push(kv("ZADD", "veridian:fu:24h",  String(now + 86400000),   leadId));
  promises.push(kv("ZADD", "veridian:fu:3d",   String(now + 259200000),  leadId));
  promises.push(kv("ZADD", "veridian:fu:7d",   String(now + 604800000),  leadId));
  promises.push(kv("ZADD", "veridian:fu:14d",  String(now + 1209600000), leadId));

  // GHL integration
  promises.push(ghlIntegration(crmEntry, annual, calcBlock, fmtAnnual));

  if (resendKey) {
    const teamText = `[${p}] NEW LEAD — VERIDIAN\nLead ID: ${leadId}\nSubmitted: ${ts}\n\nCONTACT\nName:     ${name.trim()}\nBusiness: ${biz || "(not provided)"}\nEmail:    ${email.trim()}\nPhone:    ${phone || "(not provided)"}\n\nREVENUE CALCULATOR\n${calcBlock}\n\nCHALLENGE\n${challenge || "(not provided)"}\n\n---\nPriority: ${p} — follow up within 1 business day.`;

    const recoveryLine = annual > 0
      ? `Based on your calculator inputs, we estimate ${fmtAnnual(annual)} per year in recoverable revenue is within reach.`
      : "We'll assess your recovery potential during our review.";

    const prospectText = `Hi ${firstName},\n\nThanks for reaching out to Veridian.\n\n${recoveryLine}\n\nA member of our team will be in touch within one business day with your personalized revenue recovery assessment.\n\nWhat to expect:\n- Review your business type and call volume\n- Identify your highest-impact recovery opportunities\n- Propose a specific plan with projected outcomes\n\n— The Veridian Team\n${toEmail}`;

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

  await Promise.allSettled(promises);

  return new Response(JSON.stringify({ success: true, leadId, priority: p }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}
