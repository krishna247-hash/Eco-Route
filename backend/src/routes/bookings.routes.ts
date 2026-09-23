import { Router } from "express";
import { authMiddleware, type AuthedRequest } from "../middleware/auth.middleware";
import { AppError } from "../utils/AppError";
import { prisma } from "../utils/prisma";

export const bookingsRouter = Router();

const TIERS = ["budget", "standard", "eco"] as const;

const DISCLAIMER =
  "This saves your selection to your EcoRoute trip. It is not a live hotel reservation -- no real hotel provider is connected, so no actual room has been booked.";

async function loadOwnedTrip(tripId: unknown, userId: string) {
  if (typeof tripId !== "string" || !tripId) {
    throw new AppError(400, "tripId is required");
  }
  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip || trip.userId !== userId) {
    throw new AppError(404, "Trip not found");
  }
  return trip;
}

bookingsRouter.post("/", authMiddleware, async (req: AuthedRequest, res, next) => {
  try {
    const body = req.body ?? {};
    const { tripId, hotelId, hotelName, tier, checkIn, checkOut, guests, pricePerNightUsd, totalPriceUsd } = body;

    await loadOwnedTrip(tripId, req.userId as string);

    if (typeof hotelId !== "string" || !hotelId) throw new AppError(400, "hotelId is required");
    if (typeof hotelName !== "string" || !hotelName) throw new AppError(400, "hotelName is required");
    if (!TIERS.includes(tier)) throw new AppError(400, `tier must be one of ${TIERS.join(", ")}`);

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    if (Number.isNaN(checkInDate.getTime()) || Number.isNaN(checkOutDate.getTime()) || checkOutDate <= checkInDate) {
      throw new AppError(400, "checkIn and checkOut must be valid dates, with checkOut after checkIn");
    }
    if (typeof guests !== "number" || guests < 1) throw new AppError(400, "guests must be a positive number");
    if (typeof pricePerNightUsd !== "number" || pricePerNightUsd <= 0) {
      throw new AppError(400, "pricePerNightUsd must be a positive number");
    }
    if (typeof totalPriceUsd !== "number" || totalPriceUsd <= 0) {
      throw new AppError(400, "totalPriceUsd must be a positive number");
    }

    const booking = await prisma.booking.create({
      data: {
        tripId,
        hotelId,
        hotelName,
        tier,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        guests,
        pricePerNightUsd,
        totalPriceUsd,
      },
    });

    res.status(201).json({ ...booking, disclaimer: DISCLAIMER });
  } catch (err) {
    next(err);
  }
});

bookingsRouter.get("/trip/:tripId", authMiddleware, async (req: AuthedRequest, res, next) => {
  try {
    await loadOwnedTrip(req.params.tripId, req.userId as string);
    const bookings = await prisma.booking.findMany({
      where: { tripId: req.params.tripId, status: "SAVED" },
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json({ bookings, disclaimer: DISCLAIMER });
  } catch (err) {
    next(err);
  }
});

bookingsRouter.delete("/:id", authMiddleware, async (req: AuthedRequest, res, next) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { trip: true },
    });
    if (!booking || booking.trip.userId !== req.userId) {
      throw new AppError(404, "Booking not found");
    }

    await prisma.booking.update({ where: { id: booking.id }, data: { status: "CANCELLED" } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
