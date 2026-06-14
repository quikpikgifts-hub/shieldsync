export const config = { runtime: "edge" };

function mkId() {
  return `vrd_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function priority(annual) {
  if (annual >= 100000) return "HIGH";
  if (annual >= 30000) return "MEDIUM";
  return "STANDARD";
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
  const p = priority(annual);
  const firstName = name.trim().split(" ")[0];

  // Structured CRM entry — webhook consumers get this full object
  const crmEntry = {
    leadId,
    timestamp: ts,
    source: "veridian-website",
    priority: p,
    followUpTrigger: true,
    contact: {
      name: name.trim(),
      email: email.trim(),
      phone: phone || "",
      business: biz || "",
    },
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
        `Monthly calls: ${calcData.calls}  |  Miss rate: ${calcData.miss}%  |  Avg value: $${calcData.val}  |  Conv rate: ${calcData.conv}%`,
        `Missed calls/mo: ${calcData.missedPerMonth}  |  Revenue at risk: $${calcData.lostMonthly}/mo`,
        `Recovery potential: $${calcData.recoveryMonthly}/mo  |  Annual: ${fmtAnnual(annual)}`,
      ].join("\n")
    : "No calculator data — direct contact form.";

  const subjectSuffix = annual > 0 ? ` | Est. ${fmtAnnual(annual)}/yr` : "";

  if (resendKey) {
    const teamText = `[${p}] NEW LEAD — VERIDIAN
Lead ID: ${leadId}
Submitted: ${ts}

CONTACT
Name:     ${name.trim()}
Business: ${biz || "(not provided)"}
Email:    ${email.trim()}
Phone:    ${phone || "(not provided)"}

REVENUE CALCULATOR
${calcBlock}

CHALLENGE
${challenge || "(not provided)"}

---
Follow-up required within 1 business day.`;

    const recoveryLine =
      annual > 0
        ? `Based on your calculator inputs, we estimate ${fmtAnnual(annual)} per year in recoverable revenue is within reach for your business.`
        : "We'll assess your recovery potential during our review and come back to you with specific numbers.";

    const prospectText = `Hi ${firstName},

Thanks for reaching out to Veridian.

${recoveryLine}

A member of our team will be in touch within one business day with your personalized revenue recovery assessment.

Here's what to expect:
- We'll review your business type, call volume, and current miss rate
- We'll identify your highest-impact recovery opportunities
- We'll propose a specific plan with projected outcomes and timeline

— The Veridian Team
${toEmail}`;

    try {
      await Promise.all([
        fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: `Veridian <noreply@${fromDomain}>`,
            to: [toEmail],
            subject: `[${p}] New lead: ${name.trim()} — ${biz || "Unknown Business"}${subjectSuffix}`,
            text: teamText,
          }),
        }),
        fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: `Veridian <hello@${fromDomain}>`,
            to: [email.trim()],
            reply_to: toEmail,
            subject: "Your Veridian Revenue Assessment — We're on it",
            text: prospectText,
          }),
        }),
      ]);
    } catch {}
  }

  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(crmEntry),
      });
    } catch {}
  }

  return new Response(JSON.stringify({ success: true, leadId }), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
