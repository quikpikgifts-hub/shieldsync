import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import type { AppConfig } from "../../config/configuration";
import { PrismaService } from "../../prisma/prisma.service";

export interface JwtAccessPayload {
  sub: string;
  email: string;
  roles: string[];
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  roles: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const jwtConfig = configService.getOrThrow<AppConfig["jwt"]>("app.jwt");
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConfig.accessSecret,
    });
  }

  // Runs only after passport-jwt has already verified the signature and expiry. A valid
  // signature only proves the token was once legitimately issued — it says nothing about
  // whether the account behind it has since been banned, suspended, or deleted. Without a
  // live check here, a moderator's ban/suspend action (which does revoke Sessions and
  // RefreshTokens — see ModerationService.resolve) has no effect on an access token
  // already in the holder's hands until it naturally expires. Roles are also re-read live
  // rather than trusted from the token, so a role change takes effect on the next request
  // instead of waiting out the access token's TTL.
  async validate(payload: JwtAccessPayload): Promise<AuthenticatedUser> {
    const user = await this.prisma.users.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, status: true, deletedAt: true, roles: { select: { role: { select: { key: true } } } } },
    });

    if (!user || user.deletedAt || user.status !== "ACTIVE") {
      throw new UnauthorizedException("This account is no longer active.");
    }

    return { id: user.id, email: user.email, roles: user.roles.map((r) => r.role.key) };
  }
}
