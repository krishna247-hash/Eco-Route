import logging

from fastapi import APIRouter

from app.core.llm_client import explain_recommendations
from app.core.optimizer import optimize_candidates
from app.schemas.recommend import RecommendRequest, RecommendResponse

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/v1/recommend", response_model=RecommendResponse)
def recommend(payload: RecommendRequest) -> RecommendResponse:
    candidates = [c.model_dump() for c in payload.candidates]
    pareto_set = optimize_candidates(candidates)

    # The "conventional" choice a traveler might make without any
    # eco-optimization is modeled as the highest-carbon candidate.
    baseline = {**max(candidates, key=lambda c: c["carbon"]["total_co2e"]), "label": "CONVENTIONAL_BASELINE"}

    # One LLM call for every option, not one call per option -- see
    # llm_client.explain_recommendations for why (free-tier rate limits).
    # The carbon/cost/duration numbers below are always real, computed by
    # the optimizer above -- never touched by the LLM. If the LLM explanation
    # step itself fails (no/invalid API key, quota, transient outage), that
    # should not block a traveler from getting their itinerary: fall back to
    # an honest empty explanation per option rather than 500ing the request.
    try:
        explanations = explain_recommendations(pareto_set, baseline)
    except RuntimeError:
        logger.warning("LLM explanation step failed; returning recommendations without explanations", exc_info=True)
        explanations = {}
    recommendations = [{**option, "explanation": explanations.get(option["label"], "")} for option in pareto_set]

    return RecommendResponse(baseline_id=baseline["id"], recommendations=recommendations)
