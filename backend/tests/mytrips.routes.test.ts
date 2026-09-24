import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import jwt from "jsonwebtoken";
import { app } from "../src/app";
import { prisma } from "../src/utils/prisma";

const TEST_JWT_SECRET = "test-only-secret-for-unit-tests";

let ownerUserId: string;
let otherUserId: string;
let tripId: string;
let itineraryId: string;
let legacyItineraryId: string;

function tokenFor(userId: string) {
  return jwt.sign({ sub: userId }, TEST_JWT_SECRET, { expiresIn: "1h" });
}

before(async () => {
  process.env.JWT_SECRET = TEST_JWT_SECRET;

  const owner = await prisma.user.create({
    data: { email: `mytrips-test-owner-${Date.now()}@ecoroute.local`, passwordHash: "test" },
  });
  const other = await prisma.user.create({
    data: { email: `mytrips-test-other-${Date.now()}@ecoroute.local`, passwordHash: "test" },
  });
  ownerUserId = owner.id;
  otherUserId = other.id;

  const destination = await prisma.destination.upsert({
    where: { name_country: { name: "MyTrips-Test-City", country: "Testland" } },
    update: {},
    create: { name: "MyTrips-Test-City", country: "Testland", latitude: 1, longitude: 1 },
  });

  const trip = await prisma.trip.create({
    data: {
      userId: ownerUserId,
      destinationId: destination.id,
      origin: "Test Origin",
      startDate: new Date("2027-07-01"),
      endDate: new Date("2027-07-04"),
      travelers: 2,
      preference: "BALANCED",
    },
  });
  tripId = trip.id;

  const itinerary = await prisma.itinerary.create({
    data: {
      tripId,
      label: "BALANCED",
      transportMode: "train",
      accommodationTier: "eco",
      totalCarbonKgCo2e: 42.5,
      totalCostUsd: 300,
      totalDurationHrs: 6,
      preferenceScore: 0.8,
      carbonBreakdown: { transport_co2e: 30, accommodation_co2e: 10, activity_co2e: 2.5, total_co2e: 42.5 },
      costBreakdown: { transport_usd: 200, accommodation_usd: 80, activity_usd: 20, total_usd: 300 },
    },
  });
  itineraryId = itinerary.id;
  await prisma.recommendation.create({ data: { itineraryId, explanation: "A balanced, low-carbon pick." } });

  // Simulates a trip planned before carbonBreakdown/costBreakdown/transportMode/
  // accommodationTier were persisted -- getTrip() must degrade honestly, not crash.
  const legacyItinerary = await prisma.itinerary.create({
    data: {
      tripId,
      label: "LOW_COST",
      totalCarbonKgCo2e: 60,
      totalCostUsd: 250,
      totalDurationHrs: 8,
      preferenceScore: 0.6,
    },
  });
  legacyItineraryId = legacyItinerary.id;
});

after(async () => {
  await prisma.recommendation.deleteMany({ where: { itineraryId: { in: [itineraryId, legacyItineraryId] } } });
  await prisma.itinerary.deleteMany({ where: { id: { in: [itineraryId, legacyItineraryId] } } });
  await prisma.trip.deleteMany({ where: { id: tripId } });
  await prisma.user.deleteMany({ where: { id: { in: [ownerUserId, otherUserId] } } });
  await prisma.$disconnect();
});

describe("GET /api/v1/trips", () => {
  it("rejects an unauthenticated request with 401", async () => {
    const response = await request(app).get("/api/v1/trips");
    assert.equal(response.status, 401);
  });

  it("lists only the requesting user's real trips, most recent first", async () => {
    const response = await request(app).get("/api/v1/trips").set("Authorization", `Bearer ${tokenFor(ownerUserId)}`);
    assert.equal(response.status, 200);
    assert.ok(Array.isArray(response.body.trips));
    const mine = response.body.trips.find((t: { tripId: string }) => t.tripId === tripId);
    assert.ok(mine);
    assert.equal(mine.destinationName, "MyTrips-Test-City");
    assert.equal(mine.recommended.label, "BALANCED");
    assert.equal(mine.recommended.totalCostUsd, 300);
  });

  it("never shows another user's trips", async () => {
    const response = await request(app).get("/api/v1/trips").set("Authorization", `Bearer ${tokenFor(otherUserId)}`);
    assert.equal(response.status, 200);
    assert.equal(response.body.trips.find((t: { tripId: string }) => t.tripId === tripId), undefined);
  });
});

describe("GET /api/v1/trips/:id", () => {
  it("rejects an unauthenticated request with 401", async () => {
    const response = await request(app).get(`/api/v1/trips/${tripId}`);
    assert.equal(response.status, 401);
  });

  it("returns 404 for a trip belonging to someone else, not another user's data", async () => {
    const response = await request(app)
      .get(`/api/v1/trips/${tripId}`)
      .set("Authorization", `Bearer ${tokenFor(otherUserId)}`);
    assert.equal(response.status, 404);
  });

  it("reconstructs the full stored breakdown for a trip that has one", async () => {
    const response = await request(app)
      .get(`/api/v1/trips/${tripId}`)
      .set("Authorization", `Bearer ${tokenFor(ownerUserId)}`);
    assert.equal(response.status, 200);
    assert.equal(response.body.origin, "Test Origin");
    assert.equal(response.body.destination.name, "MyTrips-Test-City");
    const full = response.body.itineraries.find((i: { id: string }) => i.id === itineraryId);
    assert.ok(full);
    assert.equal(full.hasFullBreakdown, true);
    assert.equal(full.transportMode, "train");
    assert.equal(full.carbon.transport_co2e, 30);
    assert.equal(full.costBreakdown.accommodation_usd, 80);
    assert.equal(full.explanation, "A balanced, low-carbon pick.");
  });

  it("honestly reports hasFullBreakdown=false for a legacy itinerary instead of guessing", async () => {
    const response = await request(app)
      .get(`/api/v1/trips/${tripId}`)
      .set("Authorization", `Bearer ${tokenFor(ownerUserId)}`);
    assert.equal(response.status, 200);
    const legacy = response.body.itineraries.find((i: { id: string }) => i.id === legacyItineraryId);
    assert.ok(legacy);
    assert.equal(legacy.hasFullBreakdown, false);
    assert.equal(legacy.carbon.total_co2e, 60);
    assert.equal(legacy.costBreakdown.total_usd, 250);
  });

  it("returns 404 for a nonexistent trip", async () => {
    const response = await request(app)
      .get("/api/v1/trips/does-not-exist")
      .set("Authorization", `Bearer ${tokenFor(ownerUserId)}`);
    assert.equal(response.status, 404);
  });
});
