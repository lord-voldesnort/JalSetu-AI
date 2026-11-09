from typing import Optional, Dict
from pydantic import BaseModel, Field


class ActionEventRequest(BaseModel):
    field_id: str = Field(..., description="Target field ID (e.g. PC-001)")
    action_taken: str = Field(..., description="Action chosen: irrigate_now, wait, inspect, protect_pause, other")
    followed_recommendation: bool = Field(..., description="Whether operator followed JalSetu recommendation")
    override_reason: Optional[str] = Field(None, description="Required when followed_recommendation is False")
    planned_volume_m3: Optional[float] = Field(None, ge=0.0)
    actual_volume_m3: Optional[float] = Field(None, ge=0.0)
    user_role: str = Field("farmer", description="Role of operator submitting the action")
    notes: Optional[str] = Field(None, max_length=500)


class ActionEventResponse(BaseModel):
    event_id: str
    field_id: str
    timestamp: str
    recommended_action: str
    action_taken: str
    followed_recommendation: bool
    override_reason: Optional[str] = None
    planned_volume_m3: Optional[float] = None
    actual_volume_m3: Optional[float] = None
    user_role: str
    status: str = "recorded"


class SystemMetricsResponse(BaseModel):
    total_fields: int
    total_observations: int
    total_events_logged: int
    overrides_logged: int
    adherence_rate_pct: float
    override_reasons_breakdown: Dict[str, int]
    risk_distribution: Dict[str, int]
    active_scenario: str
    database_type: str = "sqlite"

