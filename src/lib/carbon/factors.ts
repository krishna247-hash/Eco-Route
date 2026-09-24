// Standardized DEFRA 2023 & ICAO Greenhouse Gas Protocol emission factor
// database used across the carbon engine and the optimizer.

import { HotelTier, TransportMode } from '@/lib/types';

export interface TransportFactor {
  label: string;
  emissionFactor: number; // kg CO2e per passenger-km
  speedKmh: number;
  costPerKm: number; // USD per km
  baseFare: number; // USD flat fare / terminal cost
  overheadHours: number; // check-in, security, transfers etc.
}

export const TRANSPORT_FACTORS: Record<TransportMode, TransportFactor> = {
  train: {
    label: 'Electric High-Speed Rail',
    emissionFactor: 0.032,
    speedKmh: 180,
    costPerKm: 0.11,
    baseFare: 15,
    overheadHours: 0.5,
  },
  ev: {
    label: 'Electric Car (EV)',
    emissionFactor: 0.042,
    speedKmh: 95,
    costPerKm: 0.08,
    baseFare: 10,
    overheadHours: 0.3,
  },
  bus: {
    label: 'Express Coach / Bus',
    emissionFactor: 0.055,
    speedKmh: 80,
    costPerKm: 0.06,
    baseFare: 8,
    overheadHours: 0.5,
  },
  car: {
    label: 'Average Petrol Car (ICE)',
    emissionFactor: 0.171,
    speedKmh: 95,
    costPerKm: 0.14,
    baseFare: 5,
    overheadHours: 0.3,
  },
  flight: {
    label: 'Domestic Flight',
    emissionFactor: 0.255,
    speedKmh: 750,
    costPerKm: 0.16,
    baseFare: 45,
    overheadHours: 2.5,
  },
};

export interface AccommodationFactor {
  label: string;
  carbonKgPerNight: number;
  pricePerNight: number;
  rating: number;
  ecoScore: string;
  ecoCertifications: string[];
  sustainabilityHighlights: string[];
}

export const ACCOMMODATION_FACTORS: Record<HotelTier, AccommodationFactor> = {
  eco_hostel: {
    label: 'Green Hostel',
    carbonKgPerNight: 7.5,
    pricePerNight: 45,
    rating: 4.1,
    ecoScore: 'A+',
    ecoCertifications: ['Green Key', 'Solar Powered'],
    sustainabilityHighlights: [
      'Community solar array offsets 80% of energy use',
      'Zero single-use plastic policy',
      'Shared bike fleet for guests',
    ],
  },
  eco_hotel: {
    label: 'Eco-Certified Hotel',
    carbonKgPerNight: 12.0,
    pricePerNight: 120,
    rating: 4.5,
    ecoScore: 'A+',
    ecoCertifications: ['LEED Gold', 'Green Key'],
    sustainabilityHighlights: [
      'LEED Gold certified low-carbon building envelope',
      'Locally sourced, plant-forward restaurant menu',
      'Grey-water recycling and low-flow fixtures',
    ],
  },
  standard_hotel: {
    label: 'Standard City Hotel',
    carbonKgPerNight: 26.5,
    pricePerNight: 140,
    rating: 4.0,
    ecoScore: 'C',
    ecoCertifications: [],
    sustainabilityHighlights: [
      'Central city location with standard amenities',
      'No formal sustainability certification on file',
    ],
  },
  luxury_resort: {
    label: 'Luxury Resort',
    carbonKgPerNight: 58.0,
    pricePerNight: 320,
    rating: 4.8,
    ecoScore: 'D',
    ecoCertifications: [],
    sustainabilityHighlights: [
      'Full-service spa, pool, and concierge amenities',
      'High energy intensity from climate control & laundry services',
    ],
  },
};

// Annual CO2 sequestration of a single mature tree (kg CO2 / year).
export const TREE_ANNUAL_SEQUESTRATION_KG = 21.77;

// The conventional, unoptimized baseline used for comparative benchmarking:
// a commercial flight paired with a standard 4-star hotel.
export const BASELINE_TRANSPORT_MODE: TransportMode = 'flight';
export const BASELINE_HOTEL_TIER: HotelTier = 'standard_hotel';
