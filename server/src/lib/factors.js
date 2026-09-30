/**
 * DEFRA 2023 & ICAO greenhouse-gas emission factors.
 * Transport factors are kg CO2e per passenger-km, except road vehicles
 * (car, ev), which are per vehicle-km and shared between occupants.
 */

export const TRANSPORT_FACTORS = {
  train: {
    label: 'Electric High-Speed Rail',
    factor: 0.032,
    perVehicle: false,
    source: 'DEFRA 2023 Passenger Transit',
    speedKmh: 180,
    overheadHours: 0.5,
    maxKm: 2500,
    color: '#10b981',
  },
  ev: {
    label: 'Electric Car (EV)',
    factor: 0.042,
    perVehicle: true,
    source: 'European Grid Electricity Average',
    speedKmh: 85,
    overheadHours: 0.25,
    maxKm: 1500,
    color: '#06b6d4',
  },
  bus: {
    label: 'Express Coach / Bus',
    factor: 0.055,
    perVehicle: false,
    source: 'DEFRA 2023 Bus & Coach',
    speedKmh: 70,
    overheadHours: 0.5,
    maxKm: 2000,
    color: '#f59e0b',
  },
  car: {
    label: 'Average Petrol Car (ICE)',
    factor: 0.171,
    perVehicle: true,
    source: 'DEFRA 2023 Medium Car',
    speedKmh: 85,
    overheadHours: 0.25,
    maxKm: 1500,
    color: '#64748b',
  },
  flight: {
    label: 'Commercial Flight',
    factor: 0.255,
    perVehicle: false,
    source: 'ICAO + 1.9x Radiative Forcing Index',
    speedKmh: 780,
    overheadHours: 3,
    maxKm: Infinity,
    color: '#f43f5e',
  },
};

export const ACCOMMODATION_FACTORS = {
  eco_hotel: {
    label: 'Eco-Certified Hotel',
    factor: 12.0,
    pricePerNight: 115,
    rating: 4.4,
    source: 'LEED / Green Key Benchmark',
  },
  hostel: {
    label: 'Eco Hostel / Guesthouse',
    factor: 6.0,
    pricePerNight: 45,
    rating: 4.0,
    source: 'Cornell Hotel Sustainability Benchmarking',
  },
  standard_hotel: {
    label: 'Standard City Hotel',
    factor: 26.5,
    pricePerNight: 140,
    rating: 4.1,
    source: 'Global Hotel Decarbonisation Study',
  },
  luxury_hotel: {
    label: 'Luxury Resort Hotel',
    factor: 40.0,
    pricePerNight: 290,
    rating: 4.8,
    source: 'Global Hotel Decarbonisation Study',
  },
};

/** One mature tree sequesters ~21.77 kg CO2 per year. */
export const TREE_ANNUAL_SEQUESTRATION_KG = 21.77;

/** Car/EV occupancy is capped at this many passengers per vehicle. */
export const VEHICLE_CAPACITY = 4;
