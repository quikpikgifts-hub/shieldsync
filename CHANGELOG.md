# Changelog

Lightweight ongoing record per the Veridian AI Build to Launch directive. One entry per completed milestone: date, what shipped, bugs fixed, breaking changes, migrations, deployment notes, known issues, next task.

---

## 2026-08-06 — Founder Alpha Completion Mode: reliability pass

Per the Founder Alpha Completion Mode directive: no new features, only fixes that reduce distance to the first successful AI-assisted post and improve daily-workflow reliability. Confirmed clean `npm run build` and 85/85 `npm run test` before and after, plus a headless-browser walkthrough of sign-in → workspace → brand → draft review with seeded data.

**Bugs fixed:**
- **Stale content after brand switch**: the topbar's "Jump to brand…" dropdown let the founder switch directly from one brand's detail view to another without leaving the page. `BrandDetail` (`src/social/shared.jsx`) initializes its content-list and media-library state with `useState(() => ...)`/`useMemo` scoped to the brand at mount time, and was rendered without a `key` in `src/shell/Shell.jsx` — so switching brands via the dropdown updated the header (brand name, voice, pending count) but left the previous brand's drafts on screen. Fixed by keying `<BrandDetail key={activeBrand.id} .../>` so React remounts cleanly on brand switch. Verified with seeded two-brand data: switching Alpha → Beta via the dropdown now shows only Beta's content.
- **No keyboard focus indicator on any form control**: `inputStyle` (`src/shell/primitives.jsx`) sets `outline: "none"` on every input/textarea/select with no replacement, across every form in the app (brand creation, draft editing, scheduling, media library). Added a `:focus-visible` outline rule to the shell's injected base stylesheet (`src/shell/theme.js`) — restores keyboard accessibility without changing the mouse-click appearance.
- **No error boundary**: an unhandled render exception anywhere in the tree (`Shell` or any child) would unmount the whole app to a blank white screen with no feedback and no recovery path. Added a top-level `ErrorBoundary` in `src/main.jsx` that shows a "Something went wrong" screen with a reload button and logs the error, instead of failing silently.

**Breaking changes:** none.

**Migrations:** none.

**Deployment notes:** nothing new required. Bundle sizes essentially unchanged (Shell chunk 45.79kB → 45.93kB gzip, `index` chunk +0.5kB for the error boundary).

**Known issues:** unchanged from prior entries — production deployment and TikTok credential activation remain founder-driven steps per `ACTIVATION.md`; not attempted here since neither requires or benefits from further engineering work.

**Next step:** founder-driven — deploy to production and complete the TikTok activation sequence in `ACTIVATION.md` §8.

## 2026-08-05 — Founder Activation: verification pass, single activation screen, ACTIVATION.md

Per the Founder Activation directive: no new product features, only what moves the founder closer to activating and posting. No redesign — the shell, Social product, and TikTok pipeline built in prior entries are unchanged in shape.

**Completed work:**
- **Full checklist verification pass** against the directive's 17-item list (auth, workspace, brand, generation, approval, publish, analytics, notifications, media library, draft history, calendar, TikTok status, offline behavior, error handling, website build, platform build, platform status indicators) — all confirmed working via build, 85 passing tests, and a headless-browser walkthrough with seeded data.
- **One real bug found and fixed**: reloading the page (browser refresh, reopened tab, phone screen lock) reset the workspace selection, forcing the founder back through the workspace picker every time. Now the last-used workspace is remembered (`lastWorkspace` in `src/social/store.js`) and restored automatically. This is a repair of existing broken behavior, not a new feature.
- **Single activation/configuration screen** (Settings, `SocialConnectionsPanel` in `src/social/shared.jsx`) — every provider now shows all 7 requested fields: Provider Name, Current Status, Required Credentials, Required Scopes, OAuth Status, Connection Status, Last Verification, and an Activation Button. Verified rendering with realistic mixed-state data (TikTok connected, Instagram configuration-required, 5 platforms waiting-for-credentials) via intercepted API responses — zero console errors, no fabricated status anywhere.
- **Real TikTok connection verification**: `verifyConnection()` now calls TikTok's own user-info endpoint to confirm a stored token actually works (not just that bytes are saved in KV), records a real `last_verified_at` timestamp and the connected account's display name, and surfaces both in the activation screen. New `api/social/verify.js` route.
- **`requiredScopes` added to every publisher** — previously only documented in code comments, now structured data the activation screen displays. Flagged in each file as needing verification against each provider's current docs before relying on them (provider scope names change).
- **`ACTIVATION.md`** — the single deployment-readiness reference: master env var table (every variable this codebase actually reads, grouped by what it powers), migration status, API/OAuth configuration, a security checklist recap, build/deploy process, a rollback plan, and the exact TikTok activation sequence consolidated in one place.

**Bugs fixed:** workspace-selection-lost-on-reload (see above).

**Breaking changes:** none. `listPublishers()`'s response shape gained fields (`requiredScopes`, `oauthAvailable`, `lastVerifiedAt`, `accountDisplayName`) — additive, nothing removed.

**Migrations:** none.

**Deployment notes:** nothing new required to deploy what's in this entry. See `ACTIVATION.md` for the complete picture of what's needed to activate each integration.

**Known issues:** unchanged from prior entries — no real auth, no billing, 6 of 7 platforms still lack a real OAuth/publish implementation (by design, TikTok-first per the Founder Alpha directive).

**Next engineering task:** per the directive, none until the founder has TikTok credentials and has attempted the real activation sequence in `ACTIVATION.md` §8. That first live post is Founder Alpha's completion criterion and the start of Private Beta — everything after that should be scoped from what actually happens during that test, not speculated now.

## 2026-08-05 — Founder Alpha: real TikTok pipeline, honest connection states, daily-workflow friction removal

**Completed work:**
- **Real TikTok integration** (`api/_lib/publishers/tiktok.js`) — no longer a stub. Real OAuth (`api/social/oauth/tiktok/{start,callback,disconnect}.js`), token storage + automatic refresh in KV (single-tenant by design — Founder Alpha assumes exactly one user, per the executive directive; revisit when a second real user exists), and a real Content Posting API `publish()` (PULL_FROM_URL init + status check). Defaults to `privacy_level: SELF_ONLY` since unaudited TikTok apps can't post publicly — this is correct, not a bug, until the app passes TikTok's review.
- **4-state connection status** replacing the old boolean everywhere: `Waiting for Credentials` → `Configuration Required` → `Ready to Activate` → `Connected` (`api/_lib/publishers/states.js`). TikTok is the only platform that can reach `Ready to Activate`/`Connected` today, honestly, because it's the only one with a real OAuth flow and `publish()` implementation — the other 6 top out at `Configuration Required` until the same work is done for them.
- Settings now shows a **"Connect account"** button for TikTok specifically once credentials are configured, and a live "Disconnect" action once connected.
- **Daily workflow friction removal**: TikTok is now the default and first-listed platform everywhere content is generated. Added rotating topic suggestions ("Surprise me") so the founder never faces a blank topic box. Added "Reuse as new draft" on published/rejected content. Dashboard's pending-review section is now a real **"Today's Tasks"** view with a second section — due-to-publish-today scheduled items with an inline one-click Publish action.
- **Offline honesty**: `generate()`/`attemptPublish()` detect `navigator.onLine === false` and fail with a clear "you're offline" message instead of a confusing network error; the shell shows a persistent offline banner distinct from any other error state.
- **TikTok OAuth redirect handling**: returning from `/api/social/oauth/tiktok/callback` shows a clear "connected" or "failed" banner in the shell instead of a silent return.

**Bugs fixed:** none (feature pass).

**Breaking changes:** `listPublishers()` is now async (was sync) and its API responses carry `state`/`label` fields; `configured` boolean is kept for compatibility but callers should move to `state`.

**Migrations:** none — TikTok tokens live in existing KV infrastructure under new keys (`veridian:social:tiktok:token`, `veridian:social:tiktok:oauth_state:*`).

**TikTok activation checklist (exactly what's needed once you have a TikTok Developer account):**
1. Register an app in the TikTok Developer Portal, enable the Content Posting API product, request the `video.publish` scope.
2. **Verify your deployment domain** in the portal (DNS TXT record or hosted file) — required for `PULL_FROM_URL` video sources; posts will fail without this even with valid credentials.
3. Set env vars: `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`, `TIKTOK_REDIRECT_URI` (must exactly match what's registered in the portal — e.g. `https://<your-domain>/api/social/oauth/tiktok/callback`).
4. In Settings, click "Connect account" next to TikTok once it shows "Ready to Activate."
5. Until the app passes TikTok's audit, posts are private (`SELF_ONLY`) — override via `TIKTOK_PRIVACY_LEVEL` only after approval for public posting.

**Known issues:**
- **None of the TikTok code has been exercised against a live TikTok account or app** — implemented against TikTok's documented v2 API shape and verified with mocked HTTP calls (9 tests), not live-tested. Treat the first real attempt as a test.
- The other 6 platforms (Instagram, Facebook, LinkedIn, YouTube, X, Pinterest) still have stub `publish()` bodies — same pattern as TikTok, not yet built out.
- Team permissions, agency tools, white-label, and multi-user administration remain deliberately unbuilt — Founder Alpha assumes exactly one user, per this directive.

**Next engineering task:** the founder testing the actual TikTok connect-and-publish flow live is the highest-value next step once a TikTok Developer account exists — that will surface whatever the documented API shape got wrong in practice. After that: replicate the same OAuth+publish pattern for a second platform (Instagram or X are the next likely candidates), or continue founder-usability polish if TikTok alone is still the day-to-day loop.

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
