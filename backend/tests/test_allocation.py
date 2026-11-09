import random
import pytest
from app.services.allocator import allocator
from app.services.scenario_mgr import scenario_manager


def test_hard_budget_conservation_100_random_budgets():
    """Verify strictly: total allocated <= requested budget for 100 randomized budgets."""
    random.seed(42)
    test_budgets = [0.0, 1.0, 10.0, 25.0, 50.0, 75.0, 100.0, 150.0, 250.0, 500.0]
    # Add 90 random values
    test_budgets.extend([round(random.uniform(0.1, 400.0), 1) for _ in range(90)])

    for budget in test_budgets:
        plan = allocator.optimize_plan(budget_m3=budget, scenario_id_override="normal_01")
        assert plan.total_allocated_m3 <= budget, f"Budget violation: allocated {plan.total_allocated_m3} > {budget}"
        assert plan.constraint_checks["budget_conserved"] is True
        assert plan.constraint_checks["all_allocations_non_negative"] is True
        assert plan.constraint_checks["capacities_respected"] is True


def test_zero_budget_allocation():
    """Verify zero budget yields zero allocation for all fields."""
    plan = allocator.optimize_plan(budget_m3=0.0)
    assert plan.total_allocated_m3 == 0.0
    assert plan.unallocated_remainder_m3 == 0.0
    assert plan.budget_utilization_pct == 0.0
    for alloc in plan.allocations:
        assert alloc.allocated_volume_m3 == 0.0


def test_negative_budget_raises_error():
    """Verify negative budget is strictly rejected."""
    with pytest.raises(ValueError):
        allocator.optimize_plan(budget_m3=-10.0)


def test_heavy_rain_paused_fields_receive_zero():
    """Verify that fields in heavy rain receive 0 allocation regardless of budget."""
    plan = allocator.optimize_plan(budget_m3=200.0, scenario_id_override="heavy_rain_pause_01")
    target_allocs = {a.field_id: a for a in plan.allocations}

    assert target_allocs["PC-002"].allocated_volume_m3 == 0.0
    assert target_allocs["PC-005"].allocated_volume_m3 == 0.0
    assert target_allocs["PC-002"].action_recommendation == "protect_pause"
    assert "paused" in target_allocs["PC-002"].reason.lower()


def test_baseline_comparison_ai_vs_equal():
    """Verify that AI prioritization allocates higher share to high-risk fields than equal baseline."""
    # Under rainfall deficit, PC-001, PC-003, PC-009 are high-risk
    plan = allocator.optimize_plan(budget_m3=80.0, scenario_id_override="rainfall_deficit_heat_01")
    comp = plan.baseline_comparison

    assert comp.ai_high_risk_share_pct >= comp.baseline_high_risk_share_pct
    assert comp.ai_high_risk_allocation_m3 >= comp.baseline_high_risk_allocation_m3
    assert plan.total_allocated_m3 <= 80.0
    assert comp.baseline_allocated_total_m3 <= 80.0


def test_allocation_determinism():
    """Verify identical inputs yield identical allocation plans."""
    p1 = allocator.optimize_plan(budget_m3=100.0, scenario_id_override="normal_01")
    p2 = allocator.optimize_plan(budget_m3=100.0, scenario_id_override="normal_01")

    assert p1.total_allocated_m3 == p2.total_allocated_m3
    for a1, a2 in zip(p1.allocations, p2.allocations):
        assert a1.field_id == a2.field_id
        assert a1.allocated_volume_m3 == a2.allocated_volume_m3
        assert a1.priority_rank == a2.priority_rank

