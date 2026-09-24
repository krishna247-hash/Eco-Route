/* Routing provider abstraction, used to draw a real road route and get a
 * real distance/duration between two points instead of a guess.
 *
 * Provider: OSRM's public demo server (router.project-osrm.org) -- free
 * and keyless, but a shared community instance, not an SLA product. If
 * it's slow, rate-limited or down, we must NOT invent a plausible-looking
 * route: getRoute() falls back to a clearly-labeled straight-line
 * (great-circle) estimate and says so, per the platform rule against
 * fabricating provider data. It never throws. */

const OSRM_BASE_URL = "https://router.project-osrm.org";
const REQUEST_TIMEOUT_MS = 9000;

export interface RoutePoint {
  latitude: number;
  longitude: number;
}

export interface RouteResult {
  distanceKm: number;
  durationMin: number | null;
  geometry: { type: "LineString"; coordinates: [number, number][] };
}

export interface GetRouteResponse {
  ok: boolean;
  source: "osrm" | "fallback-straight-line";
  note?: string;
  routes: RouteResult[];
}

async function fetchWithTimeout(url: string, timeoutMs = REQUEST_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function haversineDistanceKm(a: RoutePoint, b: RoutePoint): number {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return R * 2 * Math.asin(Math.sqrt(h));
}

function straightLineFallback(origin: RoutePoint, destination: RoutePoint, reason: string): GetRouteResponse {
  return {
    ok: false,
    source: "fallback-straight-line",
    note:
      "Live routing is currently unavailable — this is a straight-line (great-circle) " +
      `distance estimate, not a real road route. ${reason}`,
    routes: [
      {
        distanceKm: haversineDistanceKm(origin, destination),
        durationMin: null,
        geometry: {
          type: "LineString",
          coordinates: [
            [origin.longitude, origin.latitude],
            [destination.longitude, destination.latitude],
          ],
        },
      },
    ],
  };
}

export async function getRoute(
  origin: RoutePoint,
  destination: RoutePoint,
  profile: "driving" | "walking" | "cycling" = "driving",
): Promise<GetRouteResponse> {
  const coords = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;
  const url = `${OSRM_BASE_URL}/route/v1/${profile}/${coords}?overview=full&geometries=geojson&alternatives=true&steps=false`;

  try {
    const response = await fetchWithTimeout(url);
    if (!response.ok) throw new Error(`OSRM responded HTTP ${response.status}`);

    const data = (await response.json()) as {
      code: string;
      message?: string;
      routes?: { distance: number; duration: number; geometry: { type: "LineString"; coordinates: [number, number][] } }[];
    };
    if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
      throw new Error(data.message || "No route returned by provider.");
    }

    return {
      ok: true,
      source: "osrm",
      routes: data.routes.map((r) => ({
        distanceKm: r.distance / 1000,
        durationMin: r.duration / 60,
        geometry: r.geometry,
      })),
    };
  } catch (err) {
    const reason =
      err instanceof Error && err.name === "AbortError"
        ? "The routing provider timed out."
        : `The routing provider could not be reached (${err instanceof Error ? err.message : "unknown error"}).`;
    return straightLineFallback(origin, destination, reason);
  }
}
