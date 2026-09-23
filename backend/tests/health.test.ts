import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import jwt from "jsonwebtoken";
import { app } from "../src/app";

const TEST_JWT_SECRET = "test-only-secret-for-unit-tests";
before(() => {
  process.env.JWT_SECRET = TEST_JWT_SECRET;
});

describe("GET /health", () => {
  it("returns status ok", async () => {
    const response = await request(app).get("/health");
    assert.equal(response.status, 200);
    assert.deepEqual(response.body, { status: "ok" });
  });
});

describe("POST /api/v1/auth/signup", () => {
  it("rejects a short password with 400", async () => {
    const response = await request(app)
      .post("/api/v1/auth/signup")
      .send({ email: "test@example.com", password: "short" });
    assert.equal(response.status, 400);
  });

  it("rejects an invalid email with 400", async () => {
    const response = await request(app)
      .post("/api/v1/auth/signup")
      .send({ email: "not-an-email", password: "password123" });
    assert.equal(response.status, 400);
  });
});

describe("POST /api/v1/trips/plan", () => {
  it("rejects an unauthenticated request with 401", async () => {
    const response = await request(app).post("/api/v1/trips/plan").send({});
    assert.equal(response.status, 401);
  });

  const validBody = {
    origin: "London",
    destination: { name: "Paris", country: "France", latitude: 48.8566, longitude: 2.3522 },
    distanceKm: 350,
    startDate: "2027-01-01",
    endDate: "2027-01-04",
    travelers: 2,
  };

  function authed() {
    const token = jwt.sign({ sub: "test-user-id" }, TEST_JWT_SECRET, { expiresIn: "1h" });
    return request(app).post("/api/v1/trips/plan").set("Authorization", `Bearer ${token}`);
  }

  it("rejects an invalid transportModeFilter with 400 (before touching the database)", async () => {
    const response = await authed().send({ ...validBody, transportModeFilter: "hyperloop" });
    assert.equal(response.status, 400);
  });

  it("rejects an invalid accommodationTierFilter with 400 (before touching the database)", async () => {
    const response = await authed().send({ ...validBody, accommodationTierFilter: "luxury" });
    assert.equal(response.status, 400);
  });
});
