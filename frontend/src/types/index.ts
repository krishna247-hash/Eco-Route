export type TravelPreference = 'eco' | 'balanced' | 'budget' | 'speed';
export type TransportModeFilter = 'car' | 'train' | 'bus' | 'flight';
export type AccommodationTierFilter = 'budget' | 'standard' | 'eco';

export interface DestinationInput {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
}

export interface PlanTripRequest {
  origin: string;
  destination: DestinationInput;
  distanceKm: number;
  startDate: string;
  endDate: string;
  travelers: number;
  budgetUsd?: number;
  preference: TravelPreference;
  activityHours?: number;
  transportModeFilter?: TransportModeFilter;
  accommodationTierFilter?: AccommodationTierFilter;
}

export interface CarbonBreakdown {
  transport_co2e: number;
  accommodation_co2e: number;
  activity_co2e: number;
  total_co2e: number;
}

export interface CostBreakdown {
  transport_usd: number;
  accommodation_usd: number;
  activity_usd: number;
  total_usd: number;
}

export type ItineraryLabel = 'LOW_CARBON' | 'BALANCED' | 'LOW_COST' | 'TIME_EFFICIENT' | 'PREFERENCE_FOCUSED';

export interface ItineraryOption {
  id: string;
  label: ItineraryLabel;
  transportMode: string;
  accommodationTier: string;
  carbon: CarbonBreakdown;
  costUsd: number;
  costBreakdown: CostBreakdown;
  durationHrs: number;
  preferenceScore: number;
  explanation: string;
}

export interface PlanTripResponse {
  tripId: string;
  destinationId: string;
  baselineId: string;
  itineraries: ItineraryOption[];
}

/** What gets persisted client-side after planning, since there is no
 * GET-by-id backend route yet — the itinerary/compare pages read the
 * result that planTrip() already returned. */
export interface StoredTripResult {
  request: PlanTripRequest;
  response: PlanTripResponse;
}
