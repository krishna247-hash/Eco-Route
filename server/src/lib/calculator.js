import {
  TRANSPORT_FACTORS,
  ACCOMMODATION_FACTORS,
  TREE_ANNUAL_SEQUESTRATION_KG,
  VEHICLE_CAPACITY,
} from './factors.js';

const round1 = (n) => Math.round(n * 10) / 10;

/** Great-circle distance in km between two [lat, lng] points. */
export function haversineKm([lat1, lng1], [lat2, lng2]) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** Ground routes are longer than the great circle; flights roughly follow it. */
export function routeDistanceKm(greatCircleKm, mode) {
  const detour = mode === 'flight' ? 1.08 : 1.25;
  return Math.round(greatCircleKm * detour);
}

export function vehiclesNeeded(passengers) {
  return Math.max(1, Math.ceil(passengers / VEHICLE_CAPACITY));
}

/** Total group transport emissions (kg CO2e) for one leg. */
export function calculateTransportEmissions(distanceKm, mode, passengers = 1) {
  const f = TRANSPORT_FACTORS[mode] ?? TRANSPORT_FACTORS.car;
  const units = f.perVehicle ? vehiclesNeeded(passengers) : passengers;
  return round1(distanceKm * f.factor * units);
}

/** Total stay emissions; one room per two travellers. */
export function calculateAccommodationEmissions(tier, nights, passengers = 1) {
  const f = ACCOMMODATION_FACTORS[tier] ?? ACCOMMODATION_FACTORS.standard_hotel;
  const rooms = Math.max(1, Math.ceil(passengers / 2));
  return round1(f.factor * nights * rooms);
}

/** Conventional baseline: return flight + standard hotel. */
export function calculateBaselineEmissions(distanceKm, nights, passengers = 1) {
  return round1(
    calculateTransportEmissions(distanceKm, 'flight', passengers) +
      calculateAccommodationEmissions('standard_hotel', nights, passengers)
  );
}

export function calculateTreesEquivalent(co2Kg) {
  return round1(Math.max(0, co2Kg) / TREE_ANNUAL_SEQUESTRATION_KG);
}

export function transportDurationHours(distanceKm, mode) {
  const f = TRANSPORT_FACTORS[mode] ?? TRANSPORT_FACTORS.car;
  let hours = distanceKm / f.speedKmh + f.overheadHours;
  // EV charging stops every ~300 km
  if (mode === 'ev') hours += Math.floor(distanceKm / 300) * 0.5;
  return round1(hours);
}

/** Estimated group ticket / fuel cost in USD for one leg. */
export function transportCost(distanceKm, mode, passengers = 1) {
  const vehicles = vehiclesNeeded(passengers);
  switch (mode) {
    case 'flight':
      return Math.round((60 + distanceKm * 0.1) * passengers);
    case 'train':
      return Math.round((12 + distanceKm * 0.13) * passengers);
    case 'bus':
      return Math.round((6 + distanceKm * 0.055) * passengers);
    case 'ev':
      return Math.round((55 + distanceKm * 0.05) * vehicles);
    case 'car':
    default:
      return Math.round((45 + distanceKm * 0.12) * vehicles);
  }
}
