/**
 * Popular travel destinations for EcoRoute
 */

import { City } from '@/lib/types';

export const POPULAR_CITIES: City[] = [
  // North America
  {
    id: 'nyc',
    name: 'New York',
    country: 'United States',
    lat: 40.7128,
    lng: -74.0060,
    population: 8000000,
  },
  {
    id: 'los',
    name: 'Los Angeles',
    country: 'United States',
    lat: 34.0522,
    lng: -118.2437,
    population: 3900000,
  },
  {
    id: 'sf',
    name: 'San Francisco',
    country: 'United States',
    lat: 37.7749,
    lng: -122.4194,
    population: 880000,
  },
  {
    id: 'toronto',
    name: 'Toronto',
    country: 'Canada',
    lat: 43.6532,
    lng: -79.3832,
    population: 2930000,
  },

  // Europe
  {
    id: 'london',
    name: 'London',
    country: 'United Kingdom',
    lat: 51.5074,
    lng: -0.1278,
    population: 9000000,
  },
  {
    id: 'paris',
    name: 'Paris',
    country: 'France',
    lat: 48.8566,
    lng: 2.3522,
    population: 2161000,
  },
  {
    id: 'berlin',
    name: 'Berlin',
    country: 'Germany',
    lat: 52.5200,
    lng: 13.4050,
    population: 3645000,
  },
  {
    id: 'amsterdam',
    name: 'Amsterdam',
    country: 'Netherlands',
    lat: 52.3676,
    lng: 4.9041,
    population: 873000,
  },
  {
    id: 'barcelona',
    name: 'Barcelona',
    country: 'Spain',
    lat: 41.3851,
    lng: 2.1734,
    population: 1620000,
  },
  {
    id: 'rome',
    name: 'Rome',
    country: 'Italy',
    lat: 41.9028,
    lng: 12.4964,
    population: 2873000,
  },

  // Asia
  {
    id: 'tokyo',
    name: 'Tokyo',
    country: 'Japan',
    lat: 35.6762,
    lng: 139.6503,
    population: 13960000,
  },
  {
    id: 'bangkok',
    name: 'Bangkok',
    country: 'Thailand',
    lat: 13.7563,
    lng: 100.5018,
    population: 5104000,
  },
  {
    id: 'singpaore',
    name: 'Singapore',
    country: 'Singapore',
    lat: 1.3521,
    lng: 103.8198,
    population: 5850000,
  },
  {
    id: 'hk',
    name: 'Hong Kong',
    country: 'Hong Kong',
    lat: 22.3193,
    lng: 114.1694,
    population: 7496000,
  },
  {
    id: 'delhi',
    name: 'Delhi',
    country: 'India',
    lat: 28.7041,
    lng: 77.1025,
    population: 16753235,
  },

  // South America
  {
    id: 'buenos-aires',
    name: 'Buenos Aires',
    country: 'Argentina',
    lat: -34.6037,
    lng: -58.3816,
    population: 2890000,
  },
  {
    id: 'sao-paulo',
    name: 'São Paulo',
    country: 'Brazil',
    lat: -23.5505,
    lng: -46.6333,
    population: 11895893,
  },
  {
    id: 'lima',
    name: 'Lima',
    country: 'Peru',
    lat: -12.0464,
    lng: -77.0428,
    population: 8574974,
  },

  // Africa
  {
    id: 'cairo',
    name: 'Cairo',
    country: 'Egypt',
    lat: 30.0444,
    lng: 31.2357,
    population: 20076000,
  },
  {
    id: 'johannesburg',
    name: 'Johannesburg',
    country: 'South Africa',
    lat: -26.2023,
    lng: 28.0436,
    population: 4434827,
  },

  // Oceania
  {
    id: 'sydney',
    name: 'Sydney',
    country: 'Australia',
    lat: -33.8688,
    lng: 151.2093,
    population: 5312000,
  },
  {
    id: 'melbourne',
    name: 'Melbourne',
    country: 'Australia',
    lat: -37.8136,
    lng: 144.9631,
    population: 5159211,
  },
];

export const CITY_MAP = new Map(POPULAR_CITIES.map(city => [city.id, city]));

export function getCityById(id: string): City | undefined {
  return CITY_MAP.get(id);
}

export function searchCities(query: string): City[] {
  const q = query.toLowerCase();
  return POPULAR_CITIES.filter(
    city => city.name.toLowerCase().includes(q) || city.country.toLowerCase().includes(q)
  );
}
