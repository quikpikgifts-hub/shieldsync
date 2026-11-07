# Quik Pik AI Agent Communication Hub

Status: architecture proposal on `feat/quikpik-ai-agent-bridge`  
Existing app: `https://shieldsync-jbsx.vercel.app`  
Repository: `quikpikgifts-hub/shieldsync`

## Objective

Reuse the existing Vercel application, domain, serverless API routes, and Upstash/Vercel KV foundation to create one authenticated communication hub for ChatGPT, Muse, and You.com-powered research. Do not create another platform or expose provider keys in browser code.

## What the current repository already provides

- Vercel serverless/edge API route pattern under `/api`.
- Existing KV client in `api/_lib/kv.js` using `KV_REST_API_URL` and `KV_REST_API_TOKEN`.
- Existing Anthropic gateway in `api/_lib/ai-gateway.js`.
- Existing rate-limiting helper.
- Existing scheduled Vercel Cron pattern in `vercel.json`.

The repository currently contains an Anthropic-backed chat route. The inspected files did not establish that Muse or You.com credentials/adapters are already configured. Keep all secrets in Vercel environment variables and verify their presence without printing values before enabling integrations.

## Important provider distinction

“YouChat” is the consumer-facing assistant experience. For an integration, use the documented You.com APIs/MCP capabilities rather than assuming there is a public endpoint that mirrors the YouChat UI. Preferred research path: You.com MCP at `https://api.you.com/mcp` where supported, or server-side You.com Search, Contents, Answer, and Research APIs.

Muse video generation is asynchronous: create a generation task, receive a task ID, poll status, then store the resulting media URL and consumed-credit metadata. Use Muse's documented server API and never expose its bearer key to a browser.

## Target architecture

```
ChatGPT (strategy, briefs, independent QC)
          |
          | authenticated task / result messages
          v
Quik Pik Agent Bridge — existing Vercel domain
          |
          +---- Shared task queue + audit log (KV)
          |
          +---- You.com adapter (research, citations, source extraction)
          |
          +---- Muse adapter (image/video generation, task polling)
          |
          +---- Reporting/status endpoints
          |
          v
Quik Pik production record / daily report
```

### Agent responsibilities

| Agent | Primary responsibility | Must return |
|---|---|---|
| ChatGPT | Strategy, short briefs, scripts, source checks, platform packaging, independent QC | Approved brief, scorecard, corrections, decision |
| You.com | Fresh research, trend discovery, source extraction, corroborating evidence | Findings, source URLs, dates, confidence/limitations |
| Muse | Execute approved creative brief, generate/edit video and image assets | Task ID, status, result URLs, model, duration, consumed credits, failures |

No agent may claim another agent completed work without a recorded result.

## Message contract

Every message uses a validated JSON envelope:

```json
{
  "id": "uuid",
  "correlation_id": "uuid",
  "task_id": "uuid",
  "created_at": "ISO-8601",
  "from": "chatgpt | you_research | muse",
  "to": "chatgpt | you_research | muse | hub",
  "type": "research.request | research.result | production.request | production.status | production.result | qc.result | daily.report",
  "status": "queued | accepted | running | succeeded | failed | needs_review",
  "priority": "low | normal | high",
  "brief": {},
  "inputs": {},
  "outputs": {},
  "evidence": [],
  "usage": {},
  "approval": {
    "required": true,
    "scope": "existing-owner-authorized-publishing-only"
  }
}
```

Validate every field server-side. Reject unknown message types, oversized payloads, missing correlation IDs, untrusted URLs, and malformed result records.

## Proposed API routes on the existing domain

- `POST /api/agents/tasks` — create a task and enqueue it.
- `GET /api/agents/tasks/:id` — read task status and safe result metadata.
- `POST /api/agents/tasks/:id/claim` — agent claims a queued task using its scoped identity.
- `POST /api/agents/tasks/:id/events` — append status, progress, failure, and completion events.
- `POST /api/agents/research` — server-side You.com research adapter.
- `POST /api/agents/media` — server-side Muse generation adapter.
- `POST /api/agents/media/status` — poll Muse generation status.
- `GET /api/agents/daily-report` — summarize tasks, quality, usage, publication and verified outcomes.

These are proposed routes, not claims that endpoints already exist. Implement only after checking deployed environment variables and current API route inventory.

## Queue and audit record design

Use existing KV infrastructure initially; do not add a new database or paid service for the first version.

Suggested key families:
- `qp:agent:task:<task_id>` — current task record.
- `qp:agent:queue:<agent>` — queued task IDs.
- `qp:agent:events:<task_id>` — append-only task event history.
- `qp:agent:usage:<yyyy-mm-dd>` — daily provider and credit usage.
- `qp:agent:report:<yyyy-mm-dd>` — daily summary.

Use bounded retention, idempotency keys, retries with backoff, and dead-letter status for exhausted tasks. Store only metadata and approved media URLs in KV; do not store large video files in KV.

## Security requirements

- Provider keys live only in Vercel server-side environment variables.
- Use separate scoped credentials for ChatGPT, You.com and Muse adapters.
- Authenticate every agent request with short-lived signed tokens or an equivalent server-verified mechanism.
- Never put API keys in query strings, prompts, Git commits, client bundles, or logs.
- Replace wildcard CORS with explicit allowed origins.
- Validate request schemas, content types, payload size, rate limits and URL domains.
- Redact authorization headers and secrets from errors and logs.
- Do not let research content or retrieved webpages issue executable instructions to other agents.
- Maintain audit events for task creation, claims, provider calls, credit use, results, QC and publication.
- Keep existing TikTok and Shopify authorizations intact. The bridge does not expand, revoke, or reinterpret them.

## Credit and execution controls

- One short brief per task; no speculative multi-variant generation.
- Research first, then generate only after the brief passes selection.
- Default to one candidate render; retry only for a documented defect or provider failure.
- Record model, duration, resolution, estimated/actual credits, and result URL.
- Enforce configurable daily and per-task credit caps. If a cap is reached, stop and report; never silently purchase more credits.
- Reuse existing approved assets and templates.

## Workflow

1. ChatGPT creates a concise research or production task.
2. Hub validates and stores it with a correlation ID.
3. You.com returns dated findings and citations when research is needed.
4. ChatGPT reviews evidence and produces a final short creative brief.
5. Muse receives the approved brief and returns a task ID.
6. Hub records generation status and polls at the provider's supported interval.
7. Muse returns media URLs and usage data.
8. ChatGPT performs independent QC and returns a scorecard and required corrections.
9. The hub records publication state only after the existing authorized publishing workflow confirms success.
10. Daily report reconciles outputs, credits, views, engagement, followers, store traffic, inquiries and verified sales.

## Phased implementation

### Phase 0 — configuration audit (read-only)
- Confirm the production deployment and custom-domain mapping.
- Inventory Vercel environment-variable *names and presence only* for KV, You.com, Muse, and existing AI providers. Never reveal values.
- Inventory current API routes and confirm whether KV is configured.
- Confirm current deployment uses the expected branch and build.
- Verify that no secrets are committed to the repository.

### Phase 1 — secure hub core
- Add shared message schema, authentication helper, task queue, event log, idempotency and rate limiting.
- Add task create/read/claim/event routes.
- Add basic status view and audit report.
- Test authorization, invalid payloads, retries, concurrency, and missing configuration.

### Phase 2 — provider adapters
- Add You.com research adapter using documented API/MCP capabilities.
- Add Muse media adapter with asynchronous task creation and status polling.
- Add credit accounting, failure handling and source/result provenance.
- Keep adapters disabled until their corresponding environment variables are confirmed present.

### Phase 3 — ChatGPT connection
- Expose a documented, authenticated OpenAPI contract for a ChatGPT Action or compatible MCP client.
- ChatGPT submits briefs and retrieves results through the hub; it does not need direct access to provider secrets.
- Verify the actual ChatGPT client integration before describing it as connected.

### Phase 4 — production pilot
- Run one research-only task, then one low-cost media task.
- Verify every message, status transition, source, result URL and credit record.
- Only then enable the daily safety-production workflow.

## Acceptance criteria

The bridge is not “live” until all of these are demonstrated:
- ChatGPT can create and retrieve a task through the authenticated contract.
- You.com returns current, source-linked research.
- Muse completes a generation and returns a valid result URL and credit record.
- Task events survive retries without duplicate generation.
- Secrets never appear in browser responses, logs, or Git.
- Failed or missing provider configuration produces a clear blocked status.
- Existing publishing permissions and Shopify workflow remain unchanged.
- A daily report reconciles tasks, usage and verified business outcomes.

## Known implementation caveats

- A shared domain alone does not create agent-to-agent communication. The authenticated API contract and agent-side connectors are required.
- You.com MCP/API access is not the same as connecting to the private YouChat account conversation history.
- Muse generation API access and available credits must be confirmed in the actual account.
- ChatGPT in this conversation cannot be assumed to call an arbitrary custom endpoint until an Action/MCP connection is configured and tested.
- Do not announce that Muse, You.com, or ChatGPT are connected until an end-to-end test succeeds.
