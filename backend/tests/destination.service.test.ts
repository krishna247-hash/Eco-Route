import { describe, it, afterEach, after } from "node:test";
import assert from "node:assert/strict";
import { getDestinationSummary, getFamousPlaces } from "../src/services/destination.service";
import { deleteCached, closeCache } from "../src/services/cache.service";

/* Wikipedia's REST API and Overpass aren't reachable from this test
 * environment's network policy, so both success and honest-fallback
 * paths are verified against mocked responses shaped like the real
 * APIs, same pattern as location.service.test.ts / osmHotel.service.test.ts. */

const originalFetch = global.fetch;

function mockFetchOnce(response: { ok: boolean; status?: number; json?: () => Promise<unknown> }) {
  global.fetch = (async () => response) as typeof fetch;
}

describe("getDestinationSummary", () => {
  afterEach(async () => {
    global.fetch = originalFetch;
    await deleteCached("destination-summary:kyoto phase-test");
  });

  it("returns a real summary parsed from a successful Wikipedia response", async () => {
    mockFetchOnce({
      ok: true,
      json: async () => ({
        title: "Kyoto",
        extract: "Kyoto is a city in Japan.",
        type: "standard",
        originalimage: { source: "https://upload.wikimedia.org/kyoto-full.jpg" },
        thumbnail: { source: "https://upload.wikimedia.org/kyoto-thumb.jpg" },
        content_urls: { desktop: { page: "https://en.wikipedia.org/wiki/Kyoto" } },
      }),
    });

    const result = await getDestinationSummary("kyoto phase-test");
    assert.ok(result);
    assert.equal(result!.extract, "Kyoto is a city in Japan.");
    assert.equal(result!.photoUrl, "https://upload.wikimedia.org/kyoto-full.jpg");
    assert.equal(result!.wikipediaUrl, "https://en.wikipedia.org/wiki/Kyoto");
  });

  it("honestly returns null rather than fabricating a summary when no article exists", async () => {
    mockFetchOnce({ ok: false, status: 404 });
    const result = await getDestinationSummary("NoSuchPlacePhaseTest");
    assert.equal(result, null);
  });

  it("honestly returns null for a disambiguation page rather than a misleading summary", async () => {
    mockFetchOnce({ ok: true, json: async () => ({ type: "disambiguation", extract: "" }) });
    const result = await getDestinationSummary("AmbiguousPhaseTest");
    assert.equal(result, null);
  });

  it("honestly returns null when Wikipedia is unreachable, never throwing", async () => {
    global.fetch = (async () => {
      throw new Error("connect ECONNREFUSED");
    }) as typeof fetch;
    const result = await getDestinationSummary("UnreachablePhaseTest");
    assert.equal(result, null);
  });
});

describe("getFamousPlaces", () => {
  afterEach(async () => {
    global.fetch = originalFetch;
    await deleteCached("destination-attractions:35.012:135.768");
  });

  it("returns real attractions with photos only where OSM tags one", async () => {
    mockFetchOnce({
      ok: true,
      json: async () => ({
        elements: [
          {
            type: "node",
            id: 1,
            lat: 35.013,
            lon: 135.769,
            tags: { tourism: "attraction", name: "Real Landmark", wikimedia_commons: "File:Real Landmark.jpg" },
          },
          { type: "node", id: 2, lat: 35.02, lon: 135.78, tags: { historic: "monument", name: "Unphotographed Site" } },
        ],
      }),
    });

    const result = await getFamousPlaces(35.012, 135.768);
    assert.equal(result.length, 2);
    const landmark = result.find((a) => a.name === "Real Landmark");
    const unphotographed = result.find((a) => a.name === "Unphotographed Site");
    assert.ok(landmark);
    assert.ok(unphotographed);
    assert.equal(landmark!.photoUrl, "https://commons.wikimedia.org/wiki/Special:FilePath/Real%20Landmark.jpg?width=800");
    assert.equal(unphotographed!.photoUrl, undefined);
  });

  it("honestly returns an empty list rather than fabricating famous places when none are found", async () => {
    mockFetchOnce({ ok: true, json: async () => ({ elements: [] }) });
    const result = await getFamousPlaces(35.012, 135.768);
    assert.deepEqual(result, []);
  });

  it("honestly returns an empty list when Overpass is unreachable, never throwing", async () => {
    global.fetch = (async () => {
      throw new Error("connect ECONNREFUSED");
    }) as typeof fetch;
    const result = await getFamousPlaces(35.012, 135.768);
    assert.deepEqual(result, []);
  });
});

after(async () => {
  await closeCache();
});
