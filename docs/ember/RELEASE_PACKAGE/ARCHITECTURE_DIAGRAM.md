# Ember — Architecture Diagram

Full narrative and design rationale: `../ARCHITECTURE.md`. This is the same system,
visually — module list and request flow taken directly from `backend/src/app.module.ts`
and each feature module's actual imports, not idealized.

## Module structure

```mermaid
graph TB
    subgraph "Cross-cutting (global)"
        Config[ConfigModule<br/>env validation]
        Logger[LoggerModule<br/>pino structured logging]
        Observability[ObservabilityModule<br/>metrics + Sentry]
        Redis[RedisModule<br/>optional, enables distributed features]
        Queue[QueueModule<br/>BullMQ or in-process fallback]
        Throttler[ThrottlerModule<br/>Redis-backed when configured]
        Prisma[PrismaModule<br/>PostgreSQL client]
        Audit[AuditModule<br/>append-only action log]
        Integrations[IntegrationsModule<br/>email/storage adapters +<br/>6 NotConfigured stubs]
    end

    subgraph "Feature modules"
        Auth[AuthModule]
        Users[UsersModule]
        Profiles[ProfilesModule]
        Safety[SafetyModule<br/>reports/blocks/moderation]
        Matching[MatchingModule]
        Messaging[MessagingModule]
        Health[HealthModule]
    end

    Auth --> Prisma
    Auth --> Redis
    Auth --> Audit
    Auth --> Integrations
    Profiles --> Prisma
    Profiles --> Integrations
    Matching --> Prisma
    Matching --> Audit
    Matching --> Safety
    Matching --> Integrations
    Messaging --> Prisma
    Messaging --> Safety
    Safety --> Prisma
    Safety --> Audit
    Health --> Prisma
    Health --> Redis
```

## Request flow

```mermaid
sequenceDiagram
    participant Client
    participant ALB as Load Balancer
    participant Guard as JwtAuthGuard + PermissionsGuard
    participant Controller
    participant Service
    participant Prisma as PrismaService
    participant DB as PostgreSQL
    participant KV as Redis (rate limit / lockout / blacklist)

    Client->>ALB: HTTPS request + Bearer token
    ALB->>Guard: forward
    Guard->>KV: check throttle + token blacklist
    Guard->>DB: live user status + permission check
    Guard->>Controller: authorized request
    Controller->>Service: business logic
    Service->>Prisma: query/mutate
    Prisma->>DB: SQL
    Service-->>Controller: result
    Controller-->>Client: JSON response + requestId
```

## Key design decisions this diagram encodes

- **Every route is protected by default** (`JwtAuthGuard` applied globally) — a route must
  opt out with `@Public()`, not opt in to protection.
- **Redis is optional** — every Redis-dependent feature (distributed throttling, account
  lockout, token blacklist, BullMQ queues) has a documented, tested fallback (in-memory /
  in-process) when `REDIS_URL` is unset, appropriate for local dev/CI, not production.
- **Six integration points are deliberate stubs** (`NotConfigured*Provider` for payments,
  SMS, identity verification, AI, push notifications, analytics) — the pattern is
  consistent and documented, not accidental gaps. Email and object storage are the two that
  graduated to real, tested adapters.
- **No feature module talks to another feature module's database tables directly** — cross-
  module interaction goes through the other module's service (e.g. `MatchingModule` calls
  `SafetyModule`'s `BlocksService`, not the `blocks` table directly).
