"""
Metrics Schemas for JalSetu AI.

Defines response structure for GET /metrics telemetry and data health audits.
"""

from typing import Dict, Optional
from pydantic import BaseModel, Field


class DataQualityMetrics(BaseModel):
    fresh_signals: int = Field(..., examples=[28])
    stale_signals: int = Field(..., examples=[3])
    missing_signals: int = Field(..., examples=[1])
    suspect_signals: int = Field(..., examples=[0])
    freshness_rate_pct: float = Field(..., examples=[87.5], description="Percentage of input signals flagged GOOD")


class ProcessCounters(BaseModel):
    forecasts_requested: int = Field(default=0)
    scenarios_replayed: int = Field(default=0)
    plans_generated: int = Field(default=0)
    counter_scope: str = Field(default="since_process_start")


class MetricsResponse(BaseModel):
    as_of: str = Field(..., description="Timestamp of metrics generation")
    total_fields: int = Field(..., examples=[10])
    fields_by_risk_state: Dict[str, int] = Field(..., examples=[{"HIGH": 1, "MODERATE": 2, "LOW": 7}])
    total_events: int = Field(..., description="Persistent event count from audit ledger")
    events_by_type: Dict[str, int] = Field(..., description="Breakdown of persistent events by type")
    latest_event_timestamp: Optional[str] = Field(None, description="Timestamp of most recent event or null")
    data_quality: DataQualityMetrics
    process_counters: ProcessCounters
    ml_performance: str = Field(
        default="not_evaluated",
        description="Explicit flag confirming no unverified machine learning performance claims are made",
    )
    notes: str = Field(
        default="Event counts are persistent. Process counters are since process start. All metrics evaluate synthetic/cached demonstration data."
    )
    model_version: str = Field(default="heuristic-baseline-v0.1")
    data_type: str = Field(default="synthetic_demo_data")
    disclaimer: str = Field(
        default="Planning aid only — deterministic heuristic baseline using synthetic demonstration data. Not an agronomic prescription or trained ML model."
    )

