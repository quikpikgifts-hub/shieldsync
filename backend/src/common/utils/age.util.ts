/**
 * Computes whole years of age from a date of birth. Used anywhere age needs to be shown
 * (to the account owner, or to another user viewing a candidate/match) — raw dateOfBirth
 * must never be returned by an API response to anyone but the account owner themselves,
 * since exact birth date is more identifying than a person's age in years.
 */
export function computeAge(dateOfBirth: Date): number {
  const now = new Date();
  let age = now.getUTCFullYear() - dateOfBirth.getUTCFullYear();
  const hasHadBirthdayThisYear =
    now.getUTCMonth() > dateOfBirth.getUTCMonth() ||
    (now.getUTCMonth() === dateOfBirth.getUTCMonth() && now.getUTCDate() >= dateOfBirth.getUTCDate());
  if (!hasHadBirthdayThisYear) {
    age -= 1;
  }
  return age;
}
