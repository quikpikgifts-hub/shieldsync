// Veridian Social's AI workforce — registry-based, per
// ops/veridian-platform-strategy.md Task 2/3: each agent is a row here
// (name, model, prompt builder), not a bespoke integration. Ships 4 of
// the roles named in the master prompt (Brand Strategist, Content
// Strategist/Copywriter combined, Video Assistant) — the rest (Trend
// Analyst, Publisher-as-AI, Community Manager, Analytics Advisor, Growth
// Advisor) are deferred, per the strategy doc's simplification pass.

const PLATFORM_NORMS = {
  instagram: "Instagram: visual-first, caption can run long but the hook must land in the first line before 'more' truncation. Emoji are welcome.",
  facebook: "Facebook: conversational, slightly longer captions read fine, favor a clear call-to-action.",
  tiktok: "TikTok: caption is short and punchy, the hook must work as spoken narration too, casual tone.",
  linkedin: "LinkedIn: professional but human, no emoji spam, lead with the insight or result, avoid hard selling.",
  youtube: "YouTube: this is a description, not a caption — include a one-line hook, then context, keep it scannable.",
  x: "X (Twitter): hard 280 character limit for the caption. Be direct. Hashtags should be minimal (0-2).",
  pinterest: "Pinterest: caption should be keyword-rich and describe what's pinned, since Pinterest is a search engine as much as a feed.",
  general: "No specific platform chosen yet — keep the caption portable across Instagram/Facebook/LinkedIn without platform-specific formatting.",
};

function platformNote(platform) {
  return PLATFORM_NORMS[platform] || PLATFORM_NORMS.general;
}

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
      "brief, a topic, and a target platform, write social media post drafts. Every draft must " +
      "sound like it was written by the business owner, not an AI. Respect the target platform's " +
      "norms exactly as described. Respond with ONLY a JSON array, no prose before or after, in " +
      'this exact shape: [{"caption": "...", "hashtags": "#a #b #c"}]. ' +
      "Do not wrap the JSON in markdown code fences.",
    buildMessages: (input) => [{
      role: "user",
      content: `BRAND VOICE:\n${input.brandVoice}\n\nTOPIC / OCCASION: ${input.topic}\n\nTARGET PLATFORM: ${input.platform || "general"} — ${platformNote(input.platform)}\n\nGenerate ${input.count || 3} distinct draft posts.`,
    }],
  },

  hashtags: {
    model: "claude-haiku-4-5-20251001",
    maxTokens: 200,
    system:
      "You generate hashtag sets for Veridian Social. Given a brand voice, a caption, and a " +
      "platform, return ONLY a single line of 5-10 relevant hashtags separated by spaces, no " +
      "prose, no numbering, no markdown. Mix broad-reach and niche/specific tags. For X, return " +
      "at most 2 hashtags. For LinkedIn, return at most 3, professional tone.",
    buildMessages: (input) => [{
      role: "user",
      content: `BRAND VOICE:\n${input.brandVoice}\n\nCAPTION:\n${input.caption}\n\nPLATFORM: ${input.platform || "general"}`,
    }],
  },

  videoScript: {
    model: "claude-sonnet-4-6",
    maxTokens: 900,
    system:
      "You are the Video Assistant for Veridian Social, writing short-form video scripts " +
      "(15-45 seconds — TikTok/Reels/Shorts) in the brand's voice. Respond with ONLY a JSON " +
      'object, no prose before or after, in this exact shape: {"hook": "first 2-3 seconds, ' +
      'must stop the scroll", "beats": ["beat 1", "beat 2", "..."], "cta": "closing line", ' +
      '"onScreenText": ["short text overlay suggestions"]}. ' +
      "Do not wrap the JSON in markdown code fences. Keep beats short — each is a spoken line, not a paragraph.",
    buildMessages: (input) => [{
      role: "user",
      content: `BRAND VOICE:\n${input.brandVoice}\n\nTOPIC / OCCASION: ${input.topic}\n\nTARGET PLATFORM: ${input.platform || "tiktok"} — ${platformNote(input.platform)}`,
    }],
  },
};

export function getAgent(key) {
  return AGENTS[key] || null;
}

// Best-effort JSON parse for agents whose contract is structured output —
// models occasionally wrap JSON in prose or fences despite instructions, so
// this recovers instead of hard-failing. Handles both arrays (drafts) and
// objects (videoScript).
export function parseJsonResponse(text) {
  try {
    return JSON.parse(text);
  } catch {
    const arrayMatch = text.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      try { return JSON.parse(arrayMatch[0]); } catch { /* fall through */ }
    }
    const objectMatch = text.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      try { return JSON.parse(objectMatch[0]); } catch { /* fall through */ }
    }
    return null;
  }
}
