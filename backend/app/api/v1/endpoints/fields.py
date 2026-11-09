import json
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import FieldModel
from app.schemas.field import FieldFeatureCollection, FieldFeature, FieldProperties, GeoJSONPolygon
from app.schemas.assessment import FieldAssessmentResponse, ClusterAssessmentSummary
from app.services.data_loader import data_loader
from app.services.stress_engine import stress_engine
from app.services.scenario_mgr import scenario_manager

router = APIRouter()


@router.get("", response_model=FieldFeatureCollection, tags=["Fields"])
def list_fields(
    scenario_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Return all demonstration fields as a standardized GeoJSON FeatureCollection
    enriched with active stress score, status (green/amber/red/blue), and action.
    """
    fields_fc = data_loader.load_fields()
    cluster_assessment = stress_engine.assess_cluster(scenario_id_override=scenario_id)
    assessment_map = {a.field_id: a for a in cluster_assessment.fields}

    features = []
    for feat in fields_fc.features:
        fid = feat.properties.id
        ass = assessment_map.get(fid)
        features.append(
            FieldFeature(
                type="Feature",
                id=fid,
                properties=FieldProperties(
                    id=fid,
                    name=feat.properties.name,
                    crop=feat.properties.crop,
                    stage=feat.properties.stage,
                    area_acres=feat.properties.area_acres,
                    area_ha=feat.properties.area_ha,
                    stress_status=ass.stress_status if ass else "green",
                    stress_probability=ass.stress_index if ass else 0.0,
                    recommended_action=ass.recommended_action if ass else "wait"
                ),
                geometry=feat.geometry
            )
        )

    return FieldFeatureCollection(type="FeatureCollection", features=features)


@router.get("/{field_id}", response_model=FieldFeature, tags=["Fields"])
def get_field(
    field_id: str,
    scenario_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Retrieve details and geometry for a specific field ID (e.g. PC-001)."""
    fields_fc = data_loader.load_fields()
    target_feat = next((f for f in fields_fc.features if f.properties.id == field_id), None)
    if not target_feat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Field '{field_id}' was not found in the field registry."
        )

    all_obs = data_loader.load_observations()
    field_obs = [o for o in all_obs if o.field_id == field_id]
    ass = stress_engine.assess_field(
        field=target_feat,
        observations=field_obs,
        scenario_id_override=scenario_id
    )

    return FieldFeature(
        type="Feature",
        id=field_id,
        properties=FieldProperties(
            id=field_id,
            name=target_feat.properties.name,
            crop=target_feat.properties.crop,
            stage=target_feat.properties.stage,
            area_acres=target_feat.properties.area_acres,
            area_ha=target_feat.properties.area_ha,
            stress_status=ass.stress_status,
            stress_probability=ass.stress_index,
            recommended_action=ass.recommended_action
        ),
        geometry=target_feat.geometry
    )


@router.get("/{field_id}/status", response_model=FieldAssessmentResponse, tags=["Fields"])
def get_field_status(
    field_id: str,
    scenario_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Retrieve full water-stress risk assessment, signal contributions,
    data freshness table, and actionable recommendations for a field.
    """
    fields_fc = data_loader.load_fields()
    target_feat = next((f for f in fields_fc.features if f.properties.id == field_id), None)
    if not target_feat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Field '{field_id}' was not found in the field registry."
        )

    all_obs = data_loader.load_observations()
    field_obs = [o for o in all_obs if o.field_id == field_id]
    return stress_engine.assess_field(
        field=target_feat,
        observations=field_obs,
        scenario_id_override=scenario_id
    )
