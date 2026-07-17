import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import configuration from "./config/configuration";
import { validationSchema } from "./config/validation.schema";
import { PrismaModule } from "./prisma/prisma.module";
import { AuditModule } from "./audit/audit.module";
import { IntegrationsModule } from "./integrations/integrations.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { ProfilesModule } from "./profiles/profiles.module";
import { SafetyModule } from "./safety/safety.module";
import { MatchingModule } from "./matching/matching.module";
import { MessagingModule } from "./messaging/messaging.module";
import { JwtAuthGuard } from "./auth/guards/jwt-auth.guard";
import { RolesGuard } from "./common/guards/roles.guard";
import { PermissionsGuard } from "./common/guards/permissions.guard";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration], validationSchema }),
    ThrottlerModule.forRootAsync({
      useFactory: () => ({
        throttlers: [
          {
            ttl: parseInt(process.env.THROTTLE_TTL_MS ?? "60000", 10),
            limit: parseInt(process.env.THROTTLE_LIMIT ?? "100", 10),
          },
        ],
      }),
    }),
    PrismaModule,
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
    // Order matters: JWT auth establishes `request.user` first, then role/permission
    // checks can rely on it being present.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
