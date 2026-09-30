/**
 * Trip repository. Uses MongoDB via Mongoose when connected, otherwise an
 * in-memory Map so the demo works without a database.
 */
import crypto from 'node:crypto';
import { Trip } from './models/Trip.js';
import { isMongoConnected } from './db.js';

const memory = new Map();

const SUMMARY_FIELDS =
  '_id name travelerName originName destinationName startDate endDate travelers selectedPlan totalCarbonKg totalCost savedCarbonKg ecoScore passCode createdAt';

function newPassCode() {
  return `ECO-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

function toSummary(doc) {
  const { result, ...rest } = doc;
  return rest;
}

export async function createTrip(data) {
  const doc = { ...data, passCode: newPassCode() };
  if (isMongoConnected()) {
    const saved = await Trip.create(doc);
    return saved.toObject();
  }
  const now = new Date().toISOString();
  const saved = { _id: crypto.randomUUID(), ...doc, createdAt: now, updatedAt: now };
  memory.set(saved._id, saved);
  return saved;
}

export async function listTrips() {
  if (isMongoConnected()) {
    return Trip.find().select(SUMMARY_FIELDS).sort({ createdAt: -1 }).limit(100).lean();
  }
  return [...memory.values()]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(toSummary);
}

export async function getTrip(idOrCode) {
  if (isMongoConnected()) {
    const byCode = await Trip.findOne({ passCode: idOrCode }).lean();
    if (byCode) return byCode;
    if (!/^[a-f0-9]{24}$/i.test(idOrCode)) return null;
    return Trip.findById(idOrCode).lean();
  }
  return memory.get(idOrCode) ?? [...memory.values()].find((t) => t.passCode === idOrCode) ?? null;
}

export async function updateTrip(id, patch) {
  if (isMongoConnected()) {
    if (!/^[a-f0-9]{24}$/i.test(id)) return null;
    return Trip.findByIdAndUpdate(id, patch, { new: true, runValidators: true }).lean();
  }
  const existing = memory.get(id);
  if (!existing) return null;
  const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() };
  memory.set(id, updated);
  return updated;
}

export async function deleteTrip(id) {
  if (isMongoConnected()) {
    if (!/^[a-f0-9]{24}$/i.test(id)) return false;
    const res = await Trip.findByIdAndDelete(id);
    return Boolean(res);
  }
  return memory.delete(id);
}
