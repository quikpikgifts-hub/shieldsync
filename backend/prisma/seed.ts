/**
 * Seeds the fixed RBAC catalog (roles + permissions). This is reference data, not
 * user data — safe to run repeatedly (every write is an upsert) and required before the
 * application can accept its first registration, since AuthService assigns the "user"
 * role to every new account.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ROLES = ["user", "moderator", "admin", "support"] as const;

const PERMISSIONS = [
  { key: "reports.read", description: "View filed safety reports" },
  { key: "reports.resolve", description: "Resolve or dismiss a safety report" },
  { key: "moderation.assign", description: "Assign a moderation case to a moderator" },
  { key: "moderation.resolve", description: "Take action on a moderation case" },
  { key: "users.read", description: "View another user's account record" },
  { key: "users.ban", description: "Suspend or ban a user account" },
  { key: "users.role_change", description: "Grant or revoke a role from a user" },
  { key: "audit.read", description: "Read the audit log" },
] as const;

const ROLE_PERMISSIONS: Record<(typeof ROLES)[number], (typeof PERMISSIONS)[number]["key"][]> = {
  user: [],
  support: ["reports.read", "users.read"],
  moderator: ["reports.read", "reports.resolve", "moderation.assign", "moderation.resolve", "users.read"],
  admin: PERMISSIONS.map((p) => p.key),
};

async function main(): Promise<void> {
  for (const key of ROLES) {
    await prisma.role.upsert({ where: { key }, update: {}, create: { key } });
  }

  for (const permission of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: permission.key },
      update: { description: permission.description },
      create: permission,
    });
  }

  for (const roleKey of ROLES) {
    const role = await prisma.role.findUniqueOrThrow({ where: { key: roleKey } });
    const permissionKeys = ROLE_PERMISSIONS[roleKey];

    for (const permissionKey of permissionKeys) {
      const permission = await prisma.permission.findUniqueOrThrow({ where: { key: permissionKey } });
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
    }
  }

  // eslint-disable-next-line no-console
  console.log(`Seeded ${ROLES.length} roles and ${PERMISSIONS.length} permissions.`);
}

main()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
