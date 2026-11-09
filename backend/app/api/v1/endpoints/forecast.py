from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.forecast import FieldForecastResponse
from app.services.forecast_service import forecast_service

router = APIRouter()


@router.get("/{field_id}", response_model=FieldForecastResponse, tags=["Forecast"])
def get_field_forecast(
    field_id: str,
    horizon_days: int = Query(3, ge=3, le=7, description="Forecast horizon in days (3 to 7)"),
    scenario_id: Optional[str] = Query(None, description="Optional scenario ID override"),
    db: Session = Depends(get_db)
):
    """
    Generate transparent 3-7 day daily risk projection for a specific field
    based on weather forecast temperature, rain, and soil depletion dynamics.
    """
    try:
        return forecast_service.generate_forecast(
            field_id=field_id,
            horizon_days=horizon_days,
            scenario_id_override=scenario_id
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND if "does not exist" in str(e) else status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

