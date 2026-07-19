# Ember — Operations Guide (Summary)

Full detail: `../OPERATOR_RUNBOOK.md` (routine deploy/monitor/troubleshoot/rotate/maintain),
`../OPERATIONS_RUNBOOK.md` (incident response, scaling, per-service failure modes).

## Deploy

Push to `main` → CI gates it (lint/audit/build/test) → build + push to GHCR → migrate →
credential-gated ECS deployment (once `AWS_DEPLOY_ROLE_ARN` + repo variables are set). After
any deploy: hit `/ready` on the real domain and confirm 200 before considering it done —
`terraform apply` exiting 0 is not the same as a working deployment.

## Monitor

- **Logs**: `aws logs tail /ecs/<name_prefix> --follow` — structured JSON, filterable by
  `requestId` or error level.
- **Metrics**: `GET /metrics` — Prometheus format.
- **Health**: `/live` (process up), `/ready` (dependencies reachable, what the ALB checks),
  `/health` (adds memory thresholds).
- **Errors**: Sentry, once configured (not yet).
- **Alarms**: none exist yet (`../TERRAFORM_READINESS.md`'s top finding) — this is real,
  scoped work still to do, not a documentation gap.

## Troubleshoot (most common cases)

| Symptom | First check |
|---|---|
| Service won't start | `aws ecs describe-services` events list — usually names the exact failure |
| `/ready` returns 503 | Response body's `details` names which dependency (database/redis) is down |
| 5xx errors | Sentry first, then grep logs by the client-visible `requestId` |
| Elevated latency | `/metrics`'s per-route latency histogram, then RDS/ElastiCache CPU |

## Roll back

`workflow_dispatch` on `backend-deploy.yml` with a previous image tag — redeploys without a
new build. Check whether the commits being rolled back included a migration first (some
are safe to leave, destructive ones need a compensating migration). Re-run smoke tests
after any rollback — it's a deploy, and gets the same verification.

## Rotate secrets

Every secret lives in one Secrets Manager entry. Read, edit, `put-secret-value`, then
`aws ecs update-service --force-new-deployment` to make running tasks pick it up (secrets
are read at task start, not live-reloaded). `JWT_ACCESS_SECRET` rotation logs out every
active access-token session (refresh tokens transparently reissue) — more disruptive than
the others, communicate accordingly if done outside a routine schedule.

## Scale

Config changes (`terraform apply`), not console click-ops — `ecs_desired_count`/
`enable_autoscaling` for compute, `db_instance_class`/`db_multi_az` for the database,
`redis_node_type`/`num_cache_clusters` for cache. Revisit database connection-pool sizing
before scaling ECS wide — each instance holds its own pool.

## Recover from failure

Redis loss is low-severity (cache/queue, not a system of record — rebuilds automatically).
Database loss requires a real RDS snapshot restore (never drilled against real
infrastructure — see `DISASTER_RECOVERY_GUIDE.md`). Secrets Manager soft-deletes with a
30-day recovery window.

## Incident response

Severity levels SEV-1 (outage/data-loss/active exploit) through SEV-4 (cosmetic), a
6-step process (detect → triage → communicate → mitigate → resolve → verify → postmortem),
and a dedicated security-incident procedure (contain → assess scope via `audit_logs` →
eradicate → notify → recover → postmortem) — full detail in `../OPERATIONS_RUNBOOK.md`.
**Not yet staffed** — no on-call owner is named. This is the actual gap, not the process
documentation.
