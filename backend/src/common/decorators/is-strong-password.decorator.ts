import { applyDecorators } from "@nestjs/common";
import { IsString, Matches, MaxLength, MinLength } from "class-validator";

// Single source of truth for password policy — used by both registration and password
// reset, so a future policy change (e.g. raising the minimum length) can't be applied to
// one and silently missed on the other.
export function IsStrongPassword(): PropertyDecorator {
  return applyDecorators(
    IsString(),
    MinLength(10),
    MaxLength(128),
    Matches(/(?=.*[A-Za-z])(?=.*\d)/, {
      message: "password must contain at least one letter and one number",
    }),
  );
}
