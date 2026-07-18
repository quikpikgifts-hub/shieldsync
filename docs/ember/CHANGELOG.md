# Ember Backend — Changelog

## Phase 4 — Deployment Readiness Documentation & Infrastructure-as-Code

No application code changed in this phase. Scope: make the gap between "code complete" and
"a real production deployment" fully explicit and fully engineering-actionable, without
fabricating any credential, account, or claim of verification that hasn't actually happened
— see `DEPLOYMENT_READINESS_CHECKLIST.md`, `GO_LIVE_CHECKLIST.md`, and `OPERATOR_RUNBOOK.md`
for the four-state (Code complete / Infrastructure complete / Operationally verified /
Production ready) framing used consistently across all three.

- **`infra/terraform/`** — a complete AWS Terraform module tree (networking, RDS Postgres,
  ElastiCache Redis, S3, Secrets Manager, ECS/Fargate + ALB, optional Route53/ACM) matching
  `ARCHITECTURE.md` §3's recommended stack. `terraform fmt -check -recursive` passes and
  every resource was manually reviewed against the AWS provider schema; `init`/`validate`/
  `plan`/`apply` have not been run — `registry.terraform.io` is blocked by this build
  sandbox's network policy (same class of limitation as Phase 1's `docker compose up` note).
  See `infra/terraform/README.md` for exactly what was and wasn't validated.
- **`DEPLOYMENT_READINESS_CHECKLIST.md`** — every remaining external dependency (AWS
  account, database, cache, storage, email vendor, domain/DNS/TLS, monitoring, backups,
  legal, CI/CD, incident response), each with an owner, a verification command, and
  objective acceptance criteria. Every row starts unchecked.
- **`GO_LIVE_CHECKLIST.md`** — the pre-launch verification pass across all sixteen
  requested areas (infrastructure, security, monitoring, backups, disaster recovery,
  email, storage, payments, domain/DNS, SSL/TLS, legal, privacy, ToS, incident response,
  support, launch verification), each item stating exactly what evidence would move it
  from code-complete to operationally verified.
- **`OPERATOR_RUNBOOK.md`** — deploy, monitor, troubleshoot, roll back, rotate secrets,
  recover from failure, and routine maintenance, written against the real commands the
  Terraform module tree and existing CI/CD produce.
- **`.github/workflows/backend-deploy.yml`** — the former `echo`-only placeholder "Deploy"
  step is replaced with a real, credential-gated deployment: GitHub OIDC → AWS (via
  `AWS_DEPLOY_ROLE_ARN`, no long-lived AWS keys stored as a secret) → `aws ecs
  update-service --force-new-deployment` → `aws ecs wait services-stable` → a `/ready`
  health-check validation loop. If `AWS_DEPLOY_ROLE_ARN` isn't set, the job says exactly
  that instead of silently no-op'ing. This has not been run against a real AWS account —
  the workflow is code complete, not operationally verified.

**Explicitly not done in this phase, by design:** no AWS account was created, no vendor
account (SMTP/Sentry/etc.) was created, no legal document was drafted, and no claim of
"production ready" is made anywhere in the documents above — every checklist item is
either unchecked or explicitly marked at the state the evidence actually supports.

## Phase 3 — Production Infrastructure

The infrastructure `PRODUCTION_READINESS.md` (Phase 2) identified as blocking a real
external alpha: real email, real object storage, health checks, Redis, structured
observability, additional security hardening, and a deployment pipeline. Every item below
is backed by tests that exercise the real thing (a real local SMTP server, a real local
S3-compatible server, a real local Redis instance, a real Postgres instance) — see
`TEST_COVERAGE_REPORT.md` for what's covered and what's explicitly out of scope.

**1. Production email** (`src/integrations/email/`, `src/email/`, `src/auth/password-reset.service.ts`)

- Real `SmtpEmailProvider` (nodemailer-based, works against any SMTP-speaking provider —
  Postmark, SES's SMTP interface, SendGrid, or a self-hosted relay) with retry-with-backoff
  on transient failures and immediate (no-retry) surfacing of permanent 5xx rejections —
  see `SECURITY_AUDIT.md`-style reasoning captured inline in the adapter itself.
- Three real templates (email verification, password reset, new-device sign-in alert),
  each escaping every interpolated variable before it reaches an HTML context.
- New endpoints: `POST /auth/email/verification/request`, `POST /auth/email/verification/confirm`,
  `POST /auth/password-reset/request`, `POST /auth/password-reset/confirm` — backed by a
  new `VerificationToken` table (same hashed-at-rest pattern as refresh tokens). Password
  reset revokes every existing session, not just future logins. Both request endpoints are
  anti-enumeration (identical response whether or not the account/email exists) and
  rate-limited independently of the account itself (email-address-keyed, not just IP-keyed)
  to block inbox-bombing.
- Sending goes through a background queue (BullMQ when Redis is configured, inline-with-retry
  otherwise) so a slow SMTP provider never blocks a request.
- `IntegrationsModule`'s `EMAIL_PROVIDER` now resolves to the real adapter when `SMTP_HOST`
  is set, and to the original `NotConfiguredEmailProvider` stub otherwise — the first of the
  Phase 1 extension points to graduate from "throws until built" to "actually works."

**2. Object storage** (`src/integrations/storage/`, `src/profiles/thumbnail.service.ts`)

- Real `S3StorageProvider` (works against real AWS S3 or any S3-compatible service — MinIO,
  DigitalOcean Spaces, etc.) issuing genuinely time-boxed presigned upload/download URLs.
  `POST /profiles/me/photos/upload-url` is new; `POST /profiles/me/photos` now validates
  (when storage is configured) that the client actually uploaded something to that key
  before registering it — closing `OPEN_DECISIONS.md` D-05's "nothing behind the string" gap.
- Content-type allowlist (`image/jpeg`/`png`/`webp`) enforced at the presigned-URL layer
  itself, not just client-side convention.
- A background thumbnail-generation pipeline (jimp-based resize to 320×320, uploaded under
  a derived key) runs after every photo registration; `Photo` gained `contentType`,
  `byteSizeBytes`, `width`, `height`, `thumbnailStorageKey`, `thumbnailGeneratedAt` columns.
- `GET /profiles/me` and `GET /profiles/:userId` now return a short-lived signed `url` (and
  `thumbnailUrl`) per photo instead of the raw internal storage key.
- Same graceful-degradation pattern as email: falls back to the pre-Phase-3 behavior
  (accept a client-supplied key, no validation, no thumbnail) when `S3_BUCKET` isn't set.

**3. Production infrastructure**

- `GET /live`, `GET /ready`, `GET /health` (`src/health/`, `@nestjs/terminus`) — liveness
  (no dependency checks), readiness (real Postgres + Redis ping), and a fuller health
  report (adds process memory checks) respectively. Wired into the Dockerfile's own
  `HEALTHCHECK` instruction and the new `k8s/deployment.yaml`'s liveness/readiness probes.
- `docker-compose.prod.yml` — production-shape Compose file (no baked-in secrets, explicit
  resource limits, `restart: always`), alongside the existing dev `docker-compose.yml`
  (which now also runs a Redis service for local parity).
- `backend/k8s/` — basic Deployment/Service/ConfigMap/Secret-shape/HPA manifests, provided
  because this phase's brief asked for them, **not** as a recommendation to adopt
  Kubernetes now — see `k8s/README.md` for why that tension with `ARCHITECTURE.md`/`ROADMAP.md`
  is real and deliberately not glossed over.
- `JWT_ACCESS_SECRET`'s Joi-enforced minimum length raised from 16 to 32 characters
  (`SECURITY_AUDIT.md` L-2, finally addressed).
- Every new optional env var validated via Joi at boot (fail-fast), documented in the
  expanded `.env.example`.

**4. Redis**

- Distributed, Redis-backed `ThrottlerStorage` (a hand-written Lua-scripted implementation
  matching `@nestjs/throttler`'s own in-memory algorithm exactly, but atomic across
  instances) closes `SECURITY_AUDIT.md` H-3 for real — falls back to the original in-memory
  storage when `REDIS_URL` isn't set.
- A `KeyValueStore` abstraction (Redis-backed or in-memory, chosen automatically) backs the
  new account-lockout and token-blacklist services below.
- `BullMqJobQueue` / `InlineJobQueue` (`src/queue/`) — background job execution for email
  sending and thumbnail generation, real BullMQ+Redis when configured, synchronous
  retry-with-backoff otherwise.

**5. Observability**

- Structured JSON logging via `nestjs-pino`, replacing Nest's default console logger
  everywhere (`main.ts`'s `app.useLogger`). Authorization headers, cookies, and
  password/token fields are redacted before they ever reach a log line.
- A per-request correlation ID, generated (or reused from an upstream `X-Request-Id`
  header) before any other middleware runs, echoed back via the `X-Request-Id` response
  header and included in every `AllExceptionsFilter` error body — a user-reported error can
  now be matched to an exact server log line.
- `GET /metrics` (`prom-client`) — Node process metrics (CPU, memory, GC, event loop) plus
  `http_requests_total`/`http_request_duration_seconds`, labeled by *matched route pattern*
  (never a raw URL with a UUID baked in) via request-scoped Express middleware — deliberately
  middleware, not a Nest interceptor, so requests a Guard rejects (401s, 429s) are still
  counted, not silently excluded.
- Sentry wiring (`src/observability/sentry.ts`) — a no-op until `SENTRY_DSN` is set, then
  captures every true 5xx/unhandled exception `AllExceptionsFilter` sees (never 4xx —
  expected client-facing behavior isn't an operational alert).

**6. Security hardening**

- Per-account login lockout (`AccountLockoutService`, Redis-backed), independent of the
  existing IP-based throttle — closes `SECURITY_AUDIT.md` H-2. Keyed on the submitted email
  string itself (not the resolved user ID) so the lockout mechanism can't be used as an
  account-enumeration side channel.
- Access tokens now carry a `jti` claim; logout blacklists that one token's `jti` for its
  remaining lifetime (`TokenBlacklistService`) — closes the gap where an explicitly logged-out
  session's access token remained valid until natural expiry even though its refresh token
  was already revoked.
- Rules-based new-device/new-location login detection: a login from a device
  fingerprint/IP never seen before for that account is audit-logged
  (`auth.login.anomaly_new_device`) and triggers a "new sign-in" email when SMTP is configured.
- Password-reset requests are rate-limited per email address (not just per IP), preventing
  inbox-bombing via IP rotation.

**7. CI/CD**

- `.github/workflows/backend-deploy.yml` — builds and pushes a tagged Docker image to
  GHCR on every push to `main`, runs `prisma migrate deploy` against a `production`
  GitHub Environment, and a placeholder final deploy step (no real hosting target exists
  yet — see `DEPLOYMENT.md`). Rollback via `workflow_dispatch` redeploying a prior image tag
  — full runbook in the new `RELEASE.md`.
- `backend-ci.yml` gained a Redis service container, `npm audit --omit=dev --audit-level=high`
  as a hard gate, and the new env vars the test suite needs.

**Fixed along the way**

- A genuine test-infrastructure bug: `test/setup-e2e.ts`'s `process.loadEnvFile('.env.test')`
  turned out to be unreliable inside Jest's per-file module lifecycle — depending on file
  execution order, `@nestjs/config`'s own internal dotenv auto-load of `.env` (the
  *development* file) could silently win instead, pointing e2e tests at the dev database
  moments before they `TRUNCATE` every app table in it. Fixed by loading `.env.test` via
  `node --env-file-if-exists` at the process level in the `test:e2e` npm script (set before
  Node/Jest/ts-jest run any code at all, with none of the in-process timing ambiguity),
  plus a `NODE_ENV !== "test"` guard in `setup-e2e.ts` that now fails loudly instead of
  silently misdirecting if this is ever bypassed.
- `ProfilesService.addPhoto()`'s primary-photo-flag update is now wrapped in the same
  transaction as the photo's creation, and the database gained a partial unique index
  (`photos_one_primary_per_profile`) as a backstop — closes `SECURITY_AUDIT.md` L-3.
- `Report`/`ModerationCase`'s foreign keys to `Users` changed from `Cascade` to `Restrict`
  — closes `DATABASE_AUDIT.md` DB-4 (a future account-deletion feature can no longer
  silently erase the safety/evidence trail by deleting the user rows it references).
  `blocks.blockedId` and `audit_logs.subjectId` gained supporting indexes (DB-1, DB-2).

**Test suite:** 23 unit + 66 e2e tests, all passing — up from 10 unit + 47 e2e at the end of
Phase 2. New real-infrastructure test coverage: a real local SMTP server (`smtp-server`), a
real local S3-compatible server (`s3rver`), and a real local Redis instance, none of which
existed as test dependencies before this phase.

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
