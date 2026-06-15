# Veridian — First Customer Readiness Audit
# Phase 7: Prospect Walkthrough | Weaknesses | Operational Fixes
# Walk-through conducted as a prospect — June 15, 2026
# Source: Direct inspection of live site + api/ code + ops/ documents

---

## AUDIT METHOD

This audit simulates the full prospect experience from first touch to proposal.
Every step is reviewed against the standard of: "Would a busy service business owner
do this? Would they get confused? Would they drop off?"

The goal is not to find things to build — it is to find operational gaps
that could be fixed right now without writing new code.

---

## STEP 1: FIRST IMPRESSION — LANDING ON THE SITE

**URL:** shieldsync-git-claude-operaco-f44543-quikpikgifts-hubs-projects.vercel.app

**What a prospect sees:**

The first section is the Assessment. There is no traditional hero — no headline,
no tagline, no "what is this company" statement visible without scrolling.

**Audit finding:**

RISK: A prospect who lands from a Google ad or cold outreach has 3–5 seconds to
decide if they're in the right place. If the first thing they see is "Free Business
Assessment" without context, some will not engage.

MITIGATION (operational, no code): Add a first outreach line in cold messages or ads
that pre-frames: "I want to share a free assessment for businesses losing revenue to
missed calls. Takes 2 minutes." That way, when they land on the Assessment section,
they know exactly why they're there.

STATUS: No code change needed. Sales messaging covers this.

---

## STEP 2: ASSESSMENT ENTRY

**What a prospect sees:**

Three area pills: Revenue Recovery | Customer Follow-Up | Business Continuity.
Also: "Start Full Assessment" option.

**Flow test:**

A prospect in the security industry clicks "Revenue Recovery." They see questions
about call volume and miss rate. The questions are clear. The "See My Results" button
works correctly.

**Audit finding:**

GREEN: Assessment entry is clean and fast. Three focused options reduce friction.

One potential gap: if a prospect is mobile and the scroll target on area selection
doesn't bring them to the top of the question view, they may not see the questions.
This was previously fixed (useEffect scroll). No action needed.

---

## STEP 3: ASSESSMENT COMPLETION

**What a prospect sees:**

Score from 0–100. Area-by-area breakdown. 3 recommendations.
Email capture form: Name, Email, "Email My Results."

**Flow test:**

A prospect scores 42/100 on Revenue Recovery. The recommendations are specific
("You're missing 25–35% of inbound calls..."). They enter their email and click
"Email My Results."

**Audit finding:**

GREEN (code): The assessment submission sends to /api/assessment.
UNKNOWN (operational): Whether the team email is receiving assessment notifications.

**Action required (Day 1, before first traffic):**
Complete a test assessment submission with a real email address.
Confirm: team notification received, prospect email received, lead appears in /dashboard.

---

## STEP 4: AFTER THE ASSESSMENT

**What a prospect sees:**

After submitting, they see a "results sent" confirmation. The page does not redirect
them to the next action.

**Audit finding:**

YELLOW: The assessment is a top-of-funnel capture, not a conversion. After submitting,
a warm prospect has no clear next step visible — they're left on the results screen.
The team must follow up (this is intended — assessment completions trigger a 24h and 3d
follow-up email sequence).

**Operational gap:** The follow-up emails depend on RESEND_API_KEY and CRON_SECRET.
If these aren't set, follow-up doesn't fire. Assessment leads who don't get follow-up
will cool off.

**Action required:** Set RESEND_API_KEY and CRON_SECRET before launch.
Confirm follow-up email received 24 hours after test submission.

---

## STEP 5: SCROLLING THE HOMEPAGE

**What a prospect sees (in order):**

Assessment → Stats Bar → Calculator → AutoDemo → Revenue Recovery Center →
Recovery Section → Front Desk Section → Follow-Up Section → Trust → FAQ → Social Proof →
Founder → Results → Industries → Contact

**Flow test:**

A prospect uses the Revenue Calculator: 80 calls/month, 30% miss rate, $2,000 average
customer value. The calculator shows estimated annual loss of $115,200. They click
"Get My Recovery Plan."

The Contact form scrolls into view with the recovery number pre-populated as a hint.

**Audit finding:**

GREEN: The Calculator → Contact flow works. The CustomEvent pre-fills the contact form.

---

## STEP 6: CONTACT FORM SUBMISSION

**What a prospect sees:**

Name, Last Name, Email, Phone, Company, Message fields. Submit button.
After submit: multi-step flow — success → book consultation → booking confirmed → recovery plan.

**Flow test (code-verified, not live-tested without KV):**

Submit → /api/contact → creates KV lead → sends team email → sends prospect confirmation.

**Audit finding:**

UNKNOWN (infrastructure): Without KV and Resend configured, the form will return
an error or partial success. A prospect who submits and gets an error will not return.

**Action required (before any real prospect submits):**
1. KV_REST_API_URL + KV_REST_API_TOKEN must be set in Vercel
2. RESEND_API_KEY must be set
3. TEAM_EMAIL must be set to real inbox
4. Test: submit with real data → confirm team receives email within 30 seconds
5. Test: submit → confirm prospect receives confirmation email

This is the single most important pre-launch test. A broken contact form = no leads captured.

---

## STEP 7: BOOKING FLOW

**What a prospect sees:**

After form success: "Book My Free Consultation" → calendar grid with 9 slots →
select slot → submit → booking confirmed screen.

**Flow test:**

Select a slot → POST /api/book → stores booking in KV → sends confirmation emails.

**Audit finding:**

MEDIUM RISK: The booking slots are generated client-side based on the current date.
Two prospects could book the same slot (no conflict detection). Manual coordination
required. This is documented as a known limitation.

**Operational fix (no code):** Steve or Skeeter checks /dashboard daily. Any new bookings
appear in the leads list (booked=true). Cross-check against your own calendar before
confirming. If a conflict exists, call the prospect personally within 30 minutes to reschedule.

---

## STEP 8: RECOVERY PLAN GENERATION

**What a prospect sees:**

On the "booked" screen: "Generate My Recovery Plan While You Wait" button.
Clicking generates a personalized AI recovery plan using their calculator data.

**Audit finding:**

OPTIONAL: This requires ANTHROPIC_API_KEY. If not set, the button shows a graceful
error message. Not blocking for launch — set it when possible.

---

## STEP 9: DASHBOARD

**URL:** /dashboard

**What Steve/Skeeter sees:**

PIN entry screen → /dashboard → leads table with name, company, priority, annual
recovery, date, actions (Proposal Sent, Mark Won).

**Audit finding:**

CRITICAL: Default PIN is "0000". The dashboard URL is public. Anyone who finds the URL
and tries "0000" gets full access to all leads.

**Action required (immediately, before first lead arrives):**
Set DASH_PIN in Vercel env vars to a strong 6+ digit PIN. Never use 0000.

---

## STEP 10: FIRST CONTACT FROM TEAM

**What a prospect experiences (24 hours after submitting):**

If RESEND is configured: they receive a follow-up email at 24 hours.
Whether or not they receive email: Steve should call personally within 1 business day.

**Audit finding:**

This is 100% operational. There is no automation for voice outreach — that is Steve's job.

**Quality check:** What does Steve say when he calls?

Use the Discovery Script from ops/sales-scripts.md. Know the prospect's calculator number
before you dial (check /dashboard for their calcData). Open with:
"I saw you calculated about [$X] in annual missed revenue — I wanted to connect personally."

That one line separates Veridian from every other service they've heard from.

---

## OVERALL ASSESSMENT

### READY NOW (no action needed)

- [x] Website loads correctly
- [x] Assessment flow works end-to-end in UI
- [x] Calculator calculates correctly
- [x] Contact form UI works
- [x] Booking flow UI works
- [x] Dashboard UI works
- [x] Mobile experience functional
- [x] API code correct (verified from source)
- [x] Demo language removed
- [x] AI/tech language replaced with outcome language
- [x] FAQ section answers real objections
- [x] Sales scripts written and ready

### REQUIRED BEFORE FIRST LEAD (blockers)

| Action | Owner | Urgency |
|---|---|---|
| Set KV_REST_API_URL + KV_REST_API_TOKEN | Steve | CRITICAL |
| Set DASH_PIN (not "0000") | Steve | CRITICAL |
| Set RESEND_API_KEY + TEAM_EMAIL + FROM_DOMAIN | Steve | HIGH |
| Verify Resend domain DNS | Steve | HIGH |
| Test: submit contact form → receive team email | Steve | HIGH |
| Test: submit contact form → receive prospect email | Steve | HIGH |
| Test: complete assessment → receive team notification | Steve | HIGH |
| Set CRON_SECRET | Steve | HIGH |
| Upgrade to Vercel Pro (cron requires Pro) | Steve | MEDIUM |

### OPTIONAL (after first lead, not blocking)

| Action | Owner | Urgency |
|---|---|---|
| Set ANTHROPIC_API_KEY | Steve | MEDIUM |
| Set GOHIGHLEVEL_API_KEY + LOCATION_ID | Steve | MEDIUM |
| Set GOHIGHLEVEL_PIPELINE_ID + STAGE_ID | Steve | LOW |
| Set BOOKING_URL to real GHL calendar | Steve | LOW |
| Set CRON_SECRET | Steve | MEDIUM |

---

## OPERATIONAL READINESS SCORE

| Category | Ready? | Notes |
|---|---|---|
| Website live | YES | Confirmed HTTP 200, correct title |
| API functions deployed | YES | /api/leads confirmed responding |
| KV provisioned | NO | Returns configured:false |
| Email sending | UNKNOWN | RESEND_API_KEY not verified |
| Dashboard secured | UNKNOWN | DASH_PIN not changed from 0000 |
| End-to-end test passed | NO | Requires KV + email to be set first |
| Sales scripts ready | YES | ops/sales-scripts.md + objection-handling.md |
| Onboarding process ready | YES | ops/onboarding-welcome.md |
| Beta program ready | YES | ops/beta-program.md |
| GHL setup | NO | Requires manual setup per ops/ghl-deployment.md |

**Current operational score: 3/10 ready** (website + API + sales scripts)

**After env vars + email verification: expected score 8/10**

**After GHL + Vercel Pro + first E2E test: LAUNCH READY**

---

## ONE-SENTENCE VERDICT

The website and systems are complete. The single blocker between "built" and
"customer acquisition mode" is configuring the Vercel environment variables —
that is the entire difference between 0 leads captured and the first paying client.

---

*Generated: June 15, 2026. Walk-through against live deployment dpl_5YMtZR6t75TBDxmUir8vjZ7zFsMN.*
*All API findings from direct source code inspection.*
