"""
Constrained Water Allocation Optimizer Service for JalSetu AI.

Implements a deterministic, bounded water allocation engine that optimizes
irrigation delivery across demonstration fields under strict cluster budget limits.

Objective:
    Maximize total weighted priority under linear continuous relaxation:
        max sum(priority_score_i * allocation_i)
    Subject to:
        sum(allocation_i) <= budget
        min_allocation_i <= allocation_i <= effective_cap_i
        allocation_i == 0 for excluded or paused fields
        allocation_i == 0 for un-overridden inspect fields (data quality gate)
"""

from decimal import Decimal, ROUND_DOWN
import math
from typing import Any, Dict, List, Optional, Tuple
from app.data.fixtures import DEMO_FIELDS_RAW, DEMO_STATUS_RAW
from app.schemas.water_plan import (
    BaselineComparisonSummary,
    FieldConstraintOverride,
    WaterPlanItem,
    WaterPlanRequest,
    WaterPlanResponse,
)
from app.schemas.scenario import ScenarioReplayRequest
from app.services.forecast_service import (
    STAGE_SENSITIVITY_WEIGHTS,
    MODEL_VERSION,
    DATA_TYPE,
    compute_field_forecast,
)
from app.services.scenario_service import compute_scenario_replay

# Documented Crop Water Demand Norms (m³ per acre for 7-day period)
BASE_CROP_WATER_DEMAND_M3_PER_ACRE: Dict[str, float] = {
    "Tomato": 18.0,
    "Eggplant": 15.0,
    "Onion": 14.0,
    "Chili": 16.0,
    "Capsicum": 17.0,
    "Cucumber": 15.0,
    "Cabbage": 14.0,
}

# Phenological Stage Multipliers for Evapotranspirative Demand
STAGE_DEMAND_MULTIPLIERS: Dict[str, float] = {
    "Flowering": 1.25,
    "Fruiting": 1.20,
    "Bulb Development": 1.15,
    "Head Formation": 1.10,
    "Vegetative": 1.00,
    "Sowing": 0.60,
    "Harvesting": 0.30,
}

# Documented Named Priority Weights
WEIGHT_STRESS: float = 1.0
WEIGHT_STAGE: float = 1.0
WEIGHT_RISK_HIGH: float = 0.08
WEIGHT_RISK_MODERATE: float = 0.03
WEIGHT_SHOCK_ACTIVE: float = 0.04
PENALTY_DATA_STALE: float = -0.12

# Supported Scenario Presets
SUPPORTED_SCENARIOS: Dict[str, Dict[str, Any]] = {
    "baseline": {},
    "normal_01": {},
    "rainfall_deficit_heat_01": {
        "rainfall_multiplier": 0.0,
        "temperature_delta_c": 4.0,
        "heat_wave_intensity": "moderate",
    },
    "heat_wave_01": {
        "temperature_delta_c": 4.0,
        "heat_wave_intensity": "moderate",
    },
    "rainfall_deficit_01": {
        "rainfall_multiplier": 0.0,
    },
    "intense_rain_01": {
        "delta_rainfall_mm": 40.0,
    },
}


def compute_field_demand(crop: str, stage: str, area_acres: float, stress_probability: float) -> float:
    """
    Compute estimated 7-day crop irrigation demand in cubic meters (m³) or units.
    Label: Estimated Demand (agronomic heuristic, not measured meter requirement).
    """
    base_demand = BASE_CROP_WATER_DEMAND_M3_PER_ACRE.get(crop, 16.0)
    stage_mult = STAGE_DEMAND_MULTIPLIERS.get(stage, 1.0)
    stress_mult = 0.90 + 0.20 * stress_probability
    raw_demand = area_acres * base_demand * stage_mult * stress_mult
    return round(max(0.0, raw_demand), 2)


def compute_priority_score(
    stress_probability: float,
    stage: str,
    risk_state: str,
    is_shock: bool = False,
    is_stale: bool = False,
) -> Tuple[float, Dict[str, float]]:
    """
    Compute transparent priority score and return breakdown of its components.
    Guaranteed: Freshness penalty never raises priority score for stale observations.
    """
    comp_stress = round(WEIGHT_STRESS * stress_probability, 3)
    comp_stage = round(WEIGHT_STAGE * STAGE_SENSITIVITY_WEIGHTS.get(stage, 0.0), 3)
    comp_risk = (
        WEIGHT_RISK_HIGH
        if risk_state == "HIGH"
        else (WEIGHT_RISK_MODERATE if risk_state == "MODERATE" else 0.0)
    )
    comp_shock = WEIGHT_SHOCK_ACTIVE if is_shock else 0.0
    comp_freshness = PENALTY_DATA_STALE if is_stale else 0.0

    raw_score = comp_stress + comp_stage + comp_risk + comp_shock + comp_freshness
    bounded_score = round(min(1.0, max(0.05, raw_score)), 3)

    components = {
        "stress_contribution": comp_stress,
        "stage_sensitivity": comp_stage,
        "risk_state_bonus": comp_risk,
        "shock_bonus": comp_shock,
        "freshness_penalty": comp_freshness,
    }
    return bounded_score, components


def derive_field_action(
    risk_state: str,
    stress_probability: float,
    is_paused: bool,
    is_stale: bool,
    is_excluded: bool,
    has_override_allocation: bool,
) -> Tuple[str, str]:
    """
    Determine single canonical recommended_action in {'irrigate', 'wait', 'inspect', 'pause'}.
    Shared logic across water-plan and explainability endpoints.
    """
    if is_excluded:
        return "wait", "Field excluded from allocation by manager constraint override"
    if is_paused:
        return "pause", "Irrigation paused due to heavy precipitation / waterlogging watch"
    if is_stale:
        if has_override_allocation:
            return "inspect", "Inspect before irrigating: satellite or weather telemetry is stale/missing; manager override authorized allocation"
        return "inspect", "Inspect before irrigating: satellite or weather telemetry is stale/missing; confidence reduced"
    if risk_state in ("HIGH", "MODERATE") or stress_probability >= 0.35:
        return "irrigate", "Irrigate to relieve crop moisture deficit"
    return "wait", "Wait: soil moisture reserves currently buffer crop water demand"


def compute_water_allocation_plan(request: WaterPlanRequest) -> Optional[WaterPlanResponse]:
    """
    Compute a deterministic, constrained water allocation plan across requested fields.
    Returns None if any field_id or scenario_id is unknown/unrecognized.
    """
    # 1. Validate fields
    all_fields_map = {f["id"]: f for f in DEMO_FIELDS_RAW}
    if request.field_ids:
        for fid in request.field_ids:
            if fid not in all_fields_map:
                return None
        target_ids = list(request.field_ids)
    else:
        target_ids = [f["id"] for f in DEMO_FIELDS_RAW]

    # 2. Validate scenario_id
    scenario_id = request.scenario_id
    scenario_params = None
    if scenario_id:
        if scenario_id not in SUPPORTED_SCENARIOS:
            return None
        scenario_params = SUPPORTED_SCENARIOS[scenario_id]

    # Map overrides
    override_map: Dict[str, FieldConstraintOverride] = {}
    if request.constraints:
        for c in request.constraints:
            if c.field_id in all_fields_map:
                override_map[c.field_id] = c

    budget = float(request.budget_m3 if request.budget_m3 is not None else request.budget_units)
    is_integer_budget = budget.is_integer()
    method = request.method or "ai_priority"

    # 3. Gather field forecasts and determine demand, actions, and limits
    field_records = []
    total_demand = 0.0
    fresh_signals_count = 0
    stale_signals_count = 0
    missing_signals_count = 0
    suspect_signals_count = 0

    for fid in target_ids:
        field = all_fields_map[fid]
        crop = field.get("crop", "Vegetables")
        stage = field.get("stage", "Vegetative")
        acres = float(field.get("area_acres", 1.0))

        # Evaluate forecast under scenario or baseline
        if scenario_params and scenario_id not in ("baseline", "normal_01"):
            scen_req = ScenarioReplayRequest(
                field_id=fid,
                scenario_name=scenario_id,
                rainfall_multiplier=scenario_params.get("rainfall_multiplier"),
                delta_rainfall_mm=scenario_params.get("delta_rainfall_mm"),
                temperature_delta_c=scenario_params.get("temperature_delta_c"),
                heat_wave_intensity=scenario_params.get("heat_wave_intensity"),
                horizon_days=request.horizon_days or 7,
            )
            scen_resp = compute_scenario_replay(scen_req)
            if not scen_resp:
                return None
            forecast = scen_resp.scenario_forecast
        else:
            forecast = compute_field_forecast(fid)
            if not forecast:
                return None

        stress_prob = forecast.stress_probability
        risk_state = forecast.risk_state

        # Signal quality check
        status_raw = DEMO_STATUS_RAW.get(fid, {})
        freshness_raw = status_raw.get("freshness", {})
        weather_fresh = freshness_raw.get("weather", {})
        sat_fresh = freshness_raw.get("satellite", {})

        is_stale = bool(
            weather_fresh.get("stale", False)
            or sat_fresh.get("stale", False)
            or sat_fresh.get("quality_flag") in ("STALE", "MISSING")
            or weather_fresh.get("quality_flag") == "STALE"
            or forecast.confidence < 0.60
        )

        for sig in ("weather", "satellite", "soil"):
            q_flag = freshness_raw.get(sig, {}).get("quality_flag", "GOOD")
            if q_flag == "GOOD":
                fresh_signals_count += 1
            elif q_flag == "STALE":
                stale_signals_count += 1
            elif q_flag == "SUSPECT":
                suspect_signals_count += 1
            elif q_flag == "MISSING":
                missing_signals_count += 1

        # Check for pause condition (heavy recent or simulated rainfall >= 35 mm)
        rain_obs = next((o for o in status_raw.get("observations", []) if o.get("variable") == "rainfall_mm"), None)
        rain_val = float(rain_obs.get("value", 0.0)) if (rain_obs and rain_obs.get("value") is not None) else 0.0
        if scenario_params and scenario_params.get("delta_rainfall_mm"):
            rain_val += float(scenario_params["delta_rainfall_mm"])
        is_paused = rain_val >= 35.0

        # Demand estimation
        demand = compute_field_demand(crop, stage, acres, stress_prob)
        total_demand += demand

        # Constraints
        override = override_map.get(fid)
        is_excluded = bool(override and override.exclude)
        has_min_override = bool(override and override.min_allocation_m3 is not None and override.min_allocation_m3 > 0)

        # Action derivation
        action, action_reason = derive_field_action(
            risk_state=risk_state,
            stress_probability=stress_prob,
            is_paused=is_paused,
            is_stale=is_stale,
            is_excluded=is_excluded,
            has_override_allocation=has_min_override,
        )

        # Cap determination: paused, excluded, or inspect fields have cap = 0 unless overridden
        effective_cap = demand
        if override and override.max_allocation_m3 is not None:
            effective_cap = min(effective_cap, override.max_allocation_m3)
        if is_excluded or is_paused:
            effective_cap = 0.0
        elif action == "inspect" and not has_min_override:
            effective_cap = 0.0

        min_alloc = 0.0
        if has_min_override and not is_excluded:
            min_alloc = min(effective_cap, override.min_allocation_m3)

        is_shock = bool(scenario_params and (scenario_params.get("temperature_delta_c") or scenario_params.get("heat_wave_intensity")))
        priority_score, priority_components = compute_priority_score(
            stress_probability=stress_prob,
            stage=stage,
            risk_state=risk_state,
            is_shock=is_shock,
            is_stale=is_stale,
        )

        field_records.append({
            "field_id": fid,
            "field_name": field.get("name", f"Field {fid}"),
            "crop": crop,
            "stage": stage,
            "area_acres": acres,
            "forecast": forecast,
            "stress_probability": stress_prob,
            "risk_state": risk_state,
            "priority_score": priority_score,
            "priority_components": priority_components,
            "demand_m3": demand,
            "min_alloc": min_alloc,
            "effective_cap": effective_cap,
            "action": action,
            "action_reason": action_reason,
            "has_min_override": has_min_override,
            "is_excluded": is_excluded,
            "is_paused": is_paused,
            "is_stale": is_stale,
            "confidence": forecast.confidence,
        })

    total_demand = round(total_demand, 2)
    budget = round(max(0.0, budget), 2)

    # 4. Infeasibility check: if sum of minimum allocations > budget
    total_min = sum(f["min_alloc"] for f in field_records)
    if total_min > budget + 0.001:
        return WaterPlanResponse(
            plan_id=f"plan-pc-{int(budget)}u-infeasible",
            as_of="2026-10-08T00:00:00Z",
            budget_m3=budget,
            budget_units=budget,
            total_demand_m3=total_demand,
            total_estimated_demand=total_demand,
            total_allocated_m3=0.0,
            allocated_units=0.0,
            total_allocated_units=0.0,
            remaining_budget_m3=budget,
            remaining_budget=budget,
            constraint_status="infeasible",
            scenario_id=scenario_id,
            method=method,
            items=[],
            rows=[],
            unmet_demand_fields=[f["field_id"] for f in field_records],
            unfunded_fields=[f["field_id"] for f in field_records],
            excluded_fields=[f["field_id"] for f in field_records if f["is_excluded"]],
            paused_fields=[f["field_id"] for f in field_records if f["is_paused"]],
            inspect_fields=[f["field_id"] for f in field_records if f["action"] == "inspect"],
            data_quality_summary={
                "fresh": fresh_signals_count,
                "stale": stale_signals_count,
                "missing": missing_signals_count,
                "suspect": suspect_signals_count,
            },
            model_version=MODEL_VERSION,
            data_type=DATA_TYPE,
            planning_disclaimer=(
                f"Infeasible constraint: configured minimum allocations sum to {total_min:.1f} m³, "
                f"which exceeds the available budget of {budget:.1f} m³."
            ),
        )

    # 5. Allocation algorithms
    allocations: Dict[str, float] = {f["field_id"]: 0.0 for f in field_records}

    if budget > 0.0:
        # Reserve minimums first
        for f in field_records:
            if f["min_alloc"] > 0:
                allocations[f["field_id"]] = f["min_alloc"]

        remaining_budget = max(0.0, budget - sum(allocations.values()))

        eligible_fields = [
            f for f in field_records
            if f["effective_cap"] > allocations[f["field_id"]]
        ]

        if remaining_budget > 0.001 and eligible_fields:
            if method == "equal_share":
                # Water-filling equal split among eligible uncapped fields
                active = list(eligible_fields)
                while active and remaining_budget > 0.001:
                    per_field_share = remaining_budget / len(active)
                    hit_cap = False
                    for f in list(active):
                        current = allocations[f["field_id"]]
                        cap = f["effective_cap"]
                        grant = min(per_field_share, cap - current)
                        allocations[f["field_id"]] += grant
                        remaining_budget -= grant
                        if allocations[f["field_id"]] >= cap - 0.001:
                            active.remove(f)
                            hit_cap = True
                    if not hit_cap:
                        break

            elif method == "proportional":
                # Split proportional to remaining demand / effective cap
                active = list(eligible_fields)
                while active and remaining_budget > 0.001:
                    sum_headroom = sum(f["effective_cap"] - allocations[f["field_id"]] for f in active)
                    if sum_headroom <= 0.001:
                        break
                    scale = min(1.0, remaining_budget / sum_headroom)
                    hit_cap = False
                    for f in list(active):
                        headroom = f["effective_cap"] - allocations[f["field_id"]]
                        grant = min(headroom, headroom * scale)
                        allocations[f["field_id"]] += grant
                        remaining_budget -= grant
                        if allocations[f["field_id"]] >= f["effective_cap"] - 0.001:
                            active.remove(f)
                            hit_cap = True
                    if not hit_cap or scale >= 1.0:
                        break

            else:
                # ai_priority: Fractional Continuous Knapsack / Greedy Water-Filling by Rank
                # Provably optimal for linear objective max sum(priority_i * x_i)
                sorted_by_priority = sorted(
                    eligible_fields,
                    key=lambda f: (f["priority_score"], f["stress_probability"], -f["area_acres"], f["field_id"]),
                    reverse=True,
                )
                for f in sorted_by_priority:
                    if remaining_budget <= 0.001:
                        break
                    headroom = f["effective_cap"] - allocations[f["field_id"]]
                    grant = min(headroom, remaining_budget)
                    allocations[f["field_id"]] += grant
                    remaining_budget -= grant

    # 6. Integer exactness & Downward rounding enforcement
    if is_integer_budget and all(f["demand_m3"].is_integer() or is_integer_budget for f in field_records):
        # Apply Largest-Remainder Integer Method to guarantee exact integer units summing to <= budget
        int_allocs = {fid: int(math.floor(val)) for fid, val in allocations.items()}
        current_sum = sum(int_allocs.values())
        remainder_units = int(budget) - current_sum

        remainders = []
        for f in field_records:
            fid = f["field_id"]
            frac = allocations[fid] - int_allocs[fid]
            room = int(math.floor(f["effective_cap"])) - int_allocs[fid]
            if room > 0:
                remainders.append((frac, f["priority_score"], fid))
        remainders.sort(key=lambda x: (x[0], x[1]), reverse=True)

        for frac, prio, fid in remainders:
            if remainder_units <= 0:
                break
            int_allocs[fid] += 1
            remainder_units -= 1

        allocations = {fid: float(val) for fid, val in int_allocs.items()}
    else:
        # Continuous mode: Truncate / round down to 2 decimal places to strictly prevent overflow
        allocations = {
            fid: float(Decimal(str(val)).quantize(Decimal("0.01"), rounding=ROUND_DOWN))
            for fid, val in allocations.items()
        }

    # Strict defensive clamp: sum(allocations) <= budget
    total_alloc = round(sum(allocations.values()), 2)
    if total_alloc > budget:
        excess = round(total_alloc - budget, 2)
        for fid in reversed(target_ids):
            if allocations[fid] > 0:
                shave = min(allocations[fid], excess)
                allocations[fid] = round(allocations[fid] - shave, 2)
                excess = round(excess - shave, 2)
                if excess <= 0:
                    break
        total_alloc = round(sum(allocations.values()), 2)

    remaining_budget = max(0.0, round(budget - total_alloc, 2))

    # 7. Rank items and compile reasons
    ranked_field_records = sorted(
        field_records,
        key=lambda f: (f["priority_score"], f["stress_probability"], f["field_id"]),
        reverse=True,
    )

    items: List[WaterPlanItem] = []
    unmet_demand_fields: List[str] = []
    unfunded_fields: List[str] = []
    excluded_fields: List[str] = []
    paused_fields: List[str] = []
    inspect_fields: List[str] = []

    for rank, f in enumerate(ranked_field_records, start=1):
        fid = f["field_id"]
        alloc = allocations[fid]
        demand = f["demand_m3"]
        unmet = max(0.0, round(demand - alloc, 2))
        is_funded = alloc > 0.0

        if unmet > 0.0:
            unmet_demand_fields.append(fid)
        if alloc == 0.0:
            unfunded_fields.append(fid)
        if f["is_excluded"]:
            excluded_fields.append(fid)
        if f["is_paused"]:
            paused_fields.append(fid)
        if f["action"] == "inspect":
            inspect_fields.append(fid)

        # Unfunded reason
        if f["is_excluded"]:
            unfunded_reason = "excluded"
        elif f["is_paused"]:
            unfunded_reason = "paused"
        elif f["action"] == "inspect" and alloc == 0.0:
            unfunded_reason = "data_stale_inspect"
        elif unmet == 0.0:
            unfunded_reason = None
        elif budget == 0.0:
            unfunded_reason = "budget_exhausted"
        elif alloc == 0.0 and f["risk_state"] == "LOW":
            unfunded_reason = "low_stress"
        elif alloc < demand:
            unfunded_reason = "budget_exhausted"
        else:
            unfunded_reason = None

        reasons = [f["action_reason"]]
        if f.get("has_min_override"):
            reasons.append("Manager constraint override authorized allocation despite inspect/stale data status")
        if f["stage"] in ("Flowering", "Fruiting", "Bulb Development"):
            reasons.append(f"{f['crop']} in critical {f['stage']} stage has elevated vulnerability to moisture deficit")
        if is_funded:
            pct_met = round(alloc / demand * 100.0) if demand > 0 else 100
            reasons.append(f"Allocated {alloc:.1f} units ({pct_met}% of estimated {demand:.1f} units demand)")
        elif unfunded_reason == "budget_exhausted":
            reasons.append(f"Unfunded (0 units) due to budget exhaustion under {budget:.0f}-unit constraint")

        item = WaterPlanItem(
            rank=rank,
            field_id=fid,
            field_name=f["field_name"],
            crop=f["crop"],
            stage=f["stage"],
            area_acres=f["area_acres"],
            stress_probability=f["stress_probability"],
            risk_state=f["risk_state"],
            priority_score=f["priority_score"],
            priority=f["priority_score"],
            demand_m3=demand,
            estimated_demand=demand,
            allocated_m3=alloc,
            allocated_units=alloc,
            unmet_demand_m3=unmet,
            unmet_demand=unmet,
            action=f["action"],
            recommended_action=f["action"],
            allocation_reasons=reasons,
            reason=reasons,
            unfunded_reason=unfunded_reason,
            is_funded=is_funded,
            is_stale=f["is_stale"],
            is_excluded=f["is_excluded"],
            is_paused=f["is_paused"],
            confidence=f["confidence"],
            priority_components=f["priority_components"],
        )
        items.append(item)

    # 8. Compute Baseline Comparison Summary
    red_amber_fields = [f for f in field_records if f["risk_state"] in ("HIGH", "MODERATE")]
    ai_red_amber_alloc = sum(allocations[f["field_id"]] for f in red_amber_fields)
    ai_share_pct = round(ai_red_amber_alloc / total_alloc * 100.0, 1) if total_alloc > 0 else 0.0

    # Top-k at-risk demand coverage under AI
    top_k_demand = sum(f["demand_m3"] for f in red_amber_fields)
    ai_top_k_cov = round(ai_red_amber_alloc / top_k_demand * 100.0, 1) if top_k_demand > 0 else 0.0

    # Compute theoretical equal_share on same budget and fields
    eligible_for_equal = [f for f in field_records if not f["is_excluded"] and not f["is_paused"]]
    eq_count = len(eligible_for_equal)
    eq_red_count = len([f for f in eligible_for_equal if f["risk_state"] in ("HIGH", "MODERATE")])
    eq_share_pct = round(eq_red_count / eq_count * 100.0, 1) if eq_count > 0 else 0.0
    eq_red_alloc = (budget / eq_count * eq_red_count) if eq_count > 0 else 0.0
    base_top_k_cov = round(min(100.0, eq_red_alloc / top_k_demand * 100.0), 1) if top_k_demand > 0 else 0.0

    baseline_comparison = BaselineComparisonSummary(
        method="equal_share",
        share_to_high_risk_pct=eq_share_pct,
        ai_share_to_high_risk_pct=ai_share_pct,
        top_k_at_risk_coverage_pct=ai_top_k_cov,
        baseline_top_k_coverage_pct=base_top_k_cov,
        comparison_note=(
            f"Scenario evaluation only — AI prioritization directs {ai_share_pct}% of scarce water "
            f"to moisture-vulnerable plots vs {eq_share_pct}% under uniform equal allocation. "
            f"Not measured field water savings."
        ),
    )

    as_of = "2026-10-08T00:00:00Z"

    return WaterPlanResponse(
        plan_id=f"plan-pc-{int(budget)}u",
        as_of=as_of,
        budget_m3=budget,
        budget_units=budget,
        total_demand_m3=total_demand,
        total_estimated_demand=total_demand,
        total_allocated_m3=total_alloc,
        allocated_units=total_alloc,
        total_allocated_units=total_alloc,
        remaining_budget_m3=remaining_budget,
        remaining_budget=remaining_budget,
        constraint_status="valid",
        scenario_id=scenario_id,
        method=method,
        solver="deterministic_constrained_knapsack_v0.1",
        items=items,
        rows=items,
        unmet_demand_fields=unmet_demand_fields,
        unfunded_fields=unfunded_fields,
        excluded_fields=excluded_fields,
        paused_fields=paused_fields,
        inspect_fields=inspect_fields,
        data_quality_summary={
            "fresh": fresh_signals_count,
            "stale": stale_signals_count,
            "missing": missing_signals_count,
            "suspect": suspect_signals_count,
        },
        baseline_comparison=baseline_comparison,
        model_version=MODEL_VERSION,
        optimizer_version="optimizer-greedy-knapsack-v0.1",
        data_type=DATA_TYPE,
    )
