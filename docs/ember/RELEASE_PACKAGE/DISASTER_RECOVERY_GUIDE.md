# Ember — Disaster Recovery Guide (Summary)

Full detail: `../DISASTER_RECOVERY_REPORT.md` (what's actually been drilled),
`../OPERATIONS_RUNBOOK.md` (per-service failure procedures).

## What's real evidence versus what's a documented plan

| Component | Status | Evidence |
|---|---|---|
| Database backup/restore | **Real drill performed** | `pg_dump`/`pg_restore` cycle against real local data — row counts, foreign keys, and indexes all verified intact post-restore, in under a second |
| Object storage recovery | Plan only | S3 versioning is configured in Terraform; not drilled — the local test double doesn't implement versioning realistically |
| Secret rotation | Plan only | Exact commands documented (`../OPERATOR_RUNBOOK.md`); no real Secrets Manager secret exists yet to rotate |
| Rollback | Plan only, mechanism exists | `workflow_dispatch` path reviewed as part of RC-1; never executed against a real ECS service |
| Redis data loss | Architecturally low-severity | Not a system of record — losing it is a bounded availability event, not a data-loss event; incidentally exercised (flushed) multiple times during load testing with no issues |

## RTO / RPO

**Not set.** No Recovery Time Objective or Recovery Point Objective has been proposed
anywhere in this project — this needs a business decision (how much downtime/data loss is
acceptable) before it can become an engineering target. Multi-AZ for RDS/Redis is off by
default, appropriate for a pre-alpha cohort's cost profile until an RTO says otherwise.

## The actual recovery procedure, once real infrastructure exists

1. **Database**: `aws rds restore-db-instance-to-point-in-time` or
   `-from-db-snapshot` → point a scratch environment's `DATABASE_URL` at it → verify data
   integrity → *then* cut production over. Never restore directly into the production
   endpoint as the first step.
2. **Object storage**: `aws s3api list-object-versions` + `get-object --version-id` for a
   specific deleted/overwritten object.
3. **Full environment loss**: re-run `terraform apply` (the entire stack is reproducible
   from code) → restore the database from the most recent snapshot → re-fill
   vendor-specific secrets (SMTP/Sentry, which Terraform doesn't auto-populate) → run the
   real smoke test (`backend/scripts/launch-verification.mjs`) before considering the
   environment recovered.

## What this guide does not claim

No real RDS snapshot restore has ever been performed. No real disaster has ever been
simulated against real infrastructure. The database backup/restore *mechanism* is proven
real; the *infrastructure-specific* recovery paths above are a documented, reviewed plan,
not a rehearsed one. Drill the real version once real infrastructure exists — see
`../DEPLOYMENT_READINESS_CHECKLIST.md`'s backup-restore row for the acceptance criteria
that closes this gap for real.
