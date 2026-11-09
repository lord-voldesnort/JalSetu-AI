import uuid
import datetime
import logging
from typing import List, Dict, Tuple, Optional

from app.services.stress_engine import stress_engine
from app.services.scenario_mgr import scenario_manager
from app.schemas.plan import (
    WaterPlanRequest,
    WaterPlanResponse,
    FieldAllocation,
    BaselineComparison
)
from app.schemas.assessment import FieldAssessmentResponse

logger = logging.getLogger(__name__)


class WaterAllocationEngine:
    """Deterministic constrained water-allocation optimization engine and baseline comparator."""

    # Stage sensitivity multipliers
    STAGE_MULTIPLIERS = {
        "flowering": 1.25,
        "fruiting": 1.20,
        "vegetative": 1.00,
        "seedling": 0.85,
        "maturity": 0.70
    }

    def _compute_field_capacity(self, assessment: FieldAssessmentResponse) -> float:
        """Compute maximum irrigation capacity constraint based on field area and growth stage."""
        mult = self.STAGE_MULTIPLIERS.get(assessment.stage.lower(), 1.0)
        # Peak tomato requirement is approx 18-24 m3 per acre in semi-arid climate
        capacity = round(assessment.area_acres * 18.0 * mult, 1)
        return max(5.0, capacity)

    def optimize_plan(
        self,
        budget_m3: float,
        scenario_id_override: Optional[str] = None,
        planning_window_days: int = 7,
        method: str = "ai"
    ) -> WaterPlanResponse:
        """
        Generate a constrained water allocation plan strictly conserving the available budget:
            maximize sum(priority_i * x_i)
            subject to:
                sum(x_i) <= budget_m3
                0 <= x_i <= capacity_i
                x_i = 0 for fields with action 'protect_pause' or 'wait' with low stress
        """
        if budget_m3 < 0:
            raise ValueError("Requested water budget must be non-negative (>= 0).")

        cluster_summary = stress_engine.assess_cluster(scenario_id_override=scenario_id_override)
        fields = cluster_summary.fields
        scenario_id = scenario_id_override or scenario_manager.active_scenario_id

        allocations: List[FieldAllocation] = []
        eligible_candidates: List[Tuple[float, FieldAssessmentResponse, float, float]] = []

        # 1. Evaluate eligibility and priority per field
        for f in fields:
            capacity = self._compute_field_capacity(f)

            # Exclusion / Pause rules
            if f.recommended_action == "protect_pause":
                allocations.append(
                    FieldAllocation(
                        field_id=f.field_id,
                        field_name=f.field_name,
                        priority_rank=999,
                        risk_score=f.risk_score,
                        risk_level=f.risk_level,
                        stress_status=f.stress_status,
                        requested_demand_m3=0.0,
                        allocated_volume_m3=0.0,
                        capacity_limit_m3=capacity,
                        allocation_percentage=0.0,
                        action_recommendation=f.recommended_action,
                        reason="Irrigation paused: heavy precipitation / soil waterlogging protection rule.",
                        warnings=f.warnings
                    )
                )
                continue

            if f.recommended_action == "wait" and f.risk_score < 35.0:
                allocations.append(
                    FieldAllocation(
                        field_id=f.field_id,
                        field_name=f.field_name,
                        priority_rank=990,
                        risk_score=f.risk_score,
                        risk_level=f.risk_level,
                        stress_status=f.stress_status,
                        requested_demand_m3=0.0,
                        allocated_volume_m3=0.0,
                        capacity_limit_m3=capacity,
                        allocation_percentage=0.0,
                        action_recommendation=f.recommended_action,
                        reason="No immediate irrigation needed: field water context is healthy (Low stress).",
                        warnings=f.warnings
                    )
                )
                continue

            # Eligible fields: priority score = risk_score * stage_multiplier
            stage_mult = self.STAGE_MULTIPLIERS.get(f.stage.lower(), 1.0)
            priority_score = round(f.risk_score * stage_mult, 2)
            demand = f.recommended_volume_m3 if f.recommended_volume_m3 > 0 else capacity

            eligible_candidates.append((priority_score, f, demand, capacity))

        # Sort eligible fields by priority score descending (highest risk first)
        eligible_candidates.sort(key=lambda item: item[0], reverse=True)

        # 2. Allocate budget greedily in priority order (strictly enforcing sum <= budget)
        allocated_total = 0.0
        remaining_budget = budget_m3

        for rank, (score, f, demand, capacity) in enumerate(eligible_candidates, start=1):
            if remaining_budget <= 0.0 or budget_m3 == 0.0:
                allocated = 0.0
                reason = "Unfunded: water budget exhausted by higher-priority fields." if budget_m3 > 0 else "Zero budget available."
            else:
                wanted = min(demand, capacity)
                allocated = round(min(wanted, remaining_budget), 1)
                remaining_budget = round(remaining_budget - allocated, 1)

                if allocated >= wanted:
                    reason = f"Fully funded at rank #{rank} based on high risk ({f.risk_score}) and {f.stage} crop sensitivity."
                else:
                    reason = f"Partially funded at rank #{rank}: capped by remaining available budget."

            allocated_total = round(allocated_total + allocated, 1)
            pct = round((allocated / capacity) * 100.0, 1) if capacity > 0 else 0.0

            allocations.append(
                FieldAllocation(
                    field_id=f.field_id,
                    field_name=f.field_name,
                    priority_rank=rank,
                    risk_score=f.risk_score,
                    risk_level=f.risk_level,
                    stress_status=f.stress_status,
                    requested_demand_m3=demand,
                    allocated_volume_m3=allocated,
                    capacity_limit_m3=capacity,
                    allocation_percentage=pct,
                    action_recommendation=f.recommended_action,
                    reason=reason,
                    warnings=f.warnings
                )
            )

        # Sort final list: priority rank ascending
        allocations.sort(key=lambda a: a.priority_rank)

        # 3. Compute Equal-Allocation Baseline
        eligible_count = len(eligible_candidates)
        baseline_allocated_total = 0.0
        ai_high_risk_vol = 0.0
        base_high_risk_vol = 0.0
        top_funded_ai = 0
        top_funded_base = 0

        equal_share = round(budget_m3 / eligible_count, 1) if (eligible_count > 0 and budget_m3 > 0) else 0.0

        for score, f, demand, capacity in eligible_candidates:
            # Baseline allocation: capped at capacity
            base_alloc = min(equal_share, capacity)
            baseline_allocated_total += base_alloc

            # Find corresponding AI allocation
            ai_alloc = next((a.allocated_volume_m3 for a in allocations if a.field_id == f.field_id), 0.0)

            is_high_risk = f.risk_score >= 60.0
            if is_high_risk:
                ai_high_risk_vol += ai_alloc
                base_high_risk_vol += base_alloc
                if ai_alloc >= (demand * 0.8):
                    top_funded_ai += 1
                if base_alloc >= (demand * 0.8):
                    top_funded_base += 1

        baseline_allocated_total = round(min(baseline_allocated_total, budget_m3), 1)
        ai_high_risk_vol = round(ai_high_risk_vol, 1)
        base_high_risk_vol = round(base_high_risk_vol, 1)

        ai_share_pct = round((ai_high_risk_vol / allocated_total * 100.0), 1) if allocated_total > 0 else 0.0
        base_share_pct = round((base_high_risk_vol / baseline_allocated_total * 100.0), 1) if baseline_allocated_total > 0 else 0.0

        narrative = (
            f"JalSetu AI concentrates {ai_share_pct}% of scarce water into High/Critical risk fields ({ai_high_risk_vol} m³) "
            f"compared to {base_share_pct}% under the equal-allocation baseline ({base_high_risk_vol} m³). "
            f"Top-stressed fields funded: {top_funded_ai} (AI) vs {top_funded_base} (Equal Share)."
        )

        comparison = BaselineComparison(
            baseline_method="equal_allocation_share",
            total_budget_m3=budget_m3,
            ai_allocated_total_m3=allocated_total,
            baseline_allocated_total_m3=baseline_allocated_total,
            ai_high_risk_allocation_m3=ai_high_risk_vol,
            baseline_high_risk_allocation_m3=base_high_risk_vol,
            ai_high_risk_share_pct=ai_share_pct,
            baseline_high_risk_share_pct=base_share_pct,
            top_stressed_fields_funded_ai=top_funded_ai,
            top_stressed_fields_funded_baseline=top_funded_base,
            narrative=narrative
        )

        unallocated = max(0.0, round(budget_m3 - allocated_total, 1))
        utilization = round((allocated_total / budget_m3 * 100.0), 1) if budget_m3 > 0 else 0.0

        # Hard invariant validation check
        constraint_checks = {
            "budget_conserved": allocated_total <= budget_m3,
            "all_allocations_non_negative": all(a.allocated_volume_m3 >= 0.0 for a in allocations),
            "paused_fields_zero_allocation": all(
                a.allocated_volume_m3 == 0.0 for a in allocations if a.action_recommendation == "protect_pause"
            ),
            "capacities_respected": all(a.allocated_volume_m3 <= a.capacity_limit_m3 for a in allocations)
        }

        as_of_date = fields[0].as_of_date if fields else "2026-10-08"

        return WaterPlanResponse(
            plan_id=str(uuid.uuid4()),
            as_of_date=as_of_date,
            scenario_id=scenario_id,
            is_simulated=(scenario_id != "normal_01"),
            requested_budget_m3=budget_m3,
            total_allocated_m3=allocated_total,
            unallocated_remainder_m3=unallocated,
            budget_utilization_pct=utilization,
            constraint_checks=constraint_checks,
            allocations=allocations,
            baseline_comparison=comparison
        )


allocator = WaterAllocationEngine()

