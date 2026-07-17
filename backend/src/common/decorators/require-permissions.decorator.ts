import { SetMetadata } from "@nestjs/common";

export const PERMISSIONS_KEY = "permissions";

/**
 * Marks a route as requiring all of the given permission keys (see PermissionsGuard).
 * Use this for fine-grained checks (e.g. "reports.resolve"); use @Roles() when a coarser
 * "must be a moderator" check is sufficient — many routes only need one or the other.
 */
export const RequirePermissions = (...permissions: string[]): MethodDecorator & ClassDecorator =>
  SetMetadata(PERMISSIONS_KEY, permissions);
