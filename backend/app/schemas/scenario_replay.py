from typing import List, Optional
from pydantic import BaseModel, Field


class ScenarioReplayRequest(BaseModel):
    scenario_id: str = Field(..., description="Scenario ID to replay: normal_01, rainfall_deficit_heat_01, heavy_rain_pause_01")


class ScenarioSignalDiff(BaseModel):
    variable: str
    unit: str
    baseline_value: float
    simulated_value: float
    difference: float
    description: str


class FieldStatusDiff(BaseModel):
    field_id: str
    field_name: str
    baseline_score: float
    simulated_score: float
    baseline_status: str
    simulated_status: str
    baseline_action: str
    simulated_action: str
    changed: bool


class ScenarioReplayResponse(BaseModel):
    scenario_id: str
    name: str
    title: str
    description: str
    scenario_type: str
    is_synthetic_replay: bool = True
    affected_field_ids: List[str]
    signals_changed: List[ScenarioSignalDiff]
    fields_affected_count: int
    field_status_diffs: List[FieldStatusDiff]
    summary_narrative: str

