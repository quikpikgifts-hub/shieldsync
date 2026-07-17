import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "../../prisma/prisma.service";
import { PERMISSIONS_KEY } from "../decorators/require-permissions.decorator";
import type { AuthenticatedUser } from "../../auth/strategies/jwt.strategy";

/**
 * Checks permission grants live against the database rather than trusting a permission
 * list embedded in the access token — permission changes (e.g. revoking a moderator's
 * access) take effect immediately rather than waiting for the token to expire or refresh.
 * This costs one extra query on permission-gated routes, which are low-traffic
 * (moderator/admin actions), not the general request path.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[] | undefined>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException("Authentication required");
    }

    const grants = await this.prisma.userRole.findMany({
      where: { userId: user.id },
      include: { role: { include: { permissions: { include: { permission: true } } } } },
    });

    const granted = new Set(
      grants.flatMap((grant) => grant.role.permissions.map((rp) => rp.permission.key)),
    );

    const hasAll = required.every((key) => granted.has(key));
    if (!hasAll) {
      throw new ForbiddenException("Missing required permission for this operation");
    }

    return true;
  }
}
