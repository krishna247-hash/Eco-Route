from unittest.mock import patch

from app.core.candidate_generator import generate_candidates
from app.routers.recommend import recommend
from app.schemas.itinerary import CandidateItinerary
from app.schemas.recommend import RecommendRequest


def _request() -> RecommendRequest:
    trip_input = {
        "distance_km": 620,
        "nights": 5,
        "travelers": 3,
        "activity_hours": 6,
        "preference": "balanced",
    }
    candidates = generate_candidates(trip_input)
    return RecommendRequest(candidates=[CandidateItinerary(**c) for c in candidates])


def test_recommend_falls_back_to_empty_explanations_when_llm_fails():
    """The carbon/cost/duration numbers are always real, computed by the
    optimizer -- an LLM outage (missing key, quota, transient failure)
    should not block a traveler from getting their itinerary; only the
    narrated explanation is honestly left blank."""
    with patch("app.routers.recommend.explain_recommendations", side_effect=RuntimeError("boom")):
        response = recommend(_request())

    assert len(response.recommendations) > 0
    assert all(option.explanation == "" for option in response.recommendations)
    # The real, computed fields are untouched by the LLM failure.
    assert all(option.carbon.total_co2e > 0 for option in response.recommendations)


def test_recommend_uses_llm_explanations_when_available():
    with patch(
        "app.routers.recommend.explain_recommendations",
        return_value={"LOW_CARBON": "Cuts emissions significantly."},
    ):
        response = recommend(_request())

    low_carbon = next(o for o in response.recommendations if o.label == "LOW_CARBON")
    assert low_carbon.explanation == "Cuts emissions significantly."
