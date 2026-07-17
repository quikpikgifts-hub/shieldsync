import { Body, Controller, HttpCode, HttpStatus, Post, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import type { Request } from "express";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Public } from "../common/decorators/public.decorator";
import type { AuthenticatedUser } from "./strategies/jwt.strategy";
import { AuthService, type SessionMetadata } from "./auth.service";
import { PasswordResetService } from "./password-reset.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { RefreshDto } from "./dto/refresh.dto";
import { VerifyEmailDto } from "./dto/verify-email.dto";
import { RequestPasswordResetDto } from "./dto/request-password-reset.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";

// Read directly from process.env (same convention as ThrottlerModule.forRootAsync's own
// useFactory in app.module.ts) rather than hardcoded literals, so CI/e2e environments can
// raise it the same way they already raise THROTTLE_LIMIT — this matters specifically
// because SECURITY_AUDIT.md H-3's fix (Redis-backed, cross-instance-correct throttler
// storage) means the counter now persists across an entire e2e test run instead of
// resetting per test-suite process the way the old in-memory storage did.
const STRICT_AUTH_THROTTLE = {
  limit: parseInt(process.env.LOGIN_THROTTLE_LIMIT ?? "5", 10),
  ttl: parseInt(process.env.LOGIN_THROTTLE_TTL_MS ?? "60000", 10),
};

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly passwordResetService: PasswordResetService,
  ) {}

  @Public()
  @Post("register")
  @ApiOperation({ summary: "Create an account and receive an initial token pair." })
  async register(@Body() dto: RegisterDto, @Req() req: Request) {
    return this.authService.register(dto, sessionMetadataFrom(req));
  }

  @Public()
  @Throttle({ default: STRICT_AUTH_THROTTLE }) // tighter than the global default — this is the endpoint credential-stuffing hits
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

  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post("logout")
  @ApiOperation({ summary: "Revoke the session behind the given refresh token." })
  async logout(@Body() dto: RefreshDto, @CurrentUser() user: AuthenticatedUser): Promise<void> {
    await this.authService.logout(dto.refreshToken, { id: user.id, jti: user.jti, exp: user.exp });
  }

  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post("email/verification/request")
  @ApiOperation({ summary: "Send (or resend) a verification email for the authenticated account." })
  async requestEmailVerification(@CurrentUser() user: AuthenticatedUser): Promise<void> {
    await this.passwordResetService.requestEmailVerification(user.id);
  }

  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post("email/verification/confirm")
  @ApiOperation({ summary: "Confirm an email address using the token from the verification email." })
  async confirmEmailVerification(@Body() dto: VerifyEmailDto): Promise<void> {
    await this.passwordResetService.verifyEmail(dto.token);
  }

  @Public()
  @Throttle({ default: STRICT_AUTH_THROTTLE }) // same rationale as login — this is the endpoint an attacker would hit to spam a victim's inbox
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post("password-reset/request")
  @ApiOperation({ summary: "Request a password-reset email. Always returns 204, whether or not the account exists." })
  async requestPasswordReset(@Body() dto: RequestPasswordResetDto, @Req() req: Request): Promise<void> {
    await this.passwordResetService.requestPasswordReset(dto.email, sessionMetadataFrom(req));
  }

  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post("password-reset/confirm")
  @ApiOperation({ summary: "Set a new password using the token from the reset email. Revokes every other session." })
  async confirmPasswordReset(@Body() dto: ResetPasswordDto, @Req() req: Request): Promise<void> {
    await this.passwordResetService.resetPassword(dto.token, dto.newPassword, sessionMetadataFrom(req));
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
