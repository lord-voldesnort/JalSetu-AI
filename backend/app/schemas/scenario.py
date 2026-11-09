from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field


class ChangedInputSignal(BaseModel):
    variable: str
    source: str
    unit: str
    change_type: Optional[str] = None
    value: float
    replayed_value: Optional[float] = None
    baseline_reference_value: Optional[float] = None
    description: Optional[str] = None


class ResetBehavior(BaseModel):
    target_scenario_id: str = "normal_01"
    reverts_to_baseline: bool = True
    mutates_base_fixtures: bool = False
    description: str


class ScenarioDefinition(BaseModel):
    id: str = Field(..., description="Unique scenario identifier")
    name: str = Field(..., description="Scenario display name")
    title: str = Field(..., description="Full title")
    description: str
    scenario_type: str
    intensity: Optional[str] = "moderate"
    affected_field_ids: List[str] = Field(default_factory=list)
    changed_input_signals: List[ChangedInputSignal] = Field(default_factory=list)
    expected_risk_direction: str
    reset_behavior: ResetBehavior
    is_synthetic_replay: bool = True
    synthetic_notice: str


class ScenarioListResponse(BaseModel):
    count: int
    scenarios: List[ScenarioDefinition]
