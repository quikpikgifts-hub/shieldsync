import { Injectable } from "@nestjs/common";
import { IntegrationNotConfiguredError } from "../integration-not-configured.error";
import type {
  IdentityVerificationProvider,
  StartVerificationInput,
  VerificationHandle,
  VerificationResult,
} from "./identity-verification-provider.interface";

@Injectable()
export class NotConfiguredIdentityVerificationProvider implements IdentityVerificationProvider {
  startVerification(_input: StartVerificationInput): Promise<VerificationHandle> {
    throw new IntegrationNotConfiguredError(
      "Identity verification",
      "IDENTITY_VERIFICATION_PROVIDER / IDENTITY_VERIFICATION_API_KEY",
    );
  }

  getVerificationResult(_vendorReferenceId: string): Promise<VerificationResult> {
    throw new IntegrationNotConfiguredError(
      "Identity verification",
      "IDENTITY_VERIFICATION_PROVIDER / IDENTITY_VERIFICATION_API_KEY",
    );
  }
}
