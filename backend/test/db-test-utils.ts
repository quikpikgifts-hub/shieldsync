import type { PrismaClient } from "@prisma/client";

// Tables holding user-generated data — truncated between test suites. The RBAC catalog
// (roles/permissions/role_permissions) is deliberately excluded: it's fixed reference
// data seeded once, not something individual tests create or should ever wipe.
const RESETTABLE_TABLES = [
  "audit_logs",
  "notifications",
  "subscriptions",
  "messages",
  "conversations",
  "matches",
  "likes",
  "moderation_cases",
  "reports",
  "blocks",
  "photos",
  "prompt_answers",
  "preferences",
  "profiles",
  "refresh_tokens",
  "sessions",
  "user_roles",
  "users",
];

export async function resetDatabase(prisma: PrismaClient): Promise<void> {
  const tableList = RESETTABLE_TABLES.map((t) => `"${t}"`).join(", ");
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE;`);
}
