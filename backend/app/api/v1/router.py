from fastapi import APIRouter
from app.api.v1.endpoints import (
    health,
    fields,
    observations,
    scenario_replay,
    forecast,
    planner,
    explain,
    events
)

api_router = APIRouter()

# Core Endpoints
api_router.include_router(health.router, prefix="", tags=["Health"])
api_router.include_router(fields.router, prefix="/fields", tags=["Fields"])
api_router.include_router(observations.router, prefix="/observations", tags=["Observations"])
api_router.include_router(scenario_replay.router, prefix="/scenarios", tags=["Scenarios"])
api_router.include_router(forecast.router, prefix="/forecast", tags=["Forecast"])
api_router.include_router(planner.router, prefix="/water-plan", tags=["Planner"])
api_router.include_router(explain.router, prefix="/explain", tags=["Explainability"])
api_router.include_router(events.router, prefix="/events", tags=["Events & Audit"])

# Contract Aliases for Master Prompt compatibility:
# /scenario/replay alias
api_router.add_api_route(
    "/scenario/replay",
    scenario_replay.replay_scenario,
    methods=["POST"],
    response_model=scenario_replay.ScenarioReplayResponse,
    tags=["Scenarios"]
)
api_router.add_api_route(
    "/scenario/reset",
    scenario_replay.reset_scenario,
    methods=["POST"],
    response_model=scenario_replay.ScenarioReplayResponse,
    tags=["Scenarios"]
)

# /metrics direct alias
api_router.add_api_route(
    "/metrics",
    events.get_system_metrics,
    methods=["GET"],
    response_model=events.SystemMetricsResponse,
    tags=["Events & Audit"]
)
