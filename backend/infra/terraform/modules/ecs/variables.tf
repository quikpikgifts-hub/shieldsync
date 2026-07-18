variable "name_prefix" {
  type = string
}

variable "aws_region" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "public_subnet_ids" {
  type = list(string)
}

variable "private_subnet_ids" {
  type = list(string)
}

variable "alb_security_group_id" {
  type = string
}

variable "ecs_service_security_group_id" {
  type = string
}

variable "secrets_manager_secret_arn" {
  type = string
}

variable "container_image" {
  type        = string
  description = "Full image reference, e.g. ghcr.io/<org>/<repo>/ember-backend:<tag>. No default — there is no image published anywhere until backend-deploy.yml runs for the first time."
}

variable "app_port" {
  type    = number
  default = 3001
}

variable "cors_origin" {
  type        = string
  description = "Real frontend origin(s), comma-separated — matches CORS_ORIGIN's expected format."
}

variable "frontend_base_url" {
  type        = string
  description = "Real frontend base URL — used to build links in transactional emails."
}

variable "acm_certificate_arn" {
  type        = string
  default     = null
  description = "ARN of a validated ACM certificate for the real domain. Null until DNS/domain ownership is settled — see modules/dns and DEPLOYMENT_READINESS_CHECKLIST.md. The ALB serves plain HTTP only until this is set."
}

variable "task_cpu" {
  type        = number
  default     = 512
  description = "Fargate task CPU units (1024 = 1 vCPU). 512 is a pre-alpha starting point."
}

variable "task_memory" {
  type    = number
  default = 1024
}

variable "desired_count" {
  type        = number
  default     = 1
  description = "See the note in main.tf's aws_ecs_service resource before raising this."
}

variable "enable_autoscaling" {
  type        = bool
  default     = false
  description = "Off by default — see ARCHITECTURE.md §2 on not building for scale that doesn't exist yet. Turn on once there's real traffic data to size min/max around."
}

variable "autoscaling_max_capacity" {
  type    = number
  default = 3
}

variable "log_retention_days" {
  type    = number
  default = 30
}

variable "tags" {
  type    = map(string)
  default = {}
}
