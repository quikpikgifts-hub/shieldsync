import { describe, it, expect } from "vitest";
import { getAgent, parseJsonResponse } from "./agents.js";

describe("getAgent", () => {
  it("returns the brandVoice and drafts agents", () => {
    expect(getAgent("brandVoice")).toBeTruthy();
    expect(getAgent("drafts")).toBeTruthy();
  });

  it("returns null for an unknown agent key", () => {
    expect(getAgent("videoProducer")).toBeNull();
  });

  it("builds messages from input for the drafts agent", () => {
    const agent = getAgent("drafts");
    const messages = agent.buildMessages({ brandVoice: "warm and direct", topic: "a sale", count: 2 });
    expect(messages).toHaveLength(1);
    expect(messages[0].content).toContain("warm and direct");
    expect(messages[0].content).toContain("Generate 2 distinct draft posts");
  });
});

describe("parseJsonResponse", () => {
  it("parses clean JSON", () => {
    expect(parseJsonResponse('[{"caption":"hi"}]')).toEqual([{ caption: "hi" }]);
  });

  it("recovers JSON wrapped in prose", () => {
    const wrapped = 'Sure, here are the drafts:\n[{"caption":"hi"}]\nLet me know if you want more.';
    expect(parseJsonResponse(wrapped)).toEqual([{ caption: "hi" }]);
  });

  it("returns null when there is no recoverable JSON", () => {
    expect(parseJsonResponse("no json here at all")).toBeNull();
  });
});
