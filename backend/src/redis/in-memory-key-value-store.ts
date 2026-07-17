import { Injectable } from "@nestjs/common";
import type { KeyValueStore } from "./key-value-store.interface";

interface Entry {
  value: string;
  expiresAt: number | null; // epoch ms, null = no expiry
}

/**
 * Single-process fallback used when REDIS_URL isn't configured (local dev, CI, unit
 * tests). Explicitly NOT correct across multiple app instances — every instance would
 * have its own independent counters, which is exactly the distributed-rate-limiting bug
 * this whole Redis integration exists to fix in production. Never use this in a
 * multi-instance deployment; see PRODUCTION_READINESS.md.
 */
@Injectable()
export class InMemoryKeyValueStore implements KeyValueStore {
  private readonly store = new Map<string, Entry>();

  private read(key: string): Entry | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt !== null && entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return entry;
  }

  async incrWithExpiry(key: string, windowSeconds: number): Promise<number> {
    const existing = this.read(key);
    const nextValue = existing ? parseInt(existing.value, 10) + 1 : 1;
    this.store.set(key, { value: String(nextValue), expiresAt: Date.now() + windowSeconds * 1000 });
    return nextValue;
  }

  async get(key: string): Promise<string | null> {
    return this.read(key)?.value ?? null;
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    this.store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async ttl(key: string): Promise<number | null> {
    const entry = this.read(key);
    if (!entry || entry.expiresAt === null) return null;
    return Math.max(0, Math.ceil((entry.expiresAt - Date.now()) / 1000));
  }
}
