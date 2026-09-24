from app.core.candidate_generator import generate_candidates
from app.core.optimizer import LABEL_ORDER, optimize_candidates


def _objective_vector(candidate: dict) -> tuple[float, float, float, float]:
    return (
        candidate["carbon"]["total_co2e"],
        candidate["cost_usd"],
        candidate["duration_hrs"],
        -candidate["preference_score"],
    )


def _dominates(a: tuple, b: tuple) -> bool:
    return all(x <= y for x, y in zip(a, b)) and any(x < y for x, y in zip(a, b))


def test_optimize_candidates_returns_non_dominated_set():
    trip_input = {
        "distance_km": 620,
        "nights": 5,
        "travelers": 3,
        "activity_hours": 6,
        "preference": "balanced",
    }
    candidates = generate_candidates(trip_input)
    assert len(candidates) == 12  # 4 transport modes x 3 accommodation tiers

    pareto_set = optimize_candidates(candidates)

    assert len(pareto_set) == len(LABEL_ORDER)
    assert [item["label"] for item in pareto_set] == LABEL_ORDER

    vectors = [_objective_vector(item) for item in pareto_set]
    for i, a in enumerate(vectors):
        for j, b in enumerate(vectors):
            if i != j:
                assert not _dominates(a, b), f"{pareto_set[i]['id']} dominates {pareto_set[j]['id']}"


def test_optimize_candidates_labels_match_their_objective():
    candidates = generate_candidates(
        {"distance_km": 300, "nights": 2, "travelers": 1, "activity_hours": 3, "preference": "eco"}
    )
    pareto_set = optimize_candidates(candidates)
    by_label = {item["label"]: item for item in pareto_set}

    all_carbon = [c["carbon"]["total_co2e"] for c in candidates]
    all_cost = [c["cost_usd"] for c in candidates]
    all_duration = [c["duration_hrs"] for c in candidates]

    assert by_label["LOW_CARBON"]["carbon"]["total_co2e"] == min(all_carbon)
    assert by_label["LOW_COST"]["cost_usd"] == min(all_cost)
    assert by_label["TIME_EFFICIENT"]["duration_hrs"] == min(all_duration)
