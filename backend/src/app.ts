import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.routes";
import { tripsRouter } from "./routes/trips.routes";
import { locationsRouter } from "./routes/locations.routes";
import { routingRouter } from "./routes/routing.routes";
import { hotelsRouter } from "./routes/hotels.routes";
import { bookingsRouter } from "./routes/bookings.routes";
import { errorMiddleware } from "./middleware/error.middleware";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/trips", tripsRouter);
app.use("/api/v1/locations", locationsRouter);
app.use("/api/v1/routing", routingRouter);
app.use("/api/v1/hotels", hotelsRouter);
app.use("/api/v1/bookings", bookingsRouter);

app.use(errorMiddleware);
