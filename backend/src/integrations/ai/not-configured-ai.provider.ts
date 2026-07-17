import { Injectable } from "@nestjs/common";
import { IntegrationNotConfiguredError } from "../integration-not-configured.error";
import type {
  AiProvider,
  GenerateIcebreakerInput,
  ModerateTextInput,
  ModerateTextResult,
} from "./ai-provider.interface";

@Injectable()
export class NotConfiguredAiProvider implements AiProvider {
  generateIcebreaker(_input: GenerateIcebreakerInput): Promise<string> {
    throw new IntegrationNotConfiguredError("AI provider", "OPENAI_API_KEY / ANTHROPIC_API_KEY");
  }

  moderateText(_input: ModerateTextInput): Promise<ModerateTextResult> {
    throw new IntegrationNotConfiguredError("AI provider", "OPENAI_API_KEY / ANTHROPIC_API_KEY");
  }
}
