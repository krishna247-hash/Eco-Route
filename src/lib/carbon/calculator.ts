import { Coordinates, HotelTier, TransportMode } from '../types';
import {
  ACCOMMODATION_FACTORS,
  BASELINE_HOTEL_TIER,
  BASELINE_MODE,
  TRANSPORT_COST_PER_KM,
  TRANSPORT_FACTORS,
  TRANSPORT_OVERHEAD_HOURS,
  TRANSPORT_SPEEDS_KMH,
  TREE_ANNUAL_SEQUESTRATION_KG,
} from './factors';

const round1 = (value: number) => Math.round(value * 10) / 10;

export function haversineDistanceKm(a: Coordinates, b: Coordinates): number {
  const EARTH_RADIUS_KM = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function calculateTransportEmissions(
  distanceKm: number,
  mode: TransportMode,
  passengers = 1
): number {
  const factor = TRANSPORT_FACTORS[mode] ?? TRANSPORT_FACTORS.car;
  return round1(distanceKm * factor * Math.max(1, passengers));
}

export function calculateTransportDurationHours(distanceKm: number, mode: TransportMode): number {
  const speed = TRANSPORT_SPEEDS_KMH[mode] ?? TRANSPORT_SPEEDS_KMH.car;
  const overhead = TRANSPORT_OVERHEAD_HOURS[mode] ?? TRANSPORT_OVERHEAD_HOURS.car;
  return round1(distanceKm / speed + overhead);
}

export function calculateTransportCost(
  distanceKm: number,
  mode: TransportMode,
  passengers = 1
): number {
  const ratePerKm = TRANSPORT_COST_PER_KM[mode] ?? TRANSPORT_COST_PER_KM.car;
  const baseFare = 25;
  return round1((baseFare + distanceKm * ratePerKm) * Math.max(1, passengers));
}

export function calculateAccommodationEmissions(hotelTier: HotelTier, nights: number): number {
  return round1(ACCOMMODATION_FACTORS[hotelTier].carbonKgPerNight * Math.max(1, nights));
}

export function calculateAccommodationCost(hotelTier: HotelTier, nights: number): number {
  return round1(ACCOMMODATION_FACTORS[hotelTier].pricePerNight * Math.max(1, nights));
}

export function calculateBaselineEmissions(
  distanceKm: number,
  nights: number,
  passengers = 1
): number {
  const transport = calculateTransportEmissions(distanceKm, BASELINE_MODE, passengers);
  const stay = calculateAccommodationEmissions(BASELINE_HOTEL_TIER, nights);
  return round1(transport + stay);
}

export function calculateTreesEquivalent(carbonKg: number): number {
  return Math.max(0, Math.round(carbonKg / TREE_ANNUAL_SEQUESTRATION_KG));
}
