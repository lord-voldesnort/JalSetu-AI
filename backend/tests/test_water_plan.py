"""
Tests for A5: Constrained Water Allocation Optimizer (/water-plan).
"""

import copy
from fastapi.testclient import TestClient
from app.main import app
from app.data.fixtures import DEMO_FIELDS_RAW, DEMO_STATUS_RAW

client = TestClient(app)


def test_successful_water_plan_ai_priority():
    """Verify POST /water-plan returns structured response with dual contract fields."""
    response = client.post("/water-plan", json={"budget_units": 100.0, "method": "ai_priority"})
    assert response.status_code == 200
    data = response.json()

    # Budget & Contract field verification
    assert data["budget_m3"] == 100.0
    assert data["budget_units"] == 100.0
    assert data["constraint_status"] == "valid"
    assert data["total_allocated_m3"] <= 100.0
    assert data["total_allocated_units"] == data["total_allocated_m3"]
    assert data["allocated_units"] == data["total_allocated_m3"]
    assert data["remaining_budget_m3"] == round(100.0 - data["total_allocated_m3"], 2)
    assert data["remaining_budget"] == data["remaining_budget_m3"]
    assert data["method"] == "ai_priority"

    # Verify rows & items
    assert len(data["items"]) == 10
    assert len(data["rows"]) == 10
    assert data["items"] == data["rows"]

    for row in data["rows"]:
        assert 1 <= row["rank"] <= 10
        assert row["field_id"].startswith("PC-")
        assert row["risk_state"] in ("LOW", "MODERATE", "HIGH")
        assert 0.0 <= row["stress_probability"] <= 1.0
        assert row["action"] in ("irrigate", "wait", "inspect", "pause")
        assert row["recommended_action"] == row["action"]
        assert row["allocated_units"] == row["allocated_m3"]
        assert row["estimated_demand"] == row["demand_m3"]
        assert row["unmet_demand"] == round(row["estimated_demand"] - row["allocated_units"], 2)
        assert len(row["reason"]) >= 1

    # Baseline comparison summary
    assert data["baseline_comparison"] is not None
    base = data["baseline_comparison"]
    assert 0.0 <= base["share_to_high_risk_pct"] <= 100.0
    assert 0.0 <= base["ai_share_to_high_risk_pct"] <= 100.0
    assert base["ai_share_to_high_risk_pct"] >= base["share_to_high_risk_pct"]
    assert "Not measured" in base["comparison_note"]


def test_water_plan_api_v1_alias_parity():
    """Verify POST /api/v1/water-plan returns identical output."""
    payload = {"budget_m3": 75.0, "method": "ai_priority"}
    r1 = client.post("/water-plan", json=payload)
    r2 = client.post("/api/v1/water-plan", json=payload)
    assert r1.status_code == 200
    assert r2.status_code == 200
    assert r1.json() == r2.json()


def test_budget_never_exceeded_across_scales():
    """Verify sum of allocations never exceeds budget across 0, small, 100, and abundant budgets."""
    budgets = [0.0, 3.0, 10.0, 50.0, 100.0, 289.0, 500.0]
    for b in budgets:
        res = client.post("/water-plan", json={"budget_units": b})
        assert res.status_code == 200
        data = res.json()
        assert data["total_allocated_units"] <= b + 0.0001
        assert data["remaining_budget"] >= -0.0001
        sum_rows = sum(r["allocated_units"] for r in data["rows"])
        assert sum_rows <= b + 0.0001
        assert round(sum_rows, 2) == round(data["total_allocated_units"], 2)


def test_integer_exactness_for_100_units():
    """Verify 100 unit integer budget allocates exact integer units with sum equal to 100."""
    res = client.post("/water-plan", json={"budget_units": 100.0, "method": "ai_priority"})
    assert res.status_code == 200
    data = res.json()
    assert data["total_allocated_units"] == 100.0
    assert data["remaining_budget"] == 0.0
    for row in data["rows"]:
        assert float(row["allocated_units"]).is_integer()
    assert sum(int(r["allocated_units"]) for r in data["rows"]) == 100


def test_zero_budget_handling():
    """Verify budget=0 returns valid plan with 0 allocation and appropriate reasons."""
    res = client.post("/water-plan", json={"budget_units": 0.0})
    assert res.status_code == 200
    data = res.json()
    assert data["total_allocated_units"] == 0.0
    assert data["remaining_budget"] == 0.0
    assert data["constraint_status"] == "valid"
    assert len(data["unfunded_fields"]) == 10
    for row in data["rows"]:
        assert row["allocated_units"] == 0.0
        assert row["is_funded"] is False


def test_method_differences():
    """Verify ai_priority, equal_share, and proportional produce distinct, method-aligned distributions."""
    budget = 100.0
    res_ai = client.post("/water-plan", json={"budget_units": budget, "method": "ai_priority"}).json()
    res_eq = client.post("/water-plan", json={"budget_units": budget, "method": "equal_share"}).json()
    res_prop = client.post("/water-plan", json={"budget_units": budget, "method": "proportional"}).json()

    allocs_ai = {r["field_id"]: r["allocated_units"] for r in res_ai["rows"]}
    allocs_eq = {r["field_id"]: r["allocated_units"] for r in res_eq["rows"]}
    allocs_prop = {r["field_id"]: r["allocated_units"] for r in res_prop["rows"]}

    # All methods respect budget
    assert sum(allocs_ai.values()) <= budget
    assert sum(allocs_eq.values()) <= budget
    assert sum(allocs_prop.values()) <= budget

    # ai_priority prioritizes high risk over low risk (PC-004 vs PC-001)
    assert allocs_ai["PC-004"] > allocs_ai["PC-001"]

    # equal_share spreads water equally among uncapped fields (not 0)
    funded_eq = [v for k, v in allocs_eq.items() if k != "PC-008" and v > 0]
    assert len(funded_eq) >= 5

    # Distributions must differ
    assert allocs_ai != allocs_eq
    assert allocs_ai != allocs_prop


def test_stale_data_field_routes_to_inspect_with_zero_allocation():
    """Verify field with stale data (PC-008) receives action='inspect' and 0 allocation by default."""
    res = client.post("/water-plan", json={"budget_units": 150.0})
    assert res.status_code == 200
    data = res.json()

    pc008 = next(r for r in data["rows"] if r["field_id"] == "PC-008")
    assert pc008["is_stale"] is True
    assert pc008["action"] == "inspect"
    assert pc008["allocated_units"] == 0.0
    assert pc008["unfunded_reason"] == "data_stale_inspect"
    assert "inspect" in pc008["reason"][0].lower()
    assert "PC-008" in data["inspect_fields"]


def test_stale_data_with_override_allows_allocation():
    """Verify that an explicit min_allocation override for an inspect field is respected."""
    res = client.post(
        "/water-plan",
        json={
            "budget_units": 100.0,
            "constraints": [
                {"field_id": "PC-008", "min_allocation_units": 10.0}
            ],
        },
    )
    assert res.status_code == 200
    data = res.json()
    pc008 = next(r for r in data["rows"] if r["field_id"] == "PC-008")
    assert pc008["allocated_units"] >= 10.0
    assert any("override" in r.lower() for r in pc008["reason"])


def test_exclusion_constraint():
    """Verify excluded field receives 0 allocation, is_excluded=True, and cites reason."""
    res = client.post(
        "/water-plan",
        json={
            "budget_units": 100.0,
            "constraints": [
                {"field_id": "PC-004", "exclude": True}
            ],
        },
    )
    assert res.status_code == 200
    data = res.json()
    pc004 = next(r for r in data["rows"] if r["field_id"] == "PC-004")
    assert pc004["allocated_units"] == 0.0
    assert pc004["is_excluded"] is True
    assert pc004["unfunded_reason"] == "excluded"
    assert "PC-004" in data["excluded_fields"]


def test_paused_field_due_to_heavy_rain():
    """Verify that intense rain scenario pauses irrigation with 0 allocation."""
    res = client.post(
        "/water-plan",
        json={
            "budget_units": 100.0,
            "scenario_id": "intense_rain_01",
        },
    )
    assert res.status_code == 200
    data = res.json()
    # Fields experiencing heavy rain (+40mm) pause irrigation
    assert len(data["paused_fields"]) >= 1
    for fid in data["paused_fields"]:
        row = next(r for r in data["rows"] if r["field_id"] == fid)
        assert row["action"] == "pause"
        assert row["allocated_units"] == 0.0
        assert row["is_paused"] is True
        assert row["unfunded_reason"] == "paused"


def test_scenario_changes_field_rankings():
    """Verify that rainfall_deficit_heat_01 scenario visibly changes priority ranks vs normal_01/baseline."""
    res_base = client.post("/water-plan", json={"budget_units": 100.0, "scenario_id": "normal_01"}).json()
    res_shock = client.post("/water-plan", json={"budget_units": 100.0, "scenario_id": "rainfall_deficit_heat_01"}).json()

    ranks_base = [r["field_id"] for r in res_base["rows"]]
    ranks_shock = [r["field_id"] for r in res_shock["rows"]]

    # Under severe drought + heat, at least two fields change position
    assert ranks_base != ranks_shock
    assert res_shock["scenario_id"] == "rainfall_deficit_heat_01"


def test_infeasible_minimums_handling():
    """Verify that sum(minimums) > budget returns constraint_status='infeasible' without crashing."""
    res = client.post(
        "/water-plan",
        json={
            "budget_units": 20.0,
            "constraints": [
                {"field_id": "PC-001", "min_allocation_units": 15.0},
                {"field_id": "PC-002", "min_allocation_units": 15.0},
            ],
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["constraint_status"] == "infeasible"
    assert data["total_allocated_units"] == 0.0
    assert "Infeasible constraint" in data["planning_disclaimer"]


def test_unknown_field_returns_404():
    """Verify unknown field in field_ids or constraints returns HTTP 404."""
    res1 = client.post("/water-plan", json={"budget_units": 50.0, "field_ids": ["PC-999"]})
    assert res1.status_code == 404
    assert "PC-999" in res1.json()["detail"]

    res2 = client.post(
        "/water-plan",
        json={
            "budget_units": 50.0,
            "constraints": [{"field_id": "UNKNOWN_FIELD", "min_allocation_units": 10.0}],
        },
    )
    assert res2.status_code == 404
    assert "UNKNOWN_FIELD" in res2.json()["detail"]


def test_unknown_scenario_returns_404():
    """Verify unknown scenario_id returns HTTP 404."""
    res = client.post("/water-plan", json={"budget_units": 50.0, "scenario_id": "non_existent_scenario"})
    assert res.status_code == 404
    assert "non_existent_scenario" in res.json()["detail"]


def test_invalid_requests_return_422():
    """Verify invalid payloads (negative budget, min > max, bad horizon) return HTTP 422."""
    invalid_cases = [
        {"budget_units": -10.0},
        {"budget_units": "invalid_number"},
        {"budget_units": 50.0, "method": "invalid_method"},
        {"budget_units": 50.0, "horizon_days": 0},
        {"budget_units": 50.0, "horizon_days": 25},
        {
            "budget_units": 50.0,
            "constraints": [{"field_id": "PC-001", "min_allocation_units": 30.0, "max_allocation_units": 10.0}],
        },
        {},  # missing budget
    ]
    for case in invalid_cases:
        res = client.post("/water-plan", json=case)
        assert res.status_code == 422


def test_deterministic_repeated_requests():
    """Verify repeated identical water-plan requests return byte-identical results."""
    payload = {"budget_units": 100.0, "scenario_id": "rainfall_deficit_heat_01"}
    r1 = client.post("/water-plan", json=payload).json()
    r2 = client.post("/water-plan", json=payload).json()
    assert r1 == r2


def test_fixtures_unmutated_after_water_plan():
    """Verify running water-plans does not mutate underlying fixture dictionaries."""
    fields_before = copy.deepcopy(DEMO_FIELDS_RAW)
    status_before = copy.deepcopy(DEMO_STATUS_RAW)

    client.post("/water-plan", json={"budget_units": 100.0, "scenario_id": "rainfall_deficit_heat_01"})
    client.post("/water-plan", json={"budget_units": 50.0, "method": "equal_share"})

    assert DEMO_FIELDS_RAW == fields_before
    assert DEMO_STATUS_RAW == status_before
