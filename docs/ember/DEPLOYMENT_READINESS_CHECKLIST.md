# Ember Backend — Deployment Readiness Checklist

Every external dependency this backend needs before it can run in production, who owns
resolving it, exactly how to verify it's actually done (not just "probably fine"), and the
acceptance criteria that must be objectively true before checking it off.

**Nothing on this list is checked off by this document.** It is a worklist, not a status
report — every row starts unchecked, and stays unchecked until the stated verification
command/action has actually been run and produced the stated result. See
`GO_LIVE_CHECKLIST.md` for the corresponding pre-launch verification pass, and
`ARCHITECTURE.md` §1a / `PRODUCTION_READINESS.md` for how the *code* side of each item was
already built to expect exactly these inputs.

**Status legend** (see also the Code/Infra/Operational/Production distinction in
`GO_LIVE_CHECKLIST.md`):
- ⬜ Not started
- 🟨 Code/infra-as-code complete, external resource not yet provisioned
- ✅ Verified — the acceptance criteria below were actually checked and passed

---

## Cloud account & foundational infrastructure

| Item | Owner | Verification | Acceptance criteria | Status |
|---|---|---|---|---|
| AWS account (or chosen equivalent) exists, billing configured | Business/Finance | `aws sts get-caller-identity` succeeds | A named AWS account exists with an active payment method; not a personal/trial account being repurposed | ⬜ |
| IAM: a deploy role/user with least-privilege access (not the account root) | DevOps | `aws iam get-role --role-name <deploy-role>` | A dedicated IAM principal exists for Terraform/CI to assume; root account credentials are never used for deploys | ⬜ |
| Terraform remote state backend (S3 bucket + DynamoDB lock table) | DevOps | `aws s3 ls s3://<state-bucket>` and `aws dynamodb describe-table --table-name <lock-table>` both succeed | State bucket has versioning + encryption enabled; `infra/terraform/versions.tf` has a `backend "s3" {}` block pointing at it | ⬜ |
| `terraform init && terraform validate && terraform plan` run successfully against the real account | DevOps/Engineering | Run the three commands in `infra/terraform/`, in an environment with real registry access (this repo's own build sandbox has `registry.terraform.io` blocked by network policy — see `infra/terraform/README.md`) | `terraform validate` reports no errors; `terraform plan` produces a plan with no unexpected destroys | ⬜ |
| `terraform apply` run against the real account | DevOps | `terraform apply -var-file=environments/production.tfvars`, review the plan before confirming | Every resource in the plan reaches `Apply complete` with 0 errors | ⬜ |

## Database

| Item | Owner | Verification | Acceptance criteria | Status |
|---|---|---|---|---|
| RDS Postgres instance provisioned | DevOps (via Terraform) | `aws rds describe-db-instances --db-instance-identifier <name>` shows `available` | Instance status is `available`; `storage_encrypted = true`; not publicly accessible | ⬜ |
| `npx prisma migrate deploy` run against the real database | Engineering | Connect from a host that can reach the private RDS instance (bastion/SSM/one-off ECS task) and run the command | Command exits 0; `npx prisma migrate status` reports no pending migrations | ⬜ |
| `npx prisma db seed` run once against the fresh database | Engineering | Same connectivity as above | RBAC catalog exists: `SELECT count(*) FROM roles` returns 4, `SELECT count(*) FROM permissions` returns 8 (see `prisma/seed.ts`) | ⬜ |
| A real backup restore has been performed and verified | DevOps | Restore an automated RDS snapshot into a scratch instance, connect, and confirm data is queryable | A restored instance boots and `SELECT count(*) FROM users` (or equivalent) returns a sane, non-zero number matching what's expected | ⬜ |
| Database role separation (migration role vs. runtime role) | DevOps/Engineering | `\du` in `psql` against the real database | Two distinct roles exist; the runtime role's grants exclude `UPDATE`/`DELETE` on `audit_logs` — see `OPEN_DECISIONS.md` D-04 | ⬜ |

## Cache / queue (Redis)

| Item | Owner | Verification | Acceptance criteria | Status |
|---|---|---|---|---|
| ElastiCache Redis replication group provisioned | DevOps (via Terraform) | `aws elasticache describe-replication-groups --replication-group-id <name>` shows `available` | Status `available`; `transit_encryption_enabled = true`; `at_rest_encryption_enabled = true` | ⬜ |
| The running app can actually reach Redis | Engineering | Deploy the app pointed at the real `REDIS_URL`, then `GET /ready` | Response body's `details.redis.status` is `"up"` | ⬜ |
| Distributed rate limiting verified under 2+ instances | Engineering | Scale `ecs_desired_count` to 2, hit `/auth/login` past its limit from one source, confirm both instances agree it's blocked | The 6th request within a minute against either instance returns 429, not just the instance that saw the first 5 | ⬜ |

## Object storage

| Item | Owner | Verification | Acceptance criteria | Status |
|---|---|---|---|---|
| S3 bucket provisioned, private, versioned, encrypted | DevOps (via Terraform) | `aws s3api get-bucket-versioning`/`get-bucket-encryption`/`get-public-access-block` on the real bucket | Versioning `Enabled`; encryption `AES256`; all four public-access-block settings `true` | ⬜ |
| Real end-to-end photo upload verified against the real bucket | Engineering | `POST /profiles/me/photos/upload-url`, `PUT` real bytes to the returned URL, `POST /profiles/me/photos`, then fetch the returned signed `url` | The fetched bytes match what was uploaded; a thumbnail is generated (`thumbnailUrl` becomes non-null within a few seconds) | ⬜ |
| CORS configured for the real frontend origin | DevOps (via Terraform, `s3_allowed_upload_origins`) | Attempt a presigned upload from the real frontend's real domain in a browser | The `PUT` succeeds without a CORS error in the browser console | ⬜ |

## Email

| Item | Owner | Verification | Acceptance criteria | Status |
|---|---|---|---|---|
| A transactional email vendor is chosen | Business/Product | N/A — a decision, not a technical check | A specific vendor (Postmark, SES, SendGrid, etc.) is named in `OPEN_DECISIONS.md` D-11's follow-up, not left generic | ⬜ |
| Vendor account created, sending domain verified (SPF/DKIM/DMARC) | Ops | Vendor's own domain-verification dashboard, plus `dig TXT <domain>` for SPF/DMARC records | Vendor dashboard shows the sending domain as "verified"; DNS records are live | ⬜ |
| `SMTP_HOST`/`SMTP_USER`/`SMTP_PASSWORD` set in the real secret | DevOps | `aws secretsmanager get-secret-value` (redact before viewing/sharing) or trigger a real password-reset email | A real inbox receives the email within 60 seconds, correctly formatted, with a working link | ⬜ |
| Deliverability spot-check against major providers | Ops | Send test verification/reset emails to Gmail, Outlook, and one other real inbox | None land in spam; sender reputation is not yet degraded (new sending domains often need a warm-up period — budget for this) | ⬜ |

## Payments

| Item | Owner | Verification | Acceptance criteria | Status |
|---|---|---|---|---|
| Payment provider adapter built | Engineering | N/A — not started | `PaymentProvider` interface has a real implementation (currently `NotConfiguredPaymentProvider` only) — this is a `ROADMAP.md` Phase 1 remaining item, not built in this pass | ⬜ |
| Stripe (or chosen provider) account created, PCI scope confirmed | Business/Legal | Stripe dashboard account status | Account verified, bank account attached, PCI SAQ-A confirmed (hosted Checkout/Elements only — see `ARCHITECTURE.md` §3) | ⬜ |

*Payments are correctly out of scope for an alpha per `ROADMAP.md` — listed here so it's an
explicit, acknowledged gap rather than a silent one.*

## Domain / DNS / TLS

| Item | Owner | Verification | Acceptance criteria | Status |
|---|---|---|---|---|
| A real domain is owned | Business | WHOIS lookup / registrar account | Domain is registered and its ownership/billing is under the organization's control, not an individual's personal account | ⬜ |
| DNS delegated to Route53 (or `create_hosted_zone=false` pointed at an existing zone) | DevOps | `dig NS <domain>` matches the zone's name servers | Delegation is live and resolving | ⬜ |
| ACM certificate issued and validated | DevOps (via Terraform, `enable_dns=true`) | `aws acm describe-certificate` | Status `ISSUED` | ⬜ |
| `GET https://<api-domain>/live` resolves over real HTTPS | Engineering | `curl -v https://<api-domain>/live` | TLS handshake succeeds, valid cert chain, 200 response | ⬜ |

## Monitoring, logging, alerting

| Item | Owner | Verification | Acceptance criteria | Status |
|---|---|---|---|---|
| Sentry (or chosen APM/error-tracking vendor) project created | Engineering/Ops | `SENTRY_DSN` set, trigger a deliberate test exception | The exception appears in the vendor's dashboard within 5 minutes | ⬜ |
| CloudWatch alarms (or equivalent) on key signals | DevOps | AWS Console / `aws cloudwatch describe-alarms` | At minimum: ECS service unhealthy-task alarm, RDS CPU/storage alarms, ALB 5xx-rate alarm — each wired to a real notification channel (see Incident Response below) | ⬜ |
| Log aggregation confirmed reachable | DevOps | `aws logs tail /ecs/<name-prefix> --follow` while the service handles a request | Structured JSON log lines appear, correlation IDs present, no credentials/tokens visible in the redacted fields | ⬜ |

## Backups & disaster recovery

| Item | Owner | Verification | Acceptance criteria | Status |
|---|---|---|---|---|
| RDS automated backups enabled | DevOps (via Terraform, already configured) | `aws rds describe-db-instances` shows `BackupRetentionPeriod > 0` | Retention ≥ 7 days (default in `modules/database`) | ⬜ |
| A documented, tested restore procedure exists | DevOps | Perform the restore drill in `RELEASE.md`'s rollback section against a scratch environment | Restore completes within a stated RTO; data integrity spot-checked post-restore | ⬜ |
| Redis snapshot retention confirmed | DevOps | `aws elasticache describe-replication-groups` | `SnapshotRetentionLimit > 0` — note Redis here is a cache/queue, not a system of record; losing it loses rate-limit counters and in-flight jobs, not user data | ⬜ |

## Legal & compliance

*Explicitly not an engineering deliverable — listed here because launch readiness depends
on it, not because this checklist can resolve it.*

| Item | Owner | Verification | Acceptance criteria | Status |
|---|---|---|---|---|
| Terms of Service drafted and reviewed by counsel | Legal | Signed-off document exists | Counsel has reviewed and approved the final text — not AI- or engineer-drafted without review, per `ROADMAP.md` Phase 0 | ⬜ |
| Privacy Policy drafted and reviewed by counsel | Legal | Signed-off document exists | Same as above; must accurately describe what this backend actually does (data collected, retention, third parties used) | ⬜ |
| Launch jurisdiction decided | Legal/Product | Written decision recorded | `ROADMAP.md` Phase 0 item #1 resolved — affects data-residency/consent requirements | ⬜ |
| Age-assurance approach confirmed sufficient for launch | Legal/Product | Written decision recorded | `OPEN_DECISIONS.md` D-02 resolved — self-attested DOB alone is explicitly flagged as a known-weak control | ⬜ |

## CI/CD & release process

| Item | Owner | Verification | Acceptance criteria | Status |
|---|---|---|---|---|
| GitHub Environment `production` configured with real secrets | Engineering (repo admin) | Repo Settings → Environments → `production` | `PRODUCTION_DATABASE_URL`, `AWS_DEPLOY_ROLE_ARN`, and any other secrets `backend-deploy.yml` references are set to real values, not placeholders | ⬜ |
| AWS IAM role for GitHub OIDC deploy federation created | DevOps | `aws iam get-role --role-name <deploy-role>`; trust policy restricts to this repo's OIDC subject | Role trust policy scopes to `repo:<org>/<repo>:environment:production` (not a wildcard), and its permissions policy is limited to `ecs:UpdateService`/`ecs:DescribeServices` on the specific cluster/service ARNs Terraform creates | ⬜ |
| Repository variables `ECS_CLUSTER_NAME`/`ECS_SERVICE_NAME`/`API_URL` set from Terraform outputs | Engineering (repo admin) | Repo Settings → Secrets and variables → Actions → Variables | Values match `terraform output ecs_cluster_name`/`ecs_service_name`/`api_url` exactly | ⬜ |
| `backend-deploy.yml` run successfully end-to-end at least once against the real ECS service | Engineering | Push to `main` or trigger `workflow_dispatch`, watch the run | Image pushed to GHCR, migrations applied, `aws ecs update-service` succeeds, `aws ecs wait services-stable` returns, and the "Validate health check" step confirms `GET /ready` returns 200 against the real deployment | ⬜ |

## Incident response & support

| Item | Owner | Verification | Acceptance criteria | Status |
|---|---|---|---|---|
| On-call/incident-response process documented | Ops/Eng lead | Document exists and names real people | Not just "someone will notice" — a named rotation or single owner, a paging mechanism, and `OPERATOR_RUNBOOK.md`'s troubleshooting steps are known to whoever's on it | ⬜ |
| Support inbox/process exists for user-facing issues | Support/Ops | A real, monitored channel exists | Address/channel is live, monitored, and referenced from wherever users would look for it | ⬜ |

---

## Summary

Everything under **Cloud account & foundational infrastructure** through **CI/CD & release
process** is *engineering-actionable* — code and IaC exist and are ready to run the moment
the underlying account/credentials exist. **Legal & compliance** and **Incident response &
support** are explicitly not engineering deliverables and need their own owners to close.
