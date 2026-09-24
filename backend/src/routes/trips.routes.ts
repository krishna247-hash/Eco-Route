import { Router } from "express";
import { authMiddleware, type AuthedRequest } from "../middleware/auth.middleware";
import { AppError } from "../utils/AppError";
import { getTrip, listUserTrips, planTrip, type DestinationInput } from "../services/trip.service";
import type {
  AccommodationTierFilter,
  TransportModeFilter,
  TravelPreferenceInput,
} from "../services/aiService.client";

export const tripsRouter = Router();

const PREFERENCES: TravelPreferenceInput[] = ["eco", "balanced", "budget", "speed"];
const TRANSPORT_MODES: TransportModeFilter[] = ["car", "train", "bus", "flight"];
const ACCOMMODATION_TIERS: AccommodationTierFilter[] = ["budget", "standard", "eco"];

function isDestinationInput(value: unknown): value is DestinationInput {
  if (typeof value !== "object" || value === null) return false;
  const d = value as Record<string, unknown>;
  return (
    typeof d.name === "string" &&
    typeof d.country === "string" &&
    typeof d.latitude === "number" &&
    typeof d.longitude === "number"
  );
}

tripsRouter.post("/plan", authMiddleware, async (req: AuthedRequest, res, next) => {
  try {
    const body = req.body ?? {};
    const {
      origin,
      destination,
      distanceKm,
      startDate,
      endDate,
      travelers,
      budgetUsd,
      preference,
      activityHours,
      transportModeFilter,
      accommodationTierFilter,
    } = body;

    if (typeof origin !== "string" || !origin.trim()) {
      throw new AppError(400, "origin is required");
    }
    if (!isDestinationInput(destination)) {
      throw new AppError(400, "destination must include name, country, latitude, longitude");
    }
    if (typeof distanceKm !== "number" || distanceKm <= 0) {
      throw new AppError(400, "distanceKm must be a positive number");
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      throw new AppError(400, "startDate and endDate must be valid dates, with endDate after startDate");
    }
    if (typeof travelers !== "number" || travelers < 1) {
      throw new AppError(400, "travelers must be at least 1");
    }
    if (preference !== undefined && !PREFERENCES.includes(preference)) {
      throw new AppError(400, `preference must be one of ${PREFERENCES.join(", ")}`);
    }
    if (budgetUsd !== undefined && typeof budgetUsd !== "number") {
      throw new AppError(400, "budgetUsd must be a number if provided");
    }
    if (activityHours !== undefined && (typeof activityHours !== "number" || activityHours < 0)) {
      throw new AppError(400, "activityHours must be a non-negative number if provided");
    }
    if (transportModeFilter !== undefined && !TRANSPORT_MODES.includes(transportModeFilter)) {
      throw new AppError(400, `transportModeFilter must be one of ${TRANSPORT_MODES.join(", ")}`);
    }
    if (accommodationTierFilter !== undefined && !ACCOMMODATION_TIERS.includes(accommodationTierFilter)) {
      throw new AppError(400, `accommodationTierFilter must be one of ${ACCOMMODATION_TIERS.join(", ")}`);
    }

    const result = await planTrip(req.userId as string, {
      origin,
      destination,
      distanceKm,
      startDate,
      endDate,
      travelers,
      budgetUsd,
      preference: preference ?? "balanced",
      activityHours: activityHours ?? 4,
      transportModeFilter,
      accommodationTierFilter,
    });

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

tripsRouter.get("/", authMiddleware, async (req: AuthedRequest, res, next) => {
  try {
    const trips = await listUserTrips(req.userId as string);
    res.status(200).json({ trips });
  } catch (err) {
    next(err);
  }
});

tripsRouter.get("/:id", authMiddleware, async (req: AuthedRequest, res, next) => {
  try {
    const trip = await getTrip(req.params.id, req.userId as string);
    if (!trip) {
      throw new AppError(404, "Trip not found");
    }
    res.status(200).json(trip);
  } catch (err) {
    next(err);
  }
});
