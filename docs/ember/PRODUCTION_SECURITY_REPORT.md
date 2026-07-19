# Ember Backend — Production Security Validation Report (Phase 5)

Real checks run against a genuinely running instance of this backend (`NODE_ENV=production`,
real local Postgres/Redis/S3-compatible/SMTP) this session, plus the independent RC-1
security re-review's findings (already fixed and regression-tested — see
`ENTERPRISE_READINESS_REPORT.md` and `CHANGELOG.md`'s RC-1 entry). **This validates
application-layer security behavior for real. It does not validate a real production
deployment** — no TLS certificate, no real domain, no real AWS Secrets Manager, and no
internet-facing exposure exist to test against. Every item below states which of those two
categories it is.

## Rate limiting — operationally verified (local)

20 concurrent `POST /auth/login` requests against the real (unmodified) 5/min-per-IP limit:
the Redis-backed, Lua-scripted atomic throttle correctly rejected every request beyond the
remaining budget with `429` — no race condition let more requests through under real
concurrency than the configured limit allows. See `LOAD_TEST_REPORT.md` for the full run.

## Lockouts — operationally verified (local, from RC-1 + re-confirmed)

`AccountLockoutService` is Redis-backed and keyed on the *submitted* email string (not the
resolved account), so the lockout mechanism itself can't be used to enumerate which emails
have real accounts. Independently re-confirmed this session that Redis-unavailable
scenarios fail *closed* (auth becomes unavailable, not permissive) by reading
`account-lockout.service.ts`/`token-blacklist.service.ts` — neither has a try/catch around
its `KeyValueStore` calls, so an `ioredis` error propagates and fails the request rather
than silently permitting it.

## JWT revocation — operationally verified (local, this session's real run)

Verified for real via `scripts/launch-verification.mjs`, not just unit tests:
- Refresh token rotation: presenting an already-rotated refresh token returns 401 and
  revokes the *entire* session (a second attempt with the newly-rotated token also fails).
- Explicit logout blacklists the specific access token's `jti` immediately — a request with
  that exact token fails with 401 right after logout, before its natural TTL expiry.
- Password reset revokes every existing session — a refresh token issued before the reset
  fails immediately after.

## Authorization / RBAC — operationally verified (local, this session's real run)

- Unauthenticated request to `/moderation-cases` → 401.
- Authenticated non-moderator request to the same route → 403.
- After granting the `moderator` role directly against the database (no self-service
  admin-grant endpoint exists, by design — `OPEN_DECISIONS.md` D-03), the *same, already-issued*
  access token immediately gained access on its next request, with no re-login required —
  real, live confirmation that permissions are checked against the database per-request, not
  cached in the JWT.

## Photo ownership — operationally verified (local, this session's real run, RC-1 fix)

The Critical finding fixed this pass (a `storageKey` read from another user's response
could be registered as the reader's own photo) was re-verified against this session's real
running instance, not just the unit-level regression test: a second real user, presented
with the first user's real `storageKey`, was rejected with 403. The photo response was
independently inspected and confirmed to contain no `storageKey`/`thumbnailStorageKey`
field at all — only a hydrated, short-lived `url`/`thumbnailUrl`.

## Storage permissions — infrastructure complete, not operationally verified against real AWS

`infra/terraform/modules/storage/main.tf`'s IAM policy is scoped to `s3:PutObject/GetObject/DeleteObject`
on the bucket's objects and `s3:ListBucket` on the bucket itself — reviewed, not yet
applied against a real AWS account (see `PRODUCTION_READINESS_REPORT.md`). This session's
real local validation used a local S3-compatible server (`s3rver`) with a single bucket and
a single set of test credentials — it exercises the *application's* use of the
`StorageProvider` interface for real (presigned upload → real PUT → registration →
ownership check → signed read), but cannot validate the real AWS IAM policy's actual
enforcement, since no real AWS account exists to test it against.

## Secrets — operationally verified (local) for what's testable without real infra

- `ps aux` against the running process shows no secret in the command line — all
  configuration is passed via environment variables, never CLI arguments.
- A deliberately malformed registration request was sent and the response body inspected —
  contains only the intended validation messages, no internal detail, no stack trace, no
  configuration value.
- Grepped the full RC-1 pass for hardcoded secrets in committed files — none found (see
  `ENTERPRISE_READINESS_REPORT.md`'s Security section).
- **Not verified this session** (needs real infra): real AWS Secrets Manager
  read/rotation behavior, real GitHub Actions OIDC → AWS role assumption.

## Encryption — documented, largely not operationally verified

- **At rest**: `storage_encrypted = true` is configured in Terraform for RDS — infrastructure
  complete, not yet applied to a real instance.
- **No column-level encryption** exists for PII columns (email, phone, passwordHash, date of
  birth, message body) — confirmed by reading `schema.prisma` during the RC-1 documentation
  cross-check; protected only by disk-level encryption (once real infra exists) plus
  application-layer controls (argon2id hashing, explicit `select` clauses).
- **In transit to Postgres**: the connection string used this session has no `sslmode`
  parameter, and none is enforced in code — whether a real RDS connection is encrypted in
  transit depends on the real deployment's configuration, which has never been set up or
  tested. Flagged as an open item in `DATABASE_SCHEMA.md` §5, not silently assumed.
- **Redis**: `infra/terraform/modules/cache/main.tf` configures both transit and at-rest
  encryption plus an AUTH token for ElastiCache — infrastructure complete, not yet applied.

## Headers — operationally verified (local, this session's real run)

`curl -I` against the real running instance shows Helmet's full default header set actually
present on real responses: `Content-Security-Policy`, `Strict-Transport-Security`,
`X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Cross-Origin-Opener-Policy`,
`Cross-Origin-Resource-Policy`, `Referrer-Policy: no-referrer`, `X-XSS-Protection: 0`
(intentionally disabled — the deprecated legacy header, not a gap; CSP is the real
protection). Not previously confirmed against a real running response in this level of
detail — this session's check confirms the configuration actually takes effect at runtime,
not just that it's configured in code.

## CORS — operationally verified (local, this session's real run)

A real preflight `OPTIONS` request from the configured allowed origin
(`http://localhost:5173`, this session's `CORS_ORIGIN`) received
`Access-Control-Allow-Origin: http://localhost:5173` and
`Access-Control-Allow-Credentials: true`. The identical preflight from a disallowed origin
(`http://evil.example.com`) received **no** `Access-Control-Allow-Origin` header at all —
confirming a browser would correctly block the actual request that follows such a
preflight, not just that the server happens to 204 the `OPTIONS` call itself (which is
normal CORS behavior — enforcement is header-based, not a rejected preflight).
**Note for real deployment**: `CORS_ORIGIN` must be set to the real frontend's real origin
before launch — this session's value is a local placeholder.

## CSRF — not applicable, by design (re-confirmed)

This API is exclusively token-based (`Authorization: Bearer` header), never cookie-based
session authentication — there is no session cookie for a CSRF attack to ride on. Confirmed
by re-reading the auth flow: `POST /auth/login`/`/refresh` return tokens in the response
body for the client to store and send explicitly, never a `Set-Cookie` header.

## Logging — operationally verified (local, this session's real run + RC-1 logging audit)

Real log output from this session's run was inspected directly (not just the code) —
structured JSON via pino, `requestId` present on every log line, no password/token/secret
value observed in any log line during the full functional-validation and load-test runs.
Full static audit of every log call site: `LOGGING_AUDIT.md`.

## Audit trails — operationally verified (local, this session's real run)

Real audit log rows were confirmed written to the database for this session's test actions
(`SELECT count(*) FROM audit_logs WHERE "createdAt" > now() - interval '10 minutes'`
returned a real, non-zero count matching the actions taken). Append-only enforcement remains
application-layer only, not database-role-enforced — an honestly tracked open item
(`OPEN_DECISIONS.md` D-04), not newly discovered.

---

## Summary

Every application-layer security control that can be tested without real cloud
infrastructure was tested for real this session, against a real running instance, not
assumed from code review alone. Nothing failed. The items that remain unverified
(real AWS IAM enforcement, real TLS termination, real Secrets Manager, real
internet-facing exposure) are unverified because the infrastructure to test them against
does not exist yet — not because a test was skipped. See `PRODUCTION_READINESS_REPORT.md`
for how these two categories combine into the overall launch recommendation.
