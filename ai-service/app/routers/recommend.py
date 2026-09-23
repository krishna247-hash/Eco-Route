from fastapi import APIRouter

from app.core.llm_client import explain_recommendation
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

    recommendations = [
        {**option, "explanation": explain_recommendation(option, baseline)} for option in pareto_set
    ]

    return RecommendResponse(baseline_id=baseline["id"], recommendations=recommendations)
