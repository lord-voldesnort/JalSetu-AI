import pytest
from app.services.scenario_mgr import scenario_manager
from app.services.stress_engine import stress_engine
from app.services.data_loader import data_loader


def test_scenario_load_and_definitions():
    """Verify all 3 scenarios exist with proper attributes."""
    scenarios = data_loader.load_scenarios()
    scen_map = {s.id: s for s in scenarios}

    assert "normal_01" in scen_map
    assert "rainfall_deficit_heat_01" in scen_map
    assert "heavy_rain_pause_01" in scen_map

    assert len(scen_map["rainfall_deficit_heat_01"].affected_field_ids) == 3
    assert len(scen_map["heavy_rain_pause_01"].affected_field_ids) == 2


def test_rainfall_deficit_heat_escalates_stress():
    """Verify rainfall deficit + heat shock elevates stress on targeted fields PC-001, PC-003, PC-009."""
    base_summary = stress_engine.assess_cluster("normal_01")
    base_pc001 = next(f for f in base_summary.fields if f.field_id == "PC-001")
    base_pc006 = next(f for f in base_summary.fields if f.field_id == "PC-006")

    scenario_manager.set_active_scenario("rainfall_deficit_heat_01")
    summary = stress_engine.assess_cluster()

    target_map = {f.field_id: f for f in summary.fields}
    for fid in ["PC-001", "PC-003", "PC-009"]:
        ass = target_map[fid]
        assert ass.risk_score >= 75.0
        assert ass.stress_status == "red"
        assert ass.is_simulated is True

    # PC-001 specifically jumped from amber (55.6) to critical red (82.1)
    assert target_map["PC-001"].risk_score > base_pc001.risk_score + 20.0

    # Untargeted field PC-006 should not have simulated values and its score should remain unchanged
    assert target_map["PC-006"].is_simulated is False
    assert target_map["PC-006"].risk_score == base_pc006.risk_score


def test_heavy_rain_triggers_protect_pause():
    """Verify heavy rain scenario triggers protect_pause on PC-002 and PC-005."""
    scenario_manager.set_active_scenario("heavy_rain_pause_01")
    summary = stress_engine.assess_cluster()

    target_map = {f.field_id: f for f in summary.fields}
    for fid in ["PC-002", "PC-005"]:
        ass = target_map[fid]
        assert ass.recommended_action == "protect_pause"
        assert ass.stress_status == "blue"
        assert ass.recommended_volume_m3 == 0.0
        assert any("heavy rain" in w.lower() for w in ass.warnings)


def test_scenario_reset_restores_baseline():
    """Verify that resetting scenario restores exact baseline state."""
    scenario_manager.set_active_scenario("rainfall_deficit_heat_01")
    scenario_manager.reset_to_baseline()

    assert scenario_manager.active_scenario_id == "normal_01"
    summary = stress_engine.assess_cluster()
    assert summary.active_scenario == "normal_01"
    assert summary.is_simulated is False


def test_unknown_scenario_raises_error():
    """Verify setting an unknown scenario ID raises ValueError."""
    with pytest.raises(ValueError):
        scenario_manager.set_active_scenario("INVALID_SCENARIO_ID_123")
