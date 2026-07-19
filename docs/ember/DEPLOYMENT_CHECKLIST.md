# Ember Backend — Deployment Checklist (Empty AWS Account → Live)

Every command below is copy-paste ready. This has never been executed end-to-end against a
real AWS account — no account exists yet (see `PRODUCTION_READINESS_REPORT.md`). Follow
`AWS_SETUP_GUIDE.md` first for anything marked "manual" below; this checklist assumes those
steps are already done and sequences the rest. Replace every `<PLACEHOLDER>` with a real
value — none of these are real values, and running a command with a placeholder still in it
will fail loudly rather than silently do the wrong thing.

## 0. Prerequisites (see `AWS_SETUP_GUIDE.md` for detail)

- [ ] Real AWS account, billing active, MFA on root.
- [ ] A deploy IAM identity with sufficient permissions to create the resources in
      `infra/terraform/` (§2 of `AWS_SETUP_GUIDE.md`).
- [ ] `aws configure` run locally with that identity's credentials (or exported as
      `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`/`AWS_DEFAULT_REGION` env vars).
- [ ] Terraform ≥ 1.6.0 installed and able to reach `registry.terraform.io` (confirm with
      `curl -sSI https://registry.terraform.io` — if this fails, nothing below will work;
      this exact failure is why this checklist has never been executed in this project's
      build sandbox).
- [ ] The GHCR package (`ghcr.io/<org>/<repo>/ember-backend`) is public, or the
      `repositoryCredentials` gap in `AWS_SETUP_GUIDE.md` §7 has been closed.

## 1. Remote state backend (do this before anything else)

Local Terraform state is fine for reviewing a plan, but a real `apply` should use remote
state from the start — re-running `apply` from a different machine/session with only local
state risks a lost or conflicting state file.

```bash
# One-time, outside the infra/terraform/ module tree.
aws s3api create-bucket --bucket ember-terraform-state-<UNIQUE_SUFFIX> \
  --region us-east-1
aws s3api put-bucket-versioning --bucket ember-terraform-state-<UNIQUE_SUFFIX> \
  --versioning-configuration Status=Enabled
aws s3api put-bucket-encryption --bucket ember-terraform-state-<UNIQUE_SUFFIX> \
  --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'

aws dynamodb create-table --table-name ember-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST
```

Then add to `backend/infra/terraform/versions.tf`:

```hcl
terraform {
  backend "s3" {
    bucket         = "ember-terraform-state-<UNIQUE_SUFFIX>"
    key            = "ember-production/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "ember-terraform-locks"
    encrypt        = true
  }
}
```

## 2. Terraform init

```bash
cd backend/infra/terraform
terraform init
```

Expected: downloads the `hashicorp/aws` and `hashicorp/random` providers, initializes the
S3 backend from step 1. **Never successfully run in this project's build environment** —
this is the first command that requires real registry access this codebase has never had.

## 3. Configure variables

```bash
cp environments/production.tfvars.example environments/production.tfvars
```

Edit `environments/production.tfvars` — at minimum:

```hcl
container_image           = "ghcr.io/<org>/<repo>/ember-backend:<commit-sha>"  # from a real backend-deploy.yml run
cors_origin                = "https://<your-real-frontend-domain>"
frontend_base_url          = "https://<your-real-frontend-domain>"
s3_allowed_upload_origins  = ["https://<your-real-frontend-domain>"]

# Optional, fill in once chosen (see AWS_SETUP_GUIDE.md §12) — leave blank to defer:
smtp_host     = ""
smtp_user     = ""
smtp_password = ""
sentry_dsn    = ""

# Optional, only if a real domain is ready:
enable_dns          = false
domain_name         = null
create_hosted_zone  = false
```

## 4. Terraform plan

```bash
terraform plan -var-file=environments/production.tfvars -out=plan.tfout
```

Review the plan output carefully — confirm the resource count and types match
`AWS_SETUP_GUIDE.md`'s summary table (one VPC, 4 subnets, 2 NAT gateways, 4 security
groups, one RDS instance, one ElastiCache replication group, one S3 bucket, one Secrets
Manager secret, one ECS cluster/service/ALB, plus IAM roles/users — no unexpected
`destroy` actions on a first apply, since nothing exists yet to destroy).

## 5. Terraform apply

```bash
terraform apply plan.tfout
```

Expected duration: RDS and ElastiCache provisioning are the slowest resources (typically
10-15 minutes combined); the rest of the plan applies in a few minutes. **Never executed**
in this project — treat the actual duration and any unexpected error as new information,
not a confirmation of an estimate.

## 6. Capture outputs

```bash
terraform output -json > /tmp/ember-terraform-outputs.json
terraform output ecs_cluster_name
terraform output ecs_service_name
terraform output secrets_manager_secret_name
terraform output alb_dns_name
```

Set the GitHub repository variables `ECS_CLUSTER_NAME`, `ECS_SERVICE_NAME`, and `API_URL`
(the `alb_dns_name` output, or the real domain once DNS is set up) from these values — the
credential-gated deploy step in `backend-deploy.yml` reads them by name.

## 7. Run database migrations

The RDS instance is not publicly accessible (by design — see `AWS_SETUP_GUIDE.md` §6).
Migrate from a host that can reach the private subnet: a bastion host, AWS Systems Manager
Session Manager port-forwarding, or a one-off ECS task using the same task definition.

```bash
# Example using SSM port-forwarding through a bastion (bastion setup itself is not
# included in infra/terraform/ — provision one, or use an ECS exec session instead):
aws ssm start-session --target <bastion-instance-id> \
  --document-name AWS-StartPortForwardingSessionToRemoteHost \
  --parameters '{"host":["<rds-endpoint-from-terraform-output>"],"portNumber":["5432"],"localPortNumber":["15432"]}'

# Read the real DATABASE_URL Terraform generated — it's in Secrets Manager, not a root
# Terraform output (root outputs.tf deliberately doesn't expose master_username/password;
# only module.database does, and even those are marked sensitive). Rewrite the host:port
# to point at the local end of the SSM tunnel above rather than the real private endpoint:
SECRET_NAME=$(terraform output -raw secrets_manager_secret_name)
REAL_DATABASE_URL=$(aws secretsmanager get-secret-value --secret-id "$SECRET_NAME" --query SecretString --output text | jq -r .DATABASE_URL)
TUNNELED_DATABASE_URL=$(echo "$REAL_DATABASE_URL" | sed -E 's#@[^:/]+:5432#@127.0.0.1:15432#')

# In a second terminal, from backend/:
DATABASE_URL="$TUNNELED_DATABASE_URL" npx prisma migrate deploy
```

Verify:

```bash
DATABASE_URL="$TUNNELED_DATABASE_URL" npx prisma migrate status
# Expected: "Database schema is up to date!"
```

Seed the RBAC catalog once, against the fresh database:

```bash
DATABASE_URL="$TUNNELED_DATABASE_URL" npx prisma db seed
# Expected: "Seeded 4 roles and 8 permissions."
```

## 8. Fill in remaining secrets (SMTP/Sentry, if not set via tfvars in step 3)

```bash
SECRET_NAME=$(terraform output -raw secrets_manager_secret_name)
aws secretsmanager get-secret-value --secret-id "$SECRET_NAME" --query SecretString --output text \
  | jq '.SMTP_HOST = "<real-smtp-host>" | .SMTP_USER = "<real-smtp-user>" | .SMTP_PASSWORD = "<real-smtp-password>" | .SENTRY_DSN = "<real-sentry-dsn>"' \
  | aws secretsmanager put-secret-value --secret-id "$SECRET_NAME" --secret-string file:///dev/stdin

# Force the running task to pick up the new values:
aws ecs update-service \
  --cluster "$(terraform output -raw ecs_cluster_name)" \
  --service "$(terraform output -raw ecs_service_name)" \
  --force-new-deployment
```

## 9. Confirm the image is published (build/push, if not already done)

Image publishing happens via `.github/workflows/backend-deploy.yml`, not a manual step —
push to `main` (or trigger `workflow_dispatch`) and confirm the run publishes to GHCR:

```bash
docker manifest inspect ghcr.io/<org>/<repo>/ember-backend:<commit-sha>
```

If deploying a specific tag manually instead of via the workflow's automatic path:

```bash
aws ecs update-service \
  --cluster "$(terraform output -raw ecs_cluster_name)" \
  --service "$(terraform output -raw ecs_service_name)" \
  --force-new-deployment
aws ecs wait services-stable \
  --cluster "$(terraform output -raw ecs_cluster_name)" \
  --services "$(terraform output -raw ecs_service_name)"
```

## 10. Smoke tests

```bash
ALB_URL="http://$(terraform output -raw alb_dns_name)"
curl -f "$ALB_URL/live"
curl -f "$ALB_URL/ready"
curl -f "$ALB_URL/health"
```

Then run the real end-to-end validation script (the same one used for local validation in
Phase 5 — 42 real checks, not a subset):

```bash
cd backend
BASE_URL="$ALB_URL" \
DATABASE_URL="$TUNNELED_DATABASE_URL" \
RESULTS_JSON_PATH=./launch-verification-results.json \
node scripts/launch-verification.mjs
# DATABASE_URL is optional here (used only for the moderator-grant and audit-log checks —
# both skip gracefully without it) but requires the SSM tunnel from step 7 still open,
# since the real RDS endpoint isn't reachable from outside the VPC.
```

Review the summary line and `FAILED:` list, if any, before proceeding. **Do not consider
the deployment successful on the strength of `terraform apply` exiting 0** — this script is
what actually confirms the application works end-to-end against the real environment.
Delete the test accounts it creates afterward (see `GO_LIVE_CHECKLIST.md`'s Launch
verification step 12) — this script makes real state changes and is not meant to leave
test data behind in a real database.

## 11. Rollback (if smoke tests fail, or a later deploy regresses something)

```bash
# Re-run backend-deploy.yml via workflow_dispatch with image_tag set to the last known-good
# commit SHA — this redeploys the existing image without a new build.
# (GitHub UI: Actions → Backend Deploy → Run workflow → image_tag: <previous-sha>)

# Or manually, if you already know the previous task definition revision:
aws ecs update-service \
  --cluster "$(terraform output -raw ecs_cluster_name)" \
  --service "$(terraform output -raw ecs_service_name)" \
  --task-definition <family>:<previous-revision> \
  --force-new-deployment
aws ecs wait services-stable \
  --cluster "$(terraform output -raw ecs_cluster_name)" \
  --services "$(terraform output -raw ecs_service_name)"
```

**Before rolling back, check whether the commit(s) being rolled back included a database
migration** — see `RELEASE.md`'s migration-rollback section. Purely additive migrations are
safe to leave in place; destructive/backward-incompatible ones need a compensating
migration first, not just an old image redeployed against a new schema.

After any rollback, re-run step 10's smoke tests — a rollback is a deploy, and gets the
same verification.

## 12. Domain / TLS (optional, once a real domain exists)

```bash
# In environments/production.tfvars:
# enable_dns = true
# domain_name = "<your-real-domain>"
# create_hosted_zone = true   # or false, if the zone already exists elsewhere

terraform plan  -var-file=environments/production.tfvars -out=dns-plan.tfout
terraform apply dns-plan.tfout

# If create_hosted_zone = true, point the domain registrar's nameservers at:
terraform output route53_name_servers
```

Wait for DNS propagation and ACM validation (can take minutes to hours depending on the
registrar), then re-run step 10's smoke tests against the real HTTPS URL
(`terraform output api_url`), not just the ALB's plain-HTTP DNS name.
