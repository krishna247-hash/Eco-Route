import { describe, it } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { app } from "../src/app";

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
});
