variable "name_prefix" {
  type        = string
  description = "Prefix applied to every resource name/tag in this module, e.g. \"ember-production\"."
}

variable "vpc_cidr" {
  type        = string
  description = "CIDR block for the VPC. Sized /16 by default; subnets below carve /20s out of it."
  default     = "10.20.0.0/16"
}

variable "app_port" {
  type        = number
  description = "Port the backend container listens on (must match PORT in the app's own config)."
  default     = 3001
}

variable "tags" {
  type        = map(string)
  description = "Tags applied to every resource this module creates."
  default     = {}
}
