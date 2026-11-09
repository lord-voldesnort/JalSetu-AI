from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from app.schemas.field import FreshnessMeta


class DriverResponse(BaseModel):
    rank: int = Field(..., examples=[1])
    feature: str = Field(..., examples=["rainfall_deficit"])
    label: str = Field(..., examples=["Recent rainfall of 14.2 mm lowers near-term deficit"])
    value: Optional[float] = Field(None, examples=[14.2])
    contribution: float = Field(..., examples=[-0.25], description="Heuristic contribution score")
    direction: str = Field(..., examples=["decreases_risk"], description="increases_risk, decreases_risk, or neutral")


class UncertaintyBand(BaseModel):
    p10: float = Field(..., examples=[0.08], description="10th percentile stress index estimate")
    p50: float = Field(..., examples=[0.15], description="Median stress index estimate")
    p90: float = Field(..., examples=[0.24], description="90th percentile stress index estimate")


class ForecastResponse(BaseModel):
    field_id: str = Field(..., examples=["PC-001"])
    as_of_date: str = Field(..., examples=["2026-10-08T00:00:00Z"])
    horizon_days: int = Field(default=7, examples=[7])
    stress_probability: float = Field(..., ge=0.0, le=1.0, examples=[0.15])
    status: str = Field(..., examples=["green"], description="Stress status: green, amber, red")
    risk_state: str = Field(..., examples=["LOW"], description="Risk level: LOW, MODERATE, HIGH")
    recommended_action: str = Field(..., examples=["wait"], description="irrigate_now, wait, inspect, protect_pause")
    confidence: float = Field(..., ge=0.0, le=1.0, examples=[0.85], description="Model confidence score")
    uncertainty_band: UncertaintyBand
    top_drivers: List[DriverResponse]
    freshness: Dict[str, FreshnessMeta]
    input_availability: Dict[str, bool]
    model_version: str = Field(default="heuristic-baseline-v0.1")
    model_type: str = Field(default="deterministic_agronomic_heuristic_baseline")
    data_type: str = Field(
        default="synthetic_demo_data",
        description="Explicitly marks response as synthetic demonstration data",
    )
    disclaimer: str = Field(
        default="Planning aid only — deterministic heuristic baseline using synthetic/replayed demonstration data. Not an agronomic prescription or trained ML model."
    )
