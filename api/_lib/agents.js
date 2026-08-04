// Veridian Social's AI workforce — registry-based, per
// ops/veridian-platform-strategy.md Task 2/3: each agent is a row here
// (name, model, prompt builder), not a bespoke integration. MVP ships 2 of
// the 10 agents named in the master prompt (Brand Strategist,
// Content Strategist+Copywriter combined) — see the strategy doc's Task 5
// simplification pass for why the other 8 are deferred past MVP.

export const AGENTS = {
  brandVoice: {
    model: "claude-sonnet-4-6",
    maxTokens: 500,
    system:
      "You are the Brand Strategist for Veridian Social. Given a business's raw description, " +
      "produce a concise, reusable BRAND VOICE brief that other AI agents will use as their " +
      "system prompt when writing content for this business. Cover: tone (3-5 adjectives), " +
      "target audience, topics to lean into, topics/phrasing to avoid, and one example sentence " +
      "in the brand's voice. Output plain text, under 200 words, no headers or markdown.",
    buildMessages: (input) => [{
      role: "user",
      content: `Business name: ${input.businessName}\nIndustry: ${input.industry || "unspecified"}\nDescription: ${input.description}\nDesired tone: ${input.tone || "let it emerge from the description"}\nTarget audience: ${input.targetAudience || "unspecified"}`,
    }],
  },

  drafts: {
    model: "claude-sonnet-4-6",
    maxTokens: 1200,
    system:
      "You are the Content Strategist and Copywriter for Veridian Social. Given a BRAND VOICE " +
      "brief and a topic, write social media post drafts. Every draft must sound like it was " +
      "written by the business owner, not an AI. Respond with ONLY a JSON array, no prose before " +
      'or after, in this exact shape: [{"caption": "...", "hashtags": "#a #b #c"}]. ' +
      "Do not wrap the JSON in markdown code fences.",
    buildMessages: (input) => [{
      role: "user",
      content: `BRAND VOICE:\n${input.brandVoice}\n\nTOPIC / OCCASION: ${input.topic}\n\nGenerate ${input.count || 3} distinct draft posts.`,
    }],
  },
};

export function getAgent(key) {
  return AGENTS[key] || null;
}

// Best-effort JSON parse for agents (like "drafts") whose contract is
// structured output — models occasionally wrap JSON in prose or fences
// despite instructions, so this recovers instead of hard-failing.
export function parseJsonResponse(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\[[\s\S]*\]/);
    if (match) {
      try { return JSON.parse(match[0]); } catch { /* fall through */ }
    }
    return null;
  }
}
