# Changelog

Lightweight ongoing record per the Veridian AI Build to Launch directive. One entry per completed milestone: date, what shipped, bugs fixed, breaking changes, migrations, deployment notes, known issues, next task.

---

## 2026-08-04 — Sprint 0a: Security patch

**Features/fixes:**
- `DASH_PIN` fails closed everywhere instead of defaulting to `"0000"`.
- `api/voice.js` (Vapi webhook) fails closed when `VAPI_SECRET` is unset.
- Added Twilio request-signature verification (`api/_lib/twilio.js`) to `sms.js` and `missed-call.js`.
- `main.jsx` lazy-loads `App.jsx`/`Website.jsx` as separate bundles — `App.jsx`'s hardcoded demo credentials no longer ship to every site visitor.
- Added a first-pass Content-Security-Policy header.

**Breaking changes:** none (all changes are stricter defaults, not API shape changes).
**Migrations:** none.
**Deployment notes:** requires a real `DASH_PIN` to be set in Vercel — the dashboard/SMS-send/metrics endpoints will refuse all requests (correctly) until it is.
**Known issues:** Twilio signature verification requires the deployed URL to exactly match what's configured in the Twilio console — untested against a live Twilio request.
**Next task:** Sprint 0b.

---

## 2026-08-04 — Sprint 0b: Platform stabilization & architecture consolidation

**Features/fixes:**
- Closed a real data gap: `assessment.js` leads now reach Supabase (previously KV-only, invisible to `/api/metrics`), via a shared `recordLead()` write path.
- Consolidated duplicated `kv()`/`sendEmail()`/`supabaseInsert()`/priority-scoring/rate-limit logic into `api/_lib/` — net -446 lines across 12 route files.
- Added Vitest — 32 tests, first test coverage in the repo.

**Breaking changes:** none.
**Migrations:** `supabase/migrations/20260805000000_create_leads.sql` (formalizes a table that already existed live, undocumented).
**Deployment notes:** none beyond the migration — additive, no env var changes.
**Known issues:** dashboard (`leads.js`, reads KV) and metrics (`metrics.js`, reads Supabase) still read from two different stores — read-side cutover deferred to Sprint 0c pending live-data parity verification this environment can't perform.
**Next task:** Sprint 0c (AI gateway consolidation, unblocked) + Veridian Social build-out.

---

## 2026-08-04 — Build to Launch: AI gateway consolidation + Veridian Social MVP

**Features completed:**
- Extracted `callAnthropic()` into `api/_lib/ai-gateway.js`, shared by `api/ai.js`, `api/chat.js`, and the new `api/social/generate.js` — no change to either existing endpoint's request/response contract.
- **Veridian Social MVP is live in dev mode at `/social`** (own lazy-loaded bundle, doesn't touch Connect's `/` or the legacy `/app`):
  - Dev-mode sign-in (`src/social/store.js` `devAuth`) — explicitly labeled as a stand-in for real auth, not production-hardened.
  - Workspace creation, brand creation with AI-generated brand voice (`brandVoice` agent).
  - AI draft generation (`drafts` agent — Content Strategist + Copywriter combined per the MVP scope in `ops/veridian-platform-strategy.md`), 3 drafts per topic.
  - Approval workflow: draft → approve / edit-and-approve / reject.
  - Manual publish: "Copy & mark published" (clipboard + status update) — real platform publishing (Instagram/TikTok/LinkedIn APIs) is out of scope until OAuth app credentials exist for each platform.
  - Basic analytics tab (status counts per brand).
  - Settings tab stubs for social-account connections and billing, both explicit about what's blocking them (OAuth app review; Stripe keys) rather than faking functionality.
- New AI agent registry (`api/_lib/agents.js`) — 2 of the 10 named "AI workforce" roles shipped (Brand Strategist, Content Strategist/Copywriter combined); the other 8 are deferred, per the strategy doc's own simplification pass, not an oversight.
- 15 new tests (47 total, up from 32) covering the gateway, agents, and the Social data layer.

**Bugs fixed:** none this entry (net-new feature work).
**Breaking changes:** none.
**Migrations:** none — Social's data layer is localStorage-backed dev-mode, same convention as `src/db.js`; no Supabase schema changes.
**Deployment notes:** Social's UI and data layer work today with zero new environment variables. AI generation (`brandVoice`, `drafts` agents) needs `ANTHROPIC_API_KEY`, which already exists as required infra for Connect — no new credential type. Nothing in this entry has been deployed; it's built and verified on the working branch only (build passes, 47/47 tests pass, headless-browser smoke test of the full sign-in → workspace → brand flow passes with zero console errors).

**Known issues / explicitly out of scope until credentials exist (see below):**
- No real user authentication (Supabase Auth needs a live project).
- No billing (Stripe needs a live account + keys).
- No real social-platform publishing (each platform needs a registered, reviewed OAuth app).
- Not deployed to any live URL.
- `api/social/generate.js` has not been exercised over real HTTP — plain `vite dev` doesn't serve Vercel Edge Functions (confirmed this is true for the already-live `api/ai.js` too, not new). Verified via direct module import + Vitest with mocked `fetch` instead; real HTTP verification needs `vercel dev` or an actual deployment.

**Next engineering task:** blocked on founder-provided credentials (Supabase project, Stripe keys, social OAuth app registrations) and a deployment decision — see the blockers list below. Unblocked next steps: wire up a real "connect social accounts" OAuth flow once app credentials exist; add Sentry error tracking; decide on ESLint config (flagged since Sprint 0b, still not adopted).
