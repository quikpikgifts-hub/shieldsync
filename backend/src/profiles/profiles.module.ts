import { Module } from "@nestjs/common";
import { ProfilesController } from "./profiles.controller";
import { ProfilesService } from "./profiles.service";
import { ThumbnailService } from "./thumbnail.service";

@Module({
  controllers: [ProfilesController],
  providers: [ProfilesService, ThumbnailService],
  exports: [ProfilesService],
})
export class ProfilesModule {}
