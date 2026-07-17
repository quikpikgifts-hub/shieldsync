import { Injectable } from "@nestjs/common";
import { IntegrationNotConfiguredError } from "../integration-not-configured.error";
import type {
  CheckoutSession,
  CreateCheckoutSessionInput,
  PaymentProvider,
  WebhookEvent,
} from "./payment-provider.interface";

@Injectable()
export class NotConfiguredPaymentProvider implements PaymentProvider {
  createCheckoutSession(_input: CreateCheckoutSessionInput): Promise<CheckoutSession> {
    throw new IntegrationNotConfiguredError("Stripe", "STRIPE_SECRET_KEY");
  }

  cancelSubscription(_subscriptionExternalRef: string): Promise<void> {
    throw new IntegrationNotConfiguredError("Stripe", "STRIPE_SECRET_KEY");
  }

  verifyWebhookSignature(_rawBody: Buffer, _signatureHeader: string): WebhookEvent {
    throw new IntegrationNotConfiguredError("Stripe", "STRIPE_WEBHOOK_SECRET");
  }
}
