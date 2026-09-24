const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

export type AccommodationTier = 'budget' | 'standard' | 'eco';

export interface HotelListing {
  id: string;
  name: string;
  tier: AccommodationTier;
  pricePerNightUsd: number;
  totalPriceUsd: number;
  currency: 'USD';
  rating: number;
  distanceFromCenterKm: number;
  amenities: string[];
  /** A real Wikimedia Commons photo, only present for the OSM venues that
   * actually carry one -- never a stock substitute for hotels without one. */
  photoUrl?: string;
}

export interface HotelSearchResponse {
  isDemoData: true;
  source: 'osm' | 'demo-generated';
  disclaimer: string;
  hotels: HotelListing[];
}

export async function searchHotels(params: {
  destinationName: string;
  destinationCountry: string;
  destinationLat?: number;
  destinationLon?: number;
  checkIn: string;
  checkOut: string;
  guests: number;
  tier?: AccommodationTier;
}): Promise<HotelSearchResponse> {
  const query = new URLSearchParams({
    destinationName: params.destinationName,
    destinationCountry: params.destinationCountry,
    checkIn: params.checkIn,
    checkOut: params.checkOut,
    guests: String(params.guests),
  });
  if (params.tier) query.set('tier', params.tier);
  if (params.destinationLat !== undefined && params.destinationLon !== undefined) {
    query.set('destinationLat', String(params.destinationLat));
    query.set('destinationLon', String(params.destinationLon));
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/hotels/search?${query.toString()}`);
  if (!response.ok) {
    throw new Error(`Hotel search failed (${response.status})`);
  }
  return response.json() as Promise<HotelSearchResponse>;
}
