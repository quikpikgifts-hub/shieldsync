# Veridian — Beta Launch Checklist
# Phase 6: Go/No-Go | Remaining Risks | Launch Readiness Score
# All findings verified against actual codebase and API source.

---

## PRE-LAUNCH CHECKLIST

### Infrastructure
- [ ] KV_REST_API_URL set in Vercel → leads stored
- [ ] KV_REST_API_TOKEN set in Vercel → KV authenticated
- [ ] DASH_PIN set (NOT "0000") → dashboard secured
- [ ] CRON_SECRET set → follow-up cron authenticated
- [ ] Vercel Pro active (or Pro trial) → cron job runs daily
- [ ] Branch `claude/operacore-2030-restructure-1hw5si` → verify last deploy is READY

### Email
- [ ] Resend domain verified (DNS records confirmed)
- [ ] RESEND_API_KEY set in Vercel
- [ ] TEAM_EMAIL set to real team inbox
- [ ] FROM_DOMAIN set to verified domain
- [ ] BOOKING_URL set (optional — defaults to /#contact)
- [ ] Test: submit form → team email received within 30 seconds
- [ ] Test: submit form → prospect confirmation email received

### GoHighLevel
- [ ] GOHIGHLEVEL_API_KEY set in Vercel
- [ ] GOHIGHLEVEL_LOCATION_ID set in Vercel
- [ ] GOHIGHLEVEL_PIPELINE_ID set (optional — for auto-opportunities)
- [ ] GOHIGHLEVEL_STAGE_ID set (optional — for auto-opportunities)
- [ ] Test: submit form → contact appears in GHL with correct tags
- [ ] Test: verify note contains calculator data

### AI Recovery Plan
- [ ] ANTHROPIC_API_KEY set in Vercel
- [ ] Test: complete contact form → "Generate My Recovery Plan" → plan appears

### Dashboard
- [ ] Visit /dashboard → PIN login works
- [ ] Verify leads appear after test submissions
- [ ] Verify PATCH actions work (Proposal Sent, Mark Won)
- [ ] Change DASH_PIN from default "0000" BEFORE any leads arrive

### Assessment
- [ ] Complete assessment → assessment email received by test address
- [ ] Verify team receives assessment notification

### Booking
- [ ] Complete contact form → Book consultation → select slot → confirm
- [ ] Verify team receives booking notification
- [ ] Verify prospect receives booking confirmation

---

## END-TO-END FLOW TEST

Complete this in order before launch:

1. Go to homepage → scroll to Revenue Calculator
2. Adjust sliders to realistic numbers → note annual recovery figure
3. Click "Get My Recovery Plan" → lands on contact section with pre-filled recovery number
4. Fill out contact form → submit
5. Verify: team email received, prospect email received, GHL contact created
6. On success screen: click "Book My Free Consultation" → select slot → confirm
7. Verify: team booking email received, prospect confirmation received, KV has booking record
8. On booked screen: click "Generate My Recovery Plan While You Wait"
9. Verify: plan generates within 10 seconds using actual numbers
10. Visit /dashboard → PIN → verify lead appears with priority, calcData, booked=true
11. Click "Mark Won" → enter $500 → verify revenue appears in dashboard metrics
12. Go to homepage → complete assessment (Revenue Recovery area only)
13. Enter email → "Email My Results" → verify assessment email received

All 13 steps must pass before Go.

---

## GO / NO-GO ASSESSMENT

### GO conditions (must all be true)

| Condition | Check |
|---|---|
| KV provisioned and confirmed working | |
| Team email receiving form submissions | |
| Prospect confirmation email sending | |
| Dashboard accessible with PIN (not "0000") | |
| End-to-end flow test (13 steps) passed | |
| GHL receiving contacts with correct tags | |
| Assessment email delivery confirmed | |
| Booking flow confirmed working | |

### SOFT requirements (recommended but not blocking)

| Condition | Check |
|---|---|
| ANTHROPIC_API_KEY set (recovery plan generation) | |
| GHL pipeline + opportunity auto-creation | |
| Vercel Pro active for cron follow-ups | |
| BOOKING_URL pointed to GHL calendar | |
| DASH_PIN changed from "0000" | |

---

## REMAINING RISKS

| Risk | Severity | Status | Mitigation |
|---|---|---|---|
| KV not provisioned | CRITICAL | Unknown | Provision KV before first launch traffic |
| DASH_PIN is default "0000" | CRITICAL | Unknown | Set DASH_PIN immediately — dashboard is public |
| Resend domain not verified | HIGH | Unknown | Emails silently skip — test before launch |
| CRON_SECRET not set | HIGH | Unknown | Follow-up sequence never fires |
| Vercel Pro not active | HIGH | Unknown | Cron requires Pro — follow-up won't run on Hobby tier |
| No GHL calendar integration | MEDIUM | By design | Booking slots are client-side only, no conflict check |
| Two prospects can book same slot | MEDIUM | By design | Manual coordination required; fix post-beta |
| No unsubscribe link in follow-up emails | MEDIUM | By design | Legal risk in some jurisdictions — add before scaling |
| ANTHROPIC_API_KEY not set | MEDIUM | Unknown | Recovery plan shows error message — not blocking |
| Production URL not live | LOW | Known | shieldsync-app.vercel.app still serves old app |
| assessment.js "AI Front Desk" label | FIXED | Fixed in this deploy | Updated to "Always-Available Coverage" |

---

## LAUNCH READINESS SCORE

Scoring is based on verified code capabilities only. Infrastructure variables are unknown until configured.

| Category | Weight | Score if all vars set | Score if no vars set |
|---|---|---|---|
| Lead capture & storage | 20% | 100 | 0 |
| Email delivery | 20% | 100 | 20 (form still works) |
| Follow-up automation | 15% | 100 | 0 |
| Dashboard & reporting | 15% | 100 | 10 (shows "not configured") |
| GoHighLevel CRM sync | 15% | 100 | 0 |
| AI recovery plan | 10% | 100 | 20 (graceful fallback) |
| Booking flow | 5% | 90 | 50 (UI works, no email) |
| **TOTAL** | | **99/100** | **15/100** |

**Current estimated score:** Unknown — depends entirely on env var configuration.
**Target score for Go:** 80/100 minimum (KV + Email + Dashboard at minimum).

---

## GO / NO-GO RECOMMENDATION

**CONDITIONAL GO.**

The website is complete and verified. Every functional system is implemented and confirmed in code. The go/no-go decision reduces entirely to one question:

**Are the environment variables configured and tested?**

### GO if:
- KV is provisioned
- Email is sending
- Dashboard is accessible with a real PIN
- End-to-end test passes

### NO-GO if:
- KV_REST_API_URL is not set (leads vanish silently)
- DASH_PIN is still "0000" (dashboard is unsecured)
- Team email is not receiving form submissions

### Recommended launch sequence:

**Day 1:** Configure all Vercel env vars (see env-checklist.md)
**Day 2:** Run end-to-end flow test (all 13 steps in this document)
**Day 3:** Deploy to production URL (merge or redirect shieldsync-app.vercel.app → this branch)
**Day 4:** SOFT LAUNCH — share with 2–3 trusted contacts for feedback
**Day 7:** BETA LAUNCH — begin active outreach to target accounts

---

## POST-LAUNCH PRIORITIES (Week 1)

1. Monitor dashboard daily — respond to every lead within 1 business day
2. Watch for assessment completions — these are warm; follow up within 4 hours
3. Check follow-up queue in dashboard → confirm cron is firing daily
4. After first 3 leads: review GHL pipeline, confirm tagging is correct
5. After first consultation: refine discovery script based on what prospects ask
6. After first proposal: note which objections came up, update proposal template

---

*Generated: June 15, 2026. All findings from direct code inspection of api/*.js and src/Website.jsx.*
