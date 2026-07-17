import { Module } from "@nestjs/common";
import { NotificationEmailService } from "./notification-email.service";

@Module({
  providers: [NotificationEmailService],
  exports: [NotificationEmailService],
})
export class EmailModule {}
