import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import type { AppConfig } from "../../config/configuration";

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
  constructor(configService: ConfigService) {
    const jwtConfig = configService.getOrThrow<AppConfig["jwt"]>("app.jwt");
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConfig.accessSecret,
    });
  }

  // Runs only after passport-jwt has already verified the signature and expiry, so this
  // is purely about shaping what ends up on `request.user` — not re-validating the token.
  validate(payload: JwtAccessPayload): AuthenticatedUser {
    return { id: payload.sub, email: payload.email, roles: payload.roles };
  }
}
