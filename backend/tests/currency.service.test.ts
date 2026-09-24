import { describe, it, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { getUsdToInrRate } from "../src/services/currency.service";
import { deleteCached, closeCache } from "../src/services/cache.service";

/* The real Frankfurter API isn't reachable from this test environment's
 * network policy (same family as Phase 3's blocked providers), so the
 * parsing/fallback logic is verified here against mocked fetch responses
 * shaped like its real API. Both cache keys are fixed (there's only ever
 * one currency pair), so each test clears them first for isolation. */

const LIVE_KEY = "currency:usd-inr:live";
const LAST_KNOWN_KEY = "currency:usd-inr:last-known";

const originalFetch = global.fetch;

function mockFetchOnce(response: { ok: boolean; status?: number; json?: () => Promise<unknown> }) {
  global.fetch = (async () => response) as typeof fetch;
}

async function clearCache() {
  await deleteCached(LIVE_KEY);
  await deleteCached(LAST_KNOWN_KEY);
}

describe("getUsdToInrRate", () => {
  beforeEach(async () => {
    global.fetch = originalFetch;
    await clearCache();
  });

  it("returns a live rate parsed from a successful Frankfurter response", async () => {
    mockFetchOnce({ ok: true, json: async () => ({ rates: { INR: 83.12 }, date: "2026-09-24" }) });

    const result = await getUsdToInrRate();
    assert.equal(result.usdToInr, 83.12);
    assert.equal(result.asOf, "2026-09-24");
    assert.equal(result.isLive, true);
  });

  it("reuses the cached live rate on a second call without hitting the provider again", async () => {
    mockFetchOnce({ ok: true, json: async () => ({ rates: { INR: 83.5 }, date: "2026-09-24" }) });
    await getUsdToInrRate();

    let called = false;
    global.fetch = (async () => {
      called = true;
      throw new Error("should not be called");
    }) as typeof fetch;

    const result = await getUsdToInrRate();
    assert.equal(called, false);
    assert.equal(result.usdToInr, 83.5);
    assert.equal(result.isLive, true);
  });

  it("falls back to the last-known-good rate (marked non-live) when the provider is unreachable", async () => {
    mockFetchOnce({ ok: true, json: async () => ({ rates: { INR: 82.9 }, date: "2026-09-20" }) });
    await getUsdToInrRate();
    await deleteCached(LIVE_KEY);

    global.fetch = (async () => {
      throw new Error("connect ECONNREFUSED");
    }) as typeof fetch;

    const result = await getUsdToInrRate();
    assert.equal(result.usdToInr, 82.9);
    assert.equal(result.asOf, "2026-09-20");
    assert.equal(result.isLive, false);
  });

  it("falls back to the last-known-good rate when the provider returns a non-OK status", async () => {
    mockFetchOnce({ ok: true, json: async () => ({ rates: { INR: 81.4 }, date: "2026-09-18" }) });
    await getUsdToInrRate();
    await deleteCached(LIVE_KEY);

    mockFetchOnce({ ok: false, status: 503 });

    const result = await getUsdToInrRate();
    assert.equal(result.usdToInr, 81.4);
    assert.equal(result.isLive, false);
  });

  it("throws honestly, never fabricating a rate, when there is no live or cached rate available", async () => {
    global.fetch = (async () => {
      throw new Error("connect ECONNREFUSED");
    }) as typeof fetch;

    await assert.rejects(() => getUsdToInrRate(), /No live or cached USD-INR exchange rate/);
  });

  it("does not treat a malformed response (missing INR rate) as success", async () => {
    mockFetchOnce({ ok: true, json: async () => ({ rates: {}, date: "2026-09-24" }) });
    await assert.rejects(() => getUsdToInrRate(), /No live or cached USD-INR exchange rate/);
  });
});

after(async () => {
  await clearCache();
  await closeCache();
});
