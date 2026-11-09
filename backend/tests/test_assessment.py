import pytest
from app.services.stress_engine import stress_engine
from app.services.data_loader import data_loader


def test_assessment_bounds_and_categories():
    """Verify all 10 fields receive valid risk scores in [0, 100] and valid categories."""
    summary = stress_engine.assess_cluster(scenario_id_override="normal_01")
    assert summary.total_fields == 10

    valid_levels = {"Low", "Moderate", "High", "Critical"}
    valid_statuses = {"green", "amber", "red", "blue"}
    valid_actions = {"irrigate_now", "wait", "inspect", "protect_pause"}

    for ass in summary.fields:
        assert 0.0 <= ass.risk_score <= 100.0
        assert 0.0 <= ass.stress_index <= 1.0
        assert ass.risk_level in valid_levels
        assert ass.stress_status in valid_statuses
        assert ass.recommended_action in valid_actions
        assert ass.area_acres > 0.0
        assert len(ass.drivers) == 4
        assert len(ass.freshness_table) > 0


def test_assessment_determinism():
    """Verify that assessing the cluster twice produces identical results."""
    run1 = stress_engine.assess_cluster(scenario_id_override="normal_01")
    run2 = stress_engine.assess_cluster(scenario_id_override="normal_01")

    for f1, f2 in zip(run1.fields, run2.fields):
        assert f1.field_id == f2.field_id
        assert f1.risk_score == f2.risk_score
        assert f1.recommended_action == f2.recommended_action
        assert f1.stress_status == f2.stress_status


def test_stale_satellite_warning_on_pc004():
    """Verify that field PC-004 triggers stale satellite warning and inspection recommendation."""
    fields_fc = data_loader.load_fields()
    pc004_feat = next(f for f in fields_fc.features if f.properties.id == "PC-004")
    all_obs = data_loader.load_observations()
    pc004_obs = [o for o in all_obs if o.field_id == "PC-004"]

    ass = stress_engine.assess_field(pc004_feat, pc004_obs, scenario_id_override="normal_01")
    assert any("stale" in w.lower() for w in ass.warnings)
    assert ass.confidence < 0.80

    stale_entries = [f for f in ass.freshness_table if f.variable in ["ndvi", "ndvi_trend_14d"]]
    assert any(f.is_stale for f in stale_entries)


def test_higher_stress_signals_increase_score():
    """Verify that worsening dryness and temperature increases risk score."""
    fields_fc = data_loader.load_fields()
    pc001_feat = next(f for f in fields_fc.features if f.properties.id == "PC-001")
    all_obs = data_loader.load_observations()
    pc001_obs = [o for o in all_obs if o.field_id == "PC-001"]

    base_ass = stress_engine.assess_field(pc001_feat, pc001_obs, scenario_id_override="normal_01")
    shock_ass = stress_engine.assess_field(pc001_feat, pc001_obs, scenario_id_override="rainfall_deficit_heat_01")

    assert shock_ass.risk_score > base_ass.risk_score
    assert shock_ass.is_simulated is True
    assert shock_ass.active_scenario == "rainfall_deficit_heat_01"

