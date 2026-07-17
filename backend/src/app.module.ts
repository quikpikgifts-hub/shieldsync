import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import type Redis from "ioredis";
import configuration from "./config/configuration";
import { validationSchema } from "./config/validation.schema";
import { PrismaModule } from "./prisma/prisma.module";
import { HealthModule } from "./health/health.module";
import { LoggerModule } from "./observability/logger.module";
import { ObservabilityModule } from "./observability/observability.module";
import { AuditModule } from "./audit/audit.module";
import { IntegrationsModule } from "./integrations/integrations.module";
import { RedisModule, REDIS_CLIENT } from "./redis/redis.module";
import { QueueModule } from "./queue/queue.module";
import { RedisThrottlerStorage } from "./common/throttler/redis-throttler-storage";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { ProfilesModule } from "./profiles/profiles.module";
import { SafetyModule } from "./safety/safety.module";
import { MatchingModule } from "./matching/matching.module";
import { MessagingModule } from "./messaging/messaging.module";
import { JwtAuthGuard } from "./auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "./common/guards/permissions.guard";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration], validationSchema }),
    LoggerModule,
    ObservabilityModule,
    RedisModule,
    QueueModule,
    ThrottlerModule.forRootAsync({
      // Redis-backed storage when REDIS_URL is configured (correct under multiple app
      // instances — see SECURITY_AUDIT.md H-3); falls back to @nestjs/throttler's own
      // in-memory storage (by omitting `storage` entirely) otherwise, exactly as before.
      useFactory: (client: Redis | null) => ({
        storage: client ? new RedisThrottlerStorage(client) : undefined,
        throttlers: [
          {
            ttl: parseInt(process.env.THROTTLE_TTL_MS ?? "60000", 10),
            limit: parseInt(process.env.THROTTLE_LIMIT ?? "100", 10),
          },
        ],
      }),
      inject: [REDIS_CLIENT],
    }),
    PrismaModule,
    HealthModule,
    AuditModule,
    IntegrationsModule,
    AuthModule,
    UsersModule,
    ProfilesModule,
    SafetyModule,
    MatchingModule,
    MessagingModule,
  ],
  providers: [
    // Order matters: JWT auth establishes `request.user` first, then permission checks
    // can rely on it being present. RolesGuard/@Roles() were removed (never used by any
    // controller, and would have trusted the JWT's `roles` claim instead of a live DB
    // read like PermissionsGuard does) — see SECURITY_AUDIT.md.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
