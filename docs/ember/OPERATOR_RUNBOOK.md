# Ember Backend — Operator Runbook

For whoever is actually operating this in production: deploying, watching it, fixing it
when it breaks, rolling back, rotating secrets, recovering from failure, and routine
maintenance. Assumes `infra/terraform/` has been applied and `DEPLOYMENT_READINESS_CHECKLIST.md`
is checked off — this document is about *running* the thing, not standing it up.

Every command below assumes AWS CLI access scoped to this project's account and
`aws ecs`/`aws rds`/`aws elasticache`/`aws secretsmanager`/`aws logs` permissions. If you
don't have these, that's `DEPLOYMENT_READINESS_CHECKLIST.md`'s IAM row unfinished, not a
gap in this runbook.

---

## Deploy

**Normal path (automatic):** push to `main` with changes under `backend/`. `backend-ci.yml`
gates it (lint, audit, tests); `backend-deploy.yml` then builds, pushes to GHCR, runs
`prisma migrate deploy` against `PRODUCTION_DATABASE_URL`, and — provided the
`AWS_DEPLOY_ROLE_ARN` secret and `ECS_CLUSTER_NAME`/`ECS_SERVICE_NAME`/`API_URL` repository
variables are set (see `DEPLOYMENT_READINESS_CHECKLIST.md`'s CI/CD row) — authenticates to
AWS via GitHub OIDC and runs:

```bash
aws ecs update-service \
  --cluster <ECS_CLUSTER_NAME> \
  --service <ECS_SERVICE_NAME> \
  --force-new-deployment
aws ecs wait services-stable --cluster <ECS_CLUSTER_NAME> --services <ECS_SERVICE_NAME>
curl -f <API_URL>/ready   # workflow retries this for ~100s before failing the job
```

If those secrets/variables are not yet set, the job's final step names exactly what's
missing instead of silently no-op'ing — check the workflow run's logs. This step has not
yet been run against a real AWS account (no account exists for this project yet); the code
path itself is code complete, not operationally verified — see the four-state distinction
in `GO_LIVE_CHECKLIST.md`.

**Manual deploy** (if you need to deploy a specific already-built image tag without going
through the workflow):

```bash
# 1. Confirm the image tag exists in GHCR
docker manifest inspect ghcr.io/<org>/<repo>/ember-backend:<tag>

# 2. Update the task definition to reference it, then force a new deployment
aws ecs update-service --cluster <cluster> --service <service> \
  --task-definition <family>:<revision-with-that-image> \
  --force-new-deployment

# 3. Watch the rollout
aws ecs wait services-stable --cluster <cluster> --services <service>
```

**After any deploy:** hit `GET /ready` against the real domain and confirm `200` before
considering it done. A deploy that completes at the ECS level but leaves `/ready` failing
is not a successful deploy.

## Monitor

- **Logs:** `aws logs tail /ecs/<name_prefix> --follow` — structured JSON, one line per
  request (health/metrics probe traffic excluded — see `SECURITY_NOTES.md`'s "Logging"
  section). Filter by `requestId` to trace one specific request end-to-end, or by
  `"level":50` (pino's numeric level for `error`) to find only errors:
  ```bash
  aws logs tail /ecs/<name_prefix> --follow --filter-pattern '"level":50'
  ```
- **Metrics:** `GET /metrics` on any running task (through the ALB, or directly if you have
  network access to the private subnet) — Prometheus text format. Key series:
  `http_requests_total{route="...",status_code="..."}`,
  `http_request_duration_seconds_bucket{...}`, plus default Node process metrics
  (`process_cpu_user_seconds_total`, `nodejs_heap_space_size_used_bytes`, etc.).
- **Health:** `/live` (process up), `/ready` (dependencies reachable), `/health` (adds
  memory thresholds) — see `src/health/health.controller.ts`. `/ready` is what the ALB's
  target-group health check uses; a task failing `/ready` stops receiving traffic
  automatically without any operator action needed.
- **Errors:** Sentry dashboard (if `SENTRY_DSN` is configured) — every true 5xx/unhandled
  exception, never 4xx noise. Cross-reference a Sentry event's `requestId` tag against
  CloudWatch logs for full request context.
- **ECS service health:** `aws ecs describe-services --cluster <cluster> --services
  <service>` — check `runningCount` vs `desiredCount`, and `events` for recent
  scheduler activity (failed task starts, health check failures, etc.).

## Troubleshoot

**Service won't start / tasks keep cycling:**
1. `aws ecs describe-services ...` → read the `events` list — usually names the exact
   failure (image pull failure, health check failure, resource constraint).
2. `aws logs tail /ecs/<name_prefix> --since 10m` — look for a startup exception. The most
   likely causes: a Joi validation failure at boot (a required env var missing/malformed —
   check the Secrets Manager secret has every key `local.secret_env_names` in
   `modules/ecs/main.tf` expects), or the database being unreachable (security group,
   subnet routing, or the instance itself being down).
3. If it's a startup config error, fix the Secrets Manager value or task definition and
   redeploy (see "Deploy" above) — don't patch the running task directly, it won't survive
   the next deploy.

**`/ready` returns 503:**
- Check `details` in the response body — it names exactly which dependency (`database` or
  `redis`) is down.
- Database down: check `aws rds describe-db-instances` for the instance status; check
  security group rules haven't drifted from Terraform (`terraform plan` will show the
  drift).
- Redis down: same pattern with `aws elasticache describe-replication-groups`.

**5xx errors in production:**
1. Check Sentry first (if configured) — it has the stack trace `AllExceptionsFilter`
   deliberately never puts in the HTTP response.
2. If Sentry isn't configured yet, grep CloudWatch logs for the `requestId` from the
   client-visible error response (`X-Request-Id` header / the response body's
   `requestId` field) — the full server-side error and stack trace is in that log line
   (see `SECURITY_NOTES.md`'s error-handling section for why the client never sees it
   directly).

**Elevated latency:**
- `/metrics`'s `http_request_duration_seconds` histogram, bucketed by route — identifies
  which specific endpoint is slow, not just "the API is slow."
- Check RDS/ElastiCache CPU and connection-count metrics in CloudWatch — a connection-pool
  exhaustion (more likely once `ecs_desired_count` is raised past 1 without revisiting
  pool sizing — see `PRODUCTION_READINESS.md`) presents as latency, not errors.

**A specific user reports being unable to do something:**
- Ask for their `requestId` from the error they saw (every error response includes one) —
  without it, correlating a user report to a specific log line requires guessing at
  timestamps, which is much slower.

## Roll back

Full runbook: `RELEASE.md`. Summary:

1. Identify the last known-good image tag (a commit SHA — every `main` push has one in
   GHCR).
2. Re-run `backend-deploy.yml` via `workflow_dispatch` with that `image_tag` — this skips
   the build step and redeploys the existing image.
3. **Before rolling back, check whether the commit(s) being rolled back included a
   database migration.** If yes, read `RELEASE.md`'s migration-rollback section before
   redeploying the old image — purely additive migrations are safe to leave in place;
   destructive/backward-incompatible ones need a compensating migration first.
4. After rollback, run the full "Launch verification" section of `GO_LIVE_CHECKLIST.md`
   again — a rollback is a deploy, and deserves the same verification.

## Rotate secrets

Every secret lives in the one Secrets Manager secret `modules/secrets` creates
(`secrets_manager_secret_name` in Terraform outputs). Rotation is: write a new value, then
force ECS to pick it up (Secrets Manager values are read at task *start*, not live-reloaded
into a running process).

```bash
# Read current keys (redact before sharing/logging output)
aws secretsmanager get-secret-value --secret-id <secret_name> --query SecretString --output text | jq .

# Update one key (merge with existing — this replaces the whole secret string)
aws secretsmanager get-secret-value --secret-id <secret_name> --query SecretString --output text \
  | jq '.SMTP_PASSWORD = "new-value-here"' \
  | aws secretsmanager put-secret-value --secret-id <secret_name> --secret-string file:///dev/stdin

# Force every running task to restart and pick up the new secret
aws ecs update-service --cluster <cluster> --service <service> --force-new-deployment
```

**`JWT_ACCESS_SECRET` rotation is more disruptive than the others**: every access token
signed with the old secret becomes invalid the moment the new tasks are running (refresh
tokens are unaffected — a client's next `/auth/refresh` call transparently issues a new,
correctly-signed access token). This is a "everyone gets logged out of their current
access-token session, refresh happens transparently" event, not a "everyone is logged
out entirely" event — communicate accordingly if doing this outside a routine schedule.

**Database/Redis credential rotation** requires updating both the RDS/ElastiCache resource
(`terraform apply` after changing the relevant module, or AWS Console for an out-of-band
rotation) *and* the Secrets Manager `DATABASE_URL`/`REDIS_URL` values to match, in that
order — updating the secret before the underlying credential actually changes just breaks
connectivity.

## Recover from failures

**Database data loss / corruption:** restore from an automated RDS snapshot (see
`DEPLOYMENT_READINESS_CHECKLIST.md`'s backup-restore row — this must have been drilled
before you need it for real). `aws rds restore-db-instance-to-point-in-time` for a specific
timestamp, or `aws rds restore-db-instance-from-db-snapshot` for a specific snapshot. Point
a scratch environment's `DATABASE_URL` at the restored instance first and verify data
integrity before cutting production over to it.

**Entire ECS service down and won't recover:** confirm the failure isn't upstream (RDS/Redis
outage cascading) before assuming it's the application. If it genuinely is the application
(a bad deploy that passed CI but fails at runtime in ways local/CI testing didn't catch),
roll back per "Roll back" above rather than debugging live in production.

**Redis data loss:** Redis here is a cache/queue, not a system of record — losing it loses
rate-limit counters (harmless, they rebuild), the account-lockout state (harmless), the
token blacklist (a logged-out session's access token would work again until its natural
expiry — a real but bounded, low-severity exposure), and any in-flight BullMQ jobs
(an unsent email or ungenerated thumbnail — retry manually or let the next relevant action
re-trigger it). Restore from an ElastiCache snapshot if available; otherwise, a fresh empty
Redis is safe to start from — nothing in it is authoritative user data.

**Secrets Manager secret accidentally deleted:** Secrets Manager soft-deletes with a
recovery window (default 30 days) — `aws secretsmanager restore-secret --secret-id
<name>` recovers it within that window. Outside the window, rebuild it from
`modules/secrets`' Terraform outputs (database/cache/storage credentials are re-derivable
from their respective resources; `JWT_ACCESS_SECRET` is not recoverable if lost — a fresh
one invalidates all existing sessions, same as a deliberate rotation above).

## Routine maintenance

- **Dependency updates:** `npm outdated` in `backend/`, periodically. `npm audit --omit=dev
  --audit-level=high` is already a hard CI gate on every push — routine `npm update` +
  re-test is still worth doing on a schedule (monthly is reasonable) rather than only
  reactively.
- **Postgres/Redis minor-version patching:** both are configured to accept AWS's automatic
  minor-version upgrades during the maintenance window (`modules/database`/`modules/cache`
  — Monday early morning UTC by default). No operator action needed for minor versions;
  major version upgrades (e.g. Postgres 16 → 17) are a deliberate, planned, tested
  operation, not automatic.
- **Certificate renewal:** ACM auto-renews certificates it manages, provided the DNS
  validation records Terraform created remain in place — don't delete the
  `aws_route53_record.cert_validation` resources even though they look unused after initial
  validation.
- **Log retention:** CloudWatch log group retention is set to 30 days
  (`log_retention_days` in `modules/ecs`) — adjust via Terraform if compliance/debugging
  needs differ.
- **Audit log review:** `AuditLog` is append-only and growing unboundedly — no automatic
  archival/deletion policy exists yet (see `SECURITY_NOTES.md`'s audit-logging section).
  Periodically confirm table size is still reasonable; build an archival strategy before it
  becomes a real storage-cost or query-performance problem, not after.
- **Unused verification tokens:** `VerificationToken` rows aren't automatically purged
  after expiry — a low-priority cleanup job (delete rows where `expiresAt < now() - 30
  days`) is a reasonable addition once this becomes noticeable, not before.
