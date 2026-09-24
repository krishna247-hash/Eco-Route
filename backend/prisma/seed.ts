import { PrismaClient, EmissionCategory } from "@prisma/client";

const prisma = new PrismaClient();

// Values follow the same standards the ai-service carbon engine will use
// (kept in sync with ai-service/app/data/emission_factors.json in Phase 4):
// UK DEFRA 2023 Greenhouse Gas Conversion Factors for transport modes, and
// the ICAO Carbon Emissions Calculator methodology (with DEFRA's radiative
// forcing index applied) for flights.
const emissionFactors = [
  {
    category: EmissionCategory.TRANSPORT,
    mode: "car",
    value: 0.171,
    unit: "kg CO2e/km",
    source: "UK DEFRA 2023 GHG Conversion Factors — Average Petrol/Diesel Car (Medium)",
    year: 2023,
    assumption:
      "Average UK medium petrol/diesel car; per-vehicle-km value divided by passenger count for per-passenger emissions.",
  },
  {
    category: EmissionCategory.TRANSPORT,
    mode: "train",
    value: 0.035,
    unit: "kg CO2e/passenger-km",
    source: "UK DEFRA 2023 GHG Conversion Factors — National Rail (average)",
    year: 2023,
    assumption: "UK national rail average across the current electrification/diesel traction mix.",
  },
  {
    category: EmissionCategory.TRANSPORT,
    mode: "bus",
    value: 0.105,
    unit: "kg CO2e/passenger-km",
    source: "UK DEFRA 2023 GHG Conversion Factors — Local Bus (not London), average occupancy",
    year: 2023,
    assumption: "Average local bus occupancy outside London; excludes coach/express services.",
  },
  {
    category: EmissionCategory.TRANSPORT,
    mode: "flight",
    value: 0.255,
    unit: "kg CO2e/passenger-km",
    source: "ICAO Carbon Emissions Calculator Methodology (2023), with DEFRA 1.9x radiative forcing index",
    year: 2023,
    assumption: "Short/medium-haul economy class average, including non-CO2 high-altitude warming effects.",
  },
  {
    category: EmissionCategory.ACCOMMODATION,
    mode: "hotel-night",
    value: 20.0,
    unit: "kg CO2e/room-night",
    source: "Cornell Hotel Sustainability Benchmarking Index 2023 (global blended average)",
    year: 2023,
    assumption: "Blended global average across hotel star ratings and climate zones; per occupied room-night.",
  },
];

async function main() {
  for (const factor of emissionFactors) {
    await prisma.emissionFactor.upsert({
      where: { category_mode: { category: factor.category, mode: factor.mode } },
      update: factor,
      create: factor,
    });
  }
  console.log(`Seeded ${emissionFactors.length} emission factors.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
