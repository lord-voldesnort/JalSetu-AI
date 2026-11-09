from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, Field


class ObservationRecord(BaseModel):
    field_id: str = Field(..., description="Target field identifier")
    timestamp: datetime = Field(..., description="Observation timestamp (UTC)")
    source: str = Field(..., description="Observation data source (e.g. synthetic_weather_replay)")
    variable: str = Field(..., description="Observed variable name")
    value: float = Field(..., description="Measurement value")
    unit: str = Field(..., description="Physical or normalized unit")
    quality_flag: Literal["good", "stale"] = Field("good", description="Data quality assessment")
    age_days: int = Field(..., ge=0, description="Age in days relative to replay reference date")


class ObservationListResponse(BaseModel):
    count: int
    field_id: Optional[str] = None
    observations: list[ObservationRecord]

