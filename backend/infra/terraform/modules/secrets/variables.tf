variable "name_prefix" {
  type = string
}

variable "database_url" {
  type      = string
  sensitive = true
}

variable "redis_url" {
  type      = string
  sensitive = true
}

variable "s3_bucket_name" {
  type = string
}

variable "s3_bucket_region" {
  type = string
}

variable "s3_access_key_id" {
  type      = string
  sensitive = true
}

variable "s3_secret_access_key" {
  type      = string
  sensitive = true
}

variable "smtp_host" {
  type        = string
  default     = ""
  description = "Left blank until a real transactional-email vendor is chosen — see DEPLOYMENT_READINESS_CHECKLIST.md. The app degrades gracefully (no emails sent, no crash) when this is blank."
}

variable "smtp_user" {
  type      = string
  default   = ""
  sensitive = true
}

variable "smtp_password" {
  type      = string
  default   = ""
  sensitive = true
}

variable "sentry_dsn" {
  type        = string
  default     = ""
  description = "Left blank until a real Sentry project exists. The app degrades gracefully (no error reporting, no crash) when this is blank."
}

variable "tags" {
  type    = map(string)
  default = {}
}
