# Ember Backend — AWS Setup Guide

What a real AWS account needs before `terraform apply` can run for real, and exactly which
pieces `infra/terraform/` creates for you versus which pieces need a human to set up first.
**Nothing in this document has been executed against a real AWS account** — no account
exists yet (see `PRODUCTION_READINESS_REPORT.md`). This is preparation, reviewed against the
actual current Terraform source, not a record of anything deployed.

## How to read this document

Each section states one of three things plainly:
- **Terraform creates this** — `terraform apply` provisions it; no manual step needed
  beyond supplying the right input variables.
- **Manual, one-time, before first apply** — a human with AWS console/CLI access does this
  once; Terraform doesn't and (for a few of these) structurally can't.
- **Gap — not currently automated** — something the deployment genuinely needs that neither
  Terraform nor any existing script currently handles. Flagged explicitly rather than
  silently assumed to work.

---

## 1. AWS account prerequisites

**Manual, one-time, before first apply.**

- A real AWS account, not a personal/trial account being repurposed — billing configured,
  a payment method attached.
- Root account credentials are used *once*, to create the first IAM identity below, then
  never used again for day-to-day operations (AWS's own best practice, unrelated to
  anything specific to this app).
- Enable MFA on the root account.
- Choose the AWS region — `infra/terraform/variables.tf`'s `aws_region` defaults to
  `us-east-1`; change it if a different region is preferred (no code assumes `us-east-1`
  specifically, but ACM certificates for CloudFront-style use cases must be in `us-east-1`
  — not applicable here since no CDN is used, see §11).

## 2. IAM users and roles

### Terraform creates this

- **ECS execution role** (`${name_prefix}-ecs-execution`) — what ECS itself uses to pull
  the container image and inject secrets at task start. Attached policies:
  `AmazonECSTaskExecutionRolePolicy` (AWS-managed) plus a custom inline policy scoped to
  `secretsmanager:GetSecretValue` on exactly one resource: the app's own Secrets Manager
  secret ARN. Never used by application code at runtime.
- **ECS task role** (`${name_prefix}-ecs-task`) — what the running application itself
  assumes. Currently has no policies attached — the app authenticates to S3 with the static
  IAM user below, not this role. Kept as a real, existing resource (not omitted) so
  switching S3 access to task-role-based IAM later (a strict security improvement — no
  static keys) is a policy attachment, not a new resource.
- **S3 app IAM user** (`${name_prefix}-s3-app-user`, in `modules/storage`) — a dedicated,
  narrowly-scoped IAM user with a generated access key. Policy: `s3:PutObject`,
  `s3:GetObject`, `s3:DeleteObject` on the bucket's objects, and `s3:ListBucket` on the
  bucket itself — nothing else, on no other resource.

### Manual, one-time, before first apply

- **A deploy IAM principal for Terraform itself** — the credentials you run
  `terraform apply` with need permission to create every resource type listed in this
  document (VPC, RDS, ElastiCache, S3, Secrets Manager, ECS, IAM roles/users, Route53/ACM
  if `enable_dns=true`). The simplest correct starting point is the AWS-managed
  `AdministratorAccess` policy on a dedicated IAM user or role created for this purpose —
  **not the root account**, and not reused for anything else. Scope this down to a
  least-privilege custom policy once the exact resource set stabilizes, if your
  organization requires it; that's a follow-up hardening step, not a blocker to a first
  apply.

### Gap — not currently automated

- **The GitHub Actions OIDC deploy role.** `.github/workflows/backend-deploy.yml` expects a
  secret named `AWS_DEPLOY_ROLE_ARN` — an IAM role that GitHub Actions assumes via OIDC
  federation (no long-lived AWS keys stored as a GitHub secret). **No Terraform module in
  this repository creates this role.** It must be created manually. Minimum viable setup:

  ```bash
  # 1. Create (or confirm) the GitHub OIDC identity provider in this AWS account —
  #    a one-time, account-wide setup, not specific to this repo.
  aws iam create-open-id-connect-provider \
    --url https://token.actions.githubusercontent.com \
    --client-id-list sts.amazonaws.com \
    --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1

  # 2. Create the trust policy, scoped to this specific repo and the `production`
  #    GitHub Environment — not a wildcard across all repos/branches.
  cat > deploy-trust-policy.json <<'EOF'
  {
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": { "Federated": "arn:aws:iam::<ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com" },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": { "token.actions.githubusercontent.com:aud": "sts.amazonaws.com" },
        "StringLike": { "token.actions.githubusercontent.com:sub": "repo:<ORG>/<REPO>:environment:production" }
      }
    }]
  }
  EOF
  aws iam create-role --role-name ember-backend-deploy \
    --assume-role-policy-document file://deploy-trust-policy.json

  # 3. Attach a least-privilege permissions policy — only what backend-deploy.yml's
  #    "Deploy to ECS" step actually calls.
  cat > deploy-permissions-policy.json <<'EOF'
  {
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Action": ["ecs:UpdateService", "ecs:DescribeServices"],
      "Resource": [
        "arn:aws:ecs:<REGION>:<ACCOUNT_ID>:service/<ecs_cluster_name output>/<ecs_service_name output>"
      ]
    }]
  }
  EOF
  aws iam put-role-policy --role-name ember-backend-deploy \
    --policy-name ecs-deploy --policy-document file://deploy-permissions-policy.json

  # 4. Set the resulting role ARN as this repo's AWS_DEPLOY_ROLE_ARN secret (GitHub
  #    Settings → Secrets and variables → Actions), and set the ECS_CLUSTER_NAME /
  #    ECS_SERVICE_NAME / API_URL repository *variables* from Terraform's outputs.
  ```

  Run step 3's `aws iam put-role-policy` again after the first `terraform apply`, once the
  real cluster/service ARNs are known from `terraform output`.

## 3. Route53 (optional)

**Terraform creates this** — only when `enable_dns = true` (`infra/terraform/modules/dns`).
Either a new hosted zone (`create_hosted_zone = true`) or a lookup against an existing one.

**Manual, one-time**: owning the domain itself. If `create_hosted_zone = true`, after
`apply` you must point the domain registrar's nameservers at the `route53_name_servers`
output — Terraform cannot do this, since it doesn't own the registrar account.

## 4. ACM certificates (optional)

**Terraform creates this** — `modules/dns`, DNS-validated, only when `enable_dns = true`.
No manual step beyond DNS delegation actually resolving (ACM's validation records need to
be visible to ACM, which requires step 3 above to be complete first).

## 5. VPC, subnets, NAT/Internet Gateway

**Terraform creates all of this** (`modules/networking`) — no manual step. One VPC
(`10.20.0.0/16` by default), 2 public + 2 private subnets across 2 AZs, 1 Internet Gateway,
2 NAT Gateways (one per AZ, for outbound-only internet access from the private subnets —
this is the single largest recurring cost line item; see `AWS_COST_ESTIMATE.md`).

## 6. Security groups

**Terraform creates all of this** (`modules/networking`) — 4 groups, each scoped to exactly
what needs to reach it: ALB accepts 80/443 from the internet; the ECS service accepts its
app port from the ALB only; the database accepts 5432 from the ECS service only; the cache
accepts 6379 from the ECS service only. Nothing allows the database or cache to be reached
directly from the internet.

## 7. ECS cluster, task definition, service, ALB

**Terraform creates all of this** (`modules/ecs`) — Fargate cluster with Container Insights
enabled, a task definition referencing `var.container_image`, an ALB in the public subnets,
an HTTP listener (redirects to HTTPS once a certificate exists, forwards directly
otherwise), and an HTTPS listener (only created once `acm_certificate_arn` is set).

### Gap — not currently automated

**Pulling the container image from GHCR.** `backend-deploy.yml` publishes to
`ghcr.io/<org>/<repo>/ember-backend:<tag>` (GitHub Container Registry), not ECR — a
deliberate choice (no extra AWS resource needed just to hold images). GHCR packages default
to **private**, scoped to the repo/org. The ECS task definition Terraform creates has **no
`repositoryCredentials`** configured — meaning, as written today, ECS can only pull the
image if the GHCR package is made **public**. Two ways to close this gap, neither
implemented yet:
1. **Simplest**: make the `ember-backend` GHCR package public (GitHub package settings →
   Change visibility). No Terraform change needed.
2. **If the package must stay private**: create a GitHub Personal Access Token scoped to
   `read:packages`, store it in Secrets Manager, and add a `repositoryCredentials` block
   (`credentialsParameter` = that secret's ARN) to the `aws_ecs_task_definition` container
   definition in `modules/ecs/main.tf` — a real Terraform change, not yet made, since which
   option is preferred is a decision this pass doesn't make for you.

**If ECR is actually preferred over GHCR** (the original Task 1 request lists ECR as a
requirement): that's a deployment-pipeline change, not just an infrastructure-setup step —
`backend-deploy.yml` would need to authenticate to and push to an ECR repository instead of
GHCR, and a new Terraform resource (`aws_ecr_repository`) would need to be added. Not done
in this pass, since it changes the CI/CD pipeline's behavior, not just documents it — flag
this explicitly for a decision rather than silently switching registries.

## 8. RDS PostgreSQL

**Terraform creates this** (`modules/database`) — Postgres 16.4, `db.t4g.micro` by default,
`gp3` storage with autoscaling up to 100GB, encrypted at rest (AWS-managed default KMS key
— see §14), single-AZ by default, 7-day automated backup retention, deletion protection on
by default (forces a final snapshot on destroy). No manual step.

## 9. ElastiCache Redis

**Terraform creates this** (`modules/cache`) — Redis 7.1, `cache.t4g.micro` by default,
single-node by default (no automatic failover until `num_cache_clusters` is raised), both
transit and at-rest encryption enabled, AUTH-token-protected. No manual step.

## 10. S3 bucket

**Terraform creates this** (`modules/storage`) — private (all four public-access-block
settings on), versioned, SSE-S3 encrypted, CORS-configured for direct browser uploads from
`s3_allowed_upload_origins`, lifecycle rules for incomplete-multipart cleanup and old-version
expiry. No manual step.

## 11. CDN

**Not used, by design.** No CloudFront distribution exists in this codebase, and none is
needed for the current architecture — photo reads go through short-lived signed S3 URLs
directly (see `SECURITY_NOTES.md`), not a CDN-fronted public bucket. If a CDN becomes
desirable later (e.g. for reduced photo-load latency at real scale), that's new
infrastructure work, not a gap in what exists today.

## 12. SES / email vendor

**Gap — not currently automated, and not currently SES-specific by design.** The
application's `SmtpEmailProvider` speaks generic SMTP — it works with SES's SMTP interface,
Postmark, SendGrid, or any SMTP-speaking relay, and no vendor has been chosen yet (see
`DEPLOYMENT_READINESS_CHECKLIST.md`'s Email section). No Terraform in this repo provisions
SES specifically. If SES is the chosen vendor, the manual/console steps are:

1. In the SES console, verify the sending domain (add the TXT/CNAME records SES provides
   to your DNS — this repo's Route53 zone, if `enable_dns=true`, or wherever DNS actually
   lives).
2. Request production access (SES starts every new account in a sending-quota-limited
   "sandbox" mode that can only send to verified addresses) — this is an AWS support
   request, not a Terraform-automatable step.
3. Create SMTP credentials (SES Console → SMTP Settings → Create SMTP Credentials) — these
   are IAM-derived but SES-specific, distinct from a normal IAM access key.
4. Set `SMTP_HOST` (the SES SMTP endpoint for your region, e.g.
   `email-smtp.us-east-1.amazonaws.com`), `SMTP_USER`, `SMTP_PASSWORD` either as Terraform
   variables (`-var smtp_host=... -var smtp_user=... -var smtp_password=...`) on the next
   `apply`, or directly via `aws secretsmanager put-secret-value` afterward (see
   `OPERATIONS_RUNBOOK.md`'s credential-rotation section for the exact command shape).

## 13. CloudWatch

**Terraform creates this, partially.** A log group (`/ecs/${name_prefix}`) with
Container Insights enabled on the ECS cluster, and RDS exports its `postgresql`/`upgrade`
logs to CloudWatch Logs. **Gap**: no `aws_cloudwatch_metric_alarm` resources exist anywhere
in `infra/terraform/` — `DEPLOYMENT_READINESS_CHECKLIST.md`'s Monitoring section already
lists the specific alarms needed (ECS unhealthy-task, RDS CPU/storage, ALB 5xx-rate), and
`PRODUCTION_READINESS_REPORT.md` (Phase 5) flagged this as a real, previously-unaddressed
gap. Creating them is real Terraform work (new resources in `modules/ecs` or a new
`modules/monitoring`), not yet done — see `TERRAFORM_READINESS.md` for the specific
finding and recommendation.

## 14. Secrets Manager

**Terraform creates this** (`modules/secrets`) — one secret holding all 11 runtime env vars
the ECS task definition maps in. `DATABASE_URL`/`REDIS_URL`/`JWT_ACCESS_SECRET`/`S3_*` are
auto-populated from the other modules' outputs; `SMTP_*`/`SENTRY_DSN` default to blank
until a real vendor is chosen (see §12). No manual step for the secret itself, beyond
filling in the blank values once real vendor credentials exist.

## 15. KMS

**Gap — no dedicated customer-managed key exists.** Every "encrypted at rest" claim in this
document (RDS `storage_encrypted`, ElastiCache `at_rest_encryption_enabled`, S3 SSE-S3,
Secrets Manager's own encryption) relies on **AWS-managed default keys**
(`aws/rds`, `aws/elasticache`, `aws/s3`, `aws/secretsmanager`), not a dedicated
customer-managed KMS key (CMK). This is a legitimate, secure default — not a downgrade —
but it means there's no single key an operator can rotate/audit/restrict access to
independently of AWS's own key-management defaults. If your organization's compliance
posture requires a CMK specifically (e.g. for key-usage audit logging, cross-account
sharing controls, or a formal key-rotation policy you control), that's new Terraform work
(an `aws_kms_key` resource plus `kms_key_id` arguments threaded through each module) not
present today.

## 16. Backup strategy

**Terraform creates this** for the database: automated RDS backups (7-day retention by
default, `backup_retention_days` variable), plus ElastiCache snapshots (3-day retention by
default, `snapshot_retention_days` variable). **No automated S3 backup beyond bucket
versioning** (recoverable prior versions, not a separate backup copy) — appropriate given
S3's own 11-nines durability, but worth naming explicitly. See `DISASTER_RECOVERY_REPORT.md`
for what's actually been drilled (a real local Postgres backup/restore cycle) versus what
requires real infrastructure to drill (an actual RDS snapshot restore).

---

## Summary table

| Component | Status |
|---|---|
| VPC / subnets / NAT / IGW | Terraform creates |
| Security groups | Terraform creates |
| ECS cluster / service / ALB | Terraform creates |
| RDS PostgreSQL | Terraform creates |
| ElastiCache Redis | Terraform creates |
| S3 bucket | Terraform creates |
| Secrets Manager secret | Terraform creates |
| Route53 / ACM | Terraform creates (opt-in, `enable_dns=true`) |
| ECS execution/task IAM roles | Terraform creates |
| S3 app IAM user | Terraform creates |
| Deploy role for GitHub OIDC | **Gap — manual, see §2** |
| GHCR pull auth (if package stays private) | **Gap — manual or new Terraform, see §7** |
| ECR (if preferred over GHCR) | **Not built — pipeline change, see §7** |
| SES / email vendor setup | **Manual, vendor-specific, see §12** |
| CloudWatch alarms | **Gap — not built, see §13 and `TERRAFORM_READINESS.md`** |
| Dedicated KMS CMK | **Not built — optional hardening, see §15** |
