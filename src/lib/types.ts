/**
 * Core TypeScript types for EcoRoute
 */

export type TransportMode = 'flight' | 'train' | 'bus' | 'car' | 'electric_car' | 'hybrid_car';

export type OptimizationPriority = 'carbon' | 'cost' | 'time' | 'balanced';

export interface City {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  population?: number;
}

export interface TravelLeg {
  from: City;
  to: City;
  mode: TransportMode;
  distance: number; // km
  duration: number; // hours
  cost: number; // USD
  emissions: number; // kg CO2e
}

export interface Itinerary {
  id: string;
  startDate: Date;
  endDate: Date;
  legs: TravelLeg[];
  activities: Activity[];
  totalCost: number;
  totalEmissions: number;
  totalDuration: number;
}

export interface Activity {
  id: string;
  city: City;
  name: string;
  date: Date;
  emissions: number; // kg CO2e
  cost: number;
  duration: number; // hours
}

export interface TripPlan {
  origin: City;
  destination: City;
  startDate: Date;
  endDate: Date;
  numberOfTravelers: number;
  priority: OptimizationPriority;
  budget?: number;
  preferences?: {
    maxFlightDuration?: number;
    preferredTransportModes?: TransportMode[];
    comfortLevel?: 'budget' | 'comfort' | 'luxury';
  };
}

export interface ParetoPoint {
  cost: number;
  emissions: number;
  time: number;
  itinerary: Itinerary;
  comfortScore: number;
}

export interface ExplainabilityCard {
  title: string;
  description: string;
  reasoning: string;
  impact: string;
}
