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
const { devAuth, workspaces, brands, contentItems, mediaAssets, pendingReviewCount, lastWorkspace } = await import("./store.js");

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

describe("contentItems.updateWithHistory", () => {
  it("appends the prior caption to history when the caption changes", () => {
    const brand = brands.insert({ workspaceId: "W-1", businessName: "X" });
    const item = contentItems.insert({ brandId: brand.id, status: "draft", caption: "v1", hashtags: "#a" });

    const v2 = contentItems.updateWithHistory(item.id, { caption: "v2", status: "edited" });
    expect(v2.caption).toBe("v2");
    expect(v2.history).toHaveLength(1);
    expect(v2.history[0].caption).toBe("v1");
    expect(v2.history[0].hashtags).toBe("#a");

    const v3 = contentItems.updateWithHistory(item.id, { caption: "v3" });
    expect(v3.history).toHaveLength(2);
    expect(v3.history.map((h) => h.caption)).toEqual(["v1", "v2"]);
  });

  it("does not append to history when the caption is unchanged", () => {
    const brand = brands.insert({ workspaceId: "W-1", businessName: "X" });
    const item = contentItems.insert({ brandId: brand.id, status: "draft", caption: "v1" });
    const updated = contentItems.updateWithHistory(item.id, { status: "approved" });
    expect(updated.history || []).toHaveLength(0);
  });

  it("returns null for a nonexistent item instead of throwing", () => {
    expect(contentItems.updateWithHistory("nope", { caption: "x" })).toBeNull();
  });
});

describe("pendingReviewCount", () => {
  it("counts only draft-status items for a brand", () => {
    const brand = brands.insert({ workspaceId: "W-1", businessName: "X" });
    contentItems.insert({ brandId: brand.id, status: "draft", caption: "a" });
    contentItems.insert({ brandId: brand.id, status: "draft", caption: "b" });
    contentItems.insert({ brandId: brand.id, status: "approved", caption: "c" });

    expect(pendingReviewCount(brand.id)).toBe(2);
  });
});

describe("mediaAssets", () => {
  it("scopes assets to a brand", () => {
    const brandA = brands.insert({ workspaceId: "W-1", businessName: "A" });
    const brandB = brands.insert({ workspaceId: "W-1", businessName: "B" });
    mediaAssets.insert({ brandId: brandA.id, url: "https://example.test/a.jpg", label: "Storefront" });
    mediaAssets.insert({ brandId: brandB.id, url: "https://example.test/b.jpg", label: "Logo" });

    expect(mediaAssets.list(brandA.id)).toHaveLength(1);
    expect(mediaAssets.list(brandA.id)[0].label).toBe("Storefront");
  });
});

describe("lastWorkspace", () => {
  it("has no remembered workspace by default", () => {
    expect(lastWorkspace.get()).toBeNull();
  });

  it("remembers and returns the last set workspace id", () => {
    lastWorkspace.set("W-42");
    expect(lastWorkspace.get()).toBe("W-42");
  });
});
