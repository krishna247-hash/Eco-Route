export type TransportMode = 'train' | 'ev' | 'bus' | 'car' | 'flight';

export type HotelTier = 'eco_hostel' | 'eco_hotel' | 'standard_hotel' | 'luxury_resort';

export type OptimizationPriority = 'balanced' | 'eco' | 'speed' | 'budget';

export type PlanKey = 'ecoChampion' | 'balanced' | 'fastest';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface City {
  id: string;
  name: string;
  country: string;
  coords: Coordinates;
}

export interface TripLeg {
  id: string;
  mode: TransportMode;
  fromName: string;
  toName: string;
  description: string;
  distanceKm: number;
  durationHours: number;
  carbonKg: number;
}

export interface Accommodation {
  name: string;
  rating: number;
  pricePerNight: number;
  carbonKgPerNight: number;
  ecoCertifications: string[];
  ecoScore: string;
  sustainabilityHighlights: string[];
}

export interface Activity {
  id: string;
  name: string;
  category: string;
  description: string;
  durationHours: number;
  cost: number;
  carbonKg: number;
  coords?: Coordinates;
}

export interface DayPlan {
  dayNumber: number;
  date: string;
  city: string;
  legs: TripLeg[];
  activities: Activity[];
  dailyCarbonKg: number;
  dailyCost: number;
}

export interface PlanExplanation {
  summary: string;
  ecoScore: string;
  carbonSavingsKg: number;
  treesEquivalent: number;
  keyTradeoffs: string[];
  ecoHighlights: string[];
  actionableTips: string[];
  baselineComparison: {
    baselineCarbonKg: number;
    savingsPercentage: number;
  };
}

export interface ItineraryPlan {
  title: string;
  tagline: string;
  allLegs: TripLeg[];
  days: DayPlan[];
  accommodation: Accommodation;
  totalCarbonKg: number;
  totalCost: number;
  totalDurationHours: number;
  carbonSavedKg: number;
  carbonSavedPercentage: number;
  treesEquivalent: number;
  sustainabilityScore: number;
  explanation: PlanExplanation;
}

export interface OptimizationResult {
  origin: City;
  destination: City;
  totalDays: number;
  travelers: number;
  plans: {
    ecoChampion: ItineraryPlan;
    balanced: ItineraryPlan;
    fastest: ItineraryPlan;
  };
}

export interface TripPreferences {
  origin: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
  budget: number;
  priority: OptimizationPriority;
  preferredModes?: TransportMode[];
}
