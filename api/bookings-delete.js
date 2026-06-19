export const config = { runtime: "edge" };

const TARGET_IDS = [
  "bkg_1781868306080_livetest",
  "health_1781868305964",
  "health_1781868043963",
  "health_1781867287809",
  "health_1781867268409",
  "health_1781867232535",
  "health_1781867056233",
  "health_1781866748290",
];

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response("POST only", { status: 405 });
  }

  const cleanEnv = v => (v || "").replace(/^=+/, "").trim();
  const url = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!url || !key) {
    return new Response(JSON.stringify({ error: "Supabase env vars missing" }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }

  const ids = TARGET_IDS.map(id => `"${id}"`).join(",");
  const endpoint = `${url}/rest/v1/bookings?booking_id=in.(${TARGET_IDS.join(",")})`;

  const r = await fetch(endpoint, {
    method: "DELETE",
    headers: {
      "apikey": key,
      "Authorization": `Bearer ${key}`,
      "Prefer": "return=representation",
    },
  });

  const body = await r.text().catch(() => "");
  return new Response(JSON.stringify({ http: r.status, ok: r.ok, deleted: body }), {
    status: r.status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}
