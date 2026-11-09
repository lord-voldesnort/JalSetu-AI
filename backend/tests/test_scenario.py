import copy
from fastapi.testclient import TestClient
from app.main import app
from app.data.fixtures import DEMO_FIELDS_RAW, DEMO_STATUS_RAW

client = TestClient(app)


def test_valid_scenario_replay_full_schema():
    """Verify POST /scenario/replay produces a fully-typed, structured response matching schemas."""
    payload = {
        "field_id": "PC-001",
        "scenario_name": "Moderate Drought + Heat Wave",
        "rainfall_multiplier": 0.0,
        "heat_wave_intensity": "moderate",
        "horizon_days": 7,
    }
    response = client.post("/scenario/replay", json=payload)
    assert response.status_code == 200
    data = response.json()

    # 1. Field ID and scenario inputs
    assert data["field_id"] == "PC-001"
    inputs = data["scenario_inputs"]
    assert inputs["field_id"] == "PC-001"
    assert inputs["scenario_name"] == "Moderate Drought + Heat Wave"
    assert inputs["rainfall_multiplier"] == 0.0
    assert inputs["temperature_delta_c"] == 4.0  # Resolved from 'moderate'
    assert inputs["heat_wave_intensity"] == "moderate"
    assert inputs["horizon_days"] == 7

    # 2. Baseline forecast
    base = data["baseline_forecast"]
    assert base["field_id"] == "PC-001"
    assert 0.0 <= base["stress_probability"] <= 1.0
    assert base["status"] in ["green", "amber", "red"]
    assert base["risk_state"] in ["LOW", "MODERATE", "HIGH"]
    assert len(base["top_drivers"]) >= 3
    assert base["data_type"] == "synthetic_demo_data"

    # 3. Scenario forecast
    scen = data["scenario_forecast"]
    assert scen["field_id"] == "PC-001"
    assert 0.0 <= scen["stress_probability"] <= 1.0
    assert scen["status"] in ["green", "amber", "red"]
    assert scen["risk_state"] in ["LOW", "MODERATE", "HIGH"]
    assert len(scen["top_drivers"]) >= 3
    assert scen["data_type"] == "synthetic_demo_data"

    # 4. Risk / probability change
    change = data["change_summary"]
    assert change["baseline_probability"] == base["stress_probability"]
    assert change["scenario_probability"] == scen["stress_probability"]
    assert change["probability_delta"] == round(scen["stress_probability"] - base["stress_probability"], 2)
    assert change["baseline_status"] == base["status"]
    assert change["scenario_status"] == scen["status"]
    assert change["baseline_risk_state"] == base["risk_state"]
    assert change["scenario_risk_state"] == scen["risk_state"]
    assert "->" in change["status_transition"] or change["status_transition"] == "unchanged"
    assert isinstance(change["risk_level_changed"], bool)

    # 5. Changed drivers
    assert len(data["changed_drivers"]) >= 1
    for cd in data["changed_drivers"]:
        assert cd["feature"] in ["rainfall_deficit", "heat_load_forecast", "soil_water_proxy"]
        assert isinstance(cd["baseline_contribution"], (int, float))
        assert isinstance(cd["scenario_contribution"], (int, float))
        assert isinstance(cd["contribution_delta"], (int, float))
        assert len(cd["baseline_label"]) > 0
        assert len(cd["scenario_label"]) > 0
        assert cd["impact"] in ["increased_risk", "reduced_risk", "neutral"]

    # 6. Input availability, freshness, uncertainty
    assert "input_availability" in data
    assert data["input_availability"]["rainfall_observation"] is True
    assert data["input_availability"]["crop_phenology"] is True

    assert "freshness" in data
    assert "weather" in data["freshness"]
    assert "satellite" in data["freshness"]
    assert "soil" in data["freshness"]

    assert "uncertainty" in data
    u = data["uncertainty"]
    assert 0.0 <= u["p10"] <= u["p50"] <= u["p90"] <= 1.0

    # 7. Model version and disclaimers
    assert data["model_version"] == "heuristic-baseline-v0.1"
    assert data["model_type"] == "deterministic_agronomic_heuristic_baseline"
    assert data["data_type"] == "synthetic_demo_data"
    assert "Planning aid only" in data["disclaimer"]
    assert "Scenario simulation only" in data["scenario_disclaimer"]
    assert "Does NOT guarantee" in data["scenario_disclaimer"]


def test_scenario_replay_api_v1_alias():
    """Verify POST /api/v1/scenario/replay alias works identically."""
    payload = {"field_id": "PC-001", "rainfall_multiplier": 0.5}
    res_direct = client.post("/scenario/replay", json=payload)
    res_alias = client.post("/api/v1/scenario/replay", json=payload)
    assert res_direct.status_code == 200
    assert res_alias.status_code == 200
    assert res_direct.json() == res_alias.json()


def test_deterministic_repeated_results():
    """Verify scenario evaluations are 100% deterministic on repeated runs."""
    payload1 = {
        "field_id": "PC-001",
        "rainfall_multiplier": 0.0,
        "temperature_delta_c": 3.5,
        "simulated_irrigation_mm": 15.0,
    }
    r1 = client.post("/scenario/replay", json=payload1).json()
    r2 = client.post("/scenario/replay", json=payload1).json()
    assert r1 == r2

    payload2 = {
        "field_id": "PC-005",
        "heat_wave_intensity": "severe",
        "delta_rainfall_mm": -10.0,
    }
    r3 = client.post("/scenario/replay", json=payload2).json()
    r4 = client.post("/scenario/replay", json=payload2).json()
    assert r3 == r4


def test_baseline_versus_scenario_drought_and_heat():
    """Verify that simulated drought and heat elevate risk compared to baseline."""
    res = client.post(
        "/scenario/replay",
        json={
            "field_id": "PC-001",
            "rainfall_multiplier": 0.0,
            "temperature_delta_c": 6.0,
        },
    )
    assert res.status_code == 200
    data = res.json()

    base_prob = data["baseline_forecast"]["stress_probability"]
    scen_prob = data["scenario_forecast"]["stress_probability"]

    # Stress probability must increase under severe drought + heat
    assert scen_prob > base_prob
    assert data["change_summary"]["probability_delta"] > 0
    assert data["change_summary"]["risk_level_changed"] is True
    assert data["change_summary"]["baseline_status"] == "green"
    assert data["change_summary"]["scenario_status"] in ["amber", "red"]

    # Rain and heat drivers must both show increased risk
    features = {d["feature"]: d for d in data["changed_drivers"]}
    assert "rainfall_deficit" in features
    assert features["rainfall_deficit"]["impact"] == "increased_risk"
    assert "heat_load_forecast" in features
    assert features["heat_load_forecast"]["impact"] == "increased_risk"


def test_baseline_versus_scenario_irrigation_relief():
    """Verify that hypothetical irrigation decreases stress on high-risk fields."""
    # PC-010 has high baseline stress (status red)
    res = client.post(
        "/scenario/replay",
        json={
            "field_id": "PC-010",
            "simulated_irrigation_mm": 30.0,
        },
    )
    assert res.status_code == 200
    data = res.json()

    base_prob = data["baseline_forecast"]["stress_probability"]
    scen_prob = data["scenario_forecast"]["stress_probability"]

    # Stress must decrease with 30mm hypothetical irrigation
    assert scen_prob < base_prob
    assert data["change_summary"]["probability_delta"] < 0
    assert data["scenario_forecast"]["input_availability"]["days_since_irrigation"] is True

    # Soil driver should reflect buffering
    soil_diff = next((d for d in data["changed_drivers"] if d["feature"] == "soil_water_proxy"), None)
    assert soil_diff is not None
    assert soil_diff["impact"] == "reduced_risk"


def test_heat_wave_preset_resolutions():
    """Verify mild, moderate, and severe presets correctly resolve temperature deltas."""
    presets = [("mild", 2.0), ("moderate", 4.0), ("severe", 6.0)]
    for preset, expected_temp in presets:
        res = client.post(
            "/scenario/replay",
            json={"field_id": "PC-001", "heat_wave_intensity": preset},
        )
        assert res.status_code == 200
        data = res.json()
        assert data["scenario_inputs"]["temperature_delta_c"] == expected_temp
        heat_driver = next(d for d in data["changed_drivers"] if d["feature"] == "heat_load_forecast")
        assert f"+{expected_temp:.1f}°C" in heat_driver["scenario_label"]


def test_unknown_field_returns_404():
    """Verify unknown or nonexistent field IDs return HTTP 404."""
    res1 = client.post("/scenario/replay", json={"field_id": "PC-999"})
    assert res1.status_code == 404
    assert "PC-999" in res1.json()["detail"]

    res2 = client.post("/scenario/replay", json={"field_id": "NON_EXISTENT_FIELD"})
    assert res2.status_code == 404
    assert "NON_EXISTENT_FIELD" in res2.json()["detail"]


def test_invalid_inputs_rejected_with_422():
    """Verify out-of-bound or invalid scenario parameters are rejected with HTTP 422."""
    invalid_cases = [
        {"field_id": "PC-001", "rainfall_multiplier": -0.5},   # ge=0.0
        {"field_id": "PC-001", "rainfall_multiplier": 6.0},    # le=5.0
        {"field_id": "PC-001", "delta_rainfall_mm": -150.0},   # ge=-100.0
        {"field_id": "PC-001", "delta_rainfall_mm": 250.0},    # le=200.0
        {"field_id": "PC-001", "temperature_delta_c": -15.0},  # ge=-10.0
        {"field_id": "PC-001", "temperature_delta_c": 20.0},   # le=15.0
        {"field_id": "PC-001", "heat_wave_intensity": "catastrophic"},  # Literal check
        {"field_id": "PC-001", "simulated_irrigation_mm": -5.0}, # ge=0.0
        {"field_id": "PC-001", "simulated_irrigation_mm": 120.0}, # le=100.0
        {"field_id": "PC-001", "horizon_days": 0},              # ge=1
        {"field_id": "PC-001", "horizon_days": 20},             # le=14
        {"field_id": ""},                                        # min_length=1
        {},                                                      # missing field_id
    ]

    for payload in invalid_cases:
        res = client.post("/scenario/replay", json=payload)
        assert res.status_code == 422, f"Expected 422 for payload {payload}, got {res.status_code}"


def test_missing_or_stale_data_field_replay():
    """Verify that fields with missing or stale baseline observations reflect uncertainty in replay."""
    # PC-008 has stale weather (4d) and missing satellite data (13d)
    res = client.post(
        "/scenario/replay",
        json={"field_id": "PC-008", "rainfall_multiplier": 0.0},
    )
    assert res.status_code == 200
    data = res.json()

    # Input availability must preserve missing flags
    assert data["input_availability"]["satellite_ndvi"] is False
    assert data["freshness"]["weather"]["stale"] is True
    assert data["freshness"]["satellite"]["stale"] is True

    # Stale baseline must depress scenario confidence and expand uncertainty band
    scen = data["scenario_forecast"]
    assert scen["confidence"] <= 0.55
    band_width = scen["uncertainty_band"]["p90"] - scen["uncertainty_band"]["p10"]
    assert band_width >= 0.30

    # Recommended action must be inspect due to data uncertainty
    assert scen["recommended_action"] == "inspect"


def test_fixtures_are_not_mutated():
    """Verify that replaying scenarios does not mutate in-memory fixture dictionaries."""
    fields_before = copy.deepcopy(DEMO_FIELDS_RAW)
    status_before = copy.deepcopy(DEMO_STATUS_RAW)

    # Perform a battery of severe shock replays across multiple fields
    for fid in ["PC-001", "PC-002", "PC-005", "PC-008", "PC-010"]:
        client.post(
            "/scenario/replay",
            json={
                "field_id": fid,
                "rainfall_multiplier": 0.0,
                "temperature_delta_c": 5.0,
                "simulated_irrigation_mm": 50.0,
            },
        )

    # Fixtures must remain completely unchanged
    assert DEMO_FIELDS_RAW == fields_before
    assert DEMO_STATUS_RAW == status_before

    # Verify baseline status endpoint still returns original values
    status_res = client.get("/fields/PC-001/status")
    assert status_res.status_code == 200
    assert status_res.json()["status"] == "green"


def test_no_guarantee_disclaimer_compliance():
    """Verify compliance requirement: scenario outputs must never claim guaranteed yield or savings."""
    res = client.post(
        "/scenario/replay",
        json={"field_id": "PC-001", "simulated_irrigation_mm": 20.0},
    )
    assert res.status_code == 200
    data = res.json()

    # Disclaimers must be explicitly stated
    assert "planning aid" in data["disclaimer"].lower()
    assert "synthetic" in data["disclaimer"].lower()
    assert "not guarantee" in data["scenario_disclaimer"].lower()
    assert "water savings" in data["scenario_disclaimer"].lower()


def test_all_ten_demo_fields_can_be_replayed():
    """Verify all 10 demo fields (PC-001 through PC-010) successfully replay without errors."""
    for i in range(1, 11):
        field_id = f"PC-{i:03d}"
        res = client.post(
            "/scenario/replay",
            json={
                "field_id": field_id,
                "rainfall_multiplier": 0.5,
                "temperature_delta_c": 2.0,
            },
        )
        assert res.status_code == 200, f"Failed for {field_id}"
        data = res.json()
        assert data["field_id"] == field_id
        assert 0.0 <= data["scenario_forecast"]["stress_probability"] <= 1.0
        assert data["scenario_forecast"]["status"] in ["green", "amber", "red"]
