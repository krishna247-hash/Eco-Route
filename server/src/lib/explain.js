/**
 * Explainable-AI engine: turns the numbers behind a plan into transparent,
 * quantified natural-language rationale and behavioural eco-nudges.
 */
import { TRANSPORT_FACTORS, ACCOMMODATION_FACTORS } from './factors.js';

const round1 = (n) => Math.round(n * 10) / 10;
const withArticle = (s) => `${/^[aeiou]/i.test(s) ? 'an' : 'a'} ${s}`;

/** Grade on kg CO2e per traveller per day. */
export function ecoGrade(carbonKg, travelers, days) {
  const perPersonDay = carbonKg / Math.max(1, travelers) / Math.max(1, days);
  if (perPersonDay < 15) return 'A+';
  if (perPersonDay < 25) return 'A';
  if (perPersonDay < 40) return 'B';
  if (perPersonDay < 60) return 'C';
  return 'D';
}

function delta(a, b) {
  return round1(a - b);
}

export function explainPlan(plan, plans, { origin, destination, travelers, budget, priority }) {
  const mode = TRANSPORT_FACTORS[plan.mode];
  const tier = ACCOMMODATION_FACTORS[plan.tier];
  const days = plan.days.length;
  const { baselineCarbonKg, savedKg, treesEquivalent } = plan.baseline;

  const summary = (() => {
    const route = `${origin.name} → ${destination.name}`;
    if (plan.key === 'ecoChampion') {
      return `For ${route}, ${mode.label.toLowerCase()} combined with ${withArticle(tier.label.toLowerCase())} is the lowest-carbon feasible itinerary, emitting ${plan.totalCarbonKg} kg CO₂e — ${plan.carbonSavedPercentage}% below a conventional flight-and-hotel trip.`;
    }
    if (plan.key === 'fastest') {
      return `${mode.label} minimises door-to-door transit to ~${plan.totalDurationHours} h for the round trip. It is the right pick when time is the binding constraint, but it carries a carbon premium over the Eco-Champion.`;
    }
    const weightNote = {
      balanced: 'equal weight on carbon, cost and time',
      eco: 'your emphasis on carbon',
      speed: 'your emphasis on speed',
      budget: 'your emphasis on budget',
    }[priority];
    return `This is the knee of the Pareto frontier given ${weightNote}: ${mode.label.toLowerCase()} with ${withArticle(tier.label.toLowerCase())} captures most of the available carbon savings without a disproportionate increase in cost or travel time.`;
  })();

  const keyTradeoffs = [];
  for (const other of Object.values(plans)) {
    if (other.key === plan.key || (other.mode === plan.mode && other.tier === plan.tier)) continue;
    const dC = delta(plan.totalCarbonKg, other.totalCarbonKg);
    const dT = delta(plan.totalDurationHours, other.totalDurationHours);
    const dK = plan.totalCost - other.totalCost;
    const parts = [
      `${dC <= 0 ? 'saves' : 'adds'} ${Math.abs(dC)} kg CO₂e`,
      `${dT <= 0 ? 'saves' : 'adds'} ${Math.abs(dT)} h of transit`,
      `${dK <= 0 ? 'saves' : 'costs'} $${Math.abs(dK)}`,
    ];
    keyTradeoffs.push(`Versus "${other.title}" (${TRANSPORT_FACTORS[other.mode].label}): ${parts.join(', ')}.`);
  }
  keyTradeoffs.push(
    `Versus a conventional return flight + standard hotel (${baselineCarbonKg} kg CO₂e): ${savedKg > 0 ? `avoids ${savedKg} kg CO₂e, the annual uptake of ~${treesEquivalent} mature trees` : 'no carbon saving'}.`
  );

  const ecoHighlights = [
    `${mode.label} emission factor: ${mode.factor} kg CO₂e per ${mode.perVehicle ? 'vehicle' : 'passenger'}-km (${mode.source}).`,
    `${plan.accommodation.name}: ${tier.factor} kg CO₂e per room-night (${tier.source}).`,
  ];
  if (plan.accommodation.ecoCertifications.length) {
    ecoHighlights.push(`Certified lodging: ${plan.accommodation.ecoCertifications.join(', ')}.`);
  }
  const lowImpact = plan.days.flatMap((d) => d.activities).filter((a) => a.carbonKg / travelers <= 0.5);
  if (lowImpact.length) {
    ecoHighlights.push(`${lowImpact.length} scheduled activities are near-zero-carbon (walking, cycling or outdoors).`);
  }

  const share = (k) =>
    plan.totalCarbonKg ? Math.round((plan.breakdown[k] / plan.totalCarbonKg) * 100) : 0;
  ecoHighlights.push(
    `Emission split: transport ${share('transport')}%, accommodation ${share('accommodation')}%, activities ${share('activities')}%.`
  );

  const actionableTips = [];
  if (plan.mode === 'flight') {
    actionableTips.push('Fly economy and direct — take-off and landing cycles dominate short-haul emissions.');
    actionableTips.push('Pack light: every 10 kg of luggage adds roughly 1–2% to per-passenger fuel burn.');
  } else if (plan.mode === 'ev' || plan.mode === 'car') {
    actionableTips.push('Fill every seat — road emissions are shared across the vehicle, so car-pooling divides your footprint.');
  } else {
    actionableTips.push('Book rail/coach tickets early — advance fares are often cheaper than budget flights.');
  }
  actionableTips.push('Use public bike-share and metro for in-city trips instead of taxis.');
  actionableTips.push('Carry a refillable bottle and choose plant-forward meals to cut food emissions by up to 50%.');
  if (plan.overBudget && budget) {
    actionableTips.push(`This plan exceeds your $${budget} budget by $${plan.totalCost - budget}; consider an eco-hostel or coach to close the gap.`);
  }

  return {
    summary,
    keyTradeoffs,
    ecoHighlights,
    actionableTips,
    ecoScore: ecoGrade(plan.totalCarbonKg, travelers, days),
    carbonSavingsKg: savedKg,
    treesEquivalent,
    baselineComparison: { baselineCarbonKg, savedKg, percentage: plan.carbonSavedPercentage },
  };
}
