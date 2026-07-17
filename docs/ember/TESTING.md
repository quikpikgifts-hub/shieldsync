# Ember Backend — Testing

## Strategy

Two layers, both real (no mocked HTTP layer, no fake database):

- **Unit tests** (`src/**/*.spec.ts`, run via `npm test`): mock Prisma/JWT/Config/Audit
  to isolate a single service's logic. Fast, no database required.
- **E2E tests** (`test/*.e2e-spec.ts`, run via `npm run test:e2e`): boot the real Nest
  application (`AppModule`, the same one `main.ts` uses, via the shared
  `configureApp()` in `src/configure-app.ts`) and make real HTTP requests with
  `supertest` against a real local PostgreSQL test database. These are not testing
  mocks of the database — every assertion below was actually run and passed against
  real Postgres rows.

## What's covered (verified passing as of Phase 1)

**Unit — `src/auth/auth.service.spec.ts` (10 tests):**
age-gate rejection, duplicate-email rejection without a wasted password hash, argon2
hashing on register, anti-enumeration on both "no such account" and "wrong password",
inactive-account rejection, refresh-token-not-found rejection, refresh-token-reuse
detection (and that it revokes the session), expired-refresh-token rejection.

**E2E — `test/auth.e2e-spec.ts`:** registration (success, duplicate, underage, weak
password, unknown-field rejection via DTO whitelisting), login (success, wrong password,
nonexistent account — both return an identical message/status), refresh rotation +
reuse detection over real HTTP, protected-route rejection with no token / a garbage
token, and that `passwordHash` never appears anywhere in a response body.

**E2E — `test/safety.e2e-spec.ts`:** report creation, self-report rejection, multiple
reports on the same subject aggregating into one `ModerationCase`, RBAC enforcement
(a plain `user` gets 403 listing reports/moderation cases; a `moderator` succeeds),
report resolution, block creation/listing, self-block rejection, and — the one that
matters most for actual safety — that resolving a moderation case with `action: BANNED`
both flips the subject's account `status` **and** immediately invalidates their existing
refresh token (verified by attempting a refresh with it afterward and getting 401).

**E2E — `test/matching.e2e-spec.ts`:** no match on a one-sided like, exactly one
`Match`/`Conversation` row created on a reciprocal like (not a duplicate per direction),
self-like rejection, blocked-user like rejection, message send/list within a match,
403 for a third party trying to read/write someone else's conversation, and that a
block placed *after* a match still stops messaging.

**As of Phase 3 (Production Infrastructure), the suite has grown substantially** — full
detail in `TEST_COVERAGE_REPORT.md`, summarized here:

- `test/profiles.e2e-spec.ts`, `test/verification-and-password-reset.e2e-spec.ts`,
  `test/photo-storage.e2e-spec.ts`, `test/health.e2e-spec.ts`,
  `test/observability.e2e-spec.ts` — new e2e coverage for profile management, email
  verification/password reset, the real photo-storage upload flow, and the operational
  endpoints (`/live`/`/ready`/`/health`/`/metrics`).
- `src/integrations/email/smtp-email.provider.spec.ts` and
  `src/integrations/storage/s3-storage.provider.spec.ts` — the real SMTP and S3-compatible
  adapters tested against a real local SMTP server (`smtp-server`) and a real local
  S3-compatible server (`s3rver`) respectively, not mocks. `src/profiles/thumbnail.service.spec.ts`
  does the same for the thumbnail pipeline, with `jimp` itself mocked (see
  `OPEN_DECISIONS.md` D-15 for why — a Jest-only limitation, verified not to affect the
  real running app via a standalone script).

Total: **23 unit + 66 e2e = 89 tests**, all passing against real local Postgres, Redis,
SMTP, and S3-compatible instances.

## What's deliberately not covered yet

- `ProfilesService`, `UsersService` — CRUD-shaped enough that they were verified manually
  (see the smoke-test transcript from the Phase 1 build session) but don't yet have
  dedicated spec files. Reasonable next addition, not a hidden gap in behavior that
  shipped without being exercised at all.
- Load/performance testing — not meaningful before there's a real deployment target to
  measure against.
- Any integration extension point (`src/integrations/*`) — by design, since none are
  configured with real credentials; see `src/integrations/README.md`. Testing a
  `NotConfigured*Provider` would only prove it throws, which the interface contract
  already guarantees.

## Running tests

```bash
npm test              # unit — no database needed
npm run test:e2e      # e2e — needs a migrated + seeded ember_test database, see DEPLOYMENT.md
```

**Always use `npm run test:e2e`, never `npx jest --config ./test/jest-e2e.json` directly.**
The script is `node --env-file-if-exists=.env.test node_modules/.bin/jest ...` — loading
`.env.test` at the Node process level, before Jest/ts-jest/any module runs any code, is
load-bearing, not a style preference. An earlier version of this setup loaded `.env.test`
via an in-code `process.loadEnvFile()` call in `test/setup-e2e.ts`'s top-level code, which
turned out to be genuinely unreliable inside Jest's per-file module lifecycle: depending on
file execution order, `@nestjs/config`'s own internal dotenv auto-load of plain `.env` (the
*development* file) could silently win instead, pointing e2e tests — including their
`TRUNCATE`-every-table `resetDatabase()` call — at the development database. `setup-e2e.ts`
now throws immediately if `NODE_ENV !== "test"` as a safety net against exactly this, but
the real fix is running the tests the supported way.

`test:e2e` truncates the user-generated-data tables between every test (see
`test/db-test-utils.ts`) but leaves the RBAC catalog (`roles`/`permissions`/
`role_permissions`) alone — that's fixed reference data, not something a test should
ever wipe. Redis-backed state (rate-limit counters, account-lockout counters, the token
blacklist) is flushed once per e2e-spec file (`test/setup-e2e.ts`'s `beforeAll`), since it
isn't tied to any one file's Prisma-managed tables the way `resetDatabase()` is.

**Must run e2e serially** (`--runInBand`, already set in the `test:e2e` script). The
e2e spec files share one database; running them as parallel Jest workers produced
real transaction deadlocks and foreign-key violations during development, not just
flaky output — documented in `OPEN_DECISIONS.md`-adjacent context because it's a
correctness requirement of this test setup, not a performance nicety.
