import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.routes";
import { tripsRouter } from "./routes/trips.routes";
import { errorMiddleware } from "./middleware/error.middleware";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/trips", tripsRouter);

app.use(errorMiddleware);
