import { describe, it, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { app } from "../src/app";
import { deleteCached, closeCache } from "../src/services/cache.service";

const LIVE_KEY = "currency:usd-inr:live";
const LAST_KNOWN_KEY = "currency:usd-inr:last-known";

const originalFetch = global.fetch;

async function clearCache() {
  await deleteCached(LIVE_KEY);
  await deleteCached(LAST_KNOWN_KEY);
}

describe("GET /api/v1/currency/rate", () => {
  beforeEach(async () => {
    global.fetch = originalFetch;
    await clearCache();
  });

  it("returns 200 with the live USD-INR rate on success", async () => {
    global.fetch = (async () => ({
      ok: true,
      json: async () => ({ rates: { INR: 83.2 }, date: "2026-09-24" }),
    })) as typeof fetch;

    const response = await request(app).get("/api/v1/currency/rate");
    assert.equal(response.status, 200);
    assert.equal(response.body.usdToInr, 83.2);
    assert.equal(response.body.isLive, true);
  });

  it("honestly fails with 502 rather than fabricating a rate when nothing is available", async () => {
    global.fetch = (async () => {
      throw new Error("connect ECONNREFUSED");
    }) as typeof fetch;

    const response = await request(app).get("/api/v1/currency/rate");
    assert.equal(response.status, 502);
    assert.ok(response.body.error);
  });
});

after(async () => {
  global.fetch = originalFetch;
  await clearCache();
  await closeCache();
});
