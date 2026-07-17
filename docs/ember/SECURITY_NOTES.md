# Ember Backend — Security Notes

Status of the security controls actually implemented in `backend/`, as of Phase 1. Cross-
reference with `THREAT_MODEL.md` (which threat this addresses) and `OPEN_DECISIONS.md`
(follow-ups that need product/legal sign-off, not just engineering).

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
  this endpoint specifically.

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

## Data protection

- `UsersService` uses an explicit Prisma `select` (never the model's default "all scalar
  fields") specifically so `passwordHash` can never be returned by an API response, even
  by accident from a future code change that forgets to strip it.
- Government ID documents/images are never intended to be stored in this database — see
  the `verifications` table design in `DATABASE_SCHEMA.md` and the
  `IdentityVerificationProvider` interface, which only ever handles a vendor reference ID.

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

## Transport & headers

- `helmet()` applied globally (`src/configure-app.ts`) for standard security headers.
- CORS restricted to the configured origin (`CORS_ORIGIN`), not a wildcard.
- TLS termination is a deployment-environment concern (e.g. the load balancer/reverse
  proxy in front of this service) — not something this application layer does itself,
  and not yet configured anywhere since there is no real deployment target.

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

As of the Phase 2 hardening audit, `npm audit` reports **0 vulnerabilities** across both
runtime and dev dependencies (previously, a moderate-severity advisory in `@hono/node-server`
via `@prisma/dev`'s local Studio server had been tracked here — it has since resolved via
routine dependency updates, not because it was ignored). Re-run `npm audit` on every
dependency bump; see `PRODUCTION_READINESS.md` for the recommendation to gate this in CI
automatically rather than relying on someone running it by hand.

## What's explicitly NOT done yet (see ROADMAP.md for phasing)

- No WAF/DDoS protection at the application layer — expected to live at the infrastructure
  edge (CDN/load balancer) once a real deployment target exists, not in this codebase.
- No SIEM integration — audit logs exist in Postgres; shipping them to a SIEM is an
  infrastructure step for a real deployment, not an application feature.
- No third-party penetration test has been performed (nor could one be, against a system
  with no deployed instance and no real users).
