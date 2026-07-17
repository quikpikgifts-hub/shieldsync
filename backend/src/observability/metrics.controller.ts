import { Controller, Get, Header } from "@nestjs/common";
import { ApiExcludeController } from "@nestjs/swagger";
import { SkipThrottle } from "@nestjs/throttler";
import { Public } from "../common/decorators/public.decorator";
import { MetricsService } from "./metrics.service";

// Excluded from Swagger (not a client-facing API endpoint) and unauthenticated (a
// Prometheus scraper has no JWT) — in a real deployment this is typically also firewalled
// to only the metrics-collector's network, which is an infrastructure-level control this
// application can't enforce itself.
@ApiExcludeController()
@Public()
@SkipThrottle()
@Controller()
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get("metrics")
  @Header("Content-Type", "text/plain")
  async metrics(): Promise<string> {
    return this.metricsService.registry.metrics();
  }
}
