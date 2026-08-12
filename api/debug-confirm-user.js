export const config = { runtime: "edge" };

// Temporary diagnostic: force-confirms a test user's email via Supabase's
// GoTrue admin API (service-role authenticated), bypassing the "Confirm
// email" setting so we can get a real session and reproduce the org-
// bootstrap bug directly instead of guessing at it. Delete once done.
export default async function handler(req) {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const { userId } = await req.json().catch(() => ({}));
  if (!userId) return new Response(JSON.stringify({ error: "userId required" }), { status: 400, headers: { "Content-Type": "application/json" } });

  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

  const r = await fetch(`${url}/auth/v1/admin/users/${userId}`, {
    method: "PUT",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ email_confirm: true }),
  });
  const data = await r.json().catch(() => ({}));
  return new Response(JSON.stringify({ status: r.status, ok: r.ok, data }), { headers: { "Content-Type": "application/json" } });
}
