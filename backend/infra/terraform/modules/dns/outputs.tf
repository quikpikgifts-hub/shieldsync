output "certificate_arn" {
  value = aws_acm_certificate_validation.this.certificate_arn
}

output "zone_id" {
  value = local.zone_id
}

output "name_servers" {
  description = "If create_hosted_zone=true, point the domain registrar's nameservers at these — a manual step Terraform cannot perform for you (it doesn't own the registrar account)."
  value       = var.create_hosted_zone ? aws_route53_zone.this[0].name_servers : null
}
