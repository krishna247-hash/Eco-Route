import { HotelTier, TransportMode } from '../types';

// kg CO2e / passenger-km (train, bus, flight) or vehicle-km (ev, car)
// DEFRA 2023 Passenger Transport & Bus/Coach tables; flight includes the
// ICAO 1.9x radiative forcing index for short-haul; ev/car use European
// grid electricity average and DEFRA medium petrol car respectively.
export const TRANSPORT_FACTORS: Record<TransportMode, number> = {
  train: 0.032,
  ev: 0.042,
  bus: 0.055,
  car: 0.171,
  flight: 0.255,
};

export const TRANSPORT_SPEEDS_KMH: Record<TransportMode, number> = {
  train: 180,
  ev: 95,
  car: 95,
  bus: 80,
  flight: 750,
};

// USD / km, blended fare + operating cost per passenger
export const TRANSPORT_COST_PER_KM: Record<TransportMode, number> = {
  train: 0.11,
  ev: 0.08,
  car: 0.14,
  bus: 0.06,
  flight: 0.16,
};

// Fixed check-in / boarding / security overhead applied once per leg
export const TRANSPORT_OVERHEAD_HOURS: Record<TransportMode, number> = {
  train: 0.3,
  ev: 0.1,
  car: 0.1,
  bus: 0.3,
  flight: 2.2,
};

export interface AccommodationFactor {
  carbonKgPerNight: number;
  pricePerNight: number;
  ecoScore: string;
  ratingDefault: number;
}

// kg CO2e / room-night and USD / room-night, LEED / Green Key benchmarks
export const ACCOMMODATION_FACTORS: Record<HotelTier, AccommodationFactor> = {
  eco_hostel: { carbonKgPerNight: 7.5, pricePerNight: 45, ecoScore: 'Green Key Certified', ratingDefault: 4.1 },
  eco_hotel: { carbonKgPerNight: 12.0, pricePerNight: 120, ecoScore: 'LEED Gold Certified', ratingDefault: 4.6 },
  standard_hotel: { carbonKgPerNight: 26.5, pricePerNight: 140, ecoScore: 'Standard Rated', ratingDefault: 4.2 },
  luxury_resort: { carbonKgPerNight: 58.0, pricePerNight: 320, ecoScore: 'Premium Offset Tier', ratingDefault: 4.8 },
};

// kg CO2 absorbed per year by one mature tree, used for tree-equivalent conversions
export const TREE_ANNUAL_SEQUESTRATION_KG = 21.77;

// Conventional unoptimized baseline: short-haul flight + standard 4-star hotel
export const BASELINE_MODE: TransportMode = 'flight';
export const BASELINE_HOTEL_TIER: HotelTier = 'standard_hotel';
