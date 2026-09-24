from pydantic import BaseModel

from app.schemas.itinerary import CandidateItinerary


class OptimizeRequest(BaseModel):
    candidates: list[CandidateItinerary]


class LabeledItinerary(CandidateItinerary):
    label: str


class OptimizeResponse(BaseModel):
    pareto_set: list[LabeledItinerary]
