variable "domain_name" {
  type        = string
  description = "Root domain, e.g. \"example.com\". No default — must be a domain the operator actually owns."
}

variable "api_subdomain" {
  type        = string
  default     = "api"
  description = "Subdomain the ALB is aliased to, e.g. \"api\" for api.example.com."
}

variable "create_hosted_zone" {
  type        = bool
  default     = false
  description = "True if Route53 should own this domain's DNS (and the registrar's nameservers need pointing at the zone's — a manual step outside Terraform). False to use an existing hosted zone already in this AWS account."
}

variable "subject_alternative_names" {
  type    = list(string)
  default = []
}

variable "tags" {
  type    = map(string)
  default = {}
}
