import { SetMetadata } from "@nestjs/common";

export const ROLES_KEY = "roles";

/** Marks a route as requiring one of the given role keys (see RolesGuard). */
export const Roles = (...roles: string[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);
