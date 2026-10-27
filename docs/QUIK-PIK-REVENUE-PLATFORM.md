# Quik Pik AI — Revenue Platform Foundation

**Status:** Phase 0 product foundation / UI prototype  
**Branch:** `feature/qp-revenue-platform-foundation`  
**Production status:** Not deployed. Demo metrics are illustrative, not connected to live business data.

## Product outcome

Quik Pik AI helps a small business turn attention into revenue through one governed workflow:

1. Attract — campaign and content planning.
2. Capture — forms and lead intake.
3. Follow up — consent-aware automated journeys.
4. Convert — appointment, offer, and sales follow-up.
5. Measure — delivery, leads, conversion, and attributable revenue.
6. Improve — AI recommendations with human approval.

## Product boundary

Quik Pik AI is a separate marketing/revenue product. ShieldSync security/workforce features remain separate. Shared infrastructure can be reused only after confirming tenant isolation, authorization, and data boundaries.

## MVP modules

### 1. Revenue overview
- Leads created, follow-ups due, conversion rate, attributable revenue.
- Distinguish observed values from estimates.
- Every KPI must link to source events and a defined calculation.

### 2. Leads and contacts
- Workspace-scoped contact records, lead source, lifecycle stage, tags, owner, activity timeline.
- Consent evidence, opt-out timestamp, and suppression status.
- Import and export require permission checks and validation.

### 3. Campaigns
- Draft, preview, test send, approval, scheduled, sending, sent, paused, failed.
- Template versions and an audit trail.
- No live send without an explicit user action and a valid recipient/consent check.

### 4. Automation engine
- Initial primitives: trigger, delay, condition, action, stop condition.
- Idempotent execution, durable run history, retries with backoff, dead-letter/error state.
- Stop when contact unsubscribes, is suppressed, converts, or workflow is disabled.
- A scheduled job must not be treated as a complete workflow engine without concurrency, retry, and idempotency tests.

### 5. AI copilot
- Drafts and recommendations only by default.
- Structured output validated against schemas.
- Human approval for external messages, publishing, destructive actions, and paid actions.
- Usage budgets, model configuration, error logging without storing unnecessary sensitive data.

### 6. Attribution and reporting
- Event-based reporting with a defined attribution window.
- Separate campaign delivery, lead, conversion, and verified revenue events.
- Never present an estimate as confirmed revenue.

## Recommended domain model

All tenant-owned records require `workspace_id` and server-side authorization.

- `workspaces`: id, name, plan/status, created_at
- `workspace_members`: workspace_id, user_id, role
- `contacts`: id, workspace_id, email/phone, name, lifecycle_stage, source, created_at
- `consent_events`: id, workspace_id, contact_id, channel, purpose, status, evidence, occurred_at
- `campaigns`: id, workspace_id, name, channel, status, content_version, created_by, approved_by, scheduled_at
- `campaign_recipients`: id, workspace_id, campaign_id, contact_id, delivery_status, provider_message_id
- `workflows`: id, workspace_id, name, status, version, definition_json
- `workflow_runs`: id, workspace_id, workflow_id, contact_id, status, idempotency_key, next_run_at, attempts, last_error
- `events`: id, workspace_id, contact_id, event_type, occurred_at, source, metadata
- `conversions`: id, workspace_id, contact_id, value, currency, verified, occurred_at, attribution_source
- `audit_logs`: id, workspace_id, actor_id, action, target_type, target_id, occurred_at

This is a target model, not a claim that these tables currently exist. Choose one authoritative persistence/auth model after auditing the existing repository and deployment.

## API contract direction

- `GET /api/qp/overview`
- `GET|POST /api/qp/contacts`
- `GET|POST /api/qp/campaigns`
- `POST /api/qp/campaigns/:id/test`
- `POST /api/qp/campaigns/:id/approve`
- `POST /api/qp/campaigns/:id/send` — explicit approval and consent gate required
- `GET|POST /api/qp/workflows`
- `GET /api/qp/workflow-runs/:id`
- `GET /api/qp/events`

Every endpoint must authenticate the caller, authorize workspace access on the server, validate inputs, apply rate limits, and emit safe audit events. Do not implement endpoints against a guessed database.

## Security and compliance gates

- Tenant isolation tested at API/data layer, not just UI.
- Secrets only in server-side environment variables; never ship provider keys to browsers.
- Consent purpose/channel and evidence captured where applicable.
- Unsubscribe/suppression enforced immediately before sending.
- Validate sender/domain configuration and provider webhooks.
- Rate limits fail closed for sensitive/expensive endpoints, with an explicit degraded-mode policy.
- Retries must not duplicate sends; use idempotency keys.
- Backups, restore test, error monitoring, and rollback plan.
- Follow applicable email marketing laws and provider policies; have legal/compliance review before public launch.

## 90/100 release gate

| Category | Points |
|---|---:|
| Functionality and end-to-end tests | 25 |
| Security, tenant isolation, consent | 25 |
| Reliability, retries, idempotency | 15 |
| Usability/accessibility | 10 |
| Analytics accuracy/traceability | 10 |
| Performance/maintainability/rollback | 5 |
| Documentation/support readiness | 10 |
| **Total** | **100** |

Minimum 90/100, with zero critical security, privacy, data-loss, consent, or unauthorized-send defects. Critical failures block release regardless of score.

## Delivery sequence

1. Audit actual deployment, API routes, auth, data store, provider config, cron behavior, tests, and access controls.
2. Establish test/staging environment and baseline regression tests.
3. Implement workspace/tenant authorization and contacts/consent.
4. Implement campaign drafts, test sends, unsubscribe/suppression, and event capture.
5. Implement workflow runner with idempotency, retries, stop conditions, and run history.
6. Add AI campaign planning behind approval gates and usage controls.
7. Add outcome attribution and pilot instrumentation.
8. Pilot with Quik Pik itself, then a small set of consenting businesses.
9. Add billing only after value, reliability, and operating costs are validated.

## Budget guardrail

No new paid subscriptions, API spend, or production service changes without explicit approval. Use existing/free allowances only during the prototype phase. Any real customer email or paid AI call must be explicitly configured and approved.

## Current implementation boundary

This branch adds a visual product prototype and this specification only. The prototype uses local demo data and browser-only interactions; it is not a working CRM, does not send messages, and does not connect to production services. Do not merge or deploy until reviewed and tested.
