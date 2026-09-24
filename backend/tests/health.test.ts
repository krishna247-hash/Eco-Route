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

describe("GET /api/v1/locations/search", () => {
  it("rejects a missing q with 400", async () => {
    const response = await request(app).get("/api/v1/locations/search");
    assert.equal(response.status, 400);
  });
});

describe("GET /api/v1/locations/reverse", () => {
  it("rejects an out-of-range latitude with 400", async () => {
    const response = await request(app).get("/api/v1/locations/reverse?lat=999&lon=2.35");
    assert.equal(response.status, 400);
  });

  it("rejects a non-numeric lat/lon with 400", async () => {
    const response = await request(app).get("/api/v1/locations/reverse?lat=abc&lon=2.35");
    assert.equal(response.status, 400);
  });
});

describe("POST /api/v1/routing/route", () => {
  it("rejects a missing destination with 400", async () => {
    const response = await request(app)
      .post("/api/v1/routing/route")
      .send({ origin: { latitude: 48.8566, longitude: 2.3522 } });
    assert.equal(response.status, 400);
  });

  it("rejects an invalid profile with 400", async () => {
    const response = await request(app).post("/api/v1/routing/route").send({
      origin: { latitude: 48.8566, longitude: 2.3522 },
      destination: { latitude: 51.5074, longitude: -0.1278 },
      profile: "teleport",
    });
    assert.equal(response.status, 400);
  });
});

describe("GET /api/v1/hotels/search", () => {
  const validQuery = {
    destinationName: "Paris",
    destinationCountry: "France",
    checkIn: "2027-01-01",
    checkOut: "2027-01-04",
    guests: 2,
  };

  it("rejects a missing destinationName with 400", async () => {
    const { destinationName: _omit, ...rest } = validQuery;
    const response = await request(app).get("/api/v1/hotels/search").query(rest);
    assert.equal(response.status, 400);
  });

  it("rejects checkOut before checkIn with 400", async () => {
    const response = await request(app)
      .get("/api/v1/hotels/search")
      .query({ ...validQuery, checkIn: "2027-01-04", checkOut: "2027-01-01" });
    assert.equal(response.status, 400);
  });

  it("rejects an invalid tier with 400", async () => {
    const response = await request(app)
      .get("/api/v1/hotels/search")
      .query({ ...validQuery, tier: "luxury" });
    assert.equal(response.status, 400);
  });

  it("returns clearly-labeled demo listings for a valid query", async () => {
    const response = await request(app).get("/api/v1/hotels/search").query(validQuery);
    assert.equal(response.status, 200);
    assert.equal(response.body.isDemoData, true);
    assert.ok(response.body.hotels.length > 0);
  });
});

describe("POST /api/v1/chat", () => {
  function authedChat() {
    const token = jwt.sign({ sub: "test-user-id" }, TEST_JWT_SECRET, { expiresIn: "1h" });
    return request(app).post("/api/v1/chat").set("Authorization", `Bearer ${token}`);
  }

  it("rejects an unauthenticated request with 401", async () => {
    const response = await request(app)
      .post("/api/v1/chat")
      .send({ messages: [{ role: "user", content: "hi" }] });
    assert.equal(response.status, 401);
  });

  it("rejects an empty messages array with 400", async () => {
    const response = await authedChat().send({ messages: [] });
    assert.equal(response.status, 400);
  });

  it("rejects a message with an invalid role with 400", async () => {
    const response = await authedChat().send({ messages: [{ role: "system", content: "hi" }] });
    assert.equal(response.status, 400);
  });

  it("rejects a message with empty content with 400", async () => {
    const response = await authedChat().send({ messages: [{ role: "user", content: "" }] });
    assert.equal(response.status, 400);
  });

  it("rejects when the last message isn't from the user with 400", async () => {
    const response = await authedChat().send({
      messages: [
        { role: "user", content: "hi" },
        { role: "assistant", content: "hello" },
      ],
    });
    assert.equal(response.status, 400);
  });

  it("rejects an incomplete tripContext with 400", async () => {
    const response = await authedChat().send({
      messages: [{ role: "user", content: "hi" }],
      tripContext: { origin: "London" },
    });
    assert.equal(response.status, 400);
  });

  it("rejects an unsupported locale with 400", async () => {
    const response = await authedChat().send({
      messages: [{ role: "user", content: "hi" }],
      locale: "fr",
    });
    assert.equal(response.status, 400);
  });
});
