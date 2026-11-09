from typing import List, Optional, Dict
from pydantic import BaseModel, Field


class WaterPlanRequest(BaseModel):
    budget: float = Field(..., ge=0.0, description="Available cluster water budget in m3 (must be >= 0)")
    scenario_id: Optional[str] = Field(None, description="Optional scenario ID override (defaults to active scenario)")
    planning_window_days: int = Field(7, ge=1, le=14, description="Planning window horizon in days")
    method: str = Field("ai", description="Allocation method: 'ai' or 'fixed_equal'")


class FieldAllocation(BaseModel):
    field_id: str
    field_name: str
    priority_rank: int
    risk_score: float
    risk_level: str
    stress_status: str
    requested_demand_m3: float
    allocated_volume_m3: float
    capacity_limit_m3: float
    allocation_percentage: float
    action_recommendation: str
    reason: str
    warnings: List[str] = Field(default_factory=list)


class BaselineComparison(BaseModel):
    baseline_method: str = "equal_allocation_share"
    total_budget_m3: float
    ai_allocated_total_m3: float
    baseline_allocated_total_m3: float
    ai_high_risk_allocation_m3: float
    baseline_high_risk_allocation_m3: float
    ai_high_risk_share_pct: float
    baseline_high_risk_share_pct: float
    top_stressed_fields_funded_ai: int
    top_stressed_fields_funded_baseline: int
    narrative: str


class WaterPlanResponse(BaseModel):
    plan_id: str
    as_of_date: str
    scenario_id: str
    is_simulated: bool = False
    requested_budget_m3: float
    total_allocated_m3: float
    unallocated_remainder_m3: float
    budget_utilization_pct: float
    constraint_checks: Dict[str, bool]
    allocations: List[FieldAllocation]
    baseline_comparison: BaselineComparison
    disclaimer: str = (
        "Planning aid — not an agronomic prescription. Budget mathematically conserved. "
        "Does not claim verified yield improvement or field water savings."
    )

