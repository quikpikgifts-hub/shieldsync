# Ember Backend — Disaster Recovery Report (Phase 5)

## Database backup & restore — operationally verified (local), real drill performed

A real backup/restore cycle was performed this session against the real local PostgreSQL
instance holding this session's Phase 5 validation data (42 users, 38 profiles, 120 audit
log rows, plus matches/messages/reports/blocks created during functional validation):

1. `pg_dump -F c` — completed in **0.31 seconds** (this data volume), produced a 78.7KB
   custom-format dump.
2. Restored into a **fresh scratch database that never held this data**
   (`ember_dr_restore_test`) via `pg_restore` — completed in **0.53 seconds**.
3. **Verified, not assumed**: row counts matched exactly (users 42/42, profiles 38/38,
   audit_logs 120/120), specific real row content was spot-checked and present, every
   foreign key constraint was intact post-restore (checked `reports`' three FKs
   specifically, since those use deliberate `Restrict` semantics — see
   `DATABASE_SCHEMA.md`), and every index — including the partial unique index enforcing
   one-primary-photo-per-profile — was restored correctly.

**What this validates**: the schema and data are genuinely backup/restorable — nothing
about the schema design (partial indexes, `Restrict` FKs, jsonb columns, enums) breaks a
standard Postgres dump/restore cycle. **What this does not validate**: RDS's actual
automated-backup and point-in-time-recovery mechanism, which uses WAL archiving and
snapshot infrastructure this local drill doesn't exercise — that requires a real RDS
instance, which doesn't exist yet (see `PRODUCTION_READINESS_REPORT.md`). The restore
drill `DEPLOYMENT_READINESS_CHECKLIST.md` and `GO_LIVE_CHECKLIST.md` both list as required
before "production ready" refers specifically to a real RDS snapshot restore — this local
drill is real, useful evidence that the underlying mechanism works, not a substitute for
that real-infrastructure drill.

## Object storage recovery — not drilled, infrastructure-complete only

`infra/terraform/modules/storage/main.tf` enables S3 bucket versioning, meaning an
accidentally deleted or overwritten object is recoverable via a prior version. This was
**not drilled this session** — the local S3-compatible server used for functional/load
testing (`s3rver`) does not implement versioning the same way real S3 does, so a real
drill against it wouldn't produce meaningful evidence. This remains a real open item for
after real infrastructure exists.

## Secret rotation — documented procedure, not drilled

`OPERATOR_RUNBOOK.md`'s "Rotate secrets" section documents the exact commands
(`aws secretsmanager put-secret-value` + `aws ecs update-service --force-new-deployment`)
and the specific behavioral note that `JWT_ACCESS_SECRET` rotation invalidates all
outstanding access tokens (refresh tokens transparently reissue them, not a full logout).
**Not drilled this session** — no real Secrets Manager secret exists to rotate against.

## Rollback — code complete, not drilled against real infrastructure

`.github/workflows/backend-deploy.yml` supports `workflow_dispatch` with an `image_tag`
input specifically for redeploying a previously-built image without triggering a new
build — the mechanism exists and was reviewed as part of the RC-1 pass. **Not executed**
this session; doing so meaningfully requires a real ECS service to redeploy against, which
doesn't exist yet.

## Redis data loss — architecturally low-severity, not drilled (and drilling isn't very informative)

Per `OPERATOR_RUNBOOK.md`'s existing analysis (re-confirmed during the RC-1 security
review): Redis here is a cache/queue, not a system of record. Losing it loses rate-limit
counters (rebuild automatically), account-lockout state (rebuilds), the token blacklist (a
logged-out session's access token would work again until its natural TTL expiry — a real
but bounded, low-severity exposure), and any in-flight BullMQ jobs (retry manually or let
the next relevant action re-trigger it). A fresh, empty Redis is a safe starting state — a
"drill" here would mainly demonstrate that the app tolerates a `redis-cli flushdb`, which
was incidentally confirmed multiple times this session already (the app was restarted
against a flushed Redis instance several times during load testing with no errors).

## RTO / RPO — not set, business decision required

No Recovery Time Objective or Recovery Point Objective has been proposed anywhere in this
project's documentation, confirmed again this session. This needs a business decision (how
much downtime/data loss is acceptable) before it can become an engineering target — see
`GO_LIVE_CHECKLIST.md`'s Disaster Recovery section, unchanged by this session's work.
Multi-AZ for RDS/Redis remains off by default (`db_multi_az`/`num_cache_clusters` in
`infra/terraform/variables.tf`) — appropriate for a pre-alpha cohort's cost profile until an
RTO target says otherwise.

## Summary

| Item | Status |
|---|---|
| Database backup taken | ✅ Operationally verified (local drill) |
| Database restore performed, data verified intact | ✅ Operationally verified (local drill) |
| Object storage recovery (versioning) drilled | ⬜ Not drilled — infrastructure complete only |
| Secret rotation drilled | ⬜ Not drilled — procedure documented only |
| Rollback drilled | ⬜ Not drilled — mechanism exists, never executed |
| Redis loss tolerance | ✅ Architecturally low-severity; incidentally exercised this session |
| RTO/RPO defined | ⬜ Not started — business decision required |

The database backup/restore mechanism itself is real, tested, and works correctly. Every
other item in this report requires either real cloud infrastructure that doesn't exist yet,
or a business decision this engineering pass cannot make — both are honestly reflected
above, not glossed over.
