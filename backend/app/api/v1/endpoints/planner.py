import json
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import WaterPlanModel
from app.services.allocator import allocator
from app.schemas.plan import WaterPlanRequest, WaterPlanResponse

router = APIRouter()


@router.post("", response_model=WaterPlanResponse, tags=["Planner"])
def generate_water_plan(
    payload: WaterPlanRequest,
    db: Session = Depends(get_db)
):
    """
    Generate an optimized, constrained water allocation plan strictly conserving the budget.
    Ranks fields by multi-factor priority score and includes equal-allocation baseline comparison.
    """
    if payload.budget < 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Water budget must be non-negative (>= 0 m³)."
        )

    try:
        plan = allocator.optimize_plan(
            budget_m3=payload.budget,
            scenario_id_override=payload.scenario_id,
            planning_window_days=payload.planning_window_days,
            method=payload.method
        )

        # Persist plan to database
        db_plan = WaterPlanModel(
            plan_id=plan.plan_id,
            as_of_date=payload.planning_window_days, # or current date
            total_budget=plan.requested_budget_m3,
            total_allocated=plan.total_allocated_m3,
            plan_method=payload.method,
            scenario_id=plan.scenario_id,
            allocations_json=json.dumps([a.model_dump() for a in plan.allocations])
        )
        # We handle timestamp/date in DB
        import datetime
        db_plan.as_of_date = datetime.datetime.now(datetime.timezone.utc)
        db.add(db_plan)
        db.commit()

        return plan
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )


@router.get("", response_model=WaterPlanResponse, tags=["Planner"])
def get_water_plan(
    budget: float = Query(100.0, ge=0.0, description="Available cluster water budget in m³"),
    scenario_id: Optional[str] = Query(None, description="Optional scenario ID override"),
    planning_window_days: int = Query(7, ge=1, le=14),
    method: str = Query("ai", description="Allocation method: 'ai' or 'fixed_equal'"),
    db: Session = Depends(get_db)
):
    """Query parameter version of water plan generator for easy browser and dashboard access."""
    return generate_water_plan(
        payload=WaterPlanRequest(
            budget=budget,
            scenario_id=scenario_id,
            planning_window_days=planning_window_days,
            method=method
        ),
        db=db
    )
