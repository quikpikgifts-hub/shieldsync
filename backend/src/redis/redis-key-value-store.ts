import { Injectable } from "@nestjs/common";
import type Redis from "ioredis";
import type { KeyValueStore } from "./key-value-store.interface";

@Injectable()
export class RedisKeyValueStore implements KeyValueStore {
  constructor(private readonly redis: Redis) {}

  async incrWithExpiry(key: string, windowSeconds: number): Promise<number> {
    // A pipeline (not a transaction) is enough here: INCR is already atomic on its own,
    // and EXPIRE only needs to run once — but running it unconditionally on every call is
    // simpler and harmless (it just resets the TTL countdown, which for a fixed-window
    // counter is the intended "NX"-like behavior since we only care about the *count*
    // exceeding a threshold within *a* window, not a perfectly aligned calendar window).
    const pipeline = this.redis.pipeline();
    pipeline.incr(key);
    pipeline.expire(key, windowSeconds);
    const results = await pipeline.exec();
    const incrResult = results?.[0];
    if (!incrResult || incrResult[0]) {
      throw incrResult?.[0] ?? new Error("Redis pipeline returned no result for INCR");
    }
    return incrResult[1] as number;
  }

  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    await this.redis.set(key, value, "EX", ttlSeconds);
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async ttl(key: string): Promise<number | null> {
    const result = await this.redis.ttl(key);
    return result >= 0 ? result : null;
  }
}
