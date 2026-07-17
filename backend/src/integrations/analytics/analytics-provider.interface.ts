export const ANALYTICS_PROVIDER = Symbol("ANALYTICS_PROVIDER");

export interface TrackEventInput {
  userId?: string;
  event: string;
  properties?: Record<string, unknown>;
}

/** Contract a real analytics adapter must implement. Never send PII in `properties`. */
export interface AnalyticsProvider {
  track(input: TrackEventInput): Promise<void>;
}
