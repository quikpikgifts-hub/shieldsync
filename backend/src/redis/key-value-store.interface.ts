export const KEY_VALUE_STORE = Symbol("KEY_VALUE_STORE");

/**
 * The minimal primitive every Redis-backed feature in this app needs (account lockout
 * counters, token blacklist entries). Two implementations exist: a real Redis-backed one
 * for production/multi-instance correctness, and an in-memory one so local dev/CI/unit
 * tests don't require a running Redis — see redis.module.ts for which one gets wired up.
 * The in-memory one is explicitly NOT correct across multiple instances; that's the whole
 * reason this interface exists rather than reaching for `Map` directly at every call site.
 */
export interface KeyValueStore {
  /** Atomically increments `key`, setting a `windowSeconds` expiry only on first creation. Returns the new count. */
  incrWithExpiry(key: string, windowSeconds: number): Promise<number>;
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
  del(key: string): Promise<void>;
  /** Remaining TTL in seconds, or null if the key doesn't exist / has no expiry. */
  ttl(key: string): Promise<number | null>;
}
