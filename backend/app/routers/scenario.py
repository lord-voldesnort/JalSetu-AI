from fastapi import APIRouter, HTTPException
from app.schemas.scenario import ScenarioReplayRequest, ScenarioReplayResponse
from app.services.scenario_service import compute_scenario_replay
from app.services.metrics_service import process_counters

router = APIRouter(tags=["scenario"])


@router.post("/scenario/replay", response_model=ScenarioReplayResponse)
@router.post("/api/v1/scenario/replay", response_model=ScenarioReplayResponse, include_in_schema=False)
def replay_scenario_endpoint(request: ScenarioReplayRequest) -> ScenarioReplayResponse:
    """
    Evaluate deterministic baseline versus hypothetical scenario shock (rainfall deficit,
    heat wave, irrigation) for a demonstration field.
    Returns baseline forecast, scenario forecast, probability change, changed drivers,
    freshness indicators, and compliance disclaimers.
    """
    replay_result = compute_scenario_replay(request)
    if not replay_result:
        raise HTTPException(
            status_code=404,
            detail=f"Field '{request.field_id}' not found"
        )
    process_counters.inc_scenario()
    return replay_result
