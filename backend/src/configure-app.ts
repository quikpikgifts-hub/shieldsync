import { INestApplication, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import type { AppConfig } from "./config/configuration";

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
  app.enableCors({ origin: appConfig.corsOrigin, credentials: true });

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
