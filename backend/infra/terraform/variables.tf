variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "environment" {
  type    = string
  default = "production"
}

variable "name_prefix" {
  type        = string
  default     = "ember-production"
  description = "Prefix applied to every resource name/tag."
}

variable "container_image" {
  type        = string
  description = "Full image reference published by .github/workflows/backend-deploy.yml, e.g. ghcr.io/<org>/<repo>/ember-backend:<sha>. No default — nothing is published until that workflow has run at least once."
}

variable "cors_origin" {
  type        = string
  description = "Real frontend origin(s), comma-separated."
}

variable "frontend_base_url" {
  type        = string
  description = "Real frontend base URL, used to build links in transactional emails."
}

variable "s3_allowed_upload_origins" {
  type        = list(string)
  description = "Origins allowed to PUT directly to presigned photo-upload URLs — normally the same value as cors_origin, split into a list."
}

# --- Optional integrations — every one of these defaults to blank/false, matching the
# app's own graceful-degradation behavior (see src/config/configuration.ts) when a real
# vendor hasn't been chosen yet. Filling these in is what actually turns email/error-
# tracking on; see DEPLOYMENT_READINESS_CHECKLIST.md. ---

variable "smtp_host" {
  type    = string
  default = ""
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
  type    = string
  default = ""
}

# --- Domain/DNS — entirely optional; the ALB works over plain HTTP on its own AWS-assigned
# DNS name without any of this. Set enable_dns=true only once a real domain is owned. ---

variable "enable_dns" {
  type    = bool
  default = false
}

variable "domain_name" {
  type    = string
  default = null
}

variable "api_subdomain" {
  type    = string
  default = "api"
}

variable "create_hosted_zone" {
  type    = bool
  default = false
}

# --- Sizing / scaling — deliberately small, pre-alpha-appropriate defaults. See
# ARCHITECTURE.md §2: don't provision for load that doesn't exist yet. ---

variable "db_instance_class" {
  type    = string
  default = "db.t4g.micro"
}

variable "db_multi_az" {
  type    = bool
  default = false
}

variable "redis_node_type" {
  type    = string
  default = "cache.t4g.micro"
}

variable "ecs_task_cpu" {
  type    = number
  default = 512
}

variable "ecs_task_memory" {
  type    = number
  default = 1024
}

variable "ecs_desired_count" {
  type    = number
  default = 1
}

variable "enable_autoscaling" {
  type    = bool
  default = false
}
