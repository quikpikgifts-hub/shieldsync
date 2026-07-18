resource "random_password" "jwt_access_secret" {
  # 44+ random bytes, base64-ish — comfortably over the 32-character minimum
  # src/config/validation.schema.ts enforces (SECURITY_AUDIT.md L-2).
  length  = 64
  special = false
}

resource "aws_secretsmanager_secret" "app" {
  name        = "${var.name_prefix}-app-secrets"
  description = "Ember backend runtime secrets — consumed by the ECS task definition via valueFrom, never baked into the task definition or image. See OPERATOR_RUNBOOK.md for rotation."

  tags = var.tags
}

# Every key here matches an env var name in backend/.env.example exactly, so the ECS task
# definition's `secrets` block (modules/ecs) can map 1:1 without translation. SMTP
# credentials are intentionally left blank (empty string) here — this module has no way to
# know a real transactional-email vendor's credentials, and Terraform must not invent
# placeholder-that-looks-real values. Fill them in via `terraform apply -var` or a follow-up
# `aws secretsmanager put-secret-value` once a vendor is actually chosen — see
# DEPLOYMENT_READINESS_CHECKLIST.md.
resource "aws_secretsmanager_secret_version" "app" {
  secret_id = aws_secretsmanager_secret.app.id
  secret_string = jsonencode({
    DATABASE_URL         = var.database_url
    REDIS_URL            = var.redis_url
    JWT_ACCESS_SECRET    = random_password.jwt_access_secret.result
    S3_BUCKET            = var.s3_bucket_name
    S3_REGION            = var.s3_bucket_region
    S3_ACCESS_KEY_ID     = var.s3_access_key_id
    S3_SECRET_ACCESS_KEY = var.s3_secret_access_key
    SMTP_HOST            = var.smtp_host
    SMTP_USER            = var.smtp_user
    SMTP_PASSWORD        = var.smtp_password
    SENTRY_DSN           = var.sentry_dsn
  })

  lifecycle {
    # Once a real operator has rotated SMTP/Sentry values by hand (e.g. via the AWS
    # console or `put-secret-value`, per OPERATOR_RUNBOOK.md's rotation procedure),
    # a subsequent `terraform apply` shouldn't silently stomp that change back to
    # whatever blank/stale value is in this config.
    ignore_changes = [secret_string]
  }
}
