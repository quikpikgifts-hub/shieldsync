#!/usr/bin/env node
// Real end-to-end smoke test — every check here is a genuine HTTP request against a
// running instance of this backend (local or real deployed environment), not a mock.
// Exercises the full user journey named in docs/ember/GO_LIVE_CHECKLIST.md's "Launch
// verification" section: registration, email verification, password reset, refresh-token
// rotation + reuse detection, RBAC, matching, messaging, photo upload + thumbnail
// generation, reports/moderation, blocking, logout/token-blacklisting, and audit logging.
//
// Usage:
//   BASE_URL=http://localhost:3005 node scripts/launch-verification.mjs
//
// Optional env vars (only needed for the two DB-direct checks — safe to omit, both are
// skipped gracefully without one):
//   DATABASE_URL          — used to grant a test account the moderator role directly
//                            (there is no self-service admin-grant endpoint, by design —
//                            see docs/ember/OPEN_DECISIONS.md D-03) and to confirm audit
//                            log rows were actually written for this run's actions.
//   CAPTURED_EMAILS_PATH  — path to a JSONL file of {to, subject, text, html} records, one
//                           per received email, if verifying against a real captured-SMTP
//                           setup rather than a real inbox. If unset (or the file doesn't
//                           exist), the email-content checks are skipped rather than failed
//                           — verify those manually against a real inbox instead when
//                           running against a real SMTP provider (see
//                           docs/ember/GO_LIVE_CHECKLIST.md's "Email" section).
//
// This script makes real state changes (creates two real user accounts, a real match,
// messages, a report, a block) — do not run it against a real production database without
// a clear plan to delete the resulting test data afterward (see GO_LIVE_CHECKLIST.md's
// "Launch verification" step 12).

import fs from "fs";
import { execSync } from "child_process";

const BASE = process.env.BASE_URL || "http://127.0.0.1:3005";
const DATABASE_URL = process.env.DATABASE_URL;
const CAPTURED_EMAILS_PATH = process.env.CAPTURED_EMAILS_PATH;

const results = [];
function log(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} — ${name}${detail ? " — " + detail : ""}`);
}
function skip(name, reason) {
  results.push({ name, ok: null, detail: `SKIPPED: ${reason}` });
  console.log(`SKIP — ${name} — ${reason}`);
}

async function req(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch {}
  return { status: res.status, body: json, raw: text };
}

function readCapturedEmails() {
  if (!CAPTURED_EMAILS_PATH || !fs.existsSync(CAPTURED_EMAILS_PATH)) return null;
  return fs.readFileSync(CAPTURED_EMAILS_PATH, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l));
}

function extractTokenFromEmail(email) {
  const match = (email.text || "").match(/token=([A-Za-z0-9_-]+)/) || (email.html || "").match(/token=([A-Za-z0-9_-]+)/);
  return match ? match[1] : null;
}

function psql(sql) {
  if (!DATABASE_URL) return null;
  // psql's own URI parser doesn't understand Prisma's `?schema=` query param (Postgres's
  // default search_path already includes "public", which is all this schema uses) — strip
  // any query string before handing the URL to psql.
  const psqlUrl = DATABASE_URL.split("?")[0];
  return execSync(`psql "${psqlUrl}" -t -c "${sql.replace(/"/g, '\\"')}"`, { encoding: "utf8" }).trim();
}

const stamp = Date.now();
const userA = { email: `launch-verify-a-${stamp}@example.com`, password: "correcthorse123", dateOfBirth: "1994-03-15" };
const userB = { email: `launch-verify-b-${stamp}@example.com`, password: "correcthorse123", dateOfBirth: "1996-07-22" };

async function main() {
  console.log(`Running launch verification against ${BASE}\n`);

  let r = await req("/live");
  log("GET /live", r.status === 200, `status=${r.status}`);
  r = await req("/ready");
  log("GET /ready (database + redis up)", r.status === 200 && r.body?.details?.database?.status === "up", JSON.stringify(r.body?.details));
  r = await req("/health");
  log("GET /health", r.status === 200, `status=${r.status}`);
  r = await req("/metrics");
  log("GET /metrics reachable", r.status === 200, `status=${r.status}`);

  r = await req("/auth/register", { method: "POST", body: userA });
  log("User registration (A)", r.status === 201 && !!r.body?.user?.id, `status=${r.status}`);
  const aTokens = r.body?.tokens;
  const aId = r.body?.user?.id;

  r = await req("/auth/register", { method: "POST", body: userB });
  log("User registration (B)", r.status === 201 && !!r.body?.user?.id, `status=${r.status}`);
  const bTokens = r.body?.tokens;
  const bId = r.body?.user?.id;

  if (!aId || !bId) {
    console.log("\nRegistration failed for at least one test account — aborting the rest of the journey.");
    printSummary();
    process.exit(1);
  }

  r = await req("/auth/email/verification/request", { method: "POST", token: aTokens.accessToken });
  log("Email verification requested", r.status === 204, `status=${r.status}`);
  const emailsAvailable = readCapturedEmails() !== null;
  if (emailsAvailable) {
    await new Promise((res) => setTimeout(res, 500));
    const verifyEmail = readCapturedEmails().find((e) => e.to?.includes(userA.email) && /verif/i.test(e.subject || ""));
    log("Verification email captured", !!verifyEmail, verifyEmail ? `subject="${verifyEmail.subject}"` : "not found");
    const verifyToken = verifyEmail ? extractTokenFromEmail(verifyEmail) : null;
    if (verifyToken) {
      r = await req("/auth/email/verification/confirm", { method: "POST", body: { token: verifyToken } });
      log("Email verification confirm", r.status === 204, `status=${r.status}`);
    }
  } else {
    skip("Verification email content check", "no CAPTURED_EMAILS_PATH set — verify manually against a real inbox");
  }

  r = await req("/auth/password-reset/request", { method: "POST", body: { email: userB.email } });
  log("Password reset requested", r.status === 204, `status=${r.status}`);
  let bPassword = userB.password;
  if (emailsAvailable) {
    await new Promise((res) => setTimeout(res, 500));
    const resetEmail = readCapturedEmails().find((e) => e.to?.includes(userB.email) && /reset/i.test(e.subject || ""));
    log("Password reset email captured", !!resetEmail, resetEmail ? `subject="${resetEmail.subject}"` : "not found");
    const resetToken = resetEmail ? extractTokenFromEmail(resetEmail) : null;
    if (resetToken) {
      r = await req("/auth/password-reset/confirm", { method: "POST", body: { token: resetToken, newPassword: "newcorrecthorse456" } });
      log("Password reset confirm (revokes sessions)", r.status === 204, `status=${r.status}`);
      bPassword = "newcorrecthorse456";
    }
  } else {
    skip("Password reset email content check", "no CAPTURED_EMAILS_PATH set — verify manually against a real inbox");
  }

  r = await req("/auth/login", { method: "POST", body: { email: userB.email, password: bPassword } });
  log("Login (B)", r.status === 200, `status=${r.status}`);
  const bTokens2 = r.body?.tokens ?? bTokens;

  r = await req("/auth/refresh", { method: "POST", body: { refreshToken: aTokens.refreshToken } });
  log("Refresh token rotation", r.status === 200 && !!r.body?.accessToken, `status=${r.status}`);
  const aTokensRotated = r.body;
  r = await req("/auth/refresh", { method: "POST", body: { refreshToken: aTokens.refreshToken } });
  log("Refresh token reuse detection (expect 401)", r.status === 401, `status=${r.status}`);
  r = await req("/auth/refresh", { method: "POST", body: { refreshToken: aTokensRotated?.refreshToken } });
  log("Reuse detection revoked the whole session (expect 401)", r.status === 401, `status=${r.status}`);

  r = await req("/auth/login", { method: "POST", body: { email: userA.email, password: userA.password } });
  const aTokensFinal = r.body?.tokens;
  log("Re-login (A) after session revocation", r.status === 200, `status=${r.status}`);

  r = await req("/moderation-cases", { token: aTokensFinal.accessToken });
  log("RBAC blocks non-moderator from moderation queue (expect 403)", r.status === 403, `status=${r.status}`);
  r = await req("/moderation-cases");
  log("RBAC blocks unauthenticated access (expect 401)", r.status === 401, `status=${r.status}`);

  let grantedModerator = false;
  if (DATABASE_URL) {
    try {
      psql(`INSERT INTO user_roles ("userId", "roleId") SELECT '${aId}', id FROM roles WHERE key='moderator' ON CONFLICT DO NOTHING;`);
      grantedModerator = true;
      log("Granted moderator role to user A via direct DB operation", true);
    } catch (e) {
      log("Granted moderator role to user A via direct DB operation", false, e.message);
    }
  } else {
    skip("Grant moderator role / moderation-queue checks", "no DATABASE_URL set for a direct grant");
  }

  if (grantedModerator) {
    r = await req("/moderation-cases", { token: aTokensFinal.accessToken });
    log("Live DB permission check takes effect without re-login", r.status === 200, `status=${r.status}`);
  }

  r = await req("/profiles/me", { method: "PUT", token: aTokensFinal.accessToken, body: { displayName: "Verify A", intent: "SERIOUS", city: "Testville" } });
  log("Create profile (A)", r.status === 200, `status=${r.status}`);
  r = await req("/profiles/me", { method: "PUT", token: bTokens2.accessToken, body: { displayName: "Verify B", intent: "SERIOUS", city: "Testville" } });
  log("Create profile (B)", r.status === 200, `status=${r.status}`);

  r = await req("/matching/candidates", { token: bTokens2.accessToken });
  log("List matching candidates", r.status === 200 && Array.isArray(r.body), `status=${r.status}`);

  r = await req("/matching/likes", { method: "POST", token: aTokensFinal.accessToken, body: { targetId: bId, action: "LIKE" } });
  log("Record like (A -> B)", r.status === 201, `status=${r.status}`);
  r = await req("/matching/likes", { method: "POST", token: bTokens2.accessToken, body: { targetId: aId, action: "LIKE" } });
  const matchId = r.body?.match?.id;
  log("Reciprocal like creates a match", r.status === 201 && !!matchId, `matchId=${matchId}`);

  if (matchId) {
    r = await req(`/conversations/${matchId}/messages`, { method: "POST", token: aTokensFinal.accessToken, body: { body: "Launch verification message", kind: "TEXT" } });
    log("Send message", r.status === 201, `status=${r.status}`);
    r = await req(`/conversations/${matchId}/messages`, { token: bTokens2.accessToken });
    log("List messages", r.status === 200 && r.body?.items?.length > 0, `count=${r.body?.items?.length}`);
  }

  r = await req("/profiles/me/photos/upload-url", { method: "POST", token: aTokensFinal.accessToken, body: { contentType: "image/jpeg" } });
  log("Presigned photo upload URL issued", r.status === 201 && !!r.body?.uploadUrl, `status=${r.status}`);
  const { uploadUrl, storageKey } = r.body || {};
  if (uploadUrl) {
    const jpegPath = process.env.TEST_JPEG_PATH;
    const jpegBytes = jpegPath && fs.existsSync(jpegPath)
      ? fs.readFileSync(jpegPath)
      : Buffer.from("not-a-real-jpeg-set-TEST_JPEG_PATH-for-a-full-thumbnail-check");
    const putRes = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": "image/jpeg" }, body: jpegBytes });
    log("Real PUT of photo bytes to presigned URL", putRes.ok, `status=${putRes.status}`);

    r = await req("/profiles/me/photos", { method: "POST", token: aTokensFinal.accessToken, body: { storageKey, isPrimary: true } });
    log("Register uploaded photo", r.status === 201, `status=${r.status}`);

    r = await req("/profiles/me/photos", { method: "POST", token: bTokens2.accessToken, body: { storageKey, isPrimary: true } });
    log("Cross-tenant photo hijack blocked (expect 403)", r.status === 403, `status=${r.status}`);

    let photo = null;
    for (let i = 0; i < 10; i += 1) {
      await new Promise((res) => setTimeout(res, 500));
      r = await req("/profiles/me", { token: aTokensFinal.accessToken });
      photo = r.body?.photos?.[0];
      if (photo?.thumbnailUrl) break;
    }
    log("Photo response never exposes raw storageKey", !!photo && !("storageKey" in photo), photo ? `keys=${Object.keys(photo).join(",")}` : "no photo");
    if (jpegPath) {
      log("Thumbnail generated asynchronously", !!photo?.thumbnailUrl, photo ? `thumbnailUrl=${photo.thumbnailUrl ? "present" : "absent"}` : "n/a");
    } else {
      skip("Thumbnail generation check", "set TEST_JPEG_PATH to a real .jpg file to exercise the real Jimp decode path");
    }
  }

  r = await req("/reports", { method: "POST", token: bTokens2.accessToken, body: { subjectId: aId, reason: "HARASSMENT", details: "Launch verification report" } });
  log("File a report", r.status === 201, `status=${r.status}`);

  if (grantedModerator) {
    r = await req("/moderation-cases", { token: aTokensFinal.accessToken });
    log("Moderator sees the auto-created moderation case", r.status === 200 && r.body?.items?.length > 0, `count=${r.body?.items?.length}`);
    const caseId = r.body?.items?.[0]?.id;
    if (caseId) {
      r = await req(`/moderation-cases/${caseId}/resolve`, { method: "PATCH", token: aTokensFinal.accessToken, body: { action: "WARNING", notes: "Launch verification resolve" } });
      log("Moderator resolves case", r.status === 200, `status=${r.status}`);
    }
  }

  r = await req("/blocks", { method: "POST", token: bTokens2.accessToken, body: { blockedId: aId } });
  log("Create block", r.status === 201, `status=${r.status}`);
  r = await req("/matching/candidates", { token: bTokens2.accessToken });
  const blockedStillPresent = (r.body || []).some((c) => c.userId === aId);
  log("Blocked user excluded from candidate deck", !blockedStillPresent, `status=${r.status}`);

  r = await req("/auth/logout", { method: "POST", token: bTokens2.accessToken, body: { refreshToken: bTokens2.refreshToken } });
  log("Logout", r.status === 204, `status=${r.status}`);
  r = await req("/matching/matches", { token: bTokens2.accessToken });
  log("Blacklisted access token rejected immediately after logout", r.status === 401, `status=${r.status}`);

  if (DATABASE_URL) {
    try {
      const out = psql(`SELECT count(*) FROM audit_logs WHERE "createdAt" > now() - interval '10 minutes';`);
      log("Audit log entries written for this run's actions", parseInt(out, 10) > 0, `count=${out}`);
    } catch (e) {
      log("Audit log entries written for this run's actions", false, e.message);
    }
  } else {
    skip("Audit log verification", "no DATABASE_URL set");
  }

  printSummary();
}

function printSummary() {
  console.log("\n=== SUMMARY ===");
  const passed = results.filter((r) => r.ok === true).length;
  const failed = results.filter((r) => r.ok === false);
  const skipped = results.filter((r) => r.ok === null).length;
  console.log(`${passed}/${results.length - skipped} checks passed (${skipped} skipped)`);
  if (failed.length) {
    console.log("FAILED:");
    failed.forEach((f) => console.log(` - ${f.name} (${f.detail})`));
  }
  const outPath = process.env.RESULTS_JSON_PATH || "./launch-verification-results.json";
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  if (failed.length) process.exitCode = 1;
}

main().catch((e) => {
  console.error("FATAL", e);
  process.exit(1);
});
