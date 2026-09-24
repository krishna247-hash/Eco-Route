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
let bookingId: string;

function tokenFor(userId: string) {
  return jwt.sign({ sub: userId }, TEST_JWT_SECRET, { expiresIn: "1h" });
}

before(async () => {
  process.env.JWT_SECRET = TEST_JWT_SECRET;
  // Payment tests assert the honest "not configured" failure path, so
  // this must run without a real Stripe key regardless of what's in the
  // environment -- there is no live provider connected in this project.
  delete process.env.STRIPE_SECRET_KEY;

  const owner = await prisma.user.create({
    data: { email: `payments-test-owner-${Date.now()}@ecoroute.local`, passwordHash: "test" },
  });
  const other = await prisma.user.create({
    data: { email: `payments-test-other-${Date.now()}@ecoroute.local`, passwordHash: "test" },
  });
  ownerUserId = owner.id;
  otherUserId = other.id;

  const destination = await prisma.destination.upsert({
    where: { name_country: { name: "Payments-Test-City", country: "Testland" } },
    update: {},
    create: { name: "Payments-Test-City", country: "Testland", latitude: 1, longitude: 1 },
  });

  const trip = await prisma.trip.create({
    data: {
      userId: ownerUserId,
      destinationId: destination.id,
      origin: "Test Origin",
      startDate: new Date("2027-06-01"),
      endDate: new Date("2027-06-04"),
      travelers: 2,
    },
  });
  tripId = trip.id;

  const booking = await prisma.booking.create({
    data: {
      tripId,
      hotelId: "demo-payments-test",
      hotelName: "Payments-Test-City Grand Hotel",
      tier: "standard",
      checkIn: new Date("2027-06-01"),
      checkOut: new Date("2027-06-04"),
      guests: 2,
      pricePerNightUsd: 100,
      totalPriceUsd: 300,
    },
  });
  bookingId = booking.id;
});

after(async () => {
  await prisma.booking.deleteMany({ where: { id: bookingId } });
  await prisma.trip.deleteMany({ where: { id: tripId } });
  await prisma.user.deleteMany({ where: { id: { in: [ownerUserId, otherUserId] } } });
  await prisma.$disconnect();
});

describe("GET /api/v1/payments/status", () => {
  it("honestly reports that no payment provider is connected", async () => {
    const response = await request(app).get("/api/v1/payments/status");
    assert.equal(response.status, 200);
    assert.equal(response.body.configured, false);
  });
});

describe("POST /api/v1/payments/checkout", () => {
  const validBody = {
    successUrl: "http://localhost:3000/payment/success",
    cancelUrl: "http://localhost:3000/payment/cancel",
  };

  it("rejects an unauthenticated request with 401", async () => {
    const response = await request(app)
      .post("/api/v1/payments/checkout")
      .send({ bookingId, ...validBody });
    assert.equal(response.status, 401);
  });

  it("rejects a missing bookingId with 400", async () => {
    const response = await request(app)
      .post("/api/v1/payments/checkout")
      .set("Authorization", `Bearer ${tokenFor(ownerUserId)}`)
      .send(validBody);
    assert.equal(response.status, 400);
  });

  it("rejects a non-http successUrl/cancelUrl with 400", async () => {
    const response = await request(app)
      .post("/api/v1/payments/checkout")
      .set("Authorization", `Bearer ${tokenFor(ownerUserId)}`)
      .send({ bookingId, successUrl: "javascript:alert(1)", cancelUrl: validBody.cancelUrl });
    assert.equal(response.status, 400);
  });

  it("rejects a booking that belongs to someone else with 404", async () => {
    const response = await request(app)
      .post("/api/v1/payments/checkout")
      .set("Authorization", `Bearer ${tokenFor(otherUserId)}`)
      .send({ bookingId, ...validBody });
    assert.equal(response.status, 404);
  });

  it("never fakes success: fails with a clean 503 naming the missing credential, since no payment provider is connected", async () => {
    const response = await request(app)
      .post("/api/v1/payments/checkout")
      .set("Authorization", `Bearer ${tokenFor(ownerUserId)}`)
      .send({ bookingId, ...validBody });
    assert.equal(response.status, 503);
    assert.match(response.body.error, /STRIPE_SECRET_KEY/);
    assert.match(response.body.error, /not been charged/i);
  });
});
