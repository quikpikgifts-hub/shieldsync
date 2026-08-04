import { describe, it, expect } from "vitest";
import { priorityFromRevenue, priorityFromScore } from "./priority.js";

describe("priorityFromRevenue", () => {
  it("returns HOT for urgent language regardless of revenue", () => {
    expect(priorityFromRevenue(0, "this is an emergency, losing money now")).toBe("HOT");
  });

  it("returns HOT for annual >= 200000 with no urgent language", () => {
    expect(priorityFromRevenue(200000, "")).toBe("HOT");
  });

  it("returns HIGH for annual >= 75000 and < 200000", () => {
    expect(priorityFromRevenue(75000, "")).toBe("HIGH");
    expect(priorityFromRevenue(199999, "")).toBe("HIGH");
  });

  it("returns MEDIUM for annual >= 25000 and < 75000", () => {
    expect(priorityFromRevenue(25000, "")).toBe("MEDIUM");
  });

  it("returns LOW for annual below 25000 or missing", () => {
    expect(priorityFromRevenue(0, "")).toBe("LOW");
    expect(priorityFromRevenue(undefined, "")).toBe("LOW");
  });
});

describe("priorityFromScore", () => {
  it("returns HOT for scores under 40", () => {
    expect(priorityFromScore(39)).toBe("HOT");
  });

  it("returns HIGH for scores 40-59", () => {
    expect(priorityFromScore(40)).toBe("HIGH");
    expect(priorityFromScore(59)).toBe("HIGH");
  });

  it("returns MEDIUM for scores 60-79", () => {
    expect(priorityFromScore(60)).toBe("MEDIUM");
    expect(priorityFromScore(79)).toBe("MEDIUM");
  });

  it("returns LOW for scores 80+", () => {
    expect(priorityFromScore(80)).toBe("LOW");
    expect(priorityFromScore(100)).toBe("LOW");
  });

  it("defaults missing score to 100 (LOW)", () => {
    expect(priorityFromScore(undefined)).toBe("LOW");
  });
});
