// Haversine distance & carbon/cost/time accounting algorithms.

import { Coordinates, HotelTier, TransportMode } from '@/lib/types';
import {
  ACCOMMODATION_FACTORS,
  BASELINE_HOTEL_TIER,
  BASELINE_TRANSPORT_MODE,
  TRANSPORT_FACTORS,
  TREE_ANNUAL_SEQUESTRATION_KG,
} from './factors';

const EARTH_RADIUS_KM = 6371;

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function haversineDistanceKm(a: Coordinates, b: Coordinates): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));

  return Math.round(EARTH_RADIUS_KM * c);
}

function transportFactorOrFallback(mode: TransportMode) {
  return TRANSPORT_FACTORS[mode] ?? TRANSPORT_FACTORS.car;
}

function accommodationFactorOrFallback(tier: HotelTier) {
  return ACCOMMODATION_FACTORS[tier] ?? ACCOMMODATION_FACTORS.standard_hotel;
}

export function calculateTransportEmissions(
  distanceKm: number,
  mode: TransportMode,
  passengers = 1
): number {
  const { emissionFactor } = transportFactorOrFallback(mode);
  return round1(distanceKm * emissionFactor * Math.max(1, passengers));
}

export function calculateTransportCost(
  distanceKm: number,
  mode: TransportMode,
  passengers = 1
): number {
  const { costPerKm, baseFare } = transportFactorOrFallback(mode);
  return round1((baseFare + distanceKm * costPerKm) * Math.max(1, passengers));
}

export function calculateTransportDurationHours(distanceKm: number, mode: TransportMode): number {
  const { speedKmh, overheadHours } = transportFactorOrFallback(mode);
  return round1(distanceKm / speedKmh + overheadHours);
}

export function calculateAccommodationEmissions(tier: HotelTier, nights: number): number {
  const { carbonKgPerNight } = accommodationFactorOrFallback(tier);
  return round1(carbonKgPerNight * Math.max(0, nights));
}

export function calculateAccommodationCost(tier: HotelTier, nights: number): number {
  const { pricePerNight } = accommodationFactorOrFallback(tier);
  return round1(pricePerNight * Math.max(0, nights));
}

// Conventional, unoptimized baseline: commercial flight + standard hotel,
// used as the comparative benchmark throughout the dashboard and API.
export function calculateBaselineEmissions(
  distanceKm: number,
  nights: number,
  passengers = 1
): number {
  const transport = calculateTransportEmissions(distanceKm, BASELINE_TRANSPORT_MODE, passengers);
  const hotel = calculateAccommodationEmissions(BASELINE_HOTEL_TIER, nights);
  return round1(transport + hotel);
}

export function calculateTreesEquivalent(carbonKg: number): number {
  return Math.max(0, Math.round(carbonKg / TREE_ANNUAL_SEQUESTRATION_KG));
}
