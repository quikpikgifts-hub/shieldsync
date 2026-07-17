/**
 * Thrown by every "NotConfigured" adapter in this directory. The point is that calling
 * an unconfigured integration fails loudly and immediately, with a clear message pointing
 * at the env var to set — never silently returns fake success, and never pretends an
 * integration is operational before it has real credentials AND has been tested against
 * the real vendor.
 */
export class IntegrationNotConfiguredError extends Error {
  constructor(integrationName: string, envVarHint: string) {
    super(
      `${integrationName} is not configured. Set ${envVarHint} and provide a real adapter ` +
        `implementation before this feature can be used — see src/integrations/README.md.`,
    );
    this.name = "IntegrationNotConfiguredError";
  }
}
