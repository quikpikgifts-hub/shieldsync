output "bucket_name" {
  value = aws_s3_bucket.photos.bucket
}

output "bucket_region" {
  value = aws_s3_bucket.photos.region
}

output "access_key_id" {
  value     = aws_iam_access_key.app.id
  sensitive = true
}

output "secret_access_key" {
  value     = aws_iam_access_key.app.secret
  sensitive = true
}
