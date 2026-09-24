// Pareto dominance & Knee-point extraction — the multi-objective
// optimization engine. Solves for the non-dominated frontier across
// carbon, cost, and time, then extracts the three hallmark solutions:
// the Eco-Champion, the Speed-Priority, and the EcoRoute Optimal
// (balanced) knee point via normalized Euclidean distance to the
// utopia point.

import {
  Accommodation,
  Activity,
  DayPlan,
  HotelTier,
  ItineraryPlan,
  OptimizationResult,
  TransportMode,
  TripLeg,
  TripPreferences,
} from '@/lib/types';
import { City } from '@/lib/data/destinations';
import {
  calculateAccommodationCost,
  calculateAccommodationEmissions,
  calculateTransportCost,
  calculateTransportDurationHours,
  calculateTransportEmissions,
  calculateTreesEquivalent,
  haversineDistanceKm,
} from '@/lib/carbon/calculator';
import {
  ACCOMMODATION_FACTORS,
  BASELINE_HOTEL_TIER,
  BASELINE_TRANSPORT_MODE,
  TRANSPORT_FACTORS,
} from '@/lib/carbon/factors';
import { explainPlan } from '@/lib/ai/explain';

const ALL_MODES: TransportMode[] = ['train', 'ev', 'bus', 'car', 'flight'];
const ALL_TIERS: HotelTier[] = ['eco_hostel', 'eco_hotel', 'standard_hotel', 'luxury_resort'];

type PlanKey = 'ecoChampion' | 'balanced' | 'fastest';

interface Candidate {
  mode: TransportMode;
  tier: HotelTier;
  carbon: number;
  cost: number;
  time: number;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function diffDaysInclusive(startDate: string, endDate: string): number {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 4;
  return Math.round((end - start) / 86400000);
}

function buildCandidate(
  mode: TransportMode,
  tier: HotelTier,
  distanceKm: number,
  nights: number,
  travelers: number
): Candidate {
  const transportCarbon = calculateTransportEmissions(distanceKm, mode, travelers) * 2;
  const transportCost = calculateTransportCost(distanceKm, mode, travelers) * 2;
  const transportTime = calculateTransportDurationHours(distanceKm, mode) * 2;
  const hotelCarbon = calculateAccommodationEmissions(tier, nights);
  const hotelCost = calculateAccommodationCost(tier, nights);

  return {
    mode,
    tier,
    carbon: round1(transportCarbon + hotelCarbon),
    cost: round1(transportCost + hotelCost),
    time: round1(transportTime),
  };
}

function dominates(a: Candidate, b: Candidate): boolean {
  const notWorse = a.carbon <= b.carbon && a.cost <= b.cost && a.time <= b.time;
  const strictlyBetter = a.carbon < b.carbon || a.cost < b.cost || a.time < b.time;
  return notWorse && strictlyBetter;
}

function paretoFront(candidates: Candidate[]): Candidate[] {
  return candidates.filter((c) => !candidates.some((other) => other !== c && dominates(other, c)));
}

function kneePoint(front: Candidate[]): Candidate {
  const carbons = front.map((c) => c.carbon);
  const times = front.map((c) => c.time);
  const minC = Math.min(...carbons);
  const maxC = Math.max(...carbons);
  const minT = Math.min(...times);
  const maxT = Math.max(...times);

  let best = front[0];
  let bestDistance = Infinity;

  for (const c of front) {
    const normC = (c.carbon - minC) / (maxC - minC + 1e-5);
    const normT = (c.time - minT) / (maxT - minT + 1e-5);
    const distance = Math.sqrt(2 * normC ** 2 + 1 * normT ** 2);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = c;
    }
  }

  return best;
}

interface DayPlanResult {
  days: DayPlan[];
  activitiesCarbonKg: number;
  activitiesCost: number;
}

function buildDayPlans(
  totalDays: number,
  nights: number,
  destination: City,
  outboundLeg: TripLeg,
  returnLeg: TripLeg,
  startDateStr: string,
  accommodation: Accommodation
): DayPlanResult {
  const parsedStart = new Date(startDateStr);
  const validStart = Number.isNaN(parsedStart.getTime()) ? new Date() : parsedStart;
  const attractions = destination.attractions;

  const days: DayPlan[] = [];
  let activitiesCarbonKg = 0;
  let activitiesCost = 0;
  let cursor = 0;

  for (let d = 1; d <= totalDays; d++) {
    const date = new Date(validStart.getTime() + (d - 1) * 86400000).toISOString().split('T')[0];
    const legs: TripLeg[] = [];
    if (d === 1) legs.push(outboundLeg);
    if (d === totalDays) legs.push(returnLeg);

    const isMiddleDay = d > 1 && d < totalDays;
    const isSoleFullDay = totalDays === 2 && d === 1;

    let dayActivities: Activity[] = [];
    if ((isMiddleDay || isSoleFullDay) && attractions.length > 0) {
      const count = isMiddleDay ? Math.min(2, attractions.length) : 1;
      for (let i = 0; i < count; i++) {
        dayActivities.push(attractions[cursor % attractions.length]);
        cursor++;
      }
    }

    const dayActivitiesCarbon = round1(dayActivities.reduce((sum, a) => sum + a.carbonKg, 0));
    const dayActivitiesCost = round1(dayActivities.reduce((sum, a) => sum + a.cost, 0));
    activitiesCarbonKg += dayActivitiesCarbon;
    activitiesCost += dayActivitiesCost;

    const hasHotelNight = d <= nights;
    const dailyHotelCarbon = hasHotelNight ? accommodation.carbonKgPerNight : 0;
    const dailyHotelCost = hasHotelNight ? accommodation.pricePerNight : 0;

    const legsCarbon = round1(legs.reduce((sum, l) => sum + l.carbonKg, 0));
    const legsCost = round1(legs.reduce((sum, l) => sum + l.cost, 0));

    days.push({
      dayNumber: d,
      date,
      city: destination.name,
      legs,
      activities: dayActivities,
      dailyCarbonKg: round1(legsCarbon + dailyHotelCarbon + dayActivitiesCarbon),
      dailyCost: round1(legsCost + dailyHotelCost + dayActivitiesCost),
    });
  }

  return {
    days,
    activitiesCarbonKg: round1(activitiesCarbonKg),
    activitiesCost: round1(activitiesCost),
  };
}

const TITLES: Record<PlanKey, string> = {
  ecoChampion: 'Eco-Champion',
  balanced: 'EcoRoute Optimal (Balanced)',
  fastest: 'Speed-Priority',
};

function buildPlan(
  key: PlanKey,
  candidate: Candidate,
  origin: City,
  destination: City,
  prefs: TripPreferences,
  distanceKm: number,
  nights: number,
  totalDays: number,
  travelers: number,
  baselineCarbonKg: number
): ItineraryPlan {
  const { mode, tier } = candidate;
  const modeFactor = TRANSPORT_FACTORS[mode];
  const hotelFactor = ACCOMMODATION_FACTORS[tier];

  const outboundLeg: TripLeg = {
    id: `${key}-outbound`,
    mode,
    fromName: origin.name,
    toName: destination.name,
    distanceKm,
    durationHours: calculateTransportDurationHours(distanceKm, mode),
    carbonKg: calculateTransportEmissions(distanceKm, mode, travelers),
    cost: calculateTransportCost(distanceKm, mode, travelers),
    description: `${modeFactor.label} service from ${origin.name} to ${destination.name}.`,
  };

  const returnLeg: TripLeg = {
    id: `${key}-return`,
    mode,
    fromName: destination.name,
    toName: origin.name,
    distanceKm,
    durationHours: calculateTransportDurationHours(distanceKm, mode),
    carbonKg: calculateTransportEmissions(distanceKm, mode, travelers),
    cost: calculateTransportCost(distanceKm, mode, travelers),
    description: `Return ${modeFactor.label.toLowerCase()} service from ${destination.name} to ${origin.name}.`,
  };

  const accommodation: Accommodation = {
    name: destination.hotelNames[tier],
    tier,
    rating: hotelFactor.rating,
    ecoScore: hotelFactor.ecoScore,
    ecoCertifications: hotelFactor.ecoCertifications,
    pricePerNight: hotelFactor.pricePerNight,
    carbonKgPerNight: hotelFactor.carbonKgPerNight,
    sustainabilityHighlights: hotelFactor.sustainabilityHighlights,
  };

  const { days, activitiesCarbonKg, activitiesCost } = buildDayPlans(
    totalDays,
    nights,
    destination,
    outboundLeg,
    returnLeg,
    prefs.startDate,
    accommodation
  );

  const transportCarbon = round1(outboundLeg.carbonKg + returnLeg.carbonKg);
  const transportCost = round1(outboundLeg.cost + returnLeg.cost);
  const hotelCarbon = calculateAccommodationEmissions(tier, nights);
  const hotelCost = calculateAccommodationCost(tier, nights);

  const totalCarbonKg = round1(transportCarbon + hotelCarbon + activitiesCarbonKg);
  const totalCost = round1(transportCost + hotelCost + activitiesCost);
  const totalDurationHours = round1(outboundLeg.durationHours + returnLeg.durationHours);

  const carbonSavedKg = Math.max(0, round1(baselineCarbonKg - totalCarbonKg));
  const carbonSavedPercentage =
    baselineCarbonKg > 0 ? Math.round((carbonSavedKg / baselineCarbonKg) * 100) : 0;
  const treesEquivalent = calculateTreesEquivalent(carbonSavedKg);

  const modeBonus = mode === 'train' || mode === 'ev' ? 12 : mode === 'bus' ? 6 : 0;
  const hotelBonus = tier === 'eco_hostel' || tier === 'eco_hotel' ? 8 : 0;
  const sustainabilityScore = Math.max(
    5,
    Math.min(100, Math.round(carbonSavedPercentage * 0.8 + modeBonus + hotelBonus))
  );

  const explanation = explainPlan({
    planKind: key,
    mode,
    hotelTier: tier,
    priority: prefs.priority,
    totalCarbonKg,
    totalCost,
    totalDurationHours,
    carbonSavedKg,
    carbonSavedPercentage,
    treesEquivalent,
    baselineCarbonKg,
    sustainabilityScore,
  });

  const taglines: Record<PlanKey, string> = {
    ecoChampion: `Absolute minimum-carbon pathway via ${modeFactor.label}.`,
    balanced: 'Pareto knee-point balancing carbon, cost, and time.',
    fastest: `Minimizes total travel time via ${modeFactor.label}.`,
  };

  return {
    key,
    title: TITLES[key],
    tagline: taglines[key],
    mode,
    totalCarbonKg,
    carbonSavedKg,
    carbonSavedPercentage,
    totalCost,
    totalDurationHours,
    sustainabilityScore,
    treesEquivalent,
    allLegs: [outboundLeg, returnLeg],
    days,
    accommodation,
    explanation,
  };
}

export function optimizeItinerary(
  origin: City,
  destination: City,
  prefs: TripPreferences
): OptimizationResult {
  const distanceKm = haversineDistanceKm(origin.coords, destination.coords);
  const travelers = Math.max(1, Math.round(prefs.travelers) || 1);

  const rawDays = diffDaysInclusive(prefs.startDate, prefs.endDate);
  const totalDays = Math.max(2, rawDays > 0 ? rawDays : 4);
  const nights = totalDays - 1;

  const candidateModes =
    prefs.preferredModes && prefs.preferredModes.length > 0 ? prefs.preferredModes : ALL_MODES;

  const candidates: Candidate[] = [];
  for (const mode of candidateModes) {
    for (const tier of ALL_TIERS) {
      candidates.push(buildCandidate(mode, tier, distanceKm, nights, travelers));
    }
  }

  const front = paretoFront(candidates);
  const pool = front.length > 0 ? front : candidates;

  const ecoCandidate = [...pool].sort((a, b) => a.carbon - b.carbon || a.cost - b.cost)[0];
  const fastestCandidate = [...pool].sort((a, b) => a.time - b.time || a.carbon - b.carbon)[0];
  const balancedCandidate = pool.length > 1 ? kneePoint(pool) : pool[0];

  const baselineTransportCarbon =
    calculateTransportEmissions(distanceKm, BASELINE_TRANSPORT_MODE, travelers) * 2;
  const baselineHotelCarbon = calculateAccommodationEmissions(BASELINE_HOTEL_TIER, nights);
  const baselineCarbonKg = round1(baselineTransportCarbon + baselineHotelCarbon);

  const ecoChampion = buildPlan(
    'ecoChampion',
    ecoCandidate,
    origin,
    destination,
    prefs,
    distanceKm,
    nights,
    totalDays,
    travelers,
    baselineCarbonKg
  );
  const fastest = buildPlan(
    'fastest',
    fastestCandidate,
    origin,
    destination,
    prefs,
    distanceKm,
    nights,
    totalDays,
    travelers,
    baselineCarbonKg
  );
  const balanced = buildPlan(
    'balanced',
    balancedCandidate,
    origin,
    destination,
    prefs,
    distanceKm,
    nights,
    totalDays,
    travelers,
    baselineCarbonKg
  );

  return {
    origin: { id: origin.id, name: origin.name, country: origin.country, coords: origin.coords },
    destination: {
      id: destination.id,
      name: destination.name,
      country: destination.country,
      coords: destination.coords,
    },
    totalDays,
    travelers,
    plans: { ecoChampion, balanced, fastest },
  };
}
