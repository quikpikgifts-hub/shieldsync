# Entirely optional and not wired into the root module by default (see
# infra/terraform/main.tf) — using it requires a domain the AWS account actually owns
# (either registered through Route53 or with its authoritative nameservers pointed at a
# Route53 hosted zone). Neither exists yet; see DEPLOYMENT_READINESS_CHECKLIST.md's
# Domain/DNS section for who owns making that decision.

resource "aws_route53_zone" "this" {
  count = var.create_hosted_zone ? 1 : 0
  name  = var.domain_name
  tags  = var.tags
}

data "aws_route53_zone" "existing" {
  count = var.create_hosted_zone ? 0 : 1
  name  = var.domain_name
}

locals {
  zone_id = var.create_hosted_zone ? aws_route53_zone.this[0].zone_id : data.aws_route53_zone.existing[0].zone_id
}

resource "aws_acm_certificate" "this" {
  domain_name               = var.domain_name
  validation_method         = "DNS"
  subject_alternative_names = var.subject_alternative_names

  lifecycle {
    create_before_destroy = true
  }

  tags = var.tags
}

resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.this.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  zone_id = local.zone_id
  name    = each.value.name
  type    = each.value.type
  records = [each.value.record]
  ttl     = 60
}

resource "aws_acm_certificate_validation" "this" {
  certificate_arn         = aws_acm_certificate.this.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}

# The "alias this subdomain to the ALB" record deliberately lives in the *root* module
# (infra/terraform/dns_record.tf), not here — this module's certificate_arn output feeds
# into modules/ecs (for the HTTPS listener), and the alias record needs modules/ecs's ALB
# output. Both directions in the same module would be a dependency cycle; splitting them
# across the root module (which can see both) is what breaks it.
