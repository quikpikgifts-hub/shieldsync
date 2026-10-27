import test, { mock } from "node:test";
import assert from "node:assert/strict";
import { kvRateLimit } from "../api/_lib/kv.js";

const originalUrl = process.env.KV_REST_API_URL;
const originalToken = process.env.KV_REST_API_TOKEN;

function restoreEnv() {
  if (originalUrl === undefined) delete process.env.KV_REST_API_URL;
  else process.env.KV_REST_API_URL = originalUrl;
  if (originalToken === undefined) delete process.env.KV_REST_API_TOKEN;
  else process.env.KV_REST_API_TOKEN = originalToken;
}

const request = new Request("https://example.test/api/qp/contacts", {
  headers: { "x-forwarded-for": "203.0.113.9" },
});

test("rate limiter can fail closed when KV credentials are missing", async () => {
  delete process.env.KV_REST_API_URL;
  delete process.env.KV_REST_API_TOKEN;
  assert.equal(await kvRateLimit(request, { prefix: "qp-test", failClosed: true }), true);
  assert.equal(await kvRateLimit(request, { prefix: "legacy-test" }), false);
  restoreEnv();
});

test("rate limiter blocks requests above the configured limit", async () => {
  process.env.KV_REST_API_URL = "https://kv.example.test";
  process.env.KV_REST_API_TOKEN = "test-token";
  const responses = [2];
  const fetchMock = mock.method(globalThis, "fetch", async () => ({
    ok: true,
    status: 200,
    json: async () => ({ result: responses.shift() }),
  }));
  try {
    assert.equal(await kvRateLimit(request, { prefix: "qp-test", max: 1, failClosed: true }), true);
    assert.equal(fetchMock.mock.callCount(), 1);
  } finally {
    fetchMock.mock.restore();
    restoreEnv();
  }
});

test("rate limiter fails closed when KV is unhealthy if requested", async () => {
  process.env.KV_REST_API_URL = "https://kv.example.test";
  process.env.KV_REST_API_TOKEN = "test-token";
  const fetchMock = mock.method(globalThis, "fetch", async () => ({
    ok: false,
    status: 503,
    json: async () => ({ error: "unavailable" }),
  }));
  try {
    assert.equal(await kvRateLimit(request, { prefix: "qp-test", failClosed: true }), true);
    assert.equal(await kvRateLimit(request, { prefix: "legacy-test", failClosed: false }), false);
  } finally {
    fetchMock.mock.restore();
    restoreEnv();
  }
});

test("rate limiter verifies that a new bucket received its expiry", async () => {
  process.env.KV_REST_API_URL = "https://kv.example.test";
  process.env.KV_REST_API_TOKEN = "test-token";
  const responses = [{ result: 1 }, { result: null }];
  const fetchMock = mock.method(globalThis, "fetch", async () => {
    const body = responses.shift();
    return { ok: true, status: 200, json: async () => body };
  });
  try {
    assert.equal(await kvRateLimit(request, { prefix: "qp-test", failClosed: true }), true);
  } finally {
    fetchMock.mock.restore();
    restoreEnv();
  }
});
