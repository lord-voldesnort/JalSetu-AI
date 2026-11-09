from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_still_passes():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "jalsetu-core"}


def test_list_fields_returns_at_least_10_fields():
    response = client.get("/fields")
    assert response.status_code == 200
    fields = response.json()
    assert isinstance(fields, list)
    assert len(fields) >= 10


def test_every_field_has_id_and_crop_context():
    response = client.get("/fields")
    assert response.status_code == 200
    fields = response.json()
    for field in fields:
        assert "id" in field and field["id"].startswith("PC-")
        assert "name" in field and field["name"]
        assert "crop" in field and field["crop"]
        assert "stage" in field and field["stage"]
        assert "area_acres" in field and field["area_acres"] > 0
        assert "geometry" in field and field["geometry"]["type"] == "Polygon"
        assert field["data_type"] == "synthetic_demo_data"


def test_field_status_pc001_success():
    response = client.get("/fields/PC-001/status")
    assert response.status_code == 200
    data = response.json()
    assert "field" in data
    assert data["field"]["id"] == "PC-001"
    assert data["status"] in ["green", "amber", "red"]
    assert "observations" in data
    assert isinstance(data["observations"], list)
    assert "freshness" in data
    assert "weather" in data["freshness"]
    assert "satellite" in data["freshness"]
    assert "soil" in data["freshness"]
    assert data["data_type"] == "synthetic_demo_data"


def test_field_status_unknown_field_returns_404():
    response = client.get("/fields/PC-999/status")
    assert response.status_code == 404
    data = response.json()
    assert "detail" in data
    assert "PC-999" in data["detail"]


def test_field_status_contains_freshness_metadata():
    response = client.get("/fields/PC-008/status")
    assert response.status_code == 200
    data = response.json()
    assert "freshness" in data
    weather_meta = data["freshness"]["weather"]
    assert "age_days" in weather_meta
    assert "stale" in weather_meta
    assert "quality_flag" in weather_meta
    # Verify stale observation explicit handling
    assert weather_meta["stale"] is True


def test_deterministic_output():
    res1 = client.get("/fields").json()
    res2 = client.get("/fields").json()
    assert res1 == res2

    status1 = client.get("/fields/PC-001/status").json()
    status2 = client.get("/fields/PC-001/status").json()
    assert status1 == status2
