import { describe, it, expect, vi, afterEach } from "vitest";
import { callAnthropic } from "./ai-gateway.js";

afterEach(() => vi.restoreAllMocks());

describe("callAnthropic", () => {
  it("posts to the Anthropic Messages API with the given params", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    global.fetch = fetchMock;

    await callAnthropic({
      apiKey: "key-123",
      model: "claude-haiku-4-5-20251001",
      system: "be helpful",
      messages: [{ role: "user", content: "hi" }],
      maxTokens: 300,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.anthropic.com/v1/messages",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "x-api-key": "key-123" }),
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 300,
          system: "be helpful",
          messages: [{ role: "user", content: "hi" }],
        }),
      })
    );
  });
});
