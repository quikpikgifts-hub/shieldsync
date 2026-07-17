import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ArrayMaxSize, IsArray, IsString, MaxLength, ValidateNested } from "class-validator";

class PromptAnswerEntry {
  @ApiProperty()
  @IsString()
  @MaxLength(200)
  promptKey!: string;

  @ApiProperty()
  @IsString()
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
