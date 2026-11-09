"""
Metrics Router for JalSetu AI.

Provides GET /metrics and GET /api/v1/metrics for system health, signal data quality,
and persistent action ledger telemetry.
"""

from fastapi import APIRouter, Depends
from app.schemas.metrics import MetricsResponse
from app.services.event_store import EventStore, get_event_store
from app.services.metrics_service import compute_system_metrics

router = APIRouter(tags=["metrics"])


@router.get("/metrics", response_model=MetricsResponse)
@router.get("/api/v1/metrics", response_model=MetricsResponse, include_in_schema=False)
def get_metrics_endpoint(
    store: EventStore = Depends(get_event_store),
) -> MetricsResponse:
    """
    Retrieve real operational metrics, persistent audit counts, and data freshness metrics.
    No unverified ML performance claims.
    """
    return compute_system_metrics(store=store)

