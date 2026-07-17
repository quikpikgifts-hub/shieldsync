import { Injectable } from "@nestjs/common";
import { IntegrationNotConfiguredError } from "../integration-not-configured.error";
import type { AnalyticsProvider, TrackEventInput } from "./analytics-provider.interface";

@Injectable()
export class NotConfiguredAnalyticsProvider implements AnalyticsProvider {
  track(_input: TrackEventInput): Promise<void> {
    throw new IntegrationNotConfiguredError("Analytics provider", "ANALYTICS_WRITE_KEY");
  }
}
