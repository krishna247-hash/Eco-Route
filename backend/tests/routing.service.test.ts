import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { getRoute } from "../src/services/routing.service";

/* OSRM's public demo server isn't reachable from this test environment's
 * network policy. The honest straight-line fallback this exercises was
 * also verified manually against the real (blocked) provider -- see the
 * Phase 3 report -- so this covers both the success-parsing path (mocked)
 * and the exact fallback code path that runs for real in this sandbox. */

const originalFetch = global.fetch;
const PARIS = { latitude: 48.8566, longitude: 2.3522 };
const LONDON = { latitude: 51.5074, longitude: -0.1278 };

describe("getRoute", () => {
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("returns a parsed OSRM route when the provider succeeds", async () => {
    global.fetch = (async () => ({
      ok: true,
      json: async () => ({
        code: "Ok",
        routes: [
          {
            distance: 344000,
            duration: 14400,
            geometry: { type: "LineString", coordinates: [[2.3522, 48.8566], [-0.1278, 51.5074]] },
          },
        ],
      }),
    })) as typeof fetch;

    const result = await getRoute(PARIS, LONDON);
    assert.equal(result.ok, true);
    assert.equal(result.source, "osrm");
    assert.equal(result.routes[0].distanceKm, 344);
    assert.equal(result.routes[0].durationMin, 240);
  });

  it("falls back to an honest straight-line estimate when the provider is unreachable, never throwing", async () => {
    global.fetch = (async () => {
      throw new Error("connect ECONNREFUSED");
    }) as typeof fetch;

    const result = await getRoute(PARIS, LONDON);
    assert.equal(result.ok, false);
    assert.equal(result.source, "fallback-straight-line");
    assert.match(result.note ?? "", /straight-line/);
    // Real great-circle distance Paris-London is ~344 km.
    assert.ok(result.routes[0].distanceKm > 330 && result.routes[0].distanceKm < 350);
    assert.equal(result.routes[0].durationMin, null);
  });

  it("falls back honestly when the provider responds with a non-OK status", async () => {
    global.fetch = (async () => ({ ok: false, status: 500 })) as typeof fetch;
    const result = await getRoute(PARIS, LONDON);
    assert.equal(result.ok, false);
    assert.equal(result.source, "fallback-straight-line");
  });
});
