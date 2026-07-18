variable "name_prefix" {
  type = string
}

variable "private_subnet_ids" {
  type        = list(string)
  description = "Private subnet IDs from the networking module — RDS is never placed in a public subnet."
}

variable "database_security_group_id" {
  type = string
}

variable "database_name" {
  type    = string
  default = "ember_production"
}

variable "master_username" {
  type    = string
  default = "ember_admin"
}

variable "instance_class" {
  type        = string
  default     = "db.t4g.micro"
  description = "Starting size for a pre-alpha cohort — see the comment in main.tf. Resize once real load data exists."
}

variable "allocated_storage_gb" {
  type    = number
  default = 20
}

variable "max_allocated_storage_gb" {
  type        = number
  default     = 100
  description = "Ceiling for RDS storage autoscaling."
}

variable "multi_az" {
  type        = bool
  default     = false
  description = "Single-AZ by default for a pre-alpha cohort (cost). Set true once uptime SLA commitments exist."
}

variable "backup_retention_days" {
  type    = number
  default = 7
}

variable "deletion_protection" {
  type        = bool
  default     = true
  description = "When true, also forces a final snapshot on destroy instead of skipping it — a real production database should never default to \"skip the final snapshot.\""
}

variable "tags" {
  type    = map(string)
  default = {}
}
