import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { SafetyModule } from "../safety/safety.module";
import { MatchingController } from "./matching.controller";
import { MatchingService } from "./matching.service";

@Module({
  imports: [AuditModule, SafetyModule],
  controllers: [MatchingController],
  providers: [MatchingService],
})
export class MatchingModule {}
