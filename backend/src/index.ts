import "dotenv/config";
import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.routes";
import { tripsRouter } from "./routes/trips.routes";
import { errorMiddleware } from "./middleware/error.middleware";
import { prisma } from "./utils/prisma";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/trips", tripsRouter);

app.use(errorMiddleware);

async function start() {
  await prisma.$connect();
  app.listen(PORT, () => {
    console.log(`EcoRoute backend listening on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
