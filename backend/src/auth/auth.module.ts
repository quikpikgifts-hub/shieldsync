import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuditModule } from "../audit/audit.module";
import { EmailModule } from "../email/email.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { PasswordResetService } from "./password-reset.service";
import { AccountLockoutService } from "./account-lockout.service";
import { TokenBlacklistService } from "./token-blacklist.service";
import { JwtStrategy } from "./strategies/jwt.strategy";

@Module({
  imports: [PassportModule, JwtModule.register({}), AuditModule, EmailModule],
  controllers: [AuthController],
  providers: [AuthService, PasswordResetService, AccountLockoutService, TokenBlacklistService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
