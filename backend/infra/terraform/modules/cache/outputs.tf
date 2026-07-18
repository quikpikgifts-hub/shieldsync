output "primary_endpoint" {
  value = aws_elasticache_replication_group.this.primary_endpoint_address
}

output "port" {
  value = aws_elasticache_replication_group.this.port
}

output "auth_token" {
  value     = random_password.auth_token.result
  sensitive = true
}

output "connection_string" {
  description = "Full REDIS_URL, matching this app's expected format (src/config/configuration.ts). Uses rediss:// (TLS) since transit_encryption_enabled=true — ioredis enables TLS automatically for this scheme, no app-side config needed."
  value       = "rediss://:${random_password.auth_token.result}@${aws_elasticache_replication_group.this.primary_endpoint_address}:${aws_elasticache_replication_group.this.port}/0"
  sensitive   = true
}
