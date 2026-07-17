import { ApiProperty } from "@nestjs/swagger";
import { LikeAction } from "@prisma/client";
import { IsEnum, IsUUID } from "class-validator";

export class CreateLikeDto {
  @ApiProperty()
  @IsUUID()
  targetId!: string;

  @ApiProperty({ enum: LikeAction })
  @IsEnum(LikeAction)
  action!: LikeAction;
}
