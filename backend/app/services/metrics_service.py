"""
Metrics Service for JalSetu AI.

Computes system telemetry, baseline data health, persistent event counts, and process counters.
"""

from datetime import datetime, timezone
import threading
from typing import Dict, Optional
from app.data.fixtures import DEMO_FIELDS_RAW, DEMO_STATUS_RAW
from app.schemas.metrics import DataQualityMetrics, MetricsResponse, ProcessCounters
from app.services.event_store import EventStore, get_event_store
from app.services.forecast_service import compute_field_forecast, MODEL_VERSION, DATA_TYPE


class ProcessCounterTracker:
    def __init__(self):
        self._lock = threading.Lock()
        self.forecasts_requested = 0
        self.scenarios_replayed = 0
        self.plans_generated = 0

    def inc_forecast(self):
        with self._lock:
            self.forecasts_requested += 1

    def inc_scenario(self):
        with self._lock:
            self.scenarios_replayed += 1

    def inc_plan(self):
        with self._lock:
            self.plans_generated += 1

    def get_counters(self) -> ProcessCounters:
        with self._lock:
            return ProcessCounters(
                forecasts_requested=self.forecasts_requested,
                scenarios_replayed=self.scenarios_replayed,
                plans_generated=self.plans_generated,
                counter_scope="since_process_start",
            )


process_counters = ProcessCounterTracker()


def compute_system_metrics(store: Optional[EventStore] = None) -> MetricsResponse:
    """Compute aggregate system metrics, signal freshness, and audit counts."""
    if store is None:
        store = get_event_store()

    # 1. Field risk distribution from baseline forecast
    fields_by_risk: Dict[str, int] = {"HIGH": 0, "MODERATE": 0, "LOW": 0}
    for field in DEMO_FIELDS_RAW:
        fid = field["id"]
        fc = compute_field_forecast(fid)
        if fc:
            fields_by_risk[fc.risk_state] = fields_by_risk.get(fc.risk_state, 0) + 1

    # 2. Data quality metrics from fixtures
    fresh = 0
    stale = 0
    missing = 0
    suspect = 0
    for fid, status in DEMO_STATUS_RAW.items():
        freshness = status.get("freshness", {})
        for sig in ("weather", "satellite", "soil"):
            q = freshness.get(sig, {}).get("quality_flag", "GOOD")
            if q == "GOOD":
                fresh += 1
            elif q == "STALE":
                stale += 1
            elif q == "MISSING":
                missing += 1
            elif q == "SUSPECT":
                suspect += 1

    total_signals = fresh + stale + missing + suspect
    fresh_rate = round(fresh / total_signals * 100.0, 1) if total_signals > 0 else 100.0

    dq = DataQualityMetrics(
        fresh_signals=fresh,
        stale_signals=stale,
        missing_signals=missing,
        suspect_signals=suspect,
        freshness_rate_pct=fresh_rate,
    )

    # 3. Persistent event stats
    total_events = store.total_count()
    events_by_type = store.count_by_type()
    latest_event = store.latest()
    latest_ts = latest_event.created_at if latest_event else None

    # 4. In-process counters
    pc = process_counters.get_counters()

    now_utc = datetime.now(timezone.utc).isoformat()

    return MetricsResponse(
        as_of=now_utc,
        total_fields=len(DEMO_FIELDS_RAW),
        fields_by_risk_state=fields_by_risk,
        total_events=total_events,
        events_by_type=events_by_type,
        latest_event_timestamp=latest_ts,
        data_quality=dq,
        process_counters=pc,
        ml_performance="not_evaluated",
        model_version=MODEL_VERSION,
        data_type=DATA_TYPE,
    )

