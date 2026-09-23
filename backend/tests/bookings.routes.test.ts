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
const createdBookingIds: string[] = [];

function tokenFor(userId: string) {
  return jwt.sign({ sub: userId }, TEST_JWT_SECRET, { expiresIn: "1h" });
}

before(async () => {
  process.env.JWT_SECRET = TEST_JWT_SECRET;

  const owner = await prisma.user.create({
    data: { email: `bookings-test-owner-${Date.now()}@ecoroute.local`, passwordHash: "test" },
  });
  const other = await prisma.user.create({
    data: { email: `bookings-test-other-${Date.now()}@ecoroute.local`, passwordHash: "test" },
  });
  ownerUserId = owner.id;
  otherUserId = other.id;

  const destination = await prisma.destination.upsert({
    where: { name_country: { name: "Bookings-Test-City", country: "Testland" } },
    update: {},
    create: { name: "Bookings-Test-City", country: "Testland", latitude: 1, longitude: 1 },
  });

  const trip = await prisma.trip.create({
    data: {
      userId: ownerUserId,
      destinationId: destination.id,
      origin: "Test Origin",
      startDate: new Date("2027-05-01"),
      endDate: new Date("2027-05-04"),
      travelers: 2,
    },
  });
  tripId = trip.id;
});

after(async () => {
  await prisma.booking.deleteMany({ where: { id: { in: createdBookingIds } } });
  await prisma.trip.deleteMany({ where: { id: tripId } });
  await prisma.user.deleteMany({ where: { id: { in: [ownerUserId, otherUserId] } } });
  await prisma.$disconnect();
});

const validBooking = {
  hotelId: "demo-abc123",
  hotelName: "Bookings-Test-City Grand Hotel",
  tier: "standard",
  checkIn: "2027-05-01",
  checkOut: "2027-05-04",
  guests: 2,
  pricePerNightUsd: 100,
  totalPriceUsd: 300,
};

describe("POST /api/v1/bookings", () => {
  it("rejects an unauthenticated request with 401", async () => {
    const response = await request(app).post("/api/v1/bookings").send({ tripId, ...validBooking });
    assert.equal(response.status, 401);
  });

  it("rejects a trip the caller doesn't own with 404", async () => {
    const response = await request(app)
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${tokenFor(otherUserId)}`)
      .send({ tripId, ...validBooking });
    assert.equal(response.status, 404);
  });

  it("rejects an invalid tier with 400", async () => {
    const response = await request(app)
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${tokenFor(ownerUserId)}`)
      .send({ tripId, ...validBooking, tier: "luxury" });
    assert.equal(response.status, 400);
  });

  it("rejects checkOut before checkIn with 400", async () => {
    const response = await request(app)
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${tokenFor(ownerUserId)}`)
      .send({ tripId, ...validBooking, checkIn: "2027-05-04", checkOut: "2027-05-01" });
    assert.equal(response.status, 400);
  });

  it("creates a real booking record and is explicit that it isn't a live reservation", async () => {
    const response = await request(app)
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${tokenFor(ownerUserId)}`)
      .send({ tripId, ...validBooking });
    assert.equal(response.status, 201);
    assert.equal(response.body.isDemoData, true);
    assert.equal(response.body.status, "SAVED");
    assert.match(response.body.disclaimer, /not a live hotel reservation/i);
    assert.equal(response.body.hotelName, validBooking.hotelName);
    createdBookingIds.push(response.body.id);

    const stored = await prisma.booking.findUnique({ where: { id: response.body.id } });
    assert.ok(stored, "booking should actually be persisted in Postgres");
  });
});

describe("GET /api/v1/bookings/trip/:tripId", () => {
  it("rejects an unauthenticated request with 401", async () => {
    const response = await request(app).get(`/api/v1/bookings/trip/${tripId}`);
    assert.equal(response.status, 401);
  });

  it("lists only the caller's own saved bookings for the trip", async () => {
    const response = await request(app)
      .get(`/api/v1/bookings/trip/${tripId}`)
      .set("Authorization", `Bearer ${tokenFor(ownerUserId)}`);
    assert.equal(response.status, 200);
    assert.ok(response.body.bookings.length >= 1);
    assert.ok(response.body.bookings.every((b: { status: string }) => b.status === "SAVED"));
  });

  it("rejects another user listing bookings for a trip they don't own", async () => {
    const response = await request(app)
      .get(`/api/v1/bookings/trip/${tripId}`)
      .set("Authorization", `Bearer ${tokenFor(otherUserId)}`);
    assert.equal(response.status, 404);
  });
});

describe("DELETE /api/v1/bookings/:id", () => {
  it("cancels a booking the caller owns, and it no longer appears in the saved list", async () => {
    const created = await request(app)
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${tokenFor(ownerUserId)}`)
      .send({ tripId, ...validBooking, hotelId: "demo-to-cancel" });
    createdBookingIds.push(created.body.id);

    const cancelResponse = await request(app)
      .delete(`/api/v1/bookings/${created.body.id}`)
      .set("Authorization", `Bearer ${tokenFor(ownerUserId)}`);
    assert.equal(cancelResponse.status, 204);

    const listResponse = await request(app)
      .get(`/api/v1/bookings/trip/${tripId}`)
      .set("Authorization", `Bearer ${tokenFor(ownerUserId)}`);
    assert.ok(!listResponse.body.bookings.some((b: { id: string }) => b.id === created.body.id));
  });

  it("rejects cancelling a booking that belongs to someone else with 404", async () => {
    const created = await request(app)
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${tokenFor(ownerUserId)}`)
      .send({ tripId, ...validBooking, hotelId: "demo-not-yours" });
    createdBookingIds.push(created.body.id);

    const response = await request(app)
      .delete(`/api/v1/bookings/${created.body.id}`)
      .set("Authorization", `Bearer ${tokenFor(otherUserId)}`);
    assert.equal(response.status, 404);
  });
});
