resource "aws_s3_bucket" "photos" {
  bucket = "${var.name_prefix}-photos"
  tags   = merge(var.tags, { Name = "${var.name_prefix}-photos" })
}

resource "aws_s3_bucket_public_access_block" "photos" {
  bucket = aws_s3_bucket.photos.id

  # No public access, ever — every read the app serves goes through a short-lived signed
  # URL (S3StorageProvider.getReadUrl), never a public bucket policy. See SECURITY_NOTES.md.
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "photos" {
  bucket = aws_s3_bucket.photos.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "photos" {
  bucket = aws_s3_bucket.photos.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_cors_configuration" "photos" {
  bucket = aws_s3_bucket.photos.id
  cors_rule {
    allowed_methods = ["PUT"]
    allowed_origins = var.allowed_upload_origins
    allowed_headers = ["Content-Type"]
    max_age_seconds = 3000
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "photos" {
  bucket = aws_s3_bucket.photos.id
  rule {
    id     = "abort-incomplete-multipart-uploads"
    status = "Enabled"
    abort_incomplete_multipart_upload {
      days_after_initiation = 1
    }
  }
  rule {
    id     = "expire-old-versions"
    status = "Enabled"
    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }
}

# The application authenticates to S3 as this IAM user (access key + secret, per
# S3_ACCESS_KEY_ID/S3_SECRET_ACCESS_KEY) rather than assuming this policy is attached to
# the ECS task role, so the exact same StorageProvider code path works identically whether
# this runs on ECS, a different host, or a developer's machine against a personal bucket —
# it never depends on being inside AWS's IAM/instance-metadata machinery. If/when that
# portability stops mattering, switching to an ECS task-role-based IAM policy (no static
# keys at all) is a strict security improvement — see the note in
# DEPLOYMENT_READINESS_CHECKLIST.md.
resource "aws_iam_user" "app" {
  name = "${var.name_prefix}-s3-app-user"
  tags = var.tags
}

resource "aws_iam_access_key" "app" {
  user = aws_iam_user.app.name
}

data "aws_iam_policy_document" "app_bucket_access" {
  statement {
    sid    = "ObjectReadWrite"
    effect = "Allow"
    actions = [
      "s3:PutObject",
      "s3:GetObject",
      "s3:DeleteObject",
    ]
    resources = ["${aws_s3_bucket.photos.arn}/*"]
  }

  statement {
    sid       = "ListBucket"
    effect    = "Allow"
    actions   = ["s3:ListBucket"]
    resources = [aws_s3_bucket.photos.arn]
  }
}

resource "aws_iam_user_policy" "app" {
  name   = "${var.name_prefix}-s3-app-policy"
  user   = aws_iam_user.app.name
  policy = data.aws_iam_policy_document.app_bucket_access.json
}
