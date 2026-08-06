import { describe, it, expect } from "vitest";
import { mkId } from "./ids.js";

describe("mkId", () => {
  it("prefixes with the given prefix", () => {
    expect(mkId("vrd")).toMatch(/^vrd_\d+_[a-z0-9]{5}$/);
    expect(mkId("bkg")).toMatch(/^bkg_\d+_[a-z0-9]{5}$/);
  });

  it("defaults to the vrd prefix", () => {
    expect(mkId()).toMatch(/^vrd_/);
  });

  it("generates unique ids across calls", () => {
    const ids = new Set(Array.from({ length: 20 }, () => mkId("t")));
    expect(ids.size).toBe(20);
  });
});
