import { describe, it, expect } from "vitest";
import { getAgent, parseJsonResponse } from "./agents.js";

describe("getAgent", () => {
  it("returns all four shipped agents", () => {
    expect(getAgent("brandVoice")).toBeTruthy();
    expect(getAgent("drafts")).toBeTruthy();
    expect(getAgent("hashtags")).toBeTruthy();
    expect(getAgent("videoScript")).toBeTruthy();
  });

  it("returns null for an unknown agent key", () => {
    expect(getAgent("trendAnalyst")).toBeNull();
  });

  it("builds messages from input for the drafts agent, including platform norms", () => {
    const agent = getAgent("drafts");
    const messages = agent.buildMessages({ brandVoice: "warm and direct", topic: "a sale", count: 2, platform: "x" });
    expect(messages).toHaveLength(1);
    expect(messages[0].content).toContain("warm and direct");
    expect(messages[0].content).toContain("Generate 2 distinct draft posts");
    expect(messages[0].content).toContain("280 character limit");
  });

  it("falls back to general platform norms when platform is omitted", () => {
    const agent = getAgent("drafts");
    const messages = agent.buildMessages({ brandVoice: "x", topic: "y" });
    expect(messages[0].content).toContain("No specific platform chosen yet");
  });

  it("builds hashtag-regeneration messages from a caption", () => {
    const agent = getAgent("hashtags");
    const messages = agent.buildMessages({ brandVoice: "playful", caption: "Big news today!", platform: "linkedin" });
    expect(messages[0].content).toContain("Big news today!");
    expect(messages[0].content).toContain("linkedin");
  });

  it("builds video script messages defaulting to tiktok norms", () => {
    const agent = getAgent("videoScript");
    const messages = agent.buildMessages({ brandVoice: "energetic", topic: "product launch" });
    expect(messages[0].content).toContain("tiktok");
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

  it("parses a clean JSON object (videoScript shape)", () => {
    const obj = { hook: "hi", beats: ["a", "b"], cta: "go", onScreenText: [] };
    expect(parseJsonResponse(JSON.stringify(obj))).toEqual(obj);
  });

  it("recovers a JSON object wrapped in prose", () => {
    const wrapped = 'Here you go:\n{"hook":"hi","beats":["a"],"cta":"go","onScreenText":[]}\nEnjoy!';
    expect(parseJsonResponse(wrapped)).toEqual({ hook: "hi", beats: ["a"], cta: "go", onScreenText: [] });
  });
});
