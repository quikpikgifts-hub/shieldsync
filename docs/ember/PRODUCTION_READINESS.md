# Ember Backend — Production Readiness Assessment

This is a gap analysis, not a checklist of things already done — see `ALPHA_RELEASE_CHECKLIST.md`
for the measurable, actionable version of everything below. Each gap here is graded by how much it
blocks a *real external alpha tester* (not a production launch at full scale — see
`ROADMAP.md` for the phase gates governing that).

## Fixed in this pass

- **Graceful shutdown:** `main.ts` now calls `app.enableShutdownHooks()`. Before this, a SIGTERM
  (the normal signal a container orchestrator sends to stop a pod/container) skipped every
  `OnModuleDestroy` hook, including `PrismaService.$disconnect()` — connections were held open
  until the process was killed outright rather than released cleanly. This is a one-line fix with
  no tradeoff, so it was applied directly rather than merely documented.

## Missing integrations (all confirmed via `docs/ember/OPEN_DECISIONS.md` and the
`NotConfigured*Provider` pattern in `src/integrations/**` — every one of these throws a clear,
typed `IntegrationNotConfiguredError` rather than silently no-oping, so failures here are loud,
not silent)

| Integration | Extension point exists? | Real adapter exists? | Blocks alpha? |
|---|---|---|---|
| Payments (Stripe) | Yes (`PAYMENT_PROVIDER`) | No | No — no paid tiers needed for a closed/alpha cohort |
| SMS (Twilio) | Yes (`SMS_PROVIDER`) | No | Only if phone verification is required for alpha testers |
| Email | Yes (`EMAIL_PROVIDER`) | No | **Yes** — no way to deliver a verification email, password-reset email, or any transactional notification |
| Object storage (S3) | Yes (`STORAGE_PROVIDER`) | No | **Yes** — photos are not really stored; `storageKey` is a client-supplied string with nothing behind it (`OPEN_DECISIONS.md` D-05) |
| Identity verification | Yes (`IDENTITY_VERIFICATION_PROVIDER`) | No | No — Phase 2 item per `ROADMAP.md`, self-attested DOB is the accepted (if weak) Phase 1 control |
| AI (OpenAI/Anthropic) | Yes (`AI_PROVIDER`) | No | No — no AI features exist yet (Phase 3) |
| Push notifications | Yes (`PUSH_PROVIDER`) | No | No — not required for a web-only alpha |
| Analytics | Yes (`ANALYTICS_PROVIDER`) | No | No — nice-to-have, not blocking |

**The two integrations that actually block a real external alpha are email and object storage.**
Without email, there is no way to verify an account or recover a lost password — both of which a
real (non-team-member) tester will need. Without object storage, "upload a profile photo" — core
to a dating product — does not actually work end-to-end; the moderation *workflow* is real and
tested, but there's no real file behind it.

## Missing verification flows

- **Email verification:** `Users.emailVerifiedAt` exists in the schema and is returned by
  `GET /users/me`, but nothing ever sets it — there is no verification-email-send endpoint and no
  token-based verify-email endpoint. Blocked on the email integration above.
- **Phone verification:** same gap, same blocker (SMS integration), lower priority since phone is
  optional (`Users.phone` is nullable).

## Observability

- **No APM/error-tracking vendor wired up.** Structured logging exists via Nest's built-in
  `Logger` (confirmed used consistently — `PrismaService`, `AuditService`, and Nest's own
  bootstrap/route logging all use it), but there is no Sentry/Datadog/equivalent capturing
  unhandled exceptions, no distributed tracing, and no dashboards.
- **No HTTP access-log middleware.** Only Nest's own startup/route-registration logs exist; there
  is no per-request log line (method, path, status, latency) — meaningful for both debugging and
  detecting abuse patterns.
- **No metrics endpoint.** No `/metrics` (Prometheus-style) or equivalent — request counts,
  latency histograms, error rates, and DB query timing are all currently invisible outside of
  manually reading Postgres/Node process stats by hand.

## Health checks

**No `/health` or `/healthz` endpoint exists anywhere in the routing table.** This blocks any
container orchestrator's liveness/readiness probes, and blocks any load balancer's health-based
routing decisions. This was deliberately **not built** in this pass: per the phase's explicit
"do not add new features" constraint, a health-check endpoint is new operational surface (a new
controller/route), not a fix to existing broken logic — even though it is squarely part of what
"production readiness" means. It is the single most important net-new item to build before any
real deployment, and should be the first thing built in the next session, ahead of anything else
in this document.

## Backups & disaster recovery

No backup strategy is configured anywhere in this repository (`docker-compose.yml`'s Postgres
service uses a plain named volume with no backup/snapshot automation; there is no `pg_dump` cron,
no WAL archiving, no point-in-time-recovery configuration). This is expected for a local dev
setup — it is not this repository's job to configure a managed hosting provider's backup policy —
but it must be explicitly configured wherever this is actually deployed, and is called out here so
it isn't assumed to be "someone else's problem" without anyone actually owning it.

## Alerts

None configured (no alerting rules for error-rate spikes, DB connection exhaustion, disk space,
failed audit-log writes, etc.). Depends on the observability/APM gap above being closed first —
there's nothing to alert on until something is emitting metrics.

## Production configuration review

- **CORS:** `CORS_ORIGIN` is a comma-separated allowlist, correctly parsed
  (`config/configuration.ts`) and defaults to local dev origins only — must be set to the real
  production frontend origin(s) before deployment; confirmed there is no wildcard (`*`) fallback
  anywhere.
- **Helmet:** default security headers applied via `configure-app.ts`; confirmed (via a real
  Playwright page load, not assumed) that this does not break Swagger UI, which is itself
  correctly disabled when `NODE_ENV=production`.
- **Secrets:** `JWT_ACCESS_SECRET` is required with no default (Joi `.required()`, confirmed the
  app fails to boot without it) — good. Its minimum-length floor is weak (16 chars) — see
  `SECURITY_AUDIT.md` L-2 for the specific recommendation to raise it alongside rotating the
  placeholder values in `docker-compose.yml`/CI.
- **Rate-limiter storage:** in-memory, not shared across instances — see `SECURITY_AUDIT.md` H-3.
  This is the configuration item most likely to cause a real production incident (a
  multi-instance deployment silently running with a much higher effective rate limit than
  intended) if it isn't addressed before scaling past one instance.
- **No compression middleware** (e.g. `compression()`) configured — every response is sent
  uncompressed. Low priority at current payload sizes (no photo binaries pass through this API —
  those go straight to object storage once that integration exists — and JSON responses are
  small), worth revisiting once response sizes grow.
- **No explicit request body size limit** — relying on Express/`body-parser`'s default (100kb for
  JSON). Reasonable default for this API's actual payloads (no file uploads go through JSON
  bodies), but should be an explicit, reviewed decision rather than an implicit default once real
  traffic exists.
- **No API versioning strategy** — see `API_AUDIT.md` API-6.
- **Docker image** has no `HEALTHCHECK` instruction (the `docker-compose.yml` Postgres service
  has one; the `api` service does not) — depends on the `/health` endpoint gap above being closed
  first, since there's nothing meaningful to check yet.
- **CI has no dependency/image vulnerability scanning step** (no `npm audit` gate, no container
  image scan like Trivy, no SAST/CodeQL step) — `backend-ci.yml` runs lint/build/test/e2e/Docker
  build but nothing that would catch a newly-disclosed CVE in a dependency automatically on a
  schedule (only at whatever moment someone happens to run `npm audit` by hand, as this audit did).

## Summary — ranked by how much each gap blocks a real external alpha tester

1. **Blocking:** no email delivery → no account verification, no password reset.
2. **Blocking:** no real object storage → photo upload doesn't actually work end-to-end.
3. **Blocking (operational, not functional):** no health-check endpoint → can't be safely deployed
   behind any standard container orchestrator or load balancer.
4. **High:** rate-limiter storage doesn't work correctly across multiple instances
   (`SECURITY_AUDIT.md` H-3) — fine for a single-instance alpha, a real risk the moment a second
   instance is added for availability.
5. **High:** no APM/error tracking — an alpha with real external testers *will* surface bugs that
   are much harder to find without one.
6. **Medium:** no backups configured for wherever this actually gets deployed.
7. **Medium:** no HTTP access logging, no metrics, no alerts — all follow from #5.
8. **Low:** compression, request size limits, API versioning, CI vulnerability scanning — real,
   but none of these block a closed external alpha the way #1–#5 do.
