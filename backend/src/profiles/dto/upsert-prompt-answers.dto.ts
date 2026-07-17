import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ArrayMaxSize, IsArray, IsNotEmpty, IsString, MaxLength, ValidateNested } from "class-validator";

class PromptAnswerEntry {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  promptKey!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  answer!: string;
}

export class UpsertPromptAnswersDto {
  @ApiProperty({ type: [PromptAnswerEntry] })
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => PromptAnswerEntry)
  answers!: PromptAnswerEntry[];
}
