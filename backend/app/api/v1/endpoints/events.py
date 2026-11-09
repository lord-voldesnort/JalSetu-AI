import datetime
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import ActionLogModel, FieldModel, ObservationModel
from app.services.data_loader import data_loader
from app.services.stress_engine import stress_engine
from app.services.scenario_mgr import scenario_manager
from app.schemas.event import ActionEventRequest, ActionEventResponse, SystemMetricsResponse

router = APIRouter()


@router.post("", response_model=ActionEventResponse, status_code=status.HTTP_201_CREATED, tags=["Events & Audit"])
def record_action_event(
    payload: ActionEventRequest,
    db: Session = Depends(get_db)
):
    """
    Record an agronomic action event or manual recommendation override.
    Enforces that override_reason is mandatory when followed_recommendation is False.
    """
    # 1. Validation: Field existence
    fields_fc = data_loader.load_fields()
    target_feat = next((f for f in fields_fc.features if f.properties.id == payload.field_id), None)
    if not target_feat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Field '{payload.field_id}' does not exist in registry."
        )

    # 2. Validation: Mandatory override reason
    if not payload.followed_recommendation:
        if not payload.override_reason or not payload.override_reason.strip():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="An override reason is mandatory when deviating from the recommended action."
            )

    # 3. Determine recommended action
    all_obs = data_loader.load_observations()
    field_obs = [o for o in all_obs if o.field_id == payload.field_id]
    assessment = stress_engine.assess_field(target_feat, field_obs)

    event_id = str(uuid.uuid4())
    now = datetime.datetime.now(datetime.timezone.utc)

    # 4. Save to database
    db_event = ActionLogModel(
        event_id=event_id,
        field_id=payload.field_id,
        timestamp=now,
        recommended_action=assessment.recommended_action,
        action_taken=payload.action_taken,
        followed_recommendation=payload.followed_recommendation,
        override_reason=payload.override_reason.strip() if payload.override_reason else None,
        planned_volume_m3=payload.planned_volume_m3 if payload.planned_volume_m3 is not None else assessment.recommended_volume_m3,
        actual_volume_m3=payload.actual_volume_m3,
        user_role=payload.user_role,
        notes=payload.notes
    )
    db.add(db_event)
    db.commit()
    db.refresh(db_event)

    return ActionEventResponse(
        event_id=event_id,
        field_id=payload.field_id,
        timestamp=now.isoformat(),
        recommended_action=assessment.recommended_action,
        action_taken=payload.action_taken,
        followed_recommendation=payload.followed_recommendation,
        override_reason=payload.override_reason,
        planned_volume_m3=payload.planned_volume_m3,
        actual_volume_m3=payload.actual_volume_m3,
        user_role=payload.user_role,
        status="recorded"
    )


@router.get("", response_model=List[ActionEventResponse], tags=["Events & Audit"])
def list_action_events(
    field_id: Optional[str] = Query(None, description="Filter by field ID"),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Retrieve chronological audit trail of logged action events and overrides."""
    query = db.query(ActionLogModel)
    if field_id:
        query = query.filter(ActionLogModel.field_id == field_id)

    events = query.order_by(ActionLogModel.timestamp.desc()).limit(limit).all()
    return [
        ActionEventResponse(
            event_id=e.event_id,
            field_id=e.field_id,
            timestamp=e.timestamp.isoformat(),
            recommended_action=e.recommended_action,
            action_taken=e.action_taken,
            followed_recommendation=e.followed_recommendation,
            override_reason=e.override_reason,
            planned_volume_m3=e.planned_volume_m3,
            actual_volume_m3=e.actual_volume_m3,
            user_role=e.user_role,
            status="recorded"
        )
        for e in events
    ]


@router.get("/metrics", response_model=SystemMetricsResponse, tags=["Events & Audit"])
def get_system_metrics(db: Session = Depends(get_db)):
    """Compute live operational statistics and audit metrics from actual database records."""
    total_fields = db.query(FieldModel).count()
    if total_fields == 0:
        total_fields = len(data_loader.load_fields().features)

    total_obs = db.query(ObservationModel).count()
    if total_obs == 0:
        total_obs = len(data_loader.load_observations())

    events = db.query(ActionLogModel).all()
    total_events = len(events)
    overrides = [e for e in events if not e.followed_recommendation]
    overrides_count = len(overrides)

    adherence_pct = 100.0
    if total_events > 0:
        adherence_pct = round(((total_events - overrides_count) / total_events) * 100.0, 1)

    reasons_breakdown: dict = {}
    for ov in overrides:
        if ov.override_reason:
            reasons_breakdown[ov.override_reason] = reasons_breakdown.get(ov.override_reason, 0) + 1

    # Current risk status distribution under active scenario
    cluster_summary = stress_engine.assess_cluster()

    return SystemMetricsResponse(
        total_fields=total_fields,
        total_observations=total_obs,
        total_events_logged=total_events,
        overrides_logged=overrides_count,
        adherence_rate_pct=adherence_pct,
        override_reasons_breakdown=reasons_breakdown,
        risk_distribution=cluster_summary.counts_by_status,
        active_scenario=scenario_manager.active_scenario_id,
        database_type="sqlite"
    )
