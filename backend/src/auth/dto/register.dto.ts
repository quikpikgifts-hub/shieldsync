import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsEmail, IsOptional, IsPhoneNumber, IsString, Matches, MaxLength, MinLength } from "class-validator";

export class RegisterDto {
  @ApiProperty()
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @ApiProperty({ description: "Minimum 10 characters, at least one letter and one number." })
  @IsString()
  @MinLength(10)
  @MaxLength(128)
  @Matches(/(?=.*[A-Za-z])(?=.*\d)/, {
    message: "password must contain at least one letter and one number",
  })
  password!: string;

  @ApiProperty({ description: "ISO 8601 date. Used only to compute age and enforce the platform's minimum age." })
  @IsDateString()
  dateOfBirth!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsPhoneNumber(undefined, { message: "phone must be a valid E.164 phone number" })
  phone?: string;
}
