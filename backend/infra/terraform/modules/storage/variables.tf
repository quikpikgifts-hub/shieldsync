variable "name_prefix" {
  type = string
}

variable "allowed_upload_origins" {
  type        = list(string)
  description = "Origins allowed to PUT directly to presigned upload URLs — should match CORS_ORIGIN in the app's own config (the frontend's real domain(s))."
}

variable "tags" {
  type    = map(string)
  default = {}
}
