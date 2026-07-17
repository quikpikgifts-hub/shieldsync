import { Injectable } from "@nestjs/common";
import { IntegrationNotConfiguredError } from "../integration-not-configured.error";
import type { EmailProvider, SendEmailInput } from "./email-provider.interface";

@Injectable()
export class NotConfiguredEmailProvider implements EmailProvider {
  sendTransactional(_input: SendEmailInput): Promise<{ providerMessageId: string }> {
    throw new IntegrationNotConfiguredError("Email provider", "EMAIL_PROVIDER / EMAIL_API_KEY");
  }
}
