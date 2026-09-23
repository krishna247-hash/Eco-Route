from fastapi import APIRouter

from app.core.llm_client import explain_recommendations
from app.core.optimizer import optimize_candidates
from app.schemas.recommend import RecommendRequest, RecommendResponse

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
    explanations = explain_recommendations(pareto_set, baseline)
    recommendations = [{**option, "explanation": explanations.get(option["label"], "")} for option in pareto_set]

    return RecommendResponse(baseline_id=baseline["id"], recommendations=recommendations)
