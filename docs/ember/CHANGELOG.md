# Ember Backend — Changelog

## Phase 2 — Enterprise Hardening and Alpha Readiness audit

A skeptical, file-by-file security/database/API/production-readiness/test-coverage audit of
the entire backend — full findings in `SECURITY_AUDIT.md`, `DATABASE_AUDIT.md`, `API_AUDIT.md`,
`PRODUCTION_READINESS.md`, `TEST_COVERAGE_REPORT.md`, and `ALPHA_RELEASE_CHECKLIST.md`. No new
product features were added; every change below is a fix to existing logic, a removal of
dead/misleading code, or a test verifying one of those fixes.

**Fixed**

- **Critical:** `JwtStrategy` now performs a live `Users.status` check on every request instead
  of trusting a signed JWT indefinitely — a banned/suspended user's already-issued access token
  is now rejected immediately, not just at its next natural expiry (`SECURITY_AUDIT.md` C-1).
- **High:** email addresses are normalized (trimmed, lowercased) before storage and lookup in
  `AuthService`, closing a case-variant duplicate-account and false-login-failure bug
  (`SECURITY_AUDIT.md` H-1).
- **Medium:** `MatchingService`'s reciprocal-match creation now handles a concurrent unique-
  constraint race idempotently instead of surfacing an opaque 500 (`SECURITY_AUDIT.md` M-2).
- **Medium:** the previously-declared-but-never-called `profile.pii_view` audit action is now
  recorded on every `GET /users/:id` (`SECURITY_AUDIT.md` M-3).
- **Medium:** `ParseUUIDPipe` added to every route parameter that identifies a database row,
  across all controllers (`SECURITY_AUDIT.md` M-4).
- **Medium:** several DTO validation gaps closed — missing `@IsNotEmpty()` on required text
  fields, a Swagger/validation mismatch on profile `displayName`, missing array constraints on
  `seekingGenders` (`SECURITY_AUDIT.md` M-5).
- **Medium:** `POST /auth/logout` now verifies the refresh token being revoked belongs to the
  authenticated caller (`SECURITY_AUDIT.md` M-6).
- **Medium:** removed `RolesGuard`/`@Roles()` — confirmed dead code (zero real usages) that
  would have trusted a stale JWT claim instead of a live database check if it had ever been
  used (`SECURITY_AUDIT.md` M-1).
- **Low:** age-calculation logic consolidated onto the single `computeAge()` implementation,
  removing a second, slightly-inaccurate approximation (`SECURITY_AUDIT.md` L-1).
- **Production readiness:** `main.ts` now calls `app.enableShutdownHooks()` so Prisma
  disconnects cleanly on SIGTERM.

**Documented, not built** (new stateful features, out of scope for a hardening pass):
per-account brute-force lockout, Redis-backed rate-limiter storage, a health-check endpoint,
real email/object-storage integrations. Full rationale for each in `SECURITY_AUDIT.md` and
`PRODUCTION_READINESS.md`.

**Tests added:** 9 new e2e tests directly verifying the fixes above (banned-account token
rejection, email-casing normalization, logout ownership), plus a new `profiles.e2e-spec.ts`
(9 tests) covering a module that previously had zero e2e coverage. Full suite: 10 unit + 47
e2e tests, all passing; `npx nest build` clean; `npm run lint` clean (0 errors).

## Frontend wired to the real backend

**Added**

- `src/emberApi.js` — a fetch wrapper for the real backend: in-memory access token,
  `localStorage`-persisted refresh token with session restore on load, automatic
  single-retry-after-refresh on a 401, concurrent-refresh coalescing.
- Two new backend endpoints, added because wiring the frontend surfaced they didn't
  exist yet: `GET /matching/candidates` (a discovery feed — Phase 1 had only "decide on
  a specific person," not "give me people to decide on") and
  `PUT /profiles/me/prompt-answers` (the `PromptAnswer` model existed in Phase 1's schema
  but nothing could ever write to it).
- A real login screen (`Signup` component's `mode="login"` branch) — the original
  frontend only had registration; see `OPEN_DECISIONS.md` D-09 for how testing the real
  multi-user flow caught this.
- A "Your matches" list on the Matches screen, backed by `GET /matching/matches` +
  per-match profile hydration — see `OPEN_DECISIONS.md` D-10 for how testing the
  asynchronous nature of real matching (not just the same-session happy path) caught
  this gap.
- `age` (computed from `dateOfBirth`, never the raw date itself) added to `GET /users/me`
  and the candidates response.

**Removed**

- The fabricated "92% match" compatibility score from the match cards — there is no real
  scoring algorithm yet (see D-08). Showing one would be exactly the placeholder
  functionality the build policy rules out, even though the pre-backend prototype had it.
- The canned "Ha, I like that — tell me more?" auto-reply in chat — there's no second
  real person auto-responding in a real conversation.

**Fixed**

- A CORS origin mismatch (`localhost:5173` configured, page served from `127.0.0.1:5173`
  — two different origins as far as CORS is concerned) that manifested as an opaque
  "Failed to fetch" with no useful error. `CORS_ORIGIN` now accepts a comma-separated
  list; both local addresses are allowed by default.

**Verified against a real, running system** (not simulated): two independent real
accounts created via the API, a real reciprocal like creating a real match, a real
message persisted and readable from both accounts' perspectives, session restore across
a full page reload, and logout revoking the refresh token server-side (confirmed via
direct database query, not just trusting the client-side state).

## Phase 1 — Real Backend Foundation (initial)

**Added**

- NestJS backend (`backend/`) with Clean Architecture-style module separation: `auth`,
  `users`, `profiles`, `matching`, `messaging`, `safety`, `audit`, `integrations`, plus
  shared `common/` and `config/` infrastructure.
- PostgreSQL schema via Prisma (`backend/prisma/schema.prisma`) covering Users, RBAC
  (Roles/Permissions), Profiles/Photos/Preferences/PromptAnswers, Matching (Likes/Matches),
  Messaging (Conversations/Messages), Safety (Reports/Blocks/ModerationCases), AuditLog,
  Subscriptions, Notifications, Sessions/RefreshTokens.
- Self-hosted authentication: Argon2id password hashing, JWT access tokens, rotating
  opaque refresh tokens with reuse detection, anti-enumeration login responses (see
  `OPEN_DECISIONS.md` D-01 for why this is self-hosted rather than delegated to a
  managed provider).
- RBAC with two enforcement layers: role-based (`@Roles`) and fine-grained
  permission-based (`@RequirePermissions`, checked live against the database).
- Safety foundation: Reports (auto-aggregating into ModerationCases), Blocks (enforced
  in both matching and messaging), ModerationCases (assign/resolve, with BANNED/SUSPENDED
  resolutions immediately revoking the subject's sessions), append-only AuditLog.
- Matching: like/pass/super-like recording, automatic Match + Conversation creation on
  reciprocal likes, block-aware.
- Messaging: send/list within a matched conversation, block-aware even post-match.
- Extension-point interfaces + DI-wired "NotConfigured" adapters (each throwing a clear,
  typed error rather than silently succeeding) for every third-party integration named in
  the product brief: Stripe, Twilio, email, AWS S3, identity verification, OpenAI/Anthropic,
  push notifications, analytics.
- Docker (multi-stage, non-root runtime user) + Docker Compose (Postgres + API).
- GitHub Actions CI (`.github/workflows/backend-ci.yml`): lint, migrate, seed, build,
  unit tests, e2e tests, Docker image build — against a real Postgres service container.
- 39 tests (10 unit, 29 e2e), all passing against a real local PostgreSQL instance.
- Documentation: this file, `OPEN_DECISIONS.md`, `API.md`, `SECURITY_NOTES.md`,
  `DEPLOYMENT.md`, `TESTING.md`, and updates to the existing `ARCHITECTURE.md` /
  `DATABASE_SCHEMA.md` planning documents to reflect what was actually built.

**Known gaps** (see `OPEN_DECISIONS.md` for the full list with rationale)

- No admin API to grant roles (done via direct database access during development).
- No real object storage — photo endpoints accept a client-supplied storage key rather
  than issuing a real presigned upload.
- Audit log is append-only at the application layer only; database-role-level enforcement
  (a separate migration role vs. runtime role) is not yet configured.
- `docker compose up` was validated syntactically (`docker compose config`) but not run
  to completion end-to-end in the sandbox this was built in, due to that environment's
  network policy blocking the Docker Hub registry — not a defect in the compose file.
