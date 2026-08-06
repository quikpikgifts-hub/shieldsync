// Shared env-cleaning + Resend send helper.
// Consolidates the cleanEnv()/sendEmail() copies previously duplicated across
// contact.js, assessment.js, book.js, follow-up.js.

export function cleanEnv(v) {
  return (v || "").replace(/^=+/, "").trim();
}

export async function sendEmail(apiKey, payload, label, logPrefix = "email") {
  console.log(`[${logPrefix}] send: ${label} → to=${JSON.stringify(payload.to)} from=${payload.from}`);
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      console.error(`[${logPrefix}] RESEND FAIL: ${label} — HTTP ${r.status} —`, JSON.stringify(data));
    } else {
      console.log(`[${logPrefix}] RESEND OK: ${label} — id=${data.id}`);
    }
    return { ok: r.ok, status: r.status, data };
  } catch (err) {
    console.error(`[${logPrefix}] RESEND ERROR: ${label} —`, err?.message || String(err));
    return { ok: false, error: err?.message };
  }
}
