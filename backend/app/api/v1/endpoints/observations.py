from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import ObservationModel
from app.schemas.observation import ObservationRecord, ObservationListResponse
from app.services.data_loader import data_loader

router = APIRouter()


@router.get("", response_model=ObservationListResponse, tags=["Observations"])
def list_observations(
    field_id: Optional[str] = Query(None, description="Filter by field ID (e.g. PC-001)"),
    variable: Optional[str] = Query(None, description="Filter by variable name"),
    db: Session = Depends(get_db)
):
    """Retrieve multi-source observation records."""
    query = db.query(ObservationModel)
    if field_id:
        query = query.filter(ObservationModel.field_id == field_id)
    if variable:
        query = query.filter(ObservationModel.variable == variable)

    db_records = query.all()
    if not db_records:
        # Fallback to direct fixture loading
        all_obs = data_loader.load_observations()
        filtered = all_obs
        if field_id:
            filtered = [o for o in filtered if o.field_id == field_id]
        if variable:
            filtered = [o for o in filtered if o.variable == variable]
        return ObservationListResponse(
            count=len(filtered),
            field_id=field_id,
            observations=filtered
        )

    records = [
        ObservationRecord(
            field_id=r.field_id,
            timestamp=r.timestamp,
            source=r.source,
            variable=r.variable,
            value=r.value,
            unit=r.unit,
            quality_flag=r.quality_flag,
            age_days=r.age_days
        )
        for r in db_records
    ]

    return ObservationListResponse(
        count=len(records),
        field_id=field_id,
        observations=records
    )

