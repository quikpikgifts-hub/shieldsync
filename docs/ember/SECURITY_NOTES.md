# Ember Backend — Security Notes

Status of the security controls actually implemented in `backend/`, updated through the
RC-1 verification pass. Cross-reference with `THREAT_MODEL.md` (which threat this
addresses) and `OPEN_DECISIONS.md` (follow-ups that need product/legal sign-off, not just
engineering).

## Authentication

- Passwords hashed with **argon2id** (the `argon2` package's default), never bcrypt/sha —
  see `src/auth/auth.service.ts`.
- Login uses a **constant-time-ish anti-enumeration pattern**: a nonexistent account still
  runs an argon2 verify against a precomputed dummy hash, so response timing doesn't
  reveal whether an email is registered. Both the "no such account" and "wrong password"
  cases return the identical `"Invalid email or password."` message and 401 status.
- Access tokens are short-lived JWTs (15 min default, `JWT_ACCESS_TTL`). Refresh tokens
  are opaque random values (`crypto.randomBytes(48)`), never JWTs — only their SHA-256
  hash is stored, so a database read alone can't produce a usable token.
- **Refresh token rotation with reuse detection**: every refresh call issues a new token
  and revokes the old one. If a revoked token is presented again (replay, or a client bug
  that reused a stale token), the entire session — every refresh token under it — is
  revoked immediately and the event is audit-logged as
  `auth.token.refresh_reuse_detected`. Verified in `test/auth.e2e-spec.ts`.
- `POST /auth/login` has a tighter rate limit (5/min) than the global default (100/min) —
  see `@Throttle` in `src/auth/auth.controller.ts` — since credential stuffing targets
  this endpoint specifically. **This limit is now enforced correctly across multiple app
  instances**: `ThrottlerStorage` is Redis-backed (a hand-written, atomic Lua-scripted
  implementation — `src/common/throttler/redis-throttler-storage.ts`) when `REDIS_URL` is
  configured, closing the previous `SECURITY_AUDIT.md` H-3 gap where the default in-memory
  storage gave each instance its own independent counter.
- **RC-1**: `POST /auth/register` and `POST /auth/email/verification/request` carry the
  same 5/min-per-IP throttle as login — previously only covered by the generic 100/min
  default, which left mass fake-account creation and inbox-spam-via-verification-resend
  bounded only by IP rotation economics. See `CHANGELOG.md`'s RC-1 entry.
- **Per-account login lockout**, independent of the IP-based throttle above
  (`AccountLockoutService`, Redis-backed) — closes `SECURITY_AUDIT.md` H-2. An attacker
  rotating source IPs against one specific victim account is now stopped by this, not just
  the (bypassable-by-IP-rotation) throttle. Keyed on the *submitted* email string, not the
  resolved account, so the lockout mechanism itself can't be used to enumerate which emails
  have real accounts (see `OPEN_DECISIONS.md` D-12).
- **Explicit logout now instantly invalidates the specific access token used**, not just
  the refresh token. Every access token carries a random `jti` claim; `POST /auth/logout`
  blacklists that one `jti` (Redis-backed `TokenBlacklistService`) for its remaining
  lifetime. Before this, a user who explicitly logged out could have their already-issued
  access token keep working (since the account itself was still `ACTIVE`) until it expired
  naturally.
- **Password reset** (`POST /auth/password-reset/request` / `/confirm`) follows the same
  anti-enumeration shape as login (identical response regardless of whether the account
  exists), is rate-limited per email address in addition to per IP (stops inbox-bombing via
  IP rotation), and revokes every existing session on successful reset — a compromised
  account isn't still logged in elsewhere after its owner resets the password.
- **Rules-based new-device/new-location detection**: a login whose device fingerprint and
  IP have never been seen before for that account is audit-logged
  (`auth.login.anomaly_new_device`) and triggers a "new sign-in" notification email when
  SMTP is configured. Deliberately does not block the login or require step-up
  authentication — that would be a new user-facing feature, out of scope for a hardening
  pass; this makes the event visible, not preventable.

## Authorization

- Every route requires a valid access token by default (`JwtAuthGuard` applied globally
  in `app.module.ts`); routes opt out explicitly with `@Public()`. This is secure-by-default:
  a new route is protected unless someone deliberately marks it otherwise, not the reverse.
- Authorization is `@RequirePermissions(...)` (`src/common/guards/permissions.guard.ts`) —
  permission grants are checked live against the database on every gated request, not cached
  in the JWT — revoking a moderator's access takes effect on their very next request, not
  after their token expires. (A parallel `@Roles()`/`RolesGuard` mechanism existed through
  Phase 1 but was never actually applied to any route; it was removed during the Phase 2
  hardening audit rather than left as unused, misleading surface — see `SECURITY_AUDIT.md`
  M-1.)
- Banning/suspending a user (`ModerationService.resolve`) immediately revokes every active
  session and refresh token for that account in the same transaction as the status change —
  verified in `test/safety.e2e-spec.ts`. **As of the Phase 2 hardening audit, this now also
  actually blocks API access mid-token-lifetime**: `JwtStrategy.validate()` performs a live
  `Users.status` lookup on every request and rejects anything but `ACTIVE` (previously, this
  file claimed immediate revocation while the JWT strategy only checked signature/expiry —
  a real gap, closed in `SECURITY_AUDIT.md` C-1, verified by
  `test/auth.e2e-spec.ts`'s "rejects an already-issued access token once the account's status
  is no longer ACTIVE").

## Real integrations (Phase 3)

- **Email** (`SmtpEmailProvider`): every template escapes interpolated variables before
  they reach an HTML context (verified against a real local SMTP server in
  `smtp-email.provider.spec.ts` with a deliberately script-tag-laden test value). Password
  reset and email verification tokens follow the same hashed-at-rest pattern as refresh
  tokens (`VerificationToken.tokenHash` — the raw token only ever exists in the email
  itself, never persisted).
- **Object storage** (`S3StorageProvider`): uploads only ever happen via a short-lived
  (5 min) presigned URL scoped to a specific, allowlisted content type
  (`image/jpeg`/`png`/`webp` — an attacker cannot smuggle an executable or HTML file
  through this path regardless of claimed extension, since S3 itself rejects a PUT whose
  Content-Type doesn't match what was signed). Reads are always through a short-lived
  (15 min) signed URL, never a permanent public link, even for approved photos — see
  `S3StorageProvider.getReadUrl`'s doc comment. Storage keys are namespaced by owner
  (`photos/<userId>/<uuid>.<ext>`), and as of the RC-1 fix that namespacing is actually
  *enforced* at registration time (`ProfilesService.addPhoto` rejects a `storageKey` not
  prefixed with the caller's own userId) — before this fix, namespacing alone didn't stop a
  user from registering another user's real key, since nothing validated the prefix matched
  the caller. The raw `storageKey`/`thumbnailStorageKey` are also never included in any
  client-facing response (only the hydrated signed `url`/`thumbnailUrl` are) — previously a
  candidate-deck or public-profile response leaked the raw key verbatim, which is exactly
  what made the registration-time gap exploitable. See `CHANGELOG.md`'s RC-1 entry for the
  full exploit chain and fix.

## Data protection

- `UsersService` uses an explicit Prisma `select` (never the model's default "all scalar
  fields") specifically so `passwordHash` can never be returned by an API response, even
  by accident from a future code change that forgets to strip it.
- Government ID documents/images are never intended to be stored in this database — no
  identity-verification feature is built yet (`IdentityVerificationProvider` remains a
  `NotConfigured*` stub; see `DATABASE_SCHEMA.md` §3 for the full list of planned-but-not-built
  tables). When built, the design intent is the same principle applied elsewhere in this
  section: only ever store a vendor reference ID, never the document itself.

## Input handling

- Every DTO uses `class-validator` decorators; the global `ValidationPipe`
  (`whitelist: true, forbidNonWhitelisted: true`) strips **and rejects** any field not
  explicitly declared on a DTO — an attacker can't smuggle an extra field (e.g. trying to
  set `role: "admin"` on a registration payload) past validation.
- All database access goes through Prisma's parameterized query builder; no raw SQL string
  concatenation exists anywhere in the codebase (the one `$executeRawUnsafe` call is in
  `test/db-test-utils.ts`, a test-only helper with a hardcoded table list, never
  user input).

## Error handling

- `AllExceptionsFilter` (`src/common/filters/`) ensures unhandled exceptions never leak a
  stack trace, database error text, or internal detail to an HTTP response — only a
  generic `"An unexpected error occurred."` message, while the full detail is logged
  server-side. Known `HttpException`s (validation errors, 404s, etc.) pass their
  intentional client-facing message through unchanged.
- Every error response now includes a `requestId` (Phase 3) — a per-request correlation ID
  assigned before any other middleware runs, echoed via the `X-Request-Id` response header,
  and present in every structured log line for that request. A user-reported error can be
  matched to an exact server log line without guessing at timestamps.
- True 5xx/unhandled exceptions (never 4xx — expected client-facing behavior isn't an
  operational alert) are reported to Sentry when `SENTRY_DSN` is configured
  (`src/observability/sentry.ts`) — a no-op otherwise, same graceful-degradation pattern as
  every other optional integration in this phase.

## Transport & headers

- `helmet()` applied globally (`src/configure-app.ts`) for standard security headers.
- CORS restricted to the configured origin (`CORS_ORIGIN`), not a wildcard.
- TLS termination is a deployment-environment concern (e.g. the load balancer/reverse
  proxy in front of this service) — not something this application layer does itself,
  and not yet configured anywhere since there is no real deployment target.

## Logging

- Structured JSON logging via `nestjs-pino` (Phase 3), replacing Nest's default console
  logger everywhere. `Authorization`/`Cookie` headers and `password`/`newPassword`/
  `refreshToken` request-body fields are redacted (`[redacted]`) before a log line is ever
  written — a raw credential or token cannot end up in a log aggregator by accident.
- Health-check/metrics probe traffic (`/live`, `/ready`, `/health`, `/metrics`) is excluded
  from per-request access logging — it fires every few seconds and would otherwise drown
  out genuinely useful log volume.

## Audit logging

- `AuditService` (`src/audit/audit.service.ts`) is append-only **at the application
  layer** — it exposes no update or delete method. See `OPEN_DECISIONS.md` D-04 for the
  database-role-level enforcement this still needs before production (splitting a
  migration role from a runtime role, and revoking `UPDATE`/`DELETE` on `audit_logs` from
  the latter).
- Every auth event, moderation action, report, block, like, and match is audited with an
  actor, subject, and structured metadata — verified end-to-end in
  `test/safety.e2e-spec.ts` and manually against the real local database (13 distinct
  audit actions observed across a full smoke-test session).

## Known dependency advisory

`npm audit --omit=dev` reports **0 vulnerabilities** in every dependency that actually ships
in the production Docker image (`Dockerfile`'s `npm ci --omit=dev`) — this is now enforced
as a hard CI gate (`backend-ci.yml`'s "Audit production dependencies" step,
`--audit-level=high`), not just something re-run by hand occasionally.

Running the unrestricted `npm audit` (including devDependencies) shows 4 known
vulnerabilities, all transitive dependencies of `s3rver` — the local, in-process
S3-compatible test double used only by `s3-storage.provider.spec.ts`,
`thumbnail.service.spec.ts`, and the e2e photo-storage tests. `s3rver` never ships (it's a
devDependency, excluded by `--omit=dev`) and never runs against real data (it serves an
ephemeral temp directory created and destroyed within each test). Tracked here rather than
ignored; would be worth revisiting if a non-vulnerable version becomes available, but isn't
a production risk today.

## What's explicitly NOT done yet (see ROADMAP.md for phasing)

- No WAF/DDoS protection at the application layer — expected to live at the infrastructure
  edge (CDN/load balancer) once a real deployment target exists, not in this codebase.
- No SIEM integration — audit logs exist in Postgres; shipping them to a SIEM is an
  infrastructure step for a real deployment, not an application feature. (Sentry now
  captures unhandled exceptions/5xx errors when configured — see "Error handling" above —
  but that's error tracking, not a SIEM.)
- No third-party penetration test has been performed (nor could one be, against a system
  with no deployed instance and no real users).
- No async/webhook-based bounce handling for the email provider — see `OPEN_DECISIONS.md`
  D-11; it's inherently vendor-specific and no vendor has been chosen yet.
