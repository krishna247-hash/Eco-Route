// Transparent Explainable AI (XAI) engine. Produces natural-language
// rationale, quantified trade-offs, and behavioral eco-nudges for a
// generated itinerary — no black boxes.

import { HotelTier, OptimizationPriority, PlanExplanation, TransportMode } from '@/lib/types';
import {
  ACCOMMODATION_FACTORS,
  TRANSPORT_FACTORS,
  TREE_ANNUAL_SEQUESTRATION_KG,
} from '@/lib/carbon/factors';

export interface ExplainInput {
  planKind: 'ecoChampion' | 'balanced' | 'fastest';
  mode: TransportMode;
  hotelTier: HotelTier;
  priority: OptimizationPriority;
  totalCarbonKg: number;
  totalCost: number;
  totalDurationHours: number;
  carbonSavedKg: number;
  carbonSavedPercentage: number;
  treesEquivalent: number;
  baselineCarbonKg: number;
  sustainabilityScore: number;
}

function letterGrade(score: number): string {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'A-';
  if (score >= 60) return 'B+';
  if (score >= 50) return 'B';
  if (score >= 40) return 'C+';
  return 'C';
}

const ACTIONABLE_TIPS: string[] = [
  'Pack light — every 5kg of luggage on a flight adds measurable fuel burn per passenger.',
  'Use public bike shares or walk for short intra-city hops instead of taxis.',
  'Carry a reusable bottle and cutlery to keep this trip zero single-use plastic.',
  'Offset any unavoidable emissions through a verified Gold Standard carbon project.',
  'Choose window seats on rail to naturally reduce onboard climate-control demand.',
];

export function explainPlan(input: ExplainInput): PlanExplanation {
  const {
    planKind,
    mode,
    hotelTier,
    priority,
    totalCarbonKg,
    totalCost,
    totalDurationHours,
    carbonSavedKg,
    carbonSavedPercentage,
    treesEquivalent,
    baselineCarbonKg,
    sustainabilityScore,
  } = input;

  const modeFactor = TRANSPORT_FACTORS[mode];
  const hotelFactor = ACCOMMODATION_FACTORS[hotelTier];

  const planLabel =
    planKind === 'ecoChampion'
      ? 'Eco-Champion'
      : planKind === 'fastest'
      ? 'Speed-Priority'
      : 'EcoRoute Optimal (Balanced)';

  const summary =
    `The ${planLabel} itinerary routes your trip via ${modeFactor.label.toLowerCase()} and ` +
    `${hotelFactor.label.toLowerCase()} lodging, emitting ${totalCarbonKg} kg CO₂e — ` +
    `${carbonSavedPercentage}% below the ${baselineCarbonKg} kg conventional flight + standard ` +
    `hotel baseline — while staying aligned with your "${priority}" optimization priority.`;

  const keyTradeoffs = [
    `Carbon: ${totalCarbonKg} kg CO₂e vs. ${baselineCarbonKg} kg baseline — a reduction of ${carbonSavedKg} kg (${carbonSavedPercentage}%).`,
    `Time: ${totalDurationHours.toFixed(1)} total transit hours using ${modeFactor.label} at ~${modeFactor.speedKmh} km/h cruising speed.`,
    `Cost: $${Math.round(totalCost).toLocaleString()} estimated total, including transit, ${hotelFactor.label.toLowerCase()} lodging, and curated activities.`,
  ];

  const ecoHighlights = [
    `${modeFactor.label} operates at ${modeFactor.emissionFactor} kg CO₂e/pkm under DEFRA 2023 accounting — ${
      mode === 'flight' ? 'the highest-intensity mode considered' : 'substantially cleaner than short-haul aviation'
    }.`,
    hotelFactor.ecoCertifications.length > 0
      ? `Lodging is certified under ${hotelFactor.ecoCertifications.join(' & ')}, verified sustainable hospitality standards.`
      : `Lodging carries no formal eco-certification — consider an eco_hotel or eco_hostel tier to raise the sustainability score.`,
    `Equivalent to the annual sequestration capacity of ${treesEquivalent} mature trees (${TREE_ANNUAL_SEQUESTRATION_KG} kg CO₂/tree/year).`,
  ];

  const tips: string[] = [];
  tips.push(ACTIONABLE_TIPS[0]);
  tips.push(mode === 'flight' ? ACTIONABLE_TIPS[3] : ACTIONABLE_TIPS[1]);

  return {
    summary,
    keyTradeoffs,
    ecoHighlights,
    actionableTips: tips,
    ecoScore: letterGrade(sustainabilityScore),
    carbonSavingsKg: carbonSavedKg,
    treesEquivalent,
    baselineComparison: {
      baselineCarbonKg,
      savingsPercentage: carbonSavedPercentage,
    },
  };
}
