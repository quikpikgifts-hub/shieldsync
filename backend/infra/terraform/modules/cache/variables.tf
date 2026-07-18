variable "name_prefix" {
  type = string
}

variable "private_subnet_ids" {
  type = list(string)
}

variable "cache_security_group_id" {
  type = string
}

variable "node_type" {
  type        = string
  default     = "cache.t4g.micro"
  description = "Starting size for a pre-alpha cohort — resize once real load data exists."
}

variable "num_cache_clusters" {
  type        = number
  default     = 1
  description = "1 = single node, no automatic failover (cost-optimized for pre-alpha). Raise to 2+ once uptime SLA commitments exist — this also turns on Multi-AZ automatic failover."
}

variable "snapshot_retention_days" {
  type    = number
  default = 3
}

variable "tags" {
  type    = map(string)
  default = {}
}
