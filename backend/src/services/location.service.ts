import { AppError } from "../utils/AppError";
import { getCached, setCached } from "./cache.service";

/* Provider abstraction for location search & reverse geocoding, backed by
 * free, keyless OpenStreetMap-derived providers:
 * - Photon (photon.komoot.io) for forward search/autocomplete.
 * - Nominatim (nominatim.openstreetmap.org) for reverse geocoding, called
 *   with an identifying User-Agent per its usage policy (something a
 *   browser fetch() can't set, which is one reason this lives server-side).
 * Both are free community demo endpoints, rate-limited and not an SLA
 * product -- fine for this project, not for production-scale traffic. */

const PHOTON_URL = "https://photon.komoot.io/api/";
const NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse";
const REQUEST_TIMEOUT_MS = 7000;
const CACHE_TTL_SECONDS = 24 * 60 * 60;
const USER_AGENT = "EcoRoute-EDI-Project/1.0 (+https://github.com/krishna247-hash/Eco-Route; educational use)";

export interface NormalizedLocation {
  name: string;
  type: string;
  country: string | null;
  state: string | null;
  district: string | null;
  latitude: number;
  longitude: number;
  displayName: string;
  source: "photon" | "nominatim";
}

async function fetchWithTimeout(url: string, timeoutMs = REQUEST_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { headers: { "User-Agent": USER_AGENT }, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function classifyType(props: Record<string, unknown>): string {
  const key = props.osm_key as string | undefined;
  const val = props.osm_value as string | undefined;

  if (val === "country") return "country";
  if (val === "state") return "state";
  if (val === "region") return "region";
  if (key === "place" && ["city", "town", "village", "hamlet"].includes(val ?? "")) return val as string;
  if (key === "place" && (val === "suburb" || val === "locality")) return "locality";
  if (key === "boundary" && val === "administrative") return "district";
  if (key === "aeroway") return "airport";
  if (key === "railway" && (val === "station" || val === "halt")) return "railway_station";
  if (key === "amenity" && val === "bus_station") return "bus_station";
  if (key === "highway" && val === "bus_stop") return "bus_station";
  if (key === "tourism") return "attraction";
  if (key === "historic") return "landmark";
  return val || key || "place";
}

function normalizePhotonFeature(feature: {
  properties?: Record<string, unknown>;
  geometry: { coordinates: [number, number] };
}): NormalizedLocation {
  const p = feature.properties ?? {};
  const [longitude, latitude] = feature.geometry.coordinates;
  const type = classifyType(p);

  const hierarchy = [p.district, p.city, p.county, p.state, p.country].filter(
    (v): v is string => typeof v === "string" && v.length > 0,
  );
  const uniqueHierarchy = [...new Set(hierarchy)];
  const name = (p.name as string) || (p.street as string) || uniqueHierarchy[0] || "Unnamed location";
  const displayName = [...new Set([name, ...uniqueHierarchy.filter((part) => part !== name)])].join(", ");

  return {
    name,
    type,
    country: (p.country as string) ?? null,
    state: (p.state as string) ?? null,
    district: (p.district as string) ?? (p.county as string) ?? null,
    latitude,
    longitude,
    displayName,
    source: "photon",
  };
}

export async function searchLocations(query: string, limit = 8): Promise<NormalizedLocation[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const cacheKey = `location:search:${q.toLowerCase()}:${limit}`;
  const cached = await getCached<NormalizedLocation[]>(cacheKey);
  if (cached) return cached;

  const url = `${PHOTON_URL}?${new URLSearchParams({ q, limit: String(limit), lang: "en" }).toString()}`;

  let response: Response;
  try {
    response = await fetchWithTimeout(url);
  } catch (err) {
    const reason = err instanceof Error && err.name === "AbortError" ? "timed out" : "was unreachable";
    throw new AppError(502, `Location search provider ${reason}. Please try again.`);
  }
  if (!response.ok) {
    throw new AppError(502, `Location search provider returned HTTP ${response.status}.`);
  }

  const data = (await response.json()) as {
    features?: { properties?: Record<string, unknown>; geometry: { coordinates: [number, number] } }[];
  };
  const results = (data.features ?? []).map(normalizePhotonFeature);
  await setCached(cacheKey, results, CACHE_TTL_SECONDS);
  return results;
}

export async function reverseGeocode(latitude: number, longitude: number): Promise<NormalizedLocation> {
  const cacheKey = `location:reverse:${latitude.toFixed(4)},${longitude.toFixed(4)}`;
  const cached = await getCached<NormalizedLocation>(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams({
    format: "jsonv2",
    lat: String(latitude),
    lon: String(longitude),
    addressdetails: "1",
    zoom: "14",
  });
  const url = `${NOMINATIM_REVERSE_URL}?${params.toString()}`;

  let response: Response;
  try {
    response = await fetchWithTimeout(url);
  } catch (err) {
    const reason = err instanceof Error && err.name === "AbortError" ? "timed out" : "was unreachable";
    throw new AppError(502, `Reverse geocoding provider ${reason}. Please try again.`);
  }
  if (!response.ok) {
    throw new AppError(502, `Reverse geocoding provider returned HTTP ${response.status}.`);
  }

  const data = (await response.json()) as {
    address?: Record<string, string>;
    display_name?: string;
    name?: string;
    addresstype?: string;
    type?: string;
    lat: string;
    lon: string;
  };
  const addr = data.address ?? {};
  const city = addr.city || addr.town || addr.village || addr.hamlet || null;
  const district = addr.state_district || addr.county || null;

  const result: NormalizedLocation = {
    name: city || data.name || (data.display_name ?? "").split(",")[0] || "Selected location",
    type: data.addresstype || data.type || "place",
    country: addr.country || null,
    state: addr.state || null,
    district,
    latitude: parseFloat(data.lat),
    longitude: parseFloat(data.lon),
    displayName: data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
    source: "nominatim",
  };
  await setCached(cacheKey, result, CACHE_TTL_SECONDS);
  return result;
}
