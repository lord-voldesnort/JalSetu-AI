from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from app.schemas.observation import ObservationResponse


class Geometry(BaseModel):
    type: str = Field(default="Polygon", examples=["Polygon"])
    coordinates: List[Any]


class FieldResponse(BaseModel):
    id: str = Field(..., examples=["PC-001"])
    name: str = Field(..., examples=["Field 1 - Tomato Alpha"])
    crop: str = Field(..., examples=["Tomato"])
    stage: str = Field(..., examples=["Flowering"])
    area_acres: float = Field(..., examples=[1.5])
    geometry: Geometry
    data_type: str = Field(
        default="synthetic_demo_data",
        description="Explicitly indicates synthetic/cached demonstration data",
    )


class FreshnessMeta(BaseModel):
    age_days: Optional[int] = Field(None, examples=[0])
    stale: bool = Field(default=False)
    quality_flag: str = Field(default="GOOD", examples=["GOOD"])
    last_updated: Optional[str] = Field(None, examples=["2026-10-08T00:00:00Z"])


class FieldStatusResponse(BaseModel):
    field: FieldResponse
    status: str = Field(..., examples=["green"], description="Stress status: green, amber, red")
    observations: List[ObservationResponse]
    freshness: Dict[str, FreshnessMeta]
    data_type: str = Field(
        default="synthetic_demo_data",
        description="Explicitly marks response as synthetic demonstration data",
    )
