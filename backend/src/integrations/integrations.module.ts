import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { AppConfig } from "../config/configuration";
import { PAYMENT_PROVIDER } from "./payments/payment-provider.interface";
import { NotConfiguredPaymentProvider } from "./payments/not-configured-payment.provider";
import { SMS_PROVIDER } from "./sms/sms-provider.interface";
import { NotConfiguredSmsProvider } from "./sms/not-configured-sms.provider";
import { EMAIL_PROVIDER } from "./email/email-provider.interface";
import { NotConfiguredEmailProvider } from "./email/not-configured-email.provider";
import { SmtpEmailProvider } from "./email/smtp-email.provider";
import { STORAGE_PROVIDER } from "./storage/storage-provider.interface";
import { NotConfiguredStorageProvider } from "./storage/not-configured-storage.provider";
import { S3StorageProvider } from "./storage/s3-storage.provider";
import { IDENTITY_VERIFICATION_PROVIDER } from "./identity-verification/identity-verification-provider.interface";
import { NotConfiguredIdentityVerificationProvider } from "./identity-verification/not-configured-identity-verification.provider";
import { AI_PROVIDER } from "./ai/ai-provider.interface";
import { NotConfiguredAiProvider } from "./ai/not-configured-ai.provider";
import { PUSH_PROVIDER } from "./push/push-provider.interface";
import { NotConfiguredPushProvider } from "./push/not-configured-push.provider";
import { ANALYTICS_PROVIDER } from "./analytics/analytics-provider.interface";
import { NotConfiguredAnalyticsProvider } from "./analytics/not-configured-analytics.provider";

/**
 * Every extension point in this module currently resolves to its "NotConfigured"
 * adapter — see src/integrations/README.md. Swapping in a real vendor is a matter of
 * adding a real adapter class alongside the NotConfigured one and switching the
 * `useClass` (or `useFactory`, once the adapter needs env-var credentials) below, behind
 * a feature flag if a gradual rollout is wanted. No other module needs to change, because
 * every consumer depends on the interface + token, never on a concrete provider class.
 */
@Global()
@Module({
  providers: [
    { provide: PAYMENT_PROVIDER, useClass: NotConfiguredPaymentProvider },
    { provide: SMS_PROVIDER, useClass: NotConfiguredSmsProvider },
    {
      // Real when SMTP_HOST is set, NotConfigured otherwise — this is the one extension
      // point in this file that's genuinely wired up in this phase (see
      // docs/ember/CHANGELOG.md, Phase 3). Every other one below is still exactly the
      // Phase 1 "throws until a real adapter is written" stub.
      provide: EMAIL_PROVIDER,
      useFactory: (configService: ConfigService) => {
        const emailConfig = configService.getOrThrow<AppConfig["email"]>("app.email");
        return emailConfig.enabled ? new SmtpEmailProvider(configService) : new NotConfiguredEmailProvider();
      },
      inject: [ConfigService],
    },
    {
      provide: STORAGE_PROVIDER,
      useFactory: (configService: ConfigService) => {
        const storageConfig = configService.getOrThrow<AppConfig["storage"]>("app.storage");
        return storageConfig.enabled ? new S3StorageProvider(configService) : new NotConfiguredStorageProvider();
      },
      inject: [ConfigService],
    },
    { provide: IDENTITY_VERIFICATION_PROVIDER, useClass: NotConfiguredIdentityVerificationProvider },
    { provide: AI_PROVIDER, useClass: NotConfiguredAiProvider },
    { provide: PUSH_PROVIDER, useClass: NotConfiguredPushProvider },
    { provide: ANALYTICS_PROVIDER, useClass: NotConfiguredAnalyticsProvider },
  ],
  exports: [
    PAYMENT_PROVIDER,
    SMS_PROVIDER,
    EMAIL_PROVIDER,
    STORAGE_PROVIDER,
    IDENTITY_VERIFICATION_PROVIDER,
    AI_PROVIDER,
    PUSH_PROVIDER,
    ANALYTICS_PROVIDER,
  ],
})
export class IntegrationsModule {}
