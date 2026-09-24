import { Router } from "express";
import { AppError } from "../utils/AppError";
import { reverseGeocode, searchLocations } from "../services/location.service";

export const locationsRouter = Router();

locationsRouter.get("/search", async (req, res, next) => {
  try {
    const q = req.query.q;
    if (typeof q !== "string" || !q.trim()) {
      throw new AppError(400, "q is required");
    }
    const results = await searchLocations(q);
    res.status(200).json({ results });
  } catch (err) {
    next(err);
  }
});

locationsRouter.get("/reverse", async (req, res, next) => {
  try {
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      throw new AppError(400, "lat and lon are required numeric query params");
    }
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      throw new AppError(400, "lat must be in [-90, 90] and lon in [-180, 180]");
    }
    const result = await reverseGeocode(lat, lon);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});
