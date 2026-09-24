from app.core.candidate_generator import (
    ACCOMMODATION_TIERS,
    TRANSPORT_PROFILES,
    generate_candidates,
)

BASE_TRIP_INPUT = {
    "distance_km": 350,
    "nights": 3,
    "travelers": 2,
    "activity_hours": 4,
    "preference": "balanced",
}


def test_generate_candidates_without_filters_returns_full_matrix():
    candidates = generate_candidates(BASE_TRIP_INPUT)
    assert len(candidates) == len(TRANSPORT_PROFILES) * len(ACCOMMODATION_TIERS)


def test_generate_candidates_transport_filter_narrows_to_one_mode():
    candidates = generate_candidates({**BASE_TRIP_INPUT, "transport_mode_filter": "train"})
    assert len(candidates) == len(ACCOMMODATION_TIERS)
    assert all(c["transport_mode"] == "train" for c in candidates)


def test_generate_candidates_accommodation_filter_narrows_to_one_tier():
    candidates = generate_candidates({**BASE_TRIP_INPUT, "accommodation_tier_filter": "eco"})
    assert len(candidates) == len(TRANSPORT_PROFILES)
    assert all(c["accommodation_tier"] == "eco" for c in candidates)


def test_generate_candidates_both_filters_returns_single_candidate():
    candidates = generate_candidates(
        {**BASE_TRIP_INPUT, "transport_mode_filter": "flight", "accommodation_tier_filter": "budget"}
    )
    assert len(candidates) == 1
    assert candidates[0]["id"] == "flight-budget"


def test_generate_candidates_filtered_carbon_matches_unfiltered_same_candidate():
    # Filtering must not change the numbers for the candidates that remain --
    # only which ones are generated.
    all_candidates = {c["id"]: c for c in generate_candidates(BASE_TRIP_INPUT)}
    filtered = generate_candidates({**BASE_TRIP_INPUT, "transport_mode_filter": "car"})
    for candidate in filtered:
        assert candidate["carbon"]["total_co2e"] == all_candidates[candidate["id"]]["carbon"]["total_co2e"]
        assert candidate["cost_usd"] == all_candidates[candidate["id"]]["cost_usd"]


def test_cost_breakdown_sums_to_the_same_total_as_cost_usd():
    candidates = generate_candidates(BASE_TRIP_INPUT)
    for candidate in candidates:
        breakdown = candidate["cost_breakdown"]
        component_sum = round(
            breakdown["transport_usd"] + breakdown["accommodation_usd"] + breakdown["activity_usd"], 2
        )
        assert component_sum == candidate["cost_usd"]
        assert breakdown["total_usd"] == candidate["cost_usd"]


def test_cost_breakdown_components_are_never_negative():
    candidates = generate_candidates(BASE_TRIP_INPUT)
    for candidate in candidates:
        breakdown = candidate["cost_breakdown"]
        assert breakdown["transport_usd"] >= 0
        assert breakdown["accommodation_usd"] >= 0
        assert breakdown["activity_usd"] >= 0
