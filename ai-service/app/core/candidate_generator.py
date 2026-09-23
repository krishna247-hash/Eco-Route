"""Generates mock candidate itineraries by varying transport mode and
accommodation tier, using the real carbon engine for emissions. Cost and
speed profiles below are illustrative mock data (not published sources) —
only emission factors are sourced, per app/data/emission_factors.json."""

from app.core.carbon_engine import calculate_trip_co2e

TRANSPORT_PROFILES = {
    "car": {"cost_per_km": 0.15, "speed_kmh": 80},
    "train": {"cost_per_km": 0.12, "speed_kmh": 120},
    "bus": {"cost_per_km": 0.08, "speed_kmh": 60},
    "flight": {"cost_per_km": 0.18, "speed_kmh": 700},
}

ACCOMMODATION_TIERS = {
    "budget": {"label": "Budget Hotel", "cost_per_night_usd": 60},
    "standard": {"label": "Standard Hotel", "cost_per_night_usd": 110},
    "eco": {"label": "Eco-Certified Hotel", "cost_per_night_usd": 95},
}

ACTIVITY_COST_PER_HOUR_USD = 20.0

PREFERENCE_WEIGHTS = {
    "eco": {"carbon": 0.7, "cost": 0.15, "time": 0.15},
    "balanced": {"carbon": 0.34, "cost": 0.33, "time": 0.33},
    "budget": {"carbon": 0.15, "cost": 0.7, "time": 0.15},
    "speed": {"carbon": 0.15, "cost": 0.15, "time": 0.7},
}


def _transport_cost(mode: str, distance_km: float, travelers: int) -> float:
    profile = TRANSPORT_PROFILES[mode]
    # Car cost is per vehicle, shared across passengers; ticketed modes
    # scale with passenger count, mirroring the carbon engine's logic.
    if mode == "car":
        return profile["cost_per_km"] * distance_km
    return profile["cost_per_km"] * distance_km * travelers


def _normalize(values: list[float]) -> list[float]:
    lo, hi = min(values), max(values)
    if hi == lo:
        return [0.0 for _ in values]
    return [(v - lo) / (hi - lo) for v in values]


def generate_candidates(trip_input: dict) -> list[dict]:
    distance_km = trip_input["distance_km"]
    nights = trip_input["nights"]
    travelers = trip_input.get("travelers", 1)
    activity_hours = trip_input.get("activity_hours", 4.0)
    preference = trip_input.get("preference", "balanced")

    candidates = []
    for mode, transport_profile in TRANSPORT_PROFILES.items():
        for tier_key, tier in ACCOMMODATION_TIERS.items():
            carbon = calculate_trip_co2e(
                transport_legs=[{"distance_km": distance_km, "mode": mode, "passengers": travelers}],
                nights=nights,
                accommodation_category="hotel-night",
                activities=[{"hours": activity_hours, "activity_type": "default"}],
            )
            transport_cost = _transport_cost(mode, distance_km, travelers)
            accommodation_cost = tier["cost_per_night_usd"] * nights
            activity_cost = ACTIVITY_COST_PER_HOUR_USD * activity_hours
            transport_duration_hrs = distance_km / transport_profile["speed_kmh"]

            candidates.append(
                {
                    "id": f"{mode}-{tier_key}",
                    "transport_mode": mode,
                    "accommodation_tier": tier_key,
                    "carbon": carbon,
                    "cost_usd": round(transport_cost + accommodation_cost + activity_cost, 2),
                    "duration_hrs": round(transport_duration_hrs + activity_hours, 2),
                }
            )

    norm_carbon = _normalize([c["carbon"]["total_co2e"] for c in candidates])
    norm_cost = _normalize([c["cost_usd"] for c in candidates])
    norm_duration = _normalize([c["duration_hrs"] for c in candidates])
    weights = PREFERENCE_WEIGHTS[preference]

    for candidate, nc, ncost, nd in zip(candidates, norm_carbon, norm_cost, norm_duration):
        penalty = weights["carbon"] * nc + weights["cost"] * ncost + weights["time"] * nd
        candidate["preference_score"] = round(1 - penalty, 4)

    return candidates
