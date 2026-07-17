# Integration extension points

Every third-party integration named in the product brief (Stripe, AWS S3, Twilio,
Firebase push, OpenAI/Anthropic, identity verification, email, analytics) has:

1. An **interface** (`*-provider.interface.ts`) describing the contract, plus a DI token.
2. A **`NotConfigured*Provider`** that implements the interface and throws
   `IntegrationNotConfiguredError` on every method — loudly, not silently — so a code
   path that depends on a real integration fails immediately and legibly instead of
   pretending to succeed.
3. A wiring point in `integrations.module.ts` that currently binds every token to its
   `NotConfigured` implementation.

**None of these integrations are operational.** No credentials are configured in this
environment, and no adapter here has been written against a real vendor SDK or tested
against a live account. Do not describe a feature that depends on one of these as
"done" — only the extension point is done.

## Adding a real adapter later

1. Implement the interface against the real vendor SDK (e.g. `StripePaymentProvider
   implements PaymentProvider`).
2. Add the vendor credentials to `.env.example` (already present, commented out) and to
   the real environment's secret store — never commit real values.
3. Swap the `useClass` for that token in `integrations.module.ts`, or switch to a
   `useFactory` that picks the real adapter only when its env vars are present, falling
   back to `NotConfigured*` otherwise — this lets a partially-configured environment fail
   only on the specific integration that's missing, not the whole app.
4. Write integration tests against the real vendor's sandbox/test-mode credentials before
   calling the integration "operational" anywhere in documentation.
