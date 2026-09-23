const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

export interface LocationResult {
  name: string;
  type: string;
  country: string | null;
  state: string | null;
  district: string | null;
  latitude: number;
  longitude: number;
  displayName: string;
  source: 'photon' | 'nominatim';
}

export interface RouteResult {
  distanceKm: number;
  durationMin: number | null;
  geometry: { type: 'LineString'; coordinates: [number, number][] };
}

export interface GetRouteResponse {
  ok: boolean;
  source: 'osrm' | 'fallback-straight-line';
  note?: string;
  routes: RouteResult[];
}

export async function searchLocations(query: string): Promise<LocationResult[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/locations/search?q=${encodeURIComponent(query)}`);
  if (!response.ok) {
    throw new Error(`Location search failed (${response.status})`);
  }
  const data = (await response.json()) as { results: LocationResult[] };
  return data.results;
}

export async function reverseGeocode(latitude: number, longitude: number): Promise<LocationResult> {
  const response = await fetch(`${API_BASE_URL}/api/v1/locations/reverse?lat=${latitude}&lon=${longitude}`);
  if (!response.ok) {
    throw new Error(`Reverse geocoding failed (${response.status})`);
  }
  return response.json() as Promise<LocationResult>;
}

export async function getRoute(
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number },
  profile: 'driving' | 'walking' | 'cycling' = 'driving',
): Promise<GetRouteResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/routing/route`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ origin, destination, profile }),
  });
  if (!response.ok) {
    throw new Error(`Routing failed (${response.status})`);
  }
  return response.json() as Promise<GetRouteResponse>;
}
