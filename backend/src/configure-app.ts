import { INestApplication, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import type { AppConfig } from "./config/configuration";
import { MetricsService } from "./observability/metrics.service";
import { createHttpMetricsMiddleware } from "./observability/http-metrics.middleware";

/**
 * Shared between main.ts (real bootstrap) and e2e tests, so a test that passes is
 * actually exercising the same helmet/CORS/validation/Swagger configuration that runs
 * in production — not a divergent, lighter-weight test setup that could pass while the
 * real app behaves differently.
 */
export function configureApp(app: INestApplication): AppConfig {
  const configService = app.get(ConfigService);
  const appConfig = configService.getOrThrow<AppConfig>("app");

  app.use(helmet());
  app.enableCors({ origin: appConfig.corsOrigins, credentials: true });

  // Assigns the per-request correlation ID up front — reusing an upstream-supplied
  // X-Request-Id when present, generating one otherwise — and echoes it back to the
  // caller immediately, rather than depending on exactly when pino-http's own
  // module-registered middleware (observability/logger.module.ts) attaches relative to
  // this one. `genReqId` there reuses this same value when it's already set, so logs and
  // the response header/error body always agree on one ID, regardless of middleware
  // ordering.
  app.use((req: Request & { id?: string }, res: Response, next: NextFunction) => {
    const requestId = (req.headers["x-request-id"] as string) || randomUUID();
    req.id = requestId;
    res.setHeader("X-Request-Id", requestId);
    next();
  });

  app.use(createHttpMetricsMiddleware(app.get(MetricsService)));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  if (appConfig.nodeEnv !== "production") {
    const swaggerConfig = new DocumentBuilder()
      .setTitle("Ember API")
      .setDescription("Ember backend — see docs/ember/API.md for the narrative overview.")
      .setVersion("0.1.0")
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup("docs", app, document);
  }

  return appConfig;
}
