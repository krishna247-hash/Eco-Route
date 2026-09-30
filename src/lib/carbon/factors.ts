/**
 * DEFRA 2023 & ICAO Carbon Emission Factors
 * Scientific basis for carbon footprint calculations
 */

export const TRANSPORT_EMISSIONS = {
  // Flight - ICAO factors, kg CO2e per km per passenger
  flight: {
    shortHaul: 0.268, // <900 km
    mediumHaul: 0.234, // 900-3700 km
    longHaul: 0.195, // >3700 km
    average: 0.254, // Blended average
  },

  // Rail - DEFRA 2023, kg CO2e per km per passenger
  train: {
    electric: 0.016, // Electric trains (low emissions)
    diesel: 0.089, // Diesel trains
    average: 0.041, // Blended
  },

  // Bus - DEFRA 2023, kg CO2e per km per passenger
  bus: {
    longDistance: 0.027,
    urban: 0.089,
    average: 0.040,
  },

  // Car - DEFRA 2023, kg CO2e per km per passenger
  car: {
    petrol: 0.192,
    diesel: 0.184,
    hybrid: 0.120,
    electric: 0.050,
    average: 0.192,
  },
};

export const ACCOMMODATION_EMISSIONS = {
  // kg CO2e per night
  hotel: {
    luxury: 40,
    midRange: 25,
    budget: 12,
  },

  airbnb: {
    shared: 12,
    private: 18,
    average: 15,
  },

  hostel: {
    dorm: 5,
    private: 8,
    average: 6,
  },

  villa: 35,
  resort: 50,
};

export const ACTIVITY_EMISSIONS = {
  // kg CO2e per activity
  hiking: 0.5,
  museum: 2,
  restaurant: 5,
  shopping: 3,
  adventure: 15, // Paragliding, zip-lining, etc.
  waterspouts: 20,
  skiing: 25,
};

export const FOOD_EMISSIONS = {
  // kg CO2e per meal
  meatHeavy: 4,
  meatLight: 2.5,
  vegetarian: 1.5,
  vegan: 0.8,
};

export const CARBON_OFFSET = {
  treesPerKgCO2: 1 / 21, // 1 tree = ~21kg CO2 over 10 years
  minutesBycyclePerKgCO2: 60, // ~1kg CO2 saved per 60 min of cycling
  minutesWalkingPerKgCO2: 120, // ~1kg CO2 saved per 120 min of walking
};

/**
 * Get blended emission factor for a transport mode
 */
export function getEmissionFactor(mode: string): number {
  const modes: Record<string, number> = {
    flight: TRANSPORT_EMISSIONS.flight.average,
    train: TRANSPORT_EMISSIONS.train.average,
    bus: TRANSPORT_EMISSIONS.bus.average,
    car: TRANSPORT_EMISSIONS.car.average,
    electric_car: TRANSPORT_EMISSIONS.car.electric,
    hybrid_car: TRANSPORT_EMISSIONS.car.hybrid,
  };

  return modes[mode] || modes.car;
}

/**
 * Get accommodation emissions for a stay
 */
export function getAccommodationEmissions(
  nights: number,
  type: 'hotel' | 'airbnb' | 'hostel' = 'hotel',
  level: 'budget' | 'midRange' | 'luxury' = 'midRange'
): number {
  let factor = 0;

  if (type === 'hotel') {
    factor = ACCOMMODATION_EMISSIONS.hotel[level];
  } else if (type === 'airbnb') {
    factor = level === 'budget' ? ACCOMMODATION_EMISSIONS.airbnb.shared :
             level === 'luxury' ? ACCOMMODATION_EMISSIONS.airbnb.private :
             ACCOMMODATION_EMISSIONS.airbnb.average;
  } else if (type === 'hostel') {
    factor = ACCOMMODATION_EMISSIONS.hostel.average;
  }

  return nights * factor;
}
