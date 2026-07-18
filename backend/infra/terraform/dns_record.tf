# Split out from modules/dns to avoid a dependency cycle — see the comment in
# modules/dns/main.tf. Only created when var.enable_dns is true (a real domain exists).

resource "aws_route53_record" "api" {
  count   = var.enable_dns ? 1 : 0
  zone_id = module.dns[0].zone_id
  name    = var.api_subdomain
  type    = "A"

  alias {
    name                   = module.ecs.alb_dns_name
    zone_id                = module.ecs.alb_zone_id
    evaluate_target_health = true
  }
}
