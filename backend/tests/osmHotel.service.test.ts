import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { OsmDemoHotelProvider } from "../src/services/hotel.service";

/* Overpass API isn't reachable from this test environment's network
 * policy (same family of hosts as Phase 3's blocked map providers), so
 * the success-parsing path is verified here against a mocked response
 * shaped like Overpass's real API. The honest-fallback paths (no
 * coordinates, unreachable, zero results) don't need mocking -- they're
 * exercised for real. */

const provider = new OsmDemoHotelProvider();
const originalFetch = global.fetch;

const BASE_QUERY = {
  destinationName: "Kyoto",
  destinationCountry: "Japan",
  checkIn: "2027-03-01",
  checkOut: "2027-03-05",
  guests: 2,
};

function mockOverpassOnce(elements: unknown[]) {
  global.fetch = (async () => ({
    ok: true,
    json: async () => ({ elements }),
  })) as typeof fetch;
}

describe("OsmDemoHotelProvider", () => {
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("falls back to synthetic listings when no destination coordinates are given", async () => {
    const result = await provider.search(BASE_QUERY);
    assert.equal(result.isDemoData, true);
    assert.equal(result.source, "demo-generated");
    assert.ok(result.hotels.length > 0);
  });

  it("uses real OSM-sourced names and marks the source as osm when Overpass returns real venues", async () => {
    mockOverpassOnce([
      { type: "node", id: 1, lat: 35.0117, lon: 135.7681, tags: { tourism: "hotel", name: "Kyoto Grand Real Hotel" } },
      { type: "node", id: 2, lat: 35.02, lon: 135.77, tags: { tourism: "hostel", name: "Real Kyoto Hostel" } },
      { type: "way", id: 3, center: { lat: 35.015, lon: 135.76 }, tags: { tourism: "guest_house", name: "Real Guest House" } },
    ]);

    const result = await provider.search({ ...BASE_QUERY, destinationLat: 35.0116, destinationLon: 135.7681 });
    assert.equal(result.source, "osm");
    assert.match(result.disclaimer, /OpenStreetMap/);
    const names = result.hotels.map((h) => h.name);
    assert.ok(
      names.includes("Kyoto Grand Real Hotel") ||
        names.includes("Real Kyoto Hostel") ||
        names.includes("Real Guest House"),
    );
  });

  it("computes a real distanceFromCenterKm for OSM-sourced venues, not a seeded placeholder", async () => {
    mockOverpassOnce([
      { type: "node", id: 1, lat: 35.02, lon: 135.78, tags: { tourism: "hotel", name: "Far Away Real Hotel" } },
    ]);
    const result = await provider.search({ ...BASE_QUERY, destinationLat: 35.0116, destinationLon: 135.7681 });
    const real = result.hotels.find((h) => h.name === "Far Away Real Hotel");
    assert.ok(real);
    // Real distance between these two points is a few km, not 0.
    assert.ok(real!.distanceFromCenterKm > 0.5);
  });

  it("honestly falls back to synthetic (source demo-generated) when Overpass returns zero results", async () => {
    mockOverpassOnce([]);
    const result = await provider.search({ ...BASE_QUERY, destinationLat: 35.0116, destinationLon: 135.7681 });
    assert.equal(result.source, "demo-generated");
    assert.match(result.disclaimer, /no matching OpenStreetMap listings/);
    assert.ok(result.hotels.length > 0);
  });

  it("honestly falls back to synthetic when Overpass is unreachable, never throwing", async () => {
    global.fetch = (async () => {
      throw new Error("connect ECONNREFUSED");
    }) as typeof fetch;
    const result = await provider.search({ ...BASE_QUERY, destinationLat: 35.0116, destinationLon: 135.7681 });
    assert.equal(result.source, "demo-generated");
    assert.match(result.disclaimer, /temporarily unreachable/);
    assert.ok(result.hotels.length > 0);
  });

  it("pads a tier with synthetic placeholders when OSM has fewer real venues than needed, and says so", async () => {
    // Every mocked venue hashes into the same tier bucket unpredictably, but
    // with only one real venue total, at least one requested tier is
    // guaranteed to be short -- exercise that mixed case directly.
    mockOverpassOnce([
      { type: "node", id: 1, lat: 35.0117, lon: 135.7681, tags: { tourism: "hotel", name: "Only Real Hotel" } },
    ]);
    const result = await provider.search({ ...BASE_QUERY, destinationLat: 35.0116, destinationLon: 135.7681 });
    assert.equal(result.source, "osm");
    const names = result.hotels.map((h) => h.name);
    assert.ok(names.includes("Only Real Hotel"));
    assert.ok(names.some((n) => n !== "Only Real Hotel"));
    assert.match(result.disclaimer, /placeholder names/);
  });

  it("still never fabricates live pricing/availability even for real venues", async () => {
    mockOverpassOnce([
      { type: "node", id: 1, lat: 35.0117, lon: 135.7681, tags: { tourism: "hotel", name: "Real Priced Hotel" } },
    ]);
    const result = await provider.search({ ...BASE_QUERY, destinationLat: 35.0116, destinationLon: 135.7681 });
    assert.equal(result.isDemoData, true);
    assert.match(result.disclaimer, /estimated demo data/);
  });
});
