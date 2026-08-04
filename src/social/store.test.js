import { describe, it, expect, beforeEach } from "vitest";

// Minimal in-memory localStorage polyfill — no jsdom dependency needed for
// this data-layer-only test; store.js only calls getItem/setItem/removeItem.
function installFakeLocalStorage() {
  let data = {};
  global.localStorage = {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = String(v); },
    removeItem: (k) => { delete data[k]; },
    clear: () => { data = {}; },
  };
}

installFakeLocalStorage();
const { devAuth, workspaces, brands, contentItems } = await import("./store.js");

beforeEach(() => {
  global.localStorage.clear();
});

describe("devAuth", () => {
  it("has no session by default", () => {
    expect(devAuth.current()).toBeNull();
  });

  it("signs in and persists the session", () => {
    const profile = devAuth.signIn("Founder@Example.com", "Founder");
    expect(profile.email).toBe("founder@example.com"); // normalized lowercase
    expect(devAuth.current()).toEqual(profile);
  });

  it("defaults name from the email local-part when name is omitted", () => {
    const profile = devAuth.signIn("jamie@example.com");
    expect(profile.name).toBe("jamie");
  });

  it("signs out and clears the session", () => {
    devAuth.signIn("a@example.com");
    devAuth.signOut();
    expect(devAuth.current()).toBeNull();
  });
});

describe("workspaces / brands / contentItems collections", () => {
  it("inserts and lists workspaces", () => {
    const ws = workspaces.insert({ name: "Test Co", ownerEmail: "a@example.com" });
    expect(ws.id).toMatch(/^W-/);
    expect(workspaces.list()).toHaveLength(1);
    expect(workspaces.get(ws.id).name).toBe("Test Co");
  });

  it("scopes brands to a workspace via scopeKey", () => {
    const wsA = workspaces.insert({ name: "A" });
    const wsB = workspaces.insert({ name: "B" });
    brands.insert({ workspaceId: wsA.id, businessName: "Brand A1" });
    brands.insert({ workspaceId: wsA.id, businessName: "Brand A2" });
    brands.insert({ workspaceId: wsB.id, businessName: "Brand B1" });

    expect(brands.list(wsA.id)).toHaveLength(2);
    expect(brands.list(wsB.id)).toHaveLength(1);
    expect(brands.list()).toHaveLength(3); // unscoped = all
  });

  it("updates a content item's status and preserves other fields", () => {
    const brand = brands.insert({ workspaceId: "W-1", businessName: "X" });
    const item = contentItems.insert({ brandId: brand.id, status: "draft", caption: "hello" });

    const updated = contentItems.update(item.id, { status: "approved", approvedAt: "2026-01-01" });

    expect(updated.status).toBe("approved");
    expect(updated.caption).toBe("hello"); // untouched
    expect(updated.approvedAt).toBe("2026-01-01");
  });

  it("removes an item", () => {
    const brand = brands.insert({ workspaceId: "W-1", businessName: "X" });
    const item = contentItems.insert({ brandId: brand.id, status: "draft", caption: "hi" });
    contentItems.remove(item.id);
    expect(contentItems.get(item.id)).toBeNull();
  });
});
