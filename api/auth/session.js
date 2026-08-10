export const config = { runtime: "edge" };

import { isAllowedOrigin, corsHeaders } from "../_lib/cors.js";
import { getUser, bearerToken } from "../_lib/auth.js";
import { supabaseSelect, supabaseInsert } from "../_lib/supabase.js";

// Verifies the caller's access token, then ensures they belong to at least
// one organization — auto-provisioning a personal org + owner membership on
// a user's very first successful call (their first sign-in after signup).
// This is the org-bootstrap step from ops/veridian-platform-strategy.md's
// Sprint 1 ("organizations/memberships/RLS live").
export default async function handler(req) {
  const allowedOrigin = isAllowedOrigin(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(allowedOrigin, "GET, OPTIONS") });
  }
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }
  if (!allowedOrigin) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
  const cors = corsHeaders(allowedOrigin, "GET, OPTIONS");

  const token = bearerToken(req);
  const { ok, data } = await getUser(token);
  if (!ok || !data?.id) {
    return new Response(JSON.stringify({ error: "Invalid or expired session" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...cors },
    });
  }
  const user = { id: data.id, email: data.email };

  let memberships;
  try {
    memberships = await supabaseSelect(
      "memberships",
      `user_id=eq.${encodeURIComponent(user.id)}&select=org_id,role,organizations(id,name)`
    );
  } catch {
    memberships = null;
  }

  if (memberships === null) {
    // Supabase isn't configured in this environment — degrade honestly
    // (empty org list) rather than fabricate one.
    return new Response(JSON.stringify({ user, organizations: [], warning: "Organizations unavailable — Supabase not configured" }), {
      headers: { "Content-Type": "application/json", ...cors },
    });
  }

  if (memberships.length === 0) {
    try {
      const inserted = await supabaseInsert(
        "organizations",
        { name: `${user.email.split("@")[0]}'s workspace` },
        { returnRepresentation: true }
      );
      const org = inserted.skipped ? null : JSON.parse(inserted.body || "[]")[0];
      if (org) {
        await supabaseInsert("memberships", { org_id: org.id, user_id: user.id, role: "owner" });
        memberships = [{ org_id: org.id, role: "owner", organizations: { id: org.id, name: org.name } }];
      } else {
        memberships = [];
      }
    } catch (err) {
      return new Response(JSON.stringify({ error: `Could not provision an organization: ${err.message}` }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...cors },
      });
    }
  }

  const organizations = memberships
    .filter((m) => m.organizations)
    .map((m) => ({ id: m.organizations.id, name: m.organizations.name, role: m.role }));

  return new Response(JSON.stringify({ user, organizations }), {
    headers: { "Content-Type": "application/json", ...cors },
  });
}
