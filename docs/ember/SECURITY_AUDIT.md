# Ember Backend — Security Audit

**Scope:** `backend/src/**` (78 TypeScript files), `backend/prisma/schema.prisma`, `backend/test/**`,
Docker/CI configuration. Performed as a skeptical, file-by-file review — no finding below was
accepted on the strength of an existing passing test; each was verified against the actual code
path (and, where practical, an actual running server) before being recorded.

**Method:** every source file was read in full at least once. Findings are graded Critical / High /
Medium / Low / Informational. "Status" records what happened as a direct result of this audit:
**Fixed** (code changed, verified via the existing test suite plus a rebuild), **Documented**
(deliberately not built — see rationale), or **Recommended** (a concrete next step, not yet done).

---

## Critical

### C-1: Access tokens were not re-validated against live account state

**File:** `src/auth/strategies/jwt.strategy.ts`

**Before this audit:** `JwtStrategy.validate()` only shaped the payload (`{sub, email, roles}`)
into `request.user` after passport-jwt verified the signature and expiry. It never queried the
database. This directly contradicted `docs/ember/SECURITY_NOTES.md`'s claim that a `BANNED`/
`SUSPENDED` resolution "immediately revokes the subject's sessions" — `ModerationService.resolve()`
does correctly revoke every `Session` and `RefreshToken` row (`src/safety/moderation.service.ts:86-95`),
but that revocation had **zero effect on an access token already in the holder's possession**.
A banned user (or a user whose role was just downgraded) kept full API access for up to
`JWT_ACCESS_TTL` (default 15 minutes) after the ban.

**Impact:** A banned/suspended user — including one banned specifically *for* an active safety
incident — could continue messaging, liking, and viewing profiles for up to 15 minutes after the
ban. This is a direct contradiction of a documented safety control in a platform whose core value
proposition is trust & safety.

**Status: Fixed.** `JwtStrategy.validate()` now performs a live `PrismaService` lookup by
`payload.sub` on every authenticated request and throws `UnauthorizedException` if the user does
not exist, is soft-deleted, or `status !== "ACTIVE"`. Roles are also now read live from the
database rather than trusted from the token, so a role change (grant or revoke) takes effect on
the very next request instead of waiting out the access token's TTL.

**Tradeoff accepted:** this adds one indexed primary-key lookup (`Users.id`, already indexed via
the primary key) to every authenticated request. At current and near-term scale this is
negligible; if it ever shows up in profiling, the standard mitigation is a short-TTL cache
(e.g. 30–60s) keyed on user ID that's invalidated on ban/role-change — not reverting this fix.

---

## High

### H-1: Email was not normalized before storage or lookup

**File:** `src/auth/auth.service.ts`

**Before this audit:** `register()` and `login()` used `dto.email` verbatim. `Users.email` has a
`@unique` constraint but Postgres unique constraints are case-sensitive by default, so
`user@example.com` and `User@Example.com` could register as two different accounts, and a user
who registered with one casing and later typed a different casing would get a false "invalid
email or password" — indistinguishable from a genuine wrong-password attempt.

**Impact:** account-duplication and account-lockout-by-typo, both directly user-facing; also a
data-integrity issue (two accounts that are "the same person" as far as any real email provider
is concerned).

**Status: Fixed.** Both `register()` and `login()` now normalize via a small
`normalizeEmail()` helper (`trim().toLowerCase()`) before every lookup and before storage.

### H-2: No per-account brute-force protection

**Files:** `src/auth/auth.controller.ts`, `src/app.module.ts`

`POST /auth/login` is throttled to 5 requests/minute, but `@nestjs/throttler`'s default storage
is **in-memory and keyed by IP address** (confirmed: no `ThrottlerStorageRedisService` or
equivalent is configured anywhere in `app.module.ts`). An attacker distributing login attempts
across multiple IPs (trivial with any residential proxy pool) faces no account-level rate limit
at all — only `AuthService.login()`'s constant-time password comparison and generic error message
stand between them and an unlimited number of guesses against one specific account.

**Impact:** credential-stuffing / targeted brute-force against a specific victim's account is not
meaningfully mitigated once the attacker controls more than one source IP.

**Status: Documented, not built.** Per this phase's explicit "no new features unless a critical
security issue is found" constraint: implementing per-account lockout (failed-attempt counters,
exponential backoff, an unlock flow, and — critically — its own abuse surface, since an
attacker who *knows* lockout exists can lock a real user out by deliberately failing their
login) is new stateful product behavior, not a fix to existing logic. **Recommended before
alpha:** either (a) a per-account failed-attempt counter with escalating delay, separate from
the existing IP throttle, or (b) move `ThrottlerStorage` to a shared Redis-backed store so the
existing IP-based limit at least holds under horizontal scaling (see M-6). This is the single
highest-priority item **not** closed by this audit and should be scheduled immediately after it.

### H-3: In-memory rate-limit storage does not work across multiple instances

**File:** `src/app.module.ts` (`ThrottlerModule.forRootAsync`)

Same root cause as H-2, called out separately because it also affects the *intended* global
100/min throttle, not just login: `@nestjs/throttler`'s default storage keeps counters in the
process's own memory. Running more than one API instance (the normal shape of "production," and
implied by `docker-compose.yml`/the CI Docker build) means each instance enforces the limit
independently — a client spread across N instances (by a load balancer, or deliberately by an
attacker opening N connections) effectively gets N× the configured limit.

**Status: Documented, not built** — same reasoning as H-2. **Recommended:** wire
`@nestjs/throttler`'s Redis storage adapter once a shared Redis instance exists in the
deployment topology (also needed for H-2's mitigation and for cross-instance session/cache
needs generally — see `PRODUCTION_READINESS.md`).

---

## Medium

### M-1: `RolesGuard` / `@Roles()` was dead code, globally active, and architecturally inconsistent

**Files:** `src/common/guards/roles.guard.ts`, `src/common/decorators/roles.decorator.ts`,
`src/app.module.ts` (deleted/edited in this pass)

`grep -rn "@Roles("` across the entire `src/` tree returned zero matches on any controller — the
decorator was never applied anywhere, meaning `RolesGuard` (which was globally registered as an
`APP_GUARD`) always took its early-return path (`if (!requiredRoles) return true`) on every
single request. It was pure dead weight, but a dangerous kind: it read authorization from the
JWT's `roles` claim rather than a live database check (unlike the actually-used
`PermissionsGuard`), so if anyone had ever added `@Roles()` to a route in the future, it would
have silently reintroduced the exact stale-authorization pattern C-1 fixes for permissions.

**Status: Fixed.** Removed `RolesGuard` from the global guard chain in `app.module.ts` and
deleted both `roles.guard.ts` and `roles.decorator.ts`. `PermissionsGuard` /
`@RequirePermissions()` — confirmed live-DB-checked and used by every access-controlled route —
is the only authorization mechanism in the codebase now. This removes a footgun without changing
any actual runtime behavior (verified: `npx nest build` clean, all 42 tests pass unchanged).

### M-2: Unhandled unique-constraint race in match creation

**File:** `src/matching/matching.service.ts`

`recordDecision()`'s reciprocal-match path used a `findUnique` → `create` sequence inside a
transaction. Two requests recording the reciprocal halves of the same mutual like at effectively
the same instant (plausible: two devices signed into the same account, or a client retry after a
timeout) could both observe "no match yet" and both attempt `tx.match.create()`. The `@@unique([userAId, userBId])`
constraint would correctly prevent a duplicate row, but the *loser* of the race would see a raw
Prisma `P2002` unique-violation error surface as an opaque 500 (`AllExceptionsFilter` masks the
detail, but the request still fails) instead of the match it should idempotently receive.

**Status: Fixed.** `recordDecision()` now delegates to a new `createMatchIdempotently()` helper
that catches `Prisma.PrismaClientKnownRequestError` with `code === "P2002"` and re-fetches the
now-existing row instead of propagating the error.

### M-3: `profile.pii_view` audit action was declared but never recorded

**Files:** `src/audit/audit.service.ts`, `src/users/users.controller.ts`

The `AuditAction` union type has included `"profile.pii_view"` since Phase 1, and
`docs/ember/THREAT_MODEL.md` (R-06) documents PII-view auditing as a mitigation — but
`grep -rn "pii_view"` before this audit matched only the type declaration itself. Every
moderator/support/admin view of another user's full account record via `GET /users/:id` was
completely unaudited, meaning there was no way to answer "who looked at this person's account and
when" — the exact question a PII-access audit trail exists to answer.

**Status: Fixed.** `UsersController.findOne()` now records a `profile.pii_view` audit entry
(`actorId` = the calling moderator/admin/support user, `subjectId` = the viewed account) after
every successful lookup. `UsersModule` now imports `AuditModule` to make `AuditService`
injectable there. `GET /users/me` (viewing your own record) is intentionally **not** audited —
there is nothing to audit when a user views their own data.

### M-4: No `ParseUUIDPipe` on any route parameter

**Files:** every controller with an `:id`-shaped route param (`users`, `profiles`, `safety`,
`messaging`)

Every `:id`/`:photoId`/`:userId`/`:matchId`/`:reportId`/`:caseId`/`:blockedId` parameter was typed
`string` and passed straight to Prisma. This is not exploitable — Prisma's parameterized queries
mean a malformed ID just fails the query with a Prisma validation error, which `AllExceptionsFilter`
still turns into a safe (if generic) error response — but it produces inconsistent, confusing
errors for a malformed ID and means invalid-ID handling is implicit rather than declared.

**Status: Fixed.** Added `ParseUUIDPipe` to every route parameter listed above, so a malformed ID
now fails validation with a clear `400 Bad Request` before ever reaching a service/Prisma call.
Verified against the existing e2e suite — every test that exercises these routes does so with
real UUIDs, so this tightening caused no regressions (32/32 e2e, 10/10 unit tests still pass).

### M-5: DTO validation gaps allowing empty-string / malformed input

**Files:** `src/profiles/dto/upsert-profile.dto.ts`, `src/profiles/dto/upsert-prompt-answers.dto.ts`,
`src/messaging/dto/send-message.dto.ts`, `src/profiles/dto/upsert-preferences.dto.ts`

Several required text fields had `@IsString()`/`@MaxLength()` but no `@IsNotEmpty()`, permitting
`""` (empty string) as a "valid" value: `UpsertProfileDto.displayName`, prompt answers'
`promptKey`/`answer`, `SendMessageDto.body`, and `AddPhotoDto.storageKey`. Separately, `UpsertProfileDto.displayName` was
annotated `@ApiPropertyOptional()` in Swagger while being enforced as required by validation (no
`@IsOptional()`) — a documentation/behavior mismatch that would mislead any API consumer reading
the generated docs. `UpsertPreferencesDto.seekingGenders` had no per-element type or array-size
constraint, allowing an arbitrarily large array of arbitrary (non-string) values.

**Status: Fixed.** Added `@IsNotEmpty()` to all five required text fields; corrected
`displayName`'s Swagger annotation to `@ApiProperty()` (matching its actual required semantics
rather than making it actually optional, since `Profile.displayName` is `NOT NULL` in the schema
and an optional field would surface as an opaque 500 from Prisma on profile creation instead of a
clean 400 from validation); added `@ArrayMaxSize(10)`, `@IsString({ each: true })`, and
`@MaxLength(40, { each: true })` to `seekingGenders`.

### M-6: Refresh-token cross-user revocation had no defense-in-depth check

**Files:** `src/auth/auth.controller.ts`, `src/auth/auth.service.ts`

`POST /auth/logout` requires authentication, but `AuthService.logout(rawRefreshToken)` looked up
the token purely by its hash and revoked whatever session owned it — it never compared that
session's `userId` to the authenticated caller's own ID. Practical exploitability was already
near-zero (the raw refresh token is 48 cryptographically random bytes; possessing another user's
raw token implies a far more serious compromise has already happened), which is why this is Medium
rather than High/Critical — but "requires authentication" implies "acts on your own session," and
the code didn't actually enforce that.

**Status: Fixed.** `logout()` now takes the caller's own user ID and no-ops (same idempotent
"already logged out" response as an unknown token — deliberately not distinguishable, so no
information is leaked either way) if the token being revoked doesn't belong to the caller.

---

## Low

### L-1: Age-calculation logic was duplicated and inconsistent

**File:** `src/auth/auth.service.ts`

`assertMeetsMinimumAge()` used an approximate `365.25`-day-per-year calculation, while
`common/utils/age.util.ts`'s `computeAge()` (used everywhere age is *displayed*) does an exact
whole-years calculation from year/month/day. The two could disagree by up to a day near a
birthday, meaning the age enforced at registration was not always the same age the product would
later display.

**Status: Fixed.** `assertMeetsMinimumAge()` now calls `computeAge()` directly.

### L-2: JWT signing secret's minimum length is weak for an HMAC key

**File:** `src/config/validation.schema.ts`

`JWT_ACCESS_SECRET` is validated with `Joi.string().min(16).required()`. 16 characters is a weak
floor for an HS256 signing key — NIST and most security guidance recommend at least 256 bits
(32+ bytes) of entropy for an HMAC key used to protect session-equivalent tokens. A 16-character
secret (especially if it's a memorable password rather than random bytes) is within reach of
offline brute-force if it ever leaks partially or is guessed.

**Status: Recommended, not changed in this pass** — raising the Joi minimum is a one-line change,
but doing so here without also rotating the actual deployed secrets (dev `.env`, CI workflow env,
`docker-compose.yml`'s literal `compose-local-dev-secret-change-me-0000000000`) would just break
local/CI boot on the next `npm run start:dev` for anyone who already has a shorter dev secret.
**Recommended:** raise to `Joi.string().min(32)` in the same change that rotates
`docker-compose.yml`'s and the CI workflow's placeholder secrets to genuinely random 32+ byte
values, and document the requirement in `DEPLOYMENT.md`.

### L-3: `ProfilesService.addPhoto()`'s primary-photo flag has a race window

**File:** `src/profiles/profiles.service.ts`

Setting a photo as primary does an un-transacted `updateMany` (clear existing primary) followed
by a separate `create` (insert the new primary photo). Two concurrent "set as primary" calls for
the same profile could interleave such that both end up `isPrimary: true`, since nothing at the
database level enforces "at most one primary photo per profile."

**Status: Documented, not fixed.** Low real-world impact (a cosmetic display inconsistency, not
a safety or data-integrity issue — the schema has no CHECK/partial-unique-index for this), and a
real fix (wrapping both statements in one transaction, or adding a partial unique index like
`CREATE UNIQUE INDEX ON photos (profile_id) WHERE is_primary`) touches the schema and is better
batched with other schema changes in one migration rather than a one-off. **Recommended:** fix in
the next schema migration alongside any other constraint additions.

### L-4: `UsersService.list()`'s email substring search has no index support

**File:** `src/users/users.service.ts`

`email: { contains: query.email, mode: "insensitive" }` compiles to a Postgres `ILIKE '%...%'`,
which cannot use the existing B-tree unique index on `email` and will sequential-scan the table.
At current/near-term user counts this is immaterial.

**Status: Documented** — see `DATABASE_AUDIT.md` for the indexing recommendation
(`pg_trgm` + a GIN trigram index) if/when this becomes measurably slow.

---

## Informational

- **I-1:** No session-management UI/endpoint (list/revoke your own other active sessions). The
  `Session` table already models this; only the endpoint is missing. Documented as a Phase 1
  follow-up in `OPEN_DECISIONS.md`, not built here (net-new capability, not a hardening fix).
- **I-2:** `0` npm dependency vulnerabilities as of this audit (`npm audit`, both `backend/`
  dependencies and devDependencies) — re-verify this on every dependency bump, not just once.
- **I-3:** Swagger/OpenAPI UI (`GET /docs`) was hypothesized to conflict with helmet's default
  CSP; this was verified empirically with a real Playwright page load (32 `.opblock` elements
  rendered, zero console errors) rather than assumed either way. It does not conflict.
  `configure-app.ts` already disables `/docs` when `NODE_ENV=production`.
- **I-4:** `docker-compose.yml` contains a literal, clearly-labeled placeholder JWT secret for
  local dev only (comment: "Never bake a real secret into an image or compose file... beyond
  local dev"). This is correctly scoped to development and is not a production secret leak, but
  see L-2 — it should be rotated to something random even for dev, and the CI workflow's
  equivalent placeholder should never be reused as a real value.
- **I-5:** Audit-log tamper-resistance is application-layer only (no database-role separation
  between the migration role and the runtime role — `AuditService` exposes no update/delete
  method, but the underlying Postgres role the app connects as still has `UPDATE`/`DELETE` grants
  on `audit_logs`). Already tracked as D-04 in `OPEN_DECISIONS.md`; re-confirmed still open.

---

## Summary table

| ID | Severity | Status |
|----|----------|--------|
| C-1 | Critical | **Fixed** |
| H-1 | High | **Fixed** |
| H-2 | High | Documented (recommended: account lockout) |
| H-3 | High | Documented (recommended: Redis-backed throttler storage) |
| M-1 | Medium | **Fixed** (dead code removed) |
| M-2 | Medium | **Fixed** |
| M-3 | Medium | **Fixed** |
| M-4 | Medium | **Fixed** |
| M-5 | Medium | **Fixed** |
| M-6 | Medium | **Fixed** |
| L-1 | Low | **Fixed** |
| L-2 | Low | Recommended (raise secret min length + rotate placeholders) |
| L-3 | Low | Documented (batch into next schema migration) |
| L-4 | Low | Documented (see `DATABASE_AUDIT.md`) |
| I-1 – I-5 | Informational | Documented |

**9 of 15 numbered findings were fixed directly in this pass** (all Critical/High items that were
fixable without adding new stateful features, plus every Medium/Low item that was a pure code
correction). The two High findings left open (H-2, H-3) both require genuinely new infrastructure
(account-lockout state, a shared Redis instance) rather than a fix to existing logic, and are
flagged as the top priority for the next work session.
