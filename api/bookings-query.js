export const config = { runtime: "edge" };

export default async function handler(req) {
  const cleanEnv = v => (v || "").replace(/^=+/, "").trim();
  const url = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!url || !key) {
    return new Response(JSON.stringify({ error: "Supabase env vars missing" }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }

  const r = await fetch(
    `${url}/rest/v1/bookings?select=booking_id,name,business,email,created_at&order=created_at.desc`,
    {
      headers: {
        "apikey": key,
        "Authorization": `Bearer ${key}`,
        "Accept": "application/json",
      },
    }
  );

  const body = await r.text().catch(() => "");
  return new Response(body, {
    status: r.status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}
