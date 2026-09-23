from pydantic import BaseModel

from app.schemas.itinerary import CandidateItinerary
from app.schemas.optimize import LabeledItinerary


class RecommendRequest(BaseModel):
    candidates: list[CandidateItinerary]


class RecommendedItinerary(LabeledItinerary):
    explanation: str


class RecommendResponse(BaseModel):
    baseline_id: str
    recommendations: list[RecommendedItinerary]
