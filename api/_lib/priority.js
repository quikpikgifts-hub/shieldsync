// Two distinct priority scorers (different input shapes — not duplicates of
// each other), consolidated here so both live in one reviewable place instead
// of being re-typed per route.

const URGENT_WORDS = ["urgent", "immediately", "asap", "losing", "crisis", "emergency", "now"];

// Used by contact.js — scores from the revenue calculator + free-text challenge.
export function priorityFromRevenue(annual, challenge) {
  const isUrgent = URGENT_WORDS.some((w) => (challenge || "").toLowerCase().includes(w));
  if (isUrgent || annual >= 200000) return "HOT";
  if (annual >= 75000) return "HIGH";
  if (annual >= 25000) return "MEDIUM";
  return "LOW";
}

// Used by assessment.js — scores from the readiness assessment's overall percentage.
export function priorityFromScore(overallPct) {
  const pct = overallPct ?? 100;
  if (pct < 40) return "HOT";
  if (pct < 60) return "HIGH";
  if (pct < 80) return "MEDIUM";
  return "LOW";
}
