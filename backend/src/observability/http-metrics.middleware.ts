import type { NextFunction, Request, Response } from "express";
import type { MetricsService } from "./metrics.service";

/**
 * Raw Express middleware, not a Nest interceptor — deliberately. An interceptor never
 * runs for a request a Guard rejects (JwtAuthGuard's 401s, ThrottlerGuard's 429s), which
 * would silently exclude exactly the responses most worth having metrics on. This runs
 * for every request Express receives; `req.route` is read lazily inside the `finish`
 * listener (registered up front, before routing happens) so it reflects the matched route
 * pattern by the time it's read, for every outcome — including ones a guard rejected
 * before a controller method ever ran.
 */
export function createHttpMetricsMiddleware(metricsService: MetricsService) {
  return function httpMetricsMiddleware(req: Request, res: Response, next: NextFunction): void {
    const start = process.hrtime.bigint();

    res.on("finish", () => {
      const durationSeconds = Number(process.hrtime.bigint() - start) / 1e9;
      // Labeled by matched route *pattern* (e.g. `/profiles/:userId`), never the raw URL —
      // a label with a UUID or arbitrary garbage path baked into it is an unbounded-
      // cardinality time-series explosion waiting to happen in whatever Prometheus-
      // compatible store scrapes this endpoint.
      const route = req.route?.path ? `${req.baseUrl}${req.route.path}` : "unmatched";
      metricsService.observeHttpRequest(req.method, route, res.statusCode, durationSeconds);
    });

    next();
  };
}
