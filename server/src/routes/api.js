import { Router } from 'express';
import { CITIES, findCity } from '../lib/destinations.js';
import { TRANSPORT_FACTORS, ACCOMMODATION_FACTORS, TREE_ANNUAL_SEQUESTRATION_KG } from '../lib/factors.js';
import {
  calculateTransportEmissions,
  calculateAccommodationEmissions,
  calculateBaselineEmissions,
  calculateTreesEquivalent,
} from '../lib/calculator.js';
import { optimizeItinerary } from '../lib/optimizer.js';
import { isMongoConnected } from '../db.js';
import * as store from '../store.js';

const router = Router();

const DAY_MS = 86_400_000;
const isoOffset = (days) => new Date(Date.now() + days * DAY_MS).toISOString().slice(0, 10);
const isValidDate = (s) => typeof s === 'string' && !Number.isNaN(new Date(s).getTime());

/** Wraps async handlers so rejected promises reach the error middleware. */
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function badRequest(message) {
  return Object.assign(new Error(message), { status: 400 });
}

router.get('/health', (req, res) => {
  res.json({ ok: true, database: isMongoConnected() ? 'mongodb' : 'in-memory' });
});

router.get('/cities', (req, res) => {
  const q = String(req.query.q ?? '').toLowerCase();
  const cities = q
    ? CITIES.filter((c) => c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q))
    : CITIES;
  res.json({ success: true, data: cities });
});

router.get('/factors', (req, res) => {
  res.json({
    success: true,
    data: {
      transport: TRANSPORT_FACTORS,
      accommodation: ACCOMMODATION_FACTORS,
      treeAnnualSequestrationKg: TREE_ANNUAL_SEQUESTRATION_KG,
    },
  });
});

/** Multi-objective optimisation: returns three Pareto plans plus every evaluated candidate. */
router.post('/plan', (req, res) => {
  const body = req.body ?? {};
  const origin = findCity(body.origin ?? 'paris');
  const destination = findCity(body.destination ?? 'amsterdam');
  if (!origin) throw badRequest(`Unknown origin city: ${body.origin}`);
  if (!destination) throw badRequest(`Unknown destination city: ${body.destination}`);

  const startDate = isValidDate(body.startDate) ? body.startDate : isoOffset(7);
  const endDate = isValidDate(body.endDate) ? body.endDate : isoOffset(10);
  if (new Date(endDate) < new Date(startDate)) throw badRequest('End date must be on or after start date.');

  const preferredModes = Array.isArray(body.preferredModes)
    ? body.preferredModes.filter((m) => m in TRANSPORT_FACTORS)
    : undefined;

  const data = optimizeItinerary({
    origin,
    destination,
    startDate,
    endDate,
    travelers: body.travelers,
    budget: body.budget,
    priority: body.priority,
    preferredModes,
  });
  res.json({ success: true, data });
});

/** Stand-alone footprint calculator used by the dashboard. */
router.post('/carbon', (req, res) => {
  const body = req.body ?? {};
  const distanceKm = Math.max(0, Number(body.distanceKm ?? 500));
  const passengers = Math.max(1, Math.round(Number(body.passengers ?? 1)));
  const nights = Math.max(0, Math.round(Number(body.nights ?? 3)));
  const mode = body.mode in TRANSPORT_FACTORS ? body.mode : 'train';
  const hotelTier = body.hotelTier in ACCOMMODATION_FACTORS ? body.hotelTier : 'eco_hotel';

  const transportCarbonKg = calculateTransportEmissions(distanceKm, mode, passengers);
  const hotelCarbonKg = calculateAccommodationEmissions(hotelTier, nights, passengers);
  const totalCarbonKg = Math.round((transportCarbonKg + hotelCarbonKg) * 10) / 10;
  const baselineCarbonKg = calculateBaselineEmissions(distanceKm, nights, passengers);
  const savedCarbonKg = Math.max(0, Math.round((baselineCarbonKg - totalCarbonKg) * 10) / 10);

  res.json({
    success: true,
    data: {
      transportCarbonKg,
      hotelCarbonKg,
      totalCarbonKg,
      baselineCarbonKg,
      savedCarbonKg,
      savingsPercentage: baselineCarbonKg ? Math.round((savedCarbonKg / baselineCarbonKg) * 100) : 0,
      treesEquivalent: calculateTreesEquivalent(savedCarbonKg),
    },
  });
});

// ---- Saved trips (MongoDB) ----

router.get('/trips', wrap(async (req, res) => {
  res.json({ success: true, data: await store.listTrips() });
}));

router.get('/trips/:id', wrap(async (req, res) => {
  const trip = await store.getTrip(req.params.id);
  if (!trip) return res.status(404).json({ success: false, error: 'Trip not found' });
  res.json({ success: true, data: trip });
}));

router.post('/trips', wrap(async (req, res) => {
  const { result, selectedPlan = 'balanced', name, travelerName } = req.body ?? {};
  const plan = result?.plans?.[selectedPlan];
  if (!plan || !result.origin || !result.destination) {
    throw badRequest('Body must include an optimizer `result` and a valid `selectedPlan`.');
  }
  const trip = await store.createTrip({
    name: name || `${result.origin.name} → ${result.destination.name}`,
    travelerName,
    originName: result.origin.name,
    destinationName: result.destination.name,
    startDate: result.startDate,
    endDate: result.endDate,
    travelers: result.travelers,
    selectedPlan,
    totalCarbonKg: plan.totalCarbonKg,
    totalCost: plan.totalCost,
    savedCarbonKg: plan.explanation?.carbonSavingsKg ?? 0,
    ecoScore: plan.explanation?.ecoScore,
    result,
  });
  res.status(201).json({ success: true, data: trip });
}));

router.patch('/trips/:id', wrap(async (req, res) => {
  const patch = {};
  const { name, travelerName, selectedPlan } = req.body ?? {};
  if (name !== undefined) patch.name = String(name);
  if (travelerName !== undefined) patch.travelerName = String(travelerName);
  if (selectedPlan !== undefined) {
    const existing = await store.getTrip(req.params.id);
    const plan = existing?.result?.plans?.[selectedPlan];
    if (!plan) throw badRequest('Invalid selectedPlan');
    Object.assign(patch, {
      selectedPlan,
      totalCarbonKg: plan.totalCarbonKg,
      totalCost: plan.totalCost,
      savedCarbonKg: plan.explanation?.carbonSavingsKg ?? 0,
      ecoScore: plan.explanation?.ecoScore,
    });
  }
  const trip = await store.updateTrip(req.params.id, patch);
  if (!trip) return res.status(404).json({ success: false, error: 'Trip not found' });
  res.json({ success: true, data: trip });
}));

router.delete('/trips/:id', wrap(async (req, res) => {
  const ok = await store.deleteTrip(req.params.id);
  if (!ok) return res.status(404).json({ success: false, error: 'Trip not found' });
  res.json({ success: true });
}));

export default router;
