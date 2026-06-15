# Veridian — 10-Business Beta Program
# Phase 6: Beta Structure | Recruitment | Feedback | Escalation | Success Process
# Launch target: after Go/No-Go confirmed per beta-launch-checklist.md

---

## PROGRAM OVERVIEW

**Goal:** Acquire Veridian's first 10 paying customers, generate real recovery results,
collect proof-of-concept data, and build the case studies that drive the next 100 customers.

**Duration:** 60 days (Day 1 = first client live, Day 60 = beta review complete)

**Pricing:** Beta clients get a founder pricing rate — fixed for 12 months if they stay
on after beta. This rewards early trust and protects them from future price increases.

**Commitment from Veridian:**
- White-glove onboarding (Steve/Skeeter handles every account personally)
- Direct access (personal cell, same-day response)
- Monthly review calls (Steve-led)
- Results-or-refund: if they don't recover more in revenue than they pay in the first
  30 days, the first month is free

---

## TARGET BUSINESS PROFILE

Beta clients should match Veridian's highest-signal profile:

| Criteria | Target |
|---|---|
| Monthly call volume | 30–200 calls/month |
| Miss rate (self-reported or estimated) | > 20% |
| Average customer value | > $500 |
| Industry | Security, Contracting, Medical, Property Mgmt, Legal |
| Decision-maker | Owner or operations lead who can decide same week |
| Geographic | Sanford / Orlando FL area first, then national |
| Tech comfort | Willing to change call forwarding setting (1-time) |

**Exclude from beta:**
- Businesses with < 20 calls/month (insufficient volume to show results)
- Businesses with dedicated full-time receptionist (low miss rate, weak fit)
- Businesses that want full call center handling (out of scope)
- Anyone who can't commit to a 30-day evaluation period

---

## RECRUITMENT PLAN

### Sources (in priority order)

**1. Warm outreach — personal network (Week 1)**

Steve + Skeeter personally reach out to:
- Security company owners known personally
- Contractor contacts from previous work
- Medical practice managers from referral network

Script:
"[Name] — I'm launching a new service that recovers missed calls for businesses like
yours automatically. I'm taking on 10 founding clients at a discounted rate for the
first 60 days. Would you give me 15 minutes to show you the numbers for your business?
I'll tell you exactly what I think you're losing and what we'd recover."

**2. Inbound from website (ongoing)**

- /dashboard shows every lead from website form
- Assessment completions: high-priority — follow up within 4 hours
- Contact form submissions: follow up within 1 business day
- HOT leads (tagged in dashboard): respond within 1 hour

**3. Local business outreach (Week 2–3)**

Direct outreach to businesses in Sanford / Orange County:
- HVAC companies (high call volume, high miss rate)
- Plumbers and electricians
- Property management companies
- Urgent care and specialty medical

LinkedIn outreach: search owners/operators of service businesses in Central Florida.
Use a short message with the calculator link — let them see their number before you call.

**4. Referral from first clients (Day 30+)**

After first client is live and happy:
"You know other [industry] businesses. If you refer someone who signs on as a client,
I'll extend your beta rate for an extra month. No limit on referrals."

---

## BETA SLOT TRACKER

| Slot | Business | Industry | Contact | Status | Go-Live Date | 30-Day Revenue Recovered |
|---|---|---|---|---|---|---|
| 1 | | | | | | |
| 2 | | | | | | |
| 3 | | | | | | |
| 4 | | | | | | |
| 5 | | | | | | |
| 6 | | | | | | |
| 7 | | | | | | |
| 8 | | | | | | |
| 9 | | | | | | |
| 10 | | | | | | |

**Status values:** Prospect → Discovery → Consultation → Onboarding → Live → Churned → Renewed

---

## FEEDBACK COLLECTION PROCESS

---

### Week 1 Check-In (text — Day 7)

"[Name] — first week is done. Two questions:
1. Are you seeing the recovered conversations come through?
2. Does the response message sound like your business?

I want to know if anything feels off while we can still adjust it."

**Log response in notes field on /dashboard.**

---

### Day 30 Structured Survey

Send via email after the monthly review call. Keep it short:

Subject: 2 minutes — your Veridian feedback

"[Name] — thanks for the 30-day review. One quick follow-up:

1. On a scale of 1–10, how satisfied are you with Veridian so far?
2. What's working best?
3. What's one thing you'd change?
4. Would you refer Veridian to another business owner? (Yes / No / Maybe)
5. May we use your results as a case study? (Yes with my name / Yes anonymized / No)

Reply here or call me. These answers directly shape how we build the service."

**Log all survey responses in GHL contact notes.**

---

### Day 60 Beta Review Call (30 min, all clients)

Schedule this individually with each beta client.

Agenda:
1. Full 60-day results: recovered calls, conversations, bookings, estimated revenue
2. Qualitative: what worked, what didn't, what they wish was different
3. Renewal decision: continue at beta rate, upgrade to growth package, or cancel
4. Case study request: get permission to document their results
5. Referral ask: "Is there one person you'd want to introduce us to?"

---

## ISSUE ESCALATION PROCESS

---

### Level 1 — Configuration Issues (Steve handles, same day)

**Symptoms:**
- Response message not sending
- Tone feels wrong to the client
- Wrong hours / availability sending
- Duplicate messages going out
- Wrong name in message

**Action:** Steve edits configuration immediately. No approval needed. Notify client when fixed.
Target: resolved within 4 hours of identification.

---

### Level 2 — Technical Failure (investigate within 2 hours)

**Symptoms:**
- Call forwarding not triggering responses
- Emails not sending
- Dashboard not showing new leads
- API errors in Vercel logs

**Action:**
1. Check Vercel runtime logs immediately
2. Check KV connectivity (api/leads returns configured:false = KV down)
3. Check Resend dashboard for delivery failures
4. If Vercel outage: check vercel.com/status
5. Notify client proactively within 1 hour: "We're aware of an issue and investigating"
6. Post fix: send "Resolved" update with timeline of what happened

Target: identified and communicated within 2 hours, resolved within 24 hours.

---

### Level 3 — Client Unhappy With Results (Steve + Skeeter, within 24 hours)

**Symptoms:**
- Response rate below 30% after 2 weeks
- Client complaint about prospect experience
- Client requests cancellation

**Action:**
1. Call the client personally (Steve) — do not handle via text or email
2. Understand specifically what they expected vs. what happened
3. Offer: adjust configuration, extend evaluation, or refund first month
4. If they want to cancel: do not fight it. Ask for honest feedback, log it, and offer to re-engage in 90 days if circumstances change

**Never:** argue with a beta client about results. They took a risk on you. Honor that.

---

### Level 4 — System-Wide Failure

**Symptoms:**
- Multiple clients report same issue simultaneously
- Vercel deployment error or rollback needed
- KV data at risk

**Action:**
1. Proactively notify all active clients: "We're experiencing a platform issue. We're on it."
2. Investigate root cause before any rollback
3. Fix forward if possible; rollback only if forward fix will take > 4 hours
4. Post-mortem document for every Level 4 event: what happened, how long, what we're doing to prevent recurrence

---

## CUSTOMER SUCCESS PROCESS

---

### Success Definition (per client)

A beta client is **successful** if, at day 30:
- Response rate ≥ 40%
- Estimated revenue recovered ≥ monthly fee paid
- Client rates satisfaction ≥ 7/10
- Client intends to continue

A beta client is **at-risk** if:
- Response rate < 30%, OR
- No conversations converted to bookings after 14 days, OR
- Client has stopped engaging with check-ins

---

### At-Risk Protocol

When a client shows at-risk signals:
1. Call immediately (do not text — this needs voice)
2. Opening: "I'm looking at your numbers and I want to talk through them with you before your monthly review."
3. Diagnose: Is it a configuration problem? A call volume problem? A follow-through problem on their end (not calling back warm leads)?
4. Act: fix the specific problem, not just the symptoms
5. Document: log every at-risk conversation in GHL notes

---

## WEEKLY REVIEW PROCESS (INTERNAL)

Every Monday morning — Steve + Skeeter — 30 minutes.

**Agenda:**

1. **Beta Slot Status** (5 min)
   - How many slots are live?
   - How many are in onboarding?
   - How many are in discovery/consultation?
   - Are we on track to fill all 10 slots?

2. **Active Client Health** (10 min)
   - Any at-risk accounts?
   - Any issues that need attention before the next check-in?
   - Review /dashboard for any leads or clients that haven't been contacted

3. **Inbound Lead Review** (10 min)
   - Review all new leads since last Monday
   - HOT leads: were they contacted within 1 hour?
   - Assessment completions: were they contacted within 4 hours?
   - Any high-value leads that need same-day outreach?

4. **Sales Pipeline** (5 min)
   - Where are we in the funnel for each open slot?
   - What's the next action for each prospect?
   - Are there any proposals out that need follow-up?

**Weekly output:** Update beta slot tracker. Any action items get assigned to Steve or Skeeter with a due date.

---

## BETA SUCCESS CRITERIA

At Day 60, the beta is a success if:

| Metric | Target |
|---|---|
| Clients live | ≥ 7 of 10 slots filled |
| Average response rate | ≥ 55% |
| Average revenue recovered (30-day) | ≥ 2× monthly fee |
| Client renewal rate | ≥ 70% |
| Net Promoter (would refer) | ≥ 7 out of 10 clients say Yes |
| Case studies collected | ≥ 3 (with permission) |
| Total monthly recurring revenue | ≥ $[target MRR] |

---

## POST-BETA TRANSITION

After 10 clients and 60 days:

1. **Compile results document** — real numbers from real clients, anonymized where needed
2. **Update website** — replace "Representative outcomes. Results vary." with actual beta results where permitted
3. **Build case studies** — 2–3 story-format case studies for website and sales materials
4. **Adjust pricing** — based on what beta clients validated they'd pay
5. **Scale outreach** — take winning messages from beta, apply to broader outreach
6. **First hire evaluation** — at 10 clients, determine whether Steve/Skeeter can continue to white-glove at 20+ clients or need first support person

---

*Generated: June 15, 2026. Part of the Veridian Customer Acquisition & Launch Operations package.*
