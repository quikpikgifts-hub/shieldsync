# Ember Backend — Terraform (AWS reference implementation)

**Status: written, formatted, and manually reviewed. Not run against a real AWS account —
no AWS account exists for this project, and `terraform init` could not even be attempted
in the sandbox this was built in.** See "How this was validated" below for exactly what
was and wasn't checked, in the same spirit as `DEPLOYMENT.md`'s existing note about
`docker compose up` never having been run to completion in this environment either.

Do not treat anything under `infra/terraform/` as "infrastructure complete." It is
"infrastructure code complete" — see `DEPLOYMENT_READINESS_CHECKLIST.md`'s distinction
between those two states, which this whole project now maintains deliberately.

## What this provisions

Follows `ARCHITECTURE.md` §3's recommended stack: a single managed container platform
(ECS/Fargate, not Kubernetes) plus managed Postgres (RDS) and Redis (ElastiCache), matching
what `backend/k8s/` intentionally does *not* commit to (see `k8s/README.md`).

| Module | Creates |
|---|---|
| `modules/networking` | VPC, public/private subnets across 2 AZs, NAT gateways, security groups (each service reachable only from what actually needs to reach it — see the security-group comments in the module) |
| `modules/database` | RDS Postgres 16, encrypted at rest, automated backups, a Terraform-generated master password stored only in Secrets Manager |
| `modules/cache` | ElastiCache Redis 7, encrypted at rest and in transit, AUTH-token-protected |
| `modules/storage` | S3 bucket (private, versioned, encrypted, CORS-configured for direct browser uploads) + a dedicated IAM user scoped to only that bucket |
| `modules/secrets` | One Secrets Manager secret holding every env var the app's `secrets` ECS mapping expects — composes the outputs of the modules above plus SMTP/Sentry values you supply |
| `modules/ecs` | ECS cluster, Fargate task definition + service, an ALB (HTTP always; HTTPS only once a certificate exists), CloudWatch log group, optional CPU-based autoscaling (off by default) |
| `modules/dns` | Optional (`enable_dns = true`) — ACM certificate + DNS validation, and (if `create_hosted_zone = true`) a Route53 hosted zone |

## How this was validated

- `terraform fmt -check -recursive` — passes (exit 0). Confirms every file is
  syntactically valid, parseable HCL.
- Manual review of every resource against the AWS provider's documented schema (argument
  names, required/optional fields, block nesting) — done by reading the code, not by
  running a tool, since no tool run got further than `fmt`.
- Manual dependency-graph review: an actual circular dependency was found and fixed during
  writing (the `dns` module's ALB alias record originally depended on `modules/ecs`, while
  `modules/ecs` depended on `dns`'s certificate output — the alias record now lives in the
  root module's `dns_record.tf` instead, which can see both without either module needing
  to see the other).
- **Not done, and not possible in the sandbox this was built in:** `terraform init`
  (needs `registry.terraform.io` to download the `hashicorp/aws` and `hashicorp/random`
  providers — confirmed blocked by this session's network policy: the proxy returned a
  hard 403 policy denial, the same class of restriction that blocked Docker Hub during
  Phase 1's `docker compose up`, not a transient failure worth retrying), `terraform
  validate` (requires `init` to have succeeded first — it needs the real provider schema,
  not just parseable syntax), `terraform plan`, and `terraform apply` (both also require a
  real AWS account and credentials, which don't exist here either).

**Before this is used for real:** run `terraform init && terraform validate && terraform
plan` yourself, in an environment with real registry access and a real (even if
throwaway/sandbox) AWS account, and fix whatever `validate`/`plan` surface — treat this
code as a strong first draft that has been read carefully, not as pre-verified.

## Usage (once you have a real AWS account)

```bash
cd backend/infra/terraform

# 1. Configure remote state first — local state is fine for a first read-through/plan,
#    but don't run a real `apply` without it (see versions.tf's comment). Create an S3
#    bucket + DynamoDB lock table by hand or via a small bootstrap config outside this
#    directory, then add a backend "s3" {} block to versions.tf.

terraform init

cp environments/production.tfvars.example environments/production.tfvars
# edit production.tfvars — at minimum, container_image, cors_origin, frontend_base_url,
# s3_allowed_upload_origins must be real values; everything else has a reasonable
# pre-alpha-sized default (see variables.tf).

terraform plan  -var-file=environments/production.tfvars
terraform apply -var-file=environments/production.tfvars
```

After `apply` succeeds:

1. Read `secrets_manager_secret_name` from the outputs and confirm the secret has real
   values for `DATABASE_URL`/`REDIS_URL`/`JWT_ACCESS_SECRET`/`S3_*` (auto-populated) and
   fill in `SMTP_*`/`SENTRY_DSN` by hand once those vendors are chosen (`terraform apply`
   again with `-var smtp_host=... -var smtp_user=...` etc., or `aws secretsmanager
   put-secret-value` directly — see `OPERATOR_RUNBOOK.md`).
2. Run `npx prisma migrate deploy` against the real `DATABASE_URL` (from a machine that can
   reach the database — the RDS instance is not publicly accessible, by design; use a
   bastion, SSM Session Manager, or a one-off ECS task).
3. Confirm `.github/workflows/backend-deploy.yml`'s image reference matches
   `container_image`, then trigger a deploy (push to `main`, or `workflow_dispatch`).
4. Validate `GET https://<api_fqdn>/health` (or the ALB's plain-HTTP DNS name if
   `enable_dns = false`) before considering the environment live — see
   `GO_LIVE_CHECKLIST.md`'s "Launch verification" section for the full list.

## Cost note

This is sized for a pre-alpha closed cohort, not production scale — `db.t4g.micro`,
`cache.t4g.micro`, a single Fargate task, single-AZ RDS/Redis. Rough AWS list-price
ballpark at these sizes: **$50-120/month** (RDS ~$15-25, ElastiCache ~$15-25, Fargate
~$15-30, ALB ~$20, NAT gateways ~$65 for two — the NAT gateways are actually the single
largest line item at this scale; one NAT gateway instead of two saves ~$32/month at the
cost of the redundancy described in `modules/networking/main.tf`). Confirm current AWS
pricing before treating this as a real budget number — it will drift.
