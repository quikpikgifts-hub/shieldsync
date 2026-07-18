resource "aws_ecs_cluster" "this" {
  name = "${var.name_prefix}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = var.tags
}

resource "aws_cloudwatch_log_group" "app" {
  name              = "/ecs/${var.name_prefix}"
  retention_in_days = var.log_retention_days
  tags              = var.tags
}

# --- IAM ---

data "aws_iam_policy_document" "ecs_assume" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

# Execution role: what ECS itself uses to pull the image and inject secrets — never used
# by application code at runtime.
resource "aws_iam_role" "execution" {
  name               = "${var.name_prefix}-ecs-execution"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume.json
  tags               = var.tags
}

resource "aws_iam_role_policy_attachment" "execution_managed" {
  role       = aws_iam_role.execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

data "aws_iam_policy_document" "execution_secrets" {
  statement {
    effect    = "Allow"
    actions   = ["secretsmanager:GetSecretValue"]
    resources = [var.secrets_manager_secret_arn]
  }
}

resource "aws_iam_role_policy" "execution_secrets" {
  name   = "${var.name_prefix}-ecs-execution-secrets"
  role   = aws_iam_role.execution.id
  policy = data.aws_iam_policy_document.execution_secrets.json
}

# Task role: what the running application itself assumes. Empty today — the app
# authenticates to S3 with static IAM-user credentials (modules/storage), not the task
# role, and every other integration is either unconfigured or credential-based (SMTP,
# Sentry) rather than IAM-based. Kept as a distinct, existing role (not omitted) so
# switching S3 access to task-role-based IAM (a strict security improvement — no static
# keys) later is a policy attachment here, not a new resource.
resource "aws_iam_role" "task" {
  name               = "${var.name_prefix}-ecs-task"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume.json
  tags               = var.tags
}

# --- Task definition ---

locals {
  secret_env_names = [
    "DATABASE_URL", "REDIS_URL", "JWT_ACCESS_SECRET",
    "S3_BUCKET", "S3_REGION", "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY",
    "SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD", "SENTRY_DSN",
  ]
}

resource "aws_ecs_task_definition" "app" {
  family                   = var.name_prefix
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.task_cpu
  memory                   = var.task_memory
  execution_role_arn       = aws_iam_role.execution.arn
  task_role_arn            = aws_iam_role.task.arn

  container_definitions = jsonencode([
    {
      name      = "api"
      image     = var.container_image # e.g. ghcr.io/<org>/<repo>/ember-backend:<sha> — see .github/workflows/backend-deploy.yml
      essential = true
      portMappings = [
        { containerPort = var.app_port, protocol = "tcp" }
      ]
      environment = [
        { name = "NODE_ENV", value = "production" },
        { name = "PORT", value = tostring(var.app_port) },
        { name = "CORS_ORIGIN", value = var.cors_origin },
        { name = "FRONTEND_BASE_URL", value = var.frontend_base_url },
      ]
      secrets = [
        for name in local.secret_env_names : {
          name      = name
          valueFrom = "${var.secrets_manager_secret_arn}:${name}::"
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.app.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "api"
        }
      }
      healthCheck = {
        # Matches the Dockerfile's own HEALTHCHECK — liveness only, no dependency checks.
        command     = ["CMD-SHELL", "node -e \"fetch('http://127.0.0.1:${var.app_port}/live').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))\""]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 30
      }
    }
  ])

  tags = var.tags
}

# --- Load balancer ---

resource "aws_lb" "this" {
  name               = "${var.name_prefix}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [var.alb_security_group_id]
  subnets            = var.public_subnet_ids

  tags = var.tags
}

resource "aws_lb_target_group" "app" {
  name        = "${var.name_prefix}-tg"
  port        = var.app_port
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip" # required for awsvpc network mode (Fargate)

  health_check {
    # /ready (not /live) — a target that can't reach Postgres/Redis shouldn't receive
    # traffic even though the process itself is up. See src/health/health.controller.ts.
    path                = "/ready"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    interval            = 15
    timeout             = 5
    matcher             = "200"
  }

  tags = var.tags
}

resource "aws_lb_listener" "https" {
  count             = var.acm_certificate_arn != null ? 1 : 0
  load_balancer_arn = aws_lb.this.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = var.acm_certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.this.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    # Redirects to HTTPS once a certificate exists; forwards directly to the app
    # otherwise (e.g. a first smoke-test deploy before DNS/ACM are set up) — see
    # DEPLOYMENT_READINESS_CHECKLIST.md's SSL/TLS section.
    type = var.acm_certificate_arn != null ? "redirect" : "forward"

    dynamic "redirect" {
      for_each = var.acm_certificate_arn != null ? [1] : []
      content {
        port        = "443"
        protocol    = "HTTPS"
        status_code = "HTTP_301"
      }
    }

    target_group_arn = var.acm_certificate_arn != null ? null : aws_lb_target_group.app.arn
  }
}

# --- Service ---

resource "aws_ecs_service" "app" {
  name            = var.name_prefix
  cluster         = aws_ecs_cluster.this.id
  task_definition = aws_ecs_task_definition.app.arn
  launch_type     = "FARGATE"

  # 1 by default — see docker-compose.prod.yml's identical note: raising this is safe from
  # a rate-limiting/session standpoint (Redis-backed storage already handles it correctly)
  # but revisit connection-pool sizing (PRODUCTION_READINESS.md) before doing so.
  desired_count = var.desired_count

  network_configuration {
    subnets         = var.private_subnet_ids
    security_groups = [var.ecs_service_security_group_id]
    # No public IP — the service is only reachable through the ALB, which sits in the
    # public subnets; the service itself lives in private subnets and reaches the internet
    # (image pulls, SMTP/S3/Sentry calls) via the NAT gateways from modules/networking.
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name   = "api"
    container_port   = var.app_port
  }

  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200

  # Gives in-flight requests and BullMQ job handlers time to finish on deploy/scale-down —
  # matches app.enableShutdownHooks() in src/main.ts, which needs SIGTERM to actually reach
  # the process for graceful shutdown to run at all.
  health_check_grace_period_seconds = 30

  tags = var.tags

  depends_on = [aws_lb_listener.http]

  lifecycle {
    # The real deploy path (backend-deploy.yml) updates the running task's image via
    # `aws ecs update-service --force-new-deployment` after pushing a new tag, not via
    # `terraform apply` — Terraform owns the service's *shape* (count, networking,
    # resources), not which image tag is currently running.
    ignore_changes = [task_definition]
  }
}

resource "aws_appautoscaling_target" "ecs" {
  count              = var.enable_autoscaling ? 1 : 0
  max_capacity       = var.autoscaling_max_capacity
  min_capacity       = var.desired_count
  resource_id        = "service/${aws_ecs_cluster.this.name}/${aws_ecs_service.app.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "cpu" {
  count              = var.enable_autoscaling ? 1 : 0
  name               = "${var.name_prefix}-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs[0].resource_id
  scalable_dimension = aws_appautoscaling_target.ecs[0].scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs[0].service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value = 70
  }
}
