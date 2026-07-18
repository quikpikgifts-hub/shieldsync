output "alb_dns_name" {
  description = "Point a CNAME here if not using enable_dns/Route53. Also usable directly (over plain HTTP) for a first smoke test."
  value       = module.ecs.alb_dns_name
}

output "api_url" {
  description = "The real HTTPS URL once enable_dns=true and a certificate has validated; null otherwise."
  value       = var.enable_dns ? "https://${var.api_subdomain}.${var.domain_name}" : null
}

output "database_endpoint" {
  value = module.database.endpoint
}

output "redis_endpoint" {
  value = module.cache.primary_endpoint
}

output "s3_bucket_name" {
  value = module.storage.bucket_name
}

output "secrets_manager_secret_name" {
  description = "Where DATABASE_URL/REDIS_URL/JWT_ACCESS_SECRET/etc. actually live — see OPERATOR_RUNBOOK.md for how to read/rotate them."
  value       = module.secrets.secret_name
}

output "ecs_cluster_name" {
  value = module.ecs.cluster_name
}

output "ecs_service_name" {
  value = module.ecs.service_name
}

output "cloudwatch_log_group" {
  value = module.ecs.log_group_name
}

output "route53_name_servers" {
  description = "If create_hosted_zone=true, point the domain registrar's nameservers at these (manual step, outside Terraform's reach)."
  value       = var.enable_dns ? module.dns[0].name_servers : null
}
