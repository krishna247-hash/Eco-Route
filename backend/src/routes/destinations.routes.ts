import { Router } from "express";
import { AppError } from "../utils/AppError";
import { getDestinationSummary, getFamousPlaces } from "../services/destination.service";
import { getWeather } from "../services/weather.service";

export const destinationsRouter = Router();

function parseCoords(query: Record<string, unknown>): { lat: number; lon: number } {
  const lat = Number(query.lat);
  const lon = Number(query.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    throw new AppError(400, "lat/lon query params are required and must be valid coordinates");
  }
  return { lat, lon };
}

destinationsRouter.get("/weather", async (req, res, next) => {
  try {
    const { lat, lon } = parseCoords(req.query as Record<string, unknown>);
    const weather = await getWeather(lat, lon);
    res.status(200).json({ weather });
  } catch (err) {
    next(err);
  }
});

destinationsRouter.get("/:name/summary", async (req, res, next) => {
  try {
    const summary = await getDestinationSummary(req.params.name);
    res.status(200).json({ summary });
  } catch (err) {
    next(err);
  }
});

destinationsRouter.get("/:name/attractions", async (req, res, next) => {
  try {
    const { lat, lon } = parseCoords(req.query as Record<string, unknown>);
    const attractions = await getFamousPlaces(lat, lon);
    res.status(200).json({ attractions });
  } catch (err) {
    next(err);
  }
});
