# Veridian AI — Activation Guide

The single reference for going from "built" to "live." If you're the founder (or anyone else) preparing to deploy or activate a real integration, this is the one document to read — it does not duplicate what's in `CHANGELOG.md` (history of what shipped) or `ops/*.md` (Connect's original business docs); it's the checklist for turning this build into a running product.

**No code changes are required after credentials are supplied for anything listed below.** If you find one that does need a code change, that's a bug in this document or the underlying build — not an expected step.

---

## 1. Environment variables — master list

Every variable the codebase actually reads, grouped by what it powers. "Required" means the named feature is silently disabled or fails safely without it (per this codebase's established convention — nothing crashes on a missing var, it degrades).

### Core platform infrastructure

| Variable | Powers | Required for |
|---|---|---|
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Vercel KV (Upstash) | Connect's lead/follow-up storage, rate limiting, TikTok OAuth token storage |
| `ANTHROPIC_API_KEY` | AI generation | Both Connect's recovery-plan/chat features and all of Veridian Social's content generation (brand voice, drafts, hashtags, video scripts) |
| `DASH_PIN` | Connect's `/dashboard` command center | Must be set, and must not be `"0000"` — every PIN-gated endpoint fails closed otherwise (see Sprint 0a) |
| `CRON_SECRET` | Connect's daily follow-up cron | Follow-up emails silently never send without it |
| `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Connect's `leads`/`bookings` tables, and (as of Sprint 1) Veridian AI's real sign-in/sign-up/session + `organizations`/`memberships` | Connect's metrics dashboard, booking dedup, and the entire Veridian AI shell's authentication — no separate anon key needed; see `api/_lib/auth.js`'s header comment for why the service-role key alone is sufficient here |
| `RESEND_API_KEY`, `TEAM_EMAIL`, `FROM_DOMAIN` | Transactional email | Connect's lead/booking/follow-up emails |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` | SMS text-back | Connect's missed-call recovery |
| `VAPI_SECRET` | AI voice receptionist webhook auth | Connect's Vapi integration — fails closed if unset (Sprint 0a) |
| `GOHIGHLEVEL_API_KEY`, `GOHIGHLEVEL_LOCATION_ID`, `GOHIGHLEVEL_PIPELINE_ID`, `GOHIGHLEVEL_STAGE_ID` | CRM sync | Connect's GHL contact/opportunity creation |
| `CONTACT_WEBHOOK_URL`, `BOOKING_URL`, `BUSINESS_NAME` | Optional Connect config | Cosmetic/integration extras, not required |

### Veridian Social — TikTok (real, implemented)

| Variable | Purpose | Where to get it |
|---|---|---|
| `TIKTOK_CLIENT_KEY` | App identifier | TikTok Developer Portal → your app |
| `TIKTOK_CLIENT_SECRET` | App secret | Same |
| `TIKTOK_REDIRECT_URI` | OAuth callback URL | Must exactly match what's registered in the portal — `https://<your-domain>/api/social/oauth/tiktok/callback` |
| `TIKTOK_PRIVACY_LEVEL` (optional) | Overrides the default `SELF_ONLY` privacy | Only set this after TikTok approves your app for public posting — see §5 |

### Veridian Social — other platforms (scaffolded, `publish()` not implemented yet)

These enable the "Configuration Required" state to show correctly and are ready for when each platform's real integration is built (see `CHANGELOG.md`'s "Next engineering task"). Setting them today does **not** enable posting — only TikTok's integration is complete.

| Platform | Variables |
|---|---|
| Instagram | `META_ACCESS_TOKEN`, `META_INSTAGRAM_ACCOUNT_ID` |
| Facebook | `META_PAGE_ACCESS_TOKEN`, `META_FACEBOOK_PAGE_ID` |
| LinkedIn | `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` |
| YouTube | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| X | `X_CLIENT_ID`, `X_CLIENT_SECRET` |
| Pinterest | `PINTEREST_CLIENT_ID`, `PINTEREST_CLIENT_SECRET` |

### Veridian Social — billing (Stripe, skeleton only)

| Variable | Purpose |
|---|---|
| `STRIPE_SECRET_KEY` | Enables `api/billing/{checkout,portal}.js`. Until set, both return `501 { ok: false, reason: "not_configured" }` — no code path can charge anyone today. |
| `STRIPE_WEBHOOK_SECRET` | Enables signature verification in `api/billing/webhook.js`. Get it from the Stripe Dashboard when you register the webhook endpoint (`/api/billing/webhook`) for `customer.subscription.{created,updated,deleted}` and `invoice.{paid,payment_failed}`. |

**Setting these two vars alone does not start charging anyone.** There are no real Stripe Products/Prices yet — `api/billing/checkout.js` takes a `priceId` from its caller rather than a hardcoded one, so creating real prices in the Stripe Dashboard and wiring a plan-selection UI to them is still a founder decision (pricing itself — see `ops/veridian-platform-strategy.md` Task 3's pricing table, marked "a hypothesis, not a commitment"), not an engineering blocker. Until an org has a real subscription, `GET /api/billing/status` reports `entitlement.status: "unmetered"` — the honest default, not a fabricated "active" plan.

---

## 2. Database & migrations

| Migration | Status |
|---|---|
| `supabase/migrations/20260619000000_create_bookings.sql` | Applied to Connect's live Supabase project (pre-existing) |
| `supabase/migrations/20260805000000_create_leads.sql` | Formalizes the `leads` table Connect already writes to (Sprint 0b) — confirm it's been applied if not already |
| `supabase/migrations/20260810000000_create_platform_core.sql` | **Needs to be applied before Sprint 1 sign-in works in production** — creates `organizations`/`memberships` + RLS. Run it against the same Supabase project Connect already uses (Supabase Dashboard → SQL Editor, or the CLI) before or immediately after this deploy. |
| `supabase/migrations/20260810000001_create_billing.sql` | Creates `subscriptions`/`invoices`/`product_entitlements` + RLS (Sprint 2 skeleton). Apply alongside the platform-core migration — nothing reads these tables until `STRIPE_SECRET_KEY` is also set, so there's no urgency, but api/billing/status.js's `supabaseSelect` calls degrade to the safe "unmetered" default either way. |

Veridian Social's brands/content/media remain localStorage-only (dev-mode) — only identity (auth + organizations) moved to real Postgres in Sprint 1. Migrating brand/content data onto Postgres/RLS is separate, later work per `ops/veridian-platform-strategy.md`.

**One more setup step, Supabase Dashboard side:** email confirmation is on by default for new Supabase Auth projects. If you want founders/beta testers to get a session immediately on sign-up (no "check your email" step), turn off "Confirm email" under Authentication → Providers → Email — either is fine, the sign-up flow (`SignIn` in `src/shell/Shell.jsx`) handles both cases correctly today.

---

## 3. API configuration

`vercel.json` — reviewed, unchanged by this activation pass:
- Rewrites: `/api/*` passthrough, everything else to `index.html` (SPA).
- Security headers: CSP, X-Frame-Options, nosniff, referrer policy, permissions policy — all from Sprint 0a, still in place.
- One cron: `/api/follow-up` daily at 09:00 UTC (Connect).

No new API configuration needed for TikTok or any other platform — they're all plain Vercel Edge Functions under `api/social/` and `api/_lib/publishers/`, deployed automatically with everything else.

## 4. OAuth redirect requirements

Only TikTok has a real OAuth flow today:
- Redirect URI registered in TikTok's portal **must exactly match** `TIKTOK_REDIRECT_URI` — protocol, host, and path, character-for-character. A mismatch fails the callback silently from the user's perspective (TikTok rejects it before ever reaching this app).
- The callback route (`api/social/oauth/tiktok/callback.js`) redirects the browser back to `/app?tiktok=connected` or `?tiktok=error` — the shell shows a clear banner either way (Founder Alpha entry, CHANGELOG.md).

## 5. Security checklist (recap — confirm still true before going live)

All from Sprint 0a/0b, re-verified as part of this activation pass (Task 33):
- [ ] `DASH_PIN` is set and is not `"0000"`.
- [ ] `VAPI_SECRET` is set (Vapi webhook fails closed without it).
- [ ] Twilio signature verification is active on `api/sms.js` / `api/missed-call.js` (automatic once `TWILIO_AUTH_TOKEN` is set — no separate toggle).
- [ ] CSP header present in `vercel.json` (already is — confirm it wasn't removed).
- [ ] TikTok posts default to `SELF_ONLY` privacy until the app is TikTok-audited for public posting — do not set `TIKTOK_PRIVACY_LEVEL` prematurely.

## 6. Build & deployment process

- **Build:** `npm run build` (Vite). Verified clean as of this pass — 2 route chunks (Shell, Website).
- **Test:** `npm run test` (Vitest) — 85 tests, all passing as of this pass.
- **Deploy:** push to `main` → Vercel auto-deploys (per `CLAUDE.md`'s original documented flow — unchanged). No manual build step configured; Vercel serves the built output directly.
- **Preview deploys:** any other branch/PR gets a Vercel preview URL automatically (standard Vercel behavior) — use this to test env var changes before they hit production.

## 7. Rollback plan

- **Code rollback:** Vercel keeps every deployment; use the Vercel dashboard's "Promote to Production" on a prior deployment, or `git revert` the offending commit and push — either restores the previous working state within minutes.
- **TikTok token rollback:** if a bad token gets stored (e.g., a failed refresh loop), call `POST /api/social/oauth/tiktok/disconnect` (or use the "Disconnect" button in Settings) and reconnect — this clears the single KV key holding the token, no wider blast radius.
- **Env var rollback:** Vercel env var changes take effect on next deploy/redeploy — reverting a bad value and redeploying is the same "rollback" motion as a code change.

---

## 8. TikTok activation sequence (the concrete next step)

1. Register an app in the TikTok Developer Portal, enable the Content Posting API product, request the `video.publish` and `user.info.basic` scopes.
2. **Verify your deployment domain** in the portal (DNS TXT record or hosted file) — required for the `PULL_FROM_URL` video source; skip this and posts fail even with valid credentials.
3. Set `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`, `TIKTOK_REDIRECT_URI` in Vercel.
4. Open Settings in the app (`/app` → Settings) → TikTok will show **Ready to Activate** → click **Connect account**.
5. Complete TikTok's OAuth consent screen → redirected back with a **Connected** confirmation banner.
6. Click **Verify connection** to confirm the token actually works (calls TikTok's own user-info endpoint) — Settings will show your account's display name and a real "Last verification" timestamp.
7. Generate content for a brand, approve it, attach a publicly-reachable video URL, and click **Publish now** — this is the first live post. Treat it as a controlled test: posts are private (`SELF_ONLY`) until your app passes TikTok's audit, so it's visible only to you.
8. If it fails, the UI shows the specific reason (`media_required`, `account_not_connected`, `publish_error` with detail) rather than a generic error — use that to diagnose rather than guessing.

Once step 7 succeeds, Founder Alpha's success criterion is met — see the "Founder Activation" entry in `CHANGELOG.md`.

## 9. Daily founder workflow (for reference)

Open `/app` → Dashboard (workspace and last brand remembered across reloads) → Social → choose brand → Generate → Review/Edit → Approve → Publish now → confirm on TikTok directly → back to Dashboard's Analytics tab for status counts. Every step in this loop works today without any further engineering — only the credentials in §1 gate what "Publish now" actually does versus falling back to copy-to-clipboard.
