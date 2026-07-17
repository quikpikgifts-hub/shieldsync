import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { Logger } from "nestjs-pino";
import { AppModule } from "./app.module";
import { configureApp } from "./configure-app";
import configuration from "./config/configuration";
import { initSentry } from "./observability/sentry";

async function bootstrap(): Promise<void> {
  // Sentry must be initialized before anything else can throw — reads config directly
  // (configuration() is a plain function, no DI container needed yet at this point).
  initSentry(configuration().app);

  // bufferLogs holds every log line Nest emits during bootstrap until the real pino
  // logger (registered below) is ready, instead of losing them to the default console
  // logger and then immediately swapping loggers.
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  // Without this, SIGTERM (e.g. a container orchestrator stopping the pod) skips every
  // OnModuleDestroy hook — including PrismaService's $disconnect() — leaving connections
  // open until the process is killed outright instead of shutting down cleanly.
  app.enableShutdownHooks();
  const appConfig = configureApp(app);
  await app.listen(appConfig.port);
}

bootstrap();
