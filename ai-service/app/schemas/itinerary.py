from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.carbon import CarbonEstimateResponse


class TripInput(BaseModel):
    origin: str
    destination: str
    distance_km: float = Field(gt=0)
    nights: int = Field(ge=1)
    travelers: int = Field(default=1, ge=1)
    budget_usd: float | None = None
    preference: Literal["eco", "balanced", "budget", "speed"] = "balanced"
    activity_hours: float = Field(default=4.0, ge=0)


class CandidateItinerary(BaseModel):
    id: str
    transport_mode: str
    accommodation_tier: str
    carbon: CarbonEstimateResponse
    cost_usd: float
    duration_hrs: float
    preference_score: float


class GenerateItinerariesResponse(BaseModel):
    candidates: list[CandidateItinerary]
