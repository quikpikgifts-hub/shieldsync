# Ember Backend — Operations Runbook

This is the incident/failure-mode companion to `OPERATOR_RUNBOOK.md`, which already covers
routine deploy/monitor/troubleshoot/rollback/secret-rotation/maintenance procedures — read
that document first; this one goes deeper on formal incident response, scaling procedures,
and per-service failure modes it only summarizes. Neither document has been exercised
against a real incident, because no real production system exists yet (see
`PRODUCTION_READINESS_REPORT.md`) — both are written from the actual architecture and
Terraform configuration, not from experience with a real outage.

## Incident response

### Severity levels

| Severity | Definition | Examples | Response time target |
|---|---|---|---|
| **SEV-1** | Full outage, data loss/corruption, or an actively exploited security vulnerability | API completely unreachable; a confirmed unauthorized data access; database corruption | Immediate — page on-call |
| **SEV-2** | Significant degradation, a safety-critical feature broken, or a credible (not yet exploited) security finding | Elevated error rate past an alarm threshold; reports/blocking broken; a newly discovered high-severity vulnerability | Within the hour |
| **SEV-3** | Partial/minor degradation, non-safety-critical feature broken | Slow responses on one route; a non-critical background job failing | Same business day |
| **SEV-4** | Cosmetic or low-impact issue | A misleading log message; a minor UI-adjacent bug | Next routine maintenance window |

### Process

1. **Detect** — via a CloudWatch alarm (once real ones exist — see
   `TERRAFORM_READINESS.md`'s Monitoring gap), a Sentry error spike, a tester report (see
   `ALPHA_TEST_PLAN.md`'s escalation section), or manual observation.
2. **Triage** — assign a severity level above; the on-call owner (named per
   `PRODUCTION_READINESS_REPORT.md`'s launch condition) makes this call.
3. **Communicate** — SEV-1/SEV-2 gets an immediate internal status update (channel/process
   is an organizational decision this document doesn't make); SEV-1 affecting real user
   data additionally triggers whatever external-notification process the organization has
   designated (see `DEPLOYMENT_READINESS_CHECKLIST.md`'s Incident Response section — this
   is explicitly not an engineering-only decision).
4. **Mitigate** — stop the bleeding first: roll back (`OPERATOR_RUNBOOK.md`'s "Roll back"
   section) if the incident correlates with a recent deploy; scale up (see Scaling below)
   if it's a capacity issue; disable a specific feature path if one exists and is safe to
   flip off, rather than leaving the whole system degraded while root-causing.
5. **Resolve** — fix the actual root cause, not just the symptom that triggered the alert.
6. **Verify** — re-run `backend/scripts/launch-verification.mjs` against the real
   environment (the same real, comprehensive check used throughout Phase 5's validation)
   before declaring the incident closed.
7. **Postmortem** — for SEV-1/SEV-2: what happened, why, what caught it (or didn't), what
   changes (code, alarm, process) prevent a repeat. Blameless — the goal is a better
   system, not identifying who to blame.

## Backup recovery

Full command reference: `OPERATOR_RUNBOOK.md`'s "Recover from failures" section. Summary of
what's actually been drilled versus what requires real infrastructure:

- **Database**: a real local `pg_dump`/`pg_restore` cycle was drilled in Phase 5
  (`DISASTER_RECOVERY_REPORT.md`) — schema and data are confirmed genuinely
  backup/restorable. **A real RDS automated-snapshot restore has never been performed**
  (needs a real RDS instance). When it is: `aws rds restore-db-instance-to-point-in-time`
  or `aws rds restore-db-instance-from-db-snapshot`, point a scratch environment's
  `DATABASE_URL` at the restored instance, verify data integrity, *then* cut production
  over — never restore directly into the production endpoint as the first step.
- **Object storage**: S3 versioning (enabled by Terraform) makes an accidentally
  deleted/overwritten photo recoverable via `aws s3api list-object-versions` +
  `aws s3api get-object --version-id`. Not drilled against real S3 (see
  `DISASTER_RECOVERY_REPORT.md`).
- **Secrets**: Secrets Manager soft-deletes with a recovery window (default 30 days) —
  `aws secretsmanager restore-secret --secret-id <name>` within that window. Outside it,
  database/cache/storage credentials are re-derivable by re-running the relevant Terraform
  module; `JWT_ACCESS_SECRET` is not recoverable if lost (same as a deliberate rotation).

## Scaling

All scaling changes below are `terraform apply` operations (config changes, not console
click-ops) so they stay reproducible and reviewable — see `TERRAFORM_READINESS.md` for why
that matters for this specific codebase's discipline around not silently drifting from IaC.

### ECS (compute)

```hcl
# In environments/production.tfvars:
ecs_desired_count   = 2          # raise the floor
enable_autoscaling  = true       # let it grow further under real load
```

```bash
terraform apply -var-file=environments/production.tfvars
```

**Before raising past 1**: revisit database connection-pool sizing —
`PRODUCTION_READINESS.md`'s existing note (re-confirmed in `LOAD_TEST_REPORT.md`) is that
each instance holds its own Prisma connection pool (10 connections observed in Phase 5's
local load test); N instances means N× that many connections against RDS's own connection
ceiling, which scales with `db_instance_class`. Check `max_connections` on the target RDS
instance class before scaling ECS wide.

### RDS (database)

```hcl
db_instance_class = "db.t4g.small"   # or larger — vertical scaling
db_multi_az        = true             # for failover, not throughput
```

Vertical resize causes a brief interruption (a few minutes) unless done during a
Multi-AZ failover window — schedule during low-traffic hours, or accept the interruption
for a small alpha cohort where it's more tolerable.

### ElastiCache (Redis)

```hcl
redis_node_type    = "cache.t4g.small"
num_cache_clusters = 2   # adds automatic failover, not just capacity
```

### Autoscaling policy (once `enable_autoscaling = true`)

`modules/ecs/main.tf`'s `aws_appautoscaling_policy` targets 70% average CPU utilization by
default (`target_value = 70` in the module) — adjust `autoscaling_max_capacity` (default 3)
if a higher ceiling is needed, rather than editing the target-tracking value itself unless
real load data suggests 70% is wrong for this workload's actual CPU/latency relationship
(see `LOAD_TEST_REPORT.md` for the one workload profile measured so far).

## Database failover

With `db_multi_az = true`, RDS automatically fails over to the standby on primary failure —
typically 60-120 seconds of interruption, no manual action required. The application's
`PrismaService` reconnects automatically on the next query attempt (Prisma's own connection
retry behavior) — no code change needed to tolerate this, but a request in flight during the
failover window will fail and should be retried client-side (the frontend's `emberApi.js`
already retries once on a 401 for token refresh; a transient 5xx during failover is not
currently retried client-side — worth noting as a real gap if Multi-AZ is enabled before a
retry-on-5xx pattern is added to the frontend).

With `db_multi_az = false` (the current default, appropriate for pre-alpha): a primary
failure has no automatic failover — recovery is a manual restore from the most recent
automated backup (see Backup recovery above), with data loss bounded by the backup
frequency, not near-zero. This is the concrete tradeoff `db_multi_az`'s default represents;
revisit before any RTO/RPO target is set (`DISASTER_RECOVERY_REPORT.md` notes none exists
yet).

## Redis failure

Per `OPERATOR_RUNBOOK.md`'s existing analysis (re-confirmed in the RC-1 security review):
Redis is a cache/queue, not a system of record, and the application fails **closed** on a
Redis outage (auth/rate-limiting/lockout become unavailable rather than silently permissive
— see `PRODUCTION_SECURITY_REPORT.md`). This means a Redis outage is an **availability**
incident (the app effectively can't serve authenticated traffic), not a data-integrity or
security incident. Recovery: ElastiCache's own automatic node replacement (if
`num_cache_clusters > 1`, replacement is near-transparent via automatic failover) or a
manual `aws elasticache` node replacement / cluster recreation (if single-node, per the
current default) — nothing in the application needs to be restored, since nothing
authoritative lives there.

## SES failure (or whichever SMTP vendor is chosen)

- **Symptom**: `SmtpEmailProvider`'s retry-with-backoff logs (`safeErrorMessage`-scrubbed,
  per `LOGGING_AUDIT.md`) show repeated transient failures, or bounce/complaint rates climb.
- **SES sandbox mode**: if production access was never requested (see `AWS_SETUP_GUIDE.md`
  §12), SES silently refuses to send to unverified addresses — this looks like "email never
  arrives" with no error surfaced to the end user, since `NotificationEmailService`'s job
  queue absorbs the failure and retries. Check SES sending statistics in the AWS console
  first for any suspected email issue.
- **Vendor outage**: since the app speaks generic SMTP (not an SES-specific SDK), switching
  vendors is a configuration change (`SMTP_HOST`/`SMTP_USER`/`SMTP_PASSWORD` in Secrets
  Manager), not a code change — see `OPERATOR_RUNBOOK.md`'s secret-rotation commands. Keep
  a second vendor's credentials ready if email deliverability is business-critical enough to
  justify the standing cost of a warm backup account.
- **User-facing impact if unresolved**: registration/login still work (email verification
  is not required to use the core matching/messaging flow — confirm this against
  `API.md`'s current auth requirements before relying on that assumption); password reset
  and email verification specifically are blocked until resolved.

## S3 failure

- **Symptom**: photo upload-URL requests fail, or registered photos 404 on read.
- **A full-region S3 outage** is rare and outside this application's ability to route
  around (no multi-region replication is configured) — the honest mitigation is "wait for
  AWS," with `NotConfiguredStorageProvider`'s graceful-degradation pattern meaning the rest
  of the app (auth, matching, messaging) keeps working even if photo upload doesn't, since
  `ProfilesService.storageEnabled` gates only the photo-specific code paths.
- **A single bucket/object issue** (e.g., accidental deletion): recover via S3 versioning,
  see Backup recovery above.
- **IAM credential issue** (the static S3 app user's keys rotated or revoked
  unexpectedly): `S3StorageProvider`'s constructor throws immediately if
  `S3_ACCESS_KEY_ID`/`S3_SECRET_ACCESS_KEY` are missing — this fails loudly at the next
  deploy/restart, not silently. Check Secrets Manager's current value against
  `aws iam list-access-keys --user-name <name_prefix>-s3-app-user` for a mismatch.

## Credential rotation

Expands `OPERATOR_RUNBOOK.md`'s rotation commands into a full table of what exists and how
to rotate each:

| Credential | Location | Rotation trigger | Procedure |
|---|---|---|---|
| `JWT_ACCESS_SECRET` | Secrets Manager | Suspected compromise, or a routine schedule | `OPERATOR_RUNBOOK.md`'s "Rotate secrets" — logs out every active access-token session (refresh is transparent) |
| Database master password | Secrets Manager + RDS | Suspected compromise, routine schedule | Rotate in RDS first (`aws rds modify-db-instance --master-user-password`), then update the Secrets Manager `DATABASE_URL` to match — in that order, never the reverse |
| Redis AUTH token | Secrets Manager + ElastiCache | Suspected compromise, routine schedule | Same ordering as database — rotate in ElastiCache first, then the secret |
| S3 IAM user access key | Secrets Manager + IAM | Suspected compromise, routine schedule (AWS recommends ≤90 days for long-lived keys) | `aws iam create-access-key` (creates a second, additional key), update the secret, verify the app works with the new key, *then* `aws iam delete-access-key` the old one — never delete-then-create, which causes an outage window |
| GitHub OIDC deploy role | IAM (not a stored credential — federated, no long-lived key exists) | N/A for routine rotation; revoke by deleting/modifying the trust policy if compromise is suspected | No secret value to rotate — this is the entire point of using OIDC federation instead of a stored AWS access key for CI/CD |
| SMTP credentials | Secrets Manager + vendor console | Vendor-driven, or suspected compromise | Regenerate in the vendor's console, update the secret, force a new ECS deployment |
| `SENTRY_DSN` | Secrets Manager | Rarely — a DSN isn't secret-strength sensitive (it's meant to be embeddable), but rotate if a project is recreated | Update the secret, force a new deployment |

## Security incident

Distinct from a general SEV-1 — specifically for a suspected or confirmed unauthorized
access, data exposure, or active exploitation:

1. **Contain**: if a specific compromised credential is identified, rotate it immediately
   (see table above) — this often stops the incident before full root-cause is known, and
   shouldn't wait for it.
2. **Assess scope**: query `audit_logs` for the actor/subject/timeframe in question — this
   is the append-only trail every sensitive action already writes to (see
   `DATABASE_SCHEMA.md`'s `audit_logs` section and `LOGGING_AUDIT.md` for what's captured).
   If the suspected compromise involves a specific account, check `sessions`/
   `refresh_tokens` for that user to see every device/IP that has held a valid session.
3. **Eradicate**: revoke every session for affected account(s)
   (`AuthService`'s session-revocation path, same mechanism password reset uses), rotate
   any credential in the blast radius, and patch the underlying vulnerability if one was
   exploited (see `code-review`/`security-review` skills for re-auditing the specific code
   path).
4. **Notify**: per `DEPLOYMENT_READINESS_CHECKLIST.md`'s Incident Response section — who
   gets told, and when, for an incident involving real user data is an organizational/legal
   decision, not one this runbook or engineering alone makes.
5. **Recover**: restore normal service, re-run `scripts/launch-verification.mjs` against
   the real environment before considering the incident closed.
6. **Postmortem**: mandatory for every security incident regardless of severity — see the
   Incident response process above.

## Summary

This document and `OPERATOR_RUNBOOK.md` together cover deploy, monitor, troubleshoot,
routine rotation/maintenance (there), and formal incident response, scaling, and per-service
failure modes (here). Neither has been exercised against a real incident. The commands in
both are correct against the actual current architecture and Terraform configuration —
re-verify against real infrastructure specifics (actual instance identifiers, actual ARNs)
once real infrastructure exists, since every `<placeholder>` here is exactly that.
