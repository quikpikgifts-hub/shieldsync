import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsEmail, IsOptional, IsPhoneNumber, MaxLength } from "class-validator";
import { IsStrongPassword } from "../../common/decorators/is-strong-password.decorator";

export class RegisterDto {
  @ApiProperty()
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @ApiProperty({ description: "Minimum 10 characters, at least one letter and one number." })
  @IsStrongPassword()
  password!: string;

  @ApiProperty({ description: "ISO 8601 date. Used only to compute age and enforce the platform's minimum age." })
  @IsDateString()
  dateOfBirth!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsPhoneNumber(undefined, { message: "phone must be a valid E.164 phone number" })
  phone?: string;
}
