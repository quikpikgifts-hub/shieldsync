import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { configureApp } from "./configure-app";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const appConfig = configureApp(app);
  await app.listen(appConfig.port);
  // eslint-disable-next-line no-console
  console.log(`Ember API listening on port ${appConfig.port}`);
}

bootstrap();
