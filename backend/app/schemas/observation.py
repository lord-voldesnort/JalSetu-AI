from typing import Optional
from pydantic import BaseModel, Field


class ObservationResponse(BaseModel):
    timestamp: str = Field(..., examples=["2026-10-08T00:00:00Z"])
    field_id: str = Field(..., examples=["PC-001"])
    source: str = Field(..., examples=["NASA_POWER"])
    variable: str = Field(..., examples=["rainfall_mm"])
    value: Optional[float] = Field(None, examples=[14.2])
    quality_flag: str = Field(..., examples=["GOOD"])
    freshness_age: str = Field(..., examples=["12h"])
    imputation_flag: bool = Field(default=False)
