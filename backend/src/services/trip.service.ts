import { ItineraryLabel, TravelPreference } from "@prisma/client";
import { prisma } from "../utils/prisma";
import { getCached, setCached } from "./cache.service";
import * as aiService from "./aiService.client";
import type { AccommodationTierFilter, TransportModeFilter, TravelPreferenceInput } from "./aiService.client";

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
  // gets persisted below.
  await aiService.optimizeCandidates(candidates);
  const { baseline_id: baselineId, recommendations } = await aiService.recommend(candidates);

  const itineraries = await Promise.all(
    recommendations.map(async (option) => {
      const itinerary = await prisma.itinerary.create({
        data: {
          tripId: trip.id,
          label: option.label as ItineraryLabel,
          totalCarbonKgCo2e: option.carbon.total_co2e,
          totalCostUsd: option.cost_usd,
          totalDurationHrs: option.duration_hrs,
          preferenceScore: option.preference_score,
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
        durationHrs: option.duration_hrs,
        preferenceScore: option.preference_score,
        explanation: option.explanation,
      };
    }),
  );

  return { tripId: trip.id, destinationId, baselineId, itineraries };
}
