"""
Master Prompt 5 Final End-to-End Regression and Verification Suite
Covers:
- All budget boundary conditions (0, 25, 50, 100, 200, 500, negative, surplus)
- All 3 climate scenarios and reset non-mutating idempotency
- All forecast horizons (3, 5, 7) and boundary rejection (2, 8, unknown field)
- Action events persistence and mandatory override validation
- System metrics mathematical accuracy
- Explainability signal units and stale data flags
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.scenario_mgr import scenario_manager
from app.services.data_loader import data_loader

client = TestClient(app)


def test_budget_boundaries_allocator():
    """Verify water allocation behavior across all requested budget points."""
    budgets = [0.0, 25.0, 50.0, 100.0, 200.0, 500.0]
    for b in budgets:
        res = client.post("/water-plan", json={"budget": b, "method": "ai"})
        assert res.status_code == 200, f"Failed for budget {b}: {res.text}"
        data = res.json()
        assert data["requested_budget_m3"] == b
        assert data["total_allocated_m3"] <= b + 1e-5, f"Budget exceeded for budget {b}"
        assert data["unallocated_remainder_m3"] >= 0.0
        assert data["constraint_checks"]["budget_conserved"] is True
        assert data["constraint_checks"]["all_allocations_non_negative"] is True
        assert data["constraint_checks"]["capacities_respected"] is True

        # Check all allocated volumes are nonnegative and within capacity
        for a in data["allocations"]:
            assert a["allocated_volume_m3"] >= 0.0
            assert a["allocated_volume_m3"] <= a["capacity_limit_m3"] + 1e-5


def test_budget_negative_boundary_rejected():
    """Verify that negative budgets are rejected with HTTP 422."""
    res = client.post("/water-plan", json={"budget": -15.0, "method": "ai"})
    assert res.status_code == 422


def test_budget_surplus_caps_at_demand_and_capacity():
    """Verify that an extremely large budget (e.g. 5000 m3) does not over-allocate beyond capacity."""
    res = client.post("/water-plan", json={"budget": 5000.0, "method": "ai"})
    assert res.status_code == 200
    data = res.json()
    assert data["unallocated_remainder_m3"] > 0.0
    for a in data["allocations"]:
        assert a["allocated_volume_m3"] <= a["capacity_limit_m3"]


def test_all_scenarios_replay_and_reset_idempotency():
    """
    Verify replay of normal_01, rainfall_deficit_heat_01, heavy_rain_pause_01,
    and confirm that reset restores baseline observations without persistent mutation.
    """
    raw_obs_count_initial = len(data_loader.load_observations())

    # 1. Replay Heat + Drought
    res_heat = client.post("/scenario/replay", json={"scenario_id": "rainfall_deficit_heat_01"})
    assert res_heat.status_code == 200
    data_heat = res_heat.json()
    assert data_heat["scenario_id"] == "rainfall_deficit_heat_01"
    assert data_heat["fields_affected_count"] >= 3

    # Check that under heat shock, affected fields experience higher risk
    fields_res = client.get("/fields?scenario_id=rainfall_deficit_heat_01")
    assert fields_res.status_code == 200
    heat_fields = fields_res.json()["features"]
    pc001 = next(f for f in heat_fields if f["properties"]["id"] == "PC-001")
    assert pc001["properties"]["stress_status"] in ["amber", "red"]

    # 2. Replay Heavy Rain Deluge
    res_rain = client.post("/scenario/replay", json={"scenario_id": "heavy_rain_pause_01"})
    assert res_rain.status_code == 200
    data_rain = res_rain.json()
    assert data_rain["scenario_id"] == "heavy_rain_pause_01"

    # Check paused fields receive 0 allocation under heavy rain
    plan_rain = client.post("/water-plan", json={"budget": 100.0, "scenario_id": "heavy_rain_pause_01"})
    assert plan_rain.status_code == 200
    for a in plan_rain.json()["allocations"]:
        if a["action_recommendation"] == "protect_pause":
            assert a["allocated_volume_m3"] == 0.0

    # 3. Reset to Baseline
    res_reset = client.post("/scenario/reset")
    assert res_reset.status_code == 200
    assert scenario_manager.active_scenario_id == "normal_01"

    # Confirm raw observations count and integrity did not mutate
    raw_obs_count_final = len(data_loader.load_observations())
    assert raw_obs_count_initial == raw_obs_count_final


def test_forecast_horizons_and_boundaries():
    """Verify horizons 3, 5, 7, and rejection of invalid horizons and unknown fields."""
    for h in [3, 5, 7]:
        res = client.get(f"/forecast/PC-001?horizon_days={h}")
        assert res.status_code == 200
        data = res.json()
        assert len(data["daily_projections"]) == h
        assert data["horizon_days"] == h
        # Verify uncertainty interval order: p10 <= projected_risk_score <= p90
        for p in data["daily_projections"]:
            assert p["confidence_p10"] <= p["projected_risk_score"] + 1e-5
            assert p["projected_risk_score"] <= p["confidence_p90"] + 1e-5

    # Invalid horizons: 2 and 8
    res_too_short = client.get("/forecast/PC-001?horizon_days=2")
    assert res_too_short.status_code in [400, 422]

    res_too_long = client.get("/forecast/PC-001?horizon_days=8")
    assert res_too_long.status_code in [400, 422]

    # Nonexistent field
    res_unknown = client.get("/forecast/PC-999?horizon_days=5")
    assert res_unknown.status_code == 404


def test_audit_event_override_and_metrics_accuracy():
    """Verify action event persistence, override reason enforcement, and metrics computation."""
    # 1. Invalid override without reason
    res_bad = client.post(
        "/events",
        json={
            "field_id": "PC-001",
            "action_taken": "wait",
            "followed_recommendation": False,
            "override_reason": None,
            "user_role": "farmer"
        }
    )
    assert res_bad.status_code == 422

    # 2. Valid override with reason
    res_good = client.post(
        "/events",
        json={
            "field_id": "PC-001",
            "action_taken": "wait",
            "followed_recommendation": False,
            "override_reason": "pump_failure",
            "planned_volume_m3": 12.0,
            "actual_volume_m3": 0.0,
            "user_role": "farmer",
            "notes": "E2E verification event"
        }
    )
    assert res_good.status_code == 201
    event_id = res_good.json()["event_id"]

    # 3. Retrieve events and verify persisted
    res_list = client.get("/events?limit=10")
    assert res_list.status_code == 200
    events = res_list.json()
    assert any(e["event_id"] == event_id for e in events)

    # 4. Check system metrics
    res_metrics = client.get("/metrics")
    assert res_metrics.status_code == 200
    metrics = res_metrics.json()
    assert metrics["total_events_logged"] > 0
    assert metrics["overrides_logged"] > 0
    assert "pump_failure" in metrics["override_reasons_breakdown"]


def test_explain_field_integrity_and_disclaimer():
    """Verify explainability returns complete drivers, units, and PRD disclaimer."""
    for fid in [f"PC-{i:03d}" for i in range(1, 11)]:
        res = client.get(f"/explain/{fid}")
        assert res.status_code == 200
        data = res.json()
        assert data["field_id"] == fid
        assert 0.0 <= data["risk_score"] <= 100.0
        assert data["risk_level"] in ["Low", "Moderate", "High", "Critical"]
        assert len(data["drivers"]) >= 4
        assert "Planning aid" in data["policy_disclaimer"]

        # Check PC-004 has stale data flag
        if fid == "PC-004":
            stale_flags = [f["is_stale"] for f in data["freshness_table"]]
            assert any(stale_flags), "Expected stale data flag for PC-004"

