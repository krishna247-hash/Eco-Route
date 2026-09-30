/**
 * Multi-objective itinerary optimizer.
 *
 * Enumerates every feasible (transport mode × lodging tier) candidate,
 * extracts the Pareto frontier over carbon / cost / time / comfort, and
 * selects three hallmark plans: Eco-Champion (min carbon), Speed-Priority
 * (min time) and the Balanced knee point (min weighted distance to utopia).
 */
import { TRANSPORT_FACTORS, ACCOMMODATION_FACTORS } from './factors.js';
import {
  haversineKm,
  routeDistanceKm,
  calculateTransportEmissions,
  calculateAccommodationEmissions,
  calculateBaselineEmissions,
  calculateTreesEquivalent,
  transportDurationHours,
  transportCost,
} from './calculator.js';
import { getActivities, getLodging } from './destinations.js';
import { explainPlan } from './explain.js';

const MODE_COMFORT = { train: 8, flight: 6, ev: 6, car: 6, bus: 4 };
const TIER_COMFORT = { hostel: 3, eco_hotel: 7, standard_hotel: 7, luxury_hotel: 10 };

export const PRIORITY_WEIGHTS = {
  balanced: { carbon: 1, cost: 1, time: 1 },
  eco: { carbon: 3, cost: 1, time: 1 },
  speed: { carbon: 1, cost: 1, time: 3 },
  budget: { carbon: 1, cost: 3, time: 1 },
};

const round1 = (n) => Math.round(n * 10) / 10;
const DAY_MS = 86_400_000;

function tripDays(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 4;
  const days = Math.round((end - start) / DAY_MS) + 1;
  return Math.min(14, Math.max(1, days));
}

function isoDate(start, offsetDays) {
  return new Date(new Date(start).getTime() + offsetDays * DAY_MS).toISOString().slice(0, 10);
}

export function feasibleModes(origin, destination, allowedModes) {
  const gc = haversineKm(origin.coords, destination.coords);
  const sameRegion = origin.region === destination.region;
  return Object.keys(TRANSPORT_FACTORS).filter((mode) => {
    if (allowedModes && !allowedModes.includes(mode)) return false;
    const dist = routeDistanceKm(gc, mode);
    if (mode === 'flight') return gc >= 150;
    return sameRegion && dist <= TRANSPORT_FACTORS[mode].maxKm;
  });
}

function dominates(a, b) {
  const noWorse =
    a.carbon <= b.carbon && a.cost <= b.cost && a.time <= b.time && a.comfort >= b.comfort;
  const better =
    a.carbon < b.carbon || a.cost < b.cost || a.time < b.time || a.comfort > b.comfort;
  return noWorse && better;
}

export function paretoFrontier(candidates) {
  return candidates.filter((c) => !candidates.some((o) => o !== c && dominates(o, c)));
}

/** Knee point: minimum weighted, min–max normalised Euclidean distance to the utopia point. */
export function kneePoint(points, weights, budget) {
  const keys = ['carbon', 'cost', 'time'];
  const min = {};
  const max = {};
  for (const k of keys) {
    min[k] = Math.min(...points.map((p) => p[k]));
    max[k] = Math.max(...points.map((p) => p[k]));
  }
  const score = (p) => {
    let d = 0;
    for (const k of keys) {
      const span = max[k] - min[k] || 1;
      d += weights[k] * ((p[k] - min[k]) / span) ** 2;
    }
    // Soft penalty for exceeding the traveller's budget
    if (budget && p.cost > budget) d += 2 * ((p.cost - budget) / budget);
    return Math.sqrt(d);
  };
  return [...points].sort((a, b) => score(a) - score(b))[0];
}

function buildCandidate(ctx, mode, tier) {
  const { origin, destination, travelers, nights, activityPlan } = ctx;
  const gc = haversineKm(origin.coords, destination.coords);
  const distanceKm = routeDistanceKm(gc, mode);
  const legCarbon = calculateTransportEmissions(distanceKm, mode, travelers);
  const legHours = transportDurationHours(distanceKm, mode);
  const legCost = transportCost(distanceKm, mode, travelers);

  const stayCarbon = calculateAccommodationEmissions(tier, nights, travelers);
  const rooms = Math.max(1, Math.ceil(travelers / 2));
  const stayCost = ACCOMMODATION_FACTORS[tier].pricePerNight * nights * rooms;

  const actCarbon = activityPlan.flat().reduce((s, a) => s + a.carbonKg, 0) * travelers;
  const actCost = activityPlan.flat().reduce((s, a) => s + a.cost, 0) * travelers;

  return {
    id: `${mode}:${tier}`,
    mode,
    tier,
    distanceKm,
    legCarbon,
    legHours,
    legCost,
    carbon: round1(legCarbon * 2 + stayCarbon + actCarbon),
    cost: Math.round(legCost * 2 + stayCost + actCost),
    time: round1(legHours * 2),
    comfort: (MODE_COMFORT[mode] + TIER_COMFORT[tier]) / 2,
    breakdown: {
      transport: round1(legCarbon * 2),
      accommodation: stayCarbon,
      activities: round1(actCarbon),
    },
  };
}

function legDescription(mode, from, to, hours) {
  switch (mode) {
    case 'train':
      return `Electrified rail from ${from.name} to ${to.name}, city-centre to city-centre (~${hours} h incl. connections).`;
    case 'flight':
      return `Economy flight ${from.name} → ${to.name}; includes ~3 h for airport transfer, security and boarding.`;
    case 'bus':
      return `Express coach with onboard Wi-Fi; lowest-cost ground option.`;
    case 'ev':
      return `Rented electric car, shared by your group, with rapid-charging stops en route.`;
    default:
      return `Private petrol car, shared by your group.`;
  }
}

function buildPlan(key, candidate, ctx) {
  const { origin, destination, startDate, totalDays, nights, travelers, activityPlan } = ctx;
  const lodging = getLodging(destination, candidate.tier, ACCOMMODATION_FACTORS);
  const rooms = Math.max(1, Math.ceil(travelers / 2));

  const mkLeg = (id, from, to) => ({
    id,
    fromName: from.name,
    toName: to.name,
    fromCoords: from.coords,
    toCoords: to.coords,
    mode: candidate.mode,
    distanceKm: candidate.distanceKm,
    durationHours: candidate.legHours,
    cost: candidate.legCost,
    carbonKg: candidate.legCarbon,
    description: legDescription(candidate.mode, from, to, candidate.legHours),
  });
  const outbound = mkLeg('leg-out', origin, destination);
  const inbound = mkLeg('leg-return', destination, origin);

  const days = activityPlan.map((acts, i) => {
    const legs = [];
    if (i === 0) legs.push(outbound);
    if (i === totalDays - 1) legs.push(inbound);
    const staying = i < nights;
    const activities = acts.map((a) => ({
      ...a,
      carbonKg: round1(a.carbonKg * travelers),
      cost: a.cost * travelers,
    }));
    const dailyCarbonKg = round1(
      legs.reduce((s, l) => s + l.carbonKg, 0) +
        activities.reduce((s, a) => s + a.carbonKg, 0) +
        (staying ? lodging.carbonKgPerNight * rooms : 0)
    );
    const dailyCost = Math.round(
      legs.reduce((s, l) => s + l.cost, 0) +
        activities.reduce((s, a) => s + a.cost, 0) +
        (staying ? lodging.pricePerNight * rooms : 0)
    );
    return {
      dayNumber: i + 1,
      date: isoDate(startDate, i),
      city: destination.name,
      legs,
      activities,
      staying,
      dailyCarbonKg,
      dailyCost,
    };
  });

  const titles = {
    ecoChampion: ['The Eco-Champion', 'Absolute minimum carbon footprint across all feasible routes.'],
    balanced: ['EcoRoute Optimal', 'Pareto knee point — the best carbon abatement per hour and dollar.'],
    fastest: ['Speed-Priority', 'Shortest door-to-door transit time.'],
  };

  const baselineCarbonKg = calculateBaselineEmissions(
    routeDistanceKm(haversineKm(origin.coords, destination.coords), 'flight') * 2,
    nights,
    travelers
  ) + candidate.breakdown.activities;
  const savedKg = Math.max(0, round1(baselineCarbonKg - candidate.carbon));

  const plan = {
    key,
    title: titles[key][0],
    tagline: titles[key][1],
    mode: candidate.mode,
    modeLabel: TRANSPORT_FACTORS[candidate.mode].label,
    tier: candidate.tier,
    allLegs: [outbound, inbound],
    accommodation: lodging,
    days,
    totalCarbonKg: candidate.carbon,
    totalCost: candidate.cost,
    totalDurationHours: candidate.time,
    comfortScore: candidate.comfort,
    breakdown: candidate.breakdown,
    overBudget: ctx.budget ? candidate.cost > ctx.budget : false,
    carbonPerTravelerKg: round1(candidate.carbon / travelers),
    carbonSavedPercentage: baselineCarbonKg ? Math.round((savedKg / baselineCarbonKg) * 100) : 0,
    baseline: {
      baselineCarbonKg: round1(baselineCarbonKg),
      savedKg,
      treesEquivalent: calculateTreesEquivalent(savedKg),
    },
  };
  return plan;
}

/**
 * @param {object} p
 * @param {object} p.origin       city from destinations.js
 * @param {object} p.destination  city from destinations.js
 * @param {string} p.startDate    YYYY-MM-DD
 * @param {string} p.endDate      YYYY-MM-DD
 * @param {number} p.travelers
 * @param {number} [p.budget]     USD, whole group
 * @param {string} [p.priority]   balanced | eco | speed | budget
 * @param {string[]} [p.preferredModes]
 */
export function optimizeItinerary({
  origin,
  destination,
  startDate,
  endDate,
  travelers = 1,
  budget,
  priority = 'balanced',
  preferredModes,
}) {
  if (origin.id === destination.id) {
    throw Object.assign(new Error('Origin and destination must be different cities.'), { status: 400 });
  }
  travelers = Math.min(10, Math.max(1, Math.round(Number(travelers) || 1)));
  budget = Number(budget) > 0 ? Number(budget) : undefined;
  if (!PRIORITY_WEIGHTS[priority]) priority = 'balanced';

  const totalDays = tripDays(startDate, endDate);
  const nights = Math.max(1, totalDays - 1);

  // Activities: one on arrival and departure days, two on full days.
  const pool = getActivities(destination);
  let cursor = 0;
  const activityPlan = Array.from({ length: totalDays }, (_, i) => {
    const count = totalDays === 1 ? 0 : i === 0 || i === totalDays - 1 ? 1 : 2;
    return Array.from({ length: count }, () => pool[cursor++ % pool.length]);
  });

  const ctx = { origin, destination, startDate, totalDays, nights, travelers, budget, activityPlan };

  let modes = feasibleModes(origin, destination, preferredModes?.length ? preferredModes : null);
  let modeFallback = false;
  if (modes.length === 0) {
    // None of the preferred modes can serve this route — widen the search.
    modes = feasibleModes(origin, destination, null);
    modeFallback = true;
  }

  const candidates = [];
  for (const mode of modes) {
    for (const tier of Object.keys(ACCOMMODATION_FACTORS)) {
      candidates.push(buildCandidate(ctx, mode, tier));
    }
  }

  const frontier = paretoFrontier(candidates);
  const eco = [...frontier].sort((a, b) => a.carbon - b.carbon || a.time - b.time)[0];
  const fast = [...frontier].sort((a, b) => a.time - b.time || a.cost - b.cost || a.carbon - b.carbon)[0];
  const rest = frontier.filter((c) => c !== eco && c !== fast);
  const knee = kneePoint(rest.length ? rest : frontier, PRIORITY_WEIGHTS[priority], budget);

  const plans = {
    ecoChampion: buildPlan('ecoChampion', eco, ctx),
    balanced: buildPlan('balanced', knee, ctx),
    fastest: buildPlan('fastest', fast, ctx),
  };
  for (const plan of Object.values(plans)) {
    plan.explanation = explainPlan(plan, plans, { origin, destination, travelers, budget, priority });
  }

  const frontierIds = new Set(frontier.map((c) => c.id));
  return {
    origin: { id: origin.id, name: origin.name, country: origin.country, coords: origin.coords },
    destination: {
      id: destination.id,
      name: destination.name,
      country: destination.country,
      coords: destination.coords,
    },
    startDate: isoDate(startDate, 0),
    endDate: isoDate(startDate, totalDays - 1),
    totalDays,
    nights,
    travelers,
    budget: budget ?? null,
    priority,
    modeFallback,
    candidatesEvaluated: candidates.length,
    candidates: candidates.map((c) => ({
      id: c.id,
      mode: c.mode,
      tier: c.tier,
      carbon: c.carbon,
      cost: c.cost,
      time: c.time,
      comfort: c.comfort,
      onFrontier: frontierIds.has(c.id),
    })),
    plans,
  };
}
