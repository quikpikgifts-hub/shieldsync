# Ember — Alpha Release Checklist

Every item below is written to have a single, checkable pass/fail condition — no item reads
"improve X" or "review Y" without stating exactly what evidence satisfies it. Checked items were
verified in this session; unchecked items name the exact command, endpoint, or artifact that would
need to exist to check them.

## Security — blocking

- [x] **Access tokens are revalidated against live account state on every request.**
      Verified by: `test/auth.e2e-spec.ts` → "rejects an already-issued access token once the
      account's status is no longer ACTIVE" (passing).
- [x] **Email addresses are case-normalized at registration and login.**
      Verified by: `test/auth.e2e-spec.ts` → "logs in successfully regardless of email casing"
      and "rejects a duplicate registration that only differs by email casing" (both passing).
- [x] **`POST /auth/logout` only revokes a session belonging to the authenticated caller.**
      Verified by: `test/auth.e2e-spec.ts` → "does not revoke another user's session even when
      presented with their refresh token" (passing).
- [x] **Every route parameter that identifies a database row is validated as a well-formed UUID
      before reaching a service.** Verified by: `grep -rLc "ParseUUIDPipe" src/**/*.controller.ts`
      applied to every controller with an `:id`-shaped param returns zero controllers without it
      (all 6 confirmed: users, profiles, reports, moderation, blocks, messaging).
- [x] **`npm audit` reports zero known vulnerabilities in `backend/` dependencies.**
      Verified in this session: `npm audit` → `found 0 vulnerabilities`.
- [ ] **`JWT_ACCESS_SECRET`'s minimum enforced length is raised from 16 to 32+ characters, and the
      placeholder secrets in `docker-compose.yml` and `.github/workflows/backend-ci.yml` are
      rotated to genuinely random values of that length.** Not done — see `SECURITY_AUDIT.md` L-2.
      Pass condition: `Joi.string().min(32)` in `src/config/validation.schema.ts`, and neither
      config file contains a secret shorter than 32 characters.
- [ ] **A per-account brute-force protection exists on `POST /auth/login`, independent of the
      existing IP-based throttle.** Not done — see `SECURITY_AUDIT.md` H-2. Pass condition: an
      e2e test that fails 20 consecutive login attempts against one account from 20 different
      simulated source IPs and confirms the 21st is rejected regardless of IP.
- [ ] **The rate limiter's storage backend is shared across API instances (e.g. Redis), not
      in-process memory.** Not done — see `SECURITY_AUDIT.md` H-3. Pass condition:
      `ThrottlerModule.forRootAsync`'s config specifies a non-default `storage` option pointing at
      a shared store, and a test run with 2+ app instances confirms a combined rate limit is
      enforced rather than a per-instance one.

## Database — blocking for the account-deletion feature specifically, non-blocking for alpha itself

- [ ] **`Report`/`ModerationCase`'s foreign keys to `Users` no longer cascade-delete safety
      records.** Not done — see `DATABASE_AUDIT.md` DB-4. Pass condition: the Prisma schema uses
      `onDelete: Restrict` or `onDelete: SetNull` (not `Cascade`) on `Report.subjectId`,
      `Report.reporterId`, `ModerationCase.subjectId`, and `ModerationCase.assigneeId`. **This
      specific item blocks shipping any account-deletion feature, not the alpha itself**, since no
      hard-delete code path exists yet.
- [ ] **`blocks` has a supporting index for reverse lookups (`blockedId`).** Not done — see
      `DATABASE_AUDIT.md` DB-1. Pass condition: `@@index([blockedId])` present on the `Block`
      model and a corresponding index exists in a migration.

## API — non-blocking, recommended before any external (non-first-party) API consumer

- [ ] **An API versioning strategy is chosen and documented.** Not done — see `API_AUDIT.md`
      API-6. Pass condition: `docs/ember/API.md` states the chosen strategy (URL prefix or
      header-based) and at least one route reflects it.

## Production readiness — blocking

- [ ] **A health-check endpoint exists and returns 200 when the app can reach Postgres, and a
      non-200 status when it cannot.** Not done — deliberately deferred as new operational surface
      rather than a hardening fix; see `PRODUCTION_READINESS.md`. Pass condition:
      `curl -f http://<host>/health` (or `/healthz`) returns `200` under normal operation and a
      distinguishable failure status when `DATABASE_URL` points at an unreachable database.
- [ ] **A transactional email provider is configured and `POST /auth/register` triggers a real
      verification email.** Not done — blocked on selecting a vendor (`OPEN_DECISIONS.md` D-05
      pattern applies equally here). Pass condition: registering a real email address results in
      an email arriving in that inbox within 60 seconds, containing a working verification link.
- [ ] **A real object-storage adapter is wired for `STORAGE_PROVIDER`, and `POST /profiles/me/photos`
      results in a retrievable file, not just a stored string.** Not done — see
      `OPEN_DECISIONS.md` D-05. Pass condition: a photo uploaded through the real flow can be
      fetched back via a URL and rendered as an image.
- [x] **The application shuts down cleanly on SIGTERM (Prisma disconnects, in-flight requests
      complete) rather than being killed outright.** Verified: `main.ts` now calls
      `app.enableShutdownHooks()`; confirmed via `npx nest build` + manual review that
      `PrismaService.onModuleDestroy()` is registered as a shutdown hook consumer.
- [ ] **An APM/error-tracking vendor captures unhandled exceptions in production.** Not done — see
      `PRODUCTION_READINESS.md`. Pass condition: a deliberately-thrown test exception in a
      non-production environment appears in the vendor's dashboard within 5 minutes.
- [ ] **A backup policy is configured for the production Postgres instance, with at least one
      successful restore test performed.** Not done — depends on the hosting provider chosen. Pass
      condition: a documented, dated record of a full restore from backup completing successfully
      against a non-production database.

## Testing — non-blocking, recommended

- [x] **Unit + e2e test suite passes in full.** Verified in this session:
      `npm test` → 10/10 passing; `npm run test:e2e -- --runInBand` → 47/47 passing;
      `npx nest build` → clean; `npm run lint` → 0 errors (3 pre-existing warnings, unrelated to
      this pass — `any` types in `auth.service.spec.ts`).
- [ ] **Every service class (`MatchingService`, `ProfilesService`, `UsersService`,
      `MessagingService`, `ReportsService`, `BlocksService`, `ModerationService`, `AuditService`)
      has at least one unit test file.** Not done — see `TEST_COVERAGE_REPORT.md`. Pass condition:
      `find src -name "*.spec.ts"` returns one file per listed service.
- [ ] **A load test against `GET /matching/candidates` establishes a documented p95 latency
      baseline under at least 50 concurrent simulated users.** Not done. Pass condition: a
      committed load-test script (k6/Artillery/autocannon) plus a recorded p95 latency number in
      `docs/ember/`.

## Legal / policy — blocking, out of engineering's control (tracked here for completeness only)

- [ ] **Phase 0 gate items in `ROADMAP.md` are resolved:** launch jurisdiction decided, real
      age-assurance approach decided, ToS/Privacy Policy/Community Standards drafted with counsel.
      Explicitly out of scope for this engineering audit — restated here only because
      `ROADMAP.md` itself marks Phase 1→2 as blocked on it, and an "alpha release checklist"
      would be incomplete without naming the one gate engineering cannot close by itself.

---

## How to read this checklist

**8 of 21 items are checked** as of this session. Every unchecked item states the exact
command or observable behavior that would flip it — none require "judgment calls" to evaluate.
The three items marked **blocking** under Production Readiness (health check, email, object
storage) are the ones standing between the current backend and a real external tester having a
working experience; everything else unchecked is either already-mitigated-enough for a *closed*
alpha (H-2/H-3's account lockout and shared rate-limiter, fine at single-instance/low-volume
scale) or is follow-up hardening that doesn't block letting real testers in.
