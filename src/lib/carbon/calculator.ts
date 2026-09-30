/**
 * Carbon Emissions Calculator
 * Using DEFRA 2023 and ICAO emission factors
 */

// DEFRA 2023 Emission Factors (kg CO2e per km per passenger)
const EMISSION_FACTORS = {
  flight: 0.254, // Average flights (short/medium/long haul blended)
  train: 0.016, // Electric trains
  bus: 0.027, // Long-distance coaches
  car: 0.192, // Average petrol car
  electric_car: 0.050, // Electric vehicle
  hybrid_car: 0.120, // Hybrid vehicle
};

/**
 * Calculate transport emissions based on distance and mode
 * @param distance - Distance in km
 * @param mode - Transportation mode
 * @param passengers - Number of passengers (for shared transport)
 * @returns CO2e emissions in kg
 */
export function calculateTransportEmissions(
  distance: number,
  mode: keyof typeof EMISSION_FACTORS,
  passengers: number = 1
): number {
  const factor = EMISSION_FACTORS[mode] || EMISSION_FACTORS.car;
  const totalEmissions = distance * factor * passengers;
  // Return per-passenger emissions (divide by passengers)
  return Math.round((totalEmissions / passengers) * 100) / 100;
}

/**
 * Calculate tree equivalents for CO2 sequestration
 * Assumes 1 tree sequesters ~21kg CO2 over 10 years
 * @param co2kg - CO2 in kilograms
 * @returns Number of trees needed to offset
 */
export function calculateTreesEquivalent(co2kg: number): number {
  const co2_per_tree = 21; // kg CO2 over 10 years
  return Math.round((co2kg / co2_per_tree) * 10) / 10;
}

/**
 * Get emission factor for a transport mode
 */
export function getEmissionFactor(mode: keyof typeof EMISSION_FACTORS): number {
  return EMISSION_FACTORS[mode] || EMISSION_FACTORS.car;
}

/**
 * Calculate daily activity emissions (accommodation, meals, activities)
 */
export function calculateActivityEmissions(
  nights: number,
  category: 'hotel' | 'airbnb' | 'hostel' = 'hotel'
): number {
  // Rough estimates for daily emissions from accommodation
  const factors = {
    hotel: 25, // kg CO2e per night (average hotel)
    airbnb: 15, // kg CO2e per night (shared/private)
    hostel: 8, // kg CO2e per night (budget accommodation)
  };

  return nights * (factors[category] || factors.hotel);
}

/**
 * Format emissions for display
 */
export function formatEmissions(co2kg: number): string {
  if (co2kg >= 1000) {
    return `${(co2kg / 1000).toFixed(2)} tonnes CO2e`;
  }
  return `${co2kg.toFixed(2)} kg CO2e`;
}
