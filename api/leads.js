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

function checkPin(req) {
  const expected = process.env.DASH_PIN || "0000";
  const auth = req.headers.get("authorization") || "";
  const pin = auth.startsWith("Bearer ") ? auth.slice(7) : new URL(req.url).searchParams.get("pin") || "";
  return pin === expected;
}

export default async function handler(req) {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  if (req.method === "GET") {
    if (!checkPin(req)) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    const raw = await kv("LRANGE", "veridian:leads", 0, 199);
    if (!raw) {
      return new Response(JSON.stringify({ leads: [], configured: false }), {
        headers: { "Content-Type": "application/json" },
      });
    }
    const leads = raw.map(item => { try { return JSON.parse(item); } catch { return null; } }).filter(Boolean);
    const leadsOut = await Promise.all(leads.map(async lead => {
      if (!lead.leadId) return lead;
      const booked = await kv("EXISTS", `veridian:booked:${lead.leadId}`);
      return { ...lead, booked: Number(booked) > 0 };
    }));
    return new Response(JSON.stringify({ leads: leadsOut, configured: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (req.method === "POST") {
    // Self-ingestion: set CONTACT_WEBHOOK_URL to your deployment URL + /api/leads
    let body;
    try { body = await req.json(); } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (!body.leadId || !body.contact?.email) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    await kv("LPUSH", "veridian:leads", JSON.stringify(body));
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  return new Response("Method not allowed", { status: 405 });
}
