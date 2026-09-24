import { Router } from "express";
import { AppError } from "../utils/AppError";
import { getHotelProvider, type AccommodationTier } from "../services/hotel.service";

export const hotelsRouter = Router();

const TIERS: AccommodationTier[] = ["budget", "standard", "eco"];

hotelsRouter.get("/search", async (req, res, next) => {
  try {
    const { destinationName, destinationCountry, destinationLat, destinationLon, checkIn, checkOut, guests, tier } =
      req.query;

    if (typeof destinationName !== "string" || !destinationName.trim()) {
      throw new AppError(400, "destinationName is required");
    }
    const checkInDate = new Date(String(checkIn));
    const checkOutDate = new Date(String(checkOut));
    if (Number.isNaN(checkInDate.getTime()) || Number.isNaN(checkOutDate.getTime()) || checkOutDate <= checkInDate) {
      throw new AppError(400, "checkIn and checkOut must be valid dates, with checkOut after checkIn");
    }
    const guestsNum = Number(guests ?? 1);
    if (!Number.isFinite(guestsNum) || guestsNum < 1) {
      throw new AppError(400, "guests must be a positive number");
    }
    if (tier !== undefined && !TIERS.includes(tier as AccommodationTier)) {
      throw new AppError(400, `tier must be one of ${TIERS.join(", ")}`);
    }
    let lat: number | undefined;
    let lon: number | undefined;
    if (destinationLat !== undefined || destinationLon !== undefined) {
      lat = Number(destinationLat);
      lon = Number(destinationLon);
      if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        throw new AppError(400, "destinationLat/destinationLon must be valid coordinates when provided");
      }
    }

    const provider = getHotelProvider();
    const result = await provider.search({
      destinationName: destinationName as string,
      destinationCountry: typeof destinationCountry === "string" ? destinationCountry : "",
      destinationLat: lat,
      destinationLon: lon,
      checkIn: String(checkIn),
      checkOut: String(checkOut),
      guests: guestsNum,
      tier: tier as AccommodationTier | undefined,
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});
