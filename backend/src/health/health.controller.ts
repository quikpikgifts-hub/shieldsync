import { Controller, Get, Inject } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { SkipThrottle } from "@nestjs/throttler";
import {
  HealthCheck,
  HealthCheckService,
  MemoryHealthIndicator,
  PrismaHealthIndicator,
  type HealthIndicatorResult,
} from "@nestjs/terminus";
import type Redis from "ioredis";
import { Public } from "../common/decorators/public.decorator";
import { PrismaService } from "../prisma/prisma.service";
import { REDIS_CLIENT } from "../redis/redis.module";
import type { AppConfig } from "../config/configuration";

// Deliberately generous defaults and configurable via env — a threshold this check should
// enforce depends on the actual container/instance memory limit in a given deployment,
// which this code has no way to know. Tune via HEALTH_HEAP_THRESHOLD_MB/HEALTH_RSS_THRESHOLD_MB
// per environment rather than assuming one number fits every deployment shape.
const HEAP_THRESHOLD_BYTES = parseInt(process.env.HEALTH_HEAP_THRESHOLD_MB ?? "1024", 10) * 1024 * 1024;
const RSS_THRESHOLD_BYTES = parseInt(process.env.HEALTH_RSS_THRESHOLD_MB ?? "1536", 10) * 1024 * 1024;

// Every route here is @Public() (no JWT — a load balancer/orchestrator has no user
// session) and @SkipThrottle() (health probes fire far more often than the global rate
// limit is meant to police, and a probe getting 429'd would be a self-inflicted outage).
@ApiTags("health")
@SkipThrottle()
@Controller()
export class HealthController {
  private readonly redisEnabled: boolean;

  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaIndicator: PrismaHealthIndicator,
    private readonly memoryIndicator: MemoryHealthIndicator,
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis | null,
    configService: ConfigService,
  ) {
    this.redisEnabled = configService.getOrThrow<AppConfig["redis"]>("app.redis").enabled;
  }

  @Public()
  @Get("live")
  @ApiOperation({ summary: "Liveness probe — process is up. No dependency checks; a orchestrator restarts the container if this fails." })
  live(): { status: "ok" } {
    return { status: "ok" };
  }

  @Public()
  @Get("ready")
  @HealthCheck()
  @ApiOperation({ summary: "Readiness probe — dependencies this instance needs to actually serve traffic are reachable." })
  ready() {
    return this.health.check(this.dependencyChecks());
  }

  @Public()
  @Get("health")
  @HealthCheck()
  @ApiOperation({ summary: "Full health report (dependencies + process memory) for dashboards/manual checks." })
  full() {
    return this.health.check([
      ...this.dependencyChecks(),
      () => this.memoryIndicator.checkHeap("memory_heap", HEAP_THRESHOLD_BYTES),
      () => this.memoryIndicator.checkRSS("memory_rss", RSS_THRESHOLD_BYTES),
    ]);
  }

  private dependencyChecks(): Array<() => Promise<HealthIndicatorResult>> {
    const checks = [() => this.prismaIndicator.pingCheck("database", this.prisma)];
    if (this.redisEnabled && this.redis) {
      checks.push(() => this.pingRedis());
    }
    return checks;
  }

  private async pingRedis(): Promise<HealthIndicatorResult> {
    try {
      await this.redis!.ping();
      return { redis: { status: "up" } };
    } catch (error) {
      return { redis: { status: "down", message: (error as Error).message } };
    }
  }
}
