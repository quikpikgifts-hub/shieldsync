# Sprint 0b — Platform Stabilization Report

*Covers Task 4 (architecture layering) and Task 7 (updated readiness report) of the Sprint 0b charter. Tasks 1, 2, 3, 5, 6 have their own artifacts: `ops/veridian-data-architecture-audit.md`, the `api/_lib/` modules + `supabase/migrations/20260805000000_create_leads.sql`, and the verification run logged below.*

---

## What actually shipped this sprint

- **Closed the concrete split-brain gap** identified in Task 1 (Finding #1): `assessment.js` now writes every lead to Supabase as well as KV, via a shared `recordLead()` — assessment-sourced leads are no longer invisible to `/api/metrics`.
- **Wrote the missing `leads` table migration** (`supabase/migrations/20260805000000_create_leads.sql`), formalizing a schema that previously existed only as whatever was clicked together in the Supabase dashboard.
- **Consolidated duplicated logic** into `api/_lib/` — `kv.js`, `email.js`, `supabase.js`, `twilio.js`, `priority.js`, `ids.js`, `store.js`. Net effect across the 12 route files that used them: **-446 lines** (131 insertions, 577 deletions) while adding 645 lines of shared code that is now unit-tested (359 lines of tests, 32 passing).
- **Added a test runner** (Vitest) — the repo had zero tests before this sprint. The 32 tests cover the highest-risk consolidated logic: dual-write behavior, Twilio signature verification (against an independently-computed HMAC, not a tautological check), rate-limit fail-open behavior, and priority scoring.
- **Re-verified all five Sprint 0a security fixes survive the refactor** (see Task 6 log below) — nothing regressed while consolidating.

## Task 4 — Architecture layering

The layering the Sprint 0b charter asks for (Core Platform / Shared Services / Infrastructure / Product Modules / API / AI / Data / Presentation) is, at this codebase's actual size, mostly a **file-organization** concern rather than a runtime-boundary one — there's no server process to draw hard module boundaries in, only Vercel Edge Functions and a React SPA. Here's what that maps to concretely, and why `api/_lib/` was named that specifically (not arbitrarily):

```
api/_lib/          Shared Services + Data Layer (infra-facing, product-agnostic)
  kv.js              — Vercel KV client + rate limiter
  supabase.js        — Supabase REST client (insert/update/select)
  email.js           — Resend client + env-cleaning
  twilio.js          — Twilio SMS send + webhook signature verification
  store.js           — the single-source-of-truth write path for leads
  priority.js        — lead-scoring rules
  ids.js             — ID generation

api/*.js            Product Modules + API Layer (route handlers, business logic)
  contact.js, assessment.js, book.js, follow-up.js, leads.js, metrics.js
    — Veridian Connect's lead-gen funnel; each imports from _lib instead of
      re-implementing primitives
  chat.js, ai.js, voice.js
    — the AI Layer: each proxies to Anthropic (ai.js is the generalizable
      gateway pattern flagged in ops/veridian-platform-strategy.md Task 2 as
      the seed of a future shared AI Gateway — not consolidated into one
      gateway yet, since chat.js and ai.js currently serve different auth
      models (public chat widget vs. origin/PIN-gated), and forcing them
      together now would be exactly the kind of premature abstraction this
      sprint's own principles warn against)

src/                Presentation Layer
  Website.jsx        — Veridian Connect's customer-facing product
  App.jsx            — retired legacy demo, isolated via lazy-loading (Sprint 0a)
  db.js              — data layer for the retired demo only, not the live product
```

**`api/_lib/` isn't an arbitrary name** — Vercel's own convention excludes any `api/` path segment starting with `_` from being deployed as a routable serverless function. That means this is a real infrastructure boundary, not just a folder: code in `_lib/` is provably unreachable as an HTTP endpoint, which matters because some of it (Supabase service-role calls, Twilio auth token handling) would be a serious exposure if it were ever accidentally routable.

**What's deliberately not layered yet:** a real Core Platform (auth, billing, org model) doesn't exist — that's `ops/veridian-platform-strategy.md`'s Sprint 1/2, gated on the product-direction and live-verification work this sprint didn't touch. Sprint 0b's layering is honest about being "clean up what's here," not "build the platform."

## Task 6 — Security re-verification log

| Sprint 0a fix | Verified still intact | How |
|---|---|---|
| `DASH_PIN` fails closed (no `"0000"` fallback anywhere) | ✅ | `grep` confirms every `DASH_PIN` read site (`leads.js`, `metrics.js`, `ai.js`, `sms.js` ×2, `follow-up.js`) still has explicit `!expected \|\| expected === "0000"` (or equivalent) guards after the refactor |
| `api/voice.js` fails closed on missing `VAPI_SECRET` | ✅ | `!vapiSecret \|\| ...` guard unchanged |
| Twilio signature verification wired into `sms.js` / `missed-call.js` | ✅ | Both still call `verifyTwilioSignature` before trusting webhook params; now backed by 5 unit tests including an independently-computed-signature check |
| App.jsx demo credentials isolated from the shipped bundle | ✅ | Rebuilt and re-grepped: `Admin2030` present only in `App-*.js`, absent from `index-*.js`, `vendor-*.js`, `Website-*.js` |
| CSP header present | ✅ | Unchanged in `vercel.json` |

No regressions found. **Remaining risks** (unchanged from the original audit, not addressed this sprint — out of scope): `DASH_PIN` is still one shared secret with no per-user identity or attempt lockout; CORS is still `*` on most routes; no error tracking (Sentry) exists; the dashboard (`leads.js`) and metrics (`metrics.js`) still read from two different stores (the write-side gap is closed, the read-side consolidation is Sprint 0c, below).

## Task 7 — Updated readiness scores

| Category | Original audit | After Sprint 0a | After Sprint 0b | Why it moved |
|---|---|---|---|---|
| Overall Readiness | 55/100 | ~60/100 (estimated, not previously re-scored) | **68/100** | Data-integrity gap closed, real test coverage exists, duplication that was actively drifting is gone |
| Architecture | 45/100 | 45/100 | **58/100** | `_lib/` layer exists and is provably non-routable; still no real platform (auth/billing) layer — that's unchanged |
| Security | 40/100 | 70/100 | **70/100** | No security-relevant change this sprint (that was 0a's job); confirmed no regression |
| Scalability | 50/100 | 50/100 | **52/100** | Marginal — dual-write path is slightly more resilient (parallelized instead of serial-then-parallel), not a scalability redesign |
| Maintainability | 35/100 | 35/100 | **60/100** | Net -446 lines of duplicated route code, 32 passing tests where there were zero, one documented data-architecture map instead of tribal knowledge |
| Performance | 60/100 | 60/100 | **62/100** | `recordLead()` parallelizes the KV and Supabase writes that `contact.js` previously did serially — a small, real latency win, not a redesign |

**Technical debt remaining:** dashboard/metrics read-split (documented, not fixed — see Sprint 0c), no lint tooling (no config existed; adding one is a real decision about rule sets that wasn't made unilaterally this sprint), `chat.js`/`ai.js` still two separate AI proxy implementations rather than one gateway, no error tracking, `DASH_PIN` is still a single shared secret.

**Risks remaining:** identical list to the original audit's "High-risk areas" minus the five items Sprint 0a closed — i.e., the shared-secret admin auth model itself (not just its default value) is the largest remaining architectural risk, and it's a Sprint 1 (real auth) item per the strategy doc, not a Sprint 0c item.

## Recommended Sprint 0c

1. **Read-side cutover, with live verification.** This is the one piece of Task 2 this sprint deliberately did not finish: `leads.js` (KV) and `metrics.js` (Supabase) still read from different stores. Closing this requires an operator with real Vercel/Supabase credentials to run the two dashboards side-by-side against production data and confirm parity before switching `leads.js` to read Supabase — that verification can't be done from this sandbox.
2. **Consolidate `chat.js` and `ai.js` into one AI Gateway**, per `ops/veridian-platform-strategy.md`'s Task 2 design — deferred this sprint specifically because their auth models differ and merging them without that design work would be premature.
3. **Decide on lint tooling** (ESLint config, rule set) — flagged, not adopted, this sprint.
4. **Backfill script** for the pre-Sprint-0b assessment leads that exist only in KV, so historical data (not just new leads going forward) reaches Supabase — this needs the same live-credential access as item 1.

Items 1 and 4 are blocked on live production access this session doesn't have; 2 and 3 are pure engineering work and can start immediately.
