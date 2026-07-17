import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsBoolean, IsInt, IsOptional, Max, Min } from "class-validator";

export class UpsertPreferencesDto {
  @ApiPropertyOptional({ minimum: 18 })
  @IsOptional()
  @IsInt()
  @Min(18)
  @Max(120)
  ageMin?: number;

  @ApiPropertyOptional({ minimum: 18 })
  @IsOptional()
  @IsInt()
  @Min(18)
  @Max(120)
  ageMax?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 500 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  maxDistanceKm?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  seekingGenders?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  verifiedOnly?: boolean;
}
