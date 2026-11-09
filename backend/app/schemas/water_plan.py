"""
Water Plan Schemas for JalSetu AI.

Defines request and response data models for constrained water allocation
under fixed cluster budgets, supporting both backend schema and role plan contracts.
"""

import math
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field, model_validator


class FieldConstraintOverride(BaseModel):
    field_id: str = Field(..., examples=["PC-001"], min_length=1)
    min_allocation_m3: Optional[float] = Field(None, ge=0.0, description="Minimum guaranteed allocation in m³")
    max_allocation_m3: Optional[float] = Field(None, ge=0.0, description="Maximum allocation ceiling in m³")
    min_allocation_units: Optional[float] = Field(None, ge=0.0, description="Alias for min_allocation_m3")
    max_allocation_units: Optional[float] = Field(None, ge=0.0, description="Alias for max_allocation_m3")
    exclude: Optional[bool] = Field(default=False, description="Explicitly exclude field from receiving allocation")

    @model_validator(mode="after")
    def reconcile_and_validate_bounds(self) -> "FieldConstraintOverride":
        # Reconcile unit aliases
        if self.min_allocation_units is not None and self.min_allocation_m3 is None:
            self.min_allocation_m3 = self.min_allocation_units
        elif self.min_allocation_m3 is not None and self.min_allocation_units is None:
            self.min_allocation_units = self.min_allocation_m3

        if self.max_allocation_units is not None and self.max_allocation_m3 is None:
            self.max_allocation_m3 = self.max_allocation_units
        elif self.max_allocation_m3 is not None and self.max_allocation_units is None:
            self.max_allocation_units = self.max_allocation_m3

        if (
            self.min_allocation_m3 is not None
            and self.max_allocation_m3 is not None
            and self.min_allocation_m3 > self.max_allocation_m3
        ):
            raise ValueError(
                f"min_allocation ({self.min_allocation_m3}) cannot exceed max_allocation ({self.max_allocation_m3})"
            )
        if self.exclude and self.min_allocation_m3 is not None and self.min_allocation_m3 > 0.0:
            raise ValueError(f"Field '{self.field_id}' cannot have positive min_allocation when exclude=True")
        return self


class WaterPlanRequest(BaseModel):
    budget_m3: Optional[float] = Field(
        None,
        description="Available total cluster water budget in cubic meters (m³)",
        examples=[100.0],
    )
    budget_units: Optional[float] = Field(
        None,
        description="Available total cluster water budget in units (contract alias for budget_m3)",
        examples=[100.0],
    )
    scenario_id: Optional[str] = Field(
        None,
        description="Optional scenario preset ID (e.g. 'rainfall_deficit_heat_01', 'normal_01'); defaults to baseline",
        examples=["rainfall_deficit_heat_01"],
    )
    field_ids: Optional[List[str]] = Field(
        default=None,
        description="List of field IDs to allocate across; if omitted or empty, all registered cluster fields are included",
        examples=[["PC-001", "PC-002", "PC-003"]],
    )
    method: Optional[Literal["ai_priority", "equal_share", "proportional"]] = Field(
        default="ai_priority",
        description="Allocation strategy: ai_priority (default), equal_share (fixed baseline), or proportional (area-weighted)",
        examples=["ai_priority"],
    )
    constraints: Optional[List[FieldConstraintOverride]] = Field(
        default=None,
        description="Optional list of per-field minimums, maximums, or exclusion constraints",
    )
    horizon_days: Optional[int] = Field(
        default=7,
        ge=1,
        le=14,
        description="Forecast horizon window in days",
        examples=[7],
    )

    @model_validator(mode="before")
    @classmethod
    def reconcile_budget(cls, data: Any) -> Any:
        if isinstance(data, dict):
            b_m3 = data.get("budget_m3")
            b_units = data.get("budget_units")
            if b_m3 is None and b_units is None:
                raise ValueError("Either budget_m3 or budget_units must be provided")
            budget_val = b_m3 if b_m3 is not None else b_units
            if budget_val is not None:
                if not isinstance(budget_val, (int, float)) or math.isnan(budget_val) or math.isinf(budget_val):
                    raise ValueError("Budget must be a finite numeric value")
                if budget_val < 0.0:
                    raise ValueError("Budget must be greater than or equal to 0")
                data["budget_m3"] = float(budget_val)
                data["budget_units"] = float(budget_val)
        return data


class WaterPlanItem(BaseModel):
    rank: int = Field(..., examples=[1], description="Allocation priority ranking (1 = highest)")
    field_id: str = Field(..., examples=["PC-001"])
    field_name: str = Field(..., examples=["Field 1 - Tomato Alpha"])
    crop: str = Field(..., examples=["Tomato"])
    stage: str = Field(..., examples=["Flowering"])
    area_acres: float = Field(..., examples=[1.5])
    stress_probability: float = Field(..., ge=0.0, le=1.0, examples=[0.45])
    risk_state: str = Field(..., examples=["MODERATE"], description="LOW, MODERATE, or HIGH")
    priority_score: float = Field(..., ge=0.0, le=1.0, examples=[0.72], description="Composite allocation priority score")
    priority: float = Field(..., ge=0.0, le=1.0, examples=[0.72], description="Contract alias for priority_score")
    demand_m3: float = Field(..., ge=0.0, examples=[32.5], description="Estimated 7-day crop water demand in m³")
    estimated_demand: float = Field(..., ge=0.0, examples=[32.5], description="Contract alias for demand_m3")
    allocated_m3: float = Field(..., ge=0.0, examples=[32.5], description="Water allocated to this field in m³")
    allocated_units: float = Field(..., ge=0.0, examples=[32.5], description="Contract alias for allocated_m3")
    unmet_demand_m3: float = Field(..., ge=0.0, examples=[0.0], description="demand_m3 - allocated_m3")
    unmet_demand: float = Field(..., ge=0.0, examples=[0.0], description="Contract alias for unmet_demand_m3")
    action: str = Field(..., examples=["irrigate"], description="Action in {irrigate, wait, inspect, pause}")
    recommended_action: str = Field(..., examples=["irrigate"], description="Synonym for action")
    allocation_reasons: List[str] = Field(..., description="Explainable drivers supporting this priority/allocation")
    reason: List[str] = Field(..., description="Contract alias for allocation_reasons")
    unfunded_reason: Optional[str] = Field(
        None,
        description="Reason if field received less than demand: budget_exhausted, low_stress, excluded, paused, or data_stale_inspect",
        examples=["budget_exhausted"],
    )
    is_funded: bool = Field(..., examples=[True], description="True if field received positive allocation")
    is_stale: bool = Field(default=False, description="True if weather or satellite observation is stale/missing")
    is_excluded: bool = Field(default=False, description="True if field was excluded by constraint override")
    is_paused: bool = Field(default=False, description="True if irrigation is paused due to heavy rain")
    confidence: float = Field(default=0.85, ge=0.0, le=1.0, description="Model confidence in forecast")
    priority_components: Dict[str, float] = Field(default_factory=dict, description="Component contributions to priority score")


class BaselineComparisonSummary(BaseModel):
    method: str = Field(default="equal_share", examples=["equal_share"])
    share_to_high_risk_pct: float = Field(..., examples=[38.0], description="Percentage of water directed to high/moderate risk under baseline")
    ai_share_to_high_risk_pct: float = Field(..., examples=[85.0], description="Percentage of water directed to high/moderate risk under AI priority")
    top_k_at_risk_coverage_pct: float = Field(..., examples=[92.0], description="Demand coverage of top-k at-risk fields under JalSetu AI")
    baseline_top_k_coverage_pct: float = Field(..., examples=[45.0], description="Demand coverage of top-k at-risk fields under baseline")
    comparison_note: str = Field(
        default="Scenario evaluation only — AI priority targets scarce water to moisture-depleted, high-sensitivity plots instead of uniform dispersal. Not measured field water savings."
    )


class WaterPlanResponse(BaseModel):
    plan_id: str = Field(..., examples=["plan-pc-20261009-001"])
    as_of: str = Field(..., examples=["2026-10-08T00:00:00Z"])
    budget_m3: float = Field(..., ge=0.0, examples=[100.0], description="Total available water budget in m³")
    budget_units: float = Field(..., ge=0.0, examples=[100.0], description="Contract alias for budget_m3")
    total_demand_m3: float = Field(..., ge=0.0, examples=[238.5], description="Total demand across evaluated fields in m³")
    total_estimated_demand: float = Field(..., ge=0.0, examples=[238.5], description="Contract alias for total_demand_m3")
    total_allocated_m3: float = Field(..., ge=0.0, examples=[99.5], description="Sum of allocations across all fields in m³")
    allocated_units: float = Field(..., ge=0.0, examples=[99.5], description="Contract alias for total_allocated_m3")
    total_allocated_units: float = Field(..., ge=0.0, examples=[99.5], description="Contract alias for total_allocated_m3")
    remaining_budget_m3: float = Field(..., ge=0.0, examples=[0.5], description="budget_m3 - total_allocated_m3 in m³")
    remaining_budget: float = Field(..., ge=0.0, examples=[0.5], description="Contract alias for remaining_budget_m3")
    constraint_status: str = Field(
        default="valid",
        examples=["valid"],
        description="Status of constraints: 'valid' or 'infeasible'",
    )
    scenario_id: Optional[str] = Field(None, examples=["rainfall_deficit_heat_01"])
    method: str = Field(default="ai_priority", examples=["ai_priority"])
    solver: str = Field(default="deterministic_constrained_knapsack_v0.1", examples=["deterministic_constrained_knapsack_v0.1"])
    items: List[WaterPlanItem]
    rows: List[WaterPlanItem] = Field(default_factory=list, description="Contract alias for items")
    unmet_demand_fields: List[str] = Field(default_factory=list, description="Fields with demand > allocated")
    unfunded_fields: List[str] = Field(default_factory=list, description="Fields receiving 0 allocation")
    excluded_fields: List[str] = Field(default_factory=list, description="Fields explicitly excluded by override")
    paused_fields: List[str] = Field(default_factory=list, description="Fields paused due to heavy rainfall")
    inspect_fields: List[str] = Field(default_factory=list, description="Fields requiring inspection before irrigation")
    data_quality_summary: Dict[str, int] = Field(default_factory=dict, description="Counts of fresh, stale, suspect, and missing signals")
    baseline_comparison: Optional[BaselineComparisonSummary] = None
    model_version: str = Field(default="heuristic-baseline-v0.1")
    optimizer_version: str = Field(default="optimizer-greedy-knapsack-v0.1")
    data_type: str = Field(default="synthetic_demo_data")
    disclaimer: str = Field(
        default="Planning aid only — deterministic heuristic baseline using synthetic/replayed demonstration data. Not an agronomic prescription or trained ML model."
    )
    planning_disclaimer: str = Field(
        default="Scenario simulation only — indicative allocation units under fixed demonstration budget. Does NOT guarantee real-world agricultural yield improvement or measured water savings."
    )

    @model_validator(mode="after")
    def sync_contract_fields(self) -> "WaterPlanResponse":
        if not self.rows and self.items:
            self.rows = self.items
        return self
