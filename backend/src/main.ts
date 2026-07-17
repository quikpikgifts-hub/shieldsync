import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { configureApp } from "./configure-app";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  // Without this, SIGTERM (e.g. a container orchestrator stopping the pod) skips every
  // OnModuleDestroy hook — including PrismaService's $disconnect() — leaving connections
  // open until the process is killed outright instead of shutting down cleanly.
  app.enableShutdownHooks();
  const appConfig = configureApp(app);
  await app.listen(appConfig.port);
  // eslint-disable-next-line no-console
  console.log(`Ember API listening on port ${appConfig.port}`);
}

bootstrap();
