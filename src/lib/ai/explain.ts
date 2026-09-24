import { ACCOMMODATION_FACTORS, TRANSPORT_FACTORS } from '../carbon/factors';
import { calculateTreesEquivalent } from '../carbon/calculator';
import { HotelTier, PlanExplanation, PlanKey, TransportMode } from '../types';

interface ExplainInput {
  planKey: PlanKey;
  mode: TransportMode;
  hotelTier: HotelTier;
  totalCarbonKg: number;
  totalCost: number;
  totalDurationHours: number;
  baselineCarbonKg: number;
  destinationName: string;
}

const MODE_LABELS: Record<TransportMode, string> = {
  train: 'electric high-speed rail',
  ev: 'an electric vehicle transfer',
  bus: 'an express coach',
  car: 'a petrol car',
  flight: 'a commercial flight',
};

const SUMMARY_TEMPLATES: Record<PlanKey, (ctx: {
  destinationName: string;
  modeLabel: string;
  hotelLabel: string;
  savingsPercentage: number;
}) => string> = {
  ecoChampion: ({ destinationName, modeLabel, hotelLabel, savingsPercentage }) =>
    `The Eco-Champion route to ${destinationName} pairs ${modeLabel} with ${hotelLabel} lodging, cutting emissions by ${savingsPercentage}% against the unoptimized flight + standard-hotel baseline.`,
  balanced: ({ destinationName, savingsPercentage }) =>
    `EcoRoute Optimal is the knee-point solution to ${destinationName}: the candidate sitting closest to the ideal utopia point across carbon, cost and time, still abating ${savingsPercentage}% of emissions.`,
  fastest: ({ destinationName, modeLabel, savingsPercentage }) =>
    `Speed-Priority reaches ${destinationName} via ${modeLabel} in the shortest transit time on the Pareto frontier, while still abating ${savingsPercentage}% of emissions versus the conventional baseline.`,
};

function ecoScoreFor(savingsPercentage: number): string {
  if (savingsPercentage >= 90) return 'A+';
  if (savingsPercentage >= 75) return 'A';
  if (savingsPercentage >= 55) return 'B+';
  if (savingsPercentage >= 35) return 'B';
  return 'C';
}

export function generateExplanation(input: ExplainInput): PlanExplanation {
  const {
    planKey,
    mode,
    hotelTier,
    totalCarbonKg,
    totalCost,
    totalDurationHours,
    baselineCarbonKg,
    destinationName,
  } = input;

  const carbonSavingsKg = Math.max(0, Math.round((baselineCarbonKg - totalCarbonKg) * 10) / 10);
  const savingsPercentage =
    baselineCarbonKg > 0 ? Math.round((carbonSavingsKg / baselineCarbonKg) * 100) : 0;
  const treesEquivalent = calculateTreesEquivalent(carbonSavingsKg);
  const hotelFactor = ACCOMMODATION_FACTORS[hotelTier];
  const modeLabel = MODE_LABELS[mode];

  const summary = SUMMARY_TEMPLATES[planKey]({
    destinationName,
    modeLabel,
    hotelLabel: hotelFactor.ecoScore,
    savingsPercentage,
  });

  const keyTradeoffs = [
    `Transit mode: ${modeLabel} at ${TRANSPORT_FACTORS[mode]} kg CO2e per passenger-km.`,
    `Total transit time of ${totalDurationHours} hrs across all legs of this itinerary.`,
    `Estimated all-inclusive cost of $${totalCost}, balanced against a ${savingsPercentage}% carbon abatement.`,
  ];

  const ecoHighlights = [
    `${hotelFactor.ecoScore} accommodation at ${hotelFactor.carbonKgPerNight} kg CO2e per room-night.`,
    `${carbonSavingsKg} kg CO2e abated, equivalent to ${treesEquivalent} mature trees' annual sequestration.`,
    'Emissions calculated with DEFRA 2023 & ICAO reporting factors for full transparency.',
  ];

  const actionableTips = [
    'Pack light to reduce per-passenger transit load.',
    'Use public bike shares for short intra-city hops.',
    'Avoid single-use plastics during transit and lodging stays.',
  ];

  return {
    summary,
    ecoScore: ecoScoreFor(savingsPercentage),
    carbonSavingsKg,
    treesEquivalent,
    keyTradeoffs,
    ecoHighlights,
    actionableTips,
    baselineComparison: {
      baselineCarbonKg,
      savingsPercentage,
    },
  };
}
