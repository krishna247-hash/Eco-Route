/**
 * Pareto Optimal Frontier Solver for Multi-Objective Optimization
 * Finds trade-off solutions balancing carbon, cost, time, and comfort
 */

import { ParetoPoint, Itinerary } from '@/lib/types';

export interface ObjectiveWeights {
  carbon: number;
  cost: number;
  time: number;
  comfort: number;
}

/**
 * Check if a solution dominates another on all objectives
 * Lower is better for carbon, cost, time (higher is better for comfort)
 */
function dominates(a: ParetoPoint, b: ParetoPoint): boolean {
  return (
    a.emissions <= b.emissions &&
    a.cost <= b.cost &&
    a.time <= b.time &&
    a.comfortScore >= b.comfortScore &&
    (a.emissions < b.emissions ||
      a.cost < b.cost ||
      a.time < b.time ||
      a.comfortScore > b.comfortScore)
  );
}

/**
 * Filter solutions to get Pareto optimal frontier
 */
export function getParetoFrontier(solutions: ParetoPoint[]): ParetoPoint[] {
  const frontier: ParetoPoint[] = [];

  for (const candidate of solutions) {
    // Check if candidate is dominated by any existing frontier point
    const isDominated = frontier.some(point => dominates(point, candidate));

    if (!isDominated) {
      // Remove any frontier points that are dominated by candidate
      const filtered = frontier.filter(point => !dominates(candidate, point));
      filtered.push(candidate);
      frontier.length = 0;
      frontier.push(...filtered);
    }
  }

  return frontier.sort((a, b) => a.emissions - b.emissions);
}

/**
 * Score solution based on weights
 * Lower score is better
 */
export function scoreSolution(point: ParetoPoint, weights: ObjectiveWeights): number {
  // Normalize objectives to 0-1 scale (assuming reasonable ranges)
  const normalizedEmissions = Math.min(point.emissions / 500, 1); // 500kg CO2e max
  const normalizedCost = Math.min(point.cost / 5000, 1); // $5000 max
  const normalizedTime = Math.min(point.time / 100, 1); // 100 hours max
  const normalizedComfort = 1 - (point.comfortScore / 10); // Inverted (higher comfort = lower score)

  // Weighted sum
  const score =
    weights.carbon * normalizedEmissions +
    weights.cost * normalizedCost +
    weights.time * normalizedTime +
    weights.comfort * normalizedComfort;

  return score;
}

/**
 * Get recommendations based on user priorities
 */
export function getRecommendations(
  frontier: ParetoPoint[],
  priority: 'carbon' | 'cost' | 'time' | 'balanced'
): ParetoPoint[] {
  let weights: ObjectiveWeights;

  switch (priority) {
    case 'carbon':
      weights = { carbon: 0.5, cost: 0.2, time: 0.2, comfort: 0.1 };
      break;
    case 'cost':
      weights = { carbon: 0.2, cost: 0.5, time: 0.2, comfort: 0.1 };
      break;
    case 'time':
      weights = { carbon: 0.2, cost: 0.2, time: 0.5, comfort: 0.1 };
      break;
    case 'balanced':
    default:
      weights = { carbon: 0.25, cost: 0.25, time: 0.25, comfort: 0.25 };
  }

  // Score and sort
  const scored = frontier.map(point => ({
    point,
    score: scoreSolution(point, weights),
  }));

  scored.sort((a, b) => a.score - b.score);

  // Return top 3 recommendations
  return scored.slice(0, 3).map(item => item.point);
}

/**
 * Calculate carbon savings between two itineraries
 */
export function calculateCarbonSavings(
  baseline: Itinerary,
  alternative: Itinerary
): { savings: number; percentage: number } {
  const savings = baseline.totalEmissions - alternative.totalEmissions;
  const percentage = (savings / baseline.totalEmissions) * 100;

  return { savings, percentage };
}

/**
 * Calculate cost savings between two itineraries
 */
export function calculateCostSavings(
  baseline: Itinerary,
  alternative: Itinerary
): { savings: number; percentage: number } {
  const savings = baseline.totalCost - alternative.totalCost;
  const percentage = (savings / baseline.totalCost) * 100;

  return { savings, percentage };
}

/**
 * Generate human-readable explanation for recommendation
 */
export function explainRecommendation(
  point: ParetoPoint,
  priority: string
): string {
  const trees = Math.round(point.emissions / 21);
  const days = Math.round(point.time / 24);

  let explanation = '';

  switch (priority) {
    case 'carbon':
      explanation = `This option emits ${point.emissions.toFixed(0)}kg CO2e (equivalent to planting ${trees} trees). `;
      break;
    case 'cost':
      explanation = `This option costs $${point.cost.toFixed(0)} and includes optimal routing for budget. `;
      break;
    case 'time':
      explanation = `This option takes approximately ${days} days to complete. `;
      break;
    case 'balanced':
      explanation = `This balanced option offers good trade-offs across all objectives. `;
      break;
  }

  explanation += `Comfort score: ${point.comfortScore}/10.`;

  return explanation;
}
