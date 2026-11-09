from pathlib import Path
import pytest
from app.services.data_loader import data_loader, DataLoadError, DataLoader


def test_load_fields_count_and_structure():
    """Verify that data_loader loads exactly 10 valid field features."""
    fc = data_loader.load_fields()
    assert fc.type == "FeatureCollection"
    assert len(fc.features) == 10

    expected_ids = {f"PC-{i:03d}" for i in range(1, 11)}
    actual_ids = {f.properties.id for f in fc.features}
    assert actual_ids == expected_ids

    for feat in fc.features:
        assert feat.geometry.type == "Polygon"
        assert len(feat.geometry.coordinates[0]) >= 4
        assert feat.properties.area_acres > 0
        assert feat.properties.crop in ["tomato", "chili", "brinjal", "onion", "capsicum"]


def test_load_observations_count_and_variables():
    """Verify that data_loader loads 170 observations with valid variables and freshness."""
    obs = data_loader.load_observations()
    assert len(obs) == 170

    stale_satellite = [o for o in obs if o.source == "synthetic_satellite_replay" and o.quality_flag == "stale"]
    assert len(stale_satellite) > 0
    assert any(o.field_id == "PC-004" for o in stale_satellite)

    for record in obs:
        assert record.field_id.startswith("PC-")
        assert record.value is not None
        assert record.age_days >= 0
        assert record.quality_flag in ["good", "stale"]


def test_load_scenarios_count_and_ids():
    """Verify that data_loader loads exactly 3 deterministic scenarios."""
    scenarios = data_loader.load_scenarios()
    assert len(scenarios) == 3

    scenario_ids = [s.id for s in scenarios]
    assert "normal_01" in scenario_ids
    assert "rainfall_deficit_heat_01" in scenario_ids
    assert "heavy_rain_pause_01" in scenario_ids


def test_missing_fixture_raises_error():
    """Verify that DataLoader raises DataLoadError when a non-existent fixture is requested."""
    loader = DataLoader(data_dir=Path("./non_existent_data_dir_9999"))
    with pytest.raises(DataLoadError):
        loader.load_raw_json("completely_non_existent_fixture.json")
