"""
Event Governance Schemas for JalSetu AI.

Defines Pydantic data models for action logging, audit trails, and farmer overrides.
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
import uuid
from pydantic import BaseModel, ConfigDict, Field, model_validator


class EventType(str, Enum):
    WATER_PLAN_GENERATED = "water_plan_generated"
    SCENARIO_REPLAYED = "scenario_replayed"
    RECOMMENDATION_VIEWED = "recommendation_viewed"
    RECOMMENDATION_ACKNOWLEDGED = "recommendation_acknowledged"
    IRRIGATION_PLANNED = "irrigation_planned"
    IRRIGATION_COMPLETED = "irrigation_completed"
    RECOMMENDATION_OVERRIDDEN = "recommendation_overridden"
    RECOMMENDATION_REJECTED = "recommendation_rejected"


class EventCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    event_type: EventType
    field_id: Optional[str] = Field(None, examples=["PC-001"])
    action: Optional[str] = Field(None, examples=["irrigate"])
    planned_amount: Optional[float] = Field(None, ge=0.0, description="Planned volume in units/m³")
    actual_amount: Optional[float] = Field(None, ge=0.0, description="Actual executed volume in units/m³")
    override_reason: Optional[str] = Field(
        None,
        description="Mandatory explanation when farmer or manager overrides/rejects a recommendation",
        examples=["Soil felt adequately moist upon manual ground inspection"],
    )
    note: Optional[str] = Field(None, description="Free-text operational note")
    scenario_id: Optional[str] = Field(None, description="Associated scenario context")
    plan_ref: Optional[str] = Field(None, description="Associated water plan reference ID")
    recommendation: Optional[Dict[str, Any]] = Field(
        None,
        description="Snapshot of system recommendation (e.g. risk_state, recommended_action)",
    )
    model_version: Optional[str] = Field(None, description="Model or heuristic version at decision time")
    actor: Optional[str] = Field(default="demo", description="Identifier of actor (farmer_demo, water_manager, etc.)")
    source: Optional[str] = Field(default="api", description="Interface source (api, web_dashboard, mobile_card)")
    metadata: Optional[Dict[str, Any]] = Field(default=None, description="Optional telemetry/context key-value pairs")

    @model_validator(mode="after")
    def validate_event_business_rules(self) -> "EventCreateRequest":
        # 1. Planned vs Completed amount enforcement
        if self.event_type == EventType.IRRIGATION_PLANNED:
            if self.actual_amount is not None:
                raise ValueError("event_type 'irrigation_planned' must not specify 'actual_amount'")
        if self.event_type == EventType.IRRIGATION_COMPLETED:
            if self.actual_amount is None:
                raise ValueError("event_type 'irrigation_completed' requires 'actual_amount'")

        # 2. Override & Reject require override_reason
        if self.event_type in (EventType.RECOMMENDATION_OVERRIDDEN, EventType.RECOMMENDATION_REJECTED):
            if not self.override_reason or not self.override_reason.strip():
                raise ValueError(f"event_type '{self.event_type.value}' requires a non-empty 'override_reason'")

        # 3. Metadata size check
        if self.metadata is not None and len(self.metadata) > 25:
            raise ValueError("metadata dictionary exceeds maximum allowed limit of 25 keys")

        return self


class EventResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    event_id: str = Field(..., description="Server-generated unique UUID4")
    created_at: str = Field(..., description="Server UTC ISO 8601 timestamp")
    event_type: EventType
    field_id: Optional[str] = None
    action: Optional[str] = None
    planned_amount: Optional[float] = None
    actual_amount: Optional[float] = None
    override_reason: Optional[str] = None
    note: Optional[str] = None
    scenario_id: Optional[str] = None
    plan_ref: Optional[str] = None
    recommendation: Optional[Dict[str, Any]] = None
    model_version: Optional[str] = None
    actor: str = "demo"
    source: str = "api"
    metadata: Optional[Dict[str, Any]] = None


def create_event_record_from_request(req: EventCreateRequest) -> EventResponse:
    """Generate a server-sealed EventResponse record with immutable ID and timestamp."""
    event_uuid = str(uuid.uuid4())
    now_utc = datetime.now(timezone.utc).isoformat()
    return EventResponse(
        event_id=event_uuid,
        created_at=now_utc,
        event_type=req.event_type,
        field_id=req.field_id,
        action=req.action,
        planned_amount=req.planned_amount,
        actual_amount=req.actual_amount,
        override_reason=req.override_reason,
        note=req.note,
        scenario_id=req.scenario_id,
        plan_ref=req.plan_ref,
        recommendation=req.recommendation,
        model_version=req.model_version,
        actor=req.actor or "demo",
        source=req.source or "api",
        metadata=req.metadata,
    )

