from pydantic import BaseModel, Field


class TransportLegIn(BaseModel):
    distance_km: float = Field(gt=0)
    mode: str
    passengers: int = Field(default=1, ge=1)


class ActivityIn(BaseModel):
    hours: float = Field(ge=0)
    activity_type: str = "default"


class CarbonEstimateRequest(BaseModel):
    transport_legs: list[TransportLegIn]
    nights: int = Field(ge=0)
    accommodation_category: str = "hotel-night"
    activities: list[ActivityIn] = []


class CarbonEstimateResponse(BaseModel):
    transport_co2e: float
    accommodation_co2e: float
    activity_co2e: float
    total_co2e: float
