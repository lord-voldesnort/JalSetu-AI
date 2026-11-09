from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import ScenarioModel
from app.schemas.scenario import ScenarioDefinition, ScenarioListResponse
from app.services.data_loader import data_loader

router = APIRouter()


@router.get("", response_model=ScenarioListResponse, tags=["Scenarios"])
def list_scenarios(db: Session = Depends(get_db)):
    """Retrieve all available deterministic climate shock scenarios."""
    scenarios = data_loader.load_scenarios()
    return ScenarioListResponse(
        count=len(scenarios),
        scenarios=scenarios
    )


@router.get("/{scenario_id}", response_model=ScenarioDefinition, tags=["Scenarios"])
def get_scenario(scenario_id: str, db: Session = Depends(get_db)):
    """Retrieve detailed scenario definition and signal perturbation contract."""
    scenarios = data_loader.load_scenarios()
    for s in scenarios:
        if s.id == scenario_id:
            return s
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Scenario '{scenario_id}' was not found."
    )

