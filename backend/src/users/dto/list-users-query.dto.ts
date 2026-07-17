import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString } from "class-validator";
import { PaginationQueryDto } from "../../common/dto/pagination-query.dto";
import { UserStatus } from "@prisma/client";

export class ListUsersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: UserStatus })
  @IsOptional()
  @IsIn(Object.values(UserStatus))
  status?: UserStatus;

  @ApiPropertyOptional({ description: "Case-insensitive partial match on email" })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ enum: ["createdAt", "email"], default: "createdAt" })
  @IsOptional()
  @IsIn(["createdAt", "email"])
  sortBy: "createdAt" | "email" = "createdAt";
}
