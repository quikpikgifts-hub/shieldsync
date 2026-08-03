# Veridian Platform — Engineering Audit & Readiness Report

*Phase 1–2 deliverable only (Complete Platform Audit + Executive Readiness Report), scoped to match this session's branch (`claude/veridian-platform-audit-hbm3su`). Phases 3–12 of the master build prompt (rebrand, SaaS foundation, Veridian Social product build, AI workforce, billing) are NOT attempted here — see "Scope & why" at the end.*

*Audit method: direct inspection of every file in the repo (no assumptions), same standard used by the existing `ops/` documents.*

---

## Executive Summary — read this first

**The repo does not contain what the build prompt describes, and it does not contain what `CLAUDE.md`/`README.md` describe either. There are four different products layered in one repo:**

1. **`README.md` says:** "ShieldSync" — a vanilla HTML/JS + Firebase Auth/Firestore physical-security app. **This does not exist in the current code.** No Firebase anywhere in the repo.
2. **`CLAUDE.md` says:** "ShieldSync Sentinel" — a React 19 physical-security ops dashboard (officers, incidents, fleet, dispatch). **This also does not match `src/App.jsx`.** Close in spirit (React + inline design tokens) but the actual modules, data model, and business domain are different.
3. **What's actually live (`src/Website.jsx` + `api/*.js`, per `ops/*.md`):** **Veridian Risk Group** — a real lead-generation and revenue-recovery consulting business: missed-call SMS text-back (Twilio), an AI voice receptionist (Vapi + Claude), a revenue-loss calculator, an assessment funnel, consultation booking, GoHighLevel CRM sync, and a PIN-gated leads dashboard. This has its own beta-launch checklist, sales scripts, and objection-handling docs and is genuinely close to first-customer-ready.
4. **What this session's task prompt asks for:** "Veridian Social" — a multi-tenant AI social-media-marketing SaaS (workspaces, brands, content calendars, AI content generation, publishing pipelines, an "AI workforce" of specialized agents, Stripe billing). **Zero code overlap with what exists.** Nothing in the repo generates social content, manages brands, or schedules posts.

There's also a fifth artifact: `src/App.jsx`, an unrelated **"OperaCore" multi-tenant CRM demo** with hardcoded seed data and **plaintext passwords compiled into the client bundle** (see Security, below). It's mounted at `/app` by `src/main.jsx` but is disconnected from the real Veridian Risk Group business logic in `api/*.js`.

**Bottom line:** before any of Phases 3–12 make sense, someone needs to decide *which business this repo is actually building* — Veridian Risk Group (the thing that's 80% done and has sales collateral) or Veridian Social (the thing described in the prompt, which is unstarted). This audit scores the codebase as it exists, and flags that mismatch as the single highest-priority finding.

---

## Phase 1 — Complete Platform Audit

| Component | Classification | Why |
|---|---|---|
| `api/contact.js`, `api/assessment.js`, `api/book.js` | ✅ Reuse As-Is | Core lead-capture funnel. Validates input, has rate limiting, graceful degradation when integrations aren't configured, dual-writes with error visibility. Functionally solid. |
| `api/follow-up.js` | ✅ Reuse As-Is | 4-stage drip sequence (24h/3d/7d/14d), unsubscribe check, cron + manual trigger. Well-scoped. |
| `api/sms.js`, `api/missed-call.js` | 🟡 Refactor | Works, but **no Twilio request-signature verification** (`X-Twilio-Signature`) — anyone who discovers the URL can POST fake inbound SMS/call payloads and trigger the autoresponder or fake Supabase writes. |
| `api/voice.js` (Vapi webhook) | 🟡 Refactor | Same class of issue: `VAPI_SECRET` check is present but optional (`if (vapiSecret && ...)` — if the env var isn't set, the endpoint is wide open). Should fail closed, not open. |
| `api/ai.js`, `api/chat.js` | 🟡 Refactor | Both proxy Anthropic correctly and cap token/history size. Two near-duplicate implementations of the same proxy pattern (one origin-gated, one not) — should be one shared module. `ai.js` also references model `claude-sonnet-4-6`, which doesn't match any current model ID; verify this is intentional before relying on it. |
| `api/leads.js`, `api/metrics.js` | 🔴 Replace (auth) / 🟡 Refactor (logic) | Both correct in isolation, but **read from two different stores** — `leads.js` reads Vercel KV, `metrics.js` reads Supabase Postgres. There is no reconciliation between them, so the leads dashboard and the metrics dashboard can disagree about the same lead. |
| Shared helpers (`kv()`, `sendEmail()`, `supabaseInsert()`, `cleanEnv()`, `mkId()`) | 🔴 Replace (structure) | Copy-pasted near-verbatim into 6+ separate `api/*.js` files instead of a shared `api/_lib/` module. Real maintenance risk: a bug fix (e.g. the `PLACEHOLDERS` env-var guard in `supabaseInsert`) has to be manually propagated to every copy, and some copies have already drifted (e.g. `book.js`'s version has the placeholder guard, `contact.js`'s doesn't in the same way). |
| Admin auth (`DASH_PIN`) | 🔴 Replace | A single static PIN (default `"0000"`, per `ops/env-checklist.md`) gates the leads dashboard, SMS send, metrics, and cron trigger. No per-user identity, no lockout/backoff on guesses, and it's shared across every admin surface. Acceptable as a stopgap for a 1–2 person beta team; not defensible past that. Their own `ops/first-customer-audit.md` already flags this as CRITICAL. |
| `src/App.jsx` ("OperaCore" CRM demo) | 🔴 Replace | 2,706-line hardcoded multi-tenant CRM demo with **fake auth comparing plaintext passwords in client-side JS** (`SU.find(x=>x.email===email && x.password===pw)`, `ops/App.jsx:274`). Because `main.jsx` imports both `App` and `Website` unconditionally, **these plaintext demo passwords ship inside the production JS bundle served to every real visitor**, readable via view-source, even though real customers never hit `/app`. This is a shippable-today fix (route-split or delete). |
| `src/db.js` | 🟡 Refactor | Reasonable `list/get/insert/update/remove` shape (matches the Supabase JS client, per its own comment), but it's the data layer for the unused `App.jsx` demo — it is **not** what the real business (`Website.jsx` + `api/*.js`) uses. The real business writes directly to Vercel KV and Supabase from edge functions with no shared abstraction. Two data layers, only one connected to real traffic. |
| Storage: Vercel KV vs Supabase | 🔴 Replace (consolidate) | Leads and bookings are written to **both** Upstash-backed KV (lists/strings, no query capability, used for follow-up queues + PIN dashboard) **and** Supabase Postgres (relational, used by `metrics.js` and the duplicate-booking guard in `book.js`). No single source of truth. `supabase/migrations/` only has a `bookings` table migration — the `leads` table that `contact.js`/`assessment.js`/`metrics.js` write to and query has **no migration file in the repo**, meaning schema exists only in the live Supabase project, undocumented and unreproducible. |
| `src/Website.jsx` | 🟡 Refactor | The real, working funnel (assessment → calculator → contact → booking → AI recovery plan). Functionally reasonable per `ops/first-customer-audit.md`'s own walkthrough. Structurally: 2,785 lines in one file, inline styles, no component tests. Works, but every future feature will be a diff against a 2.7k-line file. |
| `vercel.json` | 🟡 Refactor | Sensible security headers (`X-Frame-Options`, `nosniff`, referrer policy, permissions policy) and asset caching. Missing a `Content-Security-Policy`. Single daily cron (`/api/follow-up` at 09:00 UTC) — fine at current scale. |
| CORS policy | 🟡 Refactor | Inconsistent: `api/ai.js` does real origin allowlisting; `chat.js`, `sms.js`, `missed-call.js`, `contact.js`, `book.js`, `assessment.js` all send `Access-Control-Allow-Origin: "*"`. Should be consistent, especially for endpoints that accept PIN-authenticated admin actions. |
| Secrets handling | ✅ Reuse As-Is | No hardcoded API keys or secrets found in source; everything reads from `process.env`. Good baseline. |
| `ops/*.md` (sales scripts, beta checklist, launch checklist, env checklist, first-customer audit) | ✅ Reuse As-Is | Genuinely the strongest asset in the repo — accurate, cross-verified against the actual code (their own stated method), and internally consistent with each other. This is real, usable go-to-market collateral for Veridian Risk Group. |
| `README.md` | 🔴 Replace | Describes a Firebase-based vanilla-JS app that doesn't exist in this repo at all. Actively misleading to a new contributor. |
| `CLAUDE.md` | 🔴 Replace | Describes a third, different physical-security dashboard product, also not what's in the repo. Also actively misleading. |
| Testing | 🔴 Replace (build from zero) | No test files, no test runner configured, no CI config found anywhere in the repo. 0% coverage on ~8,200 lines of application code + 10 API routes handling money-adjacent logic (lead priority scoring, booking dedup, follow-up sequencing). |
| Billing/Stripe | 🔴 Build net-new | No billing code exists. Current model is fully manual/proposal-based (`ops/service-packages.md`). Nothing to reuse for Phase 10's recurring-subscription requirement. |
| "Veridian Social" surface (workspaces, brands, content calendar, AI content gen, publishing pipeline, AI workforce agents) | 🔴 Build net-new | No code, no data model, no UI exists for any of this. Not a refactor target — it is an unstarted product. |

---

## Phase 2 — Executive Engineering Report

Scored against "production-ready SaaS for the product that actually exists" (Veridian Risk Group), not against the unstarted Veridian Social vision — scoring the latter would show ~5–10% reuse (only the Anthropic-proxy pattern, Vercel Edge/KV deployment shape, and env-var-driven config are transferable).

| Category | Score | Rationale |
|---|---|---|
| **Overall Readiness** | **55 / 100** | Functionally close to first-customer-ready per the team's own `ops/beta-launch-checklist.md` ("CONDITIONAL GO" — blocked on env var configuration, not code). Architecturally fragile underneath. |
| Architecture | 45 / 100 | Two unrelated frontend apps in one bundle, two unreconciled data stores, no shared API lib, three contradictory sets of docs. |
| Security | 40 / 100 | Static shared admin PIN, unauthenticated Twilio/Vapi webhook paths under missing-env conditions, plaintext demo credentials shipped in the client bundle, inconsistent CORS. No secrets leakage — that part is clean. |
| Scalability | 50 / 100 | Edge Functions + KV are fine at current (pre-launch) volume. Shared static PIN and per-route hand-rolled rate limiting won't hold past a handful of concurrent admins; daily-cron follow-up doesn't scale past low lead volume without a real queue. |
| Maintainability | 35 / 100 | 8,228 lines of app code, two files over 2,700 lines each, zero componentization, zero tests, duplicated helper functions across 6+ API files that have already started to drift from each other. |
| Performance | 60 / 100 | Edge runtime, minimal dependencies, no heavy client bundle concerns — runtime performance is fine. Developer velocity is the actual cost of the large single-file components. |

**Technical debt: HIGH.**
Concretely: (1) duplicated `kv()`/`sendEmail()`/`supabaseInsert()`/`cleanEnv()` implementations across 6+ files with observable drift between copies, (2) two data stores of record for the same entities with no reconciliation, (3) an entire unused legacy app (`App.jsx`) shipped into every visitor's bundle, (4) three mutually contradictory top-level docs (`README.md`, `CLAUDE.md`, and the real product), (5) an undocumented Supabase `leads` table schema that exists only in production.

**Deployment readiness:** Matches the team's own `ops/beta-launch-checklist.md` verdict — **CONDITIONAL GO**, gated entirely on Vercel environment variables (`KV_REST_API_URL/TOKEN`, `DASH_PIN`, `RESEND_API_KEY`, `CRON_SECRET`, GoHighLevel keys) being set and end-to-end tested, not on further code work, for the Veridian Risk Group product as it stands.

**Estimated engineering effort:**
- Hardening the *existing* Veridian Risk Group product to a defensible production state (fix PIN auth, add Twilio signature verification, consolidate storage, dedupe API helpers, add a minimal test suite, fix the docs): **~1–2 weeks, one engineer.**
- Building the "Veridian Social" product described in the master prompt (multi-tenant SaaS foundation, brand/workspace model, AI content-generation workforce, publishing pipeline, Stripe billing, analytics): **effectively a new product — months, not a sprint,** and shares almost no code with what's here today.

**High-risk areas (ranked):**
1. `DASH_PIN` default `"0000"` gating the leads dashboard, SMS-send, and metrics endpoints — publicly reachable, no lockout.
2. `api/voice.js` fails **open** (not closed) when `VAPI_SECRET` is unset.
3. No Twilio signature verification on `api/sms.js` / `api/missed-call.js` — inbound webhook payloads are trusted unauthenticated.
4. Plaintext credentials for the `App.jsx` demo compiled into the public production bundle.
5. Split-brain lead/booking data between KV and Supabase with no reconciliation — silent data disagreement risk, not just a style issue.

**Quick wins (can ship today, no architecture change):**
1. Set a real `DASH_PIN`, add attempt lockout.
2. Make the Vapi/Twilio webhook auth fail-closed when the secret env var is missing, and add Twilio signature verification.
3. Remove or route-split `App.jsx` out of the production bundle so plaintext demo passwords stop shipping to every visitor.
4. Extract the duplicated `kv()`/`sendEmail()`/`supabaseInsert()`/`cleanEnv()` helpers into one `api/_lib/` module.
5. Add a `Content-Security-Policy` header in `vercel.json`.
6. Rewrite `README.md` and `CLAUDE.md` to describe the product that actually exists.

**Recommended sprint order:**
- **Sprint 0 (security patch, days):** items 1–3 above, in that order.
- **Sprint 1 (consolidation, ~1 week):** pick one data store of record (Supabase, since it's relational and already holds the authoritative `leads`/`bookings` tables per the dedup logic in `book.js`), migrate KV to cache/queue-only duty, dedupe API helpers, commit the missing `leads` table migration.
- **Sprint 2 (quality floor, ~1 week):** stand up a minimal test harness (e.g. Vitest) covering the 10 API routes' request-validation and priority-scoring logic, since none of that is covered today and it's the layer most likely to silently misfire.
- **Decision point (business, not engineering):** confirm whether the company is scaling Veridian Risk Group or pivoting to Veridian Social as described in the master prompt — this determines whether Phases 3–12 of that prompt apply to this repo at all, or whether they describe a separate, new build.
- **Sprint 3+:** only after that decision — scope the actual SaaS-foundation work (multi-tenant model, billing, and if applicable, the Veridian Social feature set) against whichever product was chosen.

---

## Scope & why

This session's branch is named `claude/veridian-platform-audit-hbm3su`, and the task prompt itself is Phases 1–12 of a multi-month product build (full platform rebrand, new SaaS foundation, a brand-new AI-social-media product, an AI agent workforce, Stripe billing, full test suites, and a deployment pipeline for all of it). That is not achievable, or honestly gradable, in one sitting — attempting it would produce shallow scaffolding claimed as "done" across a dozen areas rather than a real deliverable in any one of them.

This document delivers Phases 1 and 2 only: a verified audit of what's actually in the repository, and the executive readiness report the prompt asks for. It intentionally stops before Phase 3 (rebranding) because the audit surfaced that the repo's real product, its documentation, and the task prompt's target product are three different things — proceeding to rebrand/rebuild without resolving that would mean guessing at the most consequential decision in the whole prompt instead of asking for it.
