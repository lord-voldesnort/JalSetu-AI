"""
Explainability Schemas for JalSetu AI.

Defines response structures for GET /explain/{field_id}.
"""

from typing import Dict, List, Optional
from pydantic import BaseModel, Field
from app.schemas.field import FreshnessMeta
from app.schemas.forecast import DriverResponse, UncertaintyBand


class ExplainResponse(BaseModel):
    field_id: str = Field(..., examples=["PC-001"])
    field_name: str = Field(..., examples=["Field 1 - Tomato Alpha"])
    crop: str = Field(..., examples=["Tomato"])
    stage: str = Field(..., examples=["Flowering"])
    area_acres: float = Field(..., examples=[1.5])
    as_of_date: str = Field(..., examples=["2026-10-08T00:00:00Z"])
    horizon_days: int = Field(default=7, examples=[7])
    stress_probability: float = Field(..., ge=0.0, le=1.0, examples=[0.45])
    risk_state: str = Field(..., examples=["MODERATE"], description="LOW, MODERATE, or HIGH")
    confidence: float = Field(..., ge=0.0, le=1.0, examples=[0.85])
    uncertainty_band: UncertaintyBand
    top_drivers: List[DriverResponse] = Field(..., description="Top contributing feature drivers")
    freshness: Dict[str, FreshnessMeta] = Field(..., description="Signal freshness indicators")
    recommended_action: str = Field(..., examples=["irrigate"], description="Action in {irrigate, wait, inspect, pause}")
    action_reason: str = Field(..., examples=["Irrigate to relieve crop moisture deficit"])
    why_card: str = Field(
        ...,
        examples=["High priority: Tomato in Flowering stage with emerging rainfall deficit."],
        description="Comprehensive natural language explanation card for farmers and water managers",
    )
    insufficient_data: bool = Field(
        default=False,
        description="True if key signals are missing or stale, requiring field inspection",
    )
    scenario_id: Optional[str] = Field(None, examples=["rainfall_deficit_heat_01"])
    model_version: str = Field(default="heuristic-baseline-v0.1")
    model_type: str = Field(default="deterministic_agronomic_heuristic_baseline")
    data_type: str = Field(default="synthetic_demo_data")
    data_limitations: str = Field(
        default="Synthetic demonstration data for Pimpri-Chinchwad cluster. Offline cached observations; not live IoT sensor feeds."
    )
    disclaimer: str = Field(
        default="Planning aid only — deterministic heuristic baseline using synthetic demonstration data. Not an agronomic prescription or trained ML model."
    )

