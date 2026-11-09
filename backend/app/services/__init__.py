"""Services package."""
from app.services.forecast_service import compute_field_forecast
from app.services.scenario_service import compute_scenario_replay
from app.services.optimizer_service import compute_water_allocation_plan, derive_field_action
from app.services.explain_service import compute_field_explanation
from app.services.event_store import EventStore, JsonFileEventStore, get_event_store, set_event_store
from app.services.metrics_service import compute_system_metrics, process_counters

__all__ = [
    "compute_field_forecast",
    "compute_scenario_replay",
    "compute_water_allocation_plan",
    "derive_field_action",
    "compute_field_explanation",
    "EventStore",
    "JsonFileEventStore",
    "get_event_store",
    "set_event_store",
    "compute_system_metrics",
    "process_counters",
]
