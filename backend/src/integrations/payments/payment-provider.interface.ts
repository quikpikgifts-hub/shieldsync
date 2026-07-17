export const PAYMENT_PROVIDER = Symbol("PAYMENT_PROVIDER");

export interface CreateCheckoutSessionInput {
  userId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutSession {
  id: string;
  url: string;
}

export interface WebhookEvent {
  type: string;
  data: unknown;
}

/**
 * Contract a real Stripe adapter must implement. Deliberately narrow: raw card data
 * never crosses this interface (see docs/ember/THREAT_MODEL.md R-07) — everything here
 * is either a hosted-checkout redirect or a webhook payload Stripe already validated.
 */
export interface PaymentProvider {
  createCheckoutSession(input: CreateCheckoutSessionInput): Promise<CheckoutSession>;
  cancelSubscription(subscriptionExternalRef: string): Promise<void>;
  verifyWebhookSignature(rawBody: Buffer, signatureHeader: string): WebhookEvent;
}
