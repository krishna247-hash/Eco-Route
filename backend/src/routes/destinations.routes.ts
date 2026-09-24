import { Router } from "express";
import { AppError } from "../utils/AppError";
import { getDestinationSummary, getFamousPlaces } from "../services/destination.service";

export const destinationsRouter = Router();

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
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      throw new AppError(400, "lat/lon query params are required and must be valid coordinates");
    }
    const attractions = await getFamousPlaces(lat, lon);
    res.status(200).json({ attractions });
  } catch (err) {
    next(err);
  }
});
