import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";
import type { AppConfig } from "../config/configuration";
import { JOB_QUEUE } from "./job-queue.interface";
import { BullMqJobQueue } from "./bullmq-job-queue.service";
import { InlineJobQueue } from "./inline-job-queue.service";

@Global()
@Module({
  providers: [
    {
      provide: JOB_QUEUE,
      useFactory: (configService: ConfigService) => {
        const redisConfig = configService.getOrThrow<AppConfig["redis"]>("app.redis");
        if (!redisConfig.enabled || !redisConfig.url) {
          return new InlineJobQueue();
        }
        // maxRetriesPerRequest: null is a hard BullMQ requirement for the connection used
        // by its blocking-command-based Workers — leaving the ioredis default here causes
        // BullMQ to throw at startup, not just log a warning.
        const connection = new Redis(redisConfig.url, { maxRetriesPerRequest: null });
        return new BullMqJobQueue(connection);
      },
      inject: [ConfigService],
    },
  ],
  exports: [JOB_QUEUE],
})
export class QueueModule {}
