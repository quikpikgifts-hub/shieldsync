# Veridian — Environment Variable Checklist
# Phase 1: Production Configuration Verification
# Source: Verified against api/contact.js, api/assessment.js, api/book.js,
#         api/leads.js, api/follow-up.js, api/ai.js

---

## CRITICAL — System will not store data without these

| Variable | Where to get it | Default | Required |
|---|---|---|---|
| `KV_REST_API_URL` | Vercel Dashboard → Storage → KV → Connect | none | YES |
| `KV_REST_API_TOKEN` | Vercel Dashboard → Storage → KV → Connect | none | YES |
| `DASH_PIN` | Set your own 4–8 digit PIN | none — all PIN-gated endpoints fail closed until set (`"0000"` is explicitly rejected too) | YES |
| `CRON_SECRET` | Generate random string (openssl rand -hex 32) | none | YES (Pro) |

**To provision KV:**
1. Vercel Dashboard → Storage → Create Database → KV (Upstash)
2. Connect to your project → auto-sets `KV_REST_API_URL` and `KV_REST_API_TOKEN`

---

## EMAIL — System silently skips email without these

| Variable | Where to get it | Default (fallback) | Required |
|---|---|---|---|
| `RESEND_API_KEY` | resend.com → API Keys | none | YES |
| `TEAM_EMAIL` | Your team inbox | `hello@veridian.io` | YES |
| `FROM_DOMAIN` | Your verified Resend domain | `veridian.io` | YES |

**To set up Resend:**
1. resend.com → Add Domain → verify DNS
2. API Keys → Create key
3. Set `FROM_DOMAIN` to the verified domain (e.g. `veridianrisk.com`)
4. Set `TEAM_EMAIL` to e.g. `steve@veridianrisk.com`

---

## AI RECOVERY PLAN — AI plan generation requires this

| Variable | Where to get it | Default | Required |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | console.anthropic.com | none | YES |

---

## GOHIGHLEVEL — CRM sync requires these

| Variable | Where to get it | Default | Required |
|---|---|---|---|
| `GOHIGHLEVEL_API_KEY` | GHL → Settings → API Keys (v1) | none | YES |
| `GOHIGHLEVEL_LOCATION_ID` | GHL → Settings → Business Info → Location ID | none | YES |
| `GOHIGHLEVEL_PIPELINE_ID` | GHL → Opportunities → Pipeline ID from URL | none | Optional |
| `GOHIGHLEVEL_STAGE_ID` | GHL → Pipeline stage ID from URL | none | Optional |

**Note:** Without PIPELINE_ID + STAGE_ID, contacts and notes are created in GHL but no opportunity record is created. Contacts will still receive tags (HOT/HIGH/MEDIUM/LOW, veridian-website, calculator-lead/direct-lead).

---

## OPTIONAL

| Variable | Purpose | Default |
|---|---|---|
| `CONTACT_WEBHOOK_URL` | Additional CRM/Zapier webhook on form submit | none |
| `BOOKING_URL` | Link in follow-up emails to booking page | `https://{FROM_DOMAIN}/#contact` |

---

## Security Notes

- **DASH_PIN default is "0000"** — change this BEFORE going live. Dashboard at /dashboard exposes all leads.
- **CRON_SECRET** — required for Vercel Cron to authenticate with `/api/follow-up`. Without it, cron fails silently.
- All API routes use Edge Functions. Secrets are server-side only; none reach the browser.

---

## How to Set in Vercel

Vercel Dashboard → Project → Settings → Environment Variables → Add

Set scope to **Production** (and Preview if testing).

After adding all variables: **Redeploy** the project for them to take effect.
