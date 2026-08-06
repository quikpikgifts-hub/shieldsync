// Sprint 0b — single-source-of-truth write layer for leads.
//
// See ops/veridian-data-architecture-audit.md, Finding #1: assessment.js
// previously wrote leads to KV only, never to Supabase — meaning every
// assessment-sourced lead was invisible to /api/metrics (which reads
// Supabase exclusively). recordLead() is now used by both contact.js and
// assessment.js so every lead reaches both stores, closing that gap.
//
// Reads (the dashboard in leads.js, metrics.js) are NOT switched to a single
// store in this pass — that requires verifying data parity against live
// production data, which this environment has no credentials to do safely.
// See ops/veridian-sprint-0b-report.md for the Sprint 0c cutover runbook.
//
// KV remains authoritative for the follow-up cron queue (veridian:fu:*) —
// that's ephemeral scheduling state, not a business record, and is out of
// scope for "single source of truth."

import { kv } from "./kv.js";
import { supabaseInsert } from "./supabase.js";

export async function recordLead(entry) {
  const kvWrite = Promise.allSettled([
    kv("SET", `veridian:lead:${entry.leadId}`, JSON.stringify(entry)),
    kv("LPUSH", "veridian:leads", JSON.stringify(entry)),
  ]);

  const sbRow = {
    lead_id: entry.leadId,
    name: entry.contact?.name || null,
    business: entry.contact?.business || null,
    email: entry.contact?.email || null,
    phone: entry.contact?.phone || null,
    challenge: entry.challenge || null,
    priority: entry.priority || null,
    status: "new",
    notes: entry.notes || null,
  };
  const sbWrite = supabaseInsert("leads", sbRow).catch((err) => ({ ok: false, error: err.message }));

  const [kvResult, sbResult] = await Promise.all([kvWrite, sbWrite]);
  return { kvResult, sbResult };
}

const FOLLOWUP_DELAYS_MS = {
  "24h": 86400000,
  "3d": 259200000,
  "7d": 604800000,
  "14d": 1209600000,
};

export async function scheduleFollowUps(leadId, sequenceKeys) {
  const now = Date.now();
  return Promise.allSettled(
    sequenceKeys.map((key) => kv("ZADD", `veridian:fu:${key}`, String(now + FOLLOWUP_DELAYS_MS[key]), leadId))
  );
}
