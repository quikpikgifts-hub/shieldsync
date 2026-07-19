# Ember — Infrastructure Diagram

The AWS topology `infra/terraform/` describes — **infrastructure as code complete, never
applied to a real account** (see `../PRODUCTION_READINESS_REPORT.md`). Every resource named
below corresponds to a real Terraform resource, reviewed in `../TERRAFORM_READINESS.md` —
this is not an idealized/aspirational diagram.

```mermaid
graph TB
    Internet((Internet))
    Internet -->|443/80| ALB[Application Load Balancer<br/>public subnets]

    subgraph "VPC 10.20.0.0/16"
        subgraph "Public subnets (2 AZs)"
            ALB
            NAT1[NAT Gateway AZ-1]
            NAT2[NAT Gateway AZ-2]
        end

        subgraph "Private subnets (2 AZs)"
            ECS[ECS Fargate Service<br/>1 task by default]
            RDS[(RDS PostgreSQL 16<br/>db.t4g.micro, single-AZ default)]
            Redis[(ElastiCache Redis 7<br/>cache.t4g.micro, single-node default)]
        end
    end

    ALB -->|app port, SG-scoped| ECS
    ECS -->|5432, SG-scoped| RDS
    ECS -->|6379, SG-scoped| Redis
    ECS -->|outbound via NAT| NAT1
    ECS -->|outbound via NAT| NAT2

    ECS -.->|pulls image| GHCR[GitHub Container Registry]
    ECS -.->|reads secrets| SM[Secrets Manager]
    ECS -.->|PutObject/GetObject| S3[(S3 Bucket<br/>photos, versioned, encrypted)]
    ECS -.->|SMTP| Email[Email vendor<br/>not yet chosen]
    ECS -.->|writes| CW[CloudWatch Logs<br/>no alarms yet]
    ECS -.->|errors| Sentry[Sentry<br/>not yet configured]

    DNS[Route53 + ACM<br/>optional, enable_dns=true] -.->|alias| ALB

    style RDS fill:#3d3d3d,color:#fff
    style Redis fill:#3d3d3d,color:#fff
    style S3 fill:#3d3d3d,color:#fff
    style GHCR fill:#2d2d2d,color:#fff,stroke-dasharray: 5 5
    style Email fill:#2d2d2d,color:#fff,stroke-dasharray: 5 5
    style Sentry fill:#2d2d2d,color:#fff,stroke-dasharray: 5 5
    style DNS fill:#2d2d2d,color:#fff,stroke-dasharray: 5 5
```

Dashed boxes are either external services (GHCR, an email vendor) or optional/not-yet-real
components (Sentry, Route53/ACM) — solid boxes are what Terraform actually provisions
inside the AWS account.

## Security boundary summary

- The internet can reach **only** the ALB (port 80/443).
- The ECS service can be reached **only** from the ALB.
- RDS and Redis can be reached **only** from the ECS service — never directly from the
  internet, never from each other.
- Outbound internet access from the private subnets (image pulls, SMTP, S3, Sentry) goes
  through the NAT gateways — the ECS tasks themselves have no public IP.

## What's not yet real

- No CloudWatch alarms exist on any of this (logs are collected; nothing alerts on them —
  `../TERRAFORM_READINESS.md`'s top finding).
- No GitHub OIDC deploy role exists yet to let CI actually update the ECS service.
- The GHCR image pull requires either a public package or repository credentials not yet
  configured on the task definition.
- None of the above has ever been applied — this diagram describes a plan, not a deployed
  system. See `../PRODUCTION_READINESS_REPORT.md` for the explicit deployment status.
