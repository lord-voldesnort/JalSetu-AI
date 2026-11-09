"""
Explainability Router for JalSetu AI.

Provides GET /explain/{field_id} and GET /api/v1/explain/{field_id}.
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from app.schemas.explain import ExplainResponse
from app.services.explain_service import compute_field_explanation
from app.services.optimizer_service import SUPPORTED_SCENARIOS

router = APIRouter(tags=["explain"])


@router.get("/explain/{field_id}", response_model=ExplainResponse)
@router.get("/api/v1/explain/{field_id}", response_model=ExplainResponse, include_in_schema=False)
def explain_field_endpoint(
    field_id: str,
    scenario_id: Optional[str] = Query(None, description="Optional scenario preset ID"),
    horizon: Optional[int] = Query(7, ge=1, le=14, description="Forecast horizon in days"),
) -> ExplainResponse:
    """
    Retrieve feature attribution explainability and farmer-facing Why card for a specific field.
    Reuses stress forecasting and scenario simulation drivers.
    """
    if scenario_id and scenario_id not in SUPPORTED_SCENARIOS:
        raise HTTPException(
            status_code=404,
            detail=f"Scenario '{scenario_id}' not found. Supported presets: {list(SUPPORTED_SCENARIOS.keys())}"
        )

    explanation = compute_field_explanation(field_id=field_id, scenario_id=scenario_id, horizon_days=horizon)
    if not explanation:
        raise HTTPException(
            status_code=404,
            detail=f"Field '{field_id}' not found"
        )
    return explanation

