# Ember Backend — Terraform Readiness Review

A fresh, module-by-module review of `infra/terraform/` performed for Phase 6, checking each
module's variables, outputs, IAM, networking, database, Redis, storage, logging, and
monitoring posture against the actual current `.tf` source (re-read in full for this
review, not assumed from memory of earlier passes). See `infra/terraform/README.md` for
what "validated" means here — `terraform fmt -check -recursive` passes (re-confirmed this
pass, exit 0), and every finding below comes from manual review, since `terraform
init`/`validate`/`plan` still cannot run (`registry.terraform.io` remains blocked by this
build environment's network policy, re-confirmed this pass with a fresh `curl` check).

**Status: infrastructure-as-code complete. Not infrastructure deployed, not operationally
verified.** Nothing here has been applied against a real AWS account.

## Variables

Every module's `variables.tf` was checked for: a sensible default where one exists, `no
default` where a real value is required (forcing an explicit decision rather than a silent
placeholder), and `sensitive = true` on anything credential-shaped.

- **Correct, no findings**: `container_image` (root and `modules/ecs`) has no default —
  correctly forces the operator to supply a real published image rather than defaulting to
  something invented. `cors_origin`/`frontend_base_url`/`s3_allowed_upload_origins` have no
  defaults — correctly force a real value rather than defaulting to `localhost`, which
  would be silently wrong in production. `smtp_password`, `s3_secret_access_key`,
  `database_url`, `redis_url` are all marked `sensitive = true` in every module that
  declares them — confirmed consistent across `modules/secrets`, `modules/database`,
  `modules/cache`, `modules/storage`.
- **Correct, sizing defaults appropriate for pre-alpha**: `db_instance_class` (`db.t4g.micro`),
  `redis_node_type` (`cache.t4g.micro`), `ecs_task_cpu`/`ecs_task_memory` (512/1024),
  `ecs_desired_count` (1), `db_multi_az`/`num_cache_clusters`/`enable_autoscaling` (all off
  by default) — each carries an inline comment explaining the pre-alpha-scale reasoning
  (`ARCHITECTURE.md` §2's "don't provision for load that doesn't exist yet" principle
  applied consistently, not just asserted once).
- **Finding (informational)**: `variables.tf`'s `environment` variable defaults to
  `"production"` at the root level, which is correct for this module tree's actual purpose
  (there's exactly one environment definition here, meant for production), but means a
  careless `terraform apply` with no `-var-file` at all would tag everything
  `Environment=production` even for an accidental test run. Not a real risk today — no
  state backend is configured yet, so an accidental apply can't silently land against a
  shared/real state — but worth a comment or a required (no-default) variable once a
  second environment (e.g. staging) is ever added.

## Outputs

Every module's outputs were checked against what the root module and `OPERATOR_RUNBOOK.md`/
`DEPLOYMENT_READINESS_CHECKLIST.md` actually reference by name.

- **Correct, no findings**: all nine root-level outputs (`alb_dns_name`, `api_url`,
  `database_endpoint`, `redis_endpoint`, `s3_bucket_name`, `secrets_manager_secret_name`,
  `ecs_cluster_name`, `ecs_service_name`, `cloudwatch_log_group`, `route53_name_servers`)
  match exactly what `AWS_SETUP_GUIDE.md`, `OPERATOR_RUNBOOK.md`, and
  `.github/workflows/backend-deploy.yml`'s documentation reference by name — re-verified
  this pass, zero drift.
- **Correct**: every module marks its sensitive outputs (`master_password`,
  `connection_string` in both `modules/database` and `modules/cache`, `auth_token`,
  `access_key_id`/`secret_access_key`) with `sensitive = true` — confirmed none of these
  would print in plaintext in a `terraform apply` summary or `terraform output` without
  `-raw`/explicit opt-in.
- **Finding (informational)**: `api_url`'s root output is `null` whenever `enable_dns =
  false` (the current default) — correctly reflects that no real HTTPS URL exists without
  a domain, but means the *only* usable output for a first smoke test is `alb_dns_name`
  (plain HTTP). This is documented in `infra/terraform/README.md`'s usage section already
  — flagged here only to confirm it's a deliberate, not accidental, gap.

## IAM

Re-reviewed every `aws_iam_*` resource across all modules for scope creep.

- **ECS execution role** (`modules/ecs`): `AmazonECSTaskExecutionRolePolicy` (AWS-managed,
  standard for this purpose — ECR/CloudWatch Logs/basic execution permissions) plus one
  custom inline policy scoped to `secretsmanager:GetSecretValue` on exactly one resource
  ARN (this app's own secret). No wildcard resource, no extra action. Correct.
- **ECS task role** (`modules/ecs`): exists, zero policies attached. Correct as documented
  — reserved for a future switch to task-role-based S3 access.
- **S3 app IAM user** (`modules/storage`): scoped to `PutObject`/`GetObject`/`DeleteObject`
  on `${bucket.arn}/*` and `ListBucket` on the bucket itself. No wildcard resource
  (`arn:aws:s3:::*` or similar), no extra action (no `s3:PutBucketPolicy`,
  no `s3:DeleteBucket`, etc.). Correct, matches what was already verified in the RC-1
  security review.
- **Finding (gap, not a scope-creep issue)**: no IAM resource anywhere in this module tree
  represents the GitHub Actions OIDC deploy role `backend-deploy.yml` expects
  (`AWS_DEPLOY_ROLE_ARN`). This isn't a least-privilege violation — it's an absence. See
  `AWS_SETUP_GUIDE.md` §2 for the manual creation steps and the exact least-privilege
  policy this role needs (`ecs:UpdateService`/`ecs:DescribeServices`, scoped to one
  cluster/service ARN).

## Networking

- VPC (`10.20.0.0/16`), 2 AZs, 2 public + 2 private subnets, 1 Internet Gateway, 2 NAT
  Gateways (one per AZ — correctly avoids a cross-AZ single point of failure for outbound
  traffic, at the cost of a second NAT gateway's hourly charge — see `AWS_COST_ESTIMATE.md`).
- Security groups form a correct, minimal chain: ALB ← internet; ECS service ← ALB only;
  database ← ECS service only; cache ← ECS service only. Re-verified this pass by reading
  every `ingress`/`egress` block directly — no group allows broader inbound access than its
  documented purpose, and no `0.0.0.0/0` ingress exists on the database or cache groups.
- **Finding (informational)**: every security group's `egress` block is `0.0.0.0/0` on all
  ports/protocols (the Terraform default posture, not tightened). This is normal and low-risk
  for outbound traffic (the resources behind these groups all need to reach out — image
  pulls, SMTP, S3, Sentry, RDS/ElastiCache's own maintenance traffic), but a stricter
  posture (egress scoped to only the specific ports/destinations each tier actually needs)
  is a defense-in-depth option worth considering post-launch, not a pre-launch blocker.

## Database

- Postgres 16.4, `gp3` storage with autoscaling, `storage_encrypted = true`,
  `publicly_accessible = false`, single-AZ by default, 7-day backup retention, deletion
  protection on with a static (not `timestamp()`-derived) final-snapshot identifier —
  re-confirmed the `timestamp()` anti-pattern fix from the original build is still in place
  and hasn't regressed.
- `enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]` — real log export is
  configured, feeding into the CloudWatch gap noted below (logs exist; alarms on them
  don't).
- **No findings** beyond what's already tracked: no column-level encryption (an application-
  layer, not Terraform, concern — see `DATABASE_SCHEMA.md` §5), no dedicated KMS CMK (see
  `AWS_SETUP_GUIDE.md` §15).

## Redis

- Redis 7.1 via `aws_elasticache_replication_group` (not a bare cluster, deliberately —
  allows raising `num_cache_clusters` later without a resource replacement), both
  transit and at-rest encryption enabled, AUTH-token-protected, `automatic_failover_enabled`/
  `multi_az_enabled` correctly derived from `num_cache_clusters > 1` rather than hardcoded.
- **No findings.**

## Storage

- Private bucket, all four public-access-block settings `true`, versioning enabled, SSE-S3
  encryption, CORS scoped to `allowed_upload_origins` (not `*`), lifecycle rules for
  incomplete-multipart cleanup (1 day) and old-version expiry (90 days).
- **No findings.** Re-confirms the RC-1 security review's read of this module.

## Logging

- ECS: one CloudWatch log group (`/ecs/${name_prefix}`), 30-day retention by default
  (`log_retention_days` variable), Container Insights enabled on the cluster.
- RDS: `postgresql`/`upgrade` logs exported to CloudWatch.
- **No findings** on what exists. See Monitoring below for what doesn't.

## Monitoring

**Finding (gap — the most significant one in this review): no `aws_cloudwatch_metric_alarm`
resources exist anywhere in `infra/terraform/`.** Logs are being collected (see Logging
above) but nothing is watching them or the underlying service metrics for a threshold
breach. `DEPLOYMENT_READINESS_CHECKLIST.md`'s Monitoring section already names the specific
alarms a real launch needs — at minimum:

- ECS service unhealthy-task count (`AWS/ECS`, `runningCount < desiredCount` sustained)
- RDS CPU utilization and free storage space (`AWS/RDS`)
- ALB 5xx error rate (`AWS/ApplicationELB`)
- ElastiCache CPU/memory/evictions (`AWS/ElastiCache`)

None of these have a corresponding Terraform resource today. This was also flagged in
Phase 5's `PRODUCTION_READINESS_REPORT.md` as a real, previously-unaddressed gap — this
review confirms it's still accurate and adds the specific missing resource type
(`aws_cloudwatch_metric_alarm`) plus a recommended module home (either inline in
`modules/ecs`/`modules/database`/`modules/cache`, or a new `modules/monitoring` that takes
each service's identifiers as inputs). **Not implemented in this pass** — this is a
documentation/review deliverable, not a new-Terraform-authoring one; see
`AWS_SETUP_GUIDE.md` §13 for the same finding framed as a setup gap.

## Remote state

**Finding (gap, already documented but re-confirmed live)**: `versions.tf` has no
`backend "s3" {}` block — state would be local-only for a first `apply`. `infra/terraform/README.md`
already calls this out with the correct guidance (create an S3 bucket + DynamoDB lock table
first, add the backend block before any real `apply` beyond a first smoke test). Re-verified
this pass that the guidance is still accurate and the backend block genuinely doesn't exist
yet — not a regression, but worth restating since Task 3's deployment checklist needs to
sequence this correctly (see `DEPLOYMENT_CHECKLIST.md`).

## Summary

| Area | Status |
|---|---|
| Variables | ✅ No real findings — sensible defaults, sensitive marking correct |
| Outputs | ✅ No real findings — zero drift from what other docs reference |
| IAM (existing resources) | ✅ Least-privilege, no scope creep found |
| IAM (deploy role) | ⚠️ Gap — doesn't exist, manual creation documented in `AWS_SETUP_GUIDE.md` |
| Networking | ✅ Correctly scoped security-group chain |
| Database | ✅ No new findings |
| Redis | ✅ No new findings |
| Storage | ✅ No new findings |
| Logging | ✅ Real log export configured |
| Monitoring | ⚠️ Gap — no alarms exist; most significant finding this review |
| Remote state | ⚠️ Gap — local state only, documented, sequencing matters for first apply |

**fmt-clean, manually reviewed, structurally sound. The two real gaps (deploy-role IAM,
CloudWatch alarms) are both additive — closing them doesn't require changing any existing
resource, only adding new ones — and both have a documented path to closing them in
`AWS_SETUP_GUIDE.md`.**
