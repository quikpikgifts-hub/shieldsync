export const config = { runtime: "edge" };

// Temporary forensic endpoint — diagnoses the live "internal error" on
// /api/auth/signup by inspecting exactly what the runtime sees. Reports
// presence/length only for secret vars (never content). NEXT_PUBLIC_* vars
// are safe to echo in full — that prefix means they're already public by
// design (same convention used throughout this codebase). Delete this file
// once the root cause is confirmed; it is not meant to be permanent infra.
export default async function handler(req) {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const rawServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const rawAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const url = rawUrl.replace(/^=+/, "").trim();
  const serviceKey = rawServiceKey.replace(/^=+/, "").trim();

  const report = {
    vars: {
      NEXT_PUBLIC_SUPABASE_URL: { present: Boolean(rawUrl), rawLength: rawUrl.length, value: url },
      SUPABASE_SERVICE_ROLE_KEY: { present: Boolean(rawServiceKey), rawLength: rawServiceKey.length },
      SUPABASE_ANON_KEY_or_NEXT_PUBLIC_SUPABASE_ANON_KEY: { present: Boolean(rawAnonKey), rawLength: rawAnonKey.length },
    },
  };

  let urlValid = false;
  try {
    const u = new URL(url);
    urlValid = true;
    report.urlSyntax = { valid: true, protocol: u.protocol, host: u.host };
  } catch (e) {
    report.urlSyntax = { valid: false, error: e.message };
  }

  async function probe(label, target, init) {
    const start = Date.now();
    try {
      const r = await fetch(target, init);
      const bodyText = await r.text().catch(() => "");
      return { label, reached: true, status: r.status, ok: r.ok, durationMs: Date.now() - start, bodySnippet: bodyText.slice(0, 300) };
    } catch (e) {
      return {
        label,
        reached: false,
        durationMs: Date.now() - start,
        errorName: e?.name,
        errorMessage: e?.message,
        errorCause: e?.cause ? { name: e.cause.name, message: e.cause.message, code: e.cause.code, nestedCause: e.cause.cause ? String(e.cause.cause) : null } : null,
        errorStack: e?.stack || null,
      };
    }
  }

  // Control probes against hosts unrelated to Supabase — if these ALSO fail
  // identically, the problem is outbound fetch from this Edge Function in
  // general, not this specific Supabase project.
  const controlProbes = [
    probe("control: api.github.com", "https://api.github.com", { method: "GET" }),
    probe("control: example.com", "https://example.com", { method: "GET" }),
  ];

  report.probes = urlValid
    ? await Promise.all([
        probe("base-host-root", url, { method: "GET" }),
        probe("gotrue-settings (what api/_lib/auth.js hits)", `${url}/auth/v1/settings`, { headers: { apikey: serviceKey } }),
        probe("postgrest-root (what api/_lib/supabase.js hits)", `${url}/rest/v1/`, { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }),
        ...controlProbes,
      ])
    : [{ label: "skipped", reason: "URL failed syntax validation, see urlSyntax above" }, ...(await Promise.all(controlProbes))];

  return new Response(JSON.stringify(report, null, 2), { headers: { "Content-Type": "application/json" } });
}
