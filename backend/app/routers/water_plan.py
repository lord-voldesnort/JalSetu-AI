"""
Water Plan Router for JalSetu AI.

Provides POST /water-plan and POST /api/v1/water-plan endpoints for constrained
water allocation optimization under fixed demonstration budgets.
"""

from fastapi import APIRouter, HTTPException
from app.data.fixtures import DEMO_FIELDS_RAW
from app.schemas.water_plan import WaterPlanRequest, WaterPlanResponse
from app.services.optimizer_service import SUPPORTED_SCENARIOS, compute_water_allocation_plan
from app.services.metrics_service import process_counters

router = APIRouter(tags=["water-plan"])


@router.post("/water-plan", response_model=WaterPlanResponse)
@router.post("/api/v1/water-plan", response_model=WaterPlanResponse, include_in_schema=False)
def create_water_plan_endpoint(request: WaterPlanRequest) -> WaterPlanResponse:
    """
    Generate a deterministic, constrained irrigation priority plan under a fixed water budget.
    Supports AI priority water-filling, equal share baseline, and demand-proportional allocation.
    """
    # Validate field_ids if supplied
    all_known_fields = {f["id"] for f in DEMO_FIELDS_RAW}
    if request.field_ids:
        for fid in request.field_ids:
            if fid not in all_known_fields:
                raise HTTPException(
                    status_code=404,
                    detail=f"Field '{fid}' not found in cluster registry"
                )

    if request.constraints:
        for c in request.constraints:
            if c.field_id not in all_known_fields:
                raise HTTPException(
                    status_code=404,
                    detail=f"Field '{c.field_id}' specified in constraints not found"
                )

    if request.scenario_id and request.scenario_id not in SUPPORTED_SCENARIOS:
        raise HTTPException(
            status_code=404,
            detail=f"Scenario '{request.scenario_id}' not found. Supported presets: {list(SUPPORTED_SCENARIOS.keys())}"
        )

    plan = compute_water_allocation_plan(request)
    if not plan:
        raise HTTPException(
            status_code=404,
            detail="Unable to generate plan for requested fields or scenario"
        )
    process_counters.inc_plan()
    return plan
