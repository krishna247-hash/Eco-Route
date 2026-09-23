from fastapi import APIRouter

from app.core.carbon_engine import calculate_trip_co2e
from app.schemas.carbon import CarbonEstimateRequest, CarbonEstimateResponse

router = APIRouter()


@router.post("/v1/carbon/estimate", response_model=CarbonEstimateResponse)
def estimate_carbon(payload: CarbonEstimateRequest) -> CarbonEstimateResponse:
    result = calculate_trip_co2e(
        transport_legs=[leg.model_dump() for leg in payload.transport_legs],
        nights=payload.nights,
        accommodation_category=payload.accommodation_category,
        activities=[activity.model_dump() for activity in payload.activities],
    )
    return CarbonEstimateResponse(**result)
