# Ember — Final Go-Live Matrix

Every requirement for a real production launch, in one table. **Status** uses the
four-state framework this project has applied consistently since RC-1: Code Complete (C),
Infrastructure as Code Complete (IaC), Infrastructure Deployed (D), Operationally Verified
(OV), Production Ready (PR). A row can only advance to the next state on real evidence —
see the Evidence column for what that evidence actually is, or "None yet" where it's
honestly absent. Nothing in this table is marked complete without a citation.

| Requirement | Status | Evidence | Owner | Blocking? | Next Action |
|---|---|---|---|---|---|
| AWS Account | Not started | The only credentials made available this project returned `InvalidClientTokenId` from a real `aws sts get-caller-identity` call (`PRODUCTION_READINESS_REPORT.md`) | Business/Finance | **Yes** | Create a real AWS account with billing active |
| IAM (app-facing roles/users) | IaC | `infra/terraform/modules/ecs`, `modules/storage` — reviewed, `fmt`-clean (`TERRAFORM_READINESS.md`) | DevOps | Yes (via AWS Account) | `terraform apply` |
| IAM (GitHub OIDC deploy role) | Not started | No Terraform resource creates this; exact trust + permissions policy documented (`AWS_SETUP_GUIDE.md` §2) | DevOps | Yes | Create manually per the documented policy, after account exists |
| VPC / Networking | IaC | `infra/terraform/modules/networking` — reviewed (`TERRAFORM_READINESS.md`) | DevOps | Yes (via AWS Account) | `terraform apply` |
| RDS (PostgreSQL) | IaC | `infra/terraform/modules/database` — reviewed | DevOps | Yes | `terraform apply`, then `prisma migrate deploy` (`DEPLOYMENT_CHECKLIST.md` §7) |
| Redis (ElastiCache) | IaC | `infra/terraform/modules/cache` — reviewed | DevOps | Yes | `terraform apply` |
| S3 (object storage) | IaC | `infra/terraform/modules/storage` — reviewed | DevOps | Yes | `terraform apply` |
| SES / email vendor | Not started | No vendor chosen; app is vendor-agnostic (generic SMTP) — `AWS_SETUP_GUIDE.md` §12 | Business/Ops | Yes (for email features only — app degrades gracefully without it) | Choose vendor, verify sending domain, create SMTP credentials |
| Secrets Manager | IaC | `infra/terraform/modules/secrets` — reviewed | DevOps | Yes | `terraform apply`; fill in SMTP/Sentry values once vendors chosen |
| DNS (Route53) | IaC (optional) | `infra/terraform/modules/dns`, `enable_dns=false` by default | Business/DevOps | No — app works over the ALB's own DNS name without it | Decide on a domain; set `enable_dns=true` and apply once owned |
| SSL/TLS (ACM) | IaC (optional) | `infra/terraform/modules/dns` creates a DNS-validated cert only when `enable_dns=true` | DevOps | No (same as DNS) | Apply once a domain exists |
| Container registry (GHCR pull auth) | Gap | ECS task definition has no `repositoryCredentials`; works only if the GHCR package is public (`AWS_SETUP_GUIDE.md` §7) | DevOps | Yes | Make the package public, or add repository credentials |
| CloudWatch Alarms | Not started | Zero `aws_cloudwatch_metric_alarm` resources exist (`TERRAFORM_READINESS.md`'s top finding) | DevOps | Yes (for real monitoring) | Author and apply alarm resources per `DEPLOYMENT_READINESS_CHECKLIST.md`'s Monitoring section |
| Terraform Apply (all of the above) | Not started | `init`/`plan`/`apply` never run — `registry.terraform.io` blocked in every build environment used so far (`TERRAFORM_READINESS.md`) | DevOps | **Yes — this is the critical path** | Run from an environment with real registry access and real AWS credentials |
| Database Migrations | Code complete (local), not run against real infra | 2 migrations, verified against real local Postgres repeatedly, most recently in `PRE_LAUNCH_AUDIT.md` | Engineering | Yes | `prisma migrate deploy` against the real RDS instance post-apply |
| Smoke Test | Script ready, run locally only | `backend/scripts/launch-verification.mjs` — 42/42 real checks passed locally (Phase 5/7) | Engineering | Yes | Re-run with `BASE_URL` pointed at the real deployed environment |
| Load Test | Run locally only | `LOAD_TEST_REPORT.md` — zero errors at load levels exceeding alpha-scale traffic, on sandbox hardware, not real sizing | Engineering | No (informational — no code changes indicated) | Re-run against real deployed sizing before scaling past the alpha cohort |
| Backups | Mechanism verified locally, not against real RDS | Real `pg_dump`/`pg_restore` drill succeeded (`DISASTER_RECOVERY_REPORT.md`) | DevOps | Yes (for a real restore guarantee) | Drill an actual RDS snapshot restore once the instance exists |
| Report/Block UI | Not started (frontend) | Backend fully built and tested; no `Ember.jsx` screen calls it (`ENTERPRISE_READINESS_REPORT.md`'s Frontend section, `RC1_RELEASE_NOTES.md`) | Engineering (frontend) | **Yes — safety-critical, not cosmetic** | Build the UI against the existing, working `createReport`/`createBlock` API client functions |
| Legal Approval | Not started | No sign-off process has occurred | Legal | **Yes** | Route drafted (or to-be-drafted) documents through actual legal review |
| Privacy Policy | Not started | No document exists, even in draft | Legal/Product | **Yes** | Draft against this system's actual real data-handling behavior (`SECURITY_NOTES.md`, `DATABASE_SCHEMA.md` describe what actually happens) |
| Terms of Service | Not started | No document exists, even in draft | Legal/Product | **Yes** | Same as Privacy Policy |
| Support Process | Not started | No channel/inbox designated | Support/Ops | **Yes** | Stand up a monitored channel; see `ALPHA_TEST_PLAN.md`'s Bug Reporting section for the minimum shape needed |
| Incident Response | Documented, not staffed | `OPERATIONS_RUNBOOK.md`'s formal process and severity levels exist | Ops/Eng lead | **Yes** | Name an actual on-call owner who has read it |
| Age-assurance policy | Open decision, unchanged | Self-attested DOB only — `OPEN_DECISIONS.md` D-02, `ALPHA_TEST_PLAN.md`'s Eligibility section | Legal/Product | No (acceptable for a small, invite-only alpha; revisit before wider launch) | Confirm this is an acceptable risk for the alpha specifically, in writing |

## Reading this table

**Blocking = "Yes"** means: this specific row must move to at least Operationally Verified
before real users should be admitted, regardless of how ready everything else is. A launch
with even one blocking row still at "Not started" is not a partial launch — it's not ready.

**Everything currently at "IaC" or "Not started" has a documented next action** — nothing
on this list is a mystery or requires new discovery work. The critical path is genuinely
external: an AWS account, a legal review, and a small piece of already-scoped frontend work
are the three things standing between this table and a real GO recommendation, not unknown
engineering risk.
