"""
Tests for A6: Explainability, Event Governance, Audit Ledger, and Metrics.
"""

from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.event_store import JsonFileEventStore, get_event_store

client = TestClient(app)


@pytest.fixture(autouse=True)
def isolated_event_store(tmp_path: Path):
    """Ensure every test runs against an isolated, clean temporary event store."""
    temp_file = tmp_path / "test_events.json"
    temp_store = JsonFileEventStore(temp_file)
    app.dependency_overrides[get_event_store] = lambda: temp_store
    yield temp_store
    app.dependency_overrides.pop(get_event_store, None)


# =========================================================================
# 1. Explainability Tests (/explain/{field_id})
# =========================================================================

def test_explain_field_success():
    """Verify GET /explain/{field_id} returns comprehensive explainability payload."""
    res = client.get("/explain/PC-001")
    assert res.status_code == 200
    data = res.json()

    assert data["field_id"] == "PC-001"
    assert data["crop"] == "Tomato"
    assert data["stage"] == "Flowering"
    assert 0.0 <= data["stress_probability"] <= 1.0
    assert data["risk_state"] in ("LOW", "MODERATE", "HIGH")
    assert 0.0 <= data["confidence"] <= 1.0

    # Top drivers validation
    assert len(data["top_drivers"]) >= 3
    for driver in data["top_drivers"]:
        assert "feature" in driver
        assert driver["direction"] in ("increases_risk", "decreases_risk", "neutral")
        assert len(driver["label"]) > 0
        assert isinstance(driver["contribution"], (int, float))

    # Freshness metadata
    assert "weather" in data["freshness"]
    assert "satellite" in data["freshness"]
    assert "soil" in data["freshness"]

    # Canonical action & Why card
    assert data["recommended_action"] in ("irrigate", "wait", "inspect", "pause")
    assert len(data["action_reason"]) > 0
    assert len(data["why_card"]) > 10
    assert "Key Drivers:" in data["why_card"]

    # Transparency disclaimers
    assert data["model_version"] == "heuristic-baseline-v0.1"
    assert data["data_type"] == "synthetic_demo_data"
    assert "Planning aid only" in data["disclaimer"]


def test_explain_api_v1_alias_parity():
    """Verify /api/v1/explain/{field_id} alias works identically."""
    r1 = client.get("/explain/PC-001").json()
    r2 = client.get("/api/v1/explain/PC-001").json()
    assert r1 == r2


def test_explain_action_consistent_with_water_plan():
    """Verify recommended_action matches between /explain and /water-plan for same field."""
    for fid in ["PC-001", "PC-004", "PC-008", "PC-010"]:
        exp = client.get(f"/explain/{fid}").json()
        plan = client.post("/water-plan", json={"budget_units": 100.0, "field_ids": [fid]}).json()
        row = plan["rows"][0]
        assert exp["recommended_action"] == row["recommended_action"]


def test_explain_stale_field_flags_insufficient_data():
    """Verify field with stale/missing telemetry flags insufficient_data and recommends inspect."""
    res = client.get("/explain/PC-008")
    assert res.status_code == 200
    data = res.json()
    assert data["insufficient_data"] is True
    assert data["recommended_action"] == "inspect"
    assert "INSPECT BEFORE IRRIGATING" in data["why_card"]


def test_explain_under_scenario():
    """Verify /explain under scenario_id reflects scenario shock in drivers and why card."""
    res_base = client.get("/explain/PC-001").json()
    res_shock = client.get("/explain/PC-001?scenario_id=rainfall_deficit_heat_01").json()

    assert res_shock["scenario_id"] == "rainfall_deficit_heat_01"
    assert res_shock["stress_probability"] > res_base["stress_probability"]
    assert "heat wave" in res_shock["why_card"].lower() or "deficit" in res_shock["why_card"].lower()


def test_explain_unknown_field_returns_404():
    """Verify unknown field ID returns HTTP 404."""
    res = client.get("/explain/PC-999")
    assert res.status_code == 404
    assert "PC-999" in res.json()["detail"]


def test_explain_unknown_scenario_returns_404():
    """Verify unknown scenario_id returns HTTP 404."""
    res = client.get("/explain/PC-001?scenario_id=unknown_shock_xyz")
    assert res.status_code == 404
    assert "unknown_shock_xyz" in res.json()["detail"]


# =========================================================================
# 2. Event Ledger Tests (/events)
# =========================================================================

def test_create_event_success_and_readback():
    """Verify logging an event creates a 201 response with server-generated ID and timestamp."""
    payload = {
        "event_type": "recommendation_viewed",
        "field_id": "PC-001",
        "action": "wait",
        "note": "Farmer viewed recommendation card on mobile",
        "actor": "farmer_demo",
        "source": "mobile_app",
    }
    res = client.post("/events", json=payload)
    assert res.status_code == 201
    event = res.json()

    assert len(event["event_id"]) > 20
    assert "T" in event["created_at"]
    assert event["event_type"] == "recommendation_viewed"
    assert event["field_id"] == "PC-001"
    assert event["actor"] == "farmer_demo"

    # Readback via GET /events
    list_res = client.get("/events")
    assert list_res.status_code == 200
    events = list_res.json()
    assert len(events) == 1
    assert events[0]["event_id"] == event["event_id"]


def test_events_api_v1_alias_parity():
    """Verify /api/v1/events works identically for POST and GET."""
    payload = {
        "event_type": "recommendation_acknowledged",
        "field_id": "PC-002",
        "actor": "water_manager",
    }
    res = client.post("/api/v1/events", json=payload)
    assert res.status_code == 201
    list_res = client.get("/api/v1/events")
    assert list_res.status_code == 200
    assert len(list_res.json()) == 1


def test_event_planned_vs_completed_rules():
    """Verify irrigation_planned forbids actual_amount, while irrigation_completed requires actual_amount."""
    # 1. irrigation_planned with actual_amount must fail with 422
    bad_planned = {
        "event_type": "irrigation_planned",
        "field_id": "PC-001",
        "planned_amount": 20.0,
        "actual_amount": 15.0,  # FORBIDDEN
    }
    res1 = client.post("/events", json=bad_planned)
    assert res1.status_code == 422

    # Valid irrigation_planned
    good_planned = {
        "event_type": "irrigation_planned",
        "field_id": "PC-001",
        "planned_amount": 20.0,
    }
    assert client.post("/events", json=good_planned).status_code == 201

    # 2. irrigation_completed without actual_amount must fail with 422
    bad_completed = {
        "event_type": "irrigation_completed",
        "field_id": "PC-001",
        "planned_amount": 20.0,  # MISSING actual_amount
    }
    res2 = client.post("/events", json=bad_completed)
    assert res2.status_code == 422

    # Valid irrigation_completed
    good_completed = {
        "event_type": "irrigation_completed",
        "field_id": "PC-001",
        "planned_amount": 20.0,
        "actual_amount": 20.0,
    }
    assert client.post("/events", json=good_completed).status_code == 201


def test_override_and_reject_require_override_reason():
    """Verify recommendation_overridden and recommendation_rejected require override_reason."""
    # 1. Override without reason -> 422
    bad_override = {
        "event_type": "recommendation_overridden",
        "field_id": "PC-004",
        "action": "wait",
    }
    assert client.post("/events", json=bad_override).status_code == 422

    # Valid override with reason -> 201
    good_override = {
        "event_type": "recommendation_overridden",
        "field_id": "PC-004",
        "action": "wait",
        "override_reason": "Soil felt moist upon manual inspection; delayed irrigation by 24h",
    }
    assert client.post("/events", json=good_override).status_code == 201

    # 2. Reject without reason -> 422
    bad_reject = {
        "event_type": "recommendation_rejected",
        "field_id": "PC-005",
    }
    assert client.post("/events", json=bad_reject).status_code == 422

    # Valid reject with reason -> 201
    good_reject = {
        "event_type": "recommendation_rejected",
        "field_id": "PC-005",
        "override_reason": "Canal maintenance underway; pump could not operate",
    }
    assert client.post("/events", json=good_reject).status_code == 201


def test_event_unknown_extra_fields_forbidden():
    """Verify extra/unknown fields in event payload are rejected with 422 (extra='forbid')."""
    payload = {
        "event_type": "recommendation_viewed",
        "field_id": "PC-001",
        "arbitrary_unauthorized_key": "some_value",
    }
    res = client.post("/events", json=payload)
    assert res.status_code == 422


def test_event_unknown_field_id_returns_404():
    """Verify unknown field_id in event payload returns HTTP 404."""
    payload = {
        "event_type": "recommendation_viewed",
        "field_id": "PC-999",
    }
    res = client.post("/events", json=payload)
    assert res.status_code == 404
    assert "PC-999" in res.json()["detail"]


def test_event_filter_by_field_and_type():
    """Verify GET /events filtering by field_id, event_type, and limit."""
    # Seed events
    client.post("/events", json={"event_type": "recommendation_viewed", "field_id": "PC-001"})
    client.post("/events", json={"event_type": "recommendation_viewed", "field_id": "PC-002"})
    client.post(
        "/events",
        json={
            "event_type": "recommendation_overridden",
            "field_id": "PC-001",
            "override_reason": "Rain expected tonight",
        },
    )

    # Filter by field_id
    f_res = client.get("/events?field_id=PC-001")
    assert f_res.status_code == 200
    assert len(f_res.json()) == 2

    # Filter by event_type
    t_res = client.get("/events?event_type=recommendation_overridden")
    assert t_res.status_code == 200
    assert len(t_res.json()) == 1

    # Filter with limit
    lim_res = client.get("/events?limit=1")
    assert lim_res.status_code == 200
    assert len(lim_res.json()) == 1


def test_event_store_persistence_across_instances(tmp_path: Path):
    """Verify records persist to disk and can be read by a separate JsonFileEventStore instance."""
    file_path = tmp_path / "persist_test.json"
    store1 = JsonFileEventStore(file_path)
    app.dependency_overrides[get_event_store] = lambda: store1

    client.post("/events", json={"event_type": "recommendation_viewed", "field_id": "PC-001"})
    client.post("/events", json={"event_type": "recommendation_viewed", "field_id": "PC-002"})

    # Create fresh store pointing at same file
    store2 = JsonFileEventStore(file_path)
    records = store2.list()
    assert len(records) == 2
    assert records[0].field_id == "PC-002"
    assert records[1].field_id == "PC-001"


def test_event_store_corrupt_file_recovery(tmp_path: Path):
    """Verify malformed/corrupt event file does not crash API and recovers with clean ledger."""
    file_path = tmp_path / "corrupt_test.json"
    file_path.write_text("{ this is invalid json !!!", encoding="utf-8")

    store = JsonFileEventStore(file_path)
    app.dependency_overrides[get_event_store] = lambda: store

    # List on corrupt file returns empty list
    assert store.list() == []

    # API still works and appends cleanly
    res = client.post("/events", json={"event_type": "recommendation_viewed", "field_id": "PC-001"})
    assert res.status_code == 201
    assert len(store.list()) == 1


def test_concurrent_event_appends_do_not_drop_records(tmp_path: Path):
    """Verify thread-safe concurrent appends do not lose records."""
    file_path = tmp_path / "concurrent_test.json"
    store = JsonFileEventStore(file_path)
    app.dependency_overrides[get_event_store] = lambda: store

    def post_event(i: int):
        client.post(
            "/events",
            json={
                "event_type": "recommendation_viewed",
                "field_id": f"PC-{i % 10 + 1:03d}",
                "note": f"Concurrent thread event {i}",
            },
        )

    with ThreadPoolExecutor(max_workers=8) as executor:
        list(executor.map(post_event, range(30)))

    events = store.list(limit=100)
    assert len(events) == 30


# =========================================================================
# 3. Metrics Tests (/metrics)
# =========================================================================

def test_get_metrics_empty_ledger():
    """Verify GET /metrics returns valid schema on empty audit ledger."""
    res = client.get("/metrics")
    assert res.status_code == 200
    data = res.json()

    assert data["total_fields"] == 10
    assert sum(data["fields_by_risk_state"].values()) == 10
    assert data["total_events"] == 0
    assert data["events_by_type"] == {}
    assert data["latest_event_timestamp"] is None

    # Data quality check
    dq = data["data_quality"]
    assert dq["fresh_signals"] > 0
    assert dq["freshness_rate_pct"] > 50.0

    # No ML performance claim check
    assert data["ml_performance"] == "not_evaluated"
    assert data["process_counters"]["counter_scope"] == "since_process_start"


def test_metrics_api_v1_alias_parity():
    """Verify /api/v1/metrics returns identical response."""
    r1 = client.get("/metrics").json()
    r2 = client.get("/api/v1/metrics").json()
    assert r1["total_fields"] == r2["total_fields"]
    assert r1["data_quality"] == r2["data_quality"]


def test_metrics_match_stored_events_accurately():
    """Verify /metrics counts reflect newly logged events accurately."""
    client.post("/events", json={"event_type": "recommendation_viewed", "field_id": "PC-001"})
    client.post("/events", json={"event_type": "recommendation_viewed", "field_id": "PC-002"})
    client.post(
        "/events",
        json={
            "event_type": "recommendation_overridden",
            "field_id": "PC-003",
            "override_reason": "Postponed for rain",
        },
    )

    res = client.get("/metrics")
    assert res.status_code == 200
    data = res.json()

    assert data["total_events"] == 3
    assert data["events_by_type"]["recommendation_viewed"] == 2
    assert data["events_by_type"]["recommendation_overridden"] == 1
    assert data["latest_event_timestamp"] is not None

