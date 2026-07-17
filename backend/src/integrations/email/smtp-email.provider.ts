import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import nodemailer, { type Transporter } from "nodemailer";
import type { AppConfig } from "../../config/configuration";
import { renderEmailTemplate, type RenderedEmail } from "./templates";
import type { EmailProvider, SendEmailInput } from "./email-provider.interface";

const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 2000;

/**
 * Real transactional-email adapter using SMTP via nodemailer. Works against any
 * SMTP-speaking provider (Postmark, SES SMTP interface, SendGrid SMTP, or a self-hosted
 * relay) — configured entirely through SMTP_* env vars, no vendor-specific SDK.
 */
@Injectable()
export class SmtpEmailProvider implements EmailProvider {
  private readonly logger = new Logger(SmtpEmailProvider.name);
  private readonly transporter: Transporter;
  private readonly fromAddress: string;
  private readonly fromName: string;

  constructor(configService: ConfigService) {
    const emailConfig = configService.getOrThrow<AppConfig["email"]>("app.email");
    if (!emailConfig.smtpHost) {
      throw new Error("SmtpEmailProvider constructed without SMTP_HOST — this indicates a wiring bug in IntegrationsModule.");
    }

    this.fromAddress = emailConfig.fromAddress;
    this.fromName = emailConfig.fromName;
    this.transporter = nodemailer.createTransport({
      host: emailConfig.smtpHost,
      port: emailConfig.smtpPort,
      secure: emailConfig.smtpSecure,
      auth: emailConfig.smtpUser ? { user: emailConfig.smtpUser, pass: emailConfig.smtpPassword ?? undefined } : undefined,
    });
  }

  async sendTransactional(input: SendEmailInput): Promise<{ providerMessageId: string }> {
    const rendered = renderEmailTemplate(input.templateKey, input.variables);
    return this.sendWithRetry(input.to, rendered, 1);
  }

  private async sendWithRetry(to: string, rendered: RenderedEmail, attempt: number): Promise<{ providerMessageId: string }> {
    try {
      const info = await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromAddress}>`,
        to,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
      });
      return { providerMessageId: info.messageId };
    } catch (error) {
      const smtpError = error as { responseCode?: number; message?: string };

      // A 5xx SMTP response is a permanent rejection (bad mailbox, domain refuses mail,
      // policy rejection) — the "bounce" this adapter can detect synchronously, at
      // send-time. Retrying would fail identically every time, so it's surfaced
      // immediately instead. True asynchronous bounces (a message accepted at send-time
      // that bounces later, reported via a vendor-specific webhook/DSN mailbox) are out of
      // scope for a generic SMTP adapter — see OPEN_DECISIONS.md.
      const isPermanentRejection =
        typeof smtpError.responseCode === "number" && smtpError.responseCode >= 500 && smtpError.responseCode < 600;

      if (isPermanentRejection) {
        this.logger.error(`Permanent email delivery failure to ${to}: ${smtpError.message}`);
        throw error;
      }

      if (attempt >= MAX_ATTEMPTS) {
        this.logger.error(`Email delivery to ${to} failed after ${MAX_ATTEMPTS} attempts: ${smtpError.message}`);
        throw error;
      }

      this.logger.warn(
        `Transient email delivery failure to ${to} (attempt ${attempt}/${MAX_ATTEMPTS}), retrying: ${smtpError.message}`,
      );
      await sleep(BASE_DELAY_MS * 2 ** (attempt - 1));
      return this.sendWithRetry(to, rendered, attempt + 1);
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
