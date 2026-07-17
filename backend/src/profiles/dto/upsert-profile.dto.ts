import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Intent } from "@prisma/client";
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class UpsertProfileDto {
  // PUT /profiles/me is create-or-replace, and Profile.displayName is NOT NULL in the
  // schema — this field really is required, not optional. It was previously documented
  // as @ApiPropertyOptional() while being enforced as required by validation, which is
  // exactly the doc/behavior mismatch this fixes rather than papering over.
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  displayName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;

  @ApiPropertyOptional({ enum: Intent })
  @IsOptional()
  @IsEnum(Intent)
  intent?: Intent;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  region?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  country?: string;
}
