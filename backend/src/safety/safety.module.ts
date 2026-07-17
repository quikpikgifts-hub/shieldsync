import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { ReportsController } from "./reports.controller";
import { ReportsService } from "./reports.service";
import { BlocksController } from "./blocks.controller";
import { BlocksService } from "./blocks.service";
import { ModerationController } from "./moderation.controller";
import { ModerationService } from "./moderation.service";

@Module({
  imports: [AuditModule],
  controllers: [ReportsController, BlocksController, ModerationController],
  providers: [ReportsService, BlocksService, ModerationService],
  exports: [BlocksService],
})
export class SafetyModule {}
