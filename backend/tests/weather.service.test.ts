import { describe, it, afterEach, after } from "node:test";
import assert from "node:assert/strict";
import { getWeather } from "../src/services/weather.service";
import { deleteCached, closeCache } from "../src/services/cache.service";

/* Open-Meteo isn't reachable from this test environment's network
 * policy, so the parsing/honest-fallback logic is verified here against
 * a mocked response shaped like its real API, same pattern used
 * throughout this project's other free-provider services. */

const originalFetch = global.fetch;

function mockFetchOnce(response: { ok: boolean; status?: number; json?: () => Promise<unknown> }) {
  global.fetch = (async () => response) as typeof fetch;
}

describe("getWeather", () => {
  afterEach(async () => {
    global.fetch = originalFetch;
    await deleteCached("weather:35.01:135.77");
  });

  it("returns a real current + daily snapshot parsed from a successful response", async () => {
    mockFetchOnce({
      ok: true,
      json: async () => ({
        current: { temperature_2m: 21.4, weather_code: 3 },
        daily: {
          time: ["2027-06-01", "2027-06-02"],
          temperature_2m_max: [24.1, 25.3],
          temperature_2m_min: [16.2, 17.0],
          weather_code: [1, 61],
        },
      }),
    });

    const result = await getWeather(35.0116, 135.7681);
    assert.ok(result);
    assert.equal(result!.currentTempC, 21.4);
    assert.equal(result!.currentWeatherCode, 3);
    assert.equal(result!.daily.length, 2);
    assert.equal(result!.daily[1].maxC, 25.3);
    assert.equal(result!.daily[1].weatherCode, 61);
  });

  it("honestly returns null rather than fabricating weather when the provider is unreachable", async () => {
    global.fetch = (async () => {
      throw new Error("connect ECONNREFUSED");
    }) as typeof fetch;
    const result = await getWeather(35.0116, 135.7681);
    assert.equal(result, null);
  });

  it("honestly returns null when the provider returns a non-OK status", async () => {
    mockFetchOnce({ ok: false, status: 503 });
    const result = await getWeather(35.0116, 135.7681);
    assert.equal(result, null);
  });

  it("honestly returns null for a malformed response missing current conditions", async () => {
    mockFetchOnce({ ok: true, json: async () => ({ daily: {} }) });
    const result = await getWeather(35.0116, 135.7681);
    assert.equal(result, null);
  });
});

after(async () => {
  await closeCache();
});
