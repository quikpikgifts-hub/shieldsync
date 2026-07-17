import { ApiProperty } from "@nestjs/swagger";
import { PhotoModerationStatus } from "@prisma/client";
import { IsEnum } from "class-validator";

export class SetPhotoModerationDto {
  @ApiProperty({ enum: PhotoModerationStatus })
  @IsEnum(PhotoModerationStatus)
  status!: PhotoModerationStatus;
}
