export const AI_PROVIDER = Symbol("AI_PROVIDER");

export interface GenerateIcebreakerInput {
  promptAnswer: string;
  tone?: "playful" | "sincere";
}

export interface ModerateTextInput {
  text: string;
}

export interface ModerateTextResult {
  flagged: boolean;
  categories: string[];
}

/**
 * Contract a real OpenAI/Anthropic-backed adapter must implement. Per
 * docs/ember/ROADMAP.md Phase 3, AI features are explicitly gated to ship after the
 * human moderation queue (SafetyModule) is already operating — this interface existing
 * does not mean AI features are enabled.
 */
export interface AiProvider {
  generateIcebreaker(input: GenerateIcebreakerInput): Promise<string>;
  moderateText(input: ModerateTextInput): Promise<ModerateTextResult>;
}
