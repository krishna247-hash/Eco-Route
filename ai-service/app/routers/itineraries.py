from fastapi import APIRouter

from app.core.candidate_generator import generate_candidates
from app.schemas.itinerary import GenerateItinerariesResponse, TripInput

router = APIRouter()


@router.post("/v1/itineraries/generate", response_model=GenerateItinerariesResponse)
def generate_itineraries(payload: TripInput) -> GenerateItinerariesResponse:
    candidates = generate_candidates(payload.model_dump())
    return GenerateItinerariesResponse(candidates=candidates)
