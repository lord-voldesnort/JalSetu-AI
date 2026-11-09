from typing import List, Optional
from pydantic import BaseModel, Field


class DailyForecastPoint(BaseModel):
    day_offset: int = Field(..., ge=1, le=7)
    date: str
    projected_risk_score: float = Field(..., ge=0.0, le=100.0)
    projected_stress_index: float = Field(..., ge=0.0, le=1.0)
    projected_status: str = Field(..., description="green, amber, red, blue")
    projected_soil_moisture: float = Field(..., ge=0.0, le=1.0)
    forecast_tmax: float
    forecast_rainfall: float
    confidence_p10: float
    confidence_p90: float


class FieldForecastResponse(BaseModel):
    field_id: str
    field_name: str
    horizon_days: int = Field(..., ge=3, le=7)
    as_of_date: str
    daily_projections: List[DailyForecastPoint]
    influencing_inputs: List[str]
    model_version: str = "deterministic-heuristic-v1"
    data_freshness_warning: Optional[str] = None
    limitations_disclaimer: str = (
        "Prototype heuristic projection based on temperature-driven depletion and forecast precipitation. "
        "Not a scientifically validated predictive model."
    )

