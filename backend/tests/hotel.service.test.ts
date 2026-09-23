import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DemoHotelProvider } from "../src/services/hotel.service";

const provider = new DemoHotelProvider();

const BASE_QUERY = {
  destinationName: "Paris",
  destinationCountry: "France",
  checkIn: "2027-01-01",
  checkOut: "2027-01-04",
  guests: 2,
};

describe("DemoHotelProvider", () => {
  it("is unambiguously labeled as demo data, never claiming to be live", async () => {
    const result = await provider.search(BASE_QUERY);
    assert.equal(result.isDemoData, true);
    assert.equal(result.source, "demo-generated");
    assert.match(result.disclaimer, /demo/i);
    assert.match(result.disclaimer, /not real/i);
  });

  it("returns hotels across all three tiers when no tier filter is given", async () => {
    const result = await provider.search(BASE_QUERY);
    const tiers = new Set(result.hotels.map((h) => h.tier));
    assert.deepEqual([...tiers].sort(), ["budget", "eco", "standard"]);
  });

  it("narrows to a single tier when one is requested", async () => {
    const result = await provider.search({ ...BASE_QUERY, tier: "eco" });
    assert.ok(result.hotels.length > 0);
    assert.ok(result.hotels.every((h) => h.tier === "eco"));
  });

  it("is deterministic: same destination + tier returns identical listings across calls", async () => {
    const first = await provider.search({ ...BASE_QUERY, tier: "standard" });
    const second = await provider.search({ ...BASE_QUERY, tier: "standard" });
    assert.deepEqual(first.hotels, second.hotels);
  });

  it("varies by destination: different cities get different-looking listings", async () => {
    const paris = await provider.search({ ...BASE_QUERY, tier: "standard" });
    const tokyo = await provider.search({ ...BASE_QUERY, destinationName: "Tokyo", tier: "standard" });
    assert.notDeepEqual(
      paris.hotels.map((h) => h.pricePerNightUsd),
      tokyo.hotels.map((h) => h.pricePerNightUsd),
    );
  });

  it("scales totalPriceUsd with the number of nights", async () => {
    const threeNights = await provider.search({ ...BASE_QUERY, tier: "budget" });
    const sixNights = await provider.search({ ...BASE_QUERY, tier: "budget", checkOut: "2027-01-07" });
    assert.equal(threeNights.hotels[0].totalPriceUsd, threeNights.hotels[0].pricePerNightUsd * 3);
    assert.equal(sixNights.hotels[0].totalPriceUsd, sixNights.hotels[0].pricePerNightUsd * 6);
  });

  it("keeps every generated price positive and finite", async () => {
    const result = await provider.search(BASE_QUERY);
    for (const hotel of result.hotels) {
      assert.ok(Number.isFinite(hotel.pricePerNightUsd) && hotel.pricePerNightUsd > 0);
      assert.ok(hotel.rating >= 3.5 && hotel.rating <= 4.9);
      assert.ok(hotel.amenities.length >= 3);
    }
  });
});
