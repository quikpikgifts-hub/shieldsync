export const SMS_PROVIDER = Symbol("SMS_PROVIDER");

export interface SendSmsInput {
  toE164: string;
  body: string;
}

/** Contract a real Twilio adapter must implement (phone verification, safety alerts). */
export interface SmsProvider {
  sendSms(input: SendSmsInput): Promise<{ providerMessageId: string }>;
  sendVerificationCode(toE164: string): Promise<{ providerMessageId: string }>;
  checkVerificationCode(toE164: string, code: string): Promise<boolean>;
}
