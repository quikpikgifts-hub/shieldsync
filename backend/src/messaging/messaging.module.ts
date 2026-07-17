import { Module } from "@nestjs/common";
import { SafetyModule } from "../safety/safety.module";
import { MessagingController } from "./messaging.controller";
import { MessagingService } from "./messaging.service";

@Module({
  imports: [SafetyModule],
  controllers: [MessagingController],
  providers: [MessagingService],
})
export class MessagingModule {}
