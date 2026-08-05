# Changelog

Lightweight ongoing record per the Veridian AI Build to Launch directive. One entry per completed milestone: date, what shipped, bugs fixed, breaking changes, migrations, deployment notes, known issues, next task.

---

## 2026-08-05 — Immediate Founder Launch: unified Veridian AI application shell

**Completed work:**
- **New application shell** (`src/shell/Shell.jsx`) replaces the legacy `/app` route entirely. Global nav (Dashboard, Social, Connect, Settings, Support), workspace switcher, brand switcher, notifications bell (live pending-review count), an AI assistant slide-out panel (reuses the existing `/api/ai` proxy with a platform-wide system prompt — no new backend), and a user menu. One design system (`src/shell/theme.js`, promoted from Social's palette) used everywhere in the shell, so Social and Connect-the-doorway read as one product.
- **`/app` and `/social` both open the shell now** — Social is no longer a separate standalone page; it's the shell's default landing view and its "Social" nav section (brand list → brand detail → calendar/media/analytics). This was a deliberate anti-duplication call: keeping two divergent Social surfaces would have repeated the exact problem this whole restructure exists to fix for Connect.
- **`src/social/shared.jsx`**: CreateBrand, DraftCard, MediaLibrary, BrandDetail, and the live platform-connections panel extracted out of the old standalone `Social.jsx` into reusable pieces the shell imports directly — no logic duplicated between a "page" version and a "module" version.
- **Dashboard home** (`src/shell/DashboardHome.jsx`): the founder's landing screen — greeting, brand/pending-review/platforms-connected counts, a real pending-approvals feed pulled from actual content items (not placeholder widgets), and a brand grid. This is what satisfies the directive's "Today's Content / Pending Approvals / Brands / Connected Accounts / Quick Actions" list.
- **Connect module** (`src/shell/ConnectModule.jsx`): an honest doorway into Connect's real, already-PIN-protected command center at `/dashboard` — not a rebuilt or duplicated CRM/analytics UI. **Deliberate deviation from the directive's literal nav list**: "CRM" and "Analytics" were folded into "Connect" rather than built as separate nav items, because Connect's real leads/metrics data already lives behind its own PIN gate in `/dashboard`, and building disconnected placeholder CRM/Analytics screens would have recreated exactly the kind of fake, unmaintained UI the legacy `App.jsx` demo was (see `ops/veridian-platform-audit.md`).
- **Retired**: `src/App.jsx` (legacy OperaCore CRM demo — hardcoded plaintext credentials, zero real users, fully superseded), `src/db.js` (only ever imported by `App.jsx`), and the standalone `src/Social.jsx` (absorbed into the shell). Confirmed via grep that nothing else referenced any of the three before deleting; all fully recoverable from git history if ever needed.
- Renamed `package.json`/`package-lock.json` from `operacore-platform` to `veridian-ai-platform` — the old name was a leftover from the app that no longer exists.

**Bugs fixed:** none this entry (restructure, not a feature/bugfix pass).

**Breaking changes:** `/app`'s content changed completely (legacy demo → new shell) — intentional per this directive, zero real users depended on the old `/app`. `/social` no longer renders a standalone page; it renders the shell (same content, different chrome). **Nothing on the public site changed**: `/`, `/dashboard`, `/pricing`, `/privacy`, `/terms`, `/portal`, `/industries/*`, and every other `Website.jsx`-served route are byte-for-byte unmodified — verified via headless-browser smoke test that `/` still shows Connect's marketing content and `/dashboard` still shows its own independent PIN gate.

**Migrations:** none.

**Deployment notes:** no new env vars. Bundle went from 3 route chunks (App/Website/Social) to 2 (Shell/Website) — smaller, not larger, despite the shell doing more.

**Known issues:**
- Workspace switcher today only knows about Social workspaces — Connect has no workspace/tenant concept yet (it's still PIN-based, single-tenant), so it isn't part of the switcher. Becomes relevant once Connect moves onto the shared platform data model (Sprint 1 of `ops/veridian-platform-strategy.md`), not before.
- AI Assistant panel has no memory across page reloads (in-memory chat state only) and no awareness of Connect's data (it can't answer "how many leads did I get this week" — that's behind a separate PIN gate this shell doesn't have access to, by design).
- Still dev-mode auth — this shell makes the product experience feel unified, it does not change anything about the real-auth/billing/OAuth blockers listed in prior entries.

**Next engineering task:** same external blockers as before (Supabase Auth, Stripe, per-platform OAuth apps) for full activation. Unblocked and available: wire the Dashboard's "platforms connected" count and pending-review feed into a real push-notification or email digest once notification infra exists; consider whether Connect's leads data should eventually surface inside the shell (would need Connect to adopt real per-user auth first, not PIN-sharing, so this isn't a quick add).

## 2026-08-05 — Pilot Launch: video scripts, publishing pipeline, scheduling, media library

**Completed work:**
- Two more AI agents: `videoScript` (short-form Reels/TikTok/Shorts scripts — hook/beats/cta/on-screen-text) and `hashtags` (standalone regeneration per draft). 4 of the named AI-workforce roles now shipped.
- Draft generation is now platform-aware (7 pilot platforms + general) — the prompt adapts to each platform's real norms (X's 280-char limit, LinkedIn's tone, etc.).
- **Publishing pipeline abstraction**: `api/_lib/publishers/{facebook,instagram,tiktok,linkedin,youtube,x,pinterest}.js`, one file per platform behind a common `{platform, isConfigured(), publish()}` interface, plus `api/social/publish.js` (GET = live connection status, POST = attempt publish). Every adapter today returns `not_configured` — each carries the exact env vars and API endpoint it needs, so wiring in real credentials is additive, not a rewrite. This is the "integration-ready workflow" the directive asked for.
- Content scheduling (`scheduledFor`), draft edit history (`contentItems.updateWithHistory` — old captions preserved, not overwritten), a link-based media library per brand (`mediaAssets`), and a derived pending-review notification badge (`pendingReviewCount`) — all in `src/social/store.js`, no new infrastructure.
- Social.jsx: platform selector on generation, video-script generation UI, publish button that tries the real pipeline first and falls back to copy-to-clipboard with a clear reason ("Instagram isn't connected yet — copied for manual posting instead"), draft history viewer, media library tab, live connection-status list in Settings (real state from `/api/social/publish` GET, not a static claim).

**Bugs fixed:** hardened the client-side `generate()`/`attemptPublish()` calls against non-JSON responses (was throwing a confusing "Unexpected end of JSON input" instead of a clear message when the API layer isn't reachable — caught during this pass's own smoke testing).

**Breaking changes:** none.
**Migrations:** none — still localStorage-backed dev mode, no Supabase schema touched.
**Deployment notes:** zero new required env vars for what shipped. The publisher adapters document their real required env vars (e.g. `META_ACCESS_TOKEN` + `META_INSTAGRAM_ACCOUNT_ID` for Instagram) for when those are provisioned — setting them is the entire activation step, no code change needed on this side.
**Known issues:**
- Team permissions and billing were explicitly not built this pass — the pilot objective is the founder alone testing personal accounts, not a team or paying customers, so this didn't serve the stated goal yet.
- `publish()` bodies are stubs (`not_implemented`) even once `isConfigured()` would return true — the actual Graph/Content-Posting/Share/Data/Tweets/Pins API calls are TODO-marked, not implemented, since none of the 7 platforms' OAuth apps exist yet to test against.
- Media library has no real upload — URL-only, since file storage isn't provisioned.

**Next engineering task:** still blocked on the same founder-provided items as the prior entry (Supabase Auth project, Stripe keys, per-platform OAuth app registrations) for activation. Unblocked and available next: implement the real per-platform `publish()` API calls once even one OAuth app exists (recommend starting with whichever platform's review process is fastest — likely LinkedIn or X over Meta/TikTok); Sentry error tracking; ESLint config decision (flagged since Sprint 0b, still outstanding).

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
