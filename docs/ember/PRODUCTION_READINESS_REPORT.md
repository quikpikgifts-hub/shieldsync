# Ember Backend — Production Readiness Report (Phase 5: External Alpha Deployment & Operational Validation)

This report closes out Phase 5. Read it alongside `ENTERPRISE_READINESS_REPORT.md` (the
RC-1 code/security scorecard) — that report scored the code; this one scores whether the
system has actually been proven to operate in a real environment. **It has not, and this
report says so plainly.**

## What Phase 5 was asked to do, and what actually happened

The stated objective was to deploy Ember into a real cloud environment and validate every
operational component against it. Before doing anything, the `AWS_ACCESS_KEY_ID`/
`AWS_SECRET_ACCESS_KEY` present in this session's sandbox were checked for real — `aws sts
get-caller-identity` returned `InvalidClientTokenId`. **These are not valid AWS
credentials.** No AWS account, no domain, and no email-sending vendor account exist that
this session has access to. Real cloud deployment was therefore not possible this session,
regardless of authorization — there was nothing to deploy to.

Given that, this session did everything genuinely executable without fabricating a
deployment that didn't happen: real local Postgres, real local Redis, a real local
S3-compatible object store, and a real local SMTP-capture server were stood up, the actual
compiled application was run against them in `NODE_ENV=production`, and a real,
comprehensive validation pass was executed against that running instance. Every number in
`LOAD_TEST_REPORT.md`, `PRODUCTION_SECURITY_REPORT.md`, and `DISASTER_RECOVERY_REPORT.md`
is a real measurement from this session, not an estimate — but all of it is against local
infrastructure, not the real cloud environment Phase 5 asked for.

## Infrastructure status

**Not deployed.** `infra/terraform/` remains infrastructure-as-code complete (unchanged
since RC-1: `terraform fmt` clean, manually reviewed, `init`/`plan`/`apply` never run,
`registry.terraform.io` blocked by this sandbox's network policy). No AWS account exists.
No domain is registered. No email vendor account exists. No Secrets Manager secret exists.
No CDN, load balancer, or DNS record exists anywhere real.

## Deployment status

**Zero deployments.** The CI/CD pipeline (`backend-deploy.yml`) that would perform a real,
credential-gated deployment (GitHub OIDC → `aws ecs update-service` → health-check
validation) has never run against real infrastructure — there is nothing for it to deploy
to. Database migrations have been run and verified against real local Postgres instances
repeatedly (RC-1 and this session) but never against a real production database, because
none exists.

## Security status

Every application-layer security control that can be exercised without real cloud
infrastructure was tested for real this session and passed — rate limiting under real
concurrency, JWT revocation, RBAC enforcement (live, not JWT-cached), the RC-1 photo-hijack
fix re-confirmed against a live running instance, HTTP security headers actually present on
real responses, CORS correctly rejecting a disallowed origin, no secret leakage in error
responses or process listings, and real audit-log rows written for real actions. Full
detail: `PRODUCTION_SECURITY_REPORT.md`. What remains unverified is exclusively the
infrastructure-dependent half: real AWS IAM enforcement, real TLS termination, real Secrets
Manager behavior, and real internet-facing exposure — none of which can be tested without
the infrastructure that doesn't exist yet.

## Performance

Real load testing (not estimated) shows zero errors, zero timeouts, and sub-200ms p99
latency at load levels far exceeding what a 25-100 person alpha will realistically
generate, with memory growth that plateaued rather than climbing indefinitely over a
45-second soak. This ran on unconstrained local sandbox hardware against localhost, not the
`db.t4g.micro`/single-Fargate-task sizing the real Terraform config specifies — it is
evidence of no obvious pathological bottleneck, not a real production capacity number. Full
detail: `LOAD_TEST_REPORT.md`.

## Monitoring

Structured JSON logging, `/metrics` (Prometheus format), and `/health`/`/ready`/`/live`
were all confirmed working against the real running local instance. Sentry error tracking
is code-integrated but has no real project/DSN configured (`SENTRY_DSN` was empty this
session). CloudWatch alarms are Terraform-defined-none-yet — `modules/ecs` doesn't
currently include alarm resources at all (a gap worth noting: `DEPLOYMENT_READINESS_CHECKLIST.md`'s
Monitoring section lists specific required alarms — ECS unhealthy-task, RDS CPU/storage,
ALB 5xx-rate — that don't yet have corresponding Terraform resources, only a documented
intent). No alert has ever fired against a real environment, and no dashboard exists,
because no real environment exists to monitor.

## Backup validation

A real backup/restore drill was performed this session against real local PostgreSQL data
— dump completed in 0.31s, restore into a fresh scratch database completed in 0.53s, and
every row count, spot-checked content value, foreign key, and index was verified intact
post-restore. This validates the schema is genuinely backup/restorable. It does not
validate RDS's actual automated-backup/point-in-time-recovery mechanism, which requires a
real RDS instance. Full detail: `DISASTER_RECOVERY_REPORT.md`.

## Operational risks

- **No on-call owner named.** `OPERATOR_RUNBOOK.md` exists and was exercised indirectly
  this session (its documented commands were the basis for the real validation performed),
  but nobody is designated to act on it for a real incident.
- **No support channel exists** for real testers to reach.
- **No report/block UI** in the frontend, despite the backend fully supporting and this
  session re-confirming both work correctly end-to-end (see RC-1's
  `ENTERPRISE_READINESS_REPORT.md` Frontend section — unchanged this phase, still open).
- **No monitoring alarms actually defined in Terraform** — noted above, a real gap
  discovered this phase that RC-1's infrastructure review didn't specifically flag.
- **Memory behavior beyond 45 seconds under load is unverified** — plateaued in the window
  tested, but that window is too short to fully rule out a slow leak under real production
  duration.

## Known issues (carried from RC-1, unchanged)

One Low-severity finding remains open by design (`ModerationService.assign` doesn't verify
the target actually holds moderator permissions before assignment — a data-integrity issue,
not an authorization bypass), deferred in RC-1 to keep that pass in Critical/High-only fix
scope. No column-level database encryption. `AuditLog` append-only enforcement is
application-layer only. See `ENTERPRISE_READINESS_REPORT.md` for the full list.

## Recommendations

In order, before any real user touches this system:

1. Obtain a real AWS account with valid credentials and billing configured; run
   `terraform init/validate/plan/apply` for real (from an environment where
   `registry.terraform.io` isn't blocked — this sandbox's network policy blocks it).
2. Choose and configure a real email-sending vendor (SES, Postmark, or SendGrid) and a real
   domain.
3. Add the missing CloudWatch alarm resources to `infra/terraform/modules/ecs` (or wherever
   they belong) — noted this phase as a real, previously-unflagged infrastructure gap.
4. Once real infrastructure exists, **re-run `backend/scripts/launch-verification.mjs`
   (the exact script used for this session's local validation) against the real deployed
   URL** — it is written generically for this purpose (`BASE_URL`, `DATABASE_URL`,
   `CAPTURED_EMAILS_PATH` env vars) and will give the same real, itemized pass/fail
   evidence against real infrastructure that it gave against local infrastructure this
   session.
5. Re-run a real load test against the real deployed sizing before treating
   `LOAD_TEST_REPORT.md`'s numbers as any kind of production capacity claim.
6. Close the remaining RC-1 launch blockers unrelated to infrastructure: report/block UI,
   legal documents, named on-call, support channel (see `RC1_RELEASE_NOTES.md`).

## GO / NO-GO

# NO-GO

Not because of code quality — the RC-1 code review scored this codebase well, this
session's Critical security fix held up under live re-testing, and every application-layer
control exercisable without real infrastructure passed for real. The recommendation is
NO-GO for one direct reason: **there is no real deployed environment for an alpha tester to
use.** No AWS account, no domain, no live URL, nothing reachable outside this sandbox. A
GO or GO-WITH-CONDITIONS recommendation implies something exists that a decision-maker
could choose to open up now, possibly with caveats — that is not the case here. This is not
a judgment call between acceptable and unacceptable risk; it is that the primary
prerequisite (a real, running, reachable production environment) does not exist.

This is not a step backward from RC-1's "GO WITH CONDITIONS." That recommendation was
about code readiness, and stands. This one is about operational readiness, and the honest
answer, per this session's own findings and the explicit instruction never to claim
infrastructure is operational unless tested, is that operational readiness has not been
established because there is no operating production system to establish it against. Once
recommendation #1-#3 above are done, this specific report should be re-run — literally
re-execute `scripts/launch-verification.mjs` and a real load test against the real
environment — and the GO/NO-GO call revisited on that evidence, not on this session's local
substitute for it.
