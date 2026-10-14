# Quik Pik × ShieldSync Integration Runbook

## Scope

This branch adds a Quik Pik operations view, a Gumroad sale-ping receiver, and an owner-only sales summary API. These changes are not production-active until the pull request is reviewed, the build/preview is validated, and the required server-side environment variables are configured.

## Required Vercel environment variables

- `GUMROAD_WEBHOOK_SECRET`: long random secret used as the `token` query parameter on the Gumroad Ping URL.
- `GUMROAD_ACCESS_TOKEN`: Gumroad API access token; server-side only.
- `GUMROAD_ALLOWED_PRODUCT_IDS`: comma-separated Gumroad product IDs allowed to count toward Quik Pik revenue.
- `QUIKPIK_OWNER_EMAIL`: exact email of the ShieldSync account allowed to view the sales summary.
- `KV_REST_API_URL` and `KV_REST_API_TOKEN`: existing Upstash/Vercel KV credentials for event storage and deduplication.

Never commit these values or expose them in client-side VITE variables. Configure the values in the deployment environment only after confirming the intended production project.

## Gumroad Ping setup

Configure Gumroad Ping to POST to the deployed endpoint:

`https://<verified-shieldsync-host>/api/webhooks/gumroad?token=<GUMROAD_WEBHOOK_SECRET>`

The endpoint accepts sale, refund, dispute, and dispute-won pings. It does not trust the posted price or product details: it fetches the sale from Gumroad's authenticated API, checks the returned sale ID, restricts records to the allowlisted product IDs, and uses a KV idempotency key to prevent duplicate sale events from being counted twice, and updates an existing stored sale when a refund/dispute event changes its verified state.

Use Gumroad's test ping first. Then make a low-value owner-approved test transaction only if needed; never fabricate a real sale record. Check refunds and disputes separately before using these event totals as accounting numbers.

## Sales API

`GET /api/quikpik/sales` requires a valid ShieldSync bearer session and an email matching `QUIKPIK_OWNER_EMAIL`. It returns only the last 500 stored webhook events and states that this is not a historical import. Totals are grouped by currency to avoid summing unlike currencies.

## Current limitations and release gates

- No historical Gumroad sales are imported; only events received after setup are visible.
- Verify the Gumroad API response shape and price units with test pings for sale, refund, dispute, and dispute-won events before relying on displayed amounts.
- Gumroad Ping events do not provide a signed webhook signature; protect the URL with the random secret and verify every sale through the API.
- Refund/dispute events are normalized into the stored sale state, but this behavior must pass end-to-end test pings before relying on it. The view is not an accounting ledger.
- KV list storage is suitable for an initial low-volume operations view, not an accounting ledger.
- Validate build, deployment preview, endpoint authorization, duplicate handling, and product allowlisting before merge or production rollout.
- No production environment variables, Gumroad settings, live site, or sales records were changed as part of this code change.
