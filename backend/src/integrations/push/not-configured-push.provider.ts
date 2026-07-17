import { Injectable } from "@nestjs/common";
import { IntegrationNotConfiguredError } from "../integration-not-configured.error";
import type { PushNotificationInput, PushProvider } from "./push-provider.interface";

@Injectable()
export class NotConfiguredPushProvider implements PushProvider {
  send(_input: PushNotificationInput): Promise<{ providerMessageId: string }> {
    throw new IntegrationNotConfiguredError("Push notifications (Firebase)", "PUSH_PROVIDER");
  }
}
