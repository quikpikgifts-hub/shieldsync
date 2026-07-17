export const IDENTITY_VERIFICATION_PROVIDER = Symbol("IDENTITY_VERIFICATION_PROVIDER");

export interface StartVerificationInput {
  userId: string;
  type: "id_document" | "liveness" | "background_check";
}

export interface VerificationHandle {
  vendorReferenceId: string;
  redirectUrl?: string;
}

export interface VerificationResult {
  vendorReferenceId: string;
  result: "pass" | "fail" | "pending" | "review";
}

/**
 * Contract a real identity-verification vendor adapter (Persona, Onfido, Stripe Identity)
 * must implement. Per docs/ember/DATABASE_SCHEMA.md, the actual ID document/image must
 * never be stored by this application — only the vendor reference and verdict.
 */
export interface IdentityVerificationProvider {
  startVerification(input: StartVerificationInput): Promise<VerificationHandle>;
  getVerificationResult(vendorReferenceId: string): Promise<VerificationResult>;
}
