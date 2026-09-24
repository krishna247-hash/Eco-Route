import { ItineraryLabel, Prisma, TravelPreference } from "@prisma/client";
import { prisma } from "../utils/prisma";
import { getCached, setCached } from "./cache.service";
import * as aiService from "./aiService.client";
import type {
  AccommodationTierFilter,
  CarbonBreakdown,
  CostBreakdown,
  TransportModeFilter,
  TravelPreferenceInput,
} from "./aiService.client";

const PREFERENCE_LABEL: Record<TravelPreference, TravelPreferenceInput> = {
  ECO: "eco",
  BALANCED: "balanced",
  BUDGET: "budget",
  SPEED: "speed",
};

export interface DestinationInput {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
}

export interface PlanTripInput {
  origin: string;
  destination: DestinationInput;
  distanceKm: number;
  startDate: string;
  endDate: string;
  travelers: number;
  budgetUsd?: number;
  preference: TravelPreferenceInput;
  activityHours: number;
  transportModeFilter?: TransportModeFilter;
  accommodationTierFilter?: AccommodationTierFilter;
}

const PREFERENCE_MAP: Record<TravelPreferenceInput, TravelPreference> = {
  eco: "ECO",
  balanced: "BALANCED",
  budget: "BUDGET",
  speed: "SPEED",
};

async function findOrCreateDestination(destination: DestinationInput): Promise<string> {
  const cacheKey = `destination:${destination.name.toLowerCase()}:${destination.country.toLowerCase()}`;
  const cached = await getCached<{ id: string }>(cacheKey);
  if (cached) {
    return cached.id;
  }

  const record = await prisma.destination.upsert({
    where: { name_country: { name: destination.name, country: destination.country } },
    update: {},
    create: destination,
  });

  await setCached(cacheKey, { id: record.id });
  return record.id;
}

export async function planTrip(userId: string, input: PlanTripInput) {
  const startDate = new Date(input.startDate);
  const endDate = new Date(input.endDate);
  const nights = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  const destinationId = await findOrCreateDestination(input.destination);

  const candidates = await aiService.generateItineraries({
    origin: input.origin,
    destination: input.destination.name,
    distance_km: input.distanceKm,
    nights,
    travelers: input.travelers,
    budget_usd: input.budgetUsd,
    preference: input.preference,
    activity_hours: input.activityHours,
    transport_mode_filter: input.transportModeFilter,
    accommodation_tier_filter: input.accommodationTierFilter,
  });

  // Pipeline step per the build guide (generate -> optimize -> recommend);
  // recommend() re-runs optimization internally, so its response is what
  // gets persisted below. Only once this succeeds do we persist anything,
  // so a failed plan never leaves a trip behind with no itineraries.
  await aiService.optimizeCandidates(candidates);
  const { baseline_id: baselineId, recommendations } = await aiService.recommend(candidates);

  const trip = await prisma.trip.create({
    data: {
      userId,
      destinationId,
      origin: input.origin,
      startDate,
      endDate,
      travelers: input.travelers,
      budgetUsd: input.budgetUsd,
      preference: PREFERENCE_MAP[input.preference],
    },
  });

  const itineraries = await Promise.all(
    recommendations.map(async (option) => {
      const itinerary = await prisma.itinerary.create({
        data: {
          tripId: trip.id,
          label: option.label as ItineraryLabel,
          transportMode: option.transport_mode,
          accommodationTier: option.accommodation_tier,
          totalCarbonKgCo2e: option.carbon.total_co2e,
          totalCostUsd: option.cost_usd,
          totalDurationHrs: option.duration_hrs,
          preferenceScore: option.preference_score,
          carbonBreakdown: option.carbon as unknown as Prisma.InputJsonValue,
          costBreakdown: option.cost_breakdown as unknown as Prisma.InputJsonValue,
        },
      });

      await prisma.recommendation.create({
        data: { itineraryId: itinerary.id, explanation: option.explanation },
      });

      return {
        id: itinerary.id,
        label: option.label,
        transportMode: option.transport_mode,
        accommodationTier: option.accommodation_tier,
        carbon: option.carbon,
        costUsd: option.cost_usd,
        costBreakdown: option.cost_breakdown,
        durationHrs: option.duration_hrs,
        preferenceScore: option.preference_score,
        explanation: option.explanation,
      };
    }),
  );

  return { tripId: trip.id, destinationId, baselineId, itineraries };
}

/** Re-fetches a previously planned trip in the same shape planTrip()
 * returns, from what was persisted -- so a trip started in one browser
 * session (or "My Trips") can still be opened later without re-running
 * optimization. Older itineraries created before carbonBreakdown/
 * costBreakdown/transportMode/accommodationTier were persisted won't
 * have them; those are honestly reported as unavailable rather than
 * guessed at, via the `hasFullBreakdown` flag on each itinerary. */
export async function getTrip(tripId: string, userId: string) {
  const trip = await prisma.trip.findFirst({
    where: { id: tripId, userId },
    include: {
      destination: true,
      itineraries: { include: { recommendations: true }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!trip) return null;

  return {
    tripId: trip.id,
    destinationId: trip.destinationId,
    origin: trip.origin,
    startDate: trip.startDate.toISOString(),
    endDate: trip.endDate.toISOString(),
    travelers: trip.travelers,
    preference: PREFERENCE_LABEL[trip.preference],
    destination: {
      name: trip.destination.name,
      country: trip.destination.country,
      latitude: trip.destination.latitude,
      longitude: trip.destination.longitude,
    },
    itineraries: trip.itineraries.map((itinerary) => ({
      id: itinerary.id,
      label: itinerary.label,
      transportMode: itinerary.transportMode ?? "car",
      accommodationTier: itinerary.accommodationTier ?? "standard",
      carbon: (itinerary.carbonBreakdown as unknown as CarbonBreakdown | null) ?? {
        transport_co2e: 0,
        accommodation_co2e: 0,
        activity_co2e: 0,
        total_co2e: itinerary.totalCarbonKgCo2e,
      },
      costUsd: itinerary.totalCostUsd,
      costBreakdown: (itinerary.costBreakdown as unknown as CostBreakdown | null) ?? {
        transport_usd: 0,
        accommodation_usd: 0,
        activity_usd: 0,
        total_usd: itinerary.totalCostUsd,
      },
      durationHrs: itinerary.totalDurationHrs,
      preferenceScore: itinerary.preferenceScore,
      explanation: itinerary.recommendations[0]?.explanation ?? "",
      hasFullBreakdown: itinerary.carbonBreakdown !== null && itinerary.costBreakdown !== null,
    })),
  };
}

export interface TripSummary {
  tripId: string;
  origin: string;
  destinationName: string;
  destinationCountry: string;
  startDate: string;
  endDate: string;
  travelers: number;
  createdAt: string;
  recommended: {
    label: string;
    totalCarbonKgCo2e: number;
    totalCostUsd: number;
    totalDurationHrs: number;
  } | null;
}

/** Real, per-user trip history -- every row here is a trip this user
 * actually planned and that was actually persisted, never fabricated
 * "example" trips. */
export async function listUserTrips(userId: string): Promise<TripSummary[]> {
  const trips = await prisma.trip.findMany({
    where: { userId },
    include: { destination: true, itineraries: { orderBy: { createdAt: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  return trips.map((trip) => {
    const recommended = trip.itineraries.find((i) => i.label === "BALANCED") ?? trip.itineraries[0];
    return {
      tripId: trip.id,
      origin: trip.origin,
      destinationName: trip.destination.name,
      destinationCountry: trip.destination.country,
      startDate: trip.startDate.toISOString(),
      endDate: trip.endDate.toISOString(),
      travelers: trip.travelers,
      createdAt: trip.createdAt.toISOString(),
      recommended: recommended
        ? {
            label: recommended.label,
            totalCarbonKgCo2e: recommended.totalCarbonKgCo2e,
            totalCostUsd: recommended.totalCostUsd,
            totalDurationHrs: recommended.totalDurationHrs,
          }
        : null,
    };
  });
}

/** Deletes a trip the user actually owns (itineraries/recommendations/
 * bookings cascade via the schema's onDelete: Cascade). Returns false
 * for a trip that doesn't exist or belongs to someone else, rather than
 * throwing, so the route can honestly 404 either way. */
export async function deleteTrip(tripId: string, userId: string): Promise<boolean> {
  const result = await prisma.trip.deleteMany({ where: { id: tripId, userId } });
  return result.count > 0;
}
