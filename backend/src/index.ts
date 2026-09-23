import "dotenv/config";
import { app } from "./app";
import { prisma } from "./utils/prisma";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

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
