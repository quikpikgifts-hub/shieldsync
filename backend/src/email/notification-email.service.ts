import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { EMAIL_PROVIDER, type EmailProvider } from "../integrations/email/email-provider.interface";
import { JOB_QUEUE, type JobQueue } from "../queue/job-queue.interface";
import type { AppConfig } from "../config/configuration";

const EMAIL_QUEUE_NAME = "email";

interface EmailJob {
  to: string;
  templateKey: string;
  variables: Record<string, string>;
}

/**
 * The one place the rest of the app calls to send a transactional email — callers never
 * touch EMAIL_PROVIDER or the queue directly. Every send goes through the background
 * queue (BullMQ when Redis is configured, inline-with-retry otherwise — see
 * queue.module.ts) so a slow/flaky SMTP provider can never make a request (registration,
 * login, password reset) wait on mail delivery.
 */
@Injectable()
export class NotificationEmailService {
  private readonly logger = new Logger(NotificationEmailService.name);
  private readonly emailEnabled: boolean;

  constructor(
    @Inject(EMAIL_PROVIDER) private readonly emailProvider: EmailProvider,
    @Inject(JOB_QUEUE) private readonly jobQueue: JobQueue,
    configService: ConfigService,
  ) {
    this.emailEnabled = configService.getOrThrow<AppConfig["email"]>("app.email").enabled;
    this.jobQueue.registerProcessor<EmailJob>(EMAIL_QUEUE_NAME, async (job) => {
      const { providerMessageId } = await this.emailProvider.sendTransactional(job);
      this.logger.log(`Sent "${job.templateKey}" to ${job.to} (provider message id: ${providerMessageId})`);
    });
  }

  async sendVerificationEmail(to: string, verificationLink: string, expiresInHours: number): Promise<void> {
    await this.enqueue(to, "email-verification", {
      verificationLink,
      expiresInHours: String(expiresInHours),
    });
  }

  async sendPasswordResetEmail(to: string, resetLink: string, expiresInMinutes: number): Promise<void> {
    await this.enqueue(to, "password-reset", {
      resetLink,
      expiresInMinutes: String(expiresInMinutes),
    });
  }

  async sendNewDeviceLoginAlert(to: string, details: { ipAddress: string; userAgent: string }): Promise<void> {
    await this.enqueue(to, "new-device-login-alert", details);
  }

  private async enqueue(to: string, templateKey: string, variables: Record<string, string>): Promise<void> {
    if (!this.emailEnabled) {
      // Mirrors every other unconfigured integration's "fail loud, not silent" rule at the
      // point something *tries* to use it directly (SmtpEmailProvider/NotConfiguredEmailProvider
      // still throw if called directly) — but here, at the notification layer, skipping
      // with a loud warning is the right behavior: a registration/password-reset request
      // shouldn't fail (or burn 3 retries) just because no SMTP server exists in this
      // environment yet. See OPEN_DECISIONS.md.
      this.logger.warn(`Email not sent ("${templateKey}" to ${to}) — SMTP_HOST is not configured.`);
      return;
    }
    await this.jobQueue.enqueue<EmailJob>(EMAIL_QUEUE_NAME, { to, templateKey, variables });
  }
}
