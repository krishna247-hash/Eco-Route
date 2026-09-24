import { AppError } from "../utils/AppError";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? "http://localhost:8000";

export interface CarbonBreakdown {
  transport_co2e: number;
  accommodation_co2e: number;
  activity_co2e: number;
  total_co2e: number;
}

export interface TransportLeg {
  distance_km: number;
  mode: string;
  passengers?: number;
}

export interface ActivityInput {
  hours: number;
  activity_type?: string;
}

export interface CarbonEstimateRequest {
  transport_legs: TransportLeg[];
  nights: number;
  accommodation_category?: string;
  activities?: ActivityInput[];
}

export type TravelPreferenceInput = "eco" | "balanced" | "budget" | "speed";
export type TransportModeFilter = "car" | "train" | "bus" | "flight";
export type AccommodationTierFilter = "budget" | "standard" | "eco";

export interface TripInput {
  origin: string;
  destination: string;
  distance_km: number;
  nights: number;
  travelers?: number;
  budget_usd?: number | null;
  preference?: TravelPreferenceInput;
  activity_hours?: number;
  transport_mode_filter?: TransportModeFilter | null;
  accommodation_tier_filter?: AccommodationTierFilter | null;
}

export interface CandidateItinerary {
  id: string;
  transport_mode: string;
  accommodation_tier: string;
  carbon: CarbonBreakdown;
  cost_usd: number;
  duration_hrs: number;
  preference_score: number;
}

export interface LabeledItinerary extends CandidateItinerary {
  label: string;
}

export interface RecommendedItinerary extends LabeledItinerary {
  explanation: string;
}

export interface RecommendResponse {
  baseline_id: string;
  recommendations: RecommendedItinerary[];
}

async function postJson<TResponse>(path: string, body: unknown): Promise<TResponse> {
  const response = await fetch(`${AI_SERVICE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new AppError(502, `ai-service ${path} failed (${response.status}): ${detail}`);
  }

  return response.json() as Promise<TResponse>;
}

export function estimateCarbon(payload: CarbonEstimateRequest): Promise<CarbonBreakdown> {
  return postJson<CarbonBreakdown>("/v1/carbon/estimate", payload);
}

export async function generateItineraries(payload: TripInput): Promise<CandidateItinerary[]> {
  const result = await postJson<{ candidates: CandidateItinerary[] }>("/v1/itineraries/generate", payload);
  return result.candidates;
}

export async function optimizeCandidates(candidates: CandidateItinerary[]): Promise<LabeledItinerary[]> {
  const result = await postJson<{ pareto_set: LabeledItinerary[] }>("/v1/optimize", { candidates });
  return result.pareto_set;
}

export function recommend(candidates: CandidateItinerary[]): Promise<RecommendResponse> {
  return postJson<RecommendResponse>("/v1/recommend", { candidates });
}

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatTripContext {
  origin: string;
  destination: string;
  nights: number;
  preference: string;
  recommended_transport_mode?: string | null;
  recommended_accommodation_tier?: string | null;
  recommended_carbon_kg?: number | null;
  recommended_cost_usd?: number | null;
}

export interface ChatRequest {
  messages: ChatMessage[];
  trip_context?: ChatTripContext | null;
}

export function chat(payload: ChatRequest): Promise<{ reply: string }> {
  return postJson<{ reply: string }>("/v1/chat", payload);
}
