from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_existing_health_endpoint():
    """Verify that existing /health contract is fully preserved."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "jalsetu-core"}


def test_existing_field_apis_unbroken():
    """Verify that existing /fields and /fields/{id}/status contracts are preserved."""
    fields_res = client.get("/fields")
    assert fields_res.status_code == 200
    fields_data = fields_res.json()
    assert len(fields_data) >= 10

    status_res = client.get("/fields/PC-001/status")
    assert status_res.status_code == 200
    status_data = status_res.json()
    assert status_data["field"]["id"] == "PC-001"
    assert status_data["status"] in ["green", "amber", "red"]


def test_forecast_returns_valid_probability_and_risk_state():
    """Verify GET /forecast/{field_id} returns valid probability and risk state."""
    response = client.get("/forecast/PC-001")
    assert response.status_code == 200
    data = response.json()

    assert data["field_id"] == "PC-001"
    assert 0.0 <= data["stress_probability"] <= 1.0
    assert data["status"] in ["green", "amber", "red"]
    assert data["risk_state"] in ["LOW", "MODERATE", "HIGH"]
    assert data["recommended_action"] in ["irrigate_now", "wait", "inspect", "watch", "protect_pause"]
    assert 0.0 <= data["confidence"] <= 1.0


def test_forecast_across_all_demo_fields():
    """Verify all 10 demo fields return valid bounded forecasts."""
    fields_res = client.get("/fields")
    assert fields_res.status_code == 200
    field_ids = [f["id"] for f in fields_res.json()]

    for field_id in field_ids:
        res = client.get(f"/forecast/{field_id}")
        assert res.status_code == 200
        forecast = res.json()
        assert forecast["field_id"] == field_id
        assert 0.0 <= forecast["stress_probability"] <= 1.0
        assert forecast["status"] in ["green", "amber", "red"]
        assert forecast["risk_state"] in ["LOW", "MODERATE", "HIGH"]
        assert 0.0 <= forecast["confidence"] <= 1.0
        band = forecast["uncertainty_band"]
        assert 0.0 <= band["p10"] <= band["p50"] <= band["p90"] <= 1.0


def test_forecast_deterministic_repeated_requests():
    """Verify repeated identical forecast requests return byte-identical results."""
    res1 = client.get("/forecast/PC-001").json()
    res2 = client.get("/forecast/PC-001").json()
    assert res1 == res2

    res3 = client.get("/forecast/PC-004").json()
    res4 = client.get("/forecast/PC-004").json()
    assert res3 == res4


def test_forecast_unknown_field_returns_404():
    """Verify unknown field IDs return HTTP 404."""
    res1 = client.get("/forecast/PC-999")
    assert res1.status_code == 404
    assert "PC-999" in res1.json()["detail"]

    res2 = client.get("/forecast/NON_EXISTENT_FIELD")
    assert res2.status_code == 404


def test_forecast_metadata_drivers_and_version():
    """Verify top drivers, model version, and freshness/uncertainty metadata are present."""
    response = client.get("/forecast/PC-001")
    assert response.status_code == 200
    data = response.json()

    assert data["model_version"] == "heuristic-baseline-v0.1"
    assert data["model_type"] == "deterministic_agronomic_heuristic_baseline"
    assert data["data_type"] == "synthetic_demo_data"
    assert "Planning aid only" in data["disclaimer"]

    # Drivers validation
    assert "top_drivers" in data
    drivers = data["top_drivers"]
    assert len(drivers) >= 3
    for driver in drivers:
        assert "rank" in driver
        assert "feature" in driver
        assert "label" in driver
        assert "contribution" in driver
        assert driver["direction"] in ["increases_risk", "decreases_risk", "neutral"]

    # Uncertainty band validation
    band = data["uncertainty_band"]
    assert band["p10"] <= band["p50"] <= band["p90"]
    assert band["p50"] == data["stress_probability"]

    # Freshness indicators
    assert "freshness" in data
    assert "weather" in data["freshness"]
    assert "satellite" in data["freshness"]
    assert "soil" in data["freshness"]


def test_missing_or_stale_data_not_silently_treated_as_fresh():
    """Verify missing or stale inputs are explicitly handled and penalized."""
    # PC-008 has stale weather (4d) and missing satellite data (13d)
    stale_res = client.get("/forecast/PC-008")
    assert stale_res.status_code == 200
    stale_data = stale_res.json()

    # Verify input availability flags
    assert stale_data["input_availability"]["satellite_ndvi"] is False
    assert stale_data["input_availability"]["days_since_irrigation"] is False

    # Verify freshness flags indicate stale
    assert stale_data["freshness"]["weather"]["stale"] is True
    assert stale_data["freshness"]["satellite"]["stale"] is True

    # Compare confidence with fresh field PC-001
    fresh_res = client.get("/forecast/PC-001")
    fresh_data = fresh_res.json()
    assert stale_data["confidence"] < fresh_data["confidence"]

    # Uncertainty band must be wider for stale/missing field
    stale_band_width = stale_data["uncertainty_band"]["p90"] - stale_data["uncertainty_band"]["p10"]
    fresh_band_width = fresh_data["uncertainty_band"]["p90"] - fresh_data["uncertainty_band"]["p10"]
    assert stale_band_width > fresh_band_width

    # Stale/missing data must trigger "inspect" recommendation
    assert stale_data["recommended_action"] == "inspect"

    # Verify driver explicitly notes missing/stale satellite observation
    sat_driver = next(d for d in stale_data["top_drivers"] if d["feature"] == "vegetation_canopy_ndvi")
    assert "missing" in sat_driver["label"].lower() or "stale" in sat_driver["label"].lower()

    # PC-003 does not have NDVI recorded in fixture -> input_availability must be False
    res_pc003 = client.get("/forecast/PC-003")
    assert res_pc003.json()["input_availability"]["satellite_ndvi"] is False
