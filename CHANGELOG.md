# Changelog

Lightweight ongoing record per the Veridian AI Build to Launch directive. One entry per completed milestone: date, what shipped, bugs fixed, breaking changes, migrations, deployment notes, known issues, next task.

---

## 2026-08-10 — Sprint 6 (cont.): real YouTube OAuth + publish (6th platform, Pinterest is now the only one left)

**Completed work:**
- **`api/_lib/publishers/youtube.js`**: real OAuth 2.0 flow (`access_type=offline&prompt=consent` to guarantee a `refresh_token`), KV-backed token storage, and a real resumable-upload `publish()`. This one has a genuine structural difference from every other platform here: YouTube's upload API has no "give me a URL and I'll fetch it" option like TikTok's `PULL_FROM_URL` or Instagram's `image_url` — the video bytes must be PUT by the caller. `publish()` HEADs `mediaUrl` for its size/content-type, initiates a resumable session, then re-fetches the media and **streams** the response body straight into the upload PUT (`body: mediaRes.body`, a `ReadableStream`) rather than buffering the whole video into memory first — matters on an Edge runtime with real memory/time limits.
- Defaults uploads to `privacyStatus: "private"` (override via `YOUTUBE_PRIVACY_STATUS`) — same "don't post publicly until proven" caution as TikTok's `SELF_ONLY` default.
- Channel display name learned via `/youtube/v3/channels?mine=true`, called automatically right after the OAuth callback saves the token (same pattern as LinkedIn's author-URN lookup).
- `Shell.jsx`'s `OAUTH_REDIRECT_PLATFORMS` extended; no other UI changes needed (already generalized).

**Bugs fixed:** none (feature pass).

**Breaking changes:** none — the old stub's `publish()` also took `userAccessToken` directly; nothing external called it.

**Migrations:** none — tokens in KV under `veridian:social:youtube:token`, `veridian:social:youtube:oauth_state:*`.

**Deployment notes:** no new required env vars for what shipped — `GOOGLE_CLIENT_ID`/`SECRET`/`REDIRECT_URI` only needed at activation (`ACTIVATION.md`). 172/172 tests pass (13 new), build clean.

**Known issues:**
- Not live-tested, same caveat as every platform here.
- The `youtube.upload` scope is sensitive in Google's OAuth consent screen review process — expect a verification step before non-test users can grant it.
- The streamed-upload approach hasn't been exercised against a real large video file in the actual Vercel Edge runtime; if Edge's execution-time or streaming-body limits turn out to be a problem for large files in practice, that's the first thing to check once real testing starts.
- **Pinterest is now the only platform left with a stub `publish()`** — the 7-platform pilot set from Pilot Launch's original scope is 6/7 real.

**Next engineering task:** Pinterest completes the set — or Sprint 5 (billing goes live) once a founder pricing decision exists, which is now genuinely the largest remaining piece of the original roadmap.

## 2026-08-10 — Sprint 6 (cont.): real LinkedIn OAuth + publish

Fifth real platform, fourth on the TikTok/X-style real OAuth-flow pattern (Facebook/Instagram used the static-token pattern instead — see their entry below).

**Completed work:**
- **`api/_lib/publishers/linkedin.js`**: real OAuth 2.0 flow (`api/social/oauth/linkedin/{start,callback,disconnect}.js`), KV-backed token storage, and a real `POST /rest/posts` `publish()` (current LinkedIn Posts API — `LinkedIn-Version`/`X-Restli-Protocol-Version` headers, response id read from the `x-restli-id` header per LinkedIn's documented shape, not the body).
- **Author URN handling**: LinkedIn's Posts API requires the author as a URN (`urn:li:person:{id}`), which the OAuth token response doesn't include — `verifyConnection()` (via `/v2/userinfo`, OpenID Connect) learns and stores it, and the OAuth callback calls it automatically right after saving the token so the founder can publish immediately without a separate manual "Verify connection" click first.
- **Refresh handled the same way as X**: attempts a `refresh_token` grant if one is present, otherwise degrades to `account_not_connected` once the (typically ~60-day) access token expires — standard LinkedIn tokens aren't refreshable without separate app approval for programmatic refresh tokens.
- `Shell.jsx`'s `OAUTH_REDIRECT_PLATFORMS` and the Settings connections panel (already generalized in the earlier X entry) needed no further changes to support a third OAuth-flow platform — that generalization is now paying for itself.

**Bugs fixed:** none (feature pass).

**Breaking changes:** none. Note for anyone who read the old stub's signature: `publish()` changed from `{ caption, hashtags, mediaUrl, userAccessToken, authorUrn }` (both passed in per-call) to `{ caption, hashtags }` (both now come from the KV-backed store), same shift TikTok/X already made — nothing external called the old stub shape.

**Migrations:** none — LinkedIn tokens live in KV under new keys (`veridian:social:linkedin:token`, `veridian:social:linkedin:oauth_state:*`).

**Deployment notes:** no new required env vars for what shipped (`LINKEDIN_CLIENT_ID`/`SECRET`/`REDIRECT_URI` only needed at actual activation — `ACTIVATION.md`). 159/159 tests pass (13 new), build clean.

**Known issues:**
- Not live-tested — same caveat as every platform here: implemented against LinkedIn's documented OIDC + Posts API shape, verified with mocked HTTP calls.
- Both LinkedIn products (Sign In with OpenID Connect, Share on LinkedIn) require app-level approval before the required scopes are grantable — expect an approval wait before first real activation.
- YouTube and Pinterest still have stub `publish()` bodies — the only 2 platforms left.

**Next engineering task:** YouTube or Pinterest complete the 7-platform pilot set from Pilot Launch's original scope; after that, or in parallel, Sprint 5 (billing goes live) once a founder pricing decision exists.

## 2026-08-10 — Sprint 6 (cont.): real Facebook + Instagram publish (Meta Graph API)

Third and fourth real platforms, both on Meta's Graph API — done together since they share one API surface. Unlike TikTok/X, these use a pre-obtained long-lived access token rather than an in-app OAuth flow (Meta's own recommended pattern for single-Page/account use, and it avoids App Review for anything beyond your own Page/account).

**Completed work:**
- **`api/_lib/publishers/facebook.js`**: real `publish()` — text posts to `/{page-id}/feed`, photo posts (with caption) to `/{page-id}/photos` when a `mediaUrl` is given.
- **`api/_lib/publishers/instagram.js`**: real `publish()` — the documented two-step Content Publishing flow (`POST /{ig-user-id}/media` to create a container, then `POST /{ig-user-id}/media_publish`). Still requires `mediaUrl` (Instagram has no text-only post type).
- **Connection-state fix**: both previously used `configOnlyConnectionState`, which — correctly for an OAuth-flow platform, but not for these — can never progress past "Configuration Required" (there's no `ready_to_activate`/`connected` distinction without a connect click). Since a static token *is* the fully-connected state, both now report `waiting_for_credentials` → `connected` directly once their env vars are set. `oauthAvailable` stays `false` for both (no `verifyConnection`, no OAuth routes to disconnect from) — Settings correctly shows no Connect/Verify/Disconnect buttons for a platform that doesn't have those steps.

**Bugs fixed:** none (feature pass) — though the connection-state change above is arguably a fix to a pre-existing UI-accuracy gap (would have shown "Configuration Required" forever even once fully working).

**Breaking changes:** `listPublishers()`'s Facebook entry now reports `state: "connected"` once configured, where it previously reported `"configuration_required"` — no caller assumed the old value (nothing built on it since it shipped stubbed).

**Migrations:** none.

**Deployment notes:** no new required env vars for what shipped — see `ACTIVATION.md` for the four Meta vars and how to generate them, needed only at actual activation. 146/146 tests pass (21 new), build clean (server-only change, no client bundle diff).

**Known issues:**
- Neither integration has been exercised against a live Meta app/Page/IG account — same "implemented against the documented API shape, mocked-HTTP tested, not live-tested" caveat as every platform here.
- Long-lived Page/user tokens from Meta still expire (typically ~60 days) and need manual regeneration — no refresh flow exists here since there's no refresh_token in the static-token model; a future pass could add an expiry-warning surface if this becomes a real operational papercut.
- The remaining 3 platforms (LinkedIn, YouTube, Pinterest) still have stub `publish()` bodies.

**Next engineering task:** LinkedIn, YouTube, or Pinterest (all still real OAuth-flow platforms, so each follows the TikTok/X pattern rather than the Facebook/Instagram static-token one) — or Sprint 5 (billing goes live) once a founder pricing decision exists.

## 2026-08-10 — Sprint 6: real X (Twitter) OAuth + publish, second pilot platform

Replicates TikTok's real OAuth+publish pattern for a second platform, per Founder Alpha's own "Next engineering task" note and Sprint 6 of `ops/veridian-platform-strategy.md`. No business decision needed to build this (unlike billing) — only to activate it later with real X Developer credentials.

**Completed work:**
- **`api/_lib/publishers/x.js`**: real OAuth 2.0 + PKCE flow (`api/social/oauth/x/{start,callback,disconnect}.js`), KV-backed token storage with automatic refresh (same single-tenant-by-design convention as TikTok), and a real `POST /2/tweets` `publish()`. PKCE (`generateCodeVerifier`/`generateCodeChallenge`, Web Crypto SHA-256) is net-new since TikTok's flow didn't need it — X requires it regardless of client type.
- **Generalized the "Connect account" / "Verify connection" / "Disconnect" UI** (`src/social/shared.jsx`'s `SocialConnectionsPanel`) off `p.platform === "tiktok"` onto `p.oauthAvailable` — now works for any platform with a real OAuth flow without a third copy-pasted UI branch when a third platform ships. Same generalization in `Shell.jsx`'s OAuth-redirect banner handling (`OAUTH_REDIRECT_PLATFORMS`).
- `x.js`'s `publish()` signature changed from the old stub's `{ caption, hashtags, mediaUrl, userAccessToken }` (a token passed in per-call) to `{ caption, hashtags }` (token now comes from the same KV-backed store as TikTok) — matches the real pattern every other implemented platform uses; nothing external called the stub's old shape yet, so this isn't a breaking change to a working path.

**Bugs fixed:** none (feature pass).

**Breaking changes:** none.

**Migrations:** none — X tokens live in KV under new keys (`veridian:social:x:token`, `veridian:social:x:oauth_state:*`), same as TikTok's.

**Deployment notes:** no new required env vars for what shipped (`X_CLIENT_ID`/`X_CLIENT_SECRET`/`X_REDIRECT_URI` only needed once you actually activate X — see `ACTIVATION.md` §8b). 131/131 tests pass (17 new), build clean.

**Known issues:**
- None of the X code has been exercised against a live X account or app — same caveat as TikTok's initial ship: implemented against X's documented OAuth 2.0 + v2 tweets API shape, verified with mocked HTTP calls, not live-tested.
- X API write access has historically required a paid tier — verify current access before assuming `Ready to Activate` → `Connected` → a successful `Publish now` all just work on whatever tier is on file.
- The remaining 5 platforms (Instagram, Facebook, LinkedIn, YouTube, Pinterest) still have stub `publish()` bodies.

**Next engineering task:** per the roadmap, either a third platform (Instagram/Facebook share the Meta Graph API, so doing them together is likely more efficient than separately), or Sprint 5 (billing goes live) once a founder pricing decision exists.

## 2026-08-10 — Sprint 2: Stripe billing skeleton

Completes Sprint 2 of `ops/veridian-platform-strategy.md` (the AI Gateway half shipped earlier, in the Build to Launch entry). Schema + plumbing only, matching every other unactivated integration's pattern in this codebase (TikTok's siblings, `not_configured` degrade): **no code path here can charge anyone** — there is no `STRIPE_SECRET_KEY` set, and even once one is, there are no real Stripe Prices yet, which is a founder pricing decision (Sprint 5), not an engineering task.

**Completed work:**
- **`subscriptions`/`invoices`/`product_entitlements`** tables (`supabase/migrations/20260810000001_create_billing.sql`), RLS-scoped like `organizations`/`memberships`, server-write-only.
- **`api/_lib/stripe.js`**: REST client (no Stripe SDK — consistent with this codebase's zero-dependency convention), form-encoded per Stripe's API, plus a from-scratch webhook signature verifier (`crypto.subtle` HMAC-SHA256, per Stripe's documented manual-verification scheme) — no npm `stripe` package needed for that either.
- **`api/billing/{checkout,portal,webhook,status}.js`**: checkout/portal create or reuse a Stripe customer per org (membership-checked — you can only buy for an org you belong to) and return a hosted Stripe URL; webhook verifies its signature and upserts `subscriptions`/`product_entitlements`/`invoices` on subscription and invoice events; status is a simple read the Settings screen can poll.
- **`api/_lib/entitlements.js`**: `getEntitlement(orgId, productKey)` — defaults to `"unmetered"` when no billing record exists yet, matching the Settings billing card's existing honest copy rather than inventing a fake plan or blocking access to a product nothing has been sold for.

**Bugs fixed:** none (feature pass).

**Breaking changes:** none — no existing route or table touched.

**Migrations:** `supabase/migrations/20260810000001_create_billing.sql` — low urgency (nothing reads these tables until Stripe keys exist), but apply alongside `..._create_platform_core.sql` while you're in the SQL editor anyway.

**Deployment notes:** no env vars are *required*; `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET` are documented in `ACTIVATION.md` for whenever billing actually goes live. 114/114 tests pass (14 new), build clean (no client-bundle change — this sprint is server-side only).

**Known issues:**
- No plan-selection UI yet — `api/billing/checkout.js` takes a `priceId` from its caller rather than hardcoding one, since no real Prices exist in Stripe yet.
- `product_entitlements` isn't enforced anywhere yet (nothing currently gates a Social feature behind a paid plan) — this sprint is the plumbing, not the gate. Adding an actual paywall is a product decision for when Sprint 5 (real pricing) lands, not assumed here.

**Next engineering task:** per the roadmap, Sprint 6 (real publish integration for a second social platform, following TikTok's pattern) is fully unblocked and requires no business decision — recommended next. Sprint 5 (billing goes live) needs a founder pricing decision first per this repo's own stop-conditions.

## 2026-08-10 — Sprint 1: real authentication + organizations

Per `ops/veridian-platform-strategy.md`'s roadmap (Sprint 1, next after Founder Alpha): replaces Veridian AI's dev-mode `devAuth` with real Supabase Auth, and adds the `organizations`/`memberships` platform-core schema. Connect (`/`, `/dashboard`, its PIN gate, and all `api/{contact,assessment,book,follow-up,sms,voice,metrics,leads}.js`) is completely untouched.

**Completed work:**
- **Real sign-up/sign-in/sign-out/session-refresh**, implemented as GoTrue REST calls (`api/_lib/auth.js`) behind five new same-origin-gated endpoints (`api/auth/{signup,signin,session,refresh,signout}.js`) — no Supabase SDK added, matching this codebase's existing no-dependency REST pattern (`api/_lib/supabase.js`). **No new environment variable required**: the existing `SUPABASE_SERVICE_ROLE_KEY` (already set for Connect's leads/bookings) doubles as the GoTrue `apikey` gateway header, while each authenticated call still uses the real user's own access token for identity — see the header comment in `api/_lib/auth.js` for why that's safe.
- **`organizations` + `memberships` tables** (`supabase/migrations/20260810000000_create_platform_core.sql`), RLS-scoped to `auth.uid()`, insert/update/delete denied for all client roles by design — only the server (via the service-role key) ever writes them, in `api/auth/session.js`'s bootstrap step.
- **Org auto-provisioning**: `GET /api/auth/session` verifies the caller's token, and on a brand-new account with no membership rows, creates a personal organization + owner membership automatically — no separate "create your org" step for the common single-user case.
- **`src/lib/auth.js`**: browser-side session client (signUp/signInWithPassword/signOut/getValidSession/fetchOrganizations), calling this app's own `/api/auth/*` endpoints — never Supabase directly from the browser, same pattern as AI/TikTok/Twilio. Sessions persist in `localStorage` and silently refresh within 60s of expiry.
- **`src/shell/Shell.jsx`**: real email+password sign-in/sign-up form (was a name-only dev-mode form), with an honest "check your email" state when the Supabase project has email confirmation enabled. Real organizations sync into the existing localStorage `workspaces` records (`ownerOrgId`) so brand/content data isn't disturbed; a pre-Sprint-1 workspace with only the old `ownerEmail` field is backfilled in place rather than orphaned. The workspace picker only appears when a user genuinely has more than one org (not reachable via any UI yet, but the schema supports it) — the common single-org case auto-enters.
- Retired `devAuth` from `src/social/store.js` (moved to `src/lib/auth.js`'s real implementation).

**Bugs fixed:** none (feature pass).

**Breaking changes:** `Shell`'s sign-in is no longer instant/passwordless — existing dev-mode "sessions" (an email in `localStorage`) are not carried forward; anyone who'd signed in under `devAuth` needs to create a real account once. Local brand/workspace *data* is preserved and reattached to the new account via the `ownerOrgId` backfill described above. `user.name` no longer exists (Supabase Auth users have no name field by default) — `DashboardHome` and the shell's avatar now derive a display label from the email's local-part instead.

**Migrations:** `supabase/migrations/20260810000000_create_platform_core.sql` — **must be applied to the live Supabase project before this deploys**, or sign-in will fail at the org-bootstrap step (see `ACTIVATION.md` §2).

**Deployment notes:** no new env vars. 100/100 tests pass (15 new — 10 for `api/_lib/auth.js`, plus `src/lib/auth.js`'s client coverage), `npm run build` clean (Shell chunk 45.93kB → 49.24kB gzip 13.44kB — expected growth for the new auth/session logic).

**Known issues:**
- Brands/content/media are still localStorage-only (dev-mode) — only identity moved to Postgres this sprint. Multi-device access to the same org's brands doesn't work yet (by design — that's the next slice of platform-core work, not bundled into this one to avoid a big-bang change).
- No password-reset flow yet (Supabase Auth supports it via its own REST endpoints; not wired up — no UI asked for it yet).
- Billing and the other 6 social-platform integrations remain exactly as documented in prior entries — unaffected by this sprint.
- Not live-tested against a real Supabase Auth project (mocked-HTTP tests only, same caveat every other external integration in this codebase ships with — see `ACTIVATION.md` for the one remaining setup step, applying the migration).

**Next engineering task:** per the roadmap, Sprint 2 (`ops/veridian-platform-strategy.md`) — the AI Gateway is already consolidated (Build to Launch entry, `api/_lib/ai-gateway.js`), so what's left of that sprint is a Stripe billing skeleton (no live pricing yet, just `product_entitlements`/`subscriptions` plumbing) — noting per this repo's own stop-conditions that pricing/billing activation itself is a founder decision, not an engineering one.

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
