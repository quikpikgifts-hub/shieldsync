// Shared Anthropic call, used by api/ai.js, api/chat.js, and api/social/generate.js.
// Deliberately thin: response shaping (error handling, fallback messages) differs
// per caller and stays in each route — only the raw provider call is shared.
export async function callAnthropic({ apiKey, model, system, messages, maxTokens }) {
  return fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({ model, max_tokens: maxTokens, system, messages }),
  });
}
