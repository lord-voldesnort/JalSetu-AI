from fastapi import APIRouter, HTTPException
from app.schemas.forecast import ForecastResponse
from app.services.forecast_service import compute_field_forecast
from app.services.metrics_service import process_counters

router = APIRouter(tags=["forecast"])


@router.get("/forecast/{field_id}", response_model=ForecastResponse)
@router.get("/api/v1/forecast/{field_id}", response_model=ForecastResponse, include_in_schema=False)
def get_field_forecast_endpoint(field_id: str) -> ForecastResponse:
    """
    Retrieve deterministic near-term stress forecast baseline for a specific demonstration field.
    Returns stress probability, risk state, confidence, top drivers, freshness indicators,
    and model version metadata.
    """
    forecast_data = compute_field_forecast(field_id)
    if not forecast_data:
        raise HTTPException(
            status_code=404,
            detail=f"Field '{field_id}' not found"
        )
    process_counters.inc_forecast()
    return forecast_data
