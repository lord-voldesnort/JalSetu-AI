def test_fields_status_endpoint(client):
    """Test GET /fields/PC-001/status returns comprehensive assessment."""
    res = client.get("/fields/PC-001/status")
    assert res.status_code == 200
    data = res.json()
    assert data["field_id"] == "PC-001"
    assert "risk_score" in data
    assert "stress_status" in data
    assert "recommended_action" in data
    assert len(data["drivers"]) == 4


def test_forecast_endpoint(client):
    """Test GET /forecast/PC-001 returns 3-day projection."""
    res = client.get("/forecast/PC-001?horizon_days=3")
    assert res.status_code == 200
    data = res.json()
    assert data["field_id"] == "PC-001"
    assert data["horizon_days"] == 3
    assert len(data["daily_projections"]) == 3


def test_scenario_replay_api(client):
    """Test POST /scenario/replay with rainfall_deficit_heat_01."""
    res = client.post("/scenario/replay", json={"scenario_id": "rainfall_deficit_heat_01"})
    assert res.status_code == 200
    data = res.json()
    assert data["scenario_id"] == "rainfall_deficit_heat_01"
    assert data["is_synthetic_replay"] is True
    assert len(data["affected_field_ids"]) == 3
    assert data["fields_affected_count"] == 3

    # Reset
    res_reset = client.post("/scenario/reset")
    assert res_reset.status_code == 200
    assert res_reset.json()["scenario_id"] == "normal_01"


def test_water_plan_api(client):
    """Test POST /water-plan enforces hard budget limit."""
    res = client.post("/water-plan", json={"budget": 100.0, "planning_window_days": 7})
    assert res.status_code == 200
    data = res.json()
    assert data["requested_budget_m3"] == 100.0
    assert data["total_allocated_m3"] <= 100.0
    assert data["constraint_checks"]["budget_conserved"] is True
    assert len(data["allocations"]) == 10


def test_water_plan_invalid_negative_budget(client):
    """Test POST /water-plan rejects negative budget with 422."""
    res = client.post("/water-plan", json={"budget": -50.0})
    assert res.status_code == 422


def test_explain_endpoint(client):
    """Test GET /explain/PC-004 includes stale satellite warning."""
    res = client.get("/explain/PC-004")
    assert res.status_code == 200
    data = res.json()
    assert data["field_id"] == "PC-004"
    assert any("stale" in w.lower() for w in data["warnings"])


def test_action_event_override_requires_reason(client):
    """Test POST /events rejects override when reason is missing."""
    # Invalid: followed_recommendation is False but override_reason is None
    payload_invalid = {
        "field_id": "PC-001",
        "action_taken": "irrigate_now",
        "followed_recommendation": False,
        "override_reason": ""
    }
    res = client.post("/events", json=payload_invalid)
    assert res.status_code == 422
    assert "mandatory" in res.json()["detail"].lower()


def test_action_event_valid_override_persists(client):
    """Test POST /events successfully records valid override with reason."""
    payload_valid = {
        "field_id": "PC-001",
        "action_taken": "wait",
        "followed_recommendation": False,
        "override_reason": "Soil felt moist upon manual inspection",
        "user_role": "farmer"
    }
    res = client.post("/events", json=payload_valid)
    assert res.status_code == 201
    data = res.json()
    assert data["field_id"] == "PC-001"
    assert data["override_reason"] == "Soil felt moist upon manual inspection"
    assert data["status"] == "recorded"


def test_metrics_endpoint(client):
    """Test GET /metrics returns live database and operational stats."""
    res = client.get("/metrics")
    assert res.status_code == 200
    data = res.json()
    assert data["total_fields"] == 10
    assert data["total_observations"] == 170
    assert data["total_events_logged"] >= 1
    assert data["database_type"] == "sqlite"

