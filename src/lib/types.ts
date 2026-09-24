// Core TypeScript domain models shared across the carbon engine, the
// Pareto optimizer, the Explainable AI layer, and the UI.

export type TransportMode = 'train' | 'flight' | 'bus' | 'ev' | 'car';

export type HotelTier = 'eco_hostel' | 'eco_hotel' | 'standard_hotel' | 'luxury_resort';

export type OptimizationPriority = 'balanced' | 'eco' | 'speed' | 'budget';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface TripLeg {
  id: string;
  mode: TransportMode;
  fromName: string;
  toName: string;
  distanceKm: number;
  durationHours: number;
  carbonKg: number;
  cost: number;
  description: string;
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

export interface Accommodation {
  name: string;
  tier: HotelTier;
  rating: number;
  ecoScore: string;
  ecoCertifications: string[];
  pricePerNight: number;
  carbonKgPerNight: number;
  sustainabilityHighlights: string[];
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

export interface BaselineComparison {
  baselineCarbonKg: number;
  savingsPercentage: number;
}

export interface PlanExplanation {
  summary: string;
  keyTradeoffs: string[];
  ecoHighlights: string[];
  actionableTips: string[];
  ecoScore: string;
  carbonSavingsKg: number;
  treesEquivalent: number;
  baselineComparison: BaselineComparison;
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

export interface ItineraryPlan {
  key: 'ecoChampion' | 'balanced' | 'fastest';
  title: string;
  tagline: string;
  mode: TransportMode;
  totalCarbonKg: number;
  carbonSavedKg: number;
  carbonSavedPercentage: number;
  totalCost: number;
  totalDurationHours: number;
  sustainabilityScore: number;
  treesEquivalent: number;
  allLegs: TripLeg[];
  days: DayPlan[];
  accommodation: Accommodation;
  explanation: PlanExplanation;
}

export interface CityNode {
  id: string;
  name: string;
  country: string;
  coords: Coordinates;
}

export interface OptimizationResult {
  origin: CityNode;
  destination: CityNode;
  totalDays: number;
  travelers: number;
  plans: {
    ecoChampion: ItineraryPlan;
    balanced: ItineraryPlan;
    fastest: ItineraryPlan;
  };
}
