from app.db.models import FieldModel, ObservationModel, ScenarioModel, WaterPlanModel
from app.db.seed import seed_database


def test_seed_database_idempotent(db_session):
    """Verify that seed_database populates tables and repeated seeding is idempotent."""
    res1 = seed_database(db_session)
    assert res1["fields_loaded"] == 10
    assert res1["observations_loaded"] == 170
    assert res1["scenarios_loaded"] == 3

    field_count = db_session.query(FieldModel).count()
    obs_count = db_session.query(ObservationModel).count()
    scen_count = db_session.query(ScenarioModel).count()

    assert field_count == 10
    assert obs_count == 170
    assert scen_count == 3

    # Seed again and assert no duplicate records
    res2 = seed_database(db_session)
    assert res2["fields_created"] == 0
    assert db_session.query(FieldModel).count() == 10


def test_api_fields_endpoint(client):
    """Verify that GET /api/v1/fields returns 10 fields."""
    response = client.get("/api/v1/fields")
    assert response.status_code == 200
    data = response.json()
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) == 10


def test_api_single_field_endpoint(client):
    """Verify that GET /api/v1/fields/PC-001 returns the expected field."""
    response = client.get("/api/v1/fields/PC-001")
    assert response.status_code == 200
    data = response.json()
    assert data["properties"]["id"] == "PC-001"
    assert data["geometry"]["type"] == "Polygon"


def test_api_observations_endpoint(client):
    """Verify that GET /api/v1/observations returns records and filters by field_id."""
    response = client.get("/api/v1/observations?field_id=PC-001")
    assert response.status_code == 200
    data = response.json()
    assert data["field_id"] == "PC-001"
    assert data["count"] > 0
    for obs in data["observations"]:
        assert obs["field_id"] == "PC-001"


def test_api_scenarios_endpoint(client):
    """Verify that GET /api/v1/scenarios returns 3 scenarios."""
    response = client.get("/api/v1/scenarios")
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 3
    assert len(data["scenarios"]) == 3

