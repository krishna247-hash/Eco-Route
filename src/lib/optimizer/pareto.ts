import { generateExplanation } from '../ai/explain';
import {
  calculateAccommodationCost,
  calculateAccommodationEmissions,
  calculateBaselineEmissions,
  calculateTransportCost,
  calculateTransportDurationHours,
  calculateTransportEmissions,
  calculateTreesEquivalent,
  haversineDistanceKm,
} from '../carbon/calculator';
import { getAccommodationForCity, getActivitiesForCity } from '../data/destinations';
import {
  Accommodation,
  Activity,
  City,
  DayPlan,
  HotelTier,
  ItineraryPlan,
  OptimizationResult,
  PlanKey,
  TransportMode,
  TripLeg,
  TripPreferences,
} from '../types';

const CANDIDATE_MODES: TransportMode[] = ['train', 'ev', 'bus', 'flight'];
const CANDIDATE_TIERS: HotelTier[] = ['eco_hostel', 'eco_hotel', 'standard_hotel', 'luxury_resort'];

const PLAN_META: Record<PlanKey, { title: string; tagline: string }> = {
  ecoChampion: {
    title: 'The Eco-Champion',
    tagline: 'Absolute minimum carbon footprint on the Pareto frontier.',
  },
  balanced: {
    title: 'EcoRoute Optimal',
    tagline: 'The knee-point balance of carbon, cost and travel time.',
  },
  fastest: {
    title: 'Speed-Priority',
    tagline: 'Minimum transit time while still abating emissions.',
  },
};

interface Candidate {
  mode: TransportMode;
  hotelTier: HotelTier;
  legCarbonKg: number;
  legCostUsd: number;
  legDurationHours: number;
  carbon: number;
  cost: number;
  time: number;
}

// A dominates B when it is no worse on every objective and strictly better on at least one
function dominates(a: Candidate, b: Candidate): boolean {
  const notWorse = a.carbon <= b.carbon && a.cost <= b.cost && a.time <= b.time;
  const strictlyBetter = a.carbon < b.carbon || a.cost < b.cost || a.time < b.time;
  return notWorse && strictlyBetter;
}

function paretoFrontier(candidates: Candidate[]): Candidate[] {
  return candidates.filter((c) => !candidates.some((other) => other !== c && dominates(other, c)));
}

function normalize(value: number, min: number, max: number): number {
  return max - min < 1e-9 ? 0 : (value - min) / (max - min);
}

// Knee point: the frontier candidate with the smallest normalized Euclidean
// distance to the utopia point (min carbon, min cost, min time)
function findKneePoint(frontier: Candidate[]): Candidate {
  const carbonRange = [Math.min(...frontier.map((c) => c.carbon)), Math.max(...frontier.map((c) => c.carbon))] as const;
  const costRange = [Math.min(...frontier.map((c) => c.cost)), Math.max(...frontier.map((c) => c.cost))] as const;
  const timeRange = [Math.min(...frontier.map((c) => c.time)), Math.max(...frontier.map((c) => c.time))] as const;

  let best = frontier[0];
  let bestDistance = Infinity;

  for (const candidate of frontier) {
    const nCarbon = normalize(candidate.carbon, ...carbonRange);
    const nCost = normalize(candidate.cost, ...costRange);
    const nTime = normalize(candidate.time, ...timeRange);
    const distance = Math.sqrt(nCarbon ** 2 + nCost ** 2 + nTime ** 2);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = candidate;
    }
  }

  return best;
}

function dateRangeDays(startDate: string, endDate: string): number {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return 4;
  const diffDays = Math.round((end - start) / 86400000);
  return Math.max(1, diffDays + 1);
}

function buildCandidate(mode: TransportMode, hotelTier: HotelTier, distanceKm: number, nights: number, travelers: number): Candidate {
  const legCarbonKg = calculateTransportEmissions(distanceKm, mode, travelers);
  const legCostUsd = calculateTransportCost(distanceKm, mode, travelers);
  const legDurationHours = calculateTransportDurationHours(distanceKm, mode);

  const stayCarbon = calculateAccommodationEmissions(hotelTier, nights);
  const stayCost = calculateAccommodationCost(hotelTier, nights);

  return {
    mode,
    hotelTier,
    legCarbonKg,
    legCostUsd,
    legDurationHours,
    carbon: Math.round((legCarbonKg * 2 + stayCarbon) * 10) / 10,
    cost: Math.round((legCostUsd * 2 + stayCost) * 10) / 10,
    time: Math.round(legDurationHours * 2 * 10) / 10,
  };
}

function buildLegs(origin: City, destination: City, candidate: Candidate, distanceKm: number): TripLeg[] {
  return [
    {
      id: `${origin.id}-${destination.id}-out`,
      mode: candidate.mode,
      fromName: origin.name,
      toName: destination.name,
      description: `Outbound transit from ${origin.name} to ${destination.name}.`,
      distanceKm: Math.round(distanceKm),
      durationHours: candidate.legDurationHours,
      carbonKg: candidate.legCarbonKg,
    },
    {
      id: `${destination.id}-${origin.id}-return`,
      mode: candidate.mode,
      fromName: destination.name,
      toName: origin.name,
      description: `Return transit from ${destination.name} to ${origin.name}.`,
      distanceKm: Math.round(distanceKm),
      durationHours: candidate.legDurationHours,
      carbonKg: candidate.legCarbonKg,
    },
  ];
}

function buildDays(
  destination: City,
  legs: TripLeg[],
  accommodation: Accommodation,
  startDate: string,
  totalDays: number,
  nights: number,
  travelers: number
): DayPlan[] {
  const activityPool = getActivitiesForCity(destination.id);
  const start = new Date(startDate);
  const days: DayPlan[] = [];

  for (let i = 0; i < totalDays; i++) {
    const date = new Date(start.getTime() + i * 86400000).toISOString().split('T')[0];
    const isFirstDay = i === 0;
    const isLastDay = i === totalDays - 1 && totalDays > 1;

    const dayLegs: TripLeg[] = [];
    if (isFirstDay) dayLegs.push(legs[0]);
    if (isLastDay) dayLegs.push(legs[1]);

    const activities: Activity[] = isFirstDay || isLastDay
      ? []
      : [activityPool[(i * 2) % activityPool.length], activityPool[(i * 2 + 1) % activityPool.length]];

    const staysOvernight = i < nights;
    const legCarbon = dayLegs.reduce((sum, leg) => sum + leg.carbonKg, 0);
    const legCost = dayLegs.reduce(
      (sum, leg) => sum + calculateTransportCost(leg.distanceKm, leg.mode, travelers),
      0
    );
    const activityCarbon = activities.reduce((sum, act) => sum + act.carbonKg * travelers, 0);
    const activityCost = activities.reduce((sum, act) => sum + act.cost * travelers, 0);
    const hotelCarbon = staysOvernight ? accommodation.carbonKgPerNight : 0;
    const hotelCost = staysOvernight ? accommodation.pricePerNight : 0;

    days.push({
      dayNumber: i + 1,
      date,
      city: destination.name,
      legs: dayLegs,
      activities,
      dailyCarbonKg: Math.round((legCarbon + activityCarbon + hotelCarbon) * 10) / 10,
      dailyCost: Math.round((legCost + activityCost + hotelCost) * 10) / 10,
    });
  }

  return days;
}

function buildPlan(
  planKey: PlanKey,
  origin: City,
  destination: City,
  candidate: Candidate,
  prefs: TripPreferences,
  distanceKm: number,
  totalDays: number,
  nights: number,
  travelers: number,
  baselineCarbonKg: number
): ItineraryPlan {
  const legs = buildLegs(origin, destination, candidate, distanceKm);
  const accommodation = getAccommodationForCity(destination, candidate.hotelTier);
  const days = buildDays(destination, legs, accommodation, prefs.startDate, totalDays, nights, travelers);

  const totalCarbonKg = candidate.carbon;
  const totalCost = candidate.cost;
  const totalDurationHours = Math.round(legs.reduce((sum, leg) => sum + leg.durationHours, 0) * 10) / 10;

  const carbonSavedKg = Math.max(0, Math.round((baselineCarbonKg - totalCarbonKg) * 10) / 10);
  const carbonSavedPercentage =
    baselineCarbonKg > 0 ? Math.round((carbonSavedKg / baselineCarbonKg) * 100) : 0;
  const treesEquivalent = calculateTreesEquivalent(carbonSavedKg);
  const sustainabilityScore = Math.min(100, Math.max(0, carbonSavedPercentage));

  const explanation = generateExplanation({
    planKey,
    mode: candidate.mode,
    hotelTier: candidate.hotelTier,
    totalCarbonKg,
    totalCost,
    totalDurationHours,
    baselineCarbonKg,
    destinationName: destination.name,
  });

  return {
    title: PLAN_META[planKey].title,
    tagline: PLAN_META[planKey].tagline,
    allLegs: legs,
    days,
    accommodation,
    totalCarbonKg,
    totalCost,
    totalDurationHours,
    carbonSavedKg,
    carbonSavedPercentage,
    treesEquivalent,
    sustainabilityScore,
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
  const totalDays = dateRangeDays(prefs.startDate, prefs.endDate);
  const nights = Math.max(1, totalDays - 1);
  const modes =
    prefs.preferredModes && prefs.preferredModes.length > 0 ? prefs.preferredModes : CANDIDATE_MODES;

  const candidates: Candidate[] = [];
  for (const mode of modes) {
    for (const hotelTier of CANDIDATE_TIERS) {
      candidates.push(buildCandidate(mode, hotelTier, distanceKm, nights, travelers));
    }
  }

  const frontier = paretoFrontier(candidates);
  const ecoChampionCandidate = frontier.reduce((best, c) => (c.carbon < best.carbon ? c : best), frontier[0]);
  const fastestCandidate = frontier.reduce((best, c) => (c.time < best.time ? c : best), frontier[0]);
  const balancedCandidate = findKneePoint(frontier);

  const baselineCarbonKg = calculateBaselineEmissions(distanceKm * 2, nights, travelers);

  return {
    origin,
    destination,
    totalDays,
    travelers,
    plans: {
      ecoChampion: buildPlan(
        'ecoChampion',
        origin,
        destination,
        ecoChampionCandidate,
        prefs,
        distanceKm,
        totalDays,
        nights,
        travelers,
        baselineCarbonKg
      ),
      balanced: buildPlan(
        'balanced',
        origin,
        destination,
        balancedCandidate,
        prefs,
        distanceKm,
        totalDays,
        nights,
        travelers,
        baselineCarbonKg
      ),
      fastest: buildPlan(
        'fastest',
        origin,
        destination,
        fastestCandidate,
        prefs,
        distanceKm,
        totalDays,
        nights,
        travelers,
        baselineCarbonKg
      ),
    },
  };
}
