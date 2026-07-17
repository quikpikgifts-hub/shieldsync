import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class AddPhotoDto {
  @ApiProperty({ description: "Object storage key returned by the storage provider after upload." })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1024)
  storageKey!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  blurredUntilMatch?: boolean;
}
