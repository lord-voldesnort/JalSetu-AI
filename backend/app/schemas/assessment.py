from typing import List, Optional
from pydantic import BaseModel, Field


class SignalContribution(BaseModel):
    signal_name: str
    observed_value: float
    unit: str
    contribution_points: float
    direction: str = Field(..., description="'increases_stress', 'decreases_stress', or 'neutral'")
    statement: str = Field(..., description="Plain-language agronomic explanation sentence")


class DataFreshnessIndicator(BaseModel):
    variable: str
    source: str
    observed_at: str
    age_days: int
    quality_flag: str = "good"
    is_stale: bool = False


class FieldAssessmentResponse(BaseModel):
    field_id: str
    field_name: str
    crop: str
    stage: str
    area_acres: float
    area_ha: float
    as_of_date: str
    risk_score: float = Field(..., ge=0.0, le=100.0, description="Normalized risk score 0-100")
    stress_index: float = Field(..., ge=0.0, le=1.0, description="Normalized stress index 0.0-1.0")
    risk_level: str = Field(..., description="Low, Moderate, High, or Critical")
    stress_status: str = Field(..., description="green, amber, red, or blue (pause)")
    recommended_action: str = Field(..., description="irrigate_now, wait, inspect, protect_pause")
    action_window: str
    recommended_volume_m3: float
    confidence: float = Field(..., ge=0.0, le=1.0)
    is_simulated: bool = False
    active_scenario: str = "normal_01"
    drivers: List[SignalContribution] = Field(default_factory=list)
    freshness_table: List[DataFreshnessIndicator] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    policy_disclaimer: str = (
        "Planning aid — not an agronomic prescription. Prototype heuristic index based on synthetic demo fixtures."
    )


class ClusterAssessmentSummary(BaseModel):
    cluster_name: str = "Pimpri-Chinchwad Peri-Urban Demonstration Cluster"
    as_of_date: str
    active_scenario: str = "normal_01"
    is_simulated: bool = False
    total_fields: int
    counts_by_status: dict
    counts_by_action: dict
    total_recommended_volume_m3: float
    fields: List[FieldAssessmentResponse]

