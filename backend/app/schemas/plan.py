from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, model_validator


class WaterPlanRequest(BaseModel):
    budget: float = Field(default=100.0, ge=0.0, description="Available cluster water budget in m3 (must be >= 0)")
    budget_units: Optional[float] = Field(None, ge=0.0, description="Alias for budget in units")
    scenario_id: Optional[str] = Field(None, description="Optional scenario ID override (defaults to active scenario)")
    planning_window_days: int = Field(7, ge=1, le=14, description="Planning window horizon in days")
    method: str = Field("ai", description="Allocation method: 'ai' or 'fixed_equal'")

    @model_validator(mode="before")
    @classmethod
    def reconcile_budget(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "budget" not in data and "budget_units" in data:
                data["budget"] = data["budget_units"]
            elif "budget" in data and "budget_units" not in data:
                data["budget_units"] = data["budget"]
        return data


class FieldAllocation(BaseModel):
    field_id: str
    field_name: str
    priority_rank: int
    priority: Optional[int] = None
    risk_score: float
    risk_level: str
    stress_status: str
    requested_demand_m3: float
    allocated_volume_m3: float
    allocated_units: Optional[float] = None
    capacity_limit_m3: float
    allocation_percentage: float
    action_recommendation: str
    recommended_action: Optional[str] = None
    reason: str
    warnings: List[str] = Field(default_factory=list)

    @model_validator(mode="before")
    @classmethod
    def populate_aliases(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "priority" not in data and "priority_rank" in data:
                data["priority"] = data["priority_rank"]
            if "allocated_units" not in data and "allocated_volume_m3" in data:
                data["allocated_units"] = data["allocated_volume_m3"]
            if "recommended_action" not in data and "action_recommendation" in data:
                data["recommended_action"] = data["action_recommendation"]
        return data


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
    budget_units: Optional[float] = None
    total_allocated_m3: float
    allocated_units: Optional[float] = None
    unallocated_remainder_m3: float
    budget_utilization_pct: float
    constraint_status: str = "FEASIBLE"
    constraint_checks: Dict[str, bool]
    allocations: List[FieldAllocation]
    rows: Optional[List[Dict[str, Any]]] = None
    baseline_comparison: BaselineComparison
    disclaimer: str = (
        "Planning aid — not an agronomic prescription. Budget mathematically conserved. "
        "Does not claim verified yield improvement or field water savings."
    )

    @model_validator(mode="before")
    @classmethod
    def populate_response_aliases(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "budget_units" not in data and "requested_budget_m3" in data:
                data["budget_units"] = data["requested_budget_m3"]
            if "allocated_units" not in data and "total_allocated_m3" in data:
                data["allocated_units"] = data["total_allocated_m3"]
            if "rows" not in data and "allocations" in data:
                rows = []
                for a in data["allocations"]:
                    if isinstance(a, dict):
                        rows.append({
                            "field_id": a.get("field_id"),
                            "priority": a.get("priority", a.get("priority_rank")),
                            "risk_state": a.get("risk_level", "MODERATE").upper(),
                            "allocated_units": a.get("allocated_units", a.get("allocated_volume_m3")),
                            "recommended_action": a.get("recommended_action", a.get("action_recommendation")),
                            "reason": a.get("reason"),
                        })
                    elif hasattr(a, "field_id"):
                        rows.append({
                            "field_id": a.field_id,
                            "priority": getattr(a, "priority", getattr(a, "priority_rank", 1)),
                            "risk_state": getattr(a, "risk_level", "MODERATE").upper(),
                            "allocated_units": getattr(a, "allocated_units", getattr(a, "allocated_volume_m3", 0.0)),
                            "recommended_action": getattr(a, "recommended_action", getattr(a, "action_recommendation", "irrigate")),
                            "reason": getattr(a, "reason", ""),
                        })
                data["rows"] = rows
        return data
