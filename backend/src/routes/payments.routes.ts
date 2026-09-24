import { Router } from "express";
import { authMiddleware, type AuthedRequest } from "../middleware/auth.middleware";
import { AppError } from "../utils/AppError";
import { prisma } from "../utils/prisma";
import { createCheckoutSession, isPaymentConfigured } from "../services/payment.service";

export const paymentsRouter = Router();

function nightsBetween(checkIn: Date, checkOut: Date): number {
  const ms = checkOut.getTime() - checkIn.getTime();
  return Math.max(Math.round(ms / (1000 * 60 * 60 * 24)), 1);
}

function isHttpUrl(value: unknown): value is string {
  return typeof value === "string" && (value.startsWith("http://") || value.startsWith("https://"));
}

paymentsRouter.get("/status", (_req, res) => {
  res.status(200).json({ configured: isPaymentConfigured() });
});

paymentsRouter.post("/checkout", authMiddleware, async (req: AuthedRequest, res, next) => {
  try {
    const { bookingId, successUrl, cancelUrl } = req.body ?? {};

    if (typeof bookingId !== "string" || !bookingId) {
      throw new AppError(400, "bookingId is required");
    }
    if (!isHttpUrl(successUrl) || !isHttpUrl(cancelUrl)) {
      throw new AppError(400, "successUrl and cancelUrl must be http(s) URLs");
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { trip: true },
    });
    if (!booking || booking.trip.userId !== req.userId || booking.status !== "SAVED") {
      throw new AppError(404, "Booking not found");
    }

    const { checkoutUrl } = await createCheckoutSession({
      bookingId: booking.id,
      hotelName: booking.hotelName,
      totalPriceUsd: booking.totalPriceUsd,
      nights: nightsBetween(booking.checkIn, booking.checkOut),
      successUrl,
      cancelUrl,
    });

    res.status(200).json({ checkoutUrl });
  } catch (err) {
    next(err);
  }
});
