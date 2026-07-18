locals {
  tags = {
    App = "ember-backend"
  }
}

module "networking" {
  source      = "./modules/networking"
  name_prefix = var.name_prefix
  tags        = local.tags
}

module "database" {
  source                     = "./modules/database"
  name_prefix                = var.name_prefix
  private_subnet_ids         = module.networking.private_subnet_ids
  database_security_group_id = module.networking.database_security_group_id
  instance_class             = var.db_instance_class
  multi_az                   = var.db_multi_az
  tags                       = local.tags
}

module "cache" {
  source                  = "./modules/cache"
  name_prefix             = var.name_prefix
  private_subnet_ids      = module.networking.private_subnet_ids
  cache_security_group_id = module.networking.cache_security_group_id
  node_type               = var.redis_node_type
  tags                    = local.tags
}

module "storage" {
  source                 = "./modules/storage"
  name_prefix            = var.name_prefix
  allowed_upload_origins = var.s3_allowed_upload_origins
  tags                   = local.tags
}

module "secrets" {
  source               = "./modules/secrets"
  name_prefix          = var.name_prefix
  database_url         = module.database.connection_string
  redis_url            = module.cache.connection_string
  s3_bucket_name       = module.storage.bucket_name
  s3_bucket_region     = module.storage.bucket_region
  s3_access_key_id     = module.storage.access_key_id
  s3_secret_access_key = module.storage.secret_access_key
  smtp_host            = var.smtp_host
  smtp_user            = var.smtp_user
  smtp_password        = var.smtp_password
  sentry_dsn           = var.sentry_dsn
  tags                 = local.tags
}

module "ecs" {
  source                        = "./modules/ecs"
  name_prefix                   = var.name_prefix
  aws_region                    = var.aws_region
  vpc_id                        = module.networking.vpc_id
  public_subnet_ids             = module.networking.public_subnet_ids
  private_subnet_ids            = module.networking.private_subnet_ids
  alb_security_group_id         = module.networking.alb_security_group_id
  ecs_service_security_group_id = module.networking.ecs_service_security_group_id
  secrets_manager_secret_arn    = module.secrets.secret_arn
  container_image               = var.container_image
  cors_origin                   = var.cors_origin
  frontend_base_url             = var.frontend_base_url
  acm_certificate_arn           = var.enable_dns ? module.dns[0].certificate_arn : null
  task_cpu                      = var.ecs_task_cpu
  task_memory                   = var.ecs_task_memory
  desired_count                 = var.ecs_desired_count
  enable_autoscaling            = var.enable_autoscaling
  tags                          = local.tags
}

module "dns" {
  count              = var.enable_dns ? 1 : 0
  source             = "./modules/dns"
  domain_name        = var.domain_name
  create_hosted_zone = var.create_hosted_zone
  tags               = local.tags
}
