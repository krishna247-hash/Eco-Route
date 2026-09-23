"""Pure carbon calculation functions. No FastAPI or LLM imports — must stay
testable as plain Python so the deterministic engine is fully auditable."""

from app.core.emission_factors import get_factor


def calculate_transport_co2e(distance_km: float, mode: str, passengers: int = 1) -> float:
    factor = get_factor("transport", mode)
    # Vehicle-based factors (e.g. "kg CO2e/km") are shared across all
    # passengers in the vehicle; passenger-based factors already account
    # for average occupancy and scale with passenger count.
    if "passenger-km" in factor["unit"]:
        return factor["value"] * distance_km * passengers
    return factor["value"] * distance_km


def calculate_accommodation_co2e(nights: int, category: str) -> float:
    factor = get_factor("accommodation", category)
    return factor["value"] * nights


def calculate_activity_co2e(hours: float, activity_type: str) -> float:
    factor = get_factor("activity", activity_type)
    return factor["value"] * hours


def calculate_trip_co2e(
    transport_legs: list[dict],
    nights: int,
    accommodation_category: str,
    activities: list[dict],
) -> dict[str, float]:
    transport_total = sum(calculate_transport_co2e(**leg) for leg in transport_legs)
    accommodation_total = calculate_accommodation_co2e(nights, accommodation_category)
    activity_total = sum(calculate_activity_co2e(**activity) for activity in activities)

    return {
        "transport_co2e": transport_total,
        "accommodation_co2e": accommodation_total,
        "activity_co2e": activity_total,
        "total_co2e": transport_total + accommodation_total + activity_total,
    }
