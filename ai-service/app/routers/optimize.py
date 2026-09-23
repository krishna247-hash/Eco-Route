from fastapi import APIRouter

from app.core.optimizer import optimize_candidates
from app.schemas.optimize import OptimizeRequest, OptimizeResponse

router = APIRouter()


@router.post("/v1/optimize", response_model=OptimizeResponse)
def optimize(payload: OptimizeRequest) -> OptimizeResponse:
    candidates = [c.model_dump() for c in payload.candidates]
    pareto_set = optimize_candidates(candidates)
    return OptimizeResponse(pareto_set=pareto_set)
