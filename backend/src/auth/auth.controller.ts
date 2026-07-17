import { Body, Controller, HttpCode, HttpStatus, Post, Req } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import type { Request } from "express";
import { Public } from "../common/decorators/public.decorator";
import { AuthService, type SessionMetadata } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { RefreshDto } from "./dto/refresh.dto";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("register")
  @ApiOperation({ summary: "Create an account and receive an initial token pair." })
  async register(@Body() dto: RegisterDto, @Req() req: Request) {
    return this.authService.register(dto, sessionMetadataFrom(req));
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } }) // tighter than the global default — this is the endpoint credential-stuffing hits
  @HttpCode(HttpStatus.OK)
  @Post("login")
  @ApiOperation({ summary: "Exchange email + password for a token pair." })
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto, sessionMetadataFrom(req));
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post("refresh")
  @ApiOperation({ summary: "Rotate a refresh token for a new access + refresh token pair." })
  async refresh(@Body() dto: RefreshDto, @Req() req: Request) {
    return this.authService.refresh(dto.refreshToken, sessionMetadataFrom(req));
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post("logout")
  @ApiOperation({ summary: "Revoke the session behind the given refresh token." })
  async logout(@Body() dto: RefreshDto): Promise<void> {
    await this.authService.logout(dto.refreshToken);
  }
}

function sessionMetadataFrom(req: Request): SessionMetadata {
  return {
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    deviceFingerprint: typeof req.headers["x-device-fingerprint"] === "string"
      ? req.headers["x-device-fingerprint"]
      : undefined,
  };
}
