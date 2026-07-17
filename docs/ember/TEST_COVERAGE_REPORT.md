# Ember Backend — Test Coverage Report

**Before this pass:** 1 unit-test file (`auth.service.spec.ts`, 10 tests), 3 e2e-spec files
(`auth`, `matching`+messaging, `safety`; 32 tests) — 42 tests total.

**After this pass:** 1 new e2e-spec file (`profiles.e2e-spec.ts`, 9 tests) plus 9 new tests added
to `auth.e2e-spec.ts` (email-casing login, duplicate-by-casing rejection, the banned-account
live-status check, and 3 logout tests) — **47 e2e tests + 10 unit tests = 57 total**, all passing
(`npm test` and `npm run test:e2e --runInBand`, verified in this session, not assumed from a prior
run). Per the audit's "Testing" being explicitly in-scope (unlike new product features), new
tests were added specifically where they verify a fix made in this same pass — not as a general
coverage-padding exercise.

## What is now covered that wasn't

| Area | Before | After |
|---|---|---|
| JWT live-status enforcement (`SECURITY_AUDIT.md` C-1) | Untested | ✅ e2e: banned account's pre-issued access token is rejected on the next request |
| Email normalization (`SECURITY_AUDIT.md` H-1) | Untested | ✅ e2e: login succeeds with different casing than registration; duplicate-by-casing registration rejected |
| Logout ownership check (`SECURITY_AUDIT.md` M-6) | Untested (logout had **no** test at all before this pass) | ✅ e2e: logout requires auth, revokes only the caller's own session, is a no-op against another user's token |
| `ParseUUIDPipe` on route params (`SECURITY_AUDIT.md` M-4) | Untested | ✅ e2e: malformed `:photoId`/`:userId` returns 400 |
| `@IsNotEmpty()` DTO fixes (`SECURITY_AUDIT.md` M-5) | Untested | ✅ e2e: empty `displayName`/`storageKey` rejected with 400 |
| Profiles module end-to-end (create/read profile, preferences, photos) | **Zero e2e coverage** | ✅ 9 e2e tests in the new `profiles.e2e-spec.ts` |

## Remaining gaps (not closed in this pass — see rationale below each)

### Missing unit tests

Only `AuthService` has unit tests. **No unit tests exist for:**
`UsersService`, `ProfilesService`, `MatchingService`, `MessagingService`, `ReportsService`,
`BlocksService`, `ModerationService`, `AuditService`, `JwtStrategy`, `JwtAuthGuard`,
`PermissionsGuard`, `AllExceptionsFilter`, `computeAge()`, or `paginate()`. The e2e suite exercises
all of this code indirectly (through real HTTP requests against a real Postgres instance), which
is arguably *more* trustworthy evidence of correctness than mocked-dependency unit tests — but it
means there is no fast, isolated regression signal for business-logic edge cases that don't
happen to be reachable through the currently-tested HTTP flows (e.g. `MatchingService`'s
`hydrateCandidateSummaries()` private method, or `computeAge()`'s leap-year/timezone edge cases).

**Recommended, not done in this pass:** unit tests for `MatchingService` (especially
`createMatchIdempotently()`'s P2002-handling path added in this audit — a true concurrent race is
hard to trigger deterministically in an e2e test without artificial delays, making this one case
where a mocked-Prisma unit test is a better tool than an e2e test) and `computeAge()` (pure
function, trivially unit-testable, currently has zero direct tests despite gating both age
display and — after `SECURITY_AUDIT.md` L-1's fix — minimum-age enforcement at registration).

### Missing e2e coverage

- **Users module:** `GET /users` (pagination, `status`/`email` filtering, `sortBy`/`sortDir`) has
  no e2e test. `GET /users/:id` is exercised implicitly via `/users/me` but the permission-gated
  `:id` variant (and its newly-added `profile.pii_view` audit entry — `SECURITY_AUDIT.md` M-3) has
  no direct test.
- **Reports:** `GET /reports` (moderator listing, `status` filter, sort) has only one implicit
  pass-through test inside `safety.e2e-spec.ts`; pagination/filtering combinations are untested.
- **Moderation cases:** `PATCH /moderation-cases/:id/assign` has no test — only `resolve` (via the
  ban scenario) is exercised.
- **Blocks:** `DELETE /blocks/:blockedId` (unblock) and `GET /blocks` (list own blocks) have no
  direct test — block *creation* and its downstream effect on matching/messaging are well covered,
  but the removal path is not.
- **Prompt answers:** `PUT /profiles/me/prompt-answers` has no e2e test at all.
- **Photo moderation:** `PATCH /profiles/photos/:photoId/moderation` (the approve/reject flow) has
  no e2e test — only photo *creation* is now covered (added in this pass).

**Why these weren't all closed in this pass:** the ones added were chosen specifically because
they verify a fix made in this same audit (the standard this audit held itself to: don't claim a
fix works, prove it against a real running server). Closing every remaining gap above is
legitimate, valuable follow-up work — and squarely "Testing," which is in-scope per this phase's
instructions — but doing all of it in the same pass as the security/db/api/production audits
would have meant either rushing the audit itself or writing untargeted tests just to raise a
coverage number. Recommended as the next concrete work item after this session.

### Missing edge-case tests

- Pagination boundary conditions (page beyond `totalPages`, `pageSize` at the 100 max, `pageSize`
  of 0/negative — DTO validation should reject these but there's no test confirming it).
- Concurrent-request race conditions beyond the one fixed in this pass — no test suite exists that
  deliberately fires concurrent requests to look for other races (the P2002 fix in `MatchingService`
  was found by code review, not by a failing concurrency test).
- Unicode/very-long-string edge cases in text fields (`displayName`, `bio`, message `body`) beyond
  the `@MaxLength()` boundary itself.

### Missing security-specific tests

- **No dedicated SQL-injection test suite** — not because the app is unprotected (Prisma's
  parameterized queries make classic SQL injection essentially unreachable through normal DTOs,
  confirmed by code review of every raw/dynamic query in the codebase — the only `$executeRawUnsafe`
  call is in `test/db-test-utils.ts`'s own test-teardown helper, operating on a hardcoded table
  list, not user input), but there is no automated test that actively tries injection payloads
  through every text input as a regression guard against a future raw-query mistake.
- **No XSS-specific test.** This is a JSON API with no server-rendered HTML anywhere in
  `backend/`, so reflected/stored XSS in the traditional sense isn't directly applicable here —
  responsibility for output-encoding user-generated text (bios, messages, display names) sits with
  the frontend that renders it, not this API. Worth noting explicitly in
  `docs/ember/SECURITY_NOTES.md` so it isn't silently assumed to be this layer's job.
- **No CSRF test** — not applicable in its classic form to a Bearer-token API with no cookie-based
  session (confirmed: no `Set-Cookie` anywhere in the auth flow), but this reasoning depends on
  `OPEN_DECISIONS.md` D-07's current architecture (access token in memory, refresh token in
  `localStorage`) holding. If that decision is ever revisited toward httpOnly cookies, CSRF
  protection becomes newly required and should be tested for at that time — flagged here so the
  dependency between D-07 and CSRF exposure is explicit.
- **No automated dependency-vulnerability test in CI** — see `PRODUCTION_READINESS.md`'s CI gap;
  `npm audit` was run manually during this audit (0 vulnerabilities) but nothing runs it
  automatically on a schedule or on every dependency bump.

### Missing load/performance tests

**None exist.** No k6/Artillery/autocannon script, no load-testing CI job, no documented
capacity/throughput baseline for any endpoint. This is reasonable for a pre-alpha product with no
real traffic yet, but means every capacity-related claim in `PRODUCTION_READINESS.md` (e.g. "the
100-row-in-memory throttler is fine at current scale") is based on code-review reasoning, not
measurement. **Recommended before any real external alpha traffic:** at minimum, a basic load test
against `GET /matching/candidates` (the one endpoint doing meaningful in-application-code
filtering rather than a direct indexed query) to confirm its actual latency under realistic
concurrent load.

## Summary

| Category | Status |
|---|---|
| Unit tests for core auth logic | Present (10 tests), unchanged in this pass |
| Unit tests for every other service | **Missing** — documented, recommended |
| E2E coverage of auth (register/login/refresh/logout) | **Complete** after this pass |
| E2E coverage of profiles | **New in this pass** (9 tests) — partial (photo moderation, prompt answers still untested) |
| E2E coverage of matching/messaging | Present, unchanged, thorough |
| E2E coverage of safety (reports/blocks/moderation) | Present, unchanged — assign/unblock/list gaps remain |
| E2E coverage of users listing/filtering | **Missing** |
| Security-specific automated tests (injection/XSS/CSRF regression suite) | **Missing** — reasoned about via code review instead |
| Load/performance tests | **Missing entirely** |
