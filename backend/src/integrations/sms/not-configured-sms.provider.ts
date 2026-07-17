import { Injectable } from "@nestjs/common";
import { IntegrationNotConfiguredError } from "../integration-not-configured.error";
import type { SendSmsInput, SmsProvider } from "./sms-provider.interface";

@Injectable()
export class NotConfiguredSmsProvider implements SmsProvider {
  sendSms(_input: SendSmsInput): Promise<{ providerMessageId: string }> {
    throw new IntegrationNotConfiguredError("Twilio", "TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN");
  }

  sendVerificationCode(_toE164: string): Promise<{ providerMessageId: string }> {
    throw new IntegrationNotConfiguredError("Twilio", "TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN");
  }

  checkVerificationCode(_toE164: string, _code: string): Promise<boolean> {
    throw new IntegrationNotConfiguredError("Twilio", "TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN");
  }
}
