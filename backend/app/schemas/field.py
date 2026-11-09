from typing import List, Literal, Optional, Any, Dict
from pydantic import BaseModel, Field


class GeoJSONPolygon(BaseModel):
    type: Literal["Polygon"] = "Polygon"
    coordinates: List[List[List[float]]]


class FieldProperties(BaseModel):
    id: str = Field(..., description="Unique field identifier (e.g. PC-001)")
    name: str = Field(..., description="Human-readable field name")
    crop: str = Field(..., description="Planted crop type")
    stage: str = Field(..., description="Current crop growth stage")
    area_acres: float = Field(..., gt=0, description="Field area in acres")
    area_ha: Optional[float] = Field(None, description="Field area in hectares")
    stress_status: Optional[str] = Field("green", description="Current stress status: green, amber, red")
    stress_probability: Optional[float] = Field(None, ge=0.0, le=1.0)
    recommended_action: Optional[str] = Field(None, description="Recommended action: irrigate_now, wait, inspect, protect_pause")


class FieldFeature(BaseModel):
    type: Literal["Feature"] = "Feature"
    id: Optional[str] = None
    properties: FieldProperties
    geometry: GeoJSONPolygon


class FieldFeatureCollection(BaseModel):
    type: Literal["FeatureCollection"] = "FeatureCollection"
    features: List[FieldFeature]

