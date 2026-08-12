export const config = { runtime: "edge" };

// Temporary diagnostic: replicates api/auth/session.js's exact PostgREST
// query with full error visibility (session.js swallows non-2xx into a
// generic null). Also runs two simpler queries to isolate whether the
// tables exist at all vs. the embedded-resource syntax specifically is
// the problem. Delete once diagnosis is complete.
export default async function handler(req) {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") || "00000000-0000-0000-0000-000000000000";

  async function q(label, path) {
    const r = await fetch(`${url}/rest/v1/${path}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: "application/json" },
    });
    const body = await r.text();
    return { label, status: r.status, ok: r.ok, body };
  }

  const [embeddedQuery, plainMemberships, plainOrganizations] = await Promise.all([
    q("embedded (what session.js runs)", `memberships?user_id=eq.${encodeURIComponent(userId)}&select=org_id,role,organizations(id,name)`),
    q("plain memberships", "memberships?limit=1"),
    q("plain organizations", "organizations?limit=1"),
  ]);

  return new Response(JSON.stringify({ embeddedQuery, plainMemberships, plainOrganizations }, null, 2), {
    headers: { "Content-Type": "application/json" },
  });
}
