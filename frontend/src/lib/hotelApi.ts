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
}

export interface HotelSearchResponse {
  isDemoData: true;
  source: 'demo-generated';
  disclaimer: string;
  hotels: HotelListing[];
}

export async function searchHotels(params: {
  destinationName: string;
  destinationCountry: string;
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

  const response = await fetch(`${API_BASE_URL}/api/v1/hotels/search?${query.toString()}`);
  if (!response.ok) {
    throw new Error(`Hotel search failed (${response.status})`);
  }
  return response.json() as Promise<HotelSearchResponse>;
}
