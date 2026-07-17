export const EMAIL_PROVIDER = Symbol("EMAIL_PROVIDER");

export interface SendEmailInput {
  to: string;
  templateKey: string;
  variables: Record<string, string>;
}

/** Contract a real transactional-email adapter (e.g. Postmark, SES, SendGrid) must implement. */
export interface EmailProvider {
  sendTransactional(input: SendEmailInput): Promise<{ providerMessageId: string }>;
}
