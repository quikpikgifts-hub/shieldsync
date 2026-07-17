import { Injectable } from "@nestjs/common";
import type { ThrottlerStorage } from "@nestjs/throttler";
import type Redis from "ioredis";

// Not re-exported from @nestjs/throttler's package root (only from its internal dist
// file), so the shape is declared here — it's a stable, documented part of the
// ThrottlerStorage contract this class implements.
interface ThrottlerStorageRecord {
  totalHits: number;
  timeToExpire: number;
  isBlocked: boolean;
  timeToBlockExpire: number;
}

// Mirrors @nestjs/throttler's own in-memory ThrottlerStorageService algorithm exactly
// (see node_modules/@nestjs/throttler/dist/throttler.service.js) but as a single atomic
// Lua script, so concurrent requests against the same key from different app instances
// can't race past the limit the way two independent in-memory counters would — the
// entire reason this class exists (SECURITY_AUDIT.md H-3: the default in-memory storage
// doesn't work correctly once more than one API instance is running).
const INCREMENT_SCRIPT = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local ttl = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local blockDuration = tonumber(ARGV[4])

local data = redis.call('HMGET', key, 'totalHits', 'expiresAt', 'blockExpiresAt', 'isBlocked')
local totalHits = tonumber(data[1]) or 0
local expiresAt = tonumber(data[2]) or 0
local blockExpiresAt = tonumber(data[3]) or 0
local isBlocked = data[4] == '1'

if expiresAt <= now then
  expiresAt = now + ttl
  totalHits = 0
end

if not isBlocked then
  totalHits = totalHits + 1
end

if totalHits > limit and not isBlocked then
  isBlocked = true
  blockExpiresAt = now + blockDuration
end

local timeToBlockExpire = blockExpiresAt - now
if timeToBlockExpire <= 0 and isBlocked then
  isBlocked = false
  totalHits = 1
  blockExpiresAt = 0
  expiresAt = now + ttl
end

redis.call('HMSET', key, 'totalHits', totalHits, 'expiresAt', expiresAt, 'blockExpiresAt', blockExpiresAt, 'isBlocked', isBlocked and '1' or '0')
local expireAtMs = expiresAt
if blockExpiresAt > expireAtMs then expireAtMs = blockExpiresAt end
redis.call('PEXPIREAT', key, expireAtMs + 1000)

local timeToExpireSec = math.ceil((expiresAt - now) / 1000)
local timeToBlockExpireSec = math.ceil((blockExpiresAt - now) / 1000)
if timeToBlockExpireSec < 0 then timeToBlockExpireSec = 0 end

return {totalHits, timeToExpireSec, isBlocked and 1 or 0, timeToBlockExpireSec}
`;

@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage {
  constructor(private readonly redis: Redis) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    // Distinct throttler configs (the global default vs. login's tighter override) must
    // not share one counter, so the throttler name is folded into the Redis key itself.
    const redisKey = `throttle:{${throttlerName}}:${key}`;
    const result = (await this.redis.eval(
      INCREMENT_SCRIPT,
      1,
      redisKey,
      Date.now(),
      ttl,
      limit,
      blockDuration,
    )) as [number, number, number, number];

    return {
      totalHits: result[0],
      timeToExpire: result[1],
      isBlocked: result[2] === 1,
      timeToBlockExpire: result[3],
    };
  }
}
