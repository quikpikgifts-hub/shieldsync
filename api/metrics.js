export const config = { runtime: "edge" };

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
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  if (!checkPin(req)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { "Content-Type": "application/json" },
    });
  }

  const cleanEnv = v => (v || "").replace(/^=+/, "").trim();
  const url = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!url || !key) {
    return new Response(JSON.stringify({ error: "Supabase not configured" }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }

  const h = { "apikey": key, "Authorization": `Bearer ${key}`, "Accept": "application/json" };

  const [leadsRes, bookingsRes] = await Promise.all([
    fetch(`${url}/rest/v1/leads?select=lead_id,name,business,email,priority,status,created_at&order=created_at.desc`, { headers: h }),
    fetch(`${url}/rest/v1/bookings?select=booking_id,lead_id,name,business,email,created_at&order=created_at.desc`, { headers: h }),
  ]);

  const [leads, bookings] = await Promise.all([
    leadsRes.json().catch(() => []),
    bookingsRes.json().catch(() => []),
  ]);

  const totalLeads = Array.isArray(leads) ? leads.length : 0;
  const totalBookings = Array.isArray(bookings) ? bookings.length : 0;
  const bookingRate = totalLeads > 0 ? Math.round((totalBookings / totalLeads) * 100) : 0;

  const byPriority = { HOT: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  const byStatus = {};
  if (Array.isArray(leads)) {
    for (const l of leads) {
      if (l.priority && byPriority[l.priority] !== undefined) byPriority[l.priority]++;
      const s = l.status || "new";
      byStatus[s] = (byStatus[s] || 0) + 1;
    }
  }

  const bookingsByMonth = {};
  if (Array.isArray(bookings)) {
    for (const b of bookings) {
      const m = b.created_at?.slice(0, 7) || "unknown";
      bookingsByMonth[m] = (bookingsByMonth[m] || 0) + 1;
    }
  }

  const leadsByMonth = {};
  if (Array.isArray(leads)) {
    for (const l of leads) {
      const m = l.created_at?.slice(0, 7) || "unknown";
      leadsByMonth[m] = (leadsByMonth[m] || 0) + 1;
    }
  }

  const PIPELINE_STATUSES = [
    "new", "contacted", "consultation_booked", "consultation_completed",
    "audit_in_progress", "proposal_sent", "won", "lost",
  ];

  return new Response(JSON.stringify({
    generated_at: new Date().toISOString(),
    totals: {
      leads: totalLeads,
      bookings: totalBookings,
      booking_rate_pct: bookingRate,
    },
    pipeline: {
      statuses: PIPELINE_STATUSES,
      by_priority: byPriority,
      by_status: byStatus,
    },
    trends: {
      leads_by_month: leadsByMonth,
      bookings_by_month: bookingsByMonth,
    },
    recent: {
      leads: Array.isArray(leads) ? leads.slice(0, 10) : [],
      bookings: Array.isArray(bookings) ? bookings.slice(0, 10) : [],
    },
  }), {
    status: 200,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}
