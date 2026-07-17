import { Global, Inject, Injectable, Logger, Module, type OnApplicationShutdown } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";
import type { AppConfig } from "../config/configuration";
import { KEY_VALUE_STORE } from "./key-value-store.interface";
import { RedisKeyValueStore } from "./redis-key-value-store";
import { InMemoryKeyValueStore } from "./in-memory-key-value-store";

export const REDIS_CLIENT = Symbol("REDIS_CLIENT");

const logger = new Logger("RedisModule");

@Injectable()
class RedisLifecycle implements OnApplicationShutdown {
  constructor(@Inject(REDIS_CLIENT) private readonly client: Redis | null) {}

  async onApplicationShutdown(): Promise<void> {
    await this.client?.quit();
  }
}

/**
 * Global so every feature module (auth lockout, token blacklist, the throttler storage,
 * BullMQ queues) can inject REDIS_CLIENT / KEY_VALUE_STORE without each declaring its own
 * import. REDIS_CLIENT is `null` when REDIS_URL isn't set — every consumer is expected to
 * either accept `Redis | null` directly (BullMQ, which requires a real client and is
 * itself disabled when null — see queue.module.ts) or go through KEY_VALUE_STORE, which
 * already picks the right backing implementation and never exposes `null` to its callers.
 */
@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (configService: ConfigService): Redis | null => {
        const redisConfig = configService.getOrThrow<AppConfig["redis"]>("app.redis");
        if (!redisConfig.enabled || !redisConfig.url) {
          logger.warn(
            "REDIS_URL is not set — falling back to in-memory rate limiting, account " +
              "lockout, token blacklist, and no background queue. Fine for local dev/CI; " +
              "required for a real multi-instance deployment. See PRODUCTION_READINESS.md.",
          );
          return null;
        }
        const client = new Redis(redisConfig.url, {
          maxRetriesPerRequest: 3,
          lazyConnect: false,
        });
        client.on("error", (error) => logger.error("Redis client error", error));
        return client;
      },
      inject: [ConfigService],
    },
    {
      provide: KEY_VALUE_STORE,
      useFactory: (client: Redis | null) => (client ? new RedisKeyValueStore(client) : new InMemoryKeyValueStore()),
      inject: [REDIS_CLIENT],
    },
    RedisLifecycle,
  ],
  exports: [REDIS_CLIENT, KEY_VALUE_STORE],
})
export class RedisModule {}
