import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";
import { IsStrongPassword } from "../../common/decorators/is-strong-password.decorator";

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty({ description: "Minimum 10 characters, at least one letter and one number." })
  @IsStrongPassword()
  newPassword!: string;
}
