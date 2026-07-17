import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { LoggerModule as PinoLoggerModule } from "nestjs-pino";
import { randomUUID } from "node:crypto";
import type { IncomingMessage } from "node:http";
import type { AppConfig } from "../config/configuration";

@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const logLevel = configService.getOrThrow<AppConfig["logLevel"]>("app.logLevel");
        return {
          pinoHttp: {
            level: logLevel,
            // Reuses whatever configure-app.ts's own request-id middleware already
            // assigned to `req.id` (it runs first and is the source of truth for the
            // X-Request-Id response header and AllExceptionsFilter's error body), falling
            // back to generating one only if that middleware somehow didn't run — so logs
            // and the client-visible ID never disagree.
            genReqId: (req: IncomingMessage) =>
              (req as IncomingMessage & { id?: string }).id ||
              (req.headers["x-request-id"] as string) ||
              randomUUID(),
            // Never let credentials or tokens end up in a log line, structured or not.
            redact: {
              paths: [
                "req.headers.authorization",
                "req.headers.cookie",
                'req.body.password',
                'req.body.newPassword',
                'req.body.refreshToken',
              ],
              censor: "[redacted]",
            },
            // Health-check probes fire every few seconds and add nothing but noise to logs.
            autoLogging: {
              ignore: (req: IncomingMessage) => ["/live", "/ready", "/health", "/metrics"].includes(req.url ?? ""),
            },
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  exports: [PinoLoggerModule],
})
export class LoggerModule {}
