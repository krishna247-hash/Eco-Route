/* Destination discovery: a real summary + photo for a place (via
 * Wikipedia's REST summary API), and real nearby points of interest (via
 * the same free/keyless Overpass API already used for hotel identities).
 *
 * Both are free, keyless, and public. Neither is fabricated: a
 * destination with no matching Wikipedia article returns null (no made-up
 * description), and attractions with no OSM listing nearby return an
 * empty list (no made-up "famous places"). Real Wikimedia Commons photos
 * are only attached where the OSM attraction itself is tagged with one --
 * same discipline as hotel.service.ts. */

import { getCached, setCached } from "./cache.service";
import { wikimediaPhotoUrl } from "./wikimedia.util";

const WIKIPEDIA_SUMMARY_URL = "https://en.wikipedia.org/api/rest_v1/page/summary/";
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const REQUEST_TIMEOUT_MS = 7000;
// The shared public Overpass instance can genuinely take a while under
// load -- this must stay comfortably above the query's own [timeout:15]
// budget below, or the client aborts before the server even finishes,
// falling back to "temporarily unreachable" far more than necessary.
const OVERPASS_TIMEOUT_MS = 20000;
const SUMMARY_CACHE_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days -- summaries/photos rarely change
const ATTRACTIONS_CACHE_TTL_SECONDS = 60 * 60 * 24 * 7;
const ATTRACTIONS_RADIUS_METERS = 8000;
const MAX_ATTRACTIONS = 8;

export interface DestinationSummary {
  title: string;
  extract: string;
  photoUrl?: string;
  wikipediaUrl?: string;
}

export interface Attraction {
  name: string;
  photoUrl?: string;
  distanceFromCenterKm: number;
}

async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = REQUEST_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function getDestinationSummary(name: string): Promise<DestinationSummary | null> {
  const cacheKey = `destination-summary:${name.toLowerCase()}`;
  const cached = await getCached<DestinationSummary>(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetchWithTimeout(`${WIKIPEDIA_SUMMARY_URL}${encodeURIComponent(name)}`, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      return null;
    }
    const data = (await response.json()) as {
      title?: string;
      extract?: string;
      thumbnail?: { source?: string };
      originalimage?: { source?: string };
      content_urls?: { desktop?: { page?: string } };
      type?: string;
    };
    if (data.type === "disambiguation" || !data.extract) {
      return null;
    }

    const summary: DestinationSummary = {
      title: data.title ?? name,
      extract: data.extract,
      photoUrl: data.originalimage?.source ?? data.thumbnail?.source,
      wikipediaUrl: data.content_urls?.desktop?.page,
    };
    await setCached(cacheKey, summary, SUMMARY_CACHE_TTL_SECONDS);
    return summary;
  } catch {
    // Unreachable -- an honest "no summary" beats a fabricated one; no
    // negative cache here since it may just be transient.
    return null;
  }
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

export async function getFamousPlaces(lat: number, lon: number): Promise<Attraction[]> {
  const cacheKey = `destination-attractions:${lat.toFixed(3)}:${lon.toFixed(3)}`;
  const cached = await getCached<Attraction[]>(cacheKey);
  if (cached) return cached;

  const query = `[out:json][timeout:15];(node["tourism"~"^(attraction|museum|viewpoint|artwork|gallery)$"]["name"](around:${ATTRACTIONS_RADIUS_METERS},${lat},${lon});way["tourism"~"^(attraction|museum|viewpoint|artwork|gallery)$"]["name"](around:${ATTRACTIONS_RADIUS_METERS},${lat},${lon});node["historic"]["name"](around:${ATTRACTIONS_RADIUS_METERS},${lat},${lon}););out center ${MAX_ATTRACTIONS * 4};`;

  try {
    const response = await fetchWithTimeout(
      OVERPASS_URL,
      { method: "POST", headers: { "Content-Type": "text/plain" }, body: query },
      OVERPASS_TIMEOUT_MS,
    );
    if (!response.ok) return [];

    const data = (await response.json()) as { elements?: OverpassElement[] };
    const elements = data.elements ?? [];

    const seen = new Set<string>();
    const attractions: Attraction[] = [];
    for (const el of elements) {
      const name = el.tags?.name;
      const elLat = el.lat ?? el.center?.lat;
      const elLon = el.lon ?? el.center?.lon;
      if (!name || elLat === undefined || elLon === undefined || seen.has(name)) continue;
      seen.add(name);
      attractions.push({
        name,
        photoUrl: wikimediaPhotoUrl(el.tags?.wikimedia_commons),
        distanceFromCenterKm: Math.round(haversineKm(lat, lon, elLat, elLon) * 10) / 10,
      });
      if (attractions.length >= MAX_ATTRACTIONS) break;
    }

    await setCached(cacheKey, attractions, ATTRACTIONS_CACHE_TTL_SECONDS);
    return attractions;
  } catch {
    return [];
  }
}
