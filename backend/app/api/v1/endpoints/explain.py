from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import PredictionModel
from app.services.data_loader import data_loader
from app.services.stress_engine import stress_engine
from app.schemas.assessment import FieldAssessmentResponse

router = APIRouter()


@router.get("/{field_or_prediction_id}", response_model=FieldAssessmentResponse, tags=["Explainability"])
def explain_field_or_prediction(
    field_or_prediction_id: str,
    scenario_id: Optional[str] = Query(None, description="Optional scenario ID override"),
    db: Session = Depends(get_db)
):
    """
    Retrieve structured explainability details for a field (or prediction ID),
    including signal contributions, data freshness indicators, policy rules, and warnings.
    """
    # 1. Check if identifier is a field ID (PC-001 .. PC-010)
    fields_fc = data_loader.load_fields()
    target_feat = next((f for f in fields_fc.features if f.properties.id == field_or_prediction_id), None)

    # 2. If not found by field ID, check database predictions table by UUID
    if not target_feat:
        pred = db.query(PredictionModel).filter(PredictionModel.prediction_id == field_or_prediction_id).first()
        if pred:
            target_feat = next((f for f in fields_fc.features if f.properties.id == pred.field_id), None)

    if not target_feat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Field or prediction '{field_or_prediction_id}' was not found."
        )

    all_obs = data_loader.load_observations()
    field_obs = [o for o in all_obs if o.field_id == target_feat.properties.id]

    return stress_engine.assess_field(
        field=target_feat,
        observations=field_obs,
        scenario_id_override=scenario_id
    )

