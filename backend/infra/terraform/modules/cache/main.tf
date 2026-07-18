resource "aws_elasticache_subnet_group" "this" {
  name       = "${var.name_prefix}-cache"
  subnet_ids = var.private_subnet_ids
}

resource "random_password" "auth_token" {
  length  = 40
  special = false # ElastiCache AUTH tokens disallow certain special characters; keep it simple and long instead
}

# A replication group (not a bare cache cluster) even at 1 node — this is what lets
# `num_cache_clusters` be raised later (e.g. to 2 for a read replica, or to enable
# Multi-AZ automatic failover) without recreating the resource from scratch.
resource "aws_elasticache_replication_group" "this" {
  replication_group_id = "${var.name_prefix}-redis"
  description          = "Ember backend — distributed rate limiting, account lockout, token blacklist, BullMQ job queue"

  engine         = "redis"
  engine_version = "7.1"
  node_type      = var.node_type
  port           = 6379

  num_cache_clusters         = var.num_cache_clusters
  automatic_failover_enabled = var.num_cache_clusters > 1
  multi_az_enabled           = var.num_cache_clusters > 1

  subnet_group_name  = aws_elasticache_subnet_group.this.name
  security_group_ids = [var.cache_security_group_id]

  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token                 = random_password.auth_token.result

  snapshot_retention_limit = var.snapshot_retention_days
  snapshot_window          = "03:00-04:00"
  maintenance_window       = "mon:04:30-mon:05:30"

  tags = merge(var.tags, { Name = "${var.name_prefix}-redis" })
}
