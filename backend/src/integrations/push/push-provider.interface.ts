export const PUSH_PROVIDER = Symbol("PUSH_PROVIDER");

export interface PushNotificationInput {
  deviceToken: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

/** Contract a real push adapter (Firebase Cloud Messaging) must implement. */
export interface PushProvider {
  send(input: PushNotificationInput): Promise<{ providerMessageId: string }>;
}
