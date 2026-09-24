import { describe, it, afterEach, after } from "node:test";
import assert from "node:assert/strict";
import { searchLocations, reverseGeocode } from "../src/services/location.service";
import { closeCache } from "../src/services/cache.service";

/* The real Photon/Nominatim providers aren't reachable from this test
 * environment's network policy, so parsing/normalization logic is
 * verified here against mocked fetch responses shaped like their real
 * APIs. Live behavior (including the honest-error path when a provider
 * is unreachable) was verified manually against the actual providers
 * being blocked -- see the Phase 3 report. */

const originalFetch = global.fetch;

function mockFetchOnce(response: { ok: boolean; status?: number; json?: () => Promise<unknown> }) {
  global.fetch = (async () => response) as typeof fetch;
}

describe("searchLocations", () => {
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("normalizes a Photon feature into the shared location shape", async () => {
    mockFetchOnce({
      ok: true,
      json: async () => ({
        features: [
          {
            properties: {
              name: "Paris",
              osm_key: "place",
              osm_value: "city",
              country: "France",
              state: "Ile-de-France",
            },
            geometry: { coordinates: [2.3522, 48.8566] },
          },
        ],
      }),
    });

    const results = await searchLocations("Paris Phase3TestA");
    assert.equal(results.length, 1);
    assert.equal(results[0].name, "Paris");
    assert.equal(results[0].type, "city");
    assert.equal(results[0].country, "France");
    assert.equal(results[0].latitude, 48.8566);
    assert.equal(results[0].longitude, 2.3522);
    assert.equal(results[0].source, "photon");
  });

  it("returns [] for a too-short query without calling the provider", async () => {
    let called = false;
    global.fetch = (async () => {
      called = true;
      return { ok: true, json: async () => ({ features: [] }) };
    }) as typeof fetch;

    const results = await searchLocations("a");
    assert.deepEqual(results, []);
    assert.equal(called, false);
  });

  it("throws a clean AppError (502) when the provider returns a non-OK status", async () => {
    mockFetchOnce({ ok: false, status: 503 });
    await assert.rejects(() => searchLocations("Berlin Phase3TestB"), /HTTP 503/);
  });
});

describe("reverseGeocode", () => {
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("normalizes a Nominatim response into the shared location shape", async () => {
    mockFetchOnce({
      ok: true,
      json: async () => ({
        address: { city: "Paris", country: "France", state: "Ile-de-France" },
        display_name: "Paris, Ile-de-France, France",
        lat: "48.8566",
        lon: "2.3522",
        addresstype: "city",
      }),
    });

    const result = await reverseGeocode(48.8566, 2.3522);
    assert.equal(result.name, "Paris");
    assert.equal(result.country, "France");
    assert.equal(result.source, "nominatim");
    assert.equal(result.latitude, 48.8566);
  });

  it("throws a clean AppError (502) when the provider returns a non-OK status", async () => {
    mockFetchOnce({ ok: false, status: 403 });
    await assert.rejects(() => reverseGeocode(12.3456, 65.4321), /HTTP 403/);
  });
});

after(async () => {
  await closeCache();
});
