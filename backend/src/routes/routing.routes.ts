import { Router } from "express";
import { AppError } from "../utils/AppError";
import { getRoute, type RoutePoint } from "../services/routing.service";

export const routingRouter = Router();

const PROFILES = ["driving", "walking", "cycling"] as const;

function isPoint(value: unknown): value is RoutePoint {
  if (typeof value !== "object" || value === null) return false;
  const p = value as Record<string, unknown>;
  return typeof p.latitude === "number" && typeof p.longitude === "number";
}

routingRouter.post("/route", async (req, res, next) => {
  try {
    const body = req.body ?? {};
    const { origin, destination, profile } = body;

    if (!isPoint(origin) || !isPoint(destination)) {
      throw new AppError(400, "origin and destination must each include numeric latitude and longitude");
    }
    if (profile !== undefined && !PROFILES.includes(profile)) {
      throw new AppError(400, `profile must be one of ${PROFILES.join(", ")}`);
    }

    const result = await getRoute(origin, destination, profile ?? "driving");
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});
