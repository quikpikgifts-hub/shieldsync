import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { MessageKind } from "@prisma/client";
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateIf } from "class-validator";

export class SendMessageDto {
  @ApiPropertyOptional({ enum: MessageKind, default: MessageKind.TEXT })
  @IsOptional()
  @IsEnum(MessageKind)
  kind: MessageKind = MessageKind.TEXT;

  @ApiProperty({ required: false })
  @ValidateIf((dto: SendMessageDto) => dto.kind === MessageKind.TEXT)
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  body?: string;

  @ApiPropertyOptional({ description: "Object storage key for voice notes." })
  @ValidateIf((dto: SendMessageDto) => dto.kind === MessageKind.VOICE)
  @IsString()
  mediaStorageKey?: string;
}
